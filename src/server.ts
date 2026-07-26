/**
 * Server-safe entry: pure detection with no React and no "use client".
 *
 * Import this from a Server Component, a route handler, or middleware to
 * compute device info from the request user-agent, then hand the result to
 * <DeviceProvider value={...}> for an accurate first paint.
 */
export {
  detectDevice,
  UNKNOWN_DEVICE,
  type DeviceInfo,
  type DetectionInput,
} from './detect';
