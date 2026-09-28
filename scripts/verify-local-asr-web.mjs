#!/usr/bin/env node
/**
 * Browser-path verification for the local ASR model.
 *
 * The main harness (`verify-local-asr.mjs`) runs transformers.js down its Node
 * code path (file system + CPU provider). This one exercises the other branch —
 * the one a real browser takes:
 *
 *   * transformers.js is forced into its web branch (fetch, not fs)
 *   * the model is resolved from a *relative* `/models/whisper-tiny` path,
 *     exactly what `getModelBaseUrlSync()` gives the app
 *   * every model file is served over HTTP from `public/`, so the real request
 *     URLs and status codes are visible
 *   * ONNX Runtime runs on the wasm execution provider
 *
 *   node scripts/verify-local-asr-web.mjs
 *
 * It must run under plain `node` (not tsx), because the browser branch is
 * selected by faking `process.release.name` before transformers.js is imported
 * and tsx keeps using the real `process` object afterwards.
 */

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CASES = [
  { lang: 'en', code: 'en-IN', text: 'my name is Ramesh' },
  { lang: 'hi', code: 'hi-IN', text: 'मेरा नाम रमेश है' },
];

const publicDir = join(ROOT, 'public');
const ortDist = join(ROOT, 'node_modules', 'onnxruntime-web', 'dist');
const requests = [];

const server = createServer((req, res) => {
  requests.push(req.url);
  const filePath = join(publicDir, decodeURIComponent(req.url));
  try {
    if (statSync(filePath).isDirectory()) throw new Error('directory');
  } catch {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    'content-type': extname(filePath) === '.json' ? 'application/json' : 'application/octet-stream',
    'content-length': statSync(filePath).size,
  });
  createReadStream(filePath).pipe(res);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// transformers.js decides IS_NODE_ENV from process.release.name at import
// time, so the stub has to be in place before the module graph is loaded.
const realProcess = globalThis.process;
const realFetch = globalThis.fetch;
globalThis.process = {
  ...realProcess,
  release: { name: 'browser' },
  env: realProcess.env,
  versions: realProcess.versions,
  cwd: () => ROOT,
};
globalThis.self = globalThis;

const { pipeline, env } = await import('@huggingface/transformers');

env.useFS = false;
env.useBrowserCache = false;
env.useFSCache = false;
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = '/models';
env.fetch = (u, init) => realFetch(String(u).startsWith('http') ? u : base + u, init);
// transformers' wasm cache rewrites the ORT factory to a blob: URL, which
// Node's ESM loader cannot import. Turning it off is harness-only: a real
// browser has no such restriction.
env.useWasmCache = false;
env.backends.onnx.wasm.wasmPaths = {
  wasm: pathToFileURL(join(ortDist, 'ort-wasm-simd-threaded.wasm')).href,
  mjs: pathToFileURL(join(ortDist, 'ort-wasm-simd-threaded.mjs')).href,
};

console.log(`serving public/ at ${base}`);
console.log('loading pipeline from /models/whisper-tiny (device: wasm)');

const t0 = Date.now();
const asr = await pipeline('automatic-speech-recognition', '/models/whisper-tiny', {
  dtype: 'q8',
  device: 'wasm',
  local_files_only: true,
});
console.log(`PIPELINE LOADED in ${Date.now() - t0} ms (web branch, wasm EP, relative /models path)`);
console.log(`model files fetched over HTTP (${new Set(requests).size}):`);
for (const u of [...new Set(requests)].filter((u) => u.startsWith('/models'))) {
  console.log(`  ${u}`);
}

const { transcribeFloat32 } = await import(
  new URL('./verify-local-asr-helpers.mjs', import.meta.url).href
);
let failures = 0;
for (const c of CASES) {
  const started = Date.now();
  const result = await transcribeFloat32(asr, c.lang, c.text);
  const ms = Date.now() - started;
  if (!result.ok) {
    console.log(`[${c.code}] FAILED after ${ms} ms: ${result.error}`);
    failures++;
    continue;
  }
  console.log(`[${c.code}] ${ms} ms`);
  console.log(`    expected: ${c.text}`);
  console.log(`    actual:   ${result.text}`);
}

server.close();
console.log('');
console.log(failures === 0 ? 'browser-path check produced a transcript' : `${failures} case(s) failed`);
process.exit(failures === 0 ? 0 : 1);
