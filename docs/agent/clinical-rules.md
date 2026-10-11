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
| Adult PCV15→PPSV23 interval | CDC adult notes — **≥1 year at every adult age**, 8 weeks *may be considered* for IC/cochlear/CSF (A-P1-1; see below) |
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

## Adult Gaps: Advised, Not Required (S3-N1)

The mirror image of the rules above. A short adult gap cannot void a dose, but it should
not pass unremarked either. Such a dose **counts and carries a note** —
`earlyAdvisory: true` on a `status: 'valid'` result. (Named `earlyAdvisory`, not
`offWindow` — S14-3 — because "off-window" is MeningoVax's name for a dose that does NOT
count; this one counts.)

- **It is a flag, never a status.** `status` stays `'valid'` and `effectiveDoseNum` is
  still assigned, so nothing that counts doses can treat it as dropped. Do not promote it.
- Two adult PCV doses: CDC advises **>=1 year** (`ADULT_ADVISED_PCV_GAP_MONTHS`). That is
  the shortest of CDC's adult gaps, so the advisory under-flags rather than over-flags.
- Adult PCV15 -> PPSV23: **>=1 year**, unless `adultPpsvShorterMinimumApplies()`, where the
  8-week option is legitimate and only a shorter gap is flagged.
- **No 4-day grace** — nothing is being voided, so there is no grace to apply.
- **S14-2:** the chip no longer spells this out in a word — it just reads "Dose N of M"
  (MeningoVax's own wording, which is now the vocabulary source for both apps). The timing
  sentence still lives in the dose's reasons/explanation text.

## Extra Doses: Given After the Series Was Already Complete (S14-4)

An **adult** PCV dose recorded after history already includes a completing product
(PCV20/PCV21, `completesSeries` in brands.js) is `extraDose: true`,
`effectiveDoseNum: null`, excluded from `effective` — not an interval problem, and not
invalid (it was validly given). Before S14-4 such a dose fell through to
`adultPcvGapAdvice`, which only looks at the gap since the previous dose and has no way to
know the series was already done: a PCV21 given 5 weeks after a completing PCV20 read
"this dose still counts" when no further PCV was ever recommended.

- **Gated on the CURRENT dose's age ≥ `ADULT_SCHED_MIN_M`, not on the product.** For a
  child, `completesSeries` means "no PPSV23 needed," never "no more PCV doses" — an infant
  PCV20 at dose 2 of 4 still leaves the 12–15mo booster due, and `pcvRiskChild`'s own
  completeness checks require more than "includes PCV20" (age band, catch-up count).
  Applying this rule to children was the exact over-generalisation the S14-RC root-cause
  review flagged.
- **An undated extra dose asks, not asserts** (`extraDoseUnverified`) — mirrors
  MeningoVax's G6: with no date, the app cannot tell a genuine extra dose from an ordinary
  series dose whose date is missing.
- **Outranks the early-advisory flag.** If the dose would also have triggered
  `earlyAdvisory`, that flag and its "still counts" sentence are dropped — they'd
  contradict "this dose does not extend the series."
