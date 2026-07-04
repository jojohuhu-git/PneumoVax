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
7. **Adult PPSV23 interval** — IC/cochlear/CSF = ≥8wk; non-IC chronic = ≥1y. Source: `adultPpsvIntervalClass()`.
