# PneumoVax — Claude Code Guidance

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
