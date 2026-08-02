# react-device-detector

Render React components based on device type. **SSR-safe**, correct **iPadOS**
detection, **zero runtime dependencies**, TypeScript types included.

Works with React 17, 18 and 19.

```bash
npm install react-device-detector
```

## Usage

```tsx
import { MobileView, DesktopView, IOSView, AndroidView, TabletView } from "react-device-detector";

const MyComponent = () => (
  <>
    <AndroidView>this will only render on android devices</AndroidView>
    <IOSView>this will only render on iOS devices</IOSView>
    <MobileView>this will only render on mobile</MobileView>
    <TabletView>this will only render on tablets</TabletView>
    <DesktopView>this will only render on desktop</DesktopView>
  </>
);
```

Or use the hook directly:

```tsx
import { useDevice } from "react-device-detector";

const MyComponent = () => {
  const { isMobile, isTablet, isDetecting } = useDevice();
  if (isDetecting) return <Skeleton />;
  return isMobile ? <MobileNav /> : <DesktopNav />;
};
```

## Next.js (App Router)

The main entry is a **client module** — it uses hooks, so it ships the
`"use client"` directive. You can import the components straight into a Server
Component and they work:

```tsx
// app/page.tsx — a Server Component
import { MobileView, DesktopView } from "react-device-detector";

export default function Page() {
  return (
    <>
      <MobileView>phone nav</MobileView>
      <DesktopView>desktop nav</DesktopView>
    </>
  );
}
```

For a **correct first paint** — no waiting for hydration — detect on the server
from the request user-agent and pass the result down. The pure detector lives at
`react-device-detector/server`, which carries no `"use client"`, so it is safe to
call from server code:

```tsx
// app/layout.tsx
import { headers } from "next/headers";
import { detectDevice } from "react-device-detector/server";
import { DeviceProvider } from "react-device-detector";

export default async function Layout({ children }) {
  const ua = (await headers()).get("user-agent") ?? "";
  const device = detectDevice({ userAgent: ua, maxTouchPoints: 0 });

  return (
    <html>
      <body>
        <DeviceProvider value={device}>{children}</DeviceProvider>
      </body>
    </html>
  );
}
```

`DeviceInfo` is a plain object of booleans, so it serializes cleanly across the
Server/Client Component boundary.

> Note: header-based detection cannot see `maxTouchPoints`, so an iPadOS 13+
> device looks like a Mac to the server. The client corrects it immediately
> after hydration. If iPad accuracy on first paint matters, use
> `<DesktopView renderWhileDetecting={false}>` and let the client decide.

## Testing in your project

Test server detection through the pure `/server` entry so your test does not
need a DOM:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { detectDevice } from "react-device-detector/server";

test("detects an iPhone request", () => {
  const device = detectDevice({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
      "AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
    maxTouchPoints: 5,
  });

  assert.equal(device.isIOS, true);
  assert.equal(device.isMobile, true);
  assert.equal(device.isTablet, false);
  assert.equal(device.isDetecting, false);
});
```

For SSR behavior, render a server-derived value through `DeviceProvider` and
assert the first HTML response. Also pin the unseeded behavior: it renders no
device-specific guess while detection is pending.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { DeviceProvider, DesktopView, MobileView } from "react-device-detector";
import { detectDevice } from "react-device-detector/server";

test("renders a server-seeded mobile first paint", () => {
  const device = detectDevice({
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari/537.36",
    maxTouchPoints: 5,
  });
  const html = renderToString(
    h(DeviceProvider, { value: device },
      h(MobileView, null, "PHONE-NAV"),
      h(DesktopView, null, "DESKTOP-NAV")),
  );

  assert.match(html, /PHONE-NAV/);
  assert.doesNotMatch(html, /DESKTOP-NAV/);
});

test("does not guess before unseeded detection", () => {
  assert.equal(renderToString(h(MobileView, null, "PHONE-NAV")), "");
});
```

Run the repository copies with `pnpm test:example`. These tests exercise the
published entry points and React server rendering. In a Next.js application,
keep a real `next build` in CI as the authoritative React Server Component
boundary check.

## ⚠️ Upgrading from v1

v1 had two bugs serious enough to require a breaking change.

### 1. Every SSR page had a hydration mismatch

v1 computed its flags **once, at module load**:

```js
export const isIOS = getOS() === "iOS"; // v1 — evaluated at import time
```

On the server `window` is undefined, so every flag resolved to "desktop". The
server sent desktop markup to *everyone*, including phone users, and the client
then computed something different — a React hydration mismatch on every
server-rendered page. The values were also frozen for the process lifetime and
could never change.

v2 detects inside a hook, so the server render and the first client render agree
by construction. There is a test that renders through `react-dom/server` and
asserts the output is empty.

### 2. Modern iPads were detected as desktops

iPadOS 13+ ships a desktop-class Safari that identifies as `Macintosh`. v1's
`/iPad|iPhone|iPod/` test never matched it, so **every current iPad was
classified as a desktop**. v2 disambiguates with `navigator.maxTouchPoints` — a
Mac reports 0, an iPad reports 5.

### API changes

| v1 | v2 |
|----|-----|
| `import { isMobile } from "react-device-detector"` | `const { isMobile } = useDevice()` |
| `isIOS`, `isAndroid`, `isDesktop` constants | fields on `useDevice()` |
| `<MobileView>` etc. | unchanged |
| — | `<TabletView>`, `isTablet` added |
| — | `detectDevice()`, `setServerDevice()` added |

The module-level constants were **removed, not deprecated**. They cannot be made
SSR-safe: their value is decided before React renders anything. Keeping them
would have preserved the bug behind a compatible-looking name.

Client-only code that wants the old shape:

```tsx
import { detectDevice } from "react-device-detector";

const { isMobile } = detectDevice({
  userAgent: navigator.userAgent,
  maxTouchPoints: navigator.maxTouchPoints,
});
```

v1 also declared `react-scripts`, `web-vitals` and three `@testing-library`
packages as **peer dependencies** — build and test tooling that leaked in from
the Create React App scaffold, and which every consumer was asked to install.
v2's only peer is `react`.

## The detection gap, stated plainly

**A component cannot know the device during server rendering.** There is no
device to inspect, only an HTTP request. Views therefore render `null` until
detection completes — which is exactly why v1's flash of wrong-device content is
gone.

Two ways to handle that window:

```tsx
// Render children during detection instead of nothing
<DesktopView renderWhileDetecting>…</DesktopView>
```

```tsx
// Or detect on the server from the request UA, for a correct first paint
import { detectDevice, setServerDevice } from "react-device-detector";

setServerDevice(
  detectDevice({
    userAgent: req.headers["user-agent"] ?? "",
    maxTouchPoints: 0,
  })
);
```

`useDevice()` also exposes `isDetecting`, so you can render a skeleton rather
than guess.

## Accuracy

User-agent detection is a heuristic, not a fact. It is defeated by UA spoofing,
by browsers that freeze or reduce their UA string, and by devices that do not
exist yet. Where a CSS media query (`pointer: coarse`, `min-width`) can answer
your question, prefer it — it describes the actual viewport instead of guessing
from a string.

This library is the right tool when you need to branch in JavaScript on device
*class* and accept a heuristic's error rate.

## API

| Export | Type | Notes |
|---|---|---|
| `MobileView` `DesktopView` `IOSView` `AndroidView` `TabletView` | components | accept `renderWhileDetecting` |
| `useDevice()` | hook | `{ isMobile, isDesktop, isIOS, isAndroid, isTablet, isDetecting }` |
| `detectDevice({ userAgent, maxTouchPoints })` | function | pure; usable on the server |
| `setServerDevice(info)` | function | seed the value for a correct first paint |

## Contributing

If you have any new suggestions, new features, bug fixes, etc. please contribute
by raising a pull request.

## License

MIT
