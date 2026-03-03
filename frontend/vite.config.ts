import { defineConfig } from 'vitest/config';
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
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'v8',
      clean: true,
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      include: ['src/store/slices/**', 'src/utils/**', 'src/api/**'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/backend/**',
        '**/venv/**',
        '**/.{idea,git,cache,output,temp}/**',
        'src/main.tsx',
        '**/*.test.ts',
        '**/*.fixtures.ts',
        '**/fixtures.ts',
      ],
    },
  },
});
