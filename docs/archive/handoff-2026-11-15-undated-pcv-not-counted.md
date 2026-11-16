# Handoff: undated PCV dose is NOT counted (owner decision 2026-11-15). Build NOT started

Supersedes nothing in PneumoVax (`handoff-2026-11-15-meningovax-stop-c-answered.md` still governs the
MeningoVax port). Branch `feat/2026-11-15-undated-pcv-not-counted` (local, not pushed). Baseline on
`main` 36e7cc6: **2,534 passed, 0 failed** (measured this session).

## The decision (asked with worked patients, answered "Not counted (Recommended)")
An undated **PCV** dose does not count; the card plans as if it was never given. An undated **PPSV23**
still counts (CDC's own exception). Sources were re-read live 2026-11-15 in the browser pane:
- CDC Best Practice, Timing and Spacing (updated 2024-07-24): *"With the exception of influenza vaccine
  and PPSV23, providers should only accept written, dated records as evidence of vaccination"*.
- CDC adult notes: *"...or whose previous vaccination history is unknown: 1 dose PCV15 or 1 dose PCV20 or
  1 dose PCV21."* (already `refs.js`, line ~201).
Patients shown: Ruth 65 healthy PCV20 undated (Complete → PCV20/21 today); Omar 3 healthy one undated
PCV20 (Complete → 1 catch-up); 30y diabetes undated PCV15 (PPSV23 → PCV). Memory: `undated-pcv-not-counted`.

## Done
- Failing test committed: `src/logic/__tests__/regression-2026-11-15-undated-pcv-not-counted.test.js`
  (7 tests; 6 fail on main as intended; the PPSV23 one should pass. Note an undated PPSV23 row needs
  `detailsUnknown: true` or `dropBlankDoseRows` removes it).

## Not done: the planned build
1. `validate.js` `validateOnePCV`, the `if (!dose.date)` branch after the too-young check: return
   `{ ...noncounting([withMarker(LINE, cites)], cites), noDate: true, whys: [WHY] }`, cites =
   `[cite('gbpWrittenDatedRecords')]`. `stepStream`'s `noncounting` branch already drops it from `kept`
   and does not anchor. Keep the too-young-today branch as is.
2. Add `gbpWrittenDatedRecords` to `refs.js` (copy MeningoVax's entry; add `rulebook: 'any'` and a
   `population` for every group, per the every-quote-names-its-patient guard).
3. `doseDisposition.js`: `if (v.noDate) return 'no-date'` before the `noncounting` → `pcv7` line.
   `doseChipLabel.js`: `'no-date'` → `'Not counted — no date'` (the wording in the option she chose;
   flag in the PR as a new label in the closed §M list), class `dose-val-unknown`.
4. `recommend.js` `pcv7LineOnce`: skip `d.noDate` rows so every undated dose keeps its line.
5. Now dead and to remove, with tests: `extraDoseUnverified` / "Check the date — none recorded" (PCV
   undated extra), `band.undated` / `hasUndatedCompleting` / `undatedAsInfant` paths in `recommend.js`
   (PCV only), rulebook.js examples `dateUnknown`, `undatedExtra`. 30 test files mention undated.
6. The DoseEditor "dose given, date and product unknown" tick now yields "not counted" for PCV
   (consistent with CDC's "unknown history" sentence); say so in the PR.
7. `CLINICAL_SPEC.md` new §A-UNDATED and fix §B (line ~870) and §K (~3135); `docs/agent/clinical-rules.md`.
8. Full suite, `sweep:update` only with the reason (grid has 0 undated patients, so expect 0 moved;
   prove with the prose diff), check Ruth and Omar in the running app, PR via the `ship` skill.
