import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development, requests to /api are proxied to the Express server so the
// browser sees a single origin (no CORS, cookies just work).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:5000', changeOrigin: true },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            motion: ['framer-motion'],
          },
        },
      },
    },
  };
});
