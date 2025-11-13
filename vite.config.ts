import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Generate source maps for better debugging and Lighthouse insights
    sourcemap: true,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  server: {
    headers: {
      // Allow Paddle sandbox iframe
      'Content-Security-Policy': "frame-ancestors 'self' https://*.paddle.com https://*.paddlejs.com https://sandbox-buy.paddle.com https://buy.paddle.com; frame-src 'self' https://*.paddle.com https://*.paddlejs.com https://sandbox-buy.paddle.com https://buy.paddle.com;",
    },
  },
});
