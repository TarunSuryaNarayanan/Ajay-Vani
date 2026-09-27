# Voice Pipeline Recovery & Offline-First Hardening (replacement for `voice-architecture-findings-and-plan.md`)

## Why this plan exists

`voice-architecture-findings-and-plan.md` was written against commit `a73fad3`, not the working tree. Its premise ("remove the Web Speech API dependency") is already implemented, and four of its load-bearing claims are false. It is retained only as a candidate list for model selection (Whisper/IndicWhisper/Vosk for ASR, Piper/MMS for TTS) and as a pointer to the one real gap (no offline TTS).

**Do not execute the old document.** Sections 1, 4, 5 and 7 describe code that does not exist or does not work.

## Decisions taken

1. **Phases before model work.** B1 and B2 make the app non-functional; no model selection matters until they are fixed.
2. **Model delivery: shell-only precache, per-language packs downloaded on demand.** Precached assets stay ~3–4 MB after Phase B. Quantized Whisper-tiny is ~40–80 MB per language and a Piper voice ~20–60 MB, so precaching is not viable across 9 languages, and even a single precached pack is a heavy cold install. The app stays immediately usable via Bhashini; offline voice is opt-in per language.
3. **transformers.js** as the ASR runtime (D13), because hand-rolled ORT is what produced B4.
4. **An empty transcript must never reach `localFallbackProcess`** (D18) — it currently produces a confident, wrong livelihood recommendation.
5. **Offline TTS is scoped to Hindi only** (E20–E21). No permissively-licensed, browser-viable TTS exists for ta, te, mr or bn. This is a research finding, not a scope cut, and it caps the achievable outcome of this plan.
6. **Packs are served from the API origin, behind an env-overridable base URL** (C11). There is no deployment infrastructure in this repo at all, so this keeps egress reversible — pointing at a bucket or CDN later is a config change, not a code change and not a client release.

---

## Verified current state

Working tree is 1,709 insertions across 15 modified files plus 2 untracked files (`src/services/audioCapture.ts`, `src/services/translations.ts`), **all uncommitted**. Target is a **PWA** (`vite-plugin-pwa`, `display: standalone`), not Capacitor/native. No test runner, no lint script; `npm run build` runs `tsc` only.

Languages are already fixed at 9 `LanguageCode`s (`src/types/index.ts:1-10`), but bho/bun/chg/mai all resolve to the **Hindi** ASR model (`speech.ts:215-218`) and to Hindi server-side. Effective model targets: **5** (hi, ta, te, mr, bn).

### Blocking defects (pipeline is non-functional end-to-end today)

| # | Defect | Evidence |
|---|---|---|
| **B1** | **Recording always returns an empty WAV.** `handleManualStop` calls `stopCapture()` (which nulls `this.audioContext`, `audioCapture.ts:253`) *before* `blobToWavBase64` (`:219` → `:224`). `blobToWavBase64` then hits `this.audioContext!` on null (`:269`), falls into `catch`, and `decodeMediaRecorderBlob` returns `btoa('')` (`:288`). `speech.ts:80` sees falsy → `onError('आवाज़ कॅप्चर करने में समस्या आई।')`. **No transcript is ever produced, on the Bhashini path too.** | `audioCapture.ts:219-288`, `speech.ts:79-84` |
| **B2** | **Silero VAD never initializes — all three option names are wrong for the installed version.** `audioCapture.ts:108-114` passes `workletPath` (a removed option), `modelPath: '/silero_vad.onnx'` (a filename that does not exist), and `onnxPath` (wrong name). In `@ricky0123/vad-web@0.0.31`, `MicVAD.new` reads `baseAssetPath` (default `"./"`), then resolves `baseAssetPath + "vad.worklet.bundle.min.js"` and `baseAssetPath + modelFiles[model]` where `modelFiles` is `{legacy, v5, v6}` (`node_modules/@ricky0123/vad-web/dist/real-time-vad.js:36-41,58,240,355`), and `onnxWASMBasePath` (`:59`), not `onnxPath`. Init throws → caught (`:130`) → `initFallbackVAD` sets `vad = null` (`:136-139`) → `onVADSpeechStart`/`onVADSpeechEnd` **never fire**; recording is manual-stop only. | `audioCapture.ts:108-139`, `real-time-vad.js:36-59,240,355` |
| **B3** | **Local ASR is dead code.** `getOnnxModelUrl` requests `/models/whisper-tiny-*.onnx` (`speech.ts:212-224`); no `public/models/` exists and nothing is in `dist/`. `modelExists` HEAD-requests → 404 → path returns false → `{ transcript: '', source: 'fallback' }` (`:127-131`). | `speech.ts:210-241` |
| **B4** | **`runWhisperInference` is not a Whisper implementation.** Feeds raw PCM into a tensor named `input` and reads `results.output`, handling only `string`/`Array`. No mel-spectrogram, no encoder/decoder, no tokenizer. Could not produce a transcript even with models present. | `speech.ts:243-281` |

The old document asserted "VAD is solved" and "Frontend never calls Bhashini" — both false. `recognizeWithFallback` tries **Bhashini first** (`speech.ts:115`), and `api.ts` has further Bhashini helpers.

### The one real gap the old document correctly identified

`tryPreRecordedAudio` builds a `commonPrompts` map then **never reads it** and returns `null` unconditionally (`speech.ts:412-416`). Its single entry `'hi-IN:नमस्ते' -> 'TtsPlaceholder'` is a literal string, not base64 audio, and is unreachable. **Offline TTS is a silent no-op** — `speech.ts:340-342` fires callbacks with no audio.

### Undocumented blocker: precache is 117 MB

`dist/` measures **117 MB**, and `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm,onnx}']` (`vite.config.ts:65`) precaches all of it. Measured breakdown:

| Asset | Size | Needed? |
|---|---|---|
| `dist/ort-wasm-simd-threaded.jsep.wasm` (root, via `*.wasm` glob) | 28.3 MB | **No** — jsep is the WebGPU/WebNN variant |
| `dist/assets/ort-wasm-simd-threaded.jsep-*.wasm` (hashed, via glob) | 28.3 MB | **No** — same variant, duplicated |
| `dist/ort-wasm-simd-threaded.asyncify.wasm` | 26.8 MB | **No** — asyncify variant |
| `dist/ort-wasm-simd-threaded.jspi.wasm` | 16.8 MB | **No** — jspi variant |
| `dist/ort-wasm-simd-threaded.wasm` | 14.2 MB | **Yes** — the base wasm-EP binary |
| `dist/silero_vad_legacy.onnx` | 1.8 MB | **No** |
| `dist/silero_vad_v5.onnx` | 2.3 MB | **Yes** (after pinning `model: 'v5'`) |
| `dist/silero_vad_v6.onnx` | 2.3 MB | **No** |
| `dist/assets/html2canvas.esm-*.js` | 202 KB | Questionable — verify a dependency |
| `dist/assets/ort.bundle.min-*.js` | 414 KB | Yes |

`getOnnxConfig` hardcodes `executionProviders: ['wasm']` (`speech.ts:229`), so the jsep/jspi/asyncify binaries are never loaded at runtime — they are pure dead weight at install. **"Offline-first" does not work at 117 MB**, and it worsens as soon as real models are added. This is more urgent than the TTS question.

### Model feasibility — checked against primary sources

The old document's candidate tables carry no sizes, no licenses, and one candidate that cannot legally be used. Verified:

| Model | License | Size | Covers the app's 5 effective langs (hi, ta, te, mr, bn)? | Verdict |
|---|---|---|---|---|
| **Whisper / IndicWhisper** (ONNX, transformers.js) | **MIT** — commercial OK | ~40–80 MB q8 per language | All 5 | **Use for ASR** |
| Piper | MIT (model) / varies by voice | ~64 MB per voice | **Hindi only** — official `VOICES.md` lists just `hi_IN` (pratham, priyamvada) and `ml_IN`; no ta/te/mr/bn | **Use for TTS, Hindi only** |
| Indic Parler-TTS (ai4bharat) | **Apache-2.0** — commercial OK | **2.3 GB fp16** ONNX (`naklitechie/indic-parler-tts-ONNX`); ~4.5 GB fp32 | All 5, plus maithili and chhattisgarhi | **Rejected on size** for low-end mobile. Also gated on the Hub |
| Meta MMS-TTS | **CC-BY-NC 4.0 — NON-COMMERCIAL** | ~36 M params | All 5 | **Excluded.** Old document listed this with no licence warning |
| Coqui TTS community forks | varies | varies | — | Unmaintained; not worth the risk |

Two corrections to the old document fall out of this:

1. **Its recommended TTS engine (Piper) covers 1 of the app's 5 effective languages.** It assumed Piper's Indic coverage was an open question; it is answered, and the answer is mostly no.
2. **Its second TTS candidate (MMS) is non-commercial.** Shipping it in a PM-AJAY government deployment would be a licensing breach.

The closest thing to a full-coverage option, Indic Parler-TTS, is 2.3 GB as browser ONNX. That is not a download for this audience.

**Strategic note worth raising with stakeholders:** the best offline Indic ASR assets (AI4Bharat IndicConformer, ~150–200 MB int8, ten Indian languages, validated on real budget Android) are packaged for **sherpa-onnx native Kotlin/Java**, not for web browsers. This app is a PWA, which excludes the strongest option. If offline Indic voice is a hard requirement rather than a goal, revisiting the PWA-vs-native decision is the highest-leverage move available, and it should be raised explicitly rather than assumed away.

---

## Ordered tasks

### Phase A — Unbreak the pipeline (no design decisions; do first)

**A1. Fix B1 (audio teardown ordering).** In `audioCapture.ts`, decode the blob into an `AudioBuffer` *before* `stopCapture()` tears down the context — or capture a local `const ctx = this.audioContext` and have `blobToWavBase64` accept a context parameter. Remove the `!` non-null assertions at `:269` and `:284`. Make `decodeMediaRecorderBlob` return `null` rather than `btoa('')`, so an empty buffer is never mistaken for audio.

**A2. Fix B2 (VAD asset paths).** Replace the three wrong options with the ones `0.0.31` actually reads. Set `baseAssetPath: '/'` and pin `model: 'v5'`, then let the library derive the worklet and model filenames itself (`real-time-vad.js:36-41,240,355`). Set `onnxWASMBasePath` to wherever the ORT wasm is served, **not** `onnxPath` — it is the correct option name (`:59`). Verify against the actual `dist/` filenames rather than assuming; the vite copy targets already emit every file this configuration needs.

**A3. Add a startup asset assertion.** On app init, `HEAD` each VAD/ORT asset the app depends on and log a single clear line naming any 404. Silent fallback is what made B2 invisible.

**A4. Add a test baseline.** Introduce Vitest. Cover `toWavBase64` round-trip, the `handleManualStop` teardown ordering (A1), and language-mapping tables. No test infra exists today, so every fix above is currently unverified.

### Phase B — Cut the precache (prerequisite for offline-first)

**B5. Stop precaching unused ONNX Runtime wasm variants (~88 MB).** `vite.config.ts:26` globs `onnxruntime-web/dist/*.wasm` and copies all four variants to the root, while `getOnnxConfig` pins `executionProviders: ['wasm']` (`speech.ts:229`) — jsep, jspi and asyncify are never executed. Preferred approach: stop copying them to the root entirely and set `ort.env.wasm.wasmPaths` to a runtime-cached directory, so ORT fetches only the variant it actually selects. Fallback if ORT's variant selection cannot be constrained: copy the single base `ort-wasm-simd-threaded.wasm` and add a workbox runtime-cache rule for the rest. Either way, remove `*.wasm` from the workbox `globPatterns` so nothing binary is precached by accident. Note `dist/assets/ort-wasm-simd-threaded.jsep-*.wasm` (28.3 MB) is emitted by Vite because the ORT JS bundle references it — this is the copy most likely to survive a naive fix and must be checked explicitly in B8.

**B6. Ship one Silero VAD model (~4.1 MB saved).** `vite.config.ts:21` globs `*.onnx` and ships all three variants. Pair the `model: 'v5'` pin from A2 with a `viteStaticCopy` target naming only `silero_vad_v5.onnx`. The library requires the versioned filenames (`real-time-vad.js:37-41`), so do not rename them.

**B7. Cache heavy assets on demand, not at install.** Add a workbox `CacheFirst` rule for model binaries and wasm under a dedicated cache name, and drop `wasm`/`onnx` from `globPatterns` (`vite.config.ts:65`). Lower `maximumFileSizeToCacheInBytes` (`:64`) from 35 MB once the above land, so a stray large binary fails the build rather than silently shipping.

**B8. Re-measure `dist/` size** and record the before/after. B1–B7 are unverified in CI without this number as a tracked artifact.

### Phase C — Model pack delivery layer (new; follows the on-demand decision)

Local models must not be precached. Each language ships as an independently downloadable **pack** (ASR weights + TTS voice), fetched on first use and cached on the device.

**C9. Add a pack manifest.** New module `src/services/modelPackManager.ts` holding a static manifest: per language, the ASR and TTS artifact URLs, expected byte size, and sha256 for integrity. Sizes come from the real model files chosen in D15 and E20, not estimates. The manifest is the only thing that changes between releases — serve it with a short `no-cache` TTL so a new language pack can be added without shipping a client update.

**C10. Content-address every model filename** (e.g. `whisper-tiny-hi.q8_0.a1b2c3d4.onnx`). This is the highest-leverage detail in Phase C: immutable URLs can be cached forever by both browser Cache Storage and any future CDN, and replacing a pack never invalidates a user's existing download. Everything else in this phase depends on getting it right.

**C11. Serve packs from the API origin, behind an env var.** The server already exists and must stay, because Bhashini credentials cannot ship to the client. Mount a `/models` static directory as a **sibling of `dist`, not inside it** — anything under `dist/` is swept into the Vite build and the workbox precache globs (`vite.config.ts:65`), which would recreate the 117 MB problem Phase B exists to remove. Read the client-facing base URL from an env var (e.g. `MODEL_BASE_URL`) defaulting to the same origin, so pointing at a bucket or CDN later needs no code change and no client release.

**C12. Configure the mount properly.** The current `app.use(express.static(distPath))` (`server/index.ts:666`) has no compression and no cache headers. Give the `/models` mount `Cache-Control: public, max-age=31536000, immutable` (safe because of C10) and add the `compression` middleware app-wide — worth it mainly for the JS bundle, but int8 ONNX still gzips 15–25%. Also note `express.json({ limit: '10mb' })` (`server/index.ts:14`) applies to the Bhashini base64 audio path, not to model files, which stream through the static mount; leave that limit alone.

**C13. Implement the per-language state machine.** States: `unavailable` (no pack built for this language) → `not_downloaded` → `downloading` (with byte progress) → `ready` → `failed` (retryable). Expose a subscribe/notify hook so the language picker and voice screen can re-render on change. This single source of truth replaces the ad-hoc `modelExists()` HEAD-probe in `speech.ts:234-241`, which is part of why B3 failed silently.

**C14. Download with progress, resume, and integrity checks.** Page-side `fetch` with a `ReadableStream` reader for byte progress, then `cache.put()` into Cache Storage under a dedicated cache name — recommended over relying on the SW's `CacheFirst` alone, because the SW route cannot report progress to the page. Serving back to ONNX Runtime still works via the SW intercepting the same URL, so `ort.InferenceSession.create(url)` is unchanged.
- **Verify sha256 after download and only then transition to `ready`** — a truncated pack that looks complete is worse than an explicit failure.
- **Support resuming a partial download** with a range request. On a flaky rural link a 64 MB pack will interrupt, and resume is worth more than shaving bytes off the model.
- **Check `navigator.storage.estimate()` before starting** and surface a clear message if headroom is too low. A device with 150 MB free cannot hold a 64 MB pack plus cache quota; it will fail or silently evict.
- **Evict LRU across packs** with a cap on retained packs, not just total bytes. Five languages tried in one session is ~300 MB.

**C15. Trigger the download at language selection, not at first voice use.** `LanguageSelectionScreen` already runs before any voice interaction, so the app knows the language with nothing to interrupt. Start the fetch on that screen and let it run while the user reads. This is a small change with a large UX payoff, and it is the reason the pack layer can be built before any model exists (C13/C14 are testable with a dummy artifact).

**C16. Offer two quality tiers per language.** Ship `whisper-tiny` by default and expose `whisper-base` as an explicit "better accuracy, larger download" choice, so users on slow links are not forced into a poor default. Record both sizes in the manifest.

**C17. Guard against silent no-ops.** If a pack is `not_downloaded` when a voice interaction begins, the user must be told, not left waiting. Route this to a single explicit UI state rather than the current behaviour of firing callbacks with no audio (`speech.ts:340-342`).

**C18. Correct the stale README.** `README.md:26` and `:60` still describe the client as using the Web Speech API (`webkitSpeechRecognition`, `speechSynthesis`), which no longer exists anywhere in `src/`. This is almost certainly what the old findings document was written from — its entire premise is false in exactly the way the README is. Fix it as part of this phase so the next reader is not misled again.

### Phase D — Real local ASR

**D13. Choose an implementation approach.** Recommended: **transformers.js** (`@huggingface/transformers`) with quantized ONNX Whisper. It supplies the mel-spectrogram front end, tokenizer and decode loop that B4 is missing, is the path the old document already pointed at, and runs on the installed `onnxruntime-web`. The alternative — hand-rolling features and decode against raw ORT — is precisely what produced B4 and is not recommended; if the team still wants raw ORT, treat this as a substantially larger task and re-plan.

**D14. Licensing is now settled by research — see the model feasibility table above.** ASR uses MIT-licensed Whisper; the non-commercial MMS candidates are excluded. Re-verify only the final checkpoint chosen in D15.

**D15. Prefer IndicWhisper over base Whisper if the pack size is comparable.** AI4Bharat's IndicWhisper fine-tunes exist precisely because base Whisper underperforms on Indic languages, which is the concern the old document raised. Measure both; ship the better WER per megabyte, not the more famous one.

**D16. Build and place the pack artifacts.** Quantize, content-address the filenames per C10, and write them into the sibling `/models` directory served per C11. Record size and sha256 in the C9 manifest. Keep them out of `dist/` and out of git — add the directory to `.gitignore` and document the download-and-verify step that produces it.

**D17. Replace B3 and B4 outright.** Delete `runWhisperInference` (`speech.ts:243-281`) and the hardcoded `/models/` map (`speech.ts:210-232`). Do not leave two ASR paths. New inference must be driven by pack state from C10, not by URL guessing.

**D18. Fix the empty-transcript contract.** Today a total ASR failure yields `transcript: ''` (`speech.ts:127-131`), which flows into `localFallbackProcess('')` and returns a default Solar recommendation — a confident, plausible, wrong answer for a beneficiary making a life decision. An empty transcript must instead surface an explicit "could not understand" state. This is a correctness issue in the existing fallback chain, not only an offline concern.

**D19. Ship ASR packs for all five effective languages.** Unlike TTS, ASR is feasible across the board, so the pack layer should be built for general use. bho/bun/chg/mai resolve to the Hindi pack as an explicit, visible alias — never a silent substitution.

### Phase E — Offline TTS, scoped to what actually exists

**E20. Implement Piper for Hindi only.** This is the one permissively-licensed, browser-viable TTS available for any of the app's languages. Two official voices exist (`hi_IN-pratham-medium`, `hi_IN-priyamvada-medium`), ~64 MB each. Ship one, drive it from pack state, and wire it into `tryLocalTTSSynthesizer` (`speech.ts:375-392`).

**E21. Do not attempt offline TTS for ta, te, mr, bn, mai, chg, bho or bun.** The model feasibility table above shows why: MMS is license-blocked, Indic Parler-TTS is 2.3 GB fp16, and Piper has no voice in those languages. Treat Bhashini as the voice for these languages and make that a stated, visible mode — not a silent gap. Recording this honestly is the correct outcome; hunting further is not.

**E22. Delete the unreachable `commonPrompts` block** (`speech.ts:412-414`), the `'TtsPlaceholder'` entry, and the unused `bcp47` binding at `speech.ts:382`.

**E23. Add a low-drama mode indicator.** "Local" vs "Enhanced" so a Bhashini outage reads as a mode, never an error. Pair it with pack state from C10 so a missing pack is also a mode, not a failure. This indicator now carries real weight, because most languages will permanently be Enhanced-only.

**E24. Record the coverage gap in the README.** Eight of nine languages have no offline TTS. Any stakeholder expectation of full offline voice is currently unmet and should be documented rather than discovered in the field.

### Phase F — Validation

- **F1.** `npm run build` (typecheck) plus the new Vitest suite green.
- **F2.** Online path on a low-end Android Chrome: non-empty WAV, VAD events firing, transcript reaching `localFallbackProcess`. **This is the Phase A acceptance test and must pass before any model work begins.**
- **F3.** Pack lifecycle: download with progress, **interrupt mid-download and resume**, sha256 failure surfaces as `failed` not `ready`, low-storage warning appears, cold reload, offline reload, state survives, LRU eviction drops the oldest pack.
- **F4.** Offline round-trip in airplane mode: ASR for any `ready` language, **plus audible TTS for Hindi only** (E21).
- **F5.** Cold-install precache measured and recorded (from the 117 MB baseline). Confirm specifically that `dist/assets/ort-wasm-simd-threaded.jsep-*.wasm` is gone, and that no pack file appears under `dist/` at all.
- **F6.** Measure VAD + ASR + TTS resident memory on a low-end device. The old document flags this as untested; it still is.
- **F7.** Negative test: force a pack to `failed` and confirm the app says so rather than silently degrading to a wrong recommendation.
- **F8.** Confirm the mode indicator (E23) reads correctly for all three cases: online, offline with Hindi pack, offline without.
- **F9.** Verify the `/models` mount sends `immutable` cache headers and that a second download of an unchanged pack is served from cache with no server hit.

---

## Risks

- **Phase A is the real blocker.** C and D are unreachable until B1 and B2 are fixed. Do not start model selection first — it is the most attractive work and the least valuable right now.
- **Offline TTS will be Hindi-only, permanently, under this architecture.** Eight of nine languages stay Enhanced-only. If that is unacceptable, the answer is a native (sherpa-onnx) build, not more browser model hunting. Escalate rather than absorb.
- **On-demand ASR downloads may be impractical for the target user.** 40–80 MB per language on a slow link is itself a barrier. If F3/F4 show this, reducing language scope is the honest response. C14's resume support and C15's early trigger are mitigations, not a fix.
- **Pack bandwidth is coupled to the API server.** C11 keeps it reversible, but until `MODEL_BASE_URL` points elsewhere, every pack byte traverses the same host as `/api`. If per-user volume becomes material, moving to a bucket is a config change — the plan is structured so that is not a refactor.
- **Whisper is weak on Indic languages.** D15 mitigates this by preferring IndicWhisper, but neither is as good as Bhashini. Local ASR will be visibly worse than the online path; that must be set as an expectation, not discovered.
- Nothing is committed. The entire current voice implementation is uncommitted work across 15 files plus 2 untracked files, and the app is non-functional as it stands. Committing it in this state is the highest-severity risk in the repository.

## Out of scope

- The old document's 7-day benchmarking schedule and its Phase 0–3 structure. Model selection is resolved in this plan; benchmarking happens as a side effect of D15.
- Server-side Bhashini changes. `/api/bhashini/{asr,tts}` and `/api/health` are working and correct.
- Aadhaar login, jobs/NSQF screens, offline sync — unrelated to voice.
- Migrating the app from PWA to native, despite it being the highest-leverage option for offline Indic voice. Raised as a strategic question, not actioned here.

## Resolved questions

- **Precache budget** — superseded by the on-demand pack decision; the target is a ~3–4 MB shell.
- **Which languages** — all 5 for ASR; Hindi only for TTS; bho/bun/chg/mai alias to the Hindi pack.
- **Indic TTS availability** — researched and answered above. No browser-viable permissive option outside Hindi.
- **Licensing** — MMS excluded (non-commercial); Whisper MIT and Piper MIT cleared; Indic Parler-TTS Apache-2.0 but unusable at 2.3 GB.
- **Pack hosting** — same origin as the API, sibling `/models` directory outside `dist`, base URL from `MODEL_BASE_URL`, content-addressed filenames. Reversible to a CDN via config alone.

## Remaining questions

Both are infrastructure or product decisions outside this codebase, and neither blocks Phases A–D:

1. **What is the production deployment target?** There is no Dockerfile, CI, or platform config in the repo. C11 assumes a single long-lived host with a disk; a serverless or ephemeral filesystem would need the mount backed by object storage instead, which changes C11's shape.
2. **Is there bandwidth committed for a CDN?** Not needed under the current decision, but the fallback if per-user pack volume becomes material.
