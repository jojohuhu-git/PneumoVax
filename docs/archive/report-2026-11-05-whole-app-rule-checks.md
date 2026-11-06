# Whole-app rule checks — report, 2026-11-05

**Measured on** branch `audit/2026-11-05-whole-app-rule-checks`, from `main` at `83e095d`.
**No engine rule and no card wording changed.** Neither verdict corpus moved. `npm test`: 2,091 passed,
0 failed. Fixes are in the queue and go through `fix-queue` one at a time:
`.claude/prompts/fix-2026-11-05-whole-app-rule-checks.md`, with a copy that travels with the repo at
`docs/archive/fix-queue-2026-11-05-whole-app-rule-checks.md`, because `.claude/` is not tracked by git.

## In one minute

The app now has seven automatic questions it can ask of every patient, such as "if you follow the
card, does the app accept the dose?". They ran over **77,496 patients** and followed
**1,075,534 screens** forward through time.

- **One fault is worth fixing first (R1).** An immunocompromised child with a recent PCV15 and an
  old PPSV23 is told a 2nd PPSV23 is due today, and the app then throws that dose out. Measured:
  **2,110 patients**. It is still in the app today. The cause is one date worked out separately in
  four places.
- **One fault needs your decision before anything can be fixed (R2).** A child's card can give a date
  after the 19th birthday, and on that date the adult rules say something else, often "Complete".
  Measured: **1,871 patients**.
- **A second decision is about one word (R5).** At-risk babies read "Complete" on a card that also
  says a dose falls due at 2. Your rule of 2026-11-01 says Complete should not be used then.
- **Reading 42 ordinary patients against CDC's own pages found no wrong dose, product or date.** The
  one mismatch, Lou, follows your 2026-10-30 ruling. The reading found two wording faults the seven
  checks cannot see (R8, R9).
- **Ten patients on the live PneumoRecs site** matched, apart from two differences you have already
  ruled on.

## The seven checks

"Patients" counts each person once. The two groups are the 17,016 on the existing grid and the 60,480
new typical patients (vaccinated 7 to 17-year-olds, and adults either side of each interval).

| Check | Asks | Grid | New patients | Causes behind it | Now |
|---|---|---|---|---|---|
| 1 Advice is accepted | A dose given on the advised date is never rejected or called unneeded | 155 | 1,286 | R1, R2, R4 | Fails |
| 2 The plan holds | Following the card to the end needs no dose it did not mention | 150 | 308 | R4, R6 | Fails |
| 3 Complete means complete | No later visit asks for another dose | 1,144 | 0 | R5, R7 | Fails |
| 4 Options agree | Alternative cards for one dose follow one wait | 82 | 2,044 | R1, R4 | Fails |
| 5 Card and chip agree | Card and chip agree on the date of one dose | 55 | 110 | R4 | Fails |
| 6 Age lines are clean | A day either side of a line changes only what the rule says | 87 | 0 | R2 | Fails |
| 7 Stable over time | A later look at the same record does not change the advice | 589 | 1,244 | R2, R3, R4 | Fails |

Check 6's only failure is R2. Its other parts all pass: on every age line the app's answer and wording match just inside the line, and nothing changes at a line that the line's rule does not cover. 0 cards were unreadable.

## What each failure is, by cause

Every flag falls into one of these. There are **0 unsorted**. Harness errors are listed separately
below; none of them is counted in these numbers.

| Cause | What | Real or harness | Grid | New patients | Total | Priority |
|---|---|---|---|---|---|---|
| R1 | 2nd-PPSV23 card ignores the 8 weeks after a recent PCV | Real | 66 | 2,044 | 2,110 | P0 |
| R2 | A child's card gives a date after the 19th birthday | Real | 627 | 1,244 | 1,871 | P1, your decision |
| R3 | An infant's date moves at 7 months | Real | 33 | 0 | 33 | P2 |
| R4 | A thrown-out childhood PPSV23's 5-year date, read two ways | Real | 71 | 110 | 181 | P2, park |
| R5 | "Complete" beside a dose falling due at 2 | Real | 832 | 0 | 832 | P1, your decision |
| R6 | Option B says it completes; a dose can come at 19 | Real | 145 | 308 | 453 | P2, your decision |
| R7 | A baby's complete card is silent on the adult schedule | Real | 312 | 0 | 312 | No change |
| R8 | A card says "at or after age 6" about earlier doses | Real, wording | 0 | 23,544 cards | 23,544 cards | P2 |
| R9 | "May be given now" under a future date | Real, wording | 40 cards | 48 cards | 88 cards | P2 |

A patient can have more than one cause, so the rows do not add up. R5 and R7 show 0 new patients because the new list starts at age 7. R8 and R9 count cards, because a person found them by reading and a separate count measures them.

### R1 — the 2nd-PPSV23 card ignores the 8 weeks after a recent PCV. REAL. P0.

**Noor, 10, HIV.** PCV13 at 2, 4, 6 and 12 months. PPSV23 at 5. PCV15 two weeks ago.

| | The app says today |
|---|---|
| "1 dose PCV20" card | Not yet due, Nov 22, 2026 |
| "2nd PPSV23 (alternative)" card beside it | **Due today** |
| If the PPSV23 is given today | *"Given 14 days after the most recent PCV dose… This dose does not count toward the series"* |

CDC says both waits apply, for both vaccines: *"administer 1 dose PCV20 or 1 dose PPSV23 at least 8
weeks after the most recent PCV13 dose and at least 5 years after dose 1 PPSV23"* (Child Notes, read
live today). PneumoRecs, live: *"give 1 dose of either PCV20 or PPSV23 at least 8 weeks after most
recent dose of PCV13 and 5 years after the first dose of PPSV23."*

**Measured:** 2,110 patients see the two cards disagree (66 grid, 2,044 new). On 1,302 of them (66 grid,
1,236 new), following the 2nd-PPSV23 card ends in that dose being thrown out. The grid's 66 is the
figure from the first run; the new patients are what the grid could not reach, because it has no vaccinated
child between 6 and 18.

**Why:** four places in `recommend.js` work the PPSV23 card's date out with the five years alone; the
PCV20 card calls the helper with both waits. See "Rules worked out twice". **Tried in a throwaway copy:** giving the PPSV23 card the same helper at all four places took R1 from 2,110 patients to **0**, on checks 1 and 4 over all 77,496, with no new failure.

### R2 — a child's card gives a date after the 19th birthday. REAL. P1, needs your decision.

Three families, one cause: the card uses the child's rules for a date that falls in adulthood.

| Family | Patient | The card says | On that date the app says |
|---|---|---|---|
| A: immunocompromised, PCV15 + PPSV23 | **Tess, 14, no spleen.** PCV15, then PPSV23 Oct 12, 2026 | PCV20 or a 2nd PPSV23 on Oct 12, 2031 | **Complete (PCV15 + PPSV23)**. It changes on her 19th birthday, the day before the date |
| B: immunocompromised, PCV13 + PPSV23 | **Rafi, 14, no spleen.** PCV13 baby series, PPSV23 Oct 12, 2026 | PCV20 or a 2nd PPSV23 on Oct 12, 2031 | PCV20 or PCV21. The 2nd PPSV23 has gone |
| C: within 8 weeks of 19 | **Cal, 18 years 11 months, heart disease.** PCV15 today | PPSV23 on Dec 6, 2026 | PPSV23 **Oct 11, 2027**. If given Dec 6 it counts, with "shorter than the 1 year CDC advises" |

**Why:** the app already runs a patient forward to 19, but only for a card saying "complete"
(`withAtNineteen`, `recommend.js:1455`). A card asking for a dose never looks ahead.

### R3 — an infant's date moves when the child turns 7 months. REAL. P2.

**Remy, 6 months, HIV, first dose today.** Given as advised, dose 2 goes in at 6 months 28 days. The
card then says dose 3 is due **Dec 6**. On Dec 6 the same card says **Jan 3**. A dose given Dec 6 is
accepted, so nothing is wasted; only the advice moves, by 4 weeks. The band comes from the child's age
today, not the age on the advised date (`recommend.js:778`). 33 grid patients, all this road.

### R4 — a thrown-out childhood PPSV23: two surfaces read its 5-year date differently. REAL. P2, recommend parking.

**Max, 5, no spleen.** A PCV of unrecorded product and a PPSV23 on the same day a year ago, so the
PPSV23 was thrown out. The card says the next PCV is due today. The chip under the PPSV23 says *"the
next dose in this series can be given from Oct 11, 2030"*. Both are right about different vaccines, and
a reader cannot tell. The grown-up version is firmer: a 19-year-old's card asks for a PPSV23 in 2027, the
chip still says 2030, and the dose then reads "shorter than the 5 years advised".

The child path applies your 5-year hold (`holdPpsv23AfterThrownOut`); the adult path does not. **It
takes a PPSV23 given within 8 weeks of a PCV in childhood.** You asked on 2026-10-31 not to bring very
unlikely histories to you, so I recommend parking it.

### R5 — "Complete" on a card that says a dose falls due at 2. REAL. P1, needs your decision.

**Sadie, 15 months, no spleen, four PCV13 on time.** The pill reads **Complete**. The label reads "PCV
series complete (4 doses)". The note reads *"one further dose falls due at age 2 years"*. The card is
honest, but the pill breaks your rule: *"Complete should only be used if no additional doses/boosters
are needed."* The rule came two weeks after this card was written (FINDING E, 2026-10-17).

### R6 — Option B says it completes the series; at 19 a dose can still come. REAL. P2, needs your decision.

**Cora, 14, cochlear implant, PCV13 baby series.** Option A is PCV20. Option B is PPSV23, and the card
says *"Either a single dose of PCV20 or a PPSV23 completes the recommended series"*. After Option A she
is finished for life. After Option B the "complete" card says, correctly, that at 19 the adult schedule
gives PCV20 or PCV21. So the two options are not equal, and the card she chooses from does not say so.

### R7 — a baby's "series complete" card is silent on the adult schedule. REAL, but no change recommended.

A healthy baby with four PCV15 reads "PCV series complete". At 50 the adult card asks for a PPSV23. The
2-to-5 card says "Re-evaluate at age 50"; the baby card does not. The ask is 48 years away. Listed so
nobody finds it again.

### R8 — a card says "at or after age 6" about doses given before 6. REAL, wording only. P2.

Found by reading, not by a check. **Ada, 8, cochlear implant.** PCV13 at 2, 4, 6 and 12 months, PPSV23
at 2, PCV15 at 7. Her card reads *"Complete (PCV13 and PCV15 + PPSV23 at/after age 6)"*. Only the PCV15
was. The verdict is right: CDC calls her complete either way. Measured: **23,544 cards**. **The grid has 0 of these**, because
it has no vaccinated child over 6. Every one has a conjugate at 6 or over on top of a baby series, which
is mostly off-schedule, so these counts overstate how often a clinician sees it.

### R9 — "may be given now" under a date still ahead. REAL, wording only. P2.

Found by reading. **Pax, 40, HIV.** PCV13 and two PPSV23, the last one 4 years ago. The header says *"Not
yet due — eligible Nov 5, 2027"*. The note says *"1 dose of PCV20 or PCV21 may be given now, ≥5 years
after the last pneumococcal dose"*. Measured: **88 cards** (40 on the grid, 48 on the new list).

## What looks inconsistent but is your own ruling

These are reported and do not fail, each with its section so it can be re-read.

| | What it looks like | Patients | Why it stays |
|---|---|---|---|
| D1 | A "complete" card, and a dose asked for at 19 or 50 | 5,370 | The card says so. §B-AT19, §B-5TO18 |
| D2 | A child's extra PPSV23 reads "counted" once they turn 19 | 6,840 | §C-P2-ONTIME: adult rows count every PPSV23 received |
| D3 | Option A due now, Option B PPSV23 years away | 2,210 | §C-P2-FIVE: held 5 years after a thrown-out PPSV23, and the card says why |

D1 and your 2026-11-01 rule pull against each other. It is the same question as R5, so Decision 2 asks
both together.

## Harness errors

Flags that were my tool's fault, not the app's. All are fixed, and none is in any count above.

| Error | False flags | Fix |
|---|---|---|
| A card with no date read as "due today" ("not due until 12 months"), from the first throwaway run | 924 | `readCard()` has a closed list of kinds. A card it cannot read is reported, never guessed. 0 unreadable cards this run. Proved by control H1 below |
| "Dose 1 of 2" not read as promising dose 2 | 680 | Reads the total from the label |
| A PCV20 offered in place of a PPSV23 the first card had promised | 300 | That further dose WAS mentioned |
| "Moved on its day" naming the wrong line: "crossed 216m" for a patient crossing 19 | relabelling | Names the last line crossed |
| 4,047 "unsorted" that were age lines working normally | relabelling | Sorted as "line doing its job" |

**A check-3 limit worth knowing.** Whether a card "warned" of a later dose is read from its words by
pattern. Check 2's "mentioned" is the same. Both are good at finding a family and poor at a borderline
sentence, which is why I do not recommend either as a gate.

## Proving each check can fail

Each break was made in a throwaway copy, so this working copy was never touched. Several checks still
fail on the real app, so the bar is that the count must **move**.

| Break | What was broken | Check | Failing patients, unbroken | Failing patients, broken | Caught? |
|---|---|---|---|---|---|
| M1a | Cards advise 6 weeks where the dose check still wants 8 | 1 | 155 | 1,452 | Yes |
| M2a | The adult PCV card says it finishes the series when PCV15 does not | 2 | 150 | 401 | Yes |
| M2b | The adult PCV card stops mentioning the PPSV23 that PCV15 needs | 2 | 150 | 401 | Yes |
| M3a | At-risk "complete" cards lose the line saying what happens at 19 | 3 | 1,144 | 2,118 | Yes |
| M4a | The PCV20 card takes the earlier of its two waits, not the later | 4 | 82 | 1,063 | Yes |
| M5a | The chip under a thrown-out dose prints a date a year later | 5 | 55 | 1,442 | Yes |
| M6a | The 6-year line moves to 6 years 1 month | 6 | 87 | 87, plus the line that stopped acting: age 72m, PCV13 dose at 72m, PCV15 dose at 72m | Yes |
| M6b | The 2-year line reads "up to and including 24 months" | 6 | 87 | 527, plus the line that stopped acting: age 24m | Yes |
| M6c | PCV21 minimum age moves a month past 18 years | 6 | 87 | 87, plus the line that stopped acting: PCV21 dose at 216m | Yes |
| M7a | An advised date counts from today rather than from the last dose | 7 | 589 | 878 | Yes |
| M7b | A dose's adult-or-child verdict reads today's age, not the age at the dose | 7 | 589 | 781 | Yes |
| H1 | CONTROL, breaking the harness: "not due until 12 months" read as due today, the 924-false-flag bug | 1 | 155 | 617 | Yes |

**One break went unnoticed at first, and that was a finding.** M6c, moving PCV21's minimum age, changed nothing the check looked at, because the line it left simply stopped acting. So every age line and every dose line must now prove it still changes something, and M6c is caught. M6a and M6c are the re-run figures.

H1 is a control on my own tool, not on the app. Putting the old harness error back adds 462 patients to check 1 (617 against 155). The 924 in the first run counted roads rather than patients. Unlike the throwaway, this one fails loudly if the error returns.

## Rules worked out twice

I read `recommend.js`, `intervals.js`, `validate.js` and `doseIntervalRules.js` for one rule computed in
more than one place. **Yes, this explains the two largest real causes.**

| Rule | Where | Explains |
|---|---|---|
| The next dose after a PPSV23 for an immunocompromised child: later of 5 years and 8 weeks | Right: `icPostPpsv23DueState`, `recommend.js:396`. Five years only: `recommend.js:2412`, `2684`, `2807`, `2997` | **R1, all of it** |
| What the adult rules will say at 19 | Only on complete cards: `withAtNineteen`, `recommend.js:1455`, called at `4449`. Cards asking for a dose read child rules alone | **R2, and R6's silence** |
| A child's 5-year hold after a thrown-out PPSV23 | Chip: `repeatDueDate`, `doseIntervalRules.js:1582`. Card: `holdPpsv23AfterThrownOut`, `recommend.js:1376`, called on the child path only (`4452`) | **R4** |
| Which age band a dose falls in | Dose check uses the age at the dose. The infant card passes today's age: `recommend.js:778` | **R3** |
| "Is this person a child?" for an extra PPSV23 | `validate.js` asks the age at the dose and, on purpose, the age today (the `ageMonths < ADULT_SCHED_MIN_M` limit) | D2, deliberate |
| The 8-week number | `WK8` in `recommend.js:71` and `PCV_PPSV23_MIN_INTERVAL_DAYS` in `intervals.js:317` | Nothing today. They agree, but break M1a shows changing one alone is not caught by the app itself |
| The first-PPSV23 lookup | `ppsv.effective.find((d) => d.date)?.date \|\| anchorPneumo`, written 5 times | Nothing today. One helper would remove it |

The pattern matches the bug this file's rulebook keeps warning about: **one rule, two readings, and the
tests only ever exercised the one reading the grid could reach.** R1's four copies were protected by a
comment saying the 8-week floor "changes no committed verdict": true of the grid, which has no
vaccinated child in the ages where it bites.

## 42 ordinary patients against the live sources

Picked because their card wording appears on no patient in either earlier comparison list. Of the 160
different card wordings these patients can show, 94 are on neither list. The 42 reach 27 of those 94,
which are 72% of the cards carrying an unaudited wording (27,721 of 38,732); the rest are rarer. Read live on
2026-11-05: CDC Child Notes; CDC Adult Notes; CDC "Summary of Risk-based Pneumococcal Vaccination
Recommendations" (May 8, 2026); ACIP mm7401a1 (January 2025), clinical guidance table; immunize.org
p2016 (2/16/2024), Tables 1 and 2. To reproduce: `node scripts/wholeApp/sourceCheckPatients.mjs`.

| Patient | Age, risk, history | App | Source | Verdict |
|---|---|---|---|---|
| S01 Ada | 8, cochlear. PCV13 ×4, PPSV23 at 2, PCV15 at 7 | Complete | Risk page, non-IC: "Received PPSV23: Their pneumococcal vaccinations are complete" | Dose agrees. **Wording R8** |
| S02 Ben | 18, cochlear. PCV15 at 16, PPSV23 at 17 | Complete | Child Notes: "no further doses" (PCV15 read as PCV13, your ruling) | Agrees |
| S03 Cleo | 9, no spleen. PCV13 ×4, PPSV23 at 2, PCV15 at 8 | PCV20 or 2nd PPSV23, due | Child Notes, IC row | Agrees. Wording R8 |
| S04 Dan | 10, cochlear. PCV13 ×4, PCV20 at 9 | Complete | Risk page: "When PCV20 is used… complete" | Agrees |
| S05 Eve | 12, no spleen. PCV15 at 10, PCV20 at 11 | Complete | Same | Agrees |
| S06 Finn | 12, HIV. PCV15 ×5, PPSV23 30 days after, thrown out | PCV20 due, no PPSV23 | CDC 8 weeks; your rulings on Noah and Sam | Agrees |
| S07 Gia | 8, CSF leak. Unrecorded ×4, PCV15 at 7, PPSV23 at 2 | Complete | As Ada | Dose agrees. Wording R8 |
| S08 Hal | 9, diabetes. PCV13 ×4, PCV15 at 8 | PCV20 or PPSV23 | Child Notes: "Not previously received PCV20: 1 dose PCV20 or 1 dose PPSV23" | Dose agrees. Wording R8 |
| S09 Iris | 7, cochlear. PCV13 ×4, PPSV23 at 5 | Complete; PCV20/21 at 19 | Risk page; Adult Notes, cochlear row | Agrees |
| S10 Jude | 10, no spleen. PCV13 ×4, PCV15 at 9 | PCV20, or PPSV23 then 5-year dose | Child Notes, IC row | Dose agrees. Wording R8 |
| S11 Kim | 22, no spleen. PPSV23 ×2, no PCV | PCV15/20/21, no more PPSV23 | Adult Notes: "If PCV15 is used, no additional PPSV23 doses are recommended" | Agrees |
| S12 Lou | 12, HIV. PCV13 ×4, PPSV23 at 2 and 7, PCV15 at 11 | **PCV20 due** | Risk page: 2 PPSV23 doses, "complete" | **Differs: your ruling** ("Sofia", 2026-10-30): the conjugate came after both, so the PCV20 is still owed |
| S13 Mae | 7, diabetes. PCV15 ×4, PPSV23 at 2 | Complete | Risk page | Agrees |
| S14 Ned | 8, cochlear. Unrecorded ×4, PPSV23 at 5 | Complete | Risk page | Agrees |
| S15 Oli | 30, heart. PCV15 at 28 | PPSV23 due | Adult Notes, ≥1 year | Agrees |
| S16 Pia | 17, heart. PCV13 at 10, PPSV23 at 12 | Complete; review at 50 | Child Notes; Adult Notes | Agrees |
| S17 Quin | 7, CSF leak. Unrecorded ×4, PCV15 at 6½ | PCV20 or PPSV23 | Child Notes | Dose agrees. Wording R8 |
| S18 Rae | 75. PCV13 at 64, PPSV23 at 66 | Shared decision | Adult Notes, verbatim | Agrees |
| S19 Sid | 15 months. PCV20 at 3 months | Dose 2 of 3 | p2016 Table 1: "1 before age 12 months… 2 additional doses" | Agrees |
| S20 Tia | 15 months, no doses | Dose 1 of 2 | p2016 Table 1 | Agrees |
| S21 Uma | 4, cochlear. PCV15 at 2 | Dose 2 of 2 | Risk page: "<3 PCV doses before age 2 years: Give 2 doses" | Agrees |
| S22 Vic | 3, heart, no doses | Dose 1 of 2 | Same | Agrees |
| S23 Wes | 25, no spleen. PCV21 at 24 | Complete | Adult Notes | Agrees |
| S24 Xan | 8, HIV. Unrecorded ×4, PCV15 at 7 | PCV20, or PPSV23 then 5-year dose | Child Notes, IC row | Dose agrees. Wording R8 |
| S25 Yara | 18, cochlear. Unrecorded at 10, PPSV23 at 15 | Complete; PCV at 19 | Child and Adult Notes | Agrees |
| S26 Zed | 4, no spleen. PCV13 ×4 | PCV20, or PPSV23 then 5-year dose | Child Notes, IC 2-5 | Agrees |
| S27 Amy | 18, cochlear. PCV13 at 8 | PCV20 or PPSV23 | Child Notes | Agrees. R6 applies |
| S28 Bo | 6, cochlear. Unrecorded ×4 | PCV20 or PPSV23 | Child Notes | Agrees |
| S29 Cy | 50, no spleen, no doses | PCV15/20/21 | Adult Notes, routine | Agrees |
| S30 Di | 7, no spleen. Unrecorded ×4 | PCV20, or PPSV23 then 5-year dose | Child Notes | Agrees |
| S31 Flo | 7 months. PCV15 at 3 and 4 months | Dose 3 of 4, due | p2016 Table 1: "2 additional doses" | Agrees |
| S32 Gus | 5, no spleen. PCV13 ×3, no booster | 1 dose PCV | Child Notes: "3 PCV doses: 1 dose PCV" | Agrees |
| S33 Hana | 4. PCV13 ×3, no booster | 1 dose PCV | Child Notes: healthy 2-4, incomplete series | Agrees |
| S34 Ian | 2. PCV13 at 7, 9, 12 months | Complete | p2016 Table 2 | Agrees |
| S35 Joy | 5, cochlear. PCV13 ×4 | PCV20 or PPSV23 | Child Notes | Agrees |
| S36 Kai | 4, heart. PCV13 ×4, PPSV23 at 3 | Complete; review at 50 | Risk page; Adult Notes | Agrees |
| S37 Lea | 55. PCV13 at 53 | PCV20 or PCV21 | Adult Notes | Agrees |
| S38 Mo | 67. PPSV23 at 65 | PCV15/20/21 | Adult Notes | Agrees |
| S39 Nia | 55, HIV. PCV15 three months ago | PPSV23 at 1 year; 8 weeks named as an option | Adult Notes: "may use minimum interval of 8 weeks" | Agrees |
| S40 Ola | 45, diabetes. PCV13, PPSV23 | No dose now, review at 50 | mm7401a1 row; Adult Notes | Agrees. See Decision 2 |
| S41 Pax | 40, HIV. PCV13, PPSV23 ×2 | Review at 50, or PCV20/21 at 5 years | mm7401a1: "Alternatively, a single dose of either PCV21 or PCV20…" | Dose agrees. **Wording R9** |
| S42 Rob | 60. PCV13, PPSV23 at 51 | PCV20 or PCV21 | Adult Notes | Agrees |

**Score: 42 of 42 read. 41 agree on the dose, product and timing. S12 Lou differs and follows your
ruling. No new dose disagreement.** Sources were read to answer the patient in front of them, not
searched for every possible error.

## Ten patients on the live PneumoRecs site

**Done, with one limit.** The eight teens' answers were set in one step and the site's own decision
code was run on them, because its screens move slowly while the app's browser pane is hidden. The two
adults were clicked through screen by screen. The patients under 6 could not be driven this way, so
none of the ten is under 6. The tool's own page date is December 15, 2024, older than mm7401a1.

| Patient | PneumoRecs prints | App | Verdict |
|---|---|---|---|
| S03 Cleo | "If at least 1 dose of either PCV15 or PCV20 was given at any age, schedule is complete. If not, give 1 dose of either PCV20 or PPSV23 at least 8 weeks after most recent dose of PCV13 and 5 years after the first dose of PPSV23." | PCV20 or 2nd PPSV23 | **Differs on PCV15: your ruling** of 2026-11-01 (the dose is owed, quoting mm7137a3). The same sentence backs R1's 8 weeks |
| S04 Dan | "If at least 1 dose of PCV20 was given at any age, schedule is complete." | Complete | Agrees |
| S08 Hal | "If PCV15 was given at or after age 72 months, then give 1 dose of PPSV23… If PCV13 was given (at any age)… 1 dose of either PCV20 or PPSV23" | PCV20 or PPSV23 | Agrees. He has both, so both sentences fit him |
| S09 Iris | "Schedule complete." | Complete | Agrees |
| S10 Jude | "…give 1 dose of either PCV20 or PPSV23 at least 8 weeks after most recent dose of PCV… a second dose of PPSV23 5 years after the first" | Same | Agrees |
| S12 Lou | "Schedule complete." | PCV20 | **Differs: your ruling** ("Sofia") |
| S13 Mae | "Schedule complete." | Complete | Agrees |
| S16 Pia | "Schedule complete." | Complete | Agrees |
| S40 Ola | "No additional doses of any type of pneumococcal vaccine are recommended at this time. Check this app when your patient turns 50 years old" | Same | Agrees |
| S41 Pax | "Give one dose of PCV20 or PCV21 at least 5 years after the last pneumococcal vaccine dose or give no additional pneumococcal vaccines… check this app when your patient turns 50 years old" | Same | Agrees |

## Which checks should become permanent gates

A gate is a test that blocks a merge when it fails. **A check that still fails stays out of the required
run until its fix lands.** That rule is why only one check is in `npm test` today.

| Check | Recommendation | When |
|---|---|---|
| 6 Age lines | **Gate. In `npm test` now**, except the R2 part, left out by name | Today |
| "Every card can be read" | **Gate. In `npm test` now** | Today |
| 4 Options agree | Gate | When R1 lands |
| 1 Advice is accepted | Gate. The most valuable of the seven | When R1 and R2 land |
| 7 Stable over time | Gate | When R2 and R3 land |
| 5 Card and chip agree | Gate | When R4 is fixed, or parked with its count pinned |
| 2 The plan holds | **Not a gate.** Run by hand before a release | Reads words by pattern, so a copy edit could turn it red |
| 3 Complete means complete | **Not a gate** until Decision 2 | Reads words by pattern |

Checks 1, 4, 5 and 7 follow patients forward, which takes about 3 minutes, too slow for `npm test`. I
recommend a separate step on each pull request that touches `src/logic/`, using the 17,016 only (about 1
minute), and the whole list before a release. `npm run checks` runs them.

## What these checks cannot see

- **They only catch the app disagreeing with itself.** An app consistently wrong would pass all seven.
  That is why the 42 live readings matter, and they found no wrong dose.
- **The typical list has no babies and no children under 7.** The grid covers those ages, but only
  through its fixed day offsets.
- **Impossible records are left out**: dates before birth or in the future, on purpose.
- **The replay never runs late.** Every dose goes in on its advised date; nothing tests a dose a month
  after it.
- **Wording is compared only on age lines.** R8 and R9 were found by a person reading.
- **The screens quoted here come from the engine, not from clicking through the app.** `show.mjs` calls
  the same `recommend()` the app calls, but no patient here was typed into the running app. No fix
  was made, so there was nothing to confirm on screen; each fix will be.

## Decisions for you

Each is written to stand alone, for a question box.

**Decision 1 (R2). A child whose card gives a date after their 19th birthday.** Tess is 14 with no
spleen. She had PCV15, then PPSV23 on Oct 12, 2026. Her card says: give PCV20 or a 2nd PPSV23 on Oct 12,
2031. She turns 19 on Oct 11, 2031, and from that day the app says "Complete (PCV15 + PPSV23)", so the
dose her card promised is no longer offered. An immunocompromised 12-year-old with the same history does
get it, at 17. Rafi, same age and condition but PCV13, keeps a dose, though the 2nd PPSV23 option
disappears. **1,871 patients in all.** Which should win?
- **(a) The adult rules.** Tess's card says now what will happen at 19: "Complete at 19 under the adult
  schedule". CDC's adult page calls PCV15 + PPSV23 complete. Tess gets no further dose.
- **(b) The child rules.** The dose stays owed after 19 for a child who was already waiting for it. No
  document states this; it would be your clinical determination.
- **(c) Keep both and say so.** Her card names the date and adds that the adult schedule calls her
  complete from 19, leaving the choice to the clinician.

**Decision 2 (R5). Does "Complete" stay when a dose is known to be coming?** Sadie is 15 months with no
spleen and four PCV13 on time. Her card reads "Complete" and says one further dose falls due at age 2.
Your rule of 2026-11-01: *"Complete should only be used if no additional doses/boosters are needed."*
Ola is 45 with diabetes, PCV13 and PPSV23. Her card reads "No dose now — review at age 50", under the
pill "Complete", and says a dose is recommended at 50. Iris is 7 with a cochlear implant; her card reads
Complete and says PCV20 or PCV21 at 19, which you ruled on 2026-10-30. Which of these keep the word?
- **(a) None.** Any card that names a future dose loses "Complete".
- **(b) Sadie only.** A dose inside the child schedule loses it; the adult schedule starting at 19 or 50
  is a new rulebook, so Iris and Ola keep it.
- **(c) Sadie and Ola, not Iris.**

**Decision 3 (R6). Should Option B say a dose may follow at 19?** Cora is 14 with a cochlear implant and
a PCV13 baby series. Option A is PCV20, and she is finished for life. Option B is PPSV23, and the card
says it "completes the recommended series", but at 19 the adult schedule gives her PCV20 or PCV21. Should
the Option B card add one line, such as "At 19 the adult schedule gives PCV20 or PCV21"? It would cite
the adult notes. Or leave the card short, since the next card says it?
