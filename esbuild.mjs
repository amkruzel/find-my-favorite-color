import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['scripts/app.ts', 'scripts/workers/initColors.ts', 'scripts/workers/loadColors.ts'],
    bundle: true,
    outdir: 'src',
    sourcemap: true
})