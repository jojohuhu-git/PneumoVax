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
| PCV7-not-counted | immunize.org Ask the Experts |
| Adult routine ≥50 + 19–49 risk matrix | CDC adult schedule notes + mm7401a1 |
| Adult PCV15→PPSV23 interval | **mm7401a1 + CDC Adult Timing Job Aid (Mar 2025)** — **≥8 weeks at 19–49** for IC/cochlear/CSF, **≥1 year** otherwise; at 50+ the 8 weeks is *named as an option* (S15; see below) |
| PCV21 eligibility + serotype-4 geo note | CDC MMWR mm7336a3 |
| ≥50 expansion | CDC MMWR mm7401a1 |
| **Transplant / CAR-T / B-cell** | **No source — the app STOPS.** See "Transplant Is A Hard Stop" below |

## Pediatric Schedule

### Routine Infants (2–23m)
Standard 4-dose series at 2/4/6/12–15m. PCV min age = ACIP 6 weeks (`PCV_MIN_AGE_M = 42 / 30.4375`).

### Healthy 24m–18y Catch-Up (Table 2)
- 24–59m, schedule incomplete at 24mo: **1 dose** of PCV15/PCV20, ≥8wk after the most recent PCV
- 24–59m, schedule complete at 24mo: no additional doses. **A dose given at 12–23 months
  counts as the age-appropriate final dose** — see `CLINICAL_SPEC.md` §B, "What
  'completed by 24 months' means" (FINDING M, 2026-10-22), for the full table. This line
  used to read "only doses at ≥24mo count as catch-up progress", which was the mistake
  FINDING M corrects.
- 60m–18y: healthy, not caught up — no additional doses

### At-Risk 24m–18y (Table 4, `IC` or `nonIC` row)
See `CLINICAL_SPEC.md` §III for the full 9-row grid. Key invariants:
- IC row 3 (≥1 PCV20 at any age) → complete (correct per PneumoRecs)
- Completeness for non-IC at 24–71m requires age-appropriate count (`enoughAt24mo`), not just "has any PCV20"
- 24–71m catch-up counts only `band.ge24` doses toward progress (not infant doses)
- A completed 4-dose infant series → fall through to Option A (PCV20) / Option B (PPSV23), not a 5th plain PCV
- **An IC child who has ALREADY had one PPSV23 waits ≥5 years from that first PPSV23 —
  then PCV20 *or* a 2nd PPSV23, both at the same five-year mark.** Not 8 weeks. CDC's
  risk-indications page (May 8, 2026) over immunize.org P2016's footnote ‖ (2/16/2024);
  FINDING A, owner decision 2026-10-17. Full argument and both quotes:
  `CLINICAL_SPEC.md` §D-note. One source: `icPostPpsv23DueState()`.
  The child who has **never** had a conjugate vaccine is the exception CDC states outright
  — 8 weeks, "regardless of whether the child has previously received PPSV23 or PCV7".


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

## Transplant Is A Hard Stop (OWNER DECISION 2026-10-16)

There is no post-transplant pneumococcal schedule in this app. Ticking
`hct_cart_bcell_exclude` — hematopoietic cell transplant, CAR-T therapy, B-cell malignancy
or B-cell-depleting therapy, **one row** — returns `excluded: true` with `recs: []`, skips
the History step, and shows one message naming ASCO, NCCN, IDSA and CDC **in words, linked
to nothing**. It hides everything, including the ordinary age-based schedule and including
a card a *different* ticked risk factor would produce on its own.

There used to be two advisory pathways here (peds: immunize.org p2016/p3086 Table 5; adult:
Fred Hutch LTFU §IX, later ASCO 2024). They were deleted because the rule could not be kept
true — wrong or half-applied five times in five weeks across the two apps. The schedules
themselves, verbatim with their citations:
`docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md`.

Byte-identical to MeningoVax and frozen by
`regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js`. Change the wording in
both repos or neither.

## Product Rules

### PCV7
NEVER counts. Records as `noncounting`, dropped from effective series. High-risk patients treated as PCV-naïve. Source: immunize.org Ask the Experts.

### PCV21 (Capvaxive)
- Min age: 18y (216m = `PCV21_MIN_AGE_M`) per FDA label / mm7336a3
- Adults only — PCV21 recorded for a child (<19y schedule threshold) → INVALID
- Serotype-4 advisory (`pcv21Geo`) always shown when PCV21 is offered; not a hard block

### PCV15
Requires a PPSV23 follow-up to complete the series (encoded as `requiresPPSV23: true` in `brands.js`).

## Adult PCV15 → PPSV23 Interval — ≥8 Weeks at 19–49 for IC / Cochlear / CSF

**Rewritten 2026-10-16 (S15), owner decision.** This section has now been wrong twice, in
opposite directions, so read the table rather than any sentence:

| Adult | PCV15 → PPSV23 |
|---|---|
| **19–49** with an immunocompromising condition, cochlear implant or CSF leak | **≥8 weeks** |
| 19–49 with chronic conditions only | ≥1 year |
| **50+**, any risk class | ≥1 year, with 8 weeks **named as an option** |

Governing sources, read live 2026-10-16: **mm7401a1** (ACIP, January 2025) and CDC's
**Adult Pneumococcal Vaccine Timing Job Aid** (March 2025). **`rr7203a1` (2023) is
superseded — never cite it for an adult interval.** mm7401a1 uses a different verb per age
band and that is the rule: 19–49 IC/CSF/cochlear "**administer** … ≥8 weeks"; ≥50 "should
be administered ≥1 year … 8 weeks **can be considered**".

Single source: `adultPpsvRecommendedInterval()` and `adultPpsvShorterMinimumOffered()` in
`riskFactors.js`, with the age boundary from `ROUTINE_ADULT_MIN_M`. Never hardcode the
interval in the engine, and never add a second age test.

**Do not re-flatten it to one number for all adults** (that was A-P1-1, 2026-10-10 to
2026-10-16), **and do not extend the 8 weeks to 50+** without a new owner decision — ACIP
prints it there as an option, not as advice. Full history and quotes: `CLINICAL_SPEC.md`
§K; the earlier correction note for this section is in the S3 (2026-10-11) entry of
`docs/archive/agent-session-log.md`.

`adultPpsvShorterMinimumApplies()` answers the **risk-class half of the interval question**
only — do not reuse it to decide which CDC *row* a patient is on, and do not use it alone
for the interval: it has no age term.

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

**One recommendation keeps CDC's 4-day grace: `CHILD-PPSV23-AFTER-PPSV23`** (owner
decision 2026-10-30, `CLINICAL_SPEC.md` §C-P2). It is advice for an immunocompromised child
and an extra dose for any other, so its firing decides whether a dose counts; dropping the
grace moved 708 grid patients. A repeat of a REJECTED PPSV23 is a separate floor, split
on whether a PPSV23 has COUNTED yet (owner ruling 2026-10-30, §C-P2): the repeat of a
rejected FIRST dose is the first PPSV23, 8 weeks from the dose given
(`CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST`); the repeat of a rejected SECOND dose keeps
the 5 years (`CHILD-PPSV23-AFTER-INVALID-PPSV23`). Pinned by name in `rule-docs-match-code`.

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

## Extra Doses: Given After the Series Was Already Complete (S14-4, S14-4B)

> Summary only — `CLINICAL_SPEC.md` §K is the rulebook for both halves.

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

**S14-4B (2026-10-12) — the same rule for an adult PPSV23 dose.** The branch used to open
with `vaccine === 'PCV'`, so an adult's PPSV23 dated after a counting PCV20/PCV21 was
labelled "series dose 1" in silence — reading identically to a PPSV23 that had actually
*completed* a PCV15 series. Owner decision: mirror the PCV sentence exactly. Moved 648 of
the sweep's 16,250 verdicts; no recommendation and no PCV verdict changed. Two deliberate
narrowings versus the PCV side, both reasoned out in `CLINICAL_SPEC.md` §K:

- the completing dose must be **dated and strictly earlier** — **lifted by S14-4C below**;
- **no undated mirror** — an undated PPSV23 beside a PCV20 is usually an old dose given
  *before* the conjugate, so the PCV side's question would mislead more often than help.

**S14-4C (2026-10-12) — a dose given at the SAME VISIT as the completing dose.** S14-4B's
"strictly earlier" limit protected the sentence and abandoned the verdict: a same-day
PCV20 + PPSV23 read *"CDC advises at least 1 year… this dose still counts"*, advising a
spacing fix for a dose no interval would have made right. It was also an asymmetry — the
PCV arm reads `kept`, which already holds a same-day completing dose, so a PCV21 recorded
the same day as a PCV20 was already an extra dose *and* already said "after" about it.

Owner decision: chip and sentence together. Same-day joins the extra-dose class, with a
**second sentence** ("Given at the same visit as…") instead of the "after" one; both
sentences live in `validate.js`'s `extraDoseSentence`, written once because both streams
print them. **Bound:** a PPSV23 an **earlier** PCV15 already owed stays counted when a
PCV20 lands at the same visit — either dose finishes the series, so the app calls neither
surplus. Moved 144 of 16,250; 0 recommendations and 0 PCV verdicts changed.

`ADULT-PPSV23-AFTER-PCV-CATCH-ALL` is **not** left with nothing: 180 of the 324 grid
patients that reach it are anchored on a PCV whose **product was not recorded**, which no
product-keyed row can ever name. That is the row's standing job.
