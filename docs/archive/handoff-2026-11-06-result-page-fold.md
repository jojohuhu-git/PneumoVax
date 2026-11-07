> **SUPERSEDED 2026-11-06 by `handoff-2026-11-06-fold-built.md`.** WORD-1 is built. Do not resume from this file.

# PneumoVax — Handoff: wording queue finished, result-page fold decided, not built (2026-11-06)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. The app is a client-side React page. Its promise: never
guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `fix/p2-9-10-routine-label-and-first-dose-wording`, off `main`. The test count is in the PR.

## What's done

| Item | What changed | Where |
|---|---|---|
| P1-2 R5 | "No dose now", not "Complete", while a dose is still owed | #123, merged |
| P2-1 R9 | No "now" over a future date. 88 cards to 0 | #124, merged |
| P2-3 R8 | "at or after age 6" only when the dates say so. 19,910 cards to 0 | #124, merged |
| P2-7 | "complete" cites the sentence that says it, 19-49 risk page, 50+ job aid | #124, merged |
| P2-8 | Not "overdue" on the day a dose is due | #124, merged |
| P2-2 R3 | Remy: advise Jan 29, say Jan 1 counts. 33 patients to 0 | #125, merged |
| P2-9 | "Routine" for an on-time baby | this branch |
| P2-10 | No interval before a first dose | this branch |
| Wordiness review | `docs/archive/report-2026-11-06-wordy-result-pages.md` | #124, merged |

## What's NOT done

**WORD-1: fold the result page. Decided, not built. Start here.** Her answers of 2026-11-06:

1. Hide explanations under "Why this", and shorten the 20 most common lines under recorded doses.
2. Sources row goes inside "Why this".
3. Invalid dose shows the gap and the action, short, without a click. Her chosen shape for Max:
   "Same day as PCV; minimum interval 8 weeks." / "Not repeated. Next dose from Nov 6, 2030 at the earliest."
4. Add a visible PPSV23 line where PCV15 is offered and hidden, 2,262 cards. On a card for a patient
   with no doses it must not measure from a dose that does not exist (P2-10).
5. Disclaimer: the PPSV23 risk-history paragraph goes behind a click. The first half stays.
6. PCV21 geographic note folds to its title.

The report's "What must stay in view" table is the keep list. She did not object to it, and she has
not read it line by line, so show her the first built cards. Build notes are at the end of the report.
The trial cost 134 tests across 50 files, and the report says that runs slightly high. **Add a test
that fails if visible words creep back up.**

**Still to ask her, ask don't default:**
- Rewrite 4 in the report touches her own wording ("isn't harmful, isn't counted"). Keep or shorten?
- MeningoVax: same fold? Her design rule says design changes in one app go to the other.

**Queue items left** (`docs/archive/fix-queue-2026-11-05-whole-app-rule-checks.md`):
- P1-3, every other conjugate nobody asked for: group by clinical family, then her ruling. P2-3's
  citations wait on this, because Ada's card still cites the row it cited.
- P2-4 R6, OWNER: Cora, report Decision 3. Should Option B say a dose may follow at 19?
- P2-5 R4 and P2-6 R7: recommended parked and no change. Not yet put to her.
- Check 7 "Stable over time" stays out of `npm test`: 16 patients remain, with other causes.

## Worth knowing

- **The dose total still reads the age today.** A baby with one dose before 7 months reads "of 4" under
  7 months and "of 3" over it. That is p2016's own table. Recorded in §L-2, not raised as a fault.
- **The word "eligible" in a card's header** sits beside an earlier "can be given from" date on Remy's
  card. It was already so on other cards. Worth a look during the fold.
- **The "BOTH NUMBERS GO ON THE CARD" clause is behind "Why this" today**, against the wording in
  `CLAUDE.md`. The report flags it. Settle it while folding.
- `rawPcv` holds untouched form rows. Use `dropBlankDoseRows()` or `ppsv.noDoseOnRecord`.
- A handoff's "no owner decision needed" can be wrong. P2-2 moved a date, so it went to her.
- CDC's sentence links could not be proven in the built-in browser. Its risk page does not scroll.

## Why this is a good stopping point

The wording queue is finished, and each piece landed separately. The fold is large and touches about
50 test files, so it deserves its own branch from a clean `main`.

## Resuming

1. Merge this branch's PR first. Then `git checkout main && git pull`.
2. Run `npx vitest run --exclude '**/.claude/**' --exclude '**/node_modules/**'` and confirm the count
   in the PR before any new work.
3. Ask the two questions above before touching those lines.
4. Build WORD-1 in the engine, moving sentences from `lead` to `detail`. Keep `CLAUDE.md`'s rule that
   clinical logic stays out of components. Run `scripts/proseDiff.mjs` before and after, test first,
   check in the running app.
5. PneumoVax's `main` is protected: branch, PR, squash merge, and she merges.
