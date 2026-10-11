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

## Adult PCV15 → PPSV23 Interval — ≥1 Year at Every Adult Age

**Corrected 2026-10-11 (S3).** This section still described the rule from BEFORE the
owner's A-P1-1 amendment ("risk-class keyed: IC/cochlear/CSF = ≥8 weeks; non-IC chronic =
≥1 year") and named `adultPpsvIntervalClass()`, which no longer exists anywhere in `src/`.
S13 corrected the same stale rule in `testing.md` but missed this copy, so a session
reading this file would have implemented the superseded rule. See `CLAUDE.md` and
`CLINICAL_SPEC.md` §K for the governing wording.

PCV15 is followed by PPSV23 **≥1 year later, for every adult 19+**, and the series is then
complete. The **8-week minimum may be *considered*** for an immunocompromising condition,
cochlear implant or CSF leak — the app **names** that option and never silently substitutes
it. Single source: `ADULT_PPSV23_INTERVAL_MONTHS` + `adultPpsvShorterMinimumApplies()` in
`riskFactors.js`. Never hardcode the interval in the engine.

`adultPpsvShorterMinimumApplies()` answers the **interval** question only — do not reuse it
to decide which CDC *row* a patient is on.

## Minimum Intervals Between RECORDED Doses (S3, queue P1-0)

Enforced in `validate.js`; the numbers live in `logic/intervals.js` and the scheduler reads
them too. Full quotes and sources in `CLINICAL_SPEC.md` §K.

- **PCV → PCV** — 4 weeks if the **earlier** dose was given before 12 months, 8 weeks from
  12 months (`pcvSeriesMinIntervalDays`). CDC catch-up Table 2 states these under the
  heading "Minimum Interval Between Doses"; p2016's footnote keys them the same way.
- **PCV → PPSV23** — ≥8 weeks, and never the same visit.
- **PPSV23 dose 2** — ≥5 calendar years after dose 1.

Three things to know before changing any of it:

1. **A sub-minimum dose is `invalid`**, not some middle verdict — CDC states the
   consequence: the dose "should not be counted as valid and should be repeated".
2. **An invalid dose still anchors the next one** ("the repeat dose should be spaced after
   the invalid dose by the recommended minimum interval"). PCV7 anchors nothing.
3. **The last two rules are paediatric only.** Doses given at `ADULT_SCHED_MIN_M` or later
   get no interval verdict in either stream: CDC's adult notes state gaps as
   recommendations for the next dose, never as minimums, and never say a short adult gap
   stops a dose counting. Do not "tidy" this into a universal rule.
