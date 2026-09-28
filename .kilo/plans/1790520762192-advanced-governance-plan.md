# Advanced Governance & Post-Course Features — Implementation Plan

Status: IMPLEMENTED — all three features shipped. `npm run build` green, `tsc --noEmit` clean, 87/87 tests passing.

## 1. Scope & Confirmed Decisions

Implements three features from `advanced_governance_post_course_features.md`:
- **F1** Voice-Based Grievance Redressal (whistleblowing engine)
- **F2** Automated Lifecycle Nudges via WhatsApp (Twilio API)
- **F3** Post-Course AI Guidance System (second conversation loop)

### Confirmed design decisions

| Decision | Choice |
|---|---|
| F2 WhatsApp | Real Twilio integration: `twilio` dependency, backend WhatsApp sender, `TWILIO_*` env credentials, time-based scheduler, profile inbox view |
| F3 completion signal | Explicit `courseCompleted: boolean` + `completedAt: number | null` on `AadhaarSession`, set via new "Complete Training" button |
| F3 loop location | New dedicated screen `post-training-guidance`, navigated automatically on Day 90+ login |
| F1 destination | In-app Ministry Monitoring Dashboard; external portal forwarding deferred behind a config flag (portal still in development) |
| F1 button location | Beneficiary dashboard (`BeneficiaryDashboardScreen`) |
| F1 default mode | Complaint form (issue-type dropdown + free text), with voice dictation via mic as an alternative capture path |

### Mandatory guardrail

Per spec §⚠️: never replace, overwrite, or discard existing features or legacy fallback logic. All new code paths are additive. Where new behavior could shadow legacy behavior, keep the legacy path as fallback.

## 3. Delivered

| Area | Where |
|---|---|
| F1 grievance ledger + endpoints | `server/services/grievanceLedger.ts`, `server/index.ts` (5 routes) |
| F1 UI | `src/components/Governance/GrievanceReporter.tsx`, `src/screens/MinistryDashboardScreen.tsx` |
| F2 Twilio sender + scheduler | `server/services/whatsapp.ts`, `server/services/lifecycleScheduler.ts` |
| F2 UI | `src/components/Governance/LifecycleNudgePanel.tsx` + ministry conversation view |
| F3 loop + gate | `server/services/postTraining.ts`, `src/screens/PostTrainingGuidanceScreen.tsx` |
| Shared helpers | `src/services/governance.ts` (metadata tagging, Day-90 gating, `landingScreenFor`) |
| Tests | `src/services/governance.test.ts` (12), `src/tests/governanceScreens.test.tsx` (11), `server/services/{grievanceLedger,lifecycleScheduler,postTraining,whatsapp}.test.ts` (37) |

### Deviations from the original plan, and why

- **Twilio is a real `twilio` dependency** (v6.1.1) loaded via dynamic `import()`, so the server boots and runs with no `TWILIO_*` set — sends degrade to a logged, retryable no-op, matching the existing Bhashini pattern.
- **Course completion persists per beneficiary in `localStorage`.** The spec's "logs back in post-training" requires it to survive logout; a dashboard "reset demo state" control clears it so a demo can be re-run.
- **A labelled "डेमो: दिन 90 सिम्युलेट करें" control** exists because the Day-90 gate is otherwise unreachable in a demo. `completedAt` is never faked at login.
- **Grievance submission queues offline** in `localStorage` and flushes on reconnect *and* on launch (not just on the `online` event), so complaints queued in a previous offline session are not stranded.


## 2. Existing Codebase Context (verified)

- **Backend** (`server/index.ts`): Express + TypeScript, Bhashini ASR/TTS proxy, 7-parameter NSQF `analyzeTranscript()`, QR token endpoints, offline sync endpoint, district-data endpoint. No WhatsApp, no grievances, no post-course logic.
- **Frontend screens**: `language-select`, `voice-chat`, `nsqf-profile`, `skilling-jobs`, `micro-finance`, `offline-sync`, `aadhaar-login`, `aadhaar-otp`, `beneficiary-dashboard`. No post-training or grievance screen.
- **State** (`AppContext.tsx`): `AadhaarSession` has `grantStep` (1-4), `stipendDaysAttended`, `stipendTotalEarned` — no completion flag.
- **Voice** (`speech.ts`, `audioCapture.ts`): Silero VAD + Bhashini ASR/TTS + local ONNX fallback. Reusable for F1 dictation and F3 voice prompts.
- **PDF** (`pdfGenerator.ts`): `generateBusinessProposalPDF(profile, nsqf, district)` — directly reusable for F3 Path A.
- **Data** (`server/data/districtJobs.ts`, `nsqfPacks.ts`): district market registry with centers/ODOP/vacancies — reusable for F3 Path B job queries.
- **Architecture precedent**: QR token store (in-memory `Record` + REST endpoints + verification web page) is the exact pattern to mirror for the grievance ticket ledger.