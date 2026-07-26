import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderToString } from 'react-dom/server';
import { createElement as h } from 'react';

/**
 * Next.js App Router boundary.
 *
 * The main entry uses hooks, so it must carry "use client" or importing it from
 * a Server Component throws. But `detectDevice` is pure and is meant to run on
 * the server — if it lived behind the same directive, a Server Component
 * importing it would receive a client reference instead of the function.
 *
 * Hence two entries. These tests pin both halves of that contract.
 */

test('client entry declares "use client" in both formats', () => {
  for (const file of ['dist/index.js', 'dist/index.cjs']) {
    const first = fs.readFileSync(file, 'utf8').split('\n')[0].trim();
    assert.match(first, /^["']use client["'];?$/, `${file} must start with the directive, got: ${first}`);
  }
});

test('server entry does NOT declare "use client"', () => {
  // If this ever regresses, server-side detection silently breaks in Next.js.
  for (const file of ['dist/server.js', 'dist/server.cjs']) {
    const body = fs.readFileSync(file, 'utf8');
    assert.ok(!body.includes('use client'), `${file} must stay server-usable`);
  }
});

test('server entry exports pure detection and no React', async () => {
  const mod = await import('../dist/server.js');
  assert.equal(typeof mod.detectDevice, 'function');
  assert.equal(typeof mod.UNKNOWN_DEVICE, 'object');
  // No component or hook should leak into the server surface.
  assert.equal(mod.MobileView, undefined);
  assert.equal(mod.useDevice, undefined);
  assert.equal(mod.DeviceProvider, undefined);
});

test('server entry detects a phone with no DOM present', async () => {
  const { detectDevice } = await import('../dist/server.js');
  assert.equal(typeof globalThis.window, 'undefined');
  const d = detectDevice({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    maxTouchPoints: 5,
  });
  assert.equal(d.isMobile, true);
  assert.equal(d.isDetecting, false);
});

test('DeviceProvider seeds a correct first paint from a server value', async () => {
  const { detectDevice } = await import('../dist/server.js');
  const { DeviceProvider, MobileView, DesktopView } = await import('../dist/index.js');

  // What a Server Component would compute from the request and pass down.
  const info = detectDevice({
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari/537.36',
    maxTouchPoints: 5,
  });

  const html = renderToString(
    h(DeviceProvider, { value: info }, h(MobileView, null, 'PHONE-NAV'), h(DesktopView, null, 'DESKTOP-NAV')),
  );

  assert.ok(html.includes('PHONE-NAV'), 'seeded provider must render phone content on first paint');
  assert.ok(!html.includes('DESKTOP-NAV'), 'desktop content must not appear for a phone');
});

test('DeviceInfo is a plain serializable object (crosses the RSC boundary)', async () => {
  const { detectDevice } = await import('../dist/server.js');
  const info = detectDevice({ userAgent: 'x', maxTouchPoints: 0 });
  // Server -> Client props must survive serialization.
  assert.deepEqual(JSON.parse(JSON.stringify(info)), info);
  for (const value of Object.values(info)) assert.equal(typeof value, 'boolean');
});
