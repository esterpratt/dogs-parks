import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [react(), vercel()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  vercel: {
    // optional configuration options, see "Advanced usage" below for details
  },
});
