import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import { createElement as h } from 'react';
import { MobileView, DesktopView, IOSView, AndroidView, TabletView } from '../dist/index.js';

/**
 * The bug this package existed with until v2:
 *
 * v1 computed `isDesktop` at module load. With no `window` on the server it was
 * always true, so the server emitted DesktopView's children for every visitor —
 * then the client computed something else and React reported a hydration
 * mismatch. Worse, a phone user got desktop markup in the initial HTML.
 *
 * v2 renders nothing until detection completes, so server output and the first
 * client render agree by construction.
 */

test('server render emits nothing for any view (no hydration mismatch)', () => {
  for (const [name, View] of Object.entries({ MobileView, DesktopView, IOSView, AndroidView, TabletView })) {
    const html = renderToString(h(View, null, 'CONTENT'));
    assert.equal(html, '', `${name} must render nothing on the server, got: ${JSON.stringify(html)}`);
  }
});

test('DesktopView does NOT leak desktop markup to a phone on first paint', () => {
  // This is the concrete v1 regression: a phone visitor received desktop HTML.
  const html = renderToString(h(DesktopView, null, 'DESKTOP-ONLY-NAV'));
  assert.ok(!html.includes('DESKTOP-ONLY-NAV'), 'desktop content must not be server-rendered blindly');
});

test('renderWhileDetecting opts in to rendering during detection', () => {
  const html = renderToString(h(DesktopView, { renderWhileDetecting: true }, 'FALLBACK'));
  assert.ok(html.includes('FALLBACK'), 'opt-in must render children while detecting');
});

test('server rendering never throws without a DOM', () => {
  assert.equal(typeof globalThis.window, 'undefined');
  for (const View of [MobileView, DesktopView, IOSView, AndroidView, TabletView]) {
    assert.doesNotThrow(() => renderToString(h(View, null, 'x')));
  }
});

test('views accept no children without throwing', () => {
  for (const View of [MobileView, DesktopView, IOSView, AndroidView, TabletView]) {
    assert.doesNotThrow(() => renderToString(h(View)));
  }
});
