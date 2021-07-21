const getOS = () => {
  if (typeof window === "undefined") return;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "iOS";
  }
};

export const isIOS = getOS() === "iOS";
export const isAndroid = getOS() === "Android";
export const isMobile = isIOS || isAndroid;
export const isDesktop = !isMobile;

// console.log({ isMobile, isIOS, isAndroid, isDesktop });
// console.log({ os: getOS() });
