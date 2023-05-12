import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import copy from 'rollup-plugin-copy';

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

  {
    input: 'src/popups/scripts/index.js',
    output: {
      file: 'dist/popup.js',
      format: 'esm',
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      // typescript({ tsconfig: './tsconfig.json' }),
      terser(),
      copy({
        targets: [
          {
            src: 'src/popups/index.html',
            dest: 'dist',
            rename: 'popup.html',
            transform: (contents) => {
              return contents
                .toString()
                .replace('styles/index.css', 'popup.css')
                .replace('scripts/index.js', 'popup.js')
                .replace('../../public/keys.png', 'assets/keys.png');
            },
          },
          {
            src: 'src/popups/styles/index.css',
            dest: 'dist',
            rename: 'popup.css',
          },
          {
            src: 'public/keys.png',
            dest: 'dist/assets',
          },
          {
            src: 'manifest.json',
            dest: 'dist',
            transform: (contents) => {
              return contents.toString().replace(/dist\//g, '');
            },
          },
        ],
      }),
    ],
  },
];
