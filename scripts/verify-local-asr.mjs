#!/usr/bin/env node
/**
 * Proves the local ASR path actually transcribes.
 *
 *   npm run asr:verify                  # hi, ta, bn, en, mr, te
 *   npm run asr:verify -- --aliases    # bho/bun/chg/mai -> the 'hi' code
 *   npm run asr:verify -- mr te        # only these cases
 *
 * Each language is synthesised with the system espeak-ng (22.05 kHz), resampled
 * to 16 kHz mono PCM in plain JS (see verify-local-asr-helpers.mjs), and pushed
 * through the same module the app uses (src/services/localAsr.ts) so this
 * exercises the real code path rather than a parallel implementation.
 *
 * For the browser branch of the same code — fetch over HTTP from /models, wasm
 * execution provider — use `npm run asr:verify:web`.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesise16k, toWavBase64 } from './verify-local-asr-helpers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_CASES = [
  { lang: 'hi', code: 'hi-IN', text: 'मेरा नाम रमेश है' },
  { lang: 'ta', code: 'ta-IN', text: 'என் பெயர் ரமேஷ்' },
  { lang: 'bn', code: 'bn-IN', text: 'আমার নাম রমেশ' },
  { lang: 'en', code: 'en-IN', text: 'my name is Ramesh' },
  { lang: 'mr', code: 'mr-IN', text: 'माझं नाव रमेश आहे' },
  { lang: 'te', code: 'te-IN', text: 'నా పేరు రమేష్' },
];

/**
 * bho/bun/chg/mai have no espeak voice, so they are fed Devanagari audio and
 * must resolve to the same 'hi' Whisper language code.
 */
const ALIASED = [
  { code: 'bho-IN', lang: 'hi', text: 'मेरा नाम रमेश है' },
  { code: 'bun-IN', lang: 'hi', text: 'मेरा नाम रमेश है' },
  { code: 'chg-IN', lang: 'hi', text: 'मेरा नाम रमेश है' },
  { code: 'mai-IN', lang: 'hi', text: 'मेरा नाम रमेश है' },
];

function parseArgs(argv) {
  const requested = argv.filter((a) => !a.startsWith('-'));
  return { requested, withAlias: argv.includes('--aliases') };
}

async function main() {
  const { requested, withAlias } = parseArgs(process.argv.slice(2));

  let cases = withAlias ? ALIASED : DEFAULT_CASES;
  if (requested.length > 0) {
    cases = [...DEFAULT_CASES, ...ALIASED].filter(
      (c) => requested.includes(c.lang) || requested.includes(c.code)
    );
  }
  if (cases.length === 0) {
    console.error('no matching cases');
    process.exit(2);
  }

  // transformers.js reads the model off the file system in Node, so point it at
  // the same directory the dev/prod server serves at /models.
  process.env.AJAY_VANI_MODELS_DIR = join(ROOT, 'public', 'models');

  const { transcribeWavBase64 } = await import(
    new URL('../src/services/localAsr.ts', import.meta.url).href
  );

  const scratch = mkdtempSync(join(tmpdir(), 'asr-verify-'));
  let failures = 0;

  for (const c of cases) {
    const pcm16k = synthesise16k(c.lang, c.text);
    const wavBase64 = toWavBase64(pcm16k, 16000);
    const seconds = (pcm16k.length / 16000).toFixed(2);

    const started = Date.now();
    let result;
    try {
      result = await transcribeWavBase64(wavBase64, c.code);
    } catch (err) {
      console.log(`[${c.code}] THREW after 0 ms: ${err?.message ?? err}`);
      failures++;
      continue;
    }
    const ms = Date.now() - started;

    if (!result.success) {
      console.log(`[${c.code}] FAILED (${result.error ?? 'no transcript'}) after ${ms} ms`);
      console.log(`    input: "${c.text}" (${seconds}s @16kHz)`);
      failures++;
      continue;
    }
    console.log(`[${c.code}] ${ms} ms, ${seconds}s audio`);
    console.log(`    expected: ${c.text}`);
    console.log(`    actual:   ${result.transcript}`);
  }

  rmSync(scratch, { recursive: true, force: true });
  console.log('');
  console.log(
    failures === 0
      ? 'all cases produced a transcript'
      : `${failures} case(s) produced no transcript`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
