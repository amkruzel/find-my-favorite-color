import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['scripts/app.ts'],
    bundle: true,
    outfile: 'src/app.js',
    sourcemap: true
})