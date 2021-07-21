'use strict';

var React = require('react');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

var getOS = function getOS() {
  if (typeof window === "undefined") return;
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS";
  }
};

var isIOS = getOS() === "iOS";
var isAndroid = getOS() === "Android";
var isMobile = isIOS || isAndroid;
var isDesktop = !isMobile; // console.log({ isMobile, isIOS, isAndroid, isDesktop });
// console.log({ os: getOS() });

var AndroidView = function AndroidView(_ref) {
  var children = _ref.children;
  return isAndroid && /*#__PURE__*/React__default['default'].createElement(React.Fragment, null, children);
};

var IOSView = function IOSView(_ref2) {
  var children = _ref2.children;
  return isIOS && /*#__PURE__*/React__default['default'].createElement(React.Fragment, null, children);
};

var MobileView = function MobileView(_ref3) {
  var children = _ref3.children;
  return isMobile && /*#__PURE__*/React__default['default'].createElement(React.Fragment, null, children);
};

var DesktopView = function DesktopView(_ref4) {
  var children = _ref4.children;
  return isDesktop && /*#__PURE__*/React__default['default'].createElement(React.Fragment, null, children);
};

var returnLibrary = function returnLibrary() {
  return {
    DesktopView: DesktopView,
    AndroidView: AndroidView,
    IOSView: IOSView,
    MobileView: MobileView,
    isMobile: isMobile,
    isIOS: isIOS,
    isAndroid: isAndroid,
    isDesktop: isDesktop
  };
};

var index = returnLibrary();

module.exports = index;
