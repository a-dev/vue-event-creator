/*
This config is only for building the library
For dev look at demo/vite.config.js
*/

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: [resolve(__dirname, 'src/VueEventCreator.vue')],
      name: 'VueEventCreator',
      fileName: (format) => `vue-event-creator.min.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'dayjs'],
      output: {
        globals: {
          vue: 'Vue',
          dayjs: 'dayjs'
        }
      }
    }
  }
});
