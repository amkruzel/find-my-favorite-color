import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['scripts/script.ts', 'scripts/workers/colors.ts', 'scripts/workers/loadColors.ts'],
    bundle: true,
    outdir: 'src',
    sourcemap: true
})