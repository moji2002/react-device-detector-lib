import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import {
  DeviceProvider,
  DesktopView,
  MobileView,
} from 'react-device-detector';
import { detectDevice } from 'react-device-detector/server';

test('renders a server-seeded mobile first paint', () => {
  const device = detectDevice({
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile Safari/537.36',
    maxTouchPoints: 5,
  });
  const html = renderToString(
    h(
      DeviceProvider,
      { value: device },
      h(MobileView, null, 'PHONE-NAV'),
      h(DesktopView, null, 'DESKTOP-NAV'),
    ),
  );

  assert.match(html, /PHONE-NAV/);
  assert.doesNotMatch(html, /DESKTOP-NAV/);
});

test('does not guess before unseeded detection', () => {
  assert.equal(renderToString(h(MobileView, null, 'PHONE-NAV')), '');
  assert.equal(renderToString(h(DesktopView, null, 'DESKTOP-NAV')), '');
});
