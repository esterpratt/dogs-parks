import { Capacitor } from '@capacitor/core';

export const isMobile = () => Capacitor.isNativePlatform();

export const isIos = () => Capacitor.getPlatform() === 'ios';

export const isIosFromBrowser = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};