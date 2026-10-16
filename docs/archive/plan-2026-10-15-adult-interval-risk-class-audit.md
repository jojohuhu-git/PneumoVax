# PLAN — Adult dosing-interval recommendations, audited cell by cell against ACIP

> **STATUS: PLANNED, NOT STARTED.** Nothing in this document has been implemented. No code
> was changed when it was written. The owner's decision below is **recorded and settled** —
> implement it, do not re-litigate it.

**Written:** 2026-10-15 · **Repo state when written:** `main` @ `2983d41`, 918 tests passing
**Owner decision:** taken 2026-10-15 in conversation, after being shown the live ACIP tables.
**Supersedes:** the interval half of **A-P1-1** (2026-10-10). See "What A-P1-1 got right" below.

---

## 1. The owner's decision

> *"there are other situations where 8 week interval should be followed listed in the table
> rather than 1 year. I want to make sure they are all captured."*

**Decided:** the adult PCV→PPSV23 **recommendation** is keyed on risk class, matching ACIP
rr7203a1 Tables 2, 3 and 4 — **≥8 weeks** for an immunocompromising condition, CSF leak or
cochlear implant; **≥1 year** otherwise. This reverses the interval half of A-P1-1, which
flattened it to ≥1 year for every adult and named the 8 weeks as an option.

**And the wider instruction:** do not fix only the PCV15 row. Audit **every** adult interval
the app recommends against ACIP's tables and find the rest. That is the real deliverable.

---

## 2. Why A-P1-1 is being reversed, and what it got right

A-P1-1 was taken on the strength of **one sentence** in CDC's adult schedule notes, fetched
live then and again on 2026-10-15 (unchanged):

> "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15 dose (may use
> minimum interval of 8 weeks for adults with an immunocompromising condition,* cochlear
> implant, or cerebrospinal fluid leak)."
> — https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html

That sentence does read as "a year, with 8 weeks permitted". But **ACIP's recommendation
document itself prints 8 weeks as the schedule** for these patients, in four tables, at both
age bands — see §3. rr7203a1 is the ACIP recommendation; the schedule notes are a one-line
summary of it.

**A-P1-1's own reasoning now looks unsafe in two places**, and both should be recorded as
corrected rather than quietly dropped:

1. `CLAUDE.md` says CDC's Timing Job Aid printing a flat "8 weeks" on its 19–49 pages "is a
   per-page simplification and the schedule notes govern." **It is not a simplification** —
   it agrees with rr7203a1 Tables 3 and 4. The dismissed source was right.
2. `CLAUDE.md` says "there is no age split" because the notes print the same sentence under
   both age bands. True of the notes; **but rr7203a1 splits by condition, which the notes
   collapse.** The absence of an age split was never the question.

**What A-P1-1 got right, and must not be undone.** Its real finding was that the old code
**substituted** the minimum for the recommendation and then contradicted itself one step
apart: a 60-year-old with HIV was told "PCV15 followed by PPSV23 ≥1 year later", and then,
once that PCV15 was recorded, "PPSV23 (≥8 weeks after PCV15)". **Any implementation of this
plan must be self-consistent before and after the dose is recorded.** That is the regression
test to write first.

Also preserved: **S14-7's separation of recommendation from validity floor.** This plan
changes what the app *recommends*. It does **not** change the floors, which already key on
risk class and are an **owner clinical determination of 2026-10-11, not ACIP** — that label
stays on every floor row.

---

## 3. The source, verified cell by cell

**ACIP rr7203a1** (Pneumococcal Vaccine for Adults Aged ≥19 Years, 2023), fetched live
2026-10-15 from https://www.cdc.gov/mmwr/volumes/72/rr/rr7203a1.htm —
all four schedule tables, **Schedule option B (PCV15 and PPSV23 available)**:

| ACIP table | Population | Prior history | Interval ACIP states |
|---|---|---|---|
| T2 col 4 | **≥65**, IC / CSF leak / cochlear | none / PCV7 only | PCV15 → PPSV23 **≥8 weeks** |
| T2 col 4 | ≥65, IC / CSF / cochlear | PCV13 only | PCV13 → PPSV23 **≥8 weeks** |
| T2 col 4 | ≥65, IC / CSF / cochlear | PCV13 + PPSV23 (none at ≥65) | PPSV23 **≥8 weeks** after PCV13 **AND ≥5 years** after last PPSV23 |
| T2 col 3 | ≥65, **no** IC / CSF / cochlear | none / PCV7 only | PCV15 → PPSV23 **≥1 year** |
| T2 col 3 | ≥65, no IC / CSF / cochlear | PCV13 only | PCV13 → PPSV23 **≥1 year** |
| **T3** | **19–64, immunocompromising** | none / PCV7 only | PCV15 → PPSV23 **≥8 weeks** |
| **T3** | 19–64, immunocompromising | PCV13 only | PPSV23 **≥8 weeks** after PCV13, **then a 2nd PPSV23 ≥5 years** after the last PPSV23 |
| **T3** | 19–64, immunocompromising | PCV13 + 1 PPSV23 | PPSV23 **≥8 weeks** after PCV13 **AND ≥5 years** after last PPSV23 |
| **T4** | **19–64, CSF leak / cochlear** | none / PCV7 only | PCV15 → PPSV23 **≥8 weeks** |
| **T4** | 19–64, CSF leak / cochlear | PCV13 only | PPSV23 **≥8 weeks** after PCV13 — **and NO second PPSV23** |
| T5 | 19–64, chronic condition | none / PCV7 only | PCV15 → PPSV23 **≥1 year** |
| T5 | 19–64, chronic condition | PCV13 only | PCV13 → PPSV23 **≥1 year** |
| **all tables** | **every class** | **PPSV23 only** | PCV15 **≥1 year** after PPSV23 — **identical in T2 col3, T2 col4, T3, T4 and T5** |

Supporting prose, same page:

> "The minimum recommended interval for receipt of the PPSV23 dose in adults with an
> immunocompromising condition, a CSF leak, or a cochlear implant is ≥8 weeks since the PCV15
> dose." *(appears twice)*

> "A minimum interval of 8 weeks can be considered for adults with an immunocompromising
> condition, a CSF leak, or a cochlear implant **to minimize the time of risk for IPD caused
> by serotypes unique to PPSV23** in these groups at increased risk for pneumococcal disease"

> T7 footnote: "Adults with immunocompromising conditions, a CSF leak, or a cochlear implant
> **might benefit from shorter intervals** (e.g., ≥8 weeks)."

> "When a second PPSV23 dose is used instead of PCV20, it should be administered ≥8 weeks
> after the PCV13 dose and ≥5 years after the first PPSV23 dose **for adults aged 19–64 years
> with an immunocompromising condition but not for adults with a CSF leak or a cochlear
> implant**."

---

## 4. What the app does today — measured, not assumed

Engine run on `main` @ `2983d41`, 2026-10-15. Every cell, every class:

```
AGE    | CLASS         | HISTORY         | GAP   | WHAT THE APP RECOMMENDS
19-64  | IC            | PCV15 only      | 12mo  | PPSV23 (≥1 year after PCV15)
19-64  | CSF/cochlear  | PCV15 only      | 12mo  | PPSV23 (≥1 year after PCV15)
19-64  | chronic       | PCV15 only      | 12mo  | PPSV23 (≥1 year after PCV15)
>=65   | IC            | PCV15 only      | 12mo  | PPSV23 (≥1 year after PCV15)
  … identical for every class at both ages, for every history row …
```

**The recommended interval is completely flat across risk class.** Not one of ACIP's 8-week
cells is reflected in what the app advises.

### The asymmetry that makes this cheap to fix

The app **already contains** ACIP's split — on the other side of the question:

| | Keys on risk class? | Where |
|---|---|---|
| **Validator** — "does this recorded dose count?" | ✅ yes, 4 rows | `doseIntervalRules.js`, `shorterMinimum: true/false`, 8 weeks vs 1 year, for PCV15→PPSV23 **and** PCV13→PPSV23 |
| **Recommender** — "what should I give?" | ❌ no, flat 12 months | `recommend.js`, `pcvAdult()` |

`adultPpsvShorterMinimumApplies(riskIds)` in `riskFactors.js` is the predicate, it already
returns true for IC **and** cochlear/CSF, and `recommend.js` **already imports and calls it**
— today only to decide whether to append the "8 weeks may be considered" sentence. The
plumbing is in place; the recommendation does not use it for the number.

⚠️ But see §5.1 — **do not simply reuse that predicate for everything.** It answers the
interval question only, and the CSF/cochlear-vs-IC difference in §5.2 proves one predicate
cannot serve every row.

### Parity: MeningoVax does NOT have this asymmetry

Checked 2026-10-15. MeningoVax keys its MenB intervals on risk status in **both** halves —
`recommend.js` uses `MENB_HIGHRISK_D2_GAP` for a high-risk patient and
`MENB_HEALTHY_D2_MONTHS` for a healthy one (lines 1474-1608), and `validate.js` imports the
same two constants from the same `intervals.js` and branches on `hasMenbRisk(riskIds)`
(line 915). One home per number, read by both sides.

**So this bug class is PneumoVax-only, and MeningoVax is the reference for the shape of the
fix:** the risk-keyed constant lives in the shared interval module and both the recommender
and the validator import it, rather than the validator owning the split alone. No parity PR
is owed to MeningoVax for this item.

---

## 5. Findings beyond the PCV15 row — the "are they all captured?" answer

**These are the additional situations the owner anticipated. Each needs its own decision or
its own row; none is covered by fixing PCV15→PPSV23 alone.**

### 5.1 PCV13 → PPSV23 is 8-week keyed too, and the recommender never says so
T2 col 4, T3 and T4 all give PPSV23 **≥8 weeks** after PCV13 for IC / CSF / cochlear, versus
≥1 year otherwise (T2 col 3, T5). The validator has both rows; the recommender has neither.

### 5.2 IC and CSF leak / cochlear implant are NOT the same class for the second PPSV23
rr7203a1 is explicit (quoted in §3): the second PPSV23 at ≥5 years applies to a 19–64 adult
with an **immunocompromising condition** "but **not** for adults with a CSF leak or a cochlear
implant". Compare T3 "PCV13 only" (PPSV23 ≥8wk, **then** a 2nd PPSV23 ≥5y) with T4 "PCV13
only" (PPSV23 ≥8wk, **no** second dose, just review at 65).
**The app models cochlear implant and CSF leak as `class: 'special'` and treats them as
IC-equivalent for every adult question.** That is right for the interval and wrong here.
**This is a second, separate bug from the interval one.** Needs an owner decision on whether
to split the class or add a narrower predicate.

### 5.3 The app always takes Schedule option A, so option B's 8-week cells are unreachable
For "PCV13 only" the app recommends **PCV20 or PCV21 ≥1 year** — which is ACIP's Schedule
option A and is correct as far as it goes. ACIP's 8-week cells for PCV13→PPSV23 live in
**option B** (PPSV23 instead of PCV20/21), which the adult pathway never offers. The paediatric
pathway *does* offer A/B options on screen. **Owner decision needed:** should the adult
pathway offer option B, as the peds one does, or is "we recommend option A" deliberate? If
option B is never offered, 5.1's 8-week cells cannot be reached by any patient, and the fix
there is presentational rather than arithmetic.

### 5.4 "PPSV23 only" is the control — it must NOT move
ACIP gives **≥1 year** for a PCV after PPSV23 in **every** class, in all five table columns.
The app already does this. **Any implementation that changes this row is wrong.** Use it as
the control case in the regression test: a change that moves it has over-reached.

### 5.5 "Review at 65" vs the app's "review at 50" is an intentional divergence — do NOT "fix" it
T5's "PCV13 and PPSV23" row says "Review the pneumococcal vaccine recommendations again when
the patient turns age 65 years." The app says **review at 50**, because ACIP lowered routine
adult vaccination 65 → 50 effective 2024-10-23 (**mm7401a1**), which post-dates rr7203a1
(2023). `ROUTINE_ADULT_MIN_M = 600` is correct and `CLAUDE.md` records it. **rr7203a1 is stale
on age thresholds and current on intervals** — do not import its ages while fixing its
intervals.

### 5.6 The ≥65 / 19–64 boundary in rr7203a1 is not the app's boundary
rr7203a1 splits its tables at 65. The app's routine boundary is 50 (5.5) and its schedule
boundary is 19 (`ADULT_SCHED_MIN_M`). Mapping ACIP's tables onto the app needs care: T2 is
≥65, T3/T4/T5 are 19–64, and the app has a 50 boundary neither table knows about. **Check
every 50–64 patient explicitly** — they fall in ACIP's 19–64 tables but in the app's routine
band.

---

## 6. The work, in order

Each step is its own commit; the whole thing is one PR with a verdict-movement story.

1. **Write the self-consistency test FIRST**, before any change. For each class at each age:
   the interval stated *before* the PCV15 is recorded must equal the interval stated *after*
   it is recorded. This is A-P1-1's original bug and the one thing that must not come back.
2. **Add the control test** for 5.4 ("PPSV23 only" → ≥1 year in every class).
3. **Build the cell-by-cell table test** — one assertion per row of §3, reading the expected
   interval from a constant, never a literal, the way `rule-docs-match-code.test.js` does.
   Expect it to fail on every 8-week cell. **Confirm it fails for the right reason.**
4. **Key the recommended PCV15→PPSV23 interval on risk class** in `recommend.js`'s
   `pcvAdult()`. The constants exist: `ADULT_PPSV23_INTERVAL_MONTHS` (12) and
   `ADULT_PPSV23_SHORTER_MINIMUM_WEEKS` (8), both in `riskFactors.js`. Since S6 the displayed
   words derive from whichever is chosen, so the sentence follows the number for free.
5. **Then 5.1** (PCV13 → PPSV23), once 5.3 is decided — it may be presentational.
6. **Then 5.2** as a separate commit, after the owner decides on splitting `special` from IC.
7. **Update `CLINICAL_SPEC.md`** §C, §J and §K in the same commit as the rule change — §J's
   new table of "what the risk class decides" already has a row for the interval and it will
   need inverting. `rule-docs-match-code.test.js` will fail until this is done, by design.
8. **Correct `CLAUDE.md`'s "Adult PCV15→PPSV23 Interval" section**, including the two
   now-unsafe claims in §2 above. Say what changed and why, dated.

---

## 7. How to verify — non-negotiable

- **This WILL move verdicts.** Unlike S6, this is a real clinical change. Run
  `npm run sweep:update` only once you can say why those patients should get a different
  answer, and **put both moved counts in the PR** (16,250 real / 18,460 impossible).
- **Diff the rendered prose too.** The verdict corpora record verdicts and deliberately not
  wording, so they cannot show a sentence change. The dump-and-diff recipe is in PR #49.
- **Live-verify** an IC adult and a chronic adult, before and after recording the dose, in
  the running app. A green suite is not proof.
- **Mutation counts** for every new guard, each run and quoted, in the PR and in
  `docs/agent/testing.md`.
- **Worked examples for the owner**: an IC and a non-IC adult at 19–49, 50–64 and ≥65, with
  the before/after interval and date for each — six cases, real engine output.

---

## 8. Open sub-questions for the owner — ask, do not default

1. **5.3** — should the adult pathway offer Schedule option B (PPSV23 instead of PCV20/21),
   as the paediatric pathway offers A/B? This decides whether 5.1 is arithmetic or layout.
2. **5.2** — split `class: 'special'` (cochlear implant / CSF leak) from IC for the second
   PPSV23, or add a narrower predicate and leave the class alone?
3. Does the **≥8 week** recommendation replace the year outright on the card, or does the card
   show both ("eligible from … , recommended from …")? The decision in §1 reads as outright
   replacement; confirm before writing the copy.
4. Should the **validity floors** (S14-7, owner determination 2026-10-11) change at all? This
   plan assumes **no** — they already key on risk class and already permit the 8 weeks.
