# PneumoVax — Clinical Rules Reference

## Source Priority

**ACIP/CDC/immunize.org over FDA package inserts.** Sources are listed at the top of `recommend.js`, in `refs.js`, and with full citations in `CLINICAL_SPEC.md`. Update `CLINICAL_SPEC.md` when changing any rule.

## Key Sources by Topic

| Topic | Source |
|---|---|
| Routine infants 2–23mo (Table 1 grid) | immunize.org p2016 Table 1 + CDC child notes |
| Healthy 24mo–18y (Table 2) | immunize.org p2016 Table 2 + CDC catch-up job aid |
| At-risk 24mo–18y (Table 4 rows 1–9) | immunize.org p2016 Table 4 + CDC child notes |
| IC vs non-IC condition lists | immunize.org p2016 Table 3 |
| **Peds HSCT (<19y)** | **immunize.org p2016 Table 5 — SOLE source** (NOT CDC child notes) |
| PCV7-not-counted | immunize.org Ask the Experts |
| Adult routine ≥50 + 19–49 risk matrix | CDC adult schedule notes + mm7401a1 |
| Adult intervals | CDC adult notes (IC/cochlear/CSF = ≥8wk; chronic = ≥1y) |
| PCV21 eligibility + serotype-4 geo note | CDC MMWR mm7336a3 |
| ≥50 expansion | CDC MMWR mm7401a1 |
| **Adult HSCT (≥19y)** | **Fred Hutch LTFU §IX Tables IX.A1/A2 — SOLE source** |

## Pediatric Schedule

### Routine Infants (2–23m)
Standard 4-dose series at 2/4/6/12–15m. PCV min age = ACIP 6 weeks (`PCV_MIN_AGE_M = 42 / 30.4375`).

### Healthy 24m–18y Catch-Up (Table 2)
- 24–59m: 1 dose if healthy and ≥3 prior PCVs; 2 doses if <3 prior PCVs (only doses at ≥24mo count as catch-up progress)
- 60m–18y: 1 dose (PCV20)

### At-Risk 24m–18y (Table 4, `IC` or `nonIC` row)
See `CLINICAL_SPEC.md` §III for the full 9-row grid. Key invariants:
- IC row 3 (≥1 PCV20 at any age) → complete (correct per PneumoRecs)
- Completeness for non-IC at 24–71m requires age-appropriate count (`enoughAt24mo`), not just "has any PCV20"
- 24–71m catch-up counts only `band.ge24` doses toward progress (not infant doses)
- A completed 4-dose infant series → fall through to Option A (PCV20) / Option B (PPSV23), not a 5th plain PCV

### Peds HSCT (<19y) — Advisory Only
- 4 doses PCV20 at: 3 months / 4 months / 6 months / 12 months after HSCT
- Fallback: PCV15 ×4 + PPSV23, or PCV15 ×4 with GVHD modification
- Source: immunize.org p2016 Table 5 ONLY — do not use CDC child notes for this path
- No dates in the UI; shown as advisory with coordinate-with-team note

## Adult Schedule (≥19y = `ADULT_SCHED_MIN_M`)

### Routine ≥50y (no risk)
- Shared decision for 19–49y; recommendation from 50y

### Risk-Based 19–49y
- IC, cochlear, CSF leak, non-IC chronic conditions → PCV (PCV20 or PCV15+PPSV23)

### Adult Prior-Vaccine Matrix
Per CDC adult notes: prior PCV type and PPSV23 history determine which doses remain. Key branches:
- PCV13+PPSV23 (PPSV23 at ≥65) → shared decision, date-driven (age at PPSV23, not current age)
- PCV20 or PCV21 → complete
- PCV15 without PCV20/21 → PPSV23 follow-up required

### Adult HSCT (≥19y) — Advisory Only
- Source: Fred Hutch LTFU §IX Tables IX.A1/A2 ONLY (institutional, NOT ACIP)
- PCV20 ×3 at ≥6/≥8/≥10 months after HSCT; no PPSV23
- Titer-guided: baseline + after each dose; ≥15/20 serotypes = stop
- Label prominently as institution-specific in all UI copy

## Product Rules

### PCV7
NEVER counts. Records as `noncounting`, dropped from effective series. High-risk patients treated as PCV-naïve. Source: immunize.org Ask the Experts.

### PCV21 (Capvaxive)
- Min age: 18y (216m = `PCV21_MIN_AGE_M`) per FDA label / mm7336a3
- Adults only — PCV21 recorded for a child (<19y schedule threshold) → INVALID
- Serotype-4 advisory (`pcv21Geo`) always shown when PCV21 is offered; not a hard block

### PCV15
Requires a PPSV23 follow-up to complete the series (encoded as `requiresPPSV23: true` in `brands.js`).

## Adult PPSV23 Interval — Risk-Class Keyed

Single source: `adultPpsvIntervalClass()` in `riskFactors.js`:
- IC / cochlear implant / CSF leak → `'short'` → ≥8 weeks after PCV15
- Non-IC chronic only → `'long'` → ≥1 year after PCV15

Never hardcode the interval check in the engine.
