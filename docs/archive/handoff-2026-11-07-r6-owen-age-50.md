# PneumoVax — Handoff after R6's leftover, Owen (2026-11-07)

> **SUPERSEDED 2026-11-07** by `handoff-2026-11-07-ava-toddler-age-50-and-sources.md`. #134 is merged, and
> the 24–59-month age-50 item below was ruled and built. Resume from the newer file.

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `fix/2026-11-07-r6-owen-option-b-age-50`, off `main` at `27ec0b3` (#133, check 5, merged). Pushed,
with [PR #134](https://github.com/jojohuhu-git/PneumoVax/pull/134). `main` is protected: branch, PR,
squash merge, and she merges. `main` was 2,301 passing; now **2,312 passing, 0 failed, 209 files**,
measured with vitest's JSON reporter on `c3cfba2`. This handoff's commit changes documents only.

## What's done

| Item | What changed | Commit |
|---|---|---|
| Check 5 | Required test, R4 pinned 41 grid / 5 sampled typical. Merged as #133 (#132 closed, superseded) | `27ec0b3` on main |
| R6 leftover, **Owen** | Owner ruling **"Yes, under Why this"**. A chronic-only child's Option B (PPSV23) now says, folded: *"If PPSV23 is chosen, no dose is needed at 19 [c]; at 50 the adult schedule gives 1 dose of PCV20 or PCV21 [c]."* Picked by the rows the app's own cards at 19 and 50 cite (`OPTION_B_AT_FIFTY` in `recommend.js`). Cites CDC Adult Notes (`adultChronicOnlyReviewAt50`, `adultBothNotAt65`), both read live today. Rulebook chronic row says it too. `CLINICAL_SPEC.md` §B-OPTIONB50 | `c3cfba2` |
| Measured | 231 cards (99 grid, 132 typical), none in view. Prose diff 168 of 35,280 lines, each gaining only this sentence + two quotes. 0 verdicts, 0 visible words. Check 2's R6: 207 → 0 | — |
| Proof | Branch removed → 6 tests fail; reworded into Cora's in-view pattern → 7 fail. A status check that decided nothing was removed | — |

Worth knowing: the line must **not** start "If PPSV23 is chosen, at 19" — that is Cora's `STAY_IN_VIEW` rule
in `noteFold.js`. Check 2's `planMentions` (in `scripts/wholeApp/checks.mjs`) now knows both wordings.
The first draft carried "at least 5 years…"; three guards against a non-IC 5-year follow-on caught it, and
it was dropped — the card now uses her words exactly.

## What's NOT done

**Needs her ruling. Ask, don't default** (carried):
- **The 24–59-month healthy card** carries "Re-evaluate at 50" even with PCV20 in the series or an
  adult-only tick. Noted in §B-50BABY; not raised with her.
- **CDC deep links** open at the top of the page. Memory `cdc-schedule-pages-ignore-sentence-links`.
- **MeningoVax Ruling D**, in `/Users/joannehuang/Downloads/MeningoVax-main`. Not checked.
- **"eligible" beside an earlier "can be given from" date**, on Remy's card.
- **R7's leftover**: a baby with smoking or alcohol use disorder ticked, "series complete" names no later
  age (208 grid). Left out of §B-50BABY on purpose; never put to her.

**Not started, needs her go-ahead:** the three audits proposed 2026-11-01 (age-line doses for children,
the same for adults, wording against the Rulebook).

**Parked:** R4 (pinned in checks 4, 5, 7; 5 grid in check 2), Leah's card with two invalid PPSV23, the
unvaccinated-to-6 PCV15 row, the mixed history, P4, the "next dose from" sentence on the asplenia 5-year-old.

**Left on GitHub, unused:** branches `test/2026-11-07-check-5-card-and-chip-gate` (closed #132) and the
merged PR branches. Delete only if she asks.

## Why this is a good stopping point

R6 is closed in both families. One commit, one PR, no verdict moved. Everything left needs her.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once #134 is merged.
2. Run `npx vitest run`. Expect **2,312 passing**.
3. Ask her the ruling items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She chose R6 first when offered; she picks the order.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `scripts/proseDiff.mjs` (plain `node`, a `main` worktree in the scratchpad for "before"),
   `node scripts/wholeApp/run.mjs`, running app, commit by ID.
5. Branch, PR, she merges. Never push to `main`. Don't stack on an open PR; force-push is blocked.
