import del from 'rollup-plugin-delete';
import babel from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
// import commonjs from '@rollup/plugin-commonjs';
// import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { DEFAULT_EXTENSIONS } from '@babel/core';
// import license from 'rollup-plugin-license'
import fs from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const plugins = [
  // image(),
  // nodeResolve(),
  // commonjs(),
  typescript(),
  replace({
    __VERSION__: pkg.version,
  }),
  terser({
    compress: true,
    mangle: true
  }),
];

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    {
      file: pkg.browser,
      format: 'umd',
      name: 'eval5',
      sourcemap: true,
    },
  ],
  plugins: [
    ...plugins,
    babel({
      exclude: ['node_modules/**'],
      babelHelpers: 'runtime',
      extensions: [...DEFAULT_EXTENSIONS],
      plugins: ['@babel/plugin-transform-runtime'],
      presets: [
        [
          '@babel/env',
          {
            // useBuiltIns: false,
            corejs: '3.30',
          },
        ],
      ],
    }),
    del({ targets: ['dist/*'] }),
  ],
};
