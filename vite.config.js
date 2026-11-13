import { defineConfig } from 'vite';

export default defineConfig({
  base: '/magic-3d-mailbox/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
