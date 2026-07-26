import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDevice } from '../dist/index.js';

/** Real user-agent strings. */
const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ipadLegacy:
    'Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ presents a desktop-class Safari and identifies as Macintosh.
  ipadModern:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  mac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  androidPhone:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

test('iPhone is iOS + mobile, not tablet', () => {
  const d = detectDevice({ userAgent: UA.iphone, maxTouchPoints: 5 });
  assert.equal(d.isIOS, true);
  assert.equal(d.isMobile, true);
  assert.equal(d.isTablet, false);
  assert.equal(d.isDesktop, false);
  assert.equal(d.isAndroid, false);
});

test('legacy iPad is iOS + tablet + mobile', () => {
  const d = detectDevice({ userAgent: UA.ipadLegacy, maxTouchPoints: 5 });
  assert.equal(d.isIOS, true);
  assert.equal(d.isTablet, true);
  assert.equal(d.isMobile, true);
});

test('iPadOS 13+ is detected despite the Macintosh user agent', () => {
  // v1 classified this as a desktop: the UA contains no "iPad" token, and the
  // only signal separating it from a Mac is maxTouchPoints.
  const d = detectDevice({ userAgent: UA.ipadModern, maxTouchPoints: 5 });
  assert.equal(d.isIOS, true, 'modern iPad must be iOS');
  assert.equal(d.isTablet, true, 'modern iPad must be a tablet');
  assert.equal(d.isMobile, true);
  assert.equal(d.isDesktop, false);
});

test('a real Mac is NOT mistaken for an iPad', () => {
  // Same UA family as the iPad above; only the touch points differ. Getting
  // this wrong in the other direction would be just as bad.
  const d = detectDevice({ userAgent: UA.mac, maxTouchPoints: 0 });
  assert.equal(d.isDesktop, true);
  assert.equal(d.isIOS, false);
  assert.equal(d.isTablet, false);
});

test('a touchscreen Mac is still a desktop', () => {
  const d = detectDevice({ userAgent: UA.mac, maxTouchPoints: 0 });
  assert.equal(d.isDesktop, true);
});

test('Android phone is android + mobile, not tablet', () => {
  const d = detectDevice({ userAgent: UA.androidPhone, maxTouchPoints: 5 });
  assert.equal(d.isAndroid, true);
  assert.equal(d.isMobile, true);
  assert.equal(d.isTablet, false, 'UA contains "Mobile", so it is a phone');
});

test('Android tablet is android + tablet', () => {
  const d = detectDevice({ userAgent: UA.androidTablet, maxTouchPoints: 5 });
  assert.equal(d.isAndroid, true);
  assert.equal(d.isTablet, true, 'no "Mobile" token means tablet');
  assert.equal(d.isMobile, true);
});

test('Windows desktop', () => {
  const d = detectDevice({ userAgent: UA.windows, maxTouchPoints: 0 });
  assert.equal(d.isDesktop, true);
  assert.equal(d.isMobile, false);
  assert.equal(d.isIOS, false);
  assert.equal(d.isAndroid, false);
});

test('isMobile and isDesktop are always exclusive', () => {
  for (const [name, ua] of Object.entries(UA)) {
    for (const touch of [0, 5]) {
      const d = detectDevice({ userAgent: ua, maxTouchPoints: touch });
      assert.notEqual(d.isMobile, d.isDesktop, `${name} @ ${touch} touch points`);
    }
  }
});

test('detection never throws on hostile or empty input', () => {
  const inputs = [
    { userAgent: '', maxTouchPoints: 0 },
    { userAgent: 'x'.repeat(50000), maxTouchPoints: 0 },
    { userAgent: '<script>alert(1)</script>', maxTouchPoints: 99 },
    { userAgent: '💥🎉', maxTouchPoints: -1 },
  ];
  for (const input of inputs) {
    const d = detectDevice(input);
    assert.equal(typeof d.isMobile, 'boolean');
    assert.equal(d.isDetecting, false);
  }
});

test('detectDevice is pure — same input, same output', () => {
  const input = { userAgent: UA.ipadModern, maxTouchPoints: 5 };
  const a = detectDevice(input);
  const b = detectDevice(input);
  assert.deepEqual(a, b);
});

test('detectDevice works with no DOM present (server-side)', () => {
  // The whole point of exporting it: this file runs in plain Node with no
  // window or navigator, which is where v1's module-level flags broke.
  assert.equal(typeof globalThis.window, 'undefined');
  const d = detectDevice({ userAgent: UA.iphone, maxTouchPoints: 5 });
  assert.equal(d.isMobile, true, 'server-side detection must still work');
});
