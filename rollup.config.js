import pkg from './package.json';
import path from 'path';
import caniuse from 'caniuse-api';
import resolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import postcssEnv from 'postcss-preset-env';
import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';

const browsers = Object.entries(caniuse.getSupport('speech-synthesis')).map(
  ([browser, {y, a}]) => y || a ? `${browser} >= ${a || y}` : null
).filter(i => i).join(', ');

export default [
  {
    input: 'src/js/read-it-to-me.js',
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'},
      {name: 'ReadItToMe', file: pkg.browser, format: 'umd'}
    ],
    plugins: [
      resolve(),
      postcss({
        extract: path.join(__dirname, 'dist/css/read-it-to-me.min.css'),
        minimize: true,
        sourceMap: true,
        plugins: [postcssEnv({browsers})]
      }),
      babel({
        exclude: 'node_modules/**', // only transpile our source code
        presets: [['@babel/preset-env', {targets: browsers}]]
      }),
      terser()
    ]
  }
];