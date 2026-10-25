# Owner rulings, 2026-10-24 (second session): what an invalid adult pneumococcal dose owes, and when

**Status: DECIDED. Nothing built yet at the time of writing.** Baseline when these were taken:
branch `fix/2026-10-24-adult-early-dose-families` @ `d555c57`, clean tree, suite **1,482 passing
in 135 files, 0 failures, 0 skips**.

This supersedes the "unwind PR #84 entirely" headline of
`handoff-2026-10-24-invalid-dose-scheduling-ruling.md` (PR #85, branch
`docs/2026-10-24-invalid-dose-ruling`). That file said families 2 and 3 revert AND that Ruling F
"splits at 1 year". **Ruling F does not split — it stands whole.** Everything else in it holds.

---

## The five rulings

### 1. RULING F STANDS WHOLE — all 363 count
An adult PCV20/PCV21 given sooner than the 5 years ACIP advises after a PPSV23 **still counts**;
the series reads complete with a timing note. Commit `868d01f` is unchanged.

Her reasoning, from the 70-year-old with PCV13 2016-10-13, PPSV23 2021-10-13, PCV20 2025-10-10:

> "Assuming the 2021 PPSV23 was given at age >=65, this patient had already completed the series
> with PCV13 + PPSV23 before the 2025 dose. For that history, ACIP lists PCV20/21 as a shared
> clinical decision-making option given >=5 years after the last dose, not as a required dose. So
> the 2025 PCV20 was an optional extra dose given early. **Calling it 'invalid' changes nothing,
> because no dose was owed.** The most defensible plan is to consider the series complete and give
> no further pneumococcal vaccine."
>
> "You can't invalidate a series by adding an optional dose." / "The 5 years is a recommended
> timing, not a biologic minimum. Across all ACIP rows, the only PPSV23 -> conjugate minimum is
> >=1 year. That interval exists because PPSV23 given first dampens the conjugate response."

**The dividing line she drew, and it generalises: VALIDITY ONLY MATTERS WHEN A DOSE WAS OWED.**

She was shown the decomposition below and chose "complete — all 363" across every group, including
the two she had herself flagged as arguable (PPSV23 before 65, where the 5-year dose is routine
rather than shared-decision; and IC/cochlear/CSF, where it is recommended). Her words on the
hardest of them: *"documenting the dose as given and calling the series complete remains a
defensible clinical choice."*

| Ruling F's 363 doses | >=1 year after PPSV23 | under 1 year |
|---|---|---|
| Healthy/chronic, PPSV23 at 65+ (the history she first ruled on) | 60 | 6 |
| Healthy/chronic, PPSV23 **before** 65 | 120 | 12 |
| Immunocompromised | 90 | 9 |
| Cochlear implant / CSF leak | 60 | 6 |

⚠️ **All 33 of the under-1-year doses are a 1-DAY gap.** The grid's fixed day-offsets build no
"PCV20 six months after PPSV23" patient at all. So the sweep could only ever have demonstrated the
same-visit version of this question — the realistic one is unprovable by it either way. This is the
"the grid cannot express every row" trap, and it is why the split was put to her as a judgement
rather than settled by counts.

### 2. FAMILY 2 REVERTS — an adult conjugate under 1 year after a PPSV23 is INVALID
`ADULT-PCV-AFTER-PPSV23` returns to `enforcement: 'floor'`. 132 verdicts go back. Commit `1bd5a9c`
is reversed. Her words on the 70-year-old with PPSV23 2025-10-11 and PCV15 2026-06-19:

> "For a healthy adult, ACIP requires a PCV15 or PCV20 given after a PPSV23 to be >=1 year after
> the PPSV23, with no 8-week option. So the 19 Jun 2026 PCV15, given about 8 months after the
> PPSV23, is invalid and needs to be repeated."

This also re-reverses **case H** (a conjugate two months after a PPSV23), which `1bd5a9c` had
turned into a counting dose on her 2026-10-24 morning ruling. Case H is rejected again.

### 3. FAMILY 3 REVERTS — an adult PPSV23 given early after a PCV15 is INVALID
`ADULT-PPSV23-AFTER-PCV15` returns to `enforcement: 'floor'`. 78 verdicts go back. Commit `4b65df1`
is reversed. Stated twice, unhedged, on her own patient (60y, no risk, PCV15 2026-07-19, PPSV23
2026-10-11): *"which is invalid"*.

### 4. WHAT IS OWED AFTER AN INVALID ADULT DOSE IS PCV20 OR PCV21 — never a repeat PPSV23
Ruled first for the immunocompromised patient and then confirmed for the healthy one, so it applies
to **every** adult risk group:

> "Why 12/6/26 (8 weeks after the invalid PPSV23) is not appropriate: the 8-week interval applies
> only to PCV15 -> PPSV23. It does not apply to PPSV23 -> PPSV23. ... ACIP's only PPSV23 -> PPSV23
> interval is >=5 years. Repeating polysaccharide doses less than 5 years apart is linked to
> hyporesponsiveness."
>
> "Why a repeat PPSV23 on 10/11/27 is also not appropriate: ACIP has no PPSV23 -> PPSV23 interval
> of 1 year. The >=1-year rule after PPSV23 applies to giving a conjugate (PCV15/20/21) afterward."
>
> "Use PCV20 or PCV21, not PCV15. PCV15 adds nothing over the patient's prior dose." /
> "Either one completes the series with nothing further needed."

⚠️ **This is the "B1 defect" the previous handoff flagged, and this ruling is its fix.** The chip
used to repeat *the same vaccine that was rejected*, reusing *the interval of the rule that
rejected it*. Both halves were wrong: the owed vaccine comes from the VALID history, and the
interval comes from the pair (vaccine before -> vaccine owed).

### 5. THE REPEAT DATE IS THE LATER OF TWO CLOCKS
> "The repeat is due on the later of the two dates. ... **Conservative should mean meeting every
> published interval, not waiting the longest.** ... A date of 19 Jun 2027 ... adds no protection,
> leaves a 70-year-old without a valid dose for longer, and is not required by ACIP or the
> invalid-dose rule."

| Clock | Anchor | Length |
|---|---|---|
| 1 | the **last valid** dose | the interval from that vaccine to the owed conjugate |
| 2 | the **invalid** dose | the interval from that vaccine to the owed conjugate |

Both clocks use the SAME interval lookup — one function, two anchors, `max`. The owed vaccine is
always a conjugate (ruling 4), so only two rows of the lookup are ever read:

| Dose the clock is anchored on | Healthy / chronic | IC / cochlear implant / CSF leak |
|---|---|---|
| a **conjugate** | **1 year** | 8 weeks |
| a **PPSV23** | 1 year | 1 year |

**Her rejected alternative, recorded so it is not re-tried:** a flat 8-week second clock for every
adult. She chose 1 year for healthy/chronic after being shown that CDC publishes an adult
conjugate-to-conjugate year and the 8 weeks is paediatric — see Citations below. Her instruction
for the card's wording is ruling 6.

### 6. THE CARD MUST SAY WHICH NUMBER IS EVIDENCE AND WHICH IS INTERPRETATION
Verbatim: *"but make it clear that the 8 week interval is pediatric data with nothing clarifying
adults. Cite the reference. State using 1 year is an interpretation from ACIP minimum interval for
adults between PCV13 and the next conjugate. Cite this too."*

So the rule's `source`, `CLINICAL_SPEC.md` §K and the card text must all carry: the 1 year is an
**interpretation** of CDC's PCV13 -> PCV20/21 sentence (written for a planned next dose, applied
here to a repeat); and the 8 weeks is **paediatric**, with no adult equivalent — recorded
explicitly so a later session does not "correct" the year down to 8 weeks believing it had an adult
basis.

---

## Citations, all read live 2026-10-24

**CDC Adult Immunization Schedule Notes, pneumococcal** —
`https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo`

> "1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PCV13 dose."

CDC's **only** adult conjugate-to-conjugate interval, and it is 1 year. ⚠️ A CORRECTION made
in-session: the owner was first told adult ACIP specifies no conjugate-to-conjugate interval at
all. That was wrong, and the live page is what caught it. Her own phrasing of the citation
("ACIP minimum interval for adults between PCV13 and the next conjugate") was exactly right.

Same page, general notes — the rule that invalidates the dose:

> "Doses of any vaccine administered >=5 days earlier than the minimum age or minimum interval
> should not be counted as valid and should be repeated."

The pneumococcal note itself says nothing about repeating, invalidity, or a dose not counting —
confirmed by a targeted second reading. That absence is why rulings 4–6 are **OWNER CLINICAL
DETERMINATIONS** and not ACIP's. Her own framing: *"ACIP's tables are built on valid history, so
they time the conjugate from the PPSV23. They do not address what to do after an invalid
conjugate."*

**CDC Child & Adolescent CATCH-UP Schedule, pneumococcal conjugate row** —
`https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html`
Table scope, in its own words: **"Children age 4 months through 6 years."**

> "8 weeks (as final dose for healthy children) if previous dose was administered between 7–11
> months (wait until at least 12 months old); OR if current age is 12 months or older and at least
> 1 dose was administered before age 12 months"

This is the whole basis of the 8-week figure, and it is paediatric by the table's own scope line.

**CDSi v4.64 supporting data** (`AntigenSupportingData- Pneumococcal-508.xml`, local copy) — she
asked directly, *"Check how your IIS/CDSi forecaster scores it"*:

- **All 39 intervals across every adult (19+/50+) pneumococcal series have `absMinInt = 0 days`.**
  No exceptions. `absMinInt` is the hard floor, so **CDSi would never have called any of these
  adult doses invalid** — it cannot adjudicate a repeat date, because it never asks for a repeat.
- CDSi's adult *recommended* intervals (`minInt`) for the dose after a conjugate: **1 year** for
  chronic/healthy, **8 weeks** for IC / CSF leak / cochlear implant. For the dose after a PPSV23:
  **1 year** for every group, IC included — which independently confirms her "no 8-week option in
  that direction".
- CDSi writes no conjugate-to-conjugate rule as such: it attaches one interval to the dose
  *position* and lists which products may fill it, and PCV20/21 are allowable after a conjugate.
- The paediatric conjugate series carry real floors: `absMinInt = 8 weeks - 4 days`.

---

## The four patients any implementation must reproduce

`today = 2026-10-24`. Owed dose is PCV20 or PCV21 in every row.

| # | Patient | Valid history | Invalid dose | Clock 1 (last valid) | Clock 2 (invalid dose) | **Repeat due** |
|---|---|---|---|---|---|---|
| 1 | 70y, no risk | PPSV23 2025-10-11 | PCV15 2026-06-19 | 2026-10-11 | 2027-06-19 | **2027-06-19** |
| 2 | 70y, no risk | PPSV23 2025-10-11 | PCV15 2026-09-26 | 2026-10-11 | 2027-09-26 | **2027-09-26** |
| 3 | 60y, no risk | PCV15 2026-07-19 | PPSV23 2026-10-11 | 2027-07-19 | 2027-10-11 | **2027-10-11** |
| 4 | 40y, asplenia | PCV15 2026-08-30 | PPSV23 2026-10-11 | 2026-10-25 | 2027-10-11 | **2027-10-11** |

Patients 1 and 2 are the two she was shown when choosing the second clock's length; 3 and 4 are
family 3's patient and her immunocompromised twin. **Patient 4 is the one to watch**: her PPSV23
was 2 weeks early and she now waits a full year instead of 8 more weeks, because no 8-week option
exists in the PPSV23 -> conjugate direction for any risk group. That consequence was put to her
explicitly and she accepted it twice.

---

## Open, NOT ruled on

**Children.** Every ruling above is adult-shaped. She has said separately that *"pediatric
intervals don't follow the adult 1-year rule"* — a child's PPSV23 -> PPSV23 is 5 years and only for
IC or asplenia. So the test case
`C1` (5y asplenia, PCV20 2026-06-01, invalid PPSV23 2026-06-22) has **no warrant** from anything
here. Candidates not yet put to her: 8 weeks from the valid PCV20 (2026-07-27), or the adult shape
with paediatric numbers. **Ask with a worked child; do not carry the adult numbers across.** Any
implementation of rulings 4–6 must be measured for paediatric movement and show zero, or the
boundary becomes an accident rather than a decision.
