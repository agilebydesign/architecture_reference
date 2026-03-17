const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
// TODO: bundle counter.json
async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    outdir: 'dist',
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    // outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'warning',
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin
    ]
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location == null) return;
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  }
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});

// Bundle client code for webview (browser-compatible)
esbuild.build({
  entryPoints: ['src/**/*_client.ts'],
  bundle: true,
  outdir: 'dist',
  format: "iife",
  platform: "browser",
  target: "es2020",  
  minify: production,
  sourcemap: !production,
}).then(() => {
  console.log("client-side.js built successfully");
}).catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
