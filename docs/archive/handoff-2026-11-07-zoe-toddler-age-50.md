# PneumoVax — Handoff after Zoe: the toddler card drops "age 50" when 50 would read Complete (2026-11-07)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page that gives pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch `fix/2026-11-07-kai-pcv15-ppsv23-age-50`, off `main` at `1713823` (#138, Theo). Pushed;
**PR #139**, open, waiting for her to merge (now titled "Kai and Zoe…"). Baseline was 2,352 passing;
now **2,360 passing, 0 failed, 215 files** (vitest JSON reporter, `.claude/**` excluded), clean at the
handoff commit after `85b152e`. `main` is protected: branch, PR, squash merge, and **she merges**.

## What's done

| Item | What changed | Commit |
|---|---|---|
| Kai, forward runs | Unchanged from the last handoff (`handoff-2026-11-07-kai-pcv15-ppsv23-age-50.md`) | `bca044b`, `0c9d914` |
| **Zoe** (#139) | 2y3m, healthy, PCV15 at 2, 4, 6, 12 months + an unneeded PPSV23 at 2. Her toddler card said "Re-evaluate at age 50"; at 50 she reads "Complete (PCV15 + PPSV23)". Owner: **"Drop it, like Kai"**. The 24–59-month complete card now uses the 5–18 card's forward run to 50 (`fiftyAsksForNothing`) in place of `!pcv.hasPCV20`; the adult-only-tick limit stays. 120 of 2,178 hand-built toddlers lose the line (all PCV15 + PPSV23), 0 gain; babies 0 of 567 (a PPSV23 cannot count before 2); prose diff 0 of 35,280; whole-app identical; 0 verdicts; both halves of the gate fail tests when removed; checked live (Zoe no line, PCV13 control keeps it). `CLINICAL_SPEC.md` §B-50BABY | `85b152e` |

**Closed by measurement, no change needed:** "Toddler/baby with an EXTRA PCV20" (last handoff). Over the
same hand-built sweep (extra PCV20 at 14 months, every product mix), 0 babies or toddlers carry a line 50
does not need, or lack one 50 does. Pinned in Zoe's sweep test.

## What's NOT done

**Found earlier, never put to her. Ask, don't default:**
- **Today's card reads a future-dated PPSV23 in its own wording** (6-year-old, asplenia, no PCV, PPSV23
  dated tomorrow → "≥8 weeks after the most recent pneumococcal vaccine"). 192 of 1,980 future-dated grid
  entries. Unreachable through the form (the date box refuses future dates), so low value — ask whether to bother.

**Carried, needs her ruling:** R7's leftover (a baby with smoking/alcohol ticked, "series complete" names
no later age, 208 grid cards — still the one `[real]` R7 line in the whole-app run); CDC deep links open at
the top of the page; MeningoVax Ruling D (`/Users/joannehuang/Downloads/MeningoVax-main`, not checked);
"eligible" beside an earlier "can be given from" date on Remy's card.

**Not started, needs her go-ahead:** the three audits proposed 2026-11-01.

**Parked:** R4 (whole-app `[real]`, grid 57 / typical 60), Leah's card with two invalid PPSV23, the
unvaccinated-to-6 PCV15 row, the mixed history, P4, the "next dose from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

Zoe's ruling is applied, guarded, checked live, and sits on the same PR as Kai's, the ruling it extends.
Every age-50 line on a healthy child's card (baby, toddler, 5–18) now matches what the adult card at 50
actually does, measured over hand-built children. Nothing else is half-done.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once #139 is merged
   (`gh pr view 139 --json state`).
2. Run the suite. Expect **2,360 passing**.
3. Ask her the open items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She picks the order.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `node scripts/proseDiff.mjs` against a `git worktree` of the base in the scratchpad (symlink
   `node_modules`), `node scripts/wholeApp/run.mjs --out <file>` on both sides (exit 1 on both is the
   known R4/R7 lines — compare, don't read the exit code), a hand-built sweep where the grid is blind,
   running app, commit by ID.
5. Dev server: other chats may hold all 5 slots for this folder. Those vite servers serve this same
   folder, so `preview_start {url: "http://localhost:5173/PneumoVax/"}` works instead; the form submits
   with `document.querySelector('form').requestSubmit()`.
6. Branch, PR, she merges. Never push to `main`. Check `gh pr view N --json state` before adding to a PR branch.
