import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klavhub.www',
  appName: 'dogs-parks',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'http://10.100.102.53:5173/',
    cleartext: true,
  },
};

export default config;
