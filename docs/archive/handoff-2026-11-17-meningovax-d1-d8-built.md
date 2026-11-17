# MeningoVax port — Handoff after owner answers D1–D8 were asked and built (2026-11-17)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`) and is
iCloud-synced: commit early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-17-meningovax-phase3-built.md` (banner added).

## State (verified 2026-11-17)

MeningoVax branch `feature/2026-11-17-open-questions-d1-d8`, off `main` at `6ba4222` (#96,
merged). **Pushed; PR #97 open against `main`, waiting for the owner** (owner merges; MeningoVax
`main` is unprotected, but the flow is branch → PR). Baseline was 1,936 passing / 150 files; now
**1,970 passing (156 files)**, all green, build OK, working tree clean at `8690fc2`.

## What's done (owner IDs; questions, answers and live-read quotes in MeningoVax
`docs/archive/decisions-2026-11-17-open-questions.md`)

The six open questions from the last handoff were asked in packet format; two drew follow-ups
(D5 and D7). One commit per answer:

1. **D3, D4** (`f1be529`): the 4-day grace at both high-risk MenB 6-month lines (`seriesTotals.js`).
   Moved 280 saved answers.
2. **D5** (`dee38bc`): a too-young first MenACWY dose is repeated **8 weeks** after it, not 4.
   The owner caught that E1's 4 weeks is MenB's number. MenB keeps 4 weeks; PneumoVax is
   unchanged (PCV's minimum is 4 weeks). `MENACWY_REPEAT_DOSE_FLOOR` was removed. Moved 8 + 24
   impossible entries.
3. **D6** (`ebf957b`): a military booster at 16+ under 5 years doesn't count
   (`militaryBoosterNow`, row `ACWY-TRAVEL-BOOSTER-GAP`). Moved 30.
4. **D7** (`7a0b641`): every outbreak card (MenACWY and MenB, any age) says "if outbreak risk
   continues" / "for this outbreak" (`outbreakWording()` at the end of `recommend()`). 0 moved.
5. **D1** (`228f71a`): college dose at 16+ covers **5 years**, then 1 dose is due. **Reverses
   M17**: M17 had quoted ACIP's routine sentence as the college footnote. Moved 44.
6. **D2** (`18394f0`): a set-aside MenACWY dose (before 10, or a routine dose 2 before 16) starts
   the 8-week clock (`validate.js`). Closes CDC 2013-0489 (open differences 7 → 6; 75/104
   agree). Moved 36 (24 of them are the before-10 kind, named in the PR).
7. **D8** (`94573ac`): with one dose of each MenB product, the card's visible lead adds "Or finish
   with <other> instead: dose N from <date> (the <first> dose then does not count)"
   (`withMenbSwitchLine`). 0 moved.
8. Never-events **property 11** (`b7591da`): college 5-year cover, military floor, no counted
   MenACWY dose within 8 weeks of any dose given. 0 violations; fails on main's code (160/253/30).

Every item was live-checked in the running app (card + chip). Whole-app: check 1 has 0 faults.
Check 3 has new college-only flags (question 1 below). Check 7 rose 212/101 → 774/249: D1's
5-year turnover, plus D7's "if… → for this outbreak" label change on the due date, the same
change B-2 already gave the teen card. Check 5 rose 3,999 → 4,019 (known Q5 group).

## What's NOT done

**Owner action first:** merge MeningoVax **#97** and this PneumoVax docs PR.

**Phase 3, deferred — B-1** (STOP B, owner-decided, not built; reason: it moves series length at
every age line and needs its own PR and measurement). The 4-day grace at an age line "only when it
helps": 7 months (infant series 4→2 doses), the dose-2 ≥7-month shortcut, 2 years, 7 years, and
16 (CDC 2013-0488, 2013-0511, listed OPEN in `scripts/cdsi/cdsiCore.mjs`). D2 interacts at 16:
a dose 1–4 days before 16 should count as the booster under B-1. Today it gets a booster 8 weeks
later.

**New owner questions from this session (ask, don't default — packet format):**
1. **College "Complete" (from D1).** Keep "Complete (dose given at ≥16y)", or e.g. "Covered for
   college entry until <dose + 5 y>"? (PneumoVax rule: "Complete" only when nothing more is owed.)
2. **MenB outbreak booster cadence.** ACIP Table 8: *"Single dose if ≥1 yr after MenB primary
   series completion"*. The app uses the medical-risk "every 2–3 years". Keep or change?
3. **D1 disclosure.** The D1 question did not show Table 10's Boosters row (*"Not routinely
   recommended…"*). Read live afterwards, it is consistent with D1, and the PR says so. Confirm
   with the owner if they raise it.
4. Still open from before: MenB of unknown product at 16+ (CDC 2024-0069); healthy MenB rescue
   dose 3 vs 6 months from dose 1 (2024-0034/0035); the 1-day calendar difference (2024-0040,
   shared with PneumoVax).

**Found, not changed (Phase 4 wording):** the set-aside chip label "Off-window - repeat" sits
beside "Safe… does not count". "Up to date" shows for an infant with no counted dose. Two
identical "ACIP 2020 MMWR" chips appear on the young-child outbreak card. Check 5
"chip says repeat, no card asks" is 4,019/140.

**Then:** Phase 4 (one label per dose; ask Q5–Q8 first), per the plan.

## Why this is a good stopping point

Every answer the owner gave this session is built, tested, live-checked and in one PR. B-1 is
independent and starts cleanly from `main` once #97 lands.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 97 --json state`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` → expect **1,970 passed, 156 files**.
   If NOT merged, stop and ask the owner — do not build on an unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Put questions 1–2 to the owner (memory `clinical-questions-issue-sources-recommendation-examples`;
   name each family's own source: memory `source-each-interval-per-vaccine-family`).
4. B-1: `verify-clinical-source`, failing test, change, `npm run sweep:update`,
   `npm run prose -- dump/diff` (against a `main` worktree), `npx vite-node
   scripts/cdsi/runTestCases.mjs --save-answers`, `npm run whole-app` (compare to `main`), docs
   in the same commit. One PR against `main`.
5. MeningoVax: branch + PR against `main`, owner merges. PneumoVax: branch → PR → squash.
