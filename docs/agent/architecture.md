# PneumoVax — Architecture Reference

## What It Is

Standalone client-side React SPA giving ACIP/CDC-cited clinical decision support for **pneumococcal** vaccination only — PCV (PCV15/PCV20/PCV21/Capvaxive) and PPSV23 — across the full lifespan (infants → adults). No backend, no auth, no DB. Sibling of PediVax (vaxapp) and MeningoVax; engine-design rules are ported from those but this codebase is independent and mirrors MeningoVax's architecture.

## Tech Stack

- **React 18** with hooks (no class components)
- **Vite 5** — `npm run dev`, `npm run build` → `dist/`
- **Vitest** + @testing-library/react — `npm test` (`vitest run`)
- `vite.config.js` sets `base: '/PneumoVax/'` (GitHub Pages, case-sensitive). All public asset paths MUST use `import.meta.env.BASE_URL`.
- Deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

## File Structure

```
src/
  App.jsx               4-step wizard shell + shared state (useState):
                        Age → Risks → History → Results.
  main.jsx              React entry.
  App.css               All styles + CSS custom properties (:root tokens).
  components/
    Stepper.jsx          Top progress indicator (4 steps).
    StepAge.jsx          Age entry: group chips + precise (years/months) + DOB.
                         Chips PREFILL the editable years/months fields.
    StepRisks.jsx        Risk-factor checklist, grouped IC / cochlear-CSF / non-IC / HSCT.
    StepHistory.jsx      TWO product streams: PCV doses (product dropdown) + PPSV23 doses.
                         Each dose {date?, product?}. No auto-add — always needs explicit
                         "+ Add dose" click.
    Results.jsx          Output. Calls recommend(); renders HSCT advisory card, PCV21 geo
                         note, standard rec cards. Inline "Adjust age" + "Recorded doses ▾"
                         editors. "← Edit history" back button at bottom.
    RecCard.jsx          Single rec card (status shading, brands, note, citations).
    Disclaimer.jsx       Clinical disclaimer footer.
  logic/
    recommend.js         THE engine. recommend(input) → { recs[], hsct, pcv21Geo, perDose, meta }.
    validate.js          analyzeHistory(vaccine, doses, ageMonths, today) → { perDose, effective }.
    dateUtils.js         todayISO, addDays, daysBetween, intervalElapsed, DAYS.
                         ⚠ Mirror-synced with MeningoVax dateUtils.js — keep in sync.
    format.js            fmtAgeMonths, fmtDate, ageGroup, dobToAgeMonths.
    scheduleConstants.js ADULT_SCHED_MIN_M (228 = 19y), PCV21_MIN_AGE_M (216 = 18y).
                         These are two separate concepts — NEVER collapse back into one constant.
    __tests__/           recommend.test.js, validate.test.js, regression tests.
  data/
    brands.js            PCV_PRODUCTS, PPSV23_PRODUCT, ALL_PRODUCTS, productByKey,
                         pcvRecBrands. Counting flags per product. PCV_MIN_AGE_M = 42/30.4375 (6 wks).
    riskFactors.js       RISK_FACTORS catalog + IC/nonIC/special/hsct class helpers.
    refs.js              REFS citation map + resolveRefs(). HSCT sources segregated.
  components/__tests__/App.test.jsx   Wizard render/flow tests.
CLINICAL_SPEC.md         Every clinical rule with source citations. Read first when changing any rule.
HANDOFF.md               Author-review checklist, source-vs-p2016 reconciliation, ambiguities.
```

## Recommendation Engine (`recommend.js`)

`recommend({ ageMonths, riskIds, pcvDoses, ppsv23Doses, today })` is a **pure function**. Returns:
- `recs` — array of rec objects (PCV and/or PPSV23 streams; Option A/B pairs for peds at-risk rows)
- `hsct` — `{ title, coordinateFlag, recs[] }` advisory block, or `null`
- `pcv21Geo` — `{ note, citations }` serotype-4 advisory, or `null`
- `perDose` — `{ pcv:[...], ppsv23:[...] }` per-dose validation results
- `meta` — `{ ageMonths, today, riskIds, pcvCount, ppsv23Count }`

**Status values:** `due | catchup | risk-based | shared-decision | complete | not-indicated | deferred`

**Design rule:** All clinical logic in the engine. Product validity, PCV15→PPSV23 vs PCV20-complete distinction, prior-vaccine matrix, PCV7-not-counted — computed in `recommend.js`. UI consumes pre-built recs.

## Schedule Boundary Constants (`scheduleConstants.js`)

**Two named constants — never collapse:**

| Constant | Value | Meaning |
|---|---|---|
| `ADULT_SCHED_MIN_M` | 228 (19y) | Adult vs peds SCHEDULE routing boundary |
| `PCV21_MIN_AGE_M` | 216 (18y) | PCV21 (Capvaxive) PRODUCT min-age only |

`recommend.js` uses `ADULT_SCHED_MIN_M` (= 228). `validate.js` and `brands.js` use `PCV21_MIN_AGE_M` for the PCV21 gate. StepRisks imports the shared constant for the `adultOnly` risk gate.

## Counting Policy

- **PCV7 NEVER counts** (ACIP/immunize.org). Status `noncounting`, dropped from `effective`. High-risk patients treated as PCV-naïve.
- **PCV13/PCV15/PCV20 count.** PCV21 counts for ADULTS only.
- **PCV21 for child (<19y, `ADULT_SCHED_MIN_M`) → INVALID** (dropped).
- Min-age below product floor → INVALID. Dateless doses use current age as upper bound (a past dose can't have been given later than today).
- **Unknown/undocumented history → treat as unvaccinated.**

## Product Type Semantics

- **PCV20 (any age) or PCV21 (adults) ⇒ series complete, no PPSV23.**
- **PCV15 (without a later PCV20/21) ⇒ PPSV23 follow-up required.**
- PCV13 alone does not complete; residual dose from the matrix.

Encoded as `completesSeries` / `requiresPPSV23` flags in `brands.js`. Never contradict in a new branch.

## PCV Minimum Age

`PCV_MIN_AGE_M = 42 / 30.4375` (ACIP 6 weeks, not the 2-month routine start). Defined in `brands.js`. `validate.js` renders sub-2-month minimums in weeks.

## Age-Banded Dose Counts (`summarizePcv`)

`band = { before12, m12to23, m24to71, ge72, undated, before24, ge24 }`. Undated doses fold into `before24` (assumed infant); never assume `ge24` (catch-up age). Matches the CDC PneumoRecs input model.

## Interval Rules

| Context | Interval |
|---|---|
| Peds <12mo | ≥4 weeks |
| Peds ≥12mo | ≥8 weeks |
| Peds final/booster | ≥12 months |
| Peds at-risk ≥24mo | ≥8 weeks; IC rows add ≥5-year step |
| Adult PCV15→PPSV23 (IC / cochlear / CSF leak) | ≥8 weeks |
| Adult PCV15→PPSV23 (non-IC chronic only) | ≥1 year |
| PCV13→PCV20/21 | ≥1 year |
| PCV13+PPSV23→PCV20/21 | ≥5 years |

`adultPpsvIntervalClass()` in `riskFactors.js` is the single source — cochlear/CSF return `'short'` (IC interval). Never hardcode the interval check.

## Risk Classes

- **IC** — immunocompromising: asplenia/SCD, immunodeficiency, immunosuppression, HIV, solid-organ transplant, advanced CKD/dialysis/nephrotic.
- **special** — cochlear implant, CSF leak. IC interval for adults; non-IC row in peds grid. `pedsRiskRowClass()` maps them to nonIC; `adultPpsvIntervalClass()` maps them to short.
- **nonIC** — chronic heart/lung/liver, diabetes, chronic CKD, alcohol, smoking (last two adultOnly).
- **hsct** — advisory pathway only (no calendar dates).
- **IC precedence over non-IC** when both present.

## HSCT — Design Rule (Advisory, No Dates)

The app does NOT capture an HSCT date. HSCT pathway is informational:
- `dueToday: false`, no `earliestNextDate`; timing lives in `note`.
- Shown prominently at TOP of Results; standard recs shown below in a collapsed `<details>`.
- "Coordinate with transplant/ID team — your center may use its own protocol."
- **Peds <19y HSCT = immunize.org p2016 Table 5 SOLE source** (4 doses PCV20; NOT CDC child notes).
- **Adult ≥19y HSCT = Fred Hutch LTFU SOLE source** (PCV20 ×3 at ≥6/≥8/≥10mo, no PPSV23, titer-guided). Institution-specific, NOT ACIP — say so.

## PCV21 (Capvaxive)

- Adults ≥18y (`PCV21_MIN_AGE_M = 216`) only.
- Geographic advisory (lacks serotype 4) surfaced via `pcv21Geo` when PCV21 is offered — advisory, not a hard block.
- Source: ACIP MMWR mm7336a3.

## dateUtils.js Sync

`dateUtils.js` is byte-for-byte identical across PneumoVax, MeningoVax, and vaxapp. Date arithmetic uses UTC (`'T00:00:00Z'` + UTC getters); `todayISO()` derives from the LOCAL clock. If you change this file, apply the same change to the sibling apps. Open follow-up: extract to a shared package.
