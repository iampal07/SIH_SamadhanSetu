/** Bundles the seeder (so Vite-style extensionless imports resolve) and runs it. */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { rmSync } from 'node:fs';

const out = new URL('./.seed.bundle.mjs', import.meta.url);
await build({
  entryPoints: [new URL('./seed-supabase.mjs', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
  bundle: true, platform: 'node', format: 'esm', outfile: out.pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  external: ['@supabase/supabase-js'], logLevel: 'error',
});
await import(pathToFileURL(out.pathname.replace(/^\/([A-Za-z]:)/, '$1')).href);
process.on('exit', () => { try { rmSync(out); } catch { /* ignore */ } });
