# PneumoVax — Handoff after Mila and Theo: the Job Aid button on toddler cards (2026-11-07)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

**Two PRs.** Mila merged as **#137** (`b3f2584` on `main`). Theo is on
`fix/2026-11-07-theo-job-aid-not-yet-due`, off `b3f2584`, with its own PR (number in `gh pr list`).
**2,340 passing, 0 failed, 212 files** (vitest JSON reporter, `.claude/**` excluded). `main` is
protected: branch, PR, squash merge, and **she merges** (the classifier blocks `gh pr merge`).

## What's done

| Item | What changed | Commit |
|---|---|---|
| **Mila** (#137) | Healthy, 2½, PCV15 at 2, 4, 6, 12 months: the Job Aid showed as a button nothing cites. Its p.3 (Revised January 2025, 95,267 bytes = what CDC serves) has rows for 0–3 previous doses only, and needs dated doses. Owner: **"Take it off"** for 4+ doses (complete and catch-up cards) and an undated completing dose. 648 of 1,830 hand-built toddlers lose only that button | `d4e7677` |
| **Theo** | Turned 2 today, healthy, PCV13 at 2 months and 23 months (a month ago). The Job Aid row fits him but says "Give Dose 3 (Final Dose) today"; the card waits 8 weeks (2 December, from p2016). Owner: **"Take it off"**. The catch-up card now keeps the Job Aid only when a Job Aid cell is cited (`jobAidKey`), which covers Mila and Theo with one gate. 81 of 24,192 hand-built toddlers with a recent dose lose only that button; 0 grid lines; whole-app identical; 3 mutations caught; checked live | `50e115a` |

Both are in `CLINICAL_SPEC.md` §B-JOBAID-NOROW. Healthy-toddler cards now carry no Job Aid button
without a number, in any history measured.

## What's NOT done

**Carried from the last handoff, never put to her. Ask, don't default:**
- **66 cards with an INVALID PCV20** keep the age-50 line though at 50 they read Complete.
- **Toddler/baby with an EXTRA PCV20**: Nina's ruling was scoped to the 5–18 card. Not measured.
- **Healthy toddler with PCV15 + an unneeded PPSV23** reads Complete at 50 yet keeps the line.

**Carried, needs her ruling:** R7's leftover (a baby with smoking/alcohol ticked, "series complete"
names no later age, 208 grid); CDC deep links open at the top of the page; MeningoVax Ruling D
(`/Users/joannehuang/Downloads/MeningoVax-main`, not checked); "eligible" beside an earlier "can be
given from" date on Remy's card.

**Not started, needs her go-ahead:** the three audits proposed 2026-11-01.

**Parked:** R4, Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed
history, P4, the "next dose from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

Both Job Aid rulings are applied and guarded: each test fails when its fix is reverted or widened.
No dose, date or verdict moved. Everything left needs her.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once the Theo PR is merged.
2. Run the suite. Expect **2,340 passing**.
3. Ask her the open items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She picks the order.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `node scripts/proseDiff.mjs` against a `main` worktree in the scratchpad, `node
   scripts/wholeApp/run.mjs --out <file>` against main's, a hand-built sweep where the grid is blind,
   running app, commit by ID.
5. Branch, PR, she merges. Never push to `main`. Check `gh pr view N --json state` before adding to a PR branch.
