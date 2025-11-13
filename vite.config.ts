import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['recharts'],
  },
  build: {
    // Generate source maps for better debugging and Lighthouse insights
    sourcemap: true,
    // Target modern browsers to reduce legacy JavaScript polyfills
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Optimize chunk size with better splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // UI libraries
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          // Heavy editor libraries (lazy load)
          if (id.includes('node_modules/quill')) {
            return 'editor-vendor';
          }
          // Date pickers (lazy load)
          if (id.includes('node_modules/react-datepicker') || id.includes('node_modules/react-date-range')) {
            return 'datepicker-vendor';
          }
          // Image processing (lazy load)
          if (id.includes('node_modules/browser-image-compression')) {
            return 'image-vendor';
          }
          // PDF generation (lazy load)
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdfkit')) {
            return 'pdf-vendor';
          }
          // Sentry (lazy load)
          if (id.includes('node_modules/@sentry')) {
            return 'sentry-vendor';
          }
          // Charts (lazy load)
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          // Paddle (lazy load)
          if (id.includes('node_modules/@paddle')) {
            return 'paddle-vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minify with esbuild for better performance
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  server: {
    headers: {
      // Allow Paddle sandbox iframe
      'Content-Security-Policy': "frame-ancestors 'self' https://*.paddle.com https://*.paddlejs.com https://sandbox-buy.paddle.com https://buy.paddle.com; frame-src 'self' https://*.paddle.com https://*.paddlejs.com https://sandbox-buy.paddle.com https://buy.paddle.com;",
    },
  },
});
