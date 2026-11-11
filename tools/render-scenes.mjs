/**
 * Renderiza las 14 escenas de canvas a PNG para revisión visual.
 * Uso:  npm run render:scenes   (requiere @napi-rs/canvas y esbuild instalados)
 * No forma parte del build del sitio.
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';

const outDir = path.resolve('tools/renders');
fs.mkdirSync(outDir, { recursive: true });

const STUB = `
export function useCanvas(draw) { globalThis.__DRAW__ = draw; return { current: null }; }
export function useRaf() {}
export function useMedia() { return false; }
`;

const entry = `
import { EXPERIMENTS } from './src/experiments/index.ts';
import { defaults } from './src/experiments/types.ts';
export function renderAll() {
  const out = {};
  for (const def of EXPERIMENTS) {
    globalThis.__DRAW__ = null;
    def.Scene({ data: def.compute(defaults(def.params)) });
    out[def.id] = globalThis.__DRAW__;
  }
  return out;
}
`;

await esbuild.build({
  stdin: { contents: entry, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  outfile: path.join(outDir, '_bundle.mjs'),
  plugins: [
    {
      name: 'stub-hooks',
      setup(b) {
        b.onResolve({ filter: /lib\/hooks$/ }, () => ({ path: 'hooks-stub', namespace: 'stub' }));
        b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: STUB, loader: 'js' }));
      },
    },
  ],
  logLevel: 'error',
});

const { renderAll } = await import(path.join(outDir, '_bundle.mjs') + `?t=${Date.now()}`);
const draws = renderAll();
for (const [id, draw] of Object.entries(draws)) {
  const canvas = createCanvas(960, 540);
  const ctx = canvas.getContext('2d');
  draw(ctx, 960, 540, 1.1);
  fs.writeFileSync(path.join(outDir, `${id}.png`), canvas.toBuffer('image/png'));
  console.log('✓', id);
}
fs.unlinkSync(path.join(outDir, '_bundle.mjs'));
