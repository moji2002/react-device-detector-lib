import React, { Fragment } from "react";
import { isAndroid, isDesktop, isIOS, isMobile } from "./helpers";

export const AndroidView = ({ children }) => {
  return isAndroid && <Fragment>{children}</Fragment>;
};

export const IOSView = ({ children }) => {
  return isIOS && <Fragment>{children}</Fragment>;
};

export const MobileView = ({ children }) => {
  return isMobile && <Fragment>{children}</Fragment>;
};

export const DesktopView = ({ children }) => {
  return isDesktop && <Fragment>{children}</Fragment>;
};

const returnLibrary = () => {
  return {
    DesktopView,
    isMobile,
    isIOS,
    isAndroid,
  };
};

export default returnLibrary();
