> **SUPERSEDED 2026-11-07** by `handoff-2026-11-07-mila-theo-job-aid-button.md`. #137 is merged and Theo, its open item, is done. Resume from the newer file.

# PneumoVax — Handoff after Mila: the Job Aid button comes off toddler cards it has no row for (2026-11-07)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `fix/2026-11-07-job-aid-off-4-dose-toddlers`, off `main` at `6679ace` (#136, Leo and Nina,
merged). Pushed, with its own PR (number in `gh pr list`). `main` is protected: branch, PR, squash
merge, and **she merges** (the classifier blocks `gh pr merge`). Baseline was **2,331 passing**; now
**2,338 passing, 0 failed, 212 files** (vitest JSON reporter, `.claude/**` excluded).

## What's done

| Item | What changed | Commit |
|---|---|---|
| **Mila**: Job Aid button with no number (carried "check this first" item) | Checked first, as the last handoff asked: it is real, and bigger than thought. Mila (healthy, 2½, PCV15 at 2, 4, 6, 12 months) — the most ordinary toddler — showed the CDC PCV Catch-up Job Aid as a grey button nothing cites. The Job Aid's p.3 (Revised January 2025; your `~/Downloads/pneumococcal.pdf`, 95,267 bytes = the size CDC serves today) lists 0, 1, 2 or 3 previous doses only and needs dated doses. Owner: **"Take it off"**. Off for 4+ doses (complete card), 4+ doses all before 12 months (catch-up card), and an undated completing dose. `refs` in `pcvHealthyChild`, gated by the same test as the number. §B-JOBAID-NOROW | `d4e7677` |
| Measured | 0 of 35,280 grid prose lines (the grid cannot build a 4-dose toddler). Hand-built, 1,830 healthy toddlers: 648 lose only the Job Aid button, 0 change anything else. Whole-app checks byte-identical to main. `uncreditedSources.mjs` still 0. Four mutations caught (3 / 1 / 1 / 2 failures) | — |
| Live check | Mila's card: Sources [1] CDC Child/Adolescent Notes, [2] p2016, [3] CDC Adult Notes. No Job Aid | — |

## What's NOT done

**Found this session, never put to her. Ask, don't default:**
- **2- or 3-dose toddler whose dose is NOT yet due** (catch-up card): `jobAidCatchupKey()` returns
  null (the Job Aid's 2- and 3-dose rows print only a "today" cell), so the button shows with no
  number. 27 of 1,440 probed toddlers. The Job Aid does have rows for these doses — different
  question from Mila's, so left alone and named in the code comment.

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

Her ruling is applied in full to the three histories she was shown, guarded by a test that fails
when either half is reverted or widened. One commit of code, no dose or verdict moved. Everything
left needs her.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once this PR is merged.
2. Run the suite. Expect **2,338 passing**.
3. Ask her the open items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She picks the order.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `node scripts/proseDiff.mjs` against a `main` worktree in the scratchpad, `node
   scripts/wholeApp/run.mjs --out <file>` against main's, a hand-built sweep where the grid is blind,
   running app, commit by ID.
5. Branch, PR, she merges. Never push to `main`. Check `gh pr view N --json state` before adding to a PR branch.
