import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/logos': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/produtos': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
