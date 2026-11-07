# PneumoVax — Handoff after making check 7 a required test (2026-11-07)

> **SUPERSEDED 2026-11-07** by `handoff-2026-11-07-check-5-required.md`. Check 7 merged as #131;
> check 5, the next item below, is done in #133. Resume from the newer file.

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `test/2026-11-07-check-7-stable-over-time-gate`, off `main` at `1c0e95b` (#130). Pushed, with
[PR #131](https://github.com/jojohuhu-git/PneumoVax/pull/131). `main` is protected: branch, PR, squash
merge, and she merges. Baseline was 2,295 passing; now **2,300 passing, 0 failed**, measured on `e3a1617`
with vitest's JSON reporter. This handoff's commit changes documents only.

## What's done

| Item | What changed | Commit |
|---|---|---|
| Worktrees | Removed `.claude/worktrees/` (3 folders). Each was clean, and each commit was already on a pushed branch. Plain `npx vitest run` is now clean, no exclude flags needed | — (not tracked) |
| Check 7, later-look half | New `whole-app-stable-over-time-gate.test.js`, ~26 s. Grid + every 11th typical. Allows D2, D5 (one direction only, asserted), P2-9 info, R4 pinned at exactly 16 grid / 0 typical | `e3a1617` |
| Check 7, forward half | Added to the walk in `whole-app-forward-checks-gate.test.js`. No allowances. File time unchanged, ~2 min 39 s | `e3a1617` |
| Proof | R3 undone → forward half fails, 2 groups; later-look file stays green. Dose age read as age today → later-look fails, 107 groups, R4 pin fails | — |

Measured today over all 77,496 patients (`node scripts/wholeApp/run.mjs --checks 7`): 16 real (all R4),
0 unsorted. Running all 60,480 typical in the test took 2 min 52 s, so it is sampled.

Worth knowing: **check 7 has two halves**, and the second (`adviceStillStands` in `checks.mjs`) only runs
inside the forward walk. A test that calls `stableOverTime` alone is not check 7.

## What's NOT done

**Needs her ruling. Ask, don't default** (carried from `handoff-2026-11-07-four-rulings-sam-cora-baby-g34.md`):
- **R6's leftover:** a child with chronic conditions only, whose Option B leads to a dose at 50.
- **The 24–59-month healthy card** carries "Re-evaluate at 50" even with PCV20 in the series or an adult-only
  tick. Predates 2026-11-07. Noted in §B-50BABY; not raised with her.
- **CDC deep links** open at the top of the page. Memory `cdc-schedule-pages-ignore-sentence-links`.
- **MeningoVax Ruling D**, in `/Users/joannehuang/Downloads/MeningoVax-main`. Not checked.
- **"eligible" beside an earlier "can be given from" date**, on Remy's card.

**Not started, no ruling needed:**
- **Check 5 ("card and chip agree")** — the report's gate table says: gate "when R4 is fixed, or parked with
  its count pinned". R4 is parked. Measure check 5 first and pin R4 there, the same way.
- The three audits proposed 2026-11-01 (age-line doses for children, the same for adults, wording against
  the Rulebook). Not confirmed whether the whole-app checks already cover them.

**Not gates, by the report's own advice:** checks 2 and 3 read words by pattern; run by hand before release.

**Parked, older:** Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed history,
P4, the "next dose from" sentence on the asplenia 5-year-old, R4 itself.

## Why this is a good stopping point

Check 7 is in, both halves, proved by breaking the engine. Tests and documents only, no answer moved, one PR.
The next no-ruling item (check 5) is independent of it.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once #131 is merged.
2. Run `npx vitest run`. Expect **2,300 passing**.
3. Next with no ruling: check 5 as a required test. Ask her before the ruling items.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `scripts/proseDiff.mjs` (plain `node`), `node scripts/wholeApp/run.mjs`, running app, commit by ID.
5. Branch, PR, she merges. Never push to `main`.
