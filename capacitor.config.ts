import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klavhub.www',
  appName: 'dogs-parks',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'http://172.20.10.6:5173/',
    cleartext: true,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      disableScroll: false,
      style: 'dark',
    },
  },
};

export default config;
