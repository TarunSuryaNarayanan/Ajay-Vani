# AJAY-VANI — Design System & Visual Specification

**Companion document to:** `AJAY_VANI_Mobile_App_Developer_Guide.md`
**Scope:** Visual identity, design tokens, screen-by-screen direction, and pre-launch requirements for the PWA.
**Audience for the product:** SC beneficiaries with low digital literacy, dialect speakers (Bhojpuri, Bundeli, Chhattisgarhi, Maithili, etc.), rural youth, and Gram Sahayaks (ASHA/Anganwadi workers) acting as facilitators.

---

## 1. Design Principles

This is a voice-first civic tool, not a marketing site. The person using it may be speaking to a phone for the first time to access a government scheme. Every design decision should reduce intimidation and ambiguity, not add polish for its own sake.

1. **Voice is the primary interface; screens confirm, they don't interrogate.** Text on screen should mirror what was just said or heard, never ask the user to read something they haven't already heard spoken.
2. **One clear action per screen.** No competing CTAs, no secondary "explore" paths on the core interview flow.
3. **Real data or no data.** Every number, badge, or status shown (match score, vacancy count, distance to center) comes from the backend API in real time. If the API hasn't returned it, the UI shows a loading or empty state, never a placeholder number.
4. **Iconography over language.** Because literacy and dialect vary, meaning should be carried by shape, color, and a consistent icon system, not by phrasing alone.
5. **Calm authority.** This app represents a government livelihood scheme. The visual tone should read as trustworthy and official-but-warm, closer to a well-run public service counter than a consumer app.

---

## 2. Color System

Base palette, as specified:

| Token | Hex | Role |
|---|---|---|
| `color-action` | `#FC8A15` | Primary action color: the mic button, primary CTAs, active tab indicator. Used sparingly so it keeps its weight. |
| `color-surface` | `#F6F6F6` | App background. Off-white, not pure white, to be easy on the eyes in bright outdoor daylight. |
| `color-positive` | `#1EE494` | Confirmation and success states only: "profile saved," "synced," a matched skill. Never decorative. |
| `color-trust` | `#009378` | Structural color: headers, nav bar, the Gram Sahayak avatar's core color, selected states. This is the app's "brand" anchor more than the orange is. |

Supporting neutrals and one utility color, added because the four brand colors can't carry text, borders, or error states on their own:

| Token | Hex | Role |
|---|---|---|
| `color-ink` | `#14231F` | Primary text. A near-black with a slight green undertone so it sits comfortably with `color-trust`, rather than a generic `#000` or `#111`. |
| `color-ink-muted` | `#54655F` | Secondary text, helper captions, timestamps. |
| `color-line` | `#E1E0DB` | Hairline borders and dividers, derived from the surface color, not grey-by-default. |
| `color-alert` | `#C6482E` | Errors and failed-sync states only. A warm, muted red-orange that doesn't compete with `color-action`'s orange. |
| `color-offline` | `#FC8A15` at 12% opacity fill, full-strength for the dot/icon | Offline/pending-sync indicator, reusing the action color's hue family so the palette doesn't grow. |

**Usage rules:**
- `color-action` (orange) is reserved for things the user can *do*: speak, retry, generate the proposal PDF. If everything on a screen is orange, nothing is.
- `color-positive` (mint) only appears after something has actually succeeded — a completed sync, a confirmed match. It never appears as a static accent or icon fill just for decoration.
- `color-trust` (teal) carries structure: the top bar, the avatar, selected nav state. It's the color the app "is," the way a uniform color identifies a public service.
- Never combine `color-action` and `color-positive` as a gradient. Both are saturated; placed together as a wash they read as a generic "AI product" gradient, which is explicitly what we're avoiding. If a screen needs both a CTA and a success badge, separate them spatially, not blended.
- All text/background pairings must pass WCAG AA (4.5:1 body text, 3:1 large text/icons). `color-action` orange on `color-surface` passes for large text and icons but not for small body text — use `color-ink` for body copy and reserve orange for buttons, icons, and headings 18px+.

---

## 3. Typography

The app must render Devanagari and other Indic scripts alongside Latin script (English district/scheme names, QP codes like `ELE/Q5901`) at the same visual weight, so the typeface choice is constrained by script support first, personality second.

- **Primary typeface:** **Noto Sans** paired with the matching **Noto Sans Devanagari** (and the relevant regional Noto Sans variant per selected dialect — Noto Sans Devanagari covers Hindi, Bhojpuri, Bundeli, Chhattisgarhi, Maithili as written scripts). One family, two scripts, matched weights — this avoids the mismatched-baseline, mismatched-weight look that happens when a Latin display font is paired with a generic system Devanagari fallback.
- **Do not** introduce a second decorative Latin display face for headings. The product's credibility comes from consistency and legibility, not typographic flourish.
- **Scale:** a restrained scale, since most screens carry very little text:
  - Display (screen titles, spoken-response headline): 28/34, weight 600
  - Body (transcript text, descriptions): 18/26, weight 400 — larger than typical web body text, because this is read at arm's length, outdoors, by users who may not read fluently
  - Caption (timestamps, distances, helper text): 14/20, weight 400, `color-ink-muted`
- No all-caps labels anywhere. All-caps is harder to parse for low-literacy readers and is a generic template tell.
- No single-word accent styling inside a headline (one bold or colored word in an otherwise plain sentence). If a word needs emphasis, the whole phrase should be redesigned as its own element (a badge, a card), not typographically flagged mid-sentence.

---

## 4. Layout

**Grid:** single-column, mobile-first, max content width 480px even when the PWA is viewed on a tablet or desktop browser — this app is never meant to feel like a "website," it's a pocket tool.

**Alignment:** left-aligned text throughout (not centered), except the mic button screen, where the core interaction is centered as the clear singular focus.

**Touch targets:** minimum 56×56px, with the primary mic button at 96×96px — sized for outdoor use, imprecise tapping, and older users.

**Spacing:** an 8px base unit. Generous whitespace between unrelated groups (24–32px), tight spacing within a related group (8–12px), so grouping is read spatially rather than needing dividers or labels to explain itself.

ASCII layout concept for the core screen (Screen 2):

```
┌────────────────────────────┐
│  ← Back      हिंदी ▾        │   top bar: color-trust bg
├────────────────────────────┤
│                             │
│        [ Avatar ]          │   Gram Sahayak avatar,
│                             │   flat illustration, not photo
│   "आपको किस काम का          │
│    अनुभव है?"                │   spoken-question echo, body scale
│                             │
│                             │
│         ((●))              │   mic button, 96px, color-action
│      बोलने के लिए दबाएं       │   caption under button, not inside it
│                             │
│   ▂▃▅▇▅▃▂  live waveform    │
│                             │
│  "मेरा नाम रमेश है..."        │   live transcript, color-ink-muted
│                             │
└────────────────────────────┘
```

---

## 5. Components

**Buttons**
- Primary button: rounded rectangle, **8px** corner radius, `color-action` fill, `color-surface` text, 56px min height. Not a pill. A small, consistent radius reads as considered; a fully-rounded pill shape is the generic SaaS default and is explicitly excluded from this project.
- Secondary button: `color-surface` fill, 1px `color-line` border, `color-ink` text, same 8px radius.
- Mic button is the one deliberate exception to "rectangle": it's circular because it maps to a real-world metaphor (press-to-talk, like a call button), not because circular/pill shapes are a default style choice. One bold, justified shape choice, used once.
- Button label text states the action directly: "फिर से सुनें" (Listen again), "प्रस्ताव बनाएं" (Generate proposal) — not vague labels like "जारी रखें" (Continue) with no object.

**Cards** (NSQF role card, skilling center card)
- 8px radius to match buttons, 1px `color-line` border, no drop shadow. A flat, bordered card reads as a document/record — appropriate for a government-adjacent tool — rather than a soft-shadowed "product feature card," which is a generic SaaS tell.
- Every stat on a card (match score, distance, vacancy count) is rendered from a live API field, with a loading skeleton in the same shape while the value is fetched, never a hardcoded example value left in place.

**Icons**
- Replace every emoji used in the architecture doc's wireframes (🇮🇳 🗣️ 🎓 📍 📞 ✅) with a single custom line-icon set, one weight (2px stroke), one corner style, in `color-trust` or `color-ink` depending on context. A consistent icon system reads as designed; emoji read as a placeholder that was never finished.
- Language tiles (Screen 1) use the native script itself as the primary identifier (हिंदी, भोजपुरी) rather than a flag or emoji, since a flag doesn't correspond to a dialect and flags/emoji read as decorative rather than functional here.

**Avatar (Gram Sahayak character)**
- A simple, flat, geometrically-constructed illustrated character in `color-trust`, designed in-house or by an illustrator — not a photorealistic or AI-generated portrait. A generated "friendly assistant" photo is exactly the kind of stock-feeling asset this project is avoiding, and it also can't be animated/lip-synced as cleanly as a vector character.

**Status indicators**
- Offline: small dot + label in the offline color, "इंटरनेट नहीं — सेव किया जा रहा है" (No internet — saving locally). Never fails silently.
- Synced: `color-positive` checkmark, appears once, doesn't persist as a badge afterward.
- Error/failed sync: `color-alert` with a specific, actionable message ("दोबारा भेजने के लिए दबाएं" / Tap to resend), never a generic "Something went wrong."

---

## 6. Motion

- One orchestrated moment per flow, not motion on every element. The two places motion earns its keep:
  1. The waveform visualizer while the user is actively speaking — this is functional feedback (confirms the mic is capturing), not decoration.
  2. A single confirmation animation when a profile/match is generated (a brief scale-and-settle on the result card), marking a real state change.
- No fade-and-slide-up entrance animations on each card or section as the user scrolls. No hover-triggered animations on every tappable element — most users are on touch devices where hover doesn't apply anyway, and adding it for desktop/PWA-in-browser view would be motion without purpose.
- No custom cursor effects.
- Respect `prefers-reduced-motion`: waveform still functions (it's data, not flourish) but the confirmation animation becomes an instant state change.

---

## 7. Copy Guidelines

- Write in the voice of a calm, competent facilitator, not a product marketer. No exclamation-point enthusiasm, no "unlock," "empower," "seamless."
- Every headline is concrete and specific to the current step ("आपको किस काम का अनुभव है?" — What work experience do you have?), never a vague value-proposition line ("Your voice, your future" or similar).
- No em dashes in UI copy; use a period or comma and a new sentence instead.
- Buttons name the action, and the confirmation after tapping uses the same verb (e.g., a button reading "प्रस्ताव बनाएं" leads to "प्रस्ताव बन गया," not a differently-worded success message).
- Empty and error states explain what happened and what to do next, in plain language, never an apology or a vague "error occurred."
- No customer-count or usage-count language anywhere in the app itself ("Join 10,000+ beneficiaries," etc.) — this is a government utility, not a growth-marketed consumer product, and any count shown (like district vacancy numbers) must be a live figure from the backend, sourced and dated.

---

## 8. Explicit Exclusions

These are hard constraints for this project, listed here so they're checkable in design review rather than left to memory:

- No purple gradients, or any two-brand-color gradient wash.
- No pill-shaped buttons (see §5 — 8px radius rectangles only; the mic button's circle is the one justified exception).
- No fake reviews, testimonials, or fabricated user quotes.
- No fake or placeholder metrics — every number on screen is either live from the API or absent.
- No vague hero/headline text — every headline states the specific thing the screen is for.
- No emoji used as UI icons — use the defined line-icon set instead.
- No em dashes in copy.
- No scroll-triggered reveal animations or other over-the-top scroll effects.
- No custom cursor animations.
- No AI-generated "slop" photography (stock-feeling generic portraits, generic office/handshake imagery) — use the illustrated avatar system or real, captioned photography from actual PM-AJAY centers if available.
- No AI-generated "slop" copy — generic, overly promotional phrasing that could apply to any product. Copy should reference this specific scheme, this specific district data, this specific step.

---

## 9. Accessibility & Inclusive Design Notes

- Minimum body text size 18px; the app should still be usable by someone reading haltingly or not reading text at all, relying on the spoken audio.
- Color is never the only signal — pair `color-positive`/`color-alert` states with an icon and a text label, not fill color alone, for users with color vision deficiency.
- All interactive elements have a visible focus state (for keyboard/switch-access users navigating the PWA in a browser), using a 2px `color-trust` outline offset from the element.
- Audio replay is available on every spoken output, always visible, never hidden behind a menu.
- Support dynamic text scaling up to at least 200% without breaking layout, since some users may increase system font size.

---

## 10. Pre-Launch Checklist

The product does not go live until every item below is complete. This list is intentionally separate from the feature checklist in the developer guide.

- [ ] Custom domain connected (no default hosting subdomain in the live URL).
- [ ] Favicon added (reflects the brand mark, not the platform's default icon).
- [ ] "Made with AI" / platform attribution badge removed from the deployed app.
- [ ] Privacy Policy page written and linked (what voice data is collected, how long it's stored, whether it's used for training, who it's shared with — Aadhaar/caste certificate data handling must be explicit).
- [ ] Terms and Conditions page written and linked.
- [ ] Manifest and service worker configured correctly for PWA installability (name, icons at required sizes, theme-color matching `color-trust`).
- [ ] All copy reviewed against §7 and §8 above — no leftover placeholder/lorem text, no leftover emoji icons from early prototypes.
- [ ] All stat/metric displays verified to pull from live API responses, not hardcoded demo values.
