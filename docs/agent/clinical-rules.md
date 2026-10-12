# PneumoVax — Clinical Rules Reference

> **The rulebook is `CLINICAL_SPEC.md`, not this file** (owner decision, S8, 2026-10-11).
> This is the agent-facing companion: it summarises and points. It may leave a rule out, but
> it may never state a different number from the one the code enforces — four copies of a
> superseded adult interval were found in the agent docs in one week (S3, S13), each still
> readable as current. `rule-docs-match-code.test.js` now fails if any interval stated near a
> rule's name here is not the one that rule enforces.
>
> **Verified against code: 2026-10-11.**

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

- **PCV → PCV** — **two different jobs, two different functions** (P0-2, 2026-10-11):
  - *Grading a dose already given* (the floor): 4 weeks if the **earlier** dose was given
    before 12 months, 8 weeks from 12 months — `pcvSeriesMinIntervalDays`, p2016 footnote †.
    **Unchanged by P0-2**, by owner decision: the app does not retroactively invalidate a
    dose a clinician already gave.
  - *Advising a dose not yet given*: CDC Catch-up Table 2 **dose by dose** —
    `pcvNextDoseMinIntervalDays`. Table 2 keys on the dose number as well as the age, so
    neither age alone reproduces it. Quotes and the worked cases: `CLINICAL_SPEC.md` §L.
- **PCV → PPSV23** — ≥8 weeks, and never the same visit.
- **PPSV23 dose 2** — ≥5 calendar years after dose 1.

Three things to know before changing any of it:

1. **A sub-minimum dose is `invalid`**, not some middle verdict — CDC states the
   consequence: the dose "should not be counted as valid and should be repeated".
2. **An invalid dose still anchors the next one** ("the repeat dose should be spaced after
   the invalid dose by the recommended minimum interval"). PCV7 anchors nothing.
3. **Those three are the PAEDIATRIC rows**, and they are paediatric because the CHILD
   schedule is where CDC states them as minimums — the adult notes contain no "same visit"
   sentence and no "8 weeks after the most recent PCV" (verified live 2026-10-11 with a
   positive control). Adults have their own rows with their own numbers; see below. Never
   let the paediatric WORDING appear on an adult's dose.

## One Rule Table, No Age Gates (S14-7)

`src/logic/doseIntervalRules.js` holds **every** gap-between-recorded-doses rule.
`validate.js` calls `evaluateDoseInterval()` once per dose and owns no interval logic at
all. **Read that file's header before changing any interval** — it carries every source
quote and labels the owner-determined rows.

**The bug it replaced (root cause S14-RC).** `validate.js` had five functions that each
decided whether a timing rule may void a dose *from the patient's age, not from what the
rule says*: `checkPcvInterval`, `checkPpsvAfterPcv` and `checkPpsvRevaccInterval` returned
early at `ageAtDose >= ADULT_SCHED_MIN_M`; `adultPcvGapAdvice` and `adultPpsvGapAdvice`
returned early below it. Below 19 every gap could void a dose; at 19+ none could — and
three adult gaps fell in the hole between the two halves, checked by nothing at all. The
worst read `status: 'valid'`, numbered, `reasons: []`: a 70-year-old's second PPSV23 two
years after the first. Silent.

Every row declares these two things **separately**:

| Field | Answers |
|---|---|
| `rulebook` | `'child'` / `'adult'` / `'any'` — which schedule states the rule, so which number and which citation apply |
| `enforcement` | `'floor'` (voids the dose; 4-day grace applies) / `'recommendation'` (dose counts, carries a note; no grace) / `'none'` (never flagged, reason written down) |

**Never add an age test that decides whether a rule may bite.** Add a row.
`CHILD-PPSV23-AFTER-PPSV23` and `ADULT-PPSV23-AFTER-PPSV23` read the *same* 5-year
constant — the old age gate on that rule was pure loss — and a test fails if they drift.

⚠️ **The adult floors are an OWNER CLINICAL DETERMINATION dated 2026-10-11, not ACIP and
not CDC.** CDSI v4.64 sets `absMinInt = 0 days` for every adult pneumococcal interval, and
the three current adult MMWRs never say a short gap means repeat the dose; the owner was
shown that evidence and reaffirmed. Rows carry `authority: 'OWNER'`, their `source` text
says "not ACIP, not CDC", and the per-dose explanation the clinician reads names the
determination. Tests enforce all three. The enumerated rows and the full evidence are in
`CLINICAL_SPEC.md` §K.

**Every adult floor is the owner's — there is no CDC-authority adult floor.** An earlier
draft of this file claimed the 8-week PCV15→PPSV23 gap as CDC's, because "minimum interval"
appears in the adult notes. Reading rr7203a1 live corrected it: *"A minimum interval of 8
weeks **can be considered** … **to minimize the time of risk**"* is permission to vaccinate
SOONER, not a bar to fall below, and rr7203a1 says "should be repeated" 0 times. Watch the
vocabulary: ACIP's "**minimum recommended** interval" is the shortest *recommended* spacing
for a group; General Best Practices' "**minimum interval**" is the validity floor that
carries the repeat consequence. They are different concepts and only the second one voids a
dose.

**The two-tier adult intervals.** Both PCV13→PPSV23 and PCV15→PPSV23 are keyed on risk,
never on age: **8 weeks** for an immunocompromising condition / cochlear implant / CSF
leak, **1 year** for every other adult. `adultPpsvShorterMinimumApplies()` picks the tier —
and answers the INTERVAL question only, never which CDC recommendation row a patient is on
(A-P1-1).

### Still a note, not a floor

Two situations keep `earlyAdvisory: true` on a `status: 'valid'` result — the dose
**counts**, keeps its `effectiveDoseNum`, and carries a sentence. (Named `earlyAdvisory`,
not `offWindow` — S14-3 — because "off-window" is MeningoVax's name for a dose that does
NOT count; this one counts.)

- **It is a flag, never a status.** Nothing that counts doses may treat it as dropped.
- An adult who used the legitimate 8-week option after a PCV15 instead of waiting the
  recommended year (`ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED`). The note says the
  minimum was met — information, not second-guessing. A-P1-1 still governs the
  recommendation.
- Any adult pair the enumerated rows do not name — PCV13→PCV15, or a PPSV23 after a PCV20
  (`ADULT-PCV-AFTER-PCV-CATCH-ALL`, `ADULT-PPSV23-AFTER-PCV-CATCH-ALL`). Keyed on ≥1 year,
  the shortest adult gap CDC states, so they under-flag. **They exist so that "enumerate,
  never generalise" cannot turn into silence.**
- **A catch-all may never speak for a pair an enumerated row already named** (`catchAll:
  true`). A catch-all quotes one flat interval and cannot see risk class, so talking over a
  specific rule reproduces A-P1-1. It did: an immunocompromised adult 10 weeks after PCV13
  had met rr7203a1's 8 weeks and was still told "CDC advises at least 1 year". A dose whose
  own rule named it and was satisfied now says nothing.
- **No 4-day grace** — nothing is being voided, so there is no grace to apply.
- **S14-2:** the chip no longer spells this out in a word — it just reads "Dose N of M"
  (MeningoVax's own wording, which is now the vocabulary source for both apps). The timing
  sentence still lives in the dose's reasons/explanation text.

## Extra Doses: Given After the Series Was Already Complete (S14-4)

An **adult** PCV dose recorded after history already includes a completing product
(PCV20/PCV21, `completesSeries` in brands.js) is `extraDose: true`,
`effectiveDoseNum: null`, excluded from `effective` — not an interval problem, and not
invalid (it was validly given). Before S14-4 such a dose fell through to the old
`adultPcvGapAdvice` (deleted by S14-7), which only looked at the gap since the previous
dose and had no way to know the series was already done: a PCV21 given 5 weeks after a
completing PCV20 read "this dose still counts" when no further PCV was ever recommended.

**The extra-dose check runs AFTER the interval table**, so a dose the table voids is
invalid rather than "extra" — which is why `regression-s14-4-extra-dose.test.js` had to
space its fixture more than a year apart once S14-7 made the adult PCV13→PCV20 gap a floor.

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
