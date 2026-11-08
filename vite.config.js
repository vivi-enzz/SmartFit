import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  root: 'frontend',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    // Keep the browser's Host header so the API can validate same-origin writes.
    // Vite's string shorthand enables changeOrigin and breaks that comparison.
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false },
      '/media': { target: 'http://127.0.0.1:3001', changeOrigin: false },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: { manualChunks: { three: ['three'], vue: ['vue', 'vue-router', 'vuex'] } },
    },
  },
});
