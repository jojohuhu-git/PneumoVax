> **SUPERSEDED 2026-11-07** by [`handoff-2026-11-07-check-7-required.md`](handoff-2026-11-07-check-7-required.md). PRs #129 and #130 are merged; check 7 is now required (PR #131). Resume from the newer file.

# PneumoVax — Handoff after the four rulings of 2026-11-07 (Sam, Cora, the healthy baby, G34)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `fix/2026-11-07-three-rulings-cora-baby-g34`, off `main` at `b894934` (#128). Pushed, with
[PR #129](https://github.com/jojohuhu-git/PneumoVax/pull/129). `main` is protected: branch, PR, squash
merge, and she merges. Baseline was 2,273 passing; now **2,294 passing (774 test files counted by vitest's
JSON reporter)**, 0 failed, measured on `4e16526`. This handoff's commit changes documents only. CI on #129
was still running when this was written.

## What's done

| Item | What changed | Commit |
|---|---|---|
| G34 | Owner confirmed "Not indicated" for a healthy 5-year-old with one PCV. AAP page (updated 10/09/2025) read live: agrees. No code; pinned with its 4y11m control | `0d3ad18` |
| P2-6 (R7) | Healthy baby's complete card: "Re-evaluate at age 50" under Why this. Off with PCV20 in the series, or an adult-only tick. §B-50BABY | `0d3ad18` |
| P2-4 (R6) | Cora: Option B (PPSV23) says what it leads to at 19, in view, from the adult card run forward (`optionBAtNineteen`). Non-IC only; not for chronic-only; not Option B-2. Rulebook row updated. §B-OPTIONB19 | `320202e` |
| P2-5 (R4) | Sam: an adult with ONE childhood PPSV23 thrown out for coming too soon after a PCV gets PCV20 or PCV21 only (Leah's ruling, carried to Ivy's adult cards). **10 of 17,016 verdicts moved**, 0 of 18,264. §C-P2-ONE-ADULT | `c82fbc2` |
| Checks | Check 2 reads Cora's line; R6 and R7 sort only what is left; anything else is unsorted | `4e16526` |

Whole-app checks after: **check 1 ("advice is accepted") at 0 patients**, unsorted 0. Still flagged:
R4 57 grid / 60 typical (child card and chip naming different vaccines), R6 75 / 132 (chronic family),
R7 208 / 0 (babies with smoking or alcohol ticked). All three are labelled as left on purpose.

How she answered: Sam took two clarifying rounds. She asked "why was PPSV23 given 2 years later", then "why 1
year instead of 5". What settled it was quoting her own Leah and Ivy rulings on the same question. Memory
`four-rulings-2026-11-07`.

## What's NOT done

**Needs her ruling. Ask, don't default:**
- **R6's leftover:** a child with chronic conditions only, whose Option B leads to a dose at 50. Not put to her.
- **The 24–59-month healthy card** carries "Re-evaluate at 50" even with PCV20 in the series or an adult-only
  tick. This predates today. It is noted in §B-50BABY and was not raised with her.
- **CDC deep links** open at the top of the page. Memory `cdc-schedule-pages-ignore-sentence-links`.
- **MeningoVax Ruling D**, in `/Users/joannehuang/Downloads/MeningoVax-main`. Not checked.
- **"eligible" beside an earlier "can be given from" date**, on Remy's card.

**Not started, no ruling needed:**
- ~~**Make check 1 a required check.**~~ **DONE 2026-11-07, same day, branch
  `test/2026-11-07-check-1-advice-accepted-gate`.** It joined check 4's file, renamed
  `whole-app-forward-checks-gate.test.js`. It runs in `npm test`, not a separate CI step: one forward walk
  of the grid serves both checks, plus every 11th typical patient followed forward. It caught Sam's ruling
  undone (2 groups) and R2 undone (5). Suite: 2,295 passing.
- Check 7 "Stable over time": 16 grid patients, all R4. Pin R4's count before promoting it.
- The three audits proposed 2026-11-01 (age-line doses for children, the same for adults, wording against
  the Rulebook). Not confirmed whether the whole-app checks already cover them.
- Remove the three old folders in `.claude/worktrees/`. They make vitest report false failures when it is
  run without the exclude flags.

**Parked, older:** Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed history,
P4, the "next dose from" sentence on the asplenia 5-year-old.

## Worth knowing

- A look-ahead that adds a dose must stop itself: validating that dose runs `cardsOnTheDayOf`, which re-enters
  the child pathway. `optionBLookedAhead` is the flag. Without it the stack overflowed.
- `pedsRiskIds()` strips adult-only ticks before `pcvInfant`, so the infant block cannot see them. The flag
  is passed in separately.
- A complete card is never folded (`NOT_FOLDED`). To put a sentence "under Why this", put it in `detail`.
- Grid gaps: the grid has no complete healthy baby on its first screen. The whole-app checks reach that card
  by following babies forward.

## Why this is a good stopping point

All four rulings are built, guarded, checked in the running app, and in one PR. Nothing waits on them.
What remains is either owner questions or optional checks.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once #129 is merged.
2. Run `npx vitest run --exclude '**/.claude/**' --exclude '**/node_modules/**'`. Expect **2,294 passing**.
3. The next item needs no ruling: make check 1 a required check. Ask her before starting the others.
4. Per item: reproduce, failing test, fix, full suite, break the fix, `scripts/proseDiff.mjs` (plain
   `node`), `node scripts/wholeApp/run.mjs`, running app, commit by ID.
5. Branch, PR, she merges. Never push to `main`.
