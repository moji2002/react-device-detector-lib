import React, { Fragment } from "react";
import { isAndroid, isDesktop, isIOS, isMobile } from "./helpers";

const AndroidView = ({ children }) => {
  return isAndroid && <Fragment>{children}</Fragment>;
};

const IOSView = ({ children }) => {
  return isIOS && <Fragment>{children}</Fragment>;
};

const MobileView = ({ children }) => {
  return isMobile && <Fragment>{children}</Fragment>;
};

const DesktopView = ({ children }) => {
  return isDesktop && <Fragment>{children}</Fragment>;
};

const returnLibrary = () => ({
  DesktopView,
  AndroidView,
  IOSView,
  MobileView,
  isMobile,
  isIOS,
  isAndroid,
  isDesktop,
});

export default returnLibrary();
