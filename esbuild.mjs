import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['scripts/script.ts', 'scripts/workers/colors.ts'],
    bundle: true,
    outdir: '.',
    sourcemap: true
})