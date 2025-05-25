import { Capacitor } from '@capacitor/core';

export const isMobile = () => Capacitor.isNativePlatform();

export const isIos = () => Capacitor.getPlatform() === 'ios';
