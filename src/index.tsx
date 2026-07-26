'use client';

/**
 * react-device-detector — render React components based on device type.
 *
 * Zero runtime dependencies. React 17, 18 and 19.
 *
 * This entry is a CLIENT module: it uses hooks, so in the Next.js App Router it
 * must carry the "use client" directive or importing it from a Server Component
 * fails. The pure detection function lives in `react-device-detector/server`
 * precisely so server code can use it without crossing this boundary.
 *
 * ## Why v2 changed
 *
 * v1 evaluated device flags ONCE at module load:
 *
 *     export const isIOS = getOS() === "iOS";   // v1, at import time
 *
 * During server rendering `window` is undefined, so every flag resolved to
 * "desktop" — the server sent desktop markup to everyone, phone users included,
 * and the client then computed something different. A hydration mismatch on
 * every SSR page. v2 detects inside a hook, so both renders agree.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  detectFromEnvironment,
  UNKNOWN_DEVICE,
  type DeviceInfo,
} from './detect';

export type { DeviceInfo, DetectionInput } from './detect';
export { detectDevice, UNKNOWN_DEVICE } from './detect';

/* ------------------------------------------------------------------------- *
 * Provider (optional)
 * ------------------------------------------------------------------------- */

const DeviceContext = createContext<DeviceInfo | null>(null);

export interface DeviceProviderProps {
  children?: ReactNode;
  /**
   * A value computed on the server with `detectDevice()` from the request
   * user-agent. Supplying it makes the FIRST paint correct instead of waiting
   * for hydration.
   *
   * `DeviceInfo` is a plain object, so it passes cleanly from a Server
   * Component to this client component as a prop.
   */
  value?: DeviceInfo;
}

/**
 * Optional. Seeds device info so the first render is already accurate.
 *
 * Without it, `useDevice()` self-detects after mount — correct, but one render
 * late. With it, server and client agree immediately.
 */
export function DeviceProvider({ children, value }: DeviceProviderProps) {
  const detected = useDeviceInternal(value);
  return <DeviceContext.Provider value={detected}>{children}</DeviceContext.Provider>;
}

/* ------------------------------------------------------------------------- *
 * Hook
 * ------------------------------------------------------------------------- */

let injected: DeviceInfo | null = null;

/**
 * Seed device info for code that renders entirely on the client.
 *
 * @deprecated Prefer `<DeviceProvider value={…}>`. This sets a module-level
 * variable, which works within a single client bundle but cannot cross the
 * React Server Component boundary — a Server Component calling it would be
 * mutating a different module instance than the one your components read.
 * The provider takes a plain object as a prop, which does cross that boundary.
 */
export function setServerDevice(info: DeviceInfo | null): void {
  injected = info;
}

function useDeviceInternal(seed?: DeviceInfo): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => seed ?? injected ?? UNKNOWN_DEVICE);

  useEffect(() => {
    const detected = detectFromEnvironment();
    if (detected) setInfo(detected);
  }, []);

  return info;
}

/**
 * Current device information.
 *
 * Returns `isDetecting: true` on the server and during the first client render,
 * then the real value. Rendering the same thing on both sides is what prevents
 * the hydration mismatch v1 produced.
 */
export function useDevice(): DeviceInfo {
  const fromContext = useContext(DeviceContext);
  const standalone = useDeviceInternal();
  // A provider higher in the tree has already detected; reuse it rather than
  // running a second effect per consumer.
  return fromContext ?? standalone;
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
    // Returns null rather than `false` — v1 returned the boolean itself, which
    // React tolerates but types awkwardly.
    return match(info) ? <>{children}</> : null;
  };
}

export const MobileView = makeView((d) => d.isMobile);
export const DesktopView = makeView((d) => d.isDesktop);
export const AndroidView = makeView((d) => d.isAndroid);
export const IOSView = makeView((d) => d.isIOS);
export const TabletView = makeView((d) => d.isTablet);

const api = {
  MobileView,
  DesktopView,
  AndroidView,
  IOSView,
  TabletView,
  DeviceProvider,
  useDevice,
  setServerDevice,
};

export default api;
