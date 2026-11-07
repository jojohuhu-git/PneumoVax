> **SUPERSEDED 2026-11-06** by `handoff-2026-11-06-p1-3-families-ruled.md`. The fold merged as #127 and the
> P1-3 item below is done. Do not resume from this file.

# PneumoVax — Handoff after the result-page fold (2026-11-06)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `feat/word-1-fold-result-page`, off `main` at `2cb8931`. Pushed, with a PR. `main` is protected:
branch, PR, squash merge, and she merges. Baseline was 2,218 passing; now **2,242 passing (203 files)**, 0
failed, measured on the fold commit. This handoff's commit changes documents only.

## What's done

| Item | What changed |
|---|---|
| P2-9, P2-10 | Merged, #126 |
| WORD-1 | The fold, the 20 dose lines, Sources inside "Why this", disclaimer, PCV21 note, PCV15's PPSV23 line. `src/logic/noteFold.js`, `CLINICAL_SPEC.md` §WORD-1 |

Measured for WORD-1: saved answers moved 0 of 17,016 and 0 of 18,264. Across both grids no card sentence was
lost and one is new. Visible words on the grid, typical / wordiest 1 in 10 / worst: 64 / 168 / 383 before,
34 / 67 / 164 after. She saw the first cards and the list of judgement calls, then said to open the PR.

## What's NOT done

**Needs her ruling. Ask, don't default:**
- **P1-3, every other conjugate nobody asked for.** Group by clinical family first: no PPSV23 yet, a child
  called complete, a healthy child. P2-3's citations wait on this. The queue's 31,584 was measured before
  Noor's family was ruled on, so re-count.
- **P2-4 R6, Cora, report Decision 3.** Should Option B say a dose may follow at 19?
- **P2-5 R4 and P2-6 R7.** Recommended parked and no change. Not yet put to her.
- **G34, a healthy 5-year-old with one PCV dose.** She was asked to confirm "Not indicated" on 2026-11-01.
  No record of an answer was found.
- **CDC deep links** open at the top of the page. Memory `cdc-schedule-pages-ignore-sentence-links`.
- **MeningoVax Ruling D.** A repeat dose is measured from the last dose that counted. Not checked today. The
  folder is `/Users/joannehuang/Downloads/MeningoVax-main`.
- **"eligible" beside an earlier "can be given from" date**, on Remy's card. Left as it was.

**Not started, no ruling needed:**
- Make "advice is accepted" a required check if it is not one. No file named as a gate holds it.
- Check 7 "Stable over time" stays out of `npm test`. Its 99 unsorted patients are now sorted as P2-9, so
  count what remains before promoting it.
- The three proposed audits of 2026-11-01. The whole-app checks may have covered part. Not confirmed.
- Remove the three old folders in `.claude/worktrees/`. They cause false failures if vitest is run bare.

**Parked, older:** Leah's card with two invalid PPSV23 doses, the unvaccinated-to-6 PCV15 row, the mixed
history, P4, the "next dose from" sentence on the asplenia 5-year-old. Her rule on unlikely histories may
retire some.

## Worth knowing

- `note.lead` means what shows. A must-show sentence goes in `STAY_IN_VIEW` and in the guard's written-out list.
- Tests pinning how a sentence is written or cited read `recommendBeforeFold`. Do not fold those.
- Mutate a keep rule through its `re:`, then `cmp`. Deleting the `why:` line leaves it live.
- The Rulebook page was not reread against the shorter dose lines. Only one worked-patient check moved.
- PneumoVax and MeningoVax now differ on the fold. That is her choice, not drift.

## Why this is a good stopping point

The fold is one change, with its guard, and nothing else depends on it. The queue left is all owner rulings
or optional checks.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once the PR is merged.
2. Run `npx vitest run --exclude '**/.claude/**' --exclude '**/node_modules/**'`. Expect **2,242 passing**.
3. Ask her which ruling to take first. Give one patient, the whole scenario, in the question box.
4. Per item: reproduce, failing test, fix, full suite, break the fix, `scripts/proseDiff.mjs`, running app,
   commit by ID. Run the prose tool with plain `node`.
5. Branch, PR, she merges. Never push to `main`.
