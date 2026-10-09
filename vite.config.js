import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: resolve('../public'),
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    // Separate from electron-builder's default `dist/` output directory.
    outDir: resolve('dist-renderer'),
    emptyOutDir: true,
  },
});
