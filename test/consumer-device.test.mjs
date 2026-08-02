import test from 'node:test';
import assert from 'node:assert/strict';
import { detectDevice } from 'react-device-detector/server';

test('detects an iPhone request through the server entry', () => {
  const device = detectDevice({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    maxTouchPoints: 5,
  });

  assert.equal(device.isIOS, true);
  assert.equal(device.isMobile, true);
  assert.equal(device.isTablet, false);
  assert.equal(device.isDesktop, false);
  assert.equal(device.isDetecting, false);
});
