# PneumoVax Agent Guide

## What This App Is

Standalone client-side React SPA for **pneumococcal** vaccine clinical decision support (PCV15/PCV20/PCV21/Capvaxive + PPSV23) across the full lifespan (infants → adults). No backend, no auth, no DB. Sibling of MeningoVax; independent codebase that mirrors MeningoVax's architecture.

## Start Here

```bash
npm install
npm run dev        # dev server on /PneumoVax/
npm test           # Vitest run
npm run build      # production build to dist/
```

Dev server config: `.claude/launch.json` ("PneumoVax dev server").

All public asset paths MUST use `import.meta.env.BASE_URL` (Vite sets `base: '/PneumoVax/'`).

The save-time guardrail (flags stray top-level notes — see Root Directory Hygiene) turns on automatically during `npm install`. If a session finds it off (e.g. a freshly re-downloaded copy), re-run `npm install` or `npm run prepare` to switch it back on, and remind the owner.

Also read before changing any rule: `CLINICAL_SPEC.md` (every rule with source citations).

## Source of Truth Files

| What | Where |
|---|---|
| Plain-English folder guide (owner is a non-coder) | [MAP.md](MAP.md) |
| Architecture, file map, engine API, schedule constants | [docs/agent/architecture.md](docs/agent/architecture.md) |
| Pneumococcal clinical rules, product semantics, HSCT | [docs/agent/clinical-rules.md](docs/agent/clinical-rules.md) |
| Test files and coverage requirements | [docs/agent/testing.md](docs/agent/testing.md) |
| PneumoRecs comparison harnesses (dev-only) | `scripts/{adult,peds,hsct}Cases.mjs` |
| Session history (2026-06-07 through 2026-06-12) | [docs/archive/agent-session-log.md](docs/archive/agent-session-log.md) |

## Non-Negotiable Rules

### Root Directory Hygiene
Only `CLAUDE.md`, `MAP.md`, `README.md`, and `CLINICAL_SPEC.md` live at the repo root (`CLINICAL_SPEC.md` stays — code/test comments cite it by that path). Never create new root-level `.md` files. Session notes/handoffs/reviews go to `docs/archive/`; comparison scripts go to `scripts/`. Keep `MAP.md` current when folders change.

### Clinical Authority
ACIP/CDC/AAP/immunize.org over FDA package inserts. Sources per topic are in `CLINICAL_SPEC.md`.

Within that group, AAP is a tiebreak, not a ranking (owner decision, 2026-08-10): where ACIP/CDC and AAP agree, cite either; where they disagree, AAP governs; never adopt a CDC revision recommending fewer doses or narrower eligibility than AAP; where AAP is silent, CDC/MMWR stands.

**CITE CDC; REACH FOR p2016 ONLY IF YOU CANNOT (owner decision, 2026-10-23).** Her words:
*"Ok to cite p2016 if you cannot just cite the CDC references."* This is about which document
goes ON a card, and it is separate from the disagreement rule below — it applies when the two
AGREE. If CDC's own pages carry the card's claim, cite CDC and leave immunize.org off; p2016
is the fallback for a claim CDC does not state. It generalises what she had already ruled
twice on single cards (the 840 at/after-6 cards, 2026-10-23: *"Take p2016 off"*, because CDC
stated the whole claim verbatim), and it is why the healthy 5–18 "not indicated" card lost
p2016 on all 1,584 of its cards. **Reading p2016 is still required before removing it**
(FINDING F) — the rule says CDC wins when both speak, not that p2016 need not be read.

**CDC vs immunize.org (owner decision, 2026-10-17).** Where a **current CDC page** and an
**older immunize.org handout** disagree and AAP is silent, **CDC governs** — and say both
documents' dates in the commit, the spec and the code comment, because the gap between
them is usually the explanation. Until today this was unranked and decided case by case;
FINDING A is what forced it (CDC's May 2026 risk-indications page against immunize.org
P2016 of 2/16/2024 — `CLINICAL_SPEC.md` §D-note). Before applying it, **check the older
document against itself**: P2016 turned out to contradict its own Table 4 row, which
settled the question far better than the date did.

### Three Schedule Constants — Never Collapse
`src/logic/scheduleConstants.js` exports three distinct constants:
- **`ADULT_SCHED_MIN_M = 228` (19y)** — schedule routing boundary (peds vs adult rulebook)
- **`PCV21_MIN_AGE_M = 216` (18y)** — PCV21 (Capvaxive) product min-age only
- **`ROUTINE_ADULT_MIN_M = 600` (50y)** — where routine (age-based) adult eligibility
  begins, whatever the risk factors; ACIP lowered it 65→50 eff. 2024-10-23 (mm7401a1).
  Added by S6-1 (2026-10-13) because `recommend.js` and `format.js` each held their own
  copy of `600`, so the engine could route a patient one way while the screen described
  them another.

These are separate clinical concepts. Never merge any of them into one constant.

### All Clinical Logic in the Engine
Product validity, the PCV15→PPSV23 requirement, the prior-vaccine matrix, and the PCV7-not-counted rule are computed in `recommend.js`. UI consumes pre-built recs. Do NOT re-derive clinical logic in components.

### A Card Credits Only The Documents That Speak For It
A card's grey source buttons are the card's **own** sources, not the pathway's. The adult
pathway holds `ADULT_DEFAULT_REFS` and each card asks through **`adultRefs(...)`** — never a
single list computed once and spread over every card, which is what made a card cite
documents nothing it said rested on (the owner's "I forget why there are multiple source
chips listed if its only citing one of them"). Each (document, statement) pair gets exactly
one of two outcomes, never a third — **cite it, or take it off that card** (OWNER DECISION
2026-10-17). **A removal is a clinical act: it goes to the owner per document before it
lands.** **Documents 1 and 2 are DONE** — both signed off, both REMOVALS applied, and both
sets of CITEs now written (doc 2 in `702d041`, doc 1 after it). **mm7401a1 is FINISHED —
the first document to reach zero uncredited (statement, card) pairs**: its last 45 (a 19-49
adult with chronic conditions only, PCV13 and TWO PPSV23 doses) were settled by the owner on
2026-10-18 — *"I would use the citation covering PCV13 and 1 dose of PPSV23 in patients
19-49 with chronic conditions"*, because the chronic block offers a second PPSV23 to nobody
and so has no other disposition for that history. **The job aid is FINISHED too**: its last
3 statements (3,189 cards) rested on table CELLS stated in no prose — its "PCV13 & PPSV23"
cell is the two text runs "≥5 years" and "PCV20 or PCV21" at different x positions — and the
owner ruled 2026-10-18 *"use MMWR table"*, so mm7401a1's sentences are cited and the job aid
comes off those cards. **CDC's Child/Adolescent Notes are FINISHED too** — 8 statements over
1,107 cards cleared on 2026-10-23 (FINDING N plus four C8 commits).

**ALL SIX DOCUMENTS NOW CARRY ZERO UNCREDITED PAIRS — the job is DONE** (C12, 2026-10-29).
Measured over 17,407 cards: **0** pairs. The last one was doc 4 statement 1, the CDC PCV
Catch-up Job Aid listed on the healthy 5–18 "not indicated" card (1,584 cards) with nothing
citing it. It had stood open since 2026-10-17 as the one decision **she asked twice not to
have pushed at her**; she lifted that herself on 2026-10-29 by asking for the last citation
to be worked, was shown the card for a healthy 10-year-old, and ruled **"Take chip off"**
plus a new sentence: *"add a comment to re-evaluate pneumococcal vaccines once the patient
turns 50 years old and cite the necessary adult reference."* `CLINICAL_SPEC.md` §B-5TO18.
**The measurement, not this file, is the authority — re-run it rather than trusting this
sentence, and if a pair ever reappears, the document was put on a card before its row was
read.** Readings, dispositions and counts:
`docs/archive/c7-2026-10-17-source-readings.md`. Measure with
`npx vite-node scripts/uncreditedSources.mjs` and `scripts/citationMapping.mjs` — never
quote a count from the log, which predates the IC-children fix and reads low.

**A DOCUMENT THAT ORDERS A DOSE DOES NOT THEREBY SAY THE PATIENT IS FINISHED** (OWNER
DECISIONS 2026-10-23, both from "complete because PPSV23 was given" cards). Three card
families tell an at-risk child her series is done because she has had her PPSV23, and the
owner split them by HISTORY, not by wording:

- **p2016 comes OFF the at/after-6 cards (840).** An 18-year-old with a cochlear implant,
  PCV13 at 8, PPSV23 at 13: p2016's rows 8/9 fit her history, but their Option B only
  ORDERS the PPSV23 she has had and neither row says what follows. Footnote § ("If PPSV23
  previously given, then child is complete") is the mark on rows **4/5**, whose column
  reads "Completed PCV series BEFORE age 6 years" — she fails it. CDC's notes state her
  whole claim verbatim, so nothing rested on p2016. *"Take p2016 off."*
- **ACIP mm7137a3 — not p2016 § — is cited on the before-6 cards (20).** Offered § for the
  word "complete", the owner declined: *"p2016 doesn't cite this case. The MMWR pediatric
  PCV15 paper should."* § ASSERTS completeness; ACIP's pair EXPLAINS it — a single dose of
  PPSV23 after the PCV doses, and a SECOND dose only for an immunocompromising condition.
  One dose, no second unless IC, is why a non-IC child is finished.
  `pedsRiskSinglePpsv23AfterPcv`, read live 2026-10-23.

**A card whose citation ORDERS a dose must say that dose has been given**, or the number
reads as an outstanding order on a card saying nothing is needed — this is the 2026-10-18 /
2026-10-23 "cite the row the patient FOLLOWED" rule, and these cards are where it was
first applied to a card that had none of its own words saying so.

**The paediatric block now asks per card too.** `pcvRiskChild` computed one `refs` list and
spread it over every card it builds — the exact shape this section forbids, and the origin
of the owner's question. Use `childRefs` / `childRefsExcept` / `childRefsSwap`, the twin of
`adultRefs`. Never reuse `refs` for a card a document is silent on.

**AND A FALSE FINDING, recorded so it is not re-made.** The first draft added an `isIC`
wording branch to the 24-71-month card, claiming its gate let an IC child reach a note
hard-coded "(non-immunocompromising)". That is impossible by ARITHMETIC: a first PPSV23
cannot count before 24 months and a second needs >=5 years after it, so two counting doses
cannot exist before ~84 months, past the block's 71-month ceiling (0 reachable combinations
over every age 24-71 and every date pair). **Before adding a branch for an unreachable
state, prove the state is reachable** — a branch nothing can execute cannot be tested. The
unreachability is guarded instead, so moving that interval fails a test.
Guard: `regression-c9-2026-10-23-complete-after-ppsv23-cards.test.js`.

**A disposition does not always split by AGE.** mm7401a1's table answers one history —
PCV13 + PPSV23 — in three different rows, and in the **IMMUNOCOMPROMISING** block below 50
which row speaks depends on how many PPSV23 doses actually COUNTED (one dose: "the series is
complete"; two: "reviewed again … at age 50. Alternatively, … >=5 years"). `population`
cannot see that — it records an age band. The engine reads `ppsv.count` (the EFFECTIVE
count; a rejected dose is not a dose ACIP's row is about) in exactly one place,
`mmwrBothPcv13PpsvKey()`. **Never collapse those two IC rows into one.**

Since 2026-10-18 the two IC rows differ in the **card's own words** as well as its quote
(OWNER DECISION, *"use MMWR"*): the two-dose card leads with "Review the pneumococcal
recommendations again at age 50" and offers the dose as the alternative, because that is
ACIP's order; the one-dose card keeps the flat recommendation, because ACIP's one-dose row
is flat. **The dose itself is unchanged on both** — same products, same five years, same
status, same due date — so neither verdict corpus moves. Changing the note without the
`doseLabel` would leave the header leading with the dose while the body leads with the
review; the test asserts the label's order too.

**A SENTENCE IS ONLY ABOUT THE PATIENT ITS PARENT BULLET DESCRIBES** (FINDING K,
2026-10-18). CDC's child notes do not print rules as a flat list; they nest them. "Previously
received at least 1 dose of PCV20: no further PCV or PPSV23 doses needed" is a SUB-BULLET,
printed four times, each under a parent carrying its own conditions — at 6–18, *"Received PCV
before age 6 years **but have not received PPSV23**"*. One `refs.js` entry held it with
`population: ['child-nonIC','child-IC']` and the comment "printed in both at-risk lists, same
instruction"; `recommend.js` said it "carries no age condition in its own words". Both are
true of the sentence alone and false of the sentence in place: **56 of 992 cards showing it
fitted; 904 did not**, and the IC instance at 6–18 uses *different words* ("no additional dose
of PCV or PPSV23"). `population` cannot see this — it records the patient GROUP, and a parent
bullet splits on **vaccine history**. So: read the nesting, split the key per branch, keep each
quote **verbatim and contiguous** (a joined parent+child string exists nowhere on the page —
that is how `pedsMinAge`'s deep link came to match nothing), and put the branch in the entry's
`label`. Guard: `regression-finding-k-2026-10-18-nested-bullet-conditions.test.js`.

**HALF OF FINDING K IS REVERSED, BY THE OWNER** (2026-10-23). Of its 904 wrong showings, the
**40** with a PPSV23 on record are now CORRECT and cite the sub-bullet again. Shown a
6-year-old with asplenia (PCV20 at 5, PPSV23 eight weeks later) whose card listed the page
with no number, she answered with the deep link to that whole branch — parent and sub-bullet
together — so *"but have not received PPSV23"* **describes the history that led to the dose,
not a patient the row refuses to cover**. The guard records the exception and **pins it at
40**; the other **864** (no conjugate before age 6) are still barred by the parent's AGE half.
The same ruling, reached first that morning on the 145-card "series complete" card, is the
general rule: **cite the row the patient FOLLOWED, and say on the card that its dose has been
given.** It does not extend to a nested line that ORDERS NOTHING unless she says so — which
is exactly what she said for these 40, and the distinction is why they were put to her.

**THE SAME SENTENCE IN TWO AGE BANDS IS TWO SENTENCES** (FINDING N, 2026-10-23). CDC answers
"series done, no PCV20, no PPSV23" **four** times — in each at-risk list, under *"Age 2–5
years"* and again under *"Age 6–18 years"* — with different parents and different wording
("administer 1 dose PCV20…" against "1 dose PCV20…"; "1 dose of PCV20 or dose 2 PPSV23"
against "either PCV20 or dose 2 PPSV23"). Only the Age 2–5 pair had keys, and the block that
serves 24 months to 18 years cited them at every age: **496 cards for children aged 6+ quoted
a toddler's sentence.** `population` is blind to it (same risk class, different age) and so is
the all-columns guard (it asks whether SOME row fits). **One age test, in one place**, reading
`M.m72`; guard `regression-finding-n-2026-10-23-child-notes-age-band-row.test.js`.
**A CDC page may legitimately carry two numbers on one card** — two different sentences, two
claims (1,584 "not indicated" cards do) — but **never one sentence twice**; that is the
invariant to sweep, and asserting the stronger one fails on correct cards.

**A NUMBER WITH NO CHIP CANNOT HAPPEN, AND FINDING L WAS A WRONG PREMISE** (closed
2026-10-22). This paragraph used to say that a numbered citation whose document is not among
the card's grey buttons "leaves a reader clicking `[2]` with nothing to match", and that 446
such cards remained. **Measured over the grid: 0 of 17,361 cards.** `cardSources()` in
`citations.jsx` builds the button row by walking the **numbered citations first**, creating a
button for each, and only then adding the engine's own list — so a number always gets a
button. The 446 is real as an **engine/renderer** inconsistency (`rec.citations` is a subset
of what the card shows) and is invisible to the reader. **Do not "fix" it.** By that same
measure the class is **1,634**, not 446 — `immPCV7` alone is 1,188 and the handoff never
mentioned it, so "finishing the 446" would have left 1,188 identical cases behind.

**It was already guarded, which is how the premise should have been checked.** `G2` in
`regression-c2-c3-numbered-sources.test.jsx` sweeps >15,000 cards asserting exactly "every
document a number points at has a button on that card", and C3 fixed the one real instance
(the immunize.org PCV7 page had no whole-page entry — the origin of that 1,188). Proved
load-bearing 2026-10-22 by deleting the cite-seeding from `cardSources`: G2 fails, plus 4
other tests. **Before acting on a finding, run the guard that already covers its class.**

FINDING K's `refKeys` change rests on this same wrong reason. The change itself is harmless
and mildly good — the engine's list is now honest, and the authored chip title wins — and it
moved no verdict, so it stays; only its stated justification was false.

**Before removing a document from a card, read the document — including its TABLES.**
FINDING F (2026-10-18): six removals were approved on 2026-10-17 on the stated ground that
mm7401a1 "states none of these", from a reading that had recorded three sentences and never
opened its clinical guidance table. **Five of the six are in that table, in full sentences**;
1,594 cards were restored with the row cited. `scripts/uncreditedSources.mjs` cannot catch
this — it only sees a document that is ON a card, so a document wrongly removed from a card
it speaks for is invisible to it. The mirror guard is
`regression-c8-2026-10-18-mmwr-table-rows-restored.test.js`, which asserts the document is
PRESENT where it speaks. Evidence and the per-patient decision:
`docs/archive/c7-2026-10-17-source-readings.md` §FINDING F.

**The CHRONIC block does NOT split on the count** (OWNER DECISION 2026-10-18). It prints one
row for a PCV13 + PPSV23 history, headed "PCV13 and 1 dose of PPSV23", and it speaks for a
two-dose patient as well: a second PPSV23 is only ever *offered* inside the
immunocompromising block ("When a second PPSV23 dose is used instead of PCV21 or PCV20…"),
so the chronic row has no rival disposition an extra dose could select. Do not re-add the
`ppsv.count === 1 ? … : null` that used to sit there and left 45 cards with a grey button
and no number.

Where a disposition splits by age, the predicate is the engine's existing `isOlderAdult`
(i.e. `ROUTINE_ADULT_MIN_M`). **Never a second age test** — a hand-typed `am >= 600` there
passed all 1,177 tests, so `regression-s6-1-routine-adult-age-one-home.test.js` now guards
the whole engine's source, not just the `M` table.

### The Paediatric Document Order, And Who States A Dose TOTAL
**OWNER RULING A (2026-10-23).** For paediatric intervals and totals the order is
**CDC/ACIP schedule Notes → immunize.org p2016 → CDC catch-up table**. Her words: *"The
Immunize.org sheet is built from the CDC/ACIP schedule. If the two ever differ, the CDC/ACIP
schedule is the authoritative source... the catch up table is not the source of truth and may
be considered if immunize.org does not provide a specific recommendation."* It does **not**
disturb the 2026-10-17 CDC-beats-immunize.org rule; it ranks the *catch-up table* third.
It is an **OWNER CLINICAL DETERMINATION**, not something a document says: CDC's catch-up page
does say *"Always use this table in conjunction with Table 1 and the Notes that follow"*, but
**p2016 carries no provenance statement at all** (whole PDF searched). **Never cite p2016 for
its own authority.**

**OWNER RULING B (2026-10-23): p2016 Table 1 states the dose TOTAL, for every child.** Its
heading is *"...to all children (healthy and those with risk conditions) age 2 through 23
months"*, so **there is no healthy/at-risk split to build** — a simplification of what the
previous session's P1 assumed. CDC's notes cannot carry an infant catch-up total: they give
the routine series and then punt, *"For other catch-up guidance, see Table 2."* Until C10-1,
781 cards said "2 doses in total for this child" over a quote reading *"4-dose series"* —
FINDING 2's fault at the other end of the range.

**The engine now RECORDS which Table 1 row it used.** `pcvInfant`'s `target` ladder IS Table 1
cell by cell, so it names the row as it picks it and the card cites that row — **only when the
row's own stated total equals the number the card prints**; a total of exactly 4 cites CDC,
which states 4. This closes FINDING I for the infant block by construction, which CLAUDE.md
had recorded as needing exactly this. **Cite these rows for the TOTAL only, never an
interval** — Table 1's row text is routine spacing, its footnote † is the minimum.
p2016 came off 1,633 cards CDC already speaks for; **p2016 is now the fourth document at zero
uncredited pairs.** Guard:
`regression-c10-1-2026-10-23-infant-total-cites-p2016-table1.test.js`.

**And a near miss worth keeping.** The first draft let a row take the marker at a total of 4
too, which pushed CDC off **231 cards it speaks for** — a removal by side effect, the FINDING F
fault. No test existed that could see it; the measurement caught it. That is why the guard
asserts "CDC keeps its marker" over the whole grid, not on a sample.

### The App ADVISES The Routine Date And STATES The Minimum Beside It
**C10-2 (2026-10-23), implementing OWNER RULINGS A and C of that date — and it REVERSES
owner decision 3 of 2026-10-11** (`CLINICAL_SPEC.md` §L), which had declined "a separate
recommended interval layered over Table 2's number". What she declined then was a *blanket*
8 weeks at every infant interval; what is built now is narrower, and the narrowness is the
rule:

| Child | Advised date for the next PCV dose | Cited to |
|---|---|---|
| **2–6 months** (routine band, no Table 1 row) | the routine **AGE** — 2, 4, 6 months | CDC's notes |
| **7–23 months** (a p2016 Table 1 catch-up row governs) | **8 weeks** after the most recent dose | that Table 1 row |
| any child whose routine date has passed | the **minimum** | the CDC catch-up cell |

The advised date is the **latest** of the minimum, the 8-week spacing and the routine age —
one `max`, which is also the answer to "a child genuinely behind": her routine term stops
binding and the advice collapses to the floor. **Never advised earlier than the floor**
(measured: 145 of 3,305 cards moved later, 0 earlier).

**Do NOT give the 2–6-month band the 8 weeks.** p2016's rows there read "4 doses … last dose
at age 12–15 months" and it "never prints the 2/4/6 months" (C7's PDF reading), so the number
would be stated by no document on the card. The first draft did this and
`regression-p1-0-recorded-dose-intervals` caught it.

**RULING C IS THE LIMIT: the validity floor does not move.** Only the *recommended* number
does. `pcvNextDoseMinIntervalDays` returns the same figures it always did — measured 0 floor
changes and 0 dose verdicts moved over 5,510 recorded doses. Patient E (PCV20 at 11 and 12.5
months, a 6-week gap) keeps her second dose, which p2016's footnote read as a floor would
have voided.

**⚠ BOTH NUMBERS GO ON THE CARD.** Rulings A and C together deliberately re-create two
numbers for one dose — advise 8 weeks, accept 4 — which is the shape today's P0 fix removed.
The difference, and the whole reason this is allowed, is that the minimum is **stated**: *"it
can be given today if needed, as the minimum interval of 4 weeks has already passed."* A
second number the reader can see is not that bug; an invisible one is. Never drop that clause.

**CDC's catch-up schedule is now ON cards, for the first time** — owner ruling 2026-10-23,
*"cite it for the INTERVAL cells only (dose 1→2, 2→3, 3→4), never for a total."* Five cell
entries plus one whole-page entry in `refs.js`. **The cell comes back from the same call as
the number** (`pcvNextDoseMinIntervalCell`); a caller that re-tested the ages to choose a
citation would be a THIRD reading of Table 2, which is the P0 bug's own shape.

**And a citation ADDED is as dangerous as one removed.** C10-2 put p2016 back on **165**
routine-4-dose cards — the first RISE in that footprint, 3,294 → 3,459 — because a
7–11-month-old with two doses before 7 months has a total of exactly 4 (CDC's number) and a
spacing of 8 weeks (p2016's row). C10-1's guard asserted p2016 was absent from those cards
outright; its real claim was about the TOTAL, so it was narrowed to that and the 165 pinned.
Two documents, one claim each — this file's own principle, not an exception to it.

### A Card Carries Every Document With A Fitting Row, And None Without
**OWNER RULE 2026-10-18:** *"If using p2016 tables, all columns need to fit patient
criteria in order to use recommendations."* p2016 Table 4's columns are **Child's age now |
Number of previous PCV13, PCV15, or PCV20 doses | Option A | Option B**. A row governs a
patient only when the age column **and** the prior-dose column both fit. Matching the age
band alone is not enough — the prior-dose column is where every 2026-10-18 finding hid.
This also answers C7's structural question: a table CELL may be quoted as governing text,
with that constraint.

**OWNER DECISION 2026-10-18 on who decides.** Asked whether each case must be walked
through, the owner chose: **decide without asking when every candidate document gives the
SAME dose and the only question is which goes on the card.** Three situations still come
back to her every time — (a) no document has a row for the history, (b) two documents give
different doses, (c) the change would move a verdict and not just wording. Every judgement
call goes in the PR body, grouped, so she audits them in one place. This **supersedes** the
older "a removal goes to the owner per document" for the dose-unchanged case; it does not
touch (a)–(c), and a removal still requires reading the document **including its tables**
first (FINDING F).

The machine guard she required is
`regression-2026-10-18-every-p2016-card-has-a-row-that-fits.test.js`, which holds p2016's
whole row inventory and fails if any card cites it without a fitting row (**4,927** cards
carry it, 0 unfitting — the count is now PINNED EXACTLY in that test, not floored, because
C8/C9 keep lowering it: 7,371 → 6,511 after C9-3's 860 → 4,927 after C9-4's 1,584. Re-measure,
never quote it from here). **Know its limit:** it asks whether *some* row fits, not whether the row
the card *used* fits — so it catches a wrong DOCUMENT (FINDING J) and not a wrong ROW of a
document that does cover the patient (FINDING I). The second is guarded per finding.
Closing it generally needs the engine to record which row it used, which it does not do.

### PCV13 And PCV15 Are Interchangeable Going Forward; An Unrecorded Product Is Not A PCV20
**OWNER RULINGS 2026-10-18.** This matters because every document stating a conjugate dose
given **at or after age 6** names PCV13 and only PCV13 — CDC's child notes ("Received PCV13
only at or after age 6 years"), p2016 Table 4 rows 8/9, and CDC's risk-indications page,
which has **no** at/after-6 branch at all. So for a PCV15 at that age no document has a row,
and these rulings are the answer. ACIP says the first in words
(`pedsPcv13Pcv15Interchangeable`, mm7137a3: *"For all recommendations, PCV13 and PCV15 can
be used interchangeably"*), and the card now says so in its own words wherever a
PCV13-worded row is used for another product. **Never print a product the record does not
show** — that was FINDING H and the 112 residue, 720 cards. Rows 4/5 get **no** such bridge:
CDC's before-6 row is already product-agnostic ("Received PCV before age 6 years"), so
nothing is being substituted there.

### PCV7 Never Counts
Recorded as `noncounting`, dropped from effective series. High-risk patients treated as PCV-naïve. Source: immunize.org Ask the Experts.

### Transplant Is A Hard Stop — Never Re-Add A Post-Transplant Schedule
Ticking `hct_cart_bcell_exclude` (hematopoietic cell transplant, CAR-T, B-cell malignancy or
B-cell-depleting therapy) **stops the engine**: `excluded: true`, `recs: []`, History step
skipped, and **not even the ordinary age-based schedule** the patient would get otherwise —
including one a *different* ticked risk factor would produce on its own. One row, one
`exclude: true` flag, one message naming ASCO/NCCN/IDSA/CDC **in words, linked to nothing**.
OWNER DECISION 2026-10-16; it retires the 2026-09-19 C2-6 fix and reverses the 2026-07
"standalone apps are advisory for HSCT pathways" decision.

**The reason is not that the advice was low value — it is that it could not be kept true.**
Across the two apps the post-transplant rule was wrong or half-applied **five times in five
weeks**. PneumoVax's own worst case: the adult row was ASCO 2024 in the code from 2026-09-14
while `CLINICAL_SPEC.md` §F, this file and the checkbox's citation chip all still said Fred
Hutch **32 days later** — and those are different schedules (4 doses from 3 months vs. 3
titer-gated doses from 6). Nothing in the suite could see it, because no test compares a
document's prose to a card's prose.

The retired schedules, verbatim with their citations:
`docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md`. The decision and
its evidence: `docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md`.

**Byte-identical to MeningoVax**, frozen by
`regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js` — the row's id, label,
sublabel and flag, the whole message, the banner title, the recorded-doses line. Change the
wording in **both repos or neither**; never loosen that test to let one side move.

### PCV15 Always Requires PPSV23
`requiresPPSV23: true` in `brands.js`. Never emit a PCV15 rec without the PPSV23 follow-up path.

### Adult PCV15→PPSV23 Interval: ≥8 Weeks At 19–49 For IC / Cochlear / CSF, Else ≥1 Year

**OWNER DECISION 2026-10-16 (S15). Implemented.** This replaces both A-P1-1 (2026-10-10)
and the 2026-10-15 reversal banner that stood here.

| Adult | Recommended PCV15 → PPSV23 interval |
|---|---|
| **19–49** with an immunocompromising condition, cochlear implant or CSF leak | **≥8 weeks** |
| 19–49 with chronic conditions only | ≥1 year |
| **50+**, any risk class | ≥1 year, with 8 weeks **named as an option** |

**The governing sources are `mm7401a1` (ACIP, January 2025) and CDC's Adult Pneumococcal
Vaccine Timing Job Aid (NCIRD, March 2025).** Both read live 2026-10-16.
**`rr7203a1` (2023) is superseded — never cite it for an adult interval again.**

mm7401a1's clinical guidance table uses a **different verb per age band, and that
difference is the rule**: 19–49 IC/CSF/cochlear reads "If PCV15 is used, **administer** a
single dose of PPSV23 **≥8 weeks** after the PCV15 dose"; ≥50 reads "should be administered
**≥1 year** … A minimum interval of 8 weeks **can be considered**". The job aid renders the
same split — inline on pp. 2–3, as footnote † on p. 1.

The owner was shown both readings — follow ACIP's wording, or flatten to 8 weeks for that
risk class at every adult age — with the patient count for each, and chose the wording.
**Do not extend the 8 weeks to 50+ without a new owner decision**: ACIP prints it as an
option there, so the app would state as advice what its own citation offers as a choice.
**Do not re-flatten it either.** Single source: `adultPpsvRecommendedInterval()` and
`adultPpsvShorterMinimumOffered()` in `riskFactors.js`. Never hardcode the interval, and
never add a second age test — the boundary is `ROUTINE_ADULT_MIN_M`.

**Two findings in `docs/archive/plan-2026-10-15-adult-interval-risk-class-audit.md` are
OBSOLETE** — both came from rr7203a1, and the current sources contradict them. The app was
already right on both; **do not "fix" either**:
- *"PCV13→PPSV23 is 8-week keyed too"* — no. Every current source gives PCV13 only →
  PCV20 or PCV21 at ≥1 year, and the job aid prints **"NO OPTION B"** on all four pages.
- *"cochlear implant / CSF leak are NOT IC-equivalent for the second PPSV23"* — no. Current
  guidance groups all three and gives **PCV20/PCV21 at ≥5 years**, not a second PPSV23.

**S14-7's separation of recommendation from validity still stands, unchanged.** The
**floors** for a dose *already given* key on risk class with **no age term** — 8 weeks for
IC / cochlear implant / CSF leak, the year for every other adult — and remain an **OWNER
CLINICAL DETERMINATION of 2026-10-11**, reconfirmed 2026-10-16. Recommendation and floor
are different questions; do not let one answer stand in for the other. Also confirmed
already correct and not to be changed: a dose given too early is rejected and the next one
is anchored to the **last valid dose**, not to the rejected one.


### The Rulebook Is `CLINICAL_SPEC.md`, And A Test Holds It To The Code
`CLINICAL_SPEC.md` is the rulebook (owner decision, S8, 2026-10-11) — the one document
stating every clinical rule with its source. `docs/agent/*.md` summarise and point; they may
leave a rule out, never contradict it. §K's **"The rule table, row by row"** mirrors
`DOSE_INTERVAL_RULES` exactly, and `rule-docs-match-code.test.js` compares the two cell by
cell on every run. **Change a rule row → update that table in the same commit.** The same
test fails if any doc names a function or constant deleted from `src/` — the tell shared by
all four stale copies of the pre-A-P1-1 adult interval.

### A Verdict That Moves Must Be Explained
TWO corpora, both built from `src/test-grid.js`, both gates. `sweep-verdict-corpus.test.js`
re-runs the engine over **17,016 patients a clinician could really enter**;
`sweep-record-problem-corpus.test.js` re-runs it over **18,264 impossible ones** — a dose
dated before the patient was born, or dated after today. Either fails if an answer differs
from its committed corpus. **Do not run `npm run sweep:update` (which regenerates both) until
you can say why those patients should get a different answer**, then put both moved counts in
the PR. This exists because peds `P0-2` and `ANCHOR-1` each moved thousands of verdicts while
all three PneumoRecs harnesses stayed byte-identical. New sweeps build on `src/test-grid.js`
— never a second case list.

**Why the impossible entries are a second FILE and not more rows in the first** (owner
decision, 2026-10-12): so 17,016 keeps meaning "real patients", and a clinical change that
moves 300 of them reads as 300 lines rather than 300 lost among 23,000 impossible records.
The main grid *discards* 15,340 before-birth combinations on one line and cannot express a
future date at all, so both record-problem rules were guarded by nothing: deleting
`isBeforeBirth()` left the main sweep green 12/12, and so did disabling `futureDated()`.
Against the second corpus the same two mutations moved **14,304** and **1,980** when that
was measured, of the 18,460 rows the corpus held then. (Both corpus SIZES above were
re-counted from the committed files on 2026-10-18 and corrected here — they had drifted
again: this paragraph still said 16,008 and 17,652 after the 2026-10-17 pass, because that
session flagged the drift to the owner rather than editing her rulebook. Counted with `wc -l`
on the committed TSVs, which carry no header row: `verdict-corpus.tsv` 17,016 and
`record-problem-corpus.tsv` 18,264. The two mutation figures are left as measured and not
rescaled.)
**Add a rule to `recordProblemFor()` → add its shape to `GRID_FUTURE_*` in the same commit.**

### Every Quote Names The Patient It Was Written About
`rulebook` (child / adult / any) keeps a child's source off an adult's card. It cannot see
the two splits CDC's pages — and this engine — actually turn on: a child's
**immunocompromising** list vs the one that is not, and an adult's **Routine 50+** vs
**Special situations 19–49**. So every QUOTED entry in `refs.js` also declares
**`population`**, and `regression-2026-10-17-every-quote-names-its-patient.test.js` fails if
a card shows a quote to anyone else. Quote-free entries declare none — a document has no
patient.

**It records who the sentence is ABOUT, not which block it was printed in** (owner decision
2026-10-17). The two usually agree; where they differ the sentence wins, and the entry's
comment says why. Recording provenance instead would have marked **4,639 correct showings
wrong** — `adultPcv20or21Complete` is printed under Special situations and says "Adults aged
19 years and older"; CDC's at-risk rows start at age 2, so `pedsRoutine4Dose` is an at-risk
baby's series too.

A card may quote another group's rule **deliberately** — to state a boundary, or to say what
the patient is not — via `cite(key, { aboutAnotherGroup: 'why' })`. There are exactly four
(`adultRoutine50`, `adultBothNotAt65`, `cdcChildSpecialSituations`, `immPCV7`), plus the four
"at 19" rows C13 added on 2026-10-30 (§B-AT19), and the set is pinned by name, as is the set of sources spanning more than one group. **Never widen a
source's `population` to make a wrong quote legal** — that is the one mutation that made the
sweep go quiet, which is why both lists are pinned. Fix the call site instead.

**Adult sources on CHILD cards are allowed in exactly two places** — C12's age-50 line
(2026-10-29) and C13's "at 19" lines on the four Group B cards (2026-10-30, `CLINICAL_SPEC.md`
§B-AT19). The healthy 5–18 card ends with *"Re-evaluate at age 50, when
routine pneumococcal vaccination begins for every adult"* — the owner's request — and cites
`adultRoutine50`, an **adult** source on a **child's** card. That is the N6 rule crossed
deliberately: the sentence is ABOUT the adult schedule, so only the adult schedule can carry
it. **N6's own sweep cannot see this** — it ticks one risk condition at a time and so never
reaches the healthy card — so C12's guard holds the line instead: no OTHER child card may
carry an adult source. Never answer a future "an adult source is on a child's card" by
widening N6; add the card to that guard's exception, or fix the call site. C13's lines are
**no longer a second reading of the adult rules** (2026-10-31, §B-AT19): `recommend()` runs
the same patient forward to 19 and the line repeats the row that card cites — the second
reading had disagreed with the adult card on 578 hand-built children the grid never reaches.
**Never hand-write an "at 19" line into a card**; `withAtNineteen()` adds it to every at-risk
"complete" card. Guards: `regression-2026-10-31-at-19-line-is-the-adult-cards-own-answer`
(hand-built) and `regression-c13-2026-10-30-what-happens-at-19.test.js` (the grid).

### The App Advises And Grades By One Number — CDC Catch-up Table 2
**OWNER DECISION 2026-10-23, and it REVERSES owner decision 2 of 2026-10-11.** A PCV dose
given too soon **does not count**. The floor and the scheduler now call the same function,
`pcvNextDoseMinIntervalDays()` in `intervals.js`, which is CDC's Catch-up Table 2 cell by
cell. **Never give the two sides separate readings of one table again** — that is the bug
this fixed: the app told a clinician to wait until 2026-08-15 for a dose and then accepted
it on 2026-07-18, silently, for the same child. `intervals.js` had named the divergence in
careful prose and left both readings live; **prose does not fail CI**.

The patient who found it (she was shown her for a *citation* question): a 15-month-old with
asplenia, PCV20 at 10.4, 11.3 and 12.2 months, every gap 28 days. Her words — *"it does not
satisfy the required interval and does not count. She needs 1 additional dose of PCV20 at
>=12 months of age … she is 15 months now, so it can be given today."* Moved **220 of
17,016** verdicts and 275 of 18,264 record-problem rows.

**The booster is defined by AGE, not by how many doses came before it** (same day, second
ruling — it cut the blast radius from 352 patients to 220). A 4th dose given **below 12
months** is a valid **extra infant dose** at the 4-week minimum; CDC's flat "8 weeks (as
final dose)" belongs to the **>=12-month booster**, which that cell's own text says. So the
dose-4-and-beyond branch keys on `ageAtThisDose` — the age at which THAT dose is or will be
given — and `recommend.js` passes **12 months** for a final dose it is holding back to the
first birthday. Passing the patient's age today there advises 4 weeks for a booster, the
mirror image of the bug. Her words: *"Record the 5.1-month dose as extra. It isn't harmful
and it isn't counted toward completion. Nothing needs to be repeated or restarted."*

**Her proviso, and it is guarded:** *"if a later dose given helps correct the mistake in
giving a vaccine early, this should be noted and marked as complete if appropriate."* The
rejected dose stays on the record with its explanation; a properly spaced later dose is
credited and the series reads Complete. Verified in the running app, not inferred.

**ACIP confirms the anchor the engine already used** (General Best Practices, timing and
spacing, read live 2026-10-23): *"The repeat dose should be spaced after the invalid dose by
the recommended minimum interval."* So one early dose can legitimately void the next one
too.

### The Advice Is Measured From The Dose The PATIENT GOT — RULING D
**OWNER RULING D (2026-10-23), implemented.** Her words: *"the repeat dose should be spaced
from the invalid dose by the minimum interval. This should be followed."* This CLOSES the
item this file used to record here as "still open and NOT to be changed without her".

The validator had done it since ANCHOR-1; the *recommendation* side had not, because
`recommend()` reads `summarizePcv(effectivePcv, …)` — the list with rejected doses already
dropped. So a card counted from the last dose that COUNTED. The tell, on three patients
alike but for the mistimed dose's date: all three were advised the SAME day.

**THE SPLIT IS THE VALIDATOR'S, COPIED — NOT A NEW ONE.** `DOSE_INTERVAL_RULES`'
CHILD-PCV-AFTER-PCV already takes `ageAtPrevDose` from the anchor and `doseNumber` from the
kept list. So:

| Moves to the dose given | Stays on doses that COUNTED |
|---|---|
| the anchor date, **and the age at it** — one dose, never two | dose number, series totals, `anyDoseBefore12` |

`validate.js` exposes its own `anchor` (`st.prev`) and `summarizePcv` carries it as
**`anchorDate` / `anchorAgeAtDose`**, deliberately distinct from `lastDate` /
`lastAgeAtDose`. **Never recompute the anchor in `recommend.js`** — two readings of one
thing is the P0 bug's shape.

**THREE THINGS DO NOT ANCHOR, and each has a reason:**
- **PCV7** — a superseded product properly given, not a mistimed dose; no source states an
  interval from it.
- **A RECORD PROBLEM** (dated in the future, or before birth) — *"a dose the patient never
  had"*, which is why `validate.js` already withholds its repeat sentence. Until this was
  added, a PCV20 typed as 2027 advised a return in Dec 2027 beside a chip saying the date is
  in the future. `if (!result.recordProblem) anchorOn(dose)`.
- **CROSS-STREAM intervals** (a PPSV23 measured from a PCV, the 5-year rows) — ANCHOR-1 keys
  those on COUNTING doses both ways (*"an unnecessary dose cannot reset a clock"*). Ruling D
  is about repeating the mistimed dose, not a different vaccine following it. So
  `anchorPneumo` and the adult PPSV23 rows are untouched; `anchorPcv` and the two infant
  blocks move.

**THREE SURFACES, and the third was found by driving the app, not by the suite.** The chip
under the rejected dose said *"the next dose … is due on or after"* and spent
`earliestValidDate` — which is when **THIS** dose would have been valid, an earlier date the
card already contradicted. `repeatDueDate` is its sibling, same rule and same arithmetic
(`intervalFrom`), anchored on the dose given. **Keep both: they answer different questions.**

### The Grace Decides What The App ACCEPTS, Never What It ADVISES
**OWNER RULING 2026-10-24**, answering the first question Ruling D left open: *"I don't need
the app to recommend dates within the 4 day grace period. Just the routine date next dose is
due with a comment on the earliest date it could be given."*

This is `intervals.js`'s own standing line — the grace permits *counting* a dose given 4 days
early, not *advising* one — and `repeatDueDate` was the one date that had crossed it, putting
*"due on or after 2026-11-05"* on a card whose note already said *"can be given from
2026-11-09"*. So: `earliestValidDate` **keeps** the grace (a dose already given), and
`repeatDueDate` **loses** it (a dose not yet given). It is a parameter of `intervalFrom`, not
a second reading of the interval. The chip also names its date as the **earliest** and never
as the **due** date — the rec card is the only surface that knows the routine date, so it is
the only one that states one. Measured: 10,712 chip sentences, every one **+4 days later**,
none earlier, 0 verdicts moved. Guard:
`regression-2026-10-24-advice-never-inside-the-four-day-grace.test.js`.

Guard for Ruling D itself: `regression-2026-10-23-pcv-dose3-floor-follows-cdc-table2.test.js`. `regression-p0-2`'s
"the validity floor is untouched" block asserted the opposite and is **kept, renamed**, as
the record of the reversal — do not delete it.

### Every Interval Rule Lives In One Table
`src/logic/doseIntervalRules.js` holds every gap-between-recorded-doses rule. `validate.js` calls `evaluateDoseInterval()` once per dose and owns **no** interval logic.

Each row declares **`rulebook`** (child / adult / any — which schedule states it, so which number and which citation apply) and **`enforcement`** separately: `'floor'` voids the dose and gets CDC's 4-day grace; `'recommendation'` keeps the dose and adds a note, no grace; `'none'` is never flagged, with the reason written down. **One pinned exception:** `CHILD-PPSV23-AFTER-PPSV23` is a recommendation that keeps the grace (owner decision 2026-10-30, `CLINICAL_SPEC.md` §C-P2) — for a non-IC child its firing makes the dose an extra dose, so the grace still decides what counts. **Never add an age test that decides whether a rule may bite** — that was the S14-RC root cause, and three adult gaps fell in the hole it left. Add a row instead.

⚠️ **EVERY adult floor is an OWNER CLINICAL DETERMINATION dated 2026-10-11 — never cite ACIP or CDC for one.** The *intervals* are ACIP's (rr7203a1 keys both PCV13→PPSV23 and PCV15→PPSV23 at 8 weeks for an immunocompromising condition / cochlear implant / CSF leak and 1 year otherwise); treating them as floors is not. Watch ACIP's vocabulary: "**minimum recommended** interval" is the shortest *recommended* spacing, **not** the General Best Practices "minimum interval" that voids a dose. rr7203a1's 8 weeks is explicitly something that "can be considered… to minimize the time of risk" — permission to vaccinate sooner. CDSI v4.64 sets `absMinInt = 0 days` for every adult pneumococcal interval and the current adult MMWRs never say a short gap means repeat the dose; the owner was shown that and reaffirmed. Rows carry `authority: 'OWNER'` and the app's own per-dose text says so. Full evidence and the enumerated rows: `CLINICAL_SPEC.md` §K.

### dateUtils.js Is Mirror-Synced
`dateUtils.js` is identical across PneumoVax and MeningoVax **apart from the `L2 MIRROR NOTE` comment, which exists only in PneumoVax's copy** (measured 2026-10-13: that comment is the only difference; zero lines of code differ). If you change it here, apply the same change to MeningoVax.

Since S6-4 a test enforces this: `regression-s6-4-avg-days-per-month-one-home.test.js` compares the two files comment-stripped and fails on any code divergence. It is **skipped, not failed**, when the sibling repo is not checked out, because CI clones only this repo — so a local run is what catches drift. Note the two apps *use* the shared file differently and that is fine: PneumoVax calls only `DAYS.weeks`, while MeningoVax uses `DAYS.months` (17×) and `DAYS.years` (12×). PneumoVax deliberately moved its month/year comparisons onto the calendar-exact helpers.

## Testing Expectations

- When changing a rule: update `CLINICAL_SPEC.md`, the engine, and the test.
- At least one test per `CLINICAL_SPEC.md` § sub-section.
- When changing `scheduleConstants.js`: verify both constants remain distinct and all consumers import the right one.
→ See [docs/agent/testing.md](docs/agent/testing.md)

## Documentation Maintenance

| Content type | Destination |
|---|---|
| Current commands, required workflow, short non-negotiable rules | Root `CLAUDE.md` (this file) |
| Architecture, engine API, file map, schedule constants | `docs/agent/architecture.md` |
| Pneumococcal clinical rules with source citations | `docs/agent/clinical-rules.md` + `CLINICAL_SPEC.md` |
| Test files, coverage requirements, key invariants | `docs/agent/testing.md` |
| Dated "session changes" / "changes shipped" history | `docs/archive/agent-session-log.md` |
| Handoffs, reviews, finished plans | `docs/archive/` |
| Comparison/verification harnesses | `scripts/` |
| Plain-English folder explanations for the owner | `MAP.md` |

Do not add dated session logs, implementation narratives, or stale local paths to this file.
