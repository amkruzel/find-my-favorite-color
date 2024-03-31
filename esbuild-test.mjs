import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['tests/tests.ts'],
    bundle: true,
    outfile: 'tests/tests.cjs',
    sourcemap: true,
    platform: 'node'
})