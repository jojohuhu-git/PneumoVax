# PneumoVax — Handoff after the PCV dose-3 floor fix and two p2016 citation blocks (2026-10-23)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
**it reported port 58018 and actually served 5174 this session; always read the real port
from `preview_logs`.** What the app is: a client-side React SPA giving pneumococcal vaccine
advice across the lifespan. No backend; **every clinical claim on a card must be traceable
to a document that speaks for *that patient***.

Branch: **`feature/2026-10-23-c9-p2016-cites`**, cut off `feature/2026-10-23-p0-pcv-dose3-floor`,
which is off `main`. Both pushed, both have PRs. Working tree **clean** at `6f12852`.
Baseline was 1,371 passing in 122 files; now **1,389 passing in 125 files**, all green, no skips.

Consumed and superseded: `handoff-2026-10-23-cdc-child-notes-finished.md`.

## ⚠ FIRST: two PRs, and they stack

| PR | Branch | Contents | State |
|---|---|---|---|
| [#76](https://github.com/jojohuhu-git/PneumoVax/pull/76) | `feature/2026-10-23-p0-pcv-dose3-floor` | the P0 clinical fix (`ca14dc8`) | **`test` check PASSED**, awaiting the owner's merge |
| [#77](https://github.com/jojohuhu-git/PneumoVax/pull/77) | `feature/2026-10-23-c9-p2016-cites` | the two C9 citation commits — **plus `ca14dc8`**, because this branch was cut from #76's | open; CI not yet checked |

**Merge #76 first**, then #77's diff is just the two C9 commits. `main` is protected and needs
the `test` check; **a session agent cannot merge** (the classifier blocks `gh pr merge`), so
hand the owner green PRs and stop.

## What's done (by ID)

### P0 — a PCV dose given too soon no longer counts (`ca14dc8`) — OWNER DECISION 2026-10-23

**The owner found this herself**, from a patient she was shown for an unrelated citation
question. A 15-month-old with asplenia, three PCV20 doses at 10.4, 11.3 and 12.2 months,
every gap 28 days. Her ruling: the 12-month dose *"does not satisfy the required interval and
does not count. She needs 1 additional dose of PCV20 at >=12 months of age."*

**The app had been contradicting itself.** Asked about that same child at 12 months holding
only her first two doses it answers *"the next dose is due 8 weeks after the most recent
one"* and sets the earliest date at 2026-08-15 — then accepted the dose given 2026-07-18,
silently. The floor used `pcvSeriesMinIntervalDays(ageAtPrevDose)` while the scheduler used
`pcvNextDoseMinIntervalDays`, which IS CDC Catch-up Table 2. `intervals.js` named the
divergence in writing and left both standing, because **owner decision 2 of 2026-10-11** had
deliberately kept the floor permissive.

**The fix is one function, not a stricter number.** The floor now calls the same function the
scheduler calls, so the two can never drift again. `daysFrom` on the interval table gained a
second argument (`ctx`) because CDC keys the cell on the DOSE NUMBER as well as two ages.

**A second owner ruling cut the blast radius 352 → 220.** A first pass applied CDC's flat "8
weeks (as final dose)" to dose 4 and rejected 132 valid doses. Shown a 6-month-old with four
doses at 2.4/3.3/4.2/5.1 months she ruled: *"The 5.1-month dose does not count as the 4th
(booster) dose. Treat it as an extra infant dose… No interval can turn a 5-month dose into
the 4th dose, because the booster is defined by age, not by how many doses came before it."*
So dose 4+ keys on the age at which **that** dose is given, and the scheduler passes 12
months for a final dose it is holding to the first birthday.

**Her proviso is tested and verified in the running app**: the rejected dose stays on the
record with its explanation, a properly spaced later dose is credited as "Dose 3 of 3", and
the series reads Complete. ACIP General Best Practices confirmed the engine's existing
anchor: *"The repeat dose should be spaced after the invalid dose by the recommended minimum
interval."*

Moved **220 of 17,016** verdict-corpus rows and **275 of 18,264** record-problem rows; a
field-level diff shows all 495 carry a new `CHILD-PCV-AFTER-PCV` rejection and **0** moved
for any other reason. `CLINICAL_SPEC.md` §K's row updated in the same commit (the docs guard
forced it). Mutations fail 10 / 3 / 8.

### C9-1 — the at-risk catch-up card credits the row that names its products (`199dfcc`, 976 cards)

p2016 Table 4 rows 1 and 2, plus **footnote ‡** on their PCV15. p2016 is the only source on
that card naming "PCV20 or PCV15". **Row 2's patient cannot be built by `buildCases()`** —
hand-built in the guard, which also measures that the grid reaches it 0 times.

### C9-2 — the "never had a conjugate" rows, all three cards (`6f12852`, 1,152 cards)

p2016 Table 4 rows 6 and 7, Option A and Option B. **Judgement call, in the PR body:** the
two rows' option cells are character-for-character identical, so one entry per option claims
both risk classes; CDC's own keys stay split because CDC words them differently (FINDING N).
Option B is one cell shown as two cards, so the guard asserts the two cards quote the **same**
entry.

Both C9 commits: **0 clinical sentences changed** (proseDiff dump + character-level compare),
mutations fail 5/2/4 and 4/2/3, live-verified on two patients.

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`. **Re-measure, never quote a count
from a log or a handoff** — `npx vite-node scripts/uncreditedSources.mjs` reports **29 pairs**
right now (28 p2016 + 1 Job Aid).

| Priority | Item | Scope |
|---|---|---|
| **P1** | **C9 — p2016's remaining 28 statements** | 4,858 cards. The blocks left, each a clean commit: **Table 4 rows 4/5** (completed before age 6, no PCV20/PPSV23 — Option A/B and the IC five-year tail); **Table 4 rows 8/9** (a conjugate at/after age 6 — Option A/B, and separately the "complete after PPSV23" cards, ~840, which need the *row-the-patient-followed* wording the owner ruled on 2026-10-18 and 2026-10-23); **Table 1** (the infant totals — the engine computes `target` cell-by-cell from Table 1, so the branch taken names the row, and footnote † is the 4wk/8wk interval); **Table 2 row 3** (healthy 5–18 "no additional doses", 1,584 cards — all 1,584 verified as "no previous doses or an incomplete schedule", so the row fits every one). |
| **P2** | **Two card classes the grid can no longer reach** | The P0 fix dissolved them: the **five-dose infant catch-up** (was 220, now 132 — only the 6–7-month-olds remain) and the **at-risk infant "complete at age 2"** cards (64) and **healthy infant complete** (24). Those code paths are still live; the grid just can't reach them, so their p2016 citations are now unmeasurable by sweep. Assert them with hand-built patients, as C9-1 does for row 2. |
| **P2** | **The owner answered two questions this session that are now moot** | She was asked (a) whether to credit p2016's "2 through 18 years" row on a 15-month-old's card and (b) what to do about the five-dose card's missing row. She answered neither as asked — she found the interval bug instead — and both card classes then vanished from the grid. **Re-ask only if those cards come back into scope.** |
| **P2** | **The recommendation anchor vs ACIP's repeat rule** | ACIP: *"The repeat dose should be spaced after the invalid dose by the recommended minimum interval."* The app's **validity** floor does that; its **recommendation** anchors the next dose to the last **valid** dose, which gives an earlier date. No difference for the owner's patient (due either way); could matter for a child seen sooner. **Flagged, not touched — needs her.** |
| **P2** | **"Complete" cards are collapsed by default** | So a discounted dose is one click away rather than on the summary line. Pre-existing design; the owner was told and has not asked for a change. |
| **P2** | Dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread | Unchanged from the previous handoff. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** FINDING L (wrong premise); the p2016/576 question (owner said NO,
2026-10-18); "add a number-has-a-chip guard" (G2 does it); the Catch-up Job Aid's 144-card
statement. The Job Aid's **other** statement — 1,584 cards, healthy 5–18s not caught up — is
the decision the owner asked **not** to be re-raised. Note that **p2016's own statement on
that same card is a different pair and IS citable** (Table 2 row 3); crediting it does not
touch her open Job Aid question.

## Why this is a good stopping point

The P0 fix is one complete clinical change with both owner rulings applied, every moved
verdict explained, and the whole thing driven in the real app. The two C9 commits are
independent of it and of each other. Nothing is half-applied: each commit has its own guard,
its own mutation evidence and its own prose diff.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-23-c9-p2016-cites`
2. **Check whether #76 and #77 merged and whether `main` moved.** If #76 merged and #77 did
   not, rebase. **Do not leave a branch without a PR.**
3. `npx vitest run` — confirm **1,389 passing in 125 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable count use `--reporter=json --outputFile=…`.
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **29** pairs.
5. Start on p2016 Table 4 rows 4/5 or Table 2 row 3. Read p2016 with
   `python3 scripts/pdfLayout.py <file.pdf> 2` — page 2 is Table 4 — **and read the
   footnotes, which are part of the row** (§, ǁ and ‡ have each settled a block now).
6. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix in more than one way and
   quote the counts** → **proseDiff `dump` on both sides, then compare the note fields
   character by character** (the `diff | grep -c` shorthand reports 0 while the files differ)
   → **drive the running app** → commit named by the item ID.
7. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict. Everything else where the dose is
   unchanged is yours to decide (OWNER DECISION 2026-10-18), grouped in the PR body for audit.

## Lessons this session paid for

- **The owner's patient example is not just an example.** She was given a 15-month-old to
  settle a citation question and found a clinical bug in it instead. Run the engine on any
  patient you put to her, and look at the dose verdicts before asking about the citations.
- **A comment naming a known divergence is not a guard.** `intervals.js` described the
  advise-vs-grade split in careful prose and left both readings live. Prose does not fail CI.
- **`cite()` exposes the document as `doc`, not `short`.** `short` is on the chips. A test
  written against `.short` reports every card as uncredited and looks like an engine bug.
- **The pinned spanning-population list is SORTED.** Insert alphabetically or the assertion
  fails on order alone, which reads like a real finding.
- **Check whether a mutation's failure count differs per clause.** All six mutations this
  session failed different tests in different numbers; equal counts would have suggested one
  assertion carrying everything.
