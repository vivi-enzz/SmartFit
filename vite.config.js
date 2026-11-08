import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  root: 'frontend',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    proxy: { '/api': 'http://127.0.0.1:3001', '/media': 'http://127.0.0.1:3001' },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: { manualChunks: { three: ['three'], vue: ['vue', 'vue-router', 'vuex'] } },
    },
  },
});
