# PneumoVax — Testing Reference

## Framework

- **Vitest** — `npm test` = `vitest run`
- All tests run in the default `node` environment
- Test files live in `src/logic/__tests__/` and `src/components/__tests__/`

## Test Files

| File | What it covers |
|---|---|
| `src/logic/__tests__/recommend.test.js` | Engine unit tests — all rec paths, every p2016 Table 4 row, both HSCT pathways, adult history × interval, PCV7-ignored, PCV21 geo, multi-condition precedence |
| `src/logic/__tests__/validate.test.js` | Dose validation — PCV7 noncounting, PCV21 child invalid, min ages, intervals |
| `src/logic/__tests__/regression-boundary-and-fixes.test.js` | Two-boundary split (ADULT_SCHED_MIN_M vs PCV21_MIN_AGE_M), infant booster H5, at-risk peds M1/M2/M3, ageGroup L1; incl. 18y0m/18y6m/19y0m boundaries |
| `src/components/__tests__/App.test.jsx` | Wizard render/flow tests |
| `src/data/__tests__/regression-p6-3-cite-and-highlight-url.test.js` | `cite()` / `highlightUrl()`; the one-`#`-fragment rule for quote deep links |
| `src/components/__tests__/regression-p6-3-note-citations.test.jsx` | `[c]` → numbered superscripts; per-card numbering in reading order; dedupe by page; orphan markers dropped |
| `src/logic/__tests__/regression-p6-3b-note-cite-parity.test.js` | Engine-wide sweep: marker/citation parity and no dead refs. **Counts notes and verdicts separately — a combined total once hid a sweep walking zero verdicts** |
| `src/components/__tests__/regression-p6-4-note-lead-and-detail.test.jsx` | `{lead, detail}` + "Why this"; one citation list spanning both halves |
| `src/components/__tests__/regression-p6-5-one-history-walk.test.jsx` | Results reads the engine's `perDose`; `perDose` is an array on every path |
| `src/components/__tests__/regression-p6-6-toggle-labels.test.jsx` | Header toggles keep their label; no "Done" |
| `src/components/__tests__/regression-p6-7-current-risk-disclaimer.test.jsx` | The current-risk-only caveat, and that the engine really behaves as it claims |
| `src/components/__tests__/regression-p7-2-no-inline-styles.test.js` | Tripwire: no inline styles or hex literals (the regression MeningoVax has) |
| `src/components/__tests__/regression-p3-9-risk-age-note.test.jsx` | `RiskAgeNote` on both surfaces; keyed to `ADULT_SCHED_MIN_M`, not the 18y product gate |

## Coverage Requirements

- When changing a rule: update `CLINICAL_SPEC.md`, the engine (`recommend.js`), and the test.
- **At least one test per `CLINICAL_SPEC.md` § sub-section** — every Table 4 row, both HSCT pathways, every adult history branch × interval.
- When changing `scheduleConstants.js`: verify the two constants (`ADULT_SCHED_MIN_M` and `PCV21_MIN_AGE_M`) remain distinct and that all consumers import the right one.
- When changing `dateUtils.js`: apply the same change to MeningoVax and vaxapp (mirror-synced).

## Key Invariants to Test

1. **PCV7 never counts** — dropped from effective series, treated as PCV-naïve.
2. **PCV21 for child (<228m) → INVALID** — not just excluded from recs but flagged in validation.
3. **Two-boundary separation** — `ADULT_SCHED_MIN_M=228` for schedule routing; `PCV21_MIN_AGE_M=216` for product min-age only. Test both 18y-something and 19y patients.
4. **Completed infant series → Option A/B, not a 5th dose** — 4-dose-completed 24–71mo at-risk child must fall through to PCV20-or-PPSV23 block.
5. **Band-based counting** — `band.ge24` progress, not total dose count, for 24–71mo catch-up.
6. **PCV13+PPSV23 shared-decision** — date-driven (age at PPSV23, not current age); fallback to current age only when undated.
7. **Adult PPSV23 interval** — **≥1 year for EVERY adult 19+**, with 8 weeks *named* as a
   minimum that may be considered for an immunocompromising condition, cochlear implant or
   CSF leak. Source: `ADULT_PPSV23_INTERVAL_MONTHS` + `adultPpsvShorterMinimumApplies()` in
   `data/riskFactors.js`.
   *(Corrected 2026-10-10, S13. This line previously read "IC/cochlear/CSF = ≥8wk; non-IC
   chronic = ≥1y. Source: `adultPpsvIntervalClass()`" — that was the rule BEFORE the owner's
   A-P1-1 amendment, and `adultPpsvIntervalClass()` no longer exists. See `CLAUDE.md`.)*
8. **The 8-week option must be in the note's `lead`, not its `detail`** — P6-4 put the note
   behind a "Why this" disclosure, and a rule that is only *named* behind a click is not
   named. `regression-a-p1-1-*` asserts against `lead` specifically.
9. **Every `[c]` marker has exactly one citation** — across both halves of a note, and
   across a verdict's whole `reasons` array. Swept engine-wide by
   `regression-p6-3b-note-cite-parity`.

## Prove a new guard can fail

Twice in S13 a test passed while testing nothing: five `RiskAgeNote` "no note here" cases
passed before the component existed, and the citation sweep read dose verdicts from the
wrong property and walked **zero** of them while still reporting green.

So for any test whose assertion is "nothing is wrong" — an empty-array expectation, a
`queryBy*` returning null, a sweep over generated cases — **introduce the fault on purpose
and watch it go red** before trusting it. Where a sweep counts what it visited, count each
*kind* separately: a combined total lets one kind fall to zero unnoticed.
