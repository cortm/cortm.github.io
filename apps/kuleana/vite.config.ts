import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/apps/kuleana/dist/',
  build: {
    // esbuild 0.28+ no longer downlevels destructuring for legacy browsers.
    target: 'es2020',
  },
});
