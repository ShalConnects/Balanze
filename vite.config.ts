import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      // Allow Paddle sandbox iframe
      'Content-Security-Policy': "frame-ancestors 'self' https://*.paddle.com https://*.paddlejs.com https://sandbox-buy.paddle.com https://buy.paddle.com; frame-src 'self' https://*.paddle.com https://*.paddlejs.com https://sandbox-buy.paddle.com https://buy.paddle.com;",
    },
  },
});
