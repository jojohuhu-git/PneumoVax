# PneumoVax — Handoff after C11, with the adult extension still an OWNER DECISION (2026-10-24)

> **SUPERSEDED 2026-10-24** by `handoff-2026-10-24-three-adult-families-shipped.md`.
> Families 1, 2 and 3 are BUILT and on PR #84. Do not resume from this document.


Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
**read the real port from `preview_logs`** (5173 this session). What the app is: a
client-side React SPA giving pneumococcal vaccine advice across the lifespan. No backend;
**every clinical claim on a card must be traceable to a document that speaks for *that
patient***.

Branch: **`feature/2026-10-23-ruling-d-repeat-dose-anchor`** at `129f56c`, off `main` at
`9da398d`, **pushed**, [PR #83](https://github.com/jojohuhu-git/PneumoVax/pull/83) open and
now carrying two commits. Suite **1,432 in 130 files → 1,438 in 131, 0 failures, 0 skips**.
Working tree clean apart from an untracked `~$INICAL_SPEC.md` — a Microsoft Word lock file
(CLINICAL_SPEC.md is open in Word). **Never commit it**; `git add -A` picks it up and the
root-hygiene hook correctly blocks the commit.

Consumed and superseded: `handoff-2026-10-23-ruling-d-repeat-dose-anchor.md`.

## What's done — C11 (commit `129f56c`)

**OWNER RULING 2026-10-24, answering the FIRST of PR #83's two open questions.** Her words:
*"I don't need the app to recommend dates within the 4 day grace period. Just the routine
date next dose is due with a comment on the earliest date it could be given."*

A 7-month-old with a mistimed third PCV dose had **three** dates for one next dose on screen
— header "eligible Dec 7, 2026", chip "due on or after 2026-11-05" (minimum MINUS the
grace), note "can be given from 2026-11-09 … the minimum interval of 4 weeks". `intervals.js`
had always said the grace is a VALIDITY rule and "NOT the scheduler"; Ruling D had put a date
from the validator's side of that line on screen as advice.

The split, now in code and in `CLINICAL_SPEC.md` §L:

| Field | Grace | Because |
|---|---|---|
| `earliestValidDate` | **keeps** it | asks whether a dose ALREADY GIVEN counts — the grace *is* that question; it is also the field the verdict corpora record |
| `repeatDueDate` | **loses** it | advice about a dose NOT YET GIVEN |

The grace is a **parameter of `intervalFrom`**, never a second reading of the interval. The
chip also names its date as the **earliest**, never as the date the dose is **due** — the rec
card is the only surface that knows C10-2's routine age and spacing, so it is the only one
that states a due date.

Measured, never quoted: **10,712** chip sentences moved, **every one +4 days later, 0
earlier**; **6,750 of 35,280** prose lines changed (5,496 real patients, 1,254 impossible
entries), every one differing in that sentence alone, **0 unexplained**; **0 verdicts moved**
in either corpus; uncredited (source, statement) pairs **1**, unchanged. Guard
`regression-2026-10-24-advice-never-inside-the-four-day-grace.test.js`, proved load-bearing
three ways (10 / 6 / 5 failures per broken clause). Live-verified in the running app.

Five existing tests pinned the graced date or the old sentence and were updated, each keeping
its own original assertion; two negative assertions were rewritten to name the superseded
DATE rather than wording the app no longer prints anywhere.

## What's NOT done — the OPEN OWNER DECISION, and it is the whole next session

**The adult extension of Ruling D.** She chose "option B" on 2026-10-24 — *"the rule is: The
repeat dose should be spaced after the invalid dose by the recommended minimum interval"* —
then asked for the patients before committing, and after seeing them asked for families 2 and
3 to be explained again. **Nothing is implemented. Do not implement past her answer.**

Measured on the 17,016-patient grid: **470 cards move later, all adult, 0 children**
(Ruling D already settled children). **198 currently read "due today"**. 0 impossible
entries move. Three families, and they are clinically different — **she may well accept one
and refuse another, so build them as separate commits**:

| Family | Cards | History | App today | Under her rule |
|---|---|---|---|---|
| **1** — `ADULT-PCV20-21-5Y-AFTER-PPSV23` | **363** (132 "due today") | PCV13 2016, PPSV23 2021, PCV20 2025 (3y11m after the PPSV23) | due **Oct 2026** | **Oct 2030** |
| **2** — `ADULT-PCV-AFTER-PPSV23` | **66** (all 66 "due today") | PPSV23 Oct 2025, PCV15 Jun + Jul 2026 (both inside the year) | **today** | **19 Jul 2027** |
| **3** — `ADULT-PPSV23-AFTER-PCV15` | **41** (0 "due today") | PCV15 Jun + Jul 2026, PPSV23 Oct 2026 (3 months after) | **19 Jul 2027** | **11 Oct 2027** |

46 "distinct shapes" collapse to these three: the same history across ages 50 / 65 / 70 and
11 risk-factor combinations. **The risk factors change nothing** — identical dates for a
healthy 50-year-old and one with asplenia.

### Family 1 is NOT a judgement call — it is a reading error, found this session

CDC's row for a PCV13 + PPSV23 history counts from **"the last pneumococcal vaccine dose"**
(adult notes and mm7401a1 Table 1, both fetched live 2026-10-24). The 1-year rows name a
particular vaccine ("after the last PPSV23 dose", "after the last PCV13 dose"); the 5-year
row does not. `lastDoseDate()` in `recommend.js` builds it from `pcv.lastDate` — doses that
COUNTED — so the app deletes the rejected PCV20 and then applies CDC's sentence to what is
left, telling a woman who had a PCV20 twelve months ago to have another today. **Fixing the
reading gives Oct 2030 on its own, without Ruling D.** This is the single biggest and
best-supported item in the queue.

### OWNER RULINGS LATER ON 2026-10-24 — read these BEFORE touching families 2 or 3

She answered both families herself after seeing the worked patients. **Neither is
implemented.**

**FAMILY 2 — the card is RIGHT; the CHIP is wrong.** Her words: *"in this case 10/11/26 is
correct because the rule is a 1 year interval from PPSV23 to conjugate so you cannot just
count from the last dose given."* The interval is defined BETWEEN TWO NAMED VACCINES.
Counting a year forward from the rejected PCV15 invents a conjugate-to-conjugate interval
that exists in no document. So `repeatDueDate` must NOT restart the clock for a CROSS-STREAM
rule — the clock stays on the vaccine the rule names. **This is the ANCHOR-1 carve-out
Ruling D already applies on the card side** (*"an unnecessary dose cannot reset a clock"*)
and that was never applied to the chip. Scope: 66 cards, **0 due dates move**, the note under
the rejected dose changes from `2027-07-19` to `2026-10-11`. Build it as `repeatDueDate`
falling back to the ungraced `earliestValidDate` when the rule's anchor is in the other
stream. **This is a safe, owner-approved, verdict-free fix — the obvious first item.**

**FAMILY 3 — the dose should COUNT; no repeat exists.** Her words: *"count the PPSV23 and
consider the series complete… Giving a second PPSV23 is outside ACIP's adult pathway."*
Verified with the engine 2026-10-24 — **the app already agrees for 6 of 8 patients**: adults
with asplenia / cochlear implant (any age) and both child risk classes all COUNT the 12-week
dose, and the IC child's second PPSV23 lands on `2031-10-11`, her date to the day. It
disagrees for exactly three rows: **adults with no risk factors, or chronic conditions only.**

**ONE CORRECTION TO HER STATED REASON, and it must be carried forward.** She wrote that
ACIP "name 8 weeks as the minimum interval" for PCV15→PPSV23. **8 weeks is attached ONLY to
immunocompromising condition / cochlear implant / CSF leak** — mm7401a1 ≥50 row: *"A minimum
interval of 8 weeks can be considered if PCV15 is used in adults with an immunocompromising
condition, cochlear implant, or CSF leak"*; the 19–49 chronic row says ≥1 year and names no
8-week option. CDSI agrees (8-week `minInt` only in the immunocompromised and CSF/cochlear
series). **Her conclusion is still right, on better evidence:** CDSI v4.64 sets
`absMinInt = 0 days` for EVERY adult pneumococcal interval — read locally from
`~/Downloads/Version 4.64 - 508/XML/AntigenSupportingData- Pneumococcal-508.xml` on
2026-10-24 — so CDC's own software never invalidates an early adult dose. Plus the structural
argument: ACIP's adult pathway after PCV15 contains ONE PPSV23, so rejecting it and booking
another invents a dose, whichever date is chosen.

### THE FORK SHE HAS NOT YET ANSWERED — ask this first

The only thing rejecting family 3's dose is **her own OWNER CLINICAL DETERMINATION of
2026-10-11** (CLAUDE.md, "EVERY adult floor is an OWNER CLINICAL DETERMINATION…"), reconfirmed
2026-10-16. The same `absMinInt = 0 days` argument applies to the rows behind families 1 and 2.

- **Narrow** — `ADULT-PPSV23-AFTER-PCV15` becomes `enforcement: 'recommendation'` for non-IC
  adults. Family 3 closes (dose counts, series complete, note says it was earlier than the
  recommended year). Families 1 and 2 stay.
- **Broad** — every adult floor becomes a recommendation. Families 1 AND 2 stop existing (the
  PCV20 and the PCV15s all count) and the whole adult repeat question closes.

**She has not chosen, and the broad option reverses a twice-confirmed determination — ask,
never default.** Note the tension to put to her: she called family 2's 10/11/26 "correct",
which presumes the PCV15s stay invalid, while family 3's reasoning says an early adult dose
should count. Same shape, two answers.

Changing either is a **verdict move** and needs `npm run sweep:update` with both moved counts
in the PR, plus a field-level diff (`sweep:update` calls every row moved).

### Family 1 under these rulings

Untouched by either. It remains the reading error below — and note that under the **broad**
option it dissolves instead (the PCV20 counts and no next dose is due at all), so **settle the
fork before building family 1.**

### The old framing, kept for the reasoning only

### Families 2 and 3 as they were framed before her rulings

Family 2: CDC counts from "the last **PPSV23** dose" and the rejected doses were conjugates,
so the document's clock does not move. rr7203a1 states **no** rationale for the PPSV23 →
conjugate gap. Against that, the app currently asks for a **third** conjugate three months
after the second.

Family 3: either date gives a **second polysaccharide dose within about a year of the first**,
against rr7203a1's *"No evidence of hyporesponsiveness was noted in studies that used an
interval of ≥5 years"*. Her rule moves it 9 months → 12. **The real question for this family
— whether to repeat a PPSV23 this soon at all — is untouched by either option. Flag it; do
not silently fold it in.**

### Sources read live 2026-10-24 (quote these, do not re-derive)

- CDC Adult Schedule Notes, pneumococcal — the four "Previously received…" bullets.
- mm7401a1 Table 1 — the ≥5-year rows; **no rationale for any interval anywhere in it**, and
  its only "minimum interval" sentence is the 8-week PCV15 one.
- CDC General Best Practices, timing and spacing — the repeat sentence, and **pneumococcal
  appears only in the simultaneous-administration paragraphs**, never about invalid doses.
- rr7203a1 — **rationale ONLY**; it is superseded for intervals (CLAUDE.md). Hyporesponsiveness
  and the ≥5-year evidence, reactogenicity higher at shorter PCV → PPSV23 intervals.

### How to build it when she decides

One `max`, the C10-2 shape: the card's advised date is never earlier than `repeatDueDate` of
the most recent rejected dose in that stream. **Measured: that is a no-op for every child**
(0 of 5,544), so it needs no child carve-out — which is the proof the two sides already
agree. Do NOT re-derive the anchor in `recommend.js`. Family 1 is a separate, smaller change
in `lastDoseDate()`.

Also open, and she has NOT been asked: whether the **validator** should then refuse a dose
given on the old date (it currently accepts 2026-10-13 silently for family 1). Advising one
date and accepting another is the P0 shape — raise it, do not decide it.

## The rest of the queue — unchanged from the last handoff

| Priority | Item |
|---|---|
| **P2** | Patient E's "of 3" — **probably not a defect**; put the two readings to her, do not change the ladder first. |
| **P2** | Overdue children read oddly ("due at age 4 months" on a 12-month-old) — **pre-existing on `main`**, wording only. |
| **P2** | Chips print ISO dates (`2026-11-09`) while cards print `Dec 7, 2026`. Noticed this session; cosmetic, consistent within chips. |
| **P2** | Unchanged: card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread. |
| — | **C4, C5** — MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** everything the previous handoff listed, plus Ruling D itself and
PR #83's **first** question. The Job Aid's last statement (1,584 cards, the one remaining
uncredited pair) is still the decision she asked **not** to be re-raised.

## Why this is a good stopping point

C11 is complete as a unit across both surfaces, measured, guarded and live-verified. The
adult question is isolated into three families with real patients and real numbers, and
nothing in the remaining queue depends on it.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-23-ruling-d-repeat-dose-anchor`
   — **or branch fresh off `main` if PR #83 has merged.** A branch stacked on an unmerged PR
   is what produced the 2026-10-23 conflict.
2. `npx vitest run` — confirm **1,438 passing in 131 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a file count use `--reporter=json` and `len(testResults)`.
3. `npx vite-node scripts/uncreditedSources.mjs` — confirm **1** pair. Re-measure, never quote.
4. **START WITH THE FORK** — narrow or broad (see "THE FORK SHE HAS NOT YET ANSWERED").
   Nothing else in the adult queue can be scoped until she answers it, because the broad
   option dissolves families 1 and 2 rather than changing them. The one item that is safe
   to build before she answers is **family 2's chip fix**: owner-approved, 0 due dates move,
   0 verdicts move.
5. Per item: reproduce → failing test (say the pre-fix failure count) → fix → full suite green
   → **break the fix in more than one way and quote the counts** → `node scripts/proseDiff.mjs
   dump` on both sides (plain `node`, NOT `vite-node`), compared **field by field** → **drive
   the running app** → commit per item ID.
6. Push/merge policy: **branch → PR → the owner squash-merges.** A session agent cannot merge.

## Lessons this session paid for

- **A document's wording decides the anchor, and the two rows are not the same shape.** "the
  last PPSV23 dose" names a vaccine; "the last pneumococcal vaccine dose" names whatever the
  patient last had. Family 1's 363 cards turn on that one difference, and no test could see it.
- **Ask with the number that will actually move.** The first question quoted 272 cards where
  two dates disagreed; the real effect was 470 cards and 198 patients going from "give it
  today" to "wait". She stopped the work — correctly — when the second number appeared.
- **Group the blast radius by CLINICAL family, not by count.** 46 "distinct shapes" was
  unreadable; three families with one worked patient each was what let her engage.
- **A guard can pass for the wrong reason.** Two `not.toMatch` assertions quoted wording the
  app no longer prints anywhere, so they would have passed against any date at all.
- **CDSI settles "floor or recommendation?" in one grep, and nobody had run it for this row.**
  `absMinInt = 0 days` on every adult pneumococcal interval is the strongest evidence in the
  whole adult question and it was sitting unzipped in `~/Downloads`. Read it before arguing
  from MMWR prose.
- **Check her stated reason as carefully as her conclusion.** Her 8-week claim was wrong for
  the patients she was describing and her conclusion was right anyway. Agreeing with the
  reason would have put a false fact into the spec — the `refs.test.js` "p2016 has only 4
  tables" failure mode.
- **Run her ruling against the engine before agreeing it is a change.** Six of the eight
  patients she described were already correct, including the IC child's 2031 date to the day.
  "The app already does this" is a real and common answer.
