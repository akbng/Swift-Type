import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
// import copy from 'rollup-plugin-copy';

export default [
  {
    input: './src/content_scripts/index.ts',
    output: {
      file: './dist/script.js',
      format: 'esm',
    },

    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
  },
];
