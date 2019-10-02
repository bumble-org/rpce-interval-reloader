/* eslint-env node */

import bundleImports from 'rollup-plugin-bundle-imports'
import typescript from 'rollup-plugin-typescript'

const plugins = [
  typescript(),
  bundleImports({
    include: ['**/*.sw.js'],
    importAs: 'path',
  }),
  bundleImports({
    include: ['**/*.code.js'],
    importAs: 'code',
  }),
]

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index-esm.js',
        format: 'esm',
        sourcemap: 'inline',
      },
      {
        file: 'dist/index-cjs.js',
        format: 'cjs',
        sourcemap: 'inline',
      },
    ],
    plugins,
  },
]

