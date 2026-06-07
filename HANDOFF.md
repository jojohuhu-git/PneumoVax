# PneumoVax — Handoff & Author Review

Built 2026-06-06 from `PneumoVax_BUILD_PROMPT.md`, mirroring MeningoVax's
architecture. **Not committed, not pushed** — awaiting author review before deploy.

## Status
- `npm test` → **78 passing** (3 files: recommend 57, validate 12, App 9).
- `npm run build` → **clean** (45 modules; ~186 kB JS / ~13 kB CSS).
- Dev server runs on `/PneumoVax/` with no console errors (verified via curl +
  headless happy-dom full-app render across infant / adult-IC-PCV15 / HSCT flows).

## Where immunize.org was used vs CDC
| Topic | Primary source used |
|---|---|
| Routine infants 2–23mo (Table 1 grid) | **immunize.org p2016** Table 1, cross-checked with CDC child notes |
| Healthy 24mo–18y (Table 2) | **immunize.org p2016** Table 2 + CDC catch-up job aid |
| At-risk 24mo–18y (Table 4 rows 1–9) | **immunize.org p2016** Table 4 (verbatim grid) + CDC child notes |
| IC vs non-IC condition lists (Table 3) | **immunize.org p2016** Table 3 |
| **Peds HSCT (<19y)** | **immunize.org p2016 Table 5 — SOLE source** (NOT CDC child notes, per build rule) |
| PCV7-not-counted | **immunize.org Ask the Experts** (the named article) |
| Adult routine ≥50 + 19–49 risk matrix | **CDC adult schedule notes** + adult timing job aid + mm7401a1 |
| Adult intervals (≥1y vs ≥8wk) | **CDC adult notes** (IC/cochlear/CSF = ≥8wk; chronic = ≥1y) |
| PCV21 eligibility + serotype-4 geo note | **CDC MMWR mm7336a3** |
| ≥50 expansion (65→50, 2024-10-23) | **CDC MMWR mm7401a1** |
| **Adult HSCT (≥19y)** | **Fred Hutch LTFU §IX Tables IX.A1/A2 — SOLE source** |

CDC schedule notes are primary for routine + at-risk peds/adult logic; p2016 is
the detailed companion for the peds dose-count grids.

## CDC-vs-p2016 reconciliation (peds grids)
No conflicts found between p2016 and the live CDC child notes on the dose-count
grids. The CDC child notes summarize ("4-dose series at 2,4,6,12–15mo"; "1 dose
PCV for incomplete 24–59mo"; "≥8 weeks apart with sequencing by history") and
p2016 provides the exact per-row grids. p2016 was used to implement the grids;
CDC confirms the same numbers. **If a future CDC-notes update diverges, CDC wins.**

## HSCT sourcing confirmation
- **Peds <19y HSCT taken SOLELY from p2016 Table 5.** The engine's child-HSCT rec
  cites `p2016Table5` only. CDC child notes were NOT used for HSCT (per build rule
  — avoids the Hib-section mis-attribution trap).
- **Adult ≥19y HSCT taken SOLELY from Fred Hutch LTFU.** Confirmed verbatim from
  Tables IX.A1 (before-12-months schema) and IX.A2 (standard schema): Prevnar 20
  at >6m / >8m / >10m (= "≥6, ≥8, ≥10 months"), no PPSV23 in the adult row,
  footnote 8 (baseline IgG before PCV20) and footnote 9 (recheck 1–2mo after each
  dose; ≥15/20 serotypes = no further PCV20). Cited as institution-specific, not ACIP.

## Modeling simplifications (engine works on dose-COUNTS + product mix, not a full
## per-dose age timeline) — please confirm these are acceptable

1. **Infant catch-up (p2016 Table 1)** is reduced to a snapshot: doses-still-needed
   + next-dose min interval + the ≥12-month floor for the final/booster dose,
   rather than enumerating every remaining dose. Target-dose count is keyed off the
   current age band and prior count. This matches the sibling apps' snapshot model.
   It does NOT reproduce every age-at-prior-dose sub-case of Table 1 exactly (e.g.
   the precise "1 vs 2 doses before 7 months" branch differences) — it gives the
   correct next action and interval, which is the app's scope.

2. **Adult `PCV13 + PPSV23` shared-decision-by-PPSV23-age — RESOLVED 2026-06-07.**
   Previously modeled using the patient's **current age ≥65** as a proxy for "PPSV23
   given at ≥65." Comparison against CDC PneumoRecs VaxAdvisor found a true divergence:
   a 70yo whose PPSV23 was given at 60 was wrongly labeled `shared-decision` (the proxy
   fired on current age) when CDC's tool firmly recommends the additional PCV20/21.
   **Fixed in `recommend.js`** (`pcv.hasPCV13 && ppsvGiven` branch): age-at-PPSV23 is now
   computed directly from the patient's age + the PPSV23 dose date — **no new input was
   needed**, since the app already captures both. The current-age proxy remains only as a
   fallback when the PPSV23 dose is undated. Tests updated (recommend.test.js: the old
   proxy test split into three — <65→due, ≥65→shared, undated→proxy). 80 tests pass.

3. **Peds at-risk rows 4/5 vs 8/9 disambiguation.** The app can't see the age at
   which historical PCV doses were given, so it infers:
   - ≥3 counting PCV doses → "completed series before age 6 with PCV13/15" (rows 4/5)
   - 0 counting PCV → "no prior PCV" (rows 6/7)
   - 1–2 counting PCV → "PCV13 only at/after age 6" (rows 8/9)
   This is a reasonable reading but is heuristic. A clinician entering exact dose
   ages would let us branch precisely. **Confirm the heuristic**, or add per-dose
   age capture.

4. **"Completed any PCV schedule by 24mo"** (Table 2 / Table 4 row 3) is
   approximated as ≥4 counting PCV doses OR any PCV20 in history. A child with a
   complete-but-fewer-than-4 all-PCV15/20 series is still handled (PCV20 → complete;
   4 doses → complete), but an unusual valid 3-dose completion recorded without
   PCV20 would be treated as needing a catch-up dose (the safe/protective reading).

## Clinical ambiguities flagged for review (most-protective reading used)
- **PPSV23 for healthy children getting a PCV15 catch-up dose (24–59mo, Table 2):**
  the engine does NOT auto-recommend PPSV23 for a *healthy* child who receives
  PCV15 as the single catch-up dose — PPSV23 is risk-based, not routine for healthy
  children. The PCV note mentions this. Confirm this is the intended reading.
- **PCV15→PPSV23 step for the 24–71mo at-risk rows (Table 4 rows 1–2):** surfaced
  in the PCV rec's note ("if PCV15 is used, add PPSV23 ≥8 weeks later") rather than
  as a separate dated PPSV23 card, because the follow-up only applies if PCV15
  (not PCV20) is the chosen product, which the app doesn't yet capture as a forward
  selection. Confirm acceptable.

## Recurring maintenance
- **PCV product landscape & adult age threshold** shift over time (PCV21 added
  2024; routine age lowered to 50 in 2024). Re-verify `brands.js`, the adult
  matrix, and the ≥50 threshold against CDC adult notes annually.
- **Fred Hutch LTFU guideline** is institution-specific and versioned — re-fetch
  and confirm the adult-HSCT schedule if the LTFU PDF is updated.
- All source URLs are in `src/data/refs.js`; full rule→source map in `CLINICAL_SPEC.md`.

## Stop condition met
Built, tested (green), built clean, spot-checked. **Did NOT commit or push.**

---

## Session 2 (2026-06-07) — history UX redesign, PCV21 18y, editable Results

Branch: `main`. This is the **first commit/push** of PneumoVax to GitHub Pages.

### Status
- `npm test` → **78 passing** (3 files).
- PCV21 age gate corrected: **was 19y, now 18y** per ACIP MMWR mm7336a3; the
  Capvaxive manufacturer site also confirms 18+. Updated in `brands.js`
  (`minAgeM` 228→216), `validate.js`, `recommend.js`, `StepHistory.jsx`.
- **Engine bug fixed:** an unknown-product PCV combined with PPSV23 previously showed
  the wrong "PCV15 followed by PPSV23 ≥1y later" note. The adult `pcvAdult()`
  PPSV23-only branch now keys off `!pcv.hasPCV13 && !pcv.hasPCV15` instead of `!pcv.count`.
- **History UX redesign:** no auto-add on a Yes/No toggle; both PCV and PPSV23 streams
  start empty with explicit + Add buttons and a "No previous doses (clear all)" link.
- **Advisory banners:** the HSCT advisory is prominently displayed (amber alert banner,
  "⚠ Advisory" header); standard age/history recs are collapsed under a `<details>`
  toggle when HSCT is active. The PCV21 geographic note is a blue info banner.
- **Results editing:** "Recorded doses ▾" button on the Results page allows live dose
  editing (product/date/remove + Add) without starting over; "← Edit history" back
  button returns to the History step.

### Deployment
First push to `https://github.com/jojohuhu-git/PneumoVax`. GitHub Actions workflow
(`.github/workflows/deploy.yml`) uses `actions/checkout@v6`, `actions/setup-node@v6`
(Node 22), `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`,
`actions/deploy-pages@v5` — the same set that deploys successfully on MeningoVax.

---

## Session 3 (2026-06-07) — CDC PneumoRecs cross-check + bug fixes (NOT committed)

Validated PneumoVax against the CDC PneumoRecs VaxAdvisor web tool as an
independent oracle. User drove PneumoRecs manually; PneumoVax run via
`scratch/adultCases.mjs` (A01–A20) and `scratch/pedsCases.mjs` (P01–P20).

**Result: all enterable adult + peds cases now align with PneumoRecs.**

Bugs found and fixed (5 surfaces / engine each verified, 82 tests pass):

1. **A15 — PCV13+PPSV23 shared-decision proxy.** Used current-age≥65 as a proxy
   for "PPSV23 given at ≥65" → mislabeled a firm recommendation as shared-decision
   for a 70yo whose PPSV23 was at 60. Fixed: compute age-at-PPSV23 from the dose
   date (no new input needed); proxy only when the dose is undated. (`recommend.js`)
2. **PCV min age — rejected the routine 2-month dose.** `minAgeM:2` (routine start)
   vs ACIP's 6-week minimum; a 2-month-visit dose (56–62d) computed as <2mo and was
   dropped, undercounting every infant series. Fixed: `PCV_MIN_AGE_M = 42/30.4375`
   in brands.js for PCV7/13/15/20; `fmtMinAge` renders sub-2mo minimums as weeks.
3. **P09 — single PCV20 in infancy wrongly "complete" (healthy path).** The
   "any PCV20 → complete" shortcut is an adult rule; a healthy child needs the
   age-appropriate count. Fixed via age-banded completeness. (at-risk Row 3 keeps
   "≥1 PCV20 → complete" — confirmed correct by PneumoRecs P17.)
4. **P19 — rows 8/9 ignored prior PPSV23.** non-IC PCV13(≥6y)+PPSV23 should be
   complete; was re-recommending. Fixed (IC still gets the ≥5y recurring step).
5. **P20 — at-risk 24–71mo catch-up reduced by infant doses.** CDC: "<3 PCV by
   24mo → 2 doses regardless." Fixed via age bands (`band.before24`/`band.ge24`).

**Refactor:** `summarizePcv` now computes age-banded dose counts (before12 /
12–23 / 24–71 / ≥72mo, plus before24/ge24) from the dose dates PneumoVax already
stores — replacing total-count heuristics in the peds branches. Undated doses fold
into `before24` (assumed infant) and an undated PCV20 keeps "benefit of the doubt"
completeness. This is the model CDC PneumoRecs uses (age-band buckets).

**P18 confirmed CORRECT (no change):** IC child, PCV13 at/after 6y → PneumoVax
keeps the ≥5y recurring 2nd-PPSV23 step (p2016 Table 4 row 9); PneumoRecs omits it.
PneumoVax is the more complete of the two here.

**Structural notes on PneumoRecs (for future comparison):** adults are bucketed
(<19 / 19–49 / ≥50, no exact age); adult risk is one yes/no (no IC sub-class; risk
question suppressed for ≥50); peds uses age-banded dose counts + two risk buckets
(chronic vs immunocompromising, with cochlear/CSF under chronic — matches PneumoVax);
PneumoRecs cannot represent an unknown-product PCV (A19) and does not list PCV7.

Scratch harnesses (`scratch/*.mjs`) are uncommitted and not part of the build.
