import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klavhub.www',
  appName: 'dogs-parks',
  webDir: 'dist',
  server: {
    url: 'http://10.100.102.53:5173/',
    cleartext: true,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      disableScroll: false,
      style: 'dark',
    },
    Geolocation: {
      androidBackgroundLocation: true,
    },
  },
};

export default config;
