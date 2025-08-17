import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klavhub',
  appName: 'KlavHub',
  webDir: 'dist',
  server:
    process.env.NODE_ENV === 'development'
      ? { url: 'http://172.20.10.6:5176', cleartext: true }
      : undefined,
  plugins: {
    Keyboard: {
      resize: 'body',
      disableScroll: false,
      style: 'dark',
    },
    Geolocation: {
      androidBackgroundLocation: true,
    },
    FirebaseMessaging: {
      presentationOptions: ['badge'],
    },
  },
};

export default config;
