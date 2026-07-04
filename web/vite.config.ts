import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  root: '.',
  envDir: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  clearScreen: false,
  optimizeDeps: {
    // mxgraph is UMD — force pre-bundling so Vite handles it properly
    include: ['mxgraph'],
  },
  define: {
    // mxgraph UMD expects these globals in browser context
    global: 'globalThis',
  },
});
