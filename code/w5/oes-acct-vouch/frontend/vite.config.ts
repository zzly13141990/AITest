import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/oes-acct-vouch': {
        target: 'http://localhost:8199',
        changeOrigin: true,
      },
    },
  },
});
