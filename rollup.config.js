import vue from 'rollup-plugin-vue';
import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import cleanup from 'rollup-plugin-cleanup';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default [
  {
    input: 'src/VueEventCreator.vue',
    output: {
      file: 'dist/vue-event-creator.esm.js',
      format: 'esm'
    },
    external: ['vue', 'dayjs'],
    plugins: [
      typescript({
        tsconfig: false,
        experimentalDecorators: true,
        module: 'es2015'
      }),
      vue(),
      commonjs(), // It's fixed dayjs locale imports
      babel({
        babelHelpers: 'runtime',
        skipPreflightCheck: true
      }),
      terser(),
      cleanup({
        comments: 'none'
      })
    ]
  },
  {
    input: 'src/VueEventCreator.vue',
    output: {
      file: 'dist/vue-event-creator.min.js',
      format: 'iife',
      name: 'VueEventCreator',
      globals: {
        vue: 'Vue',
        dayjs: 'dayjs'
      }
    },
    external: ['vue', 'dayjs'],
    plugins: [
      typescript({
        tsconfig: false,
        experimentalDecorators: true,
        module: 'es2015'
      }),
      vue(),
      commonjs(), // It's fixed dayjs locale imports
      babel({
        babelHelpers: 'bundled'
      }),
      terser(),
      cleanup({
        comments: 'none'
      })
    ]
  },
  {
    input: 'src/styles/index.js',
    output: {
      file: 'dist/styles.css',
      format: 'esm'
    },
    plugins: [
      postcss({
        extract: true,
        minimize: true,
        plugins: [autoprefixer()]
      })
    ]
  }
];
