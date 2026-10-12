# PneumoVax — Architecture Reference

## What It Is

Standalone client-side React SPA giving ACIP/CDC-cited clinical decision support for **pneumococcal** vaccination only — PCV (PCV15/PCV20/PCV21/Capvaxive) and PPSV23 — across the full lifespan (infants → adults). No backend, no auth, no DB. Sibling of MeningoVax; engine-design rules are ported from it but this codebase is independent and mirrors MeningoVax's architecture.

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
    citations.jsx        [c] -> numbered superscript links. Shared by RecCard and
                         RiskAgeNote; numbering is per-card, in reading order.
    RiskAgeNote.jsx      Quiet cited note: an adult-only risk ticked on a child was
                         seen, and does not change the schedule (P3-9). Renders on
                         BOTH StepRisks and the Results header.
    Disclaimer.jsx       Clinical disclaimer footer.
  logic/
    recommend.js         THE engine. recommend(input) → { recs[], hsct, pcv21Geo, perDose, meta }.
    riskAgeNote.js       Whether a ticked adult-only risk needs explaining at this age,
                         and the cited sentence that does it. Keyed to
                         ADULT_SCHED_MIN_M (228), matching the engine's dispatch.
    validate.js          analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today, dob,
                         riskIds }) → { pcv: {perDose, effective}, ppsv23: {…} }.
                         ⚠ THE ENGINE'S ENTRY POINT — use this, not two analyzeHistory
                         calls. Owns minimum-AGE and product rules; delegates every
                         timing question to doseIntervalRules.js.
                         Each stream needs the other's doses, because adult rows measure
                         a conjugate dose from a PPSV23 and vice versa (S14-7) — and
                         each must see only the other's doses that COUNTED (ANCHOR-1,
                         owner decision 2026-10-11). Two separate walks cannot do that:
                         whichever runs first has no verdicts from the second. So both
                         streams are walked together in DATE ORDER, which has no
                         circularity because every interval is measured from an EARLIER
                         dose. On a same-date tie the PCV is judged first, so a
                         same-visit PPSV23 still sees its PCV15.
                         analyzeHistory(vaccine, doses, ageMonths, today, dob, opts)
                         → { perDose, effective } remains for single-stream callers and
                         tests; it takes the other stream's doses on trust, as the ones
                         that counted.
    doseIntervalRules.js DOSE_INTERVAL_RULES + evaluateDoseInterval(ctx). Every
                         gap-between-recorded-doses rule, as one table. Each row declares
                         `rulebook` (which schedule states it) and `enforcement`
                         (floor / recommendation / none) SEPARATELY — no age test decides
                         whether a rule may void a dose. ⚠ Adult floors are an owner
                         clinical determination (2026-10-11), not ACIP: read the file
                         header and CLINICAL_SPEC.md §K before touching a row.
    intervals.js         GRACE_DAYS + the minimum NUMBERS and the comparison helpers that
                         apply the grace. The RULES that use them live in
                         doseIntervalRules.js; recommend.js reads the numbers directly for
                         its forward-looking scheduler.
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
- `perDose` — `{ pcv:[...], ppsv23:[...] }` per-dose validation results. **Always arrays, on every path including the hard stop** (P6-5) — `Results.jsx` renders its dose chips from these rather than walking the history a second time.
- `meta` — `{ ageMonths, today, riskIds, pcvCount, ppsv23Count }`

**Status values:** `due | catchup | risk-based | shared-decision | complete | not-indicated | deferred`

**Design rule:** All clinical logic in the engine. Product validity, PCV15→PPSV23 vs PCV20-complete distinction, prior-vaccine matrix, PCV7-not-counted — computed in `recommend.js`. UI consumes pre-built recs.

### Note shape and citations (S13, 2026-10-10)

A rec's `note` is **`{ lead, detail }`** (a plain string is still accepted and read as
all lead). `lead` is what to do for THIS patient and is always visible; `detail` sits
behind RecCard's "Why this" disclosure. A note with no `detail` renders no toggle.

**What belongs in which half:** `lead` carries everything the clinician must *do* —
including future steps such as the 8-week PPSV23 minimum and an immunocompromised
child's 5-year second dose. `detail` carries which CDC row this is, and why. Moving an
action into `detail` hides it behind a click; the A-P1-1 tests assert specifically
against `lead` to stop that happening.

`noteCites` is **one ordered list of `cite()` objects per literal `[c]` in the note**,
across BOTH halves — the lead's markers consume the first entries and the detail's take
the rest. Numbers are assigned at render time by `components/citations.jsx`, never in
the engine, deduped by source page, once per card. `validate.js` verdicts use the same
contract via `reasonCites`.

`data/refs.js` exports `cite(key)` → `{ key, page, url, label }` and
`highlightUrl(url, quote)`. ⚠ A quote link is built on the page part ONLY: CDC's child
and adult notes URLs end in `#note-pneumo`, and two `#` fragments in one URL stop the
browser scrolling to the sentence.

A sweep test (`regression-p6-3b-note-cite-parity`) walks 9,024 notes and 7,452 dose
verdicts and fails if markers and citations ever stop matching one-for-one, or if a
citation names a ref that does not exist.

## Schedule Boundary Constants (`scheduleConstants.js`)

**Two named constants — never collapse:**

| Constant | Value | Meaning |
|---|---|---|
| `ADULT_SCHED_MIN_M` | 228 (19y) | Adult vs peds SCHEDULE routing boundary |
| `PCV21_MIN_AGE_M` | 216 (18y) | PCV21 (Capvaxive) PRODUCT min-age only |

`recommend.js` uses `ADULT_SCHED_MIN_M` (= 228). `validate.js` and `brands.js` use `PCV21_MIN_AGE_M` for the PCV21 gate. `doseIntervalRules.js` uses `ADULT_SCHED_MIN_M` in exactly one place — `rulebookOf()`, which picks which schedule's row applies — and a test fails if a second comparison appears. StepRisks imports the shared constant for the `adultOnly` risk gate.

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

`band = { before7, m7to11, before12, m12to23, m24to71, ge72, undated, before24, ge24 }`, plus `lastAgeAtDose` (age at the dose `lastDate` names). Undated doses fold into `before24` (assumed infant); never assume `ge24` (catch-up age). `before7`/`m7to11` split the infant band because p2016 Table 1 keys its rows on it and CDC Table 2 keys the dose 2→3 interval on it (P0-2); both are dated-only, and the infant ladder treats an undated dose as an infant dose. Matches the CDC PneumoRecs input model.

## Interval Rules

| Context | Interval |
|---|---|
| Peds, dose already given (floor) | ≥4 weeks if the earlier dose was <12mo, ≥8 weeks from 12mo (`pcvSeriesMinIntervalDays`) |
| Peds, next dose advised | CDC Catch-up Table 2, **keyed on the dose number** as well as the age (`pcvNextDoseMinIntervalDays`) — see `CLINICAL_SPEC.md` §L |
| Peds final/booster | ≥12 months |
| Peds at-risk ≥24mo | ≥8 weeks; IC rows add ≥5-year step |
| Adult PCV15→PPSV23 (**every** adult 19+) | **≥1 year**, with 8 weeks named as a minimum that may be *considered* for IC / cochlear implant / CSF leak |
| PCV13→PCV20/21 | ≥1 year |
| PCV13+PPSV23→PCV20/21 | ≥5 years |

`ADULT_PPSV23_INTERVAL_MONTHS` + `adultPpsvShorterMinimumApplies()` in `riskFactors.js` are the single source. Never hardcode the interval check.

**Corrected 2026-10-11 (S3).** The two rows above were one risk-class-keyed pair ("IC/cochlear/CSF = ≥8 weeks; non-IC chronic = ≥1 year") naming `adultPpsvIntervalClass()`, which no longer exists in `src/` — the rule from BEFORE the owner's A-P1-1 amendment. This was the third and fourth copy of that stale rule found in one sweep (after `testing.md` in S13 and `clinical-rules.md` in S3); `P7-1`'s `rule-docs-match-code` tripwire in S8 is what stops a fifth appearing.

## Risk Classes

- **IC** — immunocompromising: asplenia/SCD, immunodeficiency, immunosuppression, HIV, solid-organ transplant, advanced CKD/dialysis/nephrotic.
- **special** — cochlear implant, CSF leak. Non-IC row in the peds grid; for adults they are among the conditions for which the 8-week PCV15→PPSV23 minimum may be *considered*. `pedsRiskRowClass()` maps them to nonIC; `adultPpsvShorterMinimumApplies()` returns true for them. **These are two separate questions** — the predicate answers the interval one only, never which CDC row a patient is on (A-P1-1).
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

`dateUtils.js` is byte-for-byte identical across PneumoVax and MeningoVax. Date arithmetic uses UTC (`'T00:00:00Z'` + UTC getters); `todayISO()` derives from the LOCAL clock. If you change this file, apply the same change to MeningoVax. Open follow-up: extract to a shared package.
