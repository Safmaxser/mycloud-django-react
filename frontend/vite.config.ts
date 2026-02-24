import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws/': {
        target: 'http://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
      '/admin/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/static/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/protected_media/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
