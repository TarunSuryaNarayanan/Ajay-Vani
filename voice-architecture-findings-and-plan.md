# Voice-First, Offline-First Architecture: Findings & Action Plan

**Context:** Removing Web Speech API (`webkitSpeechRecognition` / `speechSynthesis`) as a dependency. App is **voice-first** and **offline-first**, meaning local speech I/O must work as a fully functional baseline, not a degraded fallback. Bhashini (already integrated server-side for ASR/TTS) becomes an online *enhancement* layer rather than the primary path.

---

## 1. Current State

- `speech.ts` — uses `webkitSpeechRecognition` for ASR and `speechSynthesis` for TTS (both to be removed)
- `server/index.ts` — working Bhashini ASR/TTS proxy (`/api/bhashini/asr`, `/api/bhashini/tts`)
- Frontend never calls Bhashini ASR today; only Web Speech is wired up
- `@ricky0123/vad-web` (Silero VAD) + `onnxruntime-web` already in the stack — VAD is solved
- `api.ts` → `localFallbackProcess()` operates on a transcript string; needs *a* transcript from somewhere to function

**Core problem:** with Web Speech removed, there is no built-in browser fallback for ASR or TTS. Since the app must work offline as a primary mode, local models become mandatory infrastructure, not optional extras.

---

## 2. Key Decisions (from discussion)

| Area | Decision | Rationale |
|---|---|---|
| ASR | **Local ONNX ASR model runs always**, on-device, fed by Silero VAD segments | Offline-first + voice-first rules out "record and defer with no live transcript" |
| TTS | **Bundled offline neural TTS voice runs always** | Text-only fallback defeats voice-first; no browser TTS to fall back on anymore |
| Bhashini role | Becomes an **online quality upgrade**, not a hard dependency | App must fully function with no network and no API key |
| VAD | No changes needed | Silero VAD already segments utterances; this defines the ASR input contract (discrete clips, not continuous streaming) |
| Missing/failed Bhashini | Low-drama indicator only (e.g. "local" vs "enhanced" icon) | Nothing breaks when Bhashini is unavailable — it's not a failure state, just a mode |

**Architecture shape:**

```
Mic audio → Silero VAD (segment) → Local ASR (always) → transcript (always available)
                                          │
                                          └─(if online)→ Bhashini ASR → replace transcript if higher quality

Response text → Local TTS (always) → audio (always available)
                     │
                     └─(if online)→ Bhashini TTS → cache + use for next playback if higher quality
```

---

## 3. Open Question to Resolve First

**Exact target language list and priority order** (which are must-have vs. nice-to-have). This single input determines which ASR/TTS candidates are even viable and should be confirmed before benchmarking starts. Assumed for this doc: **Hindi + English minimum**, likely additional Indic languages given the Bhashini integration.

---

## 4. ASR Candidates to Benchmark

| Model | Why consider | Risks / unknowns |
|---|---|---|
| Whisper-tiny / base (ONNX, quantized) | Already have `onnxruntime-web`; well-documented ONNX exports (e.g. Xenova/transformers.js) | Known weaker on Hindi/Indic languages vs. English — must verify directly |
| Distil-Whisper | Smaller/faster than Whisper at similar English accuracy | Indic performance likely inherits or worsens Whisper's gap |
| Vosk small models (per-language) | Purpose-built for on-device/offline use; dedicated Hindi model exists | Older (Kaldi-based) architecture; check coverage for other target languages |
| IndicWhisper (AI4Bharat) | Whisper fine-tuned specifically to fix Indic-language weakness | ONNX export/conversion effort unknown; check license |
| Meta MMS | Broad multilingual coverage incl. many Indic languages | Browser/ONNX deployment maturity unverified; early feasibility check needed |

**Input contract:** Silero VAD already isolates discrete speech segments (~1–5s clips), so the ASR model only needs to handle short, pre-segmented utterances — not continuous streaming. This favors models benchmarked for chunked inference (most Whisper-class models fit this well).

## 5. TTS Candidates to Benchmark

| Model | Why consider | Risks / unknowns |
|---|---|---|
| Piper | Designed for on-device/offline, ONNX-based, reasonably mature | Indic voice coverage is the open question — check available voices first |
| MMS-TTS (Meta) | Wide language coverage incl. Indic languages | Voice quality/naturalness vs. Piper unverified; browser/ONNX maturity unknown |
| Indic Parler-TTS (AI4Bharat) | Purpose-built for Indic languages | Likely heavier model; may be server-only, not browser-exportable |
| Coqui TTS (community forks) | Mature ecosystem, some multilingual models | Maintenance status uncertain — verify before investing time |

**Note:** mature, compact, multilingual local TTS with strong Indic coverage is less settled than local ASR. Treat this as the higher-risk half of the spike.

---

## 6. Evaluation Methodology

For each candidate, on **your actual target languages** (not just English):

- **Accuracy** — WER for ASR; MOS or informal listening test for TTS, using a small test set built from real user-like recordings (accents, background noise), not just clean benchmark audio
- **Latency** — time-to-first-partial-result (ASR), time-to-first-audio (TTS), measured on a representative **low/mid-range Android device**, not just a dev machine
- **Size / memory footprint** — download size and in-memory cost, especially with Silero VAD already resident in `onnxruntime-web` on the same page — check real headroom, don't assume
- **License** — confirm commercial-use permissions per model before further investment
- **Audio format compatibility** — confirm whether Silero VAD's output (raw PCM/float format) matches each candidate's expected input, or whether resampling/conversion is needed per model

---

## 7. Action Plan

### Phase 0 — Unblock (before benchmarking)
- [ ] Confirm target language list and priority (must-have vs. nice-to-have)
- [ ] Confirm Silero VAD's output audio format (sample rate, encoding) for harness compatibility

### Phase 1 — Feasibility spike (Days 1–4)
- [ ] Stand up a minimal end-to-end pipeline: Silero VAD segment → one ASR candidate → transcript, in-browser
- [ ] Stand up one TTS candidate producing audio in-browser from sample text
- [ ] Validate the WASM/ONNX pipeline works at all before comparing quality across candidates

### Phase 2 — Comparative benchmarking (Days 4–7)
- [ ] Run all ASR candidates against the same test set; log WER, latency, size per language
- [ ] Run all TTS candidates against the same test text; log quality (informal MOS), latency, size, voice availability per language
- [ ] Check memory footprint with VAD + ASR + TTS models all resident simultaneously on a low-end device

### Phase 3 — Decision (Day 7)
- [ ] Write a short decision doc: chosen ASR model, chosen TTS model, tradeoffs accepted, languages covered vs. not
- [ ] Flag any language gaps that may need a different model or reduced scope

### Phase 4 — Integration
- [ ] Wire chosen local ASR into `speech.ts` as the primary transcript source, fed by existing Silero VAD segments
- [ ] Wire chosen local TTS into `speech.ts` as the primary audio output source
- [ ] Add Bhashini as an online enhancement layer:
  - ASR: send the same VAD segment to Bhashini when online; replace/upgrade transcript if it returns before local ASR is "final," or asynchronously correct after the fact
  - TTS: use Bhashini TTS when online (optionally cached for offline replay); fall back silently to local TTS otherwise
- [ ] Add a simple, low-drama connectivity/mode indicator (e.g. "Local" vs. "Enhanced") — not an error state
- [ ] Confirm `localFallbackProcess()` in `api.ts` receives a valid transcript regardless of which ASR path produced it
- [ ] Remove `webkitSpeechRecognition` and `speechSynthesis` from `speech.ts`

---

## 8. Risks to Track

- Indic-language ASR/TTS quality from compact local models may lag Bhashini noticeably — set expectations that "local" mode is a real, permanent mode for some users (no API key configured), not just a temporary gap
- Local TTS Indic voice coverage may be the weakest link in the whole plan — validate early rather than late
- Running VAD + ASR + TTS models concurrently on low-end mobile browsers is untested — memory/CPU headroom must be measured, not assumed
