import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['tests/tests.ts'/*, 'tests/workers/colors.test.ts'*/],
    bundle: true,
    outfile: 'tests/tests.cjs',
    //outdir: 'tests',
    sourcemap: true,
    platform: 'node'
})