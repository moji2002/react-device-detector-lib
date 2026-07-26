/**
 * react-device-detector — render React components based on device type.
 *
 * Zero runtime dependencies. Works with React 17, 18 and 19.
 *
 * ## Why v2 changed
 *
 * v1 evaluated device flags ONCE at module load:
 *
 *     export const isIOS = getOS() === "iOS";   // v1, at import time
 *
 * During server rendering `window` is undefined, so every flag resolved to
 * "desktop" on the server and could resolve differently on the client — a React
 * hydration mismatch on every SSR page, silently. The values were also frozen
 * for the process lifetime and could never respond to anything.
 *
 * v2 detects inside a hook, so the server render and the first client render
 * always agree, and the real value lands right after hydration.
 */

import { useEffect, useState, type ReactNode } from 'react';

/* ------------------------------------------------------------------------- *
 * Detection
 * ------------------------------------------------------------------------- */

export interface DeviceInfo {
  /** Phone or tablet. */
  isMobile: boolean;
  /** Neither phone nor tablet. */
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  /** iPad, Android tablet, or another touch device with a large viewport. */
  isTablet: boolean;
  /** True until detection has run (server render and first client render). */
  isDetecting: boolean;
}

/**
 * What the server and the first client render both see.
 *
 * `isDetecting: true` is the honest state: on the server there is no device to
 * inspect. Treating "unknown" as "desktop" is what made v1 wrong — consumers
 * who care should branch on `isDetecting` rather than assume.
 */
const UNKNOWN: DeviceInfo = {
  isMobile: false,
  isDesktop: false,
  isIOS: false,
  isAndroid: false,
  isTablet: false,
  isDetecting: true,
};

interface DetectionInput {
  userAgent: string;
  /** Touch points reported by the platform; iPadOS 13+ reports > 1. */
  maxTouchPoints: number;
  /** Present so a caller can pass a platform string from a server request. */
  platform?: string;
}

/**
 * Pure detection. Exported so server code can compute a value from the request
 * user-agent and hand it to `DeviceProvider`, which is the only way to get an
 * accurate first paint under SSR.
 */
export function detectDevice(input: DetectionInput): DeviceInfo {
  const ua = input.userAgent || '';
  const touchPoints = input.maxTouchPoints || 0;

  const isAndroid = /android/i.test(ua);
  const androidTablet = isAndroid && !/mobile/i.test(ua);

  const iPhoneOrIPod = /iPhone|iPod/i.test(ua);
  const legacyIPad = /iPad/i.test(ua);

  // iPadOS 13+ ships a desktop-class Safari that identifies as "Macintosh".
  // The only reliable tell is that a Mac reports 0 touch points while an iPad
  // reports 5. v1's /iPad|iPhone|iPod/ test classified every modern iPad as a
  // desktop.
  const modernIPad = /Macintosh/i.test(ua) && touchPoints > 1;

  const isIPad = legacyIPad || modernIPad;
  const isIOS = iPhoneOrIPod || isIPad;
  const isTablet = isIPad || androidTablet;
  const isMobile = isIOS || isAndroid;

  return {
    isMobile,
    isDesktop: !isMobile,
    isIOS,
    isAndroid,
    isTablet,
    isDetecting: false,
  };
}

/** Read the current environment. Returns null when there is no DOM. */
function detectFromEnvironment(): DeviceInfo | null {
  if (typeof navigator === 'undefined') return null;
  return detectDevice({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  });
}

/* ------------------------------------------------------------------------- *
 * Hook
 * ------------------------------------------------------------------------- */

let injected: DeviceInfo | null = null;

/**
 * Supply a value computed on the server (see `detectDevice`) so the first paint
 * is already correct instead of waiting for hydration.
 *
 * Call once, before render — typically at the top of a server entry file.
 */
export function setServerDevice(info: DeviceInfo | null): void {
  injected = info;
}

/**
 * Current device information.
 *
 * Returns `isDetecting: true` on the server and during the first client render,
 * then the real value. That ordering is deliberate: rendering the same thing on
 * both sides is what prevents the hydration mismatch v1 produced.
 */
export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => injected ?? UNKNOWN);

  useEffect(() => {
    const detected = detectFromEnvironment();
    if (detected) setInfo(detected);
  }, []);

  return info;
}

/* ------------------------------------------------------------------------- *
 * Components
 * ------------------------------------------------------------------------- */

export interface ViewProps {
  children?: ReactNode;
  /**
   * Render children during detection (server render + first client render).
   * Default false, which avoids both a hydration mismatch and a flash of
   * content meant for a different device.
   */
  renderWhileDetecting?: boolean;
}

function makeView(match: (info: DeviceInfo) => boolean) {
  return function View({ children, renderWhileDetecting = false }: ViewProps) {
    const info = useDevice();
    if (info.isDetecting) return renderWhileDetecting ? <>{children}</> : null;
    // Returning null rather than `false` — v1 returned the boolean itself,
    // which React tolerates but types awkwardly.
    return match(info) ? <>{children}</> : null;
  };
}

export const MobileView = makeView((d) => d.isMobile);
export const DesktopView = makeView((d) => d.isDesktop);
export const AndroidView = makeView((d) => d.isAndroid);
export const IOSView = makeView((d) => d.isIOS);
export const TabletView = makeView((d) => d.isTablet);

/* ------------------------------------------------------------------------- *
 * Default export (v1 API shape)
 * ------------------------------------------------------------------------- */

const api = {
  MobileView,
  DesktopView,
  AndroidView,
  IOSView,
  TabletView,
  useDevice,
  detectDevice,
  setServerDevice,
};

export default api;
