import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klavhub',
  appName: 'KlavHub',
  webDir: 'dist',
  server:
    process.env.NODE_ENV === 'development'
      ? { url: 'http://10.100.102.60:5173', cleartext: true }
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
