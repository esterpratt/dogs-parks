import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    // Local Supabase integration tests own their Docker lifecycle through test:supabase.
    exclude: ['tests/e2e/**/*', 'supabase/tests/local/**/*', 'node_modules', 'dist'],
  },
});
