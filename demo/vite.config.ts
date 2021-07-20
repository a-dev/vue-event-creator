import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0'
  },
  // base: '/vue-event-creator/',
  base: process.env.NODE_ENV === 'production' ? '/vue-event-creator/' : './',
  build: {
    outDir: '../docs'
  }
});
