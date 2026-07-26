/**
 * Pure detection. No React, no DOM access, no "use client".
 *
 * Kept in its own module so server code can import it without pulling the
 * client-component boundary along with it.
 */

export interface DeviceInfo {
  /** Phone or tablet. */
  isMobile: boolean;
  /** Neither phone nor tablet. */
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  /** iPad or Android tablet. */
  isTablet: boolean;
  /** True until detection has run (server render and first client render). */
  isDetecting: boolean;
}

/**
 * What the server and the first client render both see.
 *
 * `isDetecting: true` is the honest state: during server rendering there is no
 * device to inspect. Treating "unknown" as "desktop" is precisely what made v1
 * wrong — it sent desktop markup to phone users.
 */
export const UNKNOWN_DEVICE: DeviceInfo = {
  isMobile: false,
  isDesktop: false,
  isIOS: false,
  isAndroid: false,
  isTablet: false,
  isDetecting: true,
};

export interface DetectionInput {
  userAgent: string;
  /** Touch points reported by the platform; iPadOS 13+ reports > 1. */
  maxTouchPoints: number;
}

/**
 * Detect device class from a user agent and touch-point count.
 *
 * Pure and synchronous, so it works anywhere — including a server request
 * handler, where `navigator` does not exist.
 */
export function detectDevice(input: DetectionInput): DeviceInfo {
  const ua = input.userAgent || '';
  const touchPoints = input.maxTouchPoints || 0;

  const isAndroid = /android/i.test(ua);
  const androidTablet = isAndroid && !/mobile/i.test(ua);

  const iPhoneOrIPod = /iPhone|iPod/i.test(ua);
  const legacyIPad = /iPad/i.test(ua);

  // iPadOS 13+ ships a desktop-class Safari that identifies as "Macintosh".
  // The only reliable tell is touch points: a Mac reports 0, an iPad reports 5.
  // v1's /iPad|iPhone|iPod/ test classified every modern iPad as a desktop.
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
export function detectFromEnvironment(): DeviceInfo | null {
  if (typeof navigator === 'undefined') return null;
  return detectDevice({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  });
}
