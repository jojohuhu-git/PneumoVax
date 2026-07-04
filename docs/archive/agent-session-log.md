> **HISTORICAL ARCHIVE — NOT CURRENT INSTRUCTIONS**
>
> This file is the original monolithic CLAUDE.md preserved for historical reference.
> It contains session logs and implementation notes from 2026-06-07 through 2026-06-12.
> Current operating instructions are in the root `CLAUDE.md`.
> Durable reference is in `docs/agent/`.

---

# PneumoVax — Claude Code Guidance (ARCHIVED)

## What it is
PneumoVax is a standalone, client-side React SPA giving ACIP/CDC-cited clinical
decision support for **pneumococcal** vaccination only — PCV (conjugate:
PCV15/PCV20/PCV21) and PPSV23 (polysaccharide) — across the full lifespan
(infants → adults). No backend, no auth, no DB. It is the pneumococcal sibling of
`vaxapp` (PediVax) and `MeningoVax`; the engine-design rules are ported from those
but the codebase is independent and mirrors MeningoVax's architecture exactly.

## Tech stack
- **React 18** with hooks (no class components)
- **Vite 5** — `npm run dev`, `npm run build` → `dist/`
- **Vitest** + @testing-library/react — `npm test` (`vitest run`)
- `vite.config.js` sets `base: '/PneumoVax/'` (GitHub Pages, case-sensitive). All
  public asset paths MUST use `import.meta.env.BASE_URL` (see `App.jsx` logo).
- Deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

## Setup
```bash
npm install
npm run dev        # dev server on /PneumoVax/
npm test           # vitest run (78 tests, 3 files)
npm run build      # production build to dist/
```
Dev-server launch config: `.claude/launch.json` ("PneumoVax dev server").

## File structure
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
    StepHistory.jsx      TWO product streams in one step: PCV doses (product
                         dropdown) + PPSV23 doses. Each dose {date?, product?}.
    Results.jsx          Output. Calls recommend(); renders HSCT advisory card,
                         PCV21 geo note, standard rec cards. Inline "Adjust age".
    RecCard.jsx          Single rec card (status shading, brands, note, citations).
    Disclaimer.jsx       Clinical disclaimer footer.
  logic/
    recommend.js         THE engine. recommend(input) → { recs[], hsct, pcv21Geo, perDose, meta }.
    validate.js          analyzeHistory(vaccine, doses, ageMonths, today) → { perDose, effective }.
    dateUtils.js         todayISO, addDays, daysBetween, intervalElapsed, DAYS.
    format.js            fmtAgeMonths, fmtDate, ageGroup, dobToAgeMonths.
    __tests__/           recommend.test.js (57), validate.test.js (12).
  data/
    brands.js            PCV_PRODUCTS, PPSV23_PRODUCT, ALL_PRODUCTS, productByKey,
                         pcvRecBrands. Counting flags per product.
    riskFactors.js       RISK_FACTORS catalog + class helpers (IC/nonIC/special/hsct).
    refs.js              REFS citation map + resolveRefs(). HSCT sources segregated.
  components/__tests__/App.test.jsx   wizard render/flow tests (9).
CLINICAL_SPEC.md         Every clinical rule with a §3-source citation. READ FIRST.
HANDOFF.md               Author-review checklist, ambiguities, maintenance.
```

## The recommendation engine (`recommend.js`)

`recommend({ ageMonths, riskIds, pcvDoses, ppsv23Doses, today })` is a **pure
function**. Returns:
- `recs` — array of rec objects (PCV and/or PPSV23 streams; Option A/B pairs for
  the peds at-risk rows).
- `hsct` — `{ title, coordinateFlag, recs[] }` advisory block, or `null`. Shown
  PROMINENTLY at the top of Results; standard `recs` still run and show below it.
- `pcv21Geo` — `{ note, citations }` serotype-4 advisory (adults offered PCV21), or `null`.
- `perDose` — `{ pcv:[...], ppsv23:[...] }` per-dose validation results.
- `meta` — `{ ageMonths, today, riskIds, pcvCount, ppsv23Count }`.

Each rec (from `rec()`): `{ vaccine, status, doseLabel, dueToday, earliestNextDate,
minIntervalDays, brands, note, advisory, citations }`.
**Status values:** `due | catchup | risk-based | shared-decision | complete |
not-indicated | deferred`.

### Design rule (ported from vaxapp/MeningoVax): all clinical logic in the engine
Product validity, the PCV15→PPSV23 vs PCV20/PCV21-complete distinction, the
prior-vaccine matrix, and the PCV7-not-counted rule are computed HERE. The UI
consumes pre-built recs. Do NOT re-derive clinical logic in components.

## Counting policy (CRITICAL — `validate.js`)
- **PCV7 NEVER counts** (ACIP/immunize.org). It is recorded with status
  `noncounting` and dropped from the `effective` list — high-risk patients are
  treated as PCV-naïve. Do NOT add PCV7 to the count.
- **PCV13/PCV15/PCV20 count.** PCV21 counts for ADULTS only.
- **PCV21 recorded for a child (<19y) → INVALID** (dropped). PCV21 is adults-only.
- Min-age below the product floor → INVALID. Dateless doses use current age as an
  upper bound on age-at-administration (a past dose can't have been given later
  than today), mirroring MeningoVax.
- **Unknown/undocumented history → treat as unvaccinated.**

## Product type semantics (CRITICAL)
- **A series containing PCV20 (any age) or PCV21 (adults) ⇒ complete, no PPSV23.**
- **PCV15 (without a later PCV20/21) ⇒ a PPSV23 follow-up is required to complete.**
- PCV13 alone does not complete; the residual dose comes from the matrix.
These are encoded as `completesSeries` / `requiresPPSV23` flags in `brands.js` and
enforced in `recommend.js`. Never contradict them in a new branch.

## Interval rules
- Peds (p2016 Table 1): <12mo → 4 weeks; ≥12mo → 8 weeks; final/booster ≥12mo.
- Peds at-risk (Table 4, ≥24mo): all ≥8 weeks; IC rows add a ≥5-year step.
- **Adult PCV15→PPSV23 interval is risk-class-keyed:** IC / cochlear implant /
  CSF leak → ≥8 weeks; non-IC chronic only → ≥1 year. `adultPpsvIntervalClass()`
  in `riskFactors.js` is the single source — cochlear/CSF return 'short' (IC).
- PCV13→PCV20/21 = ≥1 year; PCV13+PPSV23→PCV20/21 = ≥5 years.

## Risk classes (`riskFactors.js`)
- `IC` — immunocompromising (asplenia/SCD, immunodeficiency, immunosuppression,
  HIV, solid-organ transplant, advanced CKD/dialysis/nephrotic).
- `special` — cochlear implant, CSF leak. **IC interval** (≥8wk) for adults but
  the **non-IC row** in p2016 Table 3 for the peds grid. `pedsRiskRowClass()`
  maps them to nonIC; `adultPpsvIntervalClass()` maps them to short.
- `nonIC` — chronic heart/lung/liver, diabetes, chronic CKD, alcohol, smoking
  (last two adultOnly).
- `hsct` — advisory pathway (no calendar dates).
- **IC precedence over non-IC** when both present (helpers enforce this).

## HSCT — design rule (advisory, no dates)
The app does NOT capture an HSCT date. The HSCT pathway is informational:
- `dueToday: false`, no `earliestNextDate`; timing lives in `note` ("≥6 months
  after HSCT"). `advisory: true`.
- Shown prominently at the TOP of Results; standard recs still shown below.
- "Coordinate with transplant/ID team — your center may use its own protocol."
- **Peds <19y HSCT = p2016 Table 5 SOLE source** (4 doses PCV20; PCV15+PPSV23 or
  +PCV15-with-GVHD fallback). Do NOT pull peds HSCT from CDC child notes.
- **Adult ≥19y HSCT = Fred Hutch LTFU SOLE source** (PCV20 ×3 at ≥6/≥8/≥10mo,
  no PPSV23, titer-guided: baseline + after each dose, ≥15/20 serotypes = stop).
  Institution-specific, NOT ACIP — say so.

## PCV21 (`mmwr7336a3`)
- Adults ≥19y only (`childOk:false`, `minAgeM:228`).
- Geographic advisory (lacks serotype 4) surfaced via `pcv21Geo` when PCV21 is
  offered — advisory note, not a hard block.

## Vaccine guidance priority
**Always use ACIP/CDC/immunize.org over FDA package inserts.** Sources are listed
at the top of `recommend.js`, in `refs.js`, and fully in `CLINICAL_SPEC.md`.

## Testing
- `npm test` = `vitest run`. Logic tests in `src/logic/__tests__/`; wizard render
  tests in `src/components/__tests__/App.test.jsx`.
- Current count: **78 tests, 3 files**. At least one test per CLINICAL_SPEC §
  sub-section (every p2016 Table 4 row, both HSCT pathways, every adult history
  branch × interval, PCV7-ignored, PCV21 geo, multi-condition precedence).
- When changing a rule: update `CLINICAL_SPEC.md`, the engine, and the test.

## Deployment / forking
1. Match `base: '/<repo-name>/'` in `vite.config.js` to the repo name.
2. Push to `main`. 3. Repo → Settings → Pages → Source → GitHub Actions.

## Not a substitute for clinical judgment
Decision support only. Verify against current ACIP/CDC guidance before administering.

## Session 2 changes (2026-06-07)

1. **History step redesign** — removed the Yes/No toggle with auto-add. Both the PCV
   and PPSV23 sections are always visible with `+ Add PCV dose` / `+ Add PPSV23 dose`
   buttons; no rows are pre-populated. A "No previous doses (clear all)" link appears
   when any doses exist. (`StepHistory.jsx`)

2. **Engine bug fixed — adult `pcvAdult()` PPSV23-only branch.** Condition changed from
   `if (ppsvGiven && !pcv.count)` to `if (ppsvGiven && !pcv.hasPCV13 && !pcv.hasPCV15)`.
   Previously a patient with an unknown-product PCV + PPSV23 fell through to the
   "no history" note and saw "PCV15 followed by PPSV23 ≥1y later" even though PPSV23
   was already given. (`recommend.js`)

3. **PCV21 (Capvaxive) age gate: 19y → 18y.** Per ACIP MMWR mm7336a3 the recommendation
   is ≥18y; the initial 228-month (19y) floor was an error. Updated in `brands.js`
   (`minAgeM` 228→216), `validate.js` (`Y18_MONTHS`), `recommend.js` (`M.y18`), and
   `StepHistory.jsx` (`isAdult` gate). The Capvaxive manufacturer site also confirms 18+.

4. **Icon** — lung silhouette replaced with a syringe in PneumoVax forest-green
   (`#3a5a40`), matching MeningoVax's shield/syringe style but distinctly green.

5. **HSCT doseLabel full text.**
   - Child HSCT: "4 doses of PCV20, beginning 3–6 months after HSCT: give 3 doses
     4 weeks apart, then a 4th dose at least 6 months after dose 3 and at least
     12 months after HSCT".
   - Adult HSCT: "PCV20 ×3: at ≥6 months, ≥8 months, and ≥10 months after HSCT
     (no PPSV23)".

6. **Advisory alert banners.** HSCT block and PCV21 geo note converted from RecCard
   style to colored alert banners. HSCT: amber background, amber left-border, "⚠ Advisory"
   header; standard age-based recs collapsed by default under a `<details>` toggle
   "Standard age/history schedule (reference — applies after completing the HSCT series
   above)". PCV21 geo note: blue info banner.

7. **Results: "Recorded doses ▾" button.** In the header chip bar next to "Adjust age ▾".
   Expands an inline editing panel (same pattern as the age editor) showing existing doses
   with product/date/remove controls and + Add buttons. Count shown in the button label
   when doses exist. Opening one panel closes the other.

8. **Results: "← Edit history" back button.** At the bottom of Results; calls `onBack()`
   to return to step 2 (History). Wired in `App.jsx`.

Tests: **78 passing**. Actions versions left at `@v6` (checkout/setup-node/configure-pages),
`upload-pages-artifact@v5`, `deploy-pages@v5` — verified working on the sibling MeningoVax repo.

## Session 3 changes (2026-06-07) — CDC PneumoRecs cross-check + age-band model

Validated the engine against the CDC PneumoRecs VaxAdvisor web tool (independent
oracle). All enterable adult + peds cases now align. Five fixes; **82 tests pass**.

1. **Adult PCV13+PPSV23 shared-decision is date-driven, not current-age.**
   `recommend.js` (`pcv.hasPCV13 && ppsvGiven` branch) computes age-at-PPSV23 from the
   PPSV23 dose date; shared-decision applies only when PPSV23 was given at age ≥65
   (CDC adult notes). The old current-age≥65 proxy remains ONLY as a fallback when the
   PPSV23 dose is undated. Fixes the case "70yo, PPSV23 at 60 → firm recommendation."

2. **PCV minimum age = ACIP 6 weeks, not the 2-month routine start.** `brands.js`
   exports `PCV_MIN_AGE_M = 42 / 30.4375` used by PCV7/13/15/20. Previously `minAgeM:2`
   rejected a dose given at the routine 2-month visit (56–62 days < 60.9), dropping the
   first dose of every infant series. `validate.js` `fmtMinAge` renders sub-2-month
   minimums in weeks.

3. **Age-banded dose counts (`summarizePcv`).** The PCV summary now computes
   `band = { before12, m12to23, m24to71, ge72, undated, before24, ge24 }` from the dose
   dates the app already stores — the same age-band model CDC PneumoRecs uses. Replaces
   total-count heuristics in the peds branches. **Undated-dose policy:** undated doses
   fold into `before24` (assumed infant) but never into `ge24` (never ASSUME a ≥24mo
   catch-up); an undated PCV20 keeps "benefit-of-the-doubt" completeness, while a PCV20
   DATED in infancy does not complete a healthy series.

4. **Healthy-child completeness is age-appropriate, not "has any PCV20."** A single
   PCV20 given in infancy no longer marks a healthy 24–59mo child complete (that shortcut
   is an adult rule). Complete iff full infant series (≥4 incl. a ≥12mo booster), OR a
   dose at ≥24mo, OR an undated completing dose. NOTE: at-risk Row 3 intentionally keeps
   "≥1 PCV20 at any age → complete" (confirmed correct vs PneumoRecs).

5. **At-risk peds fixes.** (a) 24–71mo catch-up is 2 doses regardless of prior infant
   doses (CDC: "<3 PCV by 24mo → 2 doses"); progress counts only doses at ≥24mo
   (`band.ge24`). (b) Rows 8/9 now honor a prior PPSV23: non-IC PCV13(≥6y)+PPSV23 →
   complete; IC keeps the ≥5-year recurring PCV20-or-2nd-PPSV23 step (p2016 Table 4 row 9).

**HSCT:** confirmed PneumoRecs has NO HSCT pathway (CDC schedule notes give no HSCT
pneumococcal schedule; HSCT absent from the tool's condition list). PneumoVax's HSCT
advisory (peds = p2016 Table 5; adult = Fred Hutch LTFU) is intentional additive guidance.

**PneumoRecs input model (for future comparison):** adults bucketed (<19 / 19–49 / ≥50,
no exact age); adult risk a single yes/no (no IC sub-class; suppressed for ≥50); peds use
age-banded dose counts + two risk buckets (chronic vs IC, cochlear/CSF under chronic).
Cannot represent an unknown-product PCV or PCV7. Reproducible case harnesses live in
`scratch/{adultCases,pedsCases,hsctCases}.mjs` (dev-only, not part of the build).

## Session 4 changes (2026-06-07) — Completed-series at-risk 24–71mo fix (CDC-aligned)

**Bug fixed in `src/logic/recommend.js`:**
The 24–71mo at-risk catch-up branch lacked a series-completion guard. A child who had
already completed the full 4-dose infant series was offered a 5th plain PCV dose instead
of the CDC-recommended Option A (PCV20) / Option B (PPSV23) path.

**The fix:** `if (am < M.m72 && pcv.count < 4)` — the `pcv.count < 4` gate means children
with a completed 4-dose series fall through to the rows-4/5 Option A/B block (PCV20 or
PPSV23 ≥8 weeks after the most recent PCV), matching
`https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo`.

**Found by:** cross-checking against the vaxapp engine, which was independently aligned to
the CDC rule in the same session. The two engines now agree on this scenario.

**Verification:**
- 60mo asplenia with 4×PCV15 (completed infant series) → "Option A: PCV20 / Option B: PPSV23" ✓
- Incomplete cases P11 (→2 doses), P12 (→1 dose), P20 (→2 doses) → unchanged ✓

**Tests:** 82 passing (no new tests needed — the completed-series path is exercised by the
existing P-series cases in `recommend.test.js`).

## Session 5 changes (2026-06-12) — Boundary cluster + infant/at-risk engine fixes (REVIEW_FINDINGS.md)

Addressed all 10 items from the external audit `REVIEW_FINDINGS.md` (PR #2). Fixes mirrored
into vaxapp (the pneumococcal logic consumer). **108 tests passing** (was 82).

### Two-concept boundary separation (H1–H4) — the central fix
The engine had a single `216` constant overloaded for two unrelated gates. Split into a new
`src/logic/scheduleConstants.js` with **two named constants — never collapse them**:
- **`ADULT_SCHED_MIN_M = 228` (19y)** — the adult-vs-peds SCHEDULE routing boundary. Governs
  the adult prior-vaccine matrix, `hsctAdvisory` (peds 4-dose PCV20 Table 5 vs adult 3-dose
  Fred Hutch protocol), `recommend()` dispatch, `format.js` ageGroup, StepAge "Adult" chip,
  and the StepRisks `adultOnly` risk gate. Patients aged 18 now correctly use the
  child/adolescent rulebook (incl. the IC ≥5-year 2nd-PPSV23 step).
- **`PCV21_MIN_AGE_M = 216` (18y)** — the PCV21 (Capvaxive) PRODUCT min-age only. PCV21 may
  be offered/validated from 18y per FDA label / mm7336a3, independent of the schedule
  boundary. Used by `validate.js` and `data/brands.js`.

`recommend.js` `M.y18` now imports `ADULT_SCHED_MIN_M` (= 228). `validate.js` and `brands.js`
use `PCV21_MIN_AGE_M` for the PCV21 gate. StepRisks imports the shared constant (was a
hardcoded 228 that disagreed with the engine's 216 — the original drift). `CLINICAL_SPEC.md`
§I + Products table reconciled to PCV21 ≥18 with the two-concept distinction documented.

### Infant / at-risk engine fixes
- **H5** — `boosterGiven` keyed off the patient's *current* age (`am >= M.m12`), so an infant
  with 4 doses all given <12mo was wrongly "complete". Now uses band counts
  (`band.m12to23 + band.ge72 + band.undated >= 1`), matching `completedInfantSeries`.
- **M1/M3** — infant catch-up `target` recomputed by current-age band so the impossible
  "PCV dose 4 of 3" label is gone and an infant with one early dose shows the correct
  remaining count.
- **M2** — at-risk 24–71mo child with a single PCV20 was returned "complete" by the Row-3
  `includesCompleting` shortcut. Now requires an age-appropriate count (`enoughAt24mo`)
  before declaring complete; a lone PCV20 yields "dose 2 of 2". Mirrored into vaxapp.
- **L1** — `format.js` age-group threshold raised `am < 120` → `am < 132` so a 10-year-old is
  "Child", not "Adolescent"; StepAge chip bounds updated to close the 120–131mo gap.
- **L2** — duplicated `dateUtils.js` / `Stepper.jsx` (byte-identical across
  PneumoVax/MeningoVax/vaxapp — root cause of the 216/228 drift) annotated with
  cross-reference sync comments. **Open follow-up:** extract to a shared package.

### Tests
New `src/logic/__tests__/regression-boundary-and-fixes.test.js` (26 tests) covering all 9
required scenarios, incl. 18y0m / 18y6m / 19y0m boundaries across engine, validator, and the
StepRisks adult-only gate. Total 108 passing.
