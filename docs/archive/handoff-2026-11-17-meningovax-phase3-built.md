# MeningoVax port — Handoff after Phase 3 families 2–5 and STOP B (2026-11-17)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`) and is
iCloud-synced: commit early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-16-meningovax-ruling-d-built.md` (banner added).

## Branches and PRs (verified 2026-11-17)

| Repo | What | State | Suite |
|---|---|---|---|
| MeningoVax | #91 family 2 | **merged to `main`** (`80c44e6`) | — |
| MeningoVax | #92 family 3, #93 family 4, #94 family 5, #95 STOP B | **merged — but each into the branch below it, NOT `main`** (stacked PRs) | — |
| MeningoVax | **#96** `feature/2026-11-17-land-port-3-families-3-5` → `main` | **OPEN, waiting for the owner.** Lands #92–#95 on `main`; tree identical to the approved branch plus a `CLAUDE.md` status line | **1,936 passed, 150 files** (verified), build OK |
| MeningoVax | #70 (future-dated chip age) | open since 2026-10-13, not this work | — |
| PneumoVax | this docs PR | open, owner merges | docs only |
| PneumoVax | #157 undated PCV not counted (C1 follow-up) | open — another session's work; its checkout is on that branch, so this handoff was written in a separate worktree | not run here |

**Lesson for the next session:** stacked PRs merge into each other's branches. Either open
each family PR against `main` after the previous one merges, or say in the PR body which
PR lands the stack. Before reporting "merged", check `git log origin/main`.

## What's done (owner IDs from the STOP B / STOP C answers)

- **Family 2 — C1, C17** (#91): an undated dose does not count; chip "No date recorded — not
  counted"; card schedules as if not given; G6/G8 undated paths retired. Moved 0 saved (no
  grid patient has one); never-events property 8 (≈240k rows) added.
- **Family 3 — C5, C6, C7** (#92): high-risk MenB dose 3 ≥4 months after dose 2 counts; the
  MMWR "unless" (no 4th dose if dose 3 ≥6 months after dose 1); the 4-day grace at the healthy
  6-month and high-risk 4-month lines. One function each in `seriesTotals.js`
  (`menbHealthyDose2Early`, `menbHighRiskDose3Early`). Moved 252 saved. Property 9.
- **Family 4 — C10, C11, C13 + fix-queue** (#93): travel/microbiologist booster floors; 8 weeks
  between any two MenACWY doses (E1's 4 weeks kept for a too-young first dose); unknown brand
  from 2 months; `fmtMinAge` printed months as days (fixed). Moved 766 saved. Property 10.
- **Family 5 — C3, C4, C8, C9, C14, C15, C18** (#94): relabels only, 0 moved. The rule table's
  STOP C Q2/Q4 lists are now **empty**.
- **STOP B — B-2, B-3, B-4, B-5, the Complete rule, C10 outbreak half** (#95): outbreak booster
  dated while the box is ticked (never "Complete"/"top-up"); military 5-year booster "if
  required by assignment"; college/military under 16 = routine card + one sentence;
  pentavalent waits for dose questions; routine 10–15 card is `due` later, not `complete`.
  Moved 4,949 saved / 1,222 impossible (all grouped in #95). Whole-app check 1: 0 faults
  (`main` 1,146); check 3: nothing flagged (was 2,552). CDC open differences 19 → 7.

## What's NOT done

**Owner action first:** merge **MeningoVax #96** (squash) and this PneumoVax docs PR.

**Phase 3, deferred — B-1** (STOP B, not built; reason: it moves series length at every
age line, in three files, and needs its own PR and measurement): the 4-day grace at an age
line "only when it helps" (fewer doses owed). Lines: 7 months (infant series 4→2 doses), the
dose-2 ≥7-month 3-dose shortcut, 2 years (infant series vs one dose), 7 years (3- vs 5-year
first booster), and the 16-year line. CDC test patients 2013-0488 and 2013-0511 (a dose 4 days
before 16) are listed OPEN under B-1 in `scripts/cdsi/cdsiCore.mjs`.

**Owner questions raised this session (ask, don't default — packet format):**
1. **E1 vs C11:** repeat of a too-young first MenACWY dose — keep 4 weeks, or 8 (C11)?
2. **C6/C7 follow-up:** the 4-day grace on C6's "dose 3 ≥6 months after dose 1" line (CDSI has
   it), and on the older high-risk "dose 2 ≥6 months, no dose 3" line.
3. **Military and college boosters:** no booster-gap check (C10 named travel, microbiologist,
   outbreak). Check military (card now advises 5 years)? College from 19 (CDSI floors it)?
4. **Outbreak, later boosters before 7:** B-2 says "3 if last dose <7"; the app gives only the
   *first* booster 3 years (later ones 5), matching the validator. OK?
5. **M17 (college) source discrepancy** — read live 2026-11-16: Table 10's footnote says
   *"…do not need another dose before college entry unless it has been more than 5 years since
   the dose"*; M17's code comment quotes the routine section's sentence as if it were that
   footnote. Nothing changed; does M17 stand?
6. Carried over: set-aside dose and Ruling D (CDC 2013-0489); E2's switch-product option.

**Known, unchanged:** whole-app check 5 "chip says repeat, no card asks" 3,999/140 (Phase 4
Q5 wording); check 7 212/101; card never says *why* a date moved (Phase 4/6).

**Then:** Phase 4 (one label per dose; ask Q5–Q8 first), per the plan.

## Why this is a good stopping point

Every STOP C answer and four of five STOP B answers are built, approved by the owner, and
one merge (#96) from `main`. B-1 is independent of everything else and starts cleanly from
`main` once #96 lands.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 96 --json state`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` → expect **1,936 passed, 150 files**.
   If NOT merged, stop and ask the owner — do not build on an unlanded stack.
2. `preview_start` "MeningoVax dev server".
3. Put questions 1–6 to the owner (memory `clinical-questions-issue-sources-recommendation-examples`).
4. B-1: `verify-clinical-source` (CDC Timing and Spacing grace sentence; ACIP Tables 4–9 age
   rows), failing test, change, `npm run sweep:update`, `npm run prose -- dump/diff`,
   `npx vite-node scripts/cdsi/runTestCases.mjs --save-answers`, `npm run whole-app`, docs in
   the same PR. One PR against `main`.
5. MeningoVax: branch + PR against `main`, owner merges. PneumoVax: branch → PR → squash.
