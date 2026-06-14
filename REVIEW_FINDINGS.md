# PneumoVax — Code Review Findings & Implementation Brief

**Generated:** 2026-06-11 · **For:** an implementing agent · **Scope:** this repo only.
**Status:** review/handoff document — no code has been changed.

## How to use this doc
Each finding has an ID, severity, exact `file:line`, evidence, clinical impact, a concrete fix,
and a test. Items marked **✓verified** were confirmed by hand against the source. **Read
`CLINICAL_SPEC.md` first** — it is the cited authority (§A–§K) the engine implements against, and
several findings are the code disagreeing with that spec.

> **Context:** PneumoVax is the **best-engineered** of the five apps — the data layer (product
> flags, risk classes, PCV7-not-counted, the risk-class-keyed adult interval) and the adult
> matrix faithfully implement the spec and are well-tested. The issues cluster in (a) the
> infant 2–23mo engine using current age/total counts instead of the age-banded data it already
> computes, and (b) an adult-boundary constant moved to 18y in the engine while the spec/UI keep
> 19y. **Sync note:** this engine is the pneumococcal reference for `vaxapp`; mirror fixes there
> (vaxapp is currently far behind — see its `REVIEW_FINDINGS.md` C1/C2/§Cross-app).

---

## P1 — High

### H1 · Adult/peds boundary is 18y (216mo) in the engine but 19y (228mo) in the spec/UI ✓verified
- **Where:** `src/logic/recommend.js:35` (`y18: 216`) and `:691` (`} else if (am < M.y18)`)
- **What:** The engine routes anyone <216mo to the peds branch, so a patient **18.0–18.99y (216–227mo)** is sent to `pcvAdult()`. `CLINICAL_SPEC.md` is explicit and consistent that peds is "24 mo–18 y" (§C/§D) / "<19 y" (§E) and adult is "≥19 y" (§F, §G "19–49"). `format.js` and the StepAge chips still use 228 (19y). The Session-2 change that lowered PCV21's product min-age to 18 appears to have also moved this whole-schedule routing constant, conflating two different things.
- **Impact:** An 18-year-old with an immunocompromising condition (asplenia/SCD) gets the **adult** prior-vaccine matrix instead of p2016 Table 4 — dropping the peds IC ≥5-year recurring 2nd-PPSV23 step — and is offered PCV21 (spec: ≥19 only).
- **Fix:** Introduce one shared schedule-boundary constant (e.g. `ADULT_MIN_M = 228`) used by `recommend()`, `hsctAdvisory()`, and `pcv21GeoNote()`. Keep PCV21's **product** min-age separate from the **schedule** boundary. Decide the authoritative value and reconcile `CLINICAL_SPEC.md` either way.
- **Test:** 18y6m + asplenia → peds Table 4 Option A/B path (not the adult branch); 18y6m → PCV21 not offered (if 19y boundary is chosen).

### H2 · 18-year-old HSCT patient gets the adult (3-dose, non-ACIP) protocol instead of peds (4-dose) ✓verified-by-inspection
- **Where:** `src/logic/recommend.js:622–654` (`hsctAdvisory`, `const adult = am >= M.y18`)
- **What:** Same 216mo boundary. CLINICAL_SPEC §E (peds <19y = p2016 Table 5, **4 doses PCV20**, SOLE source) vs §F (adult ≥19y = Fred Hutch LTFU, **PCV20×3**, institution-specific, titer-gated, **not ACIP**). An 18.0–18.99y HSCT patient is handed the adult schedule.
- **Impact:** An 18yo post-HSCT patient gets a 3-dose non-ACIP titer-gated series instead of the spec-mandated 4-dose pediatric series.
- **Fix:** Gate on the same corrected boundary constant as H1.
- **Test:** 18y6m + HSCT → child Table 5 (4× PCV20) advisory.

### H3 · Three different "adult" thresholds (216 vs 228) across engine/validator/UI
- **Where:** `recommend.js:35` (216) · `validate.js:35` `Y18_MONTHS=216` · `format.js:39–41` (228) · `StepRisks.jsx:14` (`>=228`) · `StepHistory.jsx:11` (216) · `StepAge.jsx`/`Results.jsx`
- **What:** Engine routing + PCV21 gate + dose editors use 216; `ageGroup`, the StepAge "Adult" chip, and StepRisks' `adultOnly` gate use 228. For a 216–227mo patient: the engine runs `pcvAdult` but the header labels them "Adolescent (11–18y)"; **StepRisks hides adult-only risks (smoking, alcohol)** because its gate is `>=228`, so an 18-year-old smoker can't select smoking even though the engine would honor it.
- **Impact:** An 18yo with an adult-only risk and no other indication can't enter that risk → the tool may output "not indicated" when the engine, given the input, would recommend a dose; the displayed age group also contradicts the pathway used.
- **Fix:** Single shared `ADULT_MIN_M` imported everywhere (engine, validator, `ageGroup`, StepAge chips, StepRisks `adultOnly`, StepHistory/Results PCV21 visibility); keep product-specific `minAgeM` separate.

### H4 · PCV21 offered/validated at ≥18y, contradicting the spec's ≥19y rule
- **Where:** `src/data/brands.js:103` (`minAgeM:216`); `validate.js` `Y18_MONTHS=216`; StepHistory/Results gate at `>=216`
- **What:** `CLINICAL_SPEC.md` (Products table, §I) says "PCV21 … adults ≥19 only / Not for children (<19y)". CLAUDE.md/HANDOFF Session-2 recorded an **intentional** 19→18 change (citing mm7336a3/manufacturer ≥18), but `CLINICAL_SPEC.md` was never updated, so code and the cited authority disagree (and CLAUDE.md still shows the old `minAgeM:228`).
- **Impact:** An 18yo may be recommended PCV21, which the app's own authority restricts to ≥19. (Note: this is partly a **doc-reconciliation** decision — Capvaxive's FDA label is ≥18 but ACIP frames adult pneumo at ≥19. Pick one and make spec + code + docs agree.)
- **Fix:** Reconcile to a single source of truth: update `CLINICAL_SPEC.md` §I + Products table (and CLAUDE.md) to ≥18, **or** restore the product/validator gate to 228. Keep this product gate distinct from H1's schedule boundary.

### H5 · Infant series marked complete without a real ≥12-month booster dose ✓verified
- **Where:** `src/logic/recommend.js:168` (`boosterGiven = pcv.products.length > 0 && am >= M.m12 && prior >= target`)
- **What:** Completeness keys off the patient's **current age ≥12mo**, not that any dose was administered at ≥12mo. `summarizePcv` already computes `band.m12to23`/`band.ge72` (doses given at ≥12mo) but they're unused here. Trace: am=13mo, 4 PCV20 at 2/4/6/9mo → `prior=4`, `target=4`, `boosterGiven=true` → status "complete," though no dose was ever given at ≥12mo (CLINICAL_SPEC §A: "dose 4 not before 12 months").
- **Impact:** A 12–15-month-old who got 4 infant doses but none at ≥12mo (e.g. accelerated 2/4/6/9 schedule) is told the series is complete and the true booster is omitted → under-immunized.
- **Fix:** `boosterGiven = (pcv.band.m12to23 + pcv.band.ge72) >= 1 && prior >= target` (optionally give an undated dose benefit-of-the-doubt to match the existing undated policy).
- **Test:** am=13mo, 4 dated PCV20 all <12mo → **not** complete (booster still owed); am=13mo with a ≥12mo dose → complete.

---

## P2 — Medium

### M1 · Infant catch-up dose target ignores age-at-prior-dose (undercounts by one)
- **Where:** `src/logic/recommend.js:164` (`target = am < M.m7 ? 4 : am < M.m12 ? 3 : Math.max(2, Math.min(4, prior + 1))`)
- **What:** Target uses current-age band + raw prior count; never consults whether prior doses were before/after 7 or 12mo, which CLINICAL_SPEC §A makes outcome-determining. §A "12–23mo: 1 dose before 12mo → 2 more" but code (am=13, prior=1) → target=2 → only 1 more, labeled "dose 2 of 2." §A "7–11mo: 1–2 before 7mo → 2 more" but (am=9, prior=2) → target=3 → only 1 more.
- **Impact:** An infant with a single early-infancy dose (or two before 7mo) is shown a series total one dose short; a clinician trusting the total could stop early.
- **Fix:** Use `band.before12` to set the target per §A (compute remaining from age-at-prior, not raw count).
- **Test:** am=13mo, 1 dose dated at 2mo → "2 more doses" (target 3), not "dose 2 of 2."

### M2 · Single PCV20 marks a 24–71mo at-risk child complete (skips Row-1 2nd dose)
- **Where:** `src/logic/recommend.js:262` (`if (pcv.includesCompleting) … 'complete'` before the 24–71mo catch-up block)
- **What:** Returns "complete" for **any** history containing PCV20/PCV21. CLINICAL_SPEC §D Row 3 scopes that shortcut to a child who "completed series before 6y including ≥1 PCV20." For an at-risk 24–71mo child whose only dose is a single PCV20 (Row 1: incomplete → 2 doses ≥8wk apart), one PCV20 is dose 1 of 2.
- **Impact:** A 24–71mo at-risk child (asplenia/SCD) with one PCV20 dose is told no further doses are needed → second at-risk catch-up dose omitted.
- **Fix:** Require an age-appropriate count (e.g. `pcv.count >= 2`) in addition to `includesCompleting`, or fall through to Rows 1/2 when <72mo with <2 PCV doses so a lone PCV20 yields "dose 2 of 2." (Re-confirm against CDC PneumoRecs, since the Session-3 note claims the "≥1 PCV20 → complete" Row-3 shortcut was validated there.)

### M3 · Infant path labels the booster "PCV dose 4 of 3"
- **Where:** `src/logic/recommend.js:164` + `:190` (`doseLabel: \`PCV dose ${doseNum} of ${target}\``)
- **What:** For am∈[7,12) target=3; a child with 3 doses (2/4/6mo) now 8–9mo still needs the 12–15mo booster → `prior=3, target=3, doseNum=4` → "PCV dose 4 of 3." Timing is correct (deferred to 12mo); the printed count is impossible. Existing test asserts only `dueToday===false`, so it passes while emitting the bad label.
- **Fix:** Treat any child with ≥3 prior infant doses as a 4-dose series (target=4 → "dose 4 of 4"), or relabel the final booster explicitly ("PCV booster (≥12 months)").

---

## P3 — Low / cleanup
- **agegroup-10y-mislabeled-adolescent** (`src/logic/format.js:37–40`): `if (am < 120) 'Child (2–10y)'; if (am < 228) 'Adolescent (11–18y)'` → a 10-year-old (120–131mo) is labeled "Adolescent," and the StepAge chips leave 120–131mo uncovered. Use consistent inclusive boundaries (Child <132) and close the chip gap. *(Same bug exists in MeningoVax — fix both.)*
- **cross-app-duplication-meningovax** (`src/logic/dateUtils.js`, `src/components/Stepper.jsx`, `format.js`, `RecCard.jsx`): `dateUtils.js` and `Stepper.jsx` are byte-identical to MeningoVax; `format.js`/`RecCard.jsx` near-identical. This duplication already caused the 216-vs-228 drift here. Extract the domain-agnostic pieces (date math, Stepper, age formatter) into a shared package consumed by PneumoVax/MeningoVax/vaxapp; at minimum add a cross-reference comment. *(See the portfolio note in vaxapp's doc.)*

---

## Verification for this repo
- `npm install && npm test` (currently ~82 tests). Add a test per fix; CLINICAL_SPEC.md asks for at least one test per § sub-section.
- For H1–H4 (the boundary cluster), add tests at the 18y0m / 18y6m / 19y0m boundaries across the engine, validator, and the StepRisks adult-only gate.
- After fixing, **mirror the relevant pneumococcal logic into vaxapp** (or extract a shared engine) and add a cross-app fixture asserting the two agree — this is the sync step that has been lossy.
- Manual smoke (`npm run dev`): 18y6m asplenia (routing), 13mo with 4 sub-12mo doses (booster still owed), 30mo asplenia with one PCV20 (expect dose 2 of 2).
