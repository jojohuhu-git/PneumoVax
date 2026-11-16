> **SUPERSEDED (2026-11-15)** by `handoff-2026-11-15-meningovax-phase2-1-rule-table.md`. #85 merged;
> Phase 2.1 (the rule table) is built and open as MeningoVax PR #86. Do not resume from this file.

# MeningoVax port — Handoff after STOP B answered and 1.5 made a required test (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-phase1-5-done.md` (banner added).

## Branches and PRs

| Repo | Branch | Commit | State | Suite |
|---|---|---|---|---|
| MeningoVax | — | `e9bea07` on `main` | 1.5 **merged (#84)** 2026-11-16 02:32 UTC | 1,692 / 142 at session start (verified) |
| MeningoVax | `feature/2026-11-15-cdsi-required-test` (pushed) | `7cbf69e` + `c08ff84` (pointer doc) off `e9bea07` | **PR #85** against `main`, waiting for CI and the owner | **1,697 passed, 0 failed, 143 files**, build OK, measured on this branch |
| PneumoVax | `docs/2026-11-15-meningovax-phase1-midpoint` (pushed) | `fd75149` + this handoff | **PR #154**, docs only, open | not run (docs only; CI runs it) |

## What's done

- **Baseline verified:** `main` = `e9bea07`, 1,692 / 142 green; `runTestCases.mjs` "NEW 0, moved 0".
- **STOP B answered** (owner, five questions, one patient each, sources read live: ACIP MMWR
  RR-9 2020-09-25 Tables 8 and 10 + college text; CDC child schedule notes updated 2025-07-01).
  Recorded as table B-1…B-5 under Phase 1 in the plan (`fd75149`):
  - **B-1** grace at an age line (1.4 E + 1.5 family 5): **"only when it helps"**, the PneumoVax
    §A-GRACE12-HELPS ruling carried over. Travel baby, Menveo 2 days before 7 months → 2-dose
    series (today 4; engine-checked). Dose 1 day before age 10 keeps counting.
  - **B-2** outbreak box still ticked: keep asking for the dose at 5 y (3 y if last dose <7 y)
    while ticked, drop "Complete". **Wording: no "top-up"; succinct clinical language** (saved as
    memory `app-wording-succinct-clinical-no-top-up`), e.g. "Booster Sep 15, 2028 if outbreak
    risk continues".
  - **B-3** military recruit: show the 5-year booster date with the assignment caveat, no "Complete".
  - **B-4** military/college under 16: routine schedule only; the box adds nothing under 16.
  - **B-5** pentavalent card waits for the dose answers, as the MenB card does.
  - Not asked (her rule already decides it): healthy 10–15 "Complete" beside "Booster due at
    16y" stops saying Complete (PneumoVax owner rule 2026-11-01).
- **1.5 made a required test** (MeningoVax `7cbf69e`, PR #85): comparing code split into
  `scripts/cdsi/cdsiCore.mjs` (report identical line for line); new
  `src/logic/__tests__/cdsi-test-patients-gate.test.js` (5 tests) fails on NEW / healed /
  moved. Three breaks, each caught and undone (listed in `docs/agent/testing.md`). KNOWN table:
  family 5 → DELIBERATE; outbreak, military, "Complete beside booster" families noted
  "OPEN until Phase 3". No app code changed.
- **End-of-Phase-1 usage re-measure: could not be done honestly.** `get_usage` read weekly 0%,
  5-hour 2%, although Phase 0–1 ran this week; written in the plan's estimates section. The
  table stays an estimate.

## What's NOT done

- **Owner merges PR #85 (MeningoVax) and PR #154 (PneumoVax).**
- **Phase 2 — the rule table** (plan §Phase 2): 2.1 a `doseIntervalRules.js`-style table, every
  row from Phase 0's inventory, **0 answers may move** (saved answers + CDC gate prove it); 2.2
  "what the sources say" column; 2.3 CDSI rule comparison (the CDSI 4.65 values in the 1.5 report
  are a head start). Read `get_usage` at the start and end and record the difference in the plan.
- **STOP C — decision packet 1** after Phase 2 (Q1 Ruling D, Q2 rows that differ incl. 1.5
  families 6, 7, 9, 10, Q3 pentavalent, Q4 rows with no source). Ask, don't default.
- **Phase 3** applies packet 1 **and the STOP B answers B-1…B-5 + the Complete rule**. Each needs
  `verify-clinical-source` (re-read live) before code changes; moved answers explained per PR.
- **PneumoVax follow-up (not started):** port the "answers moved" check into PneumoVax's
  `scripts/cdsi/runTestCases.mjs` (same hole there).
- Not started: Phases 4–9; Phase 0 findings N2–N4, N6–N12 wait for their phases.

## Why this is a good stopping point

STOP B is closed and recorded; Phase 1 is complete, with its last piece (the CDC gate) in one
open PR that changes no app code. Phase 2 is a fresh, self-contained session that may move no
answers.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 85 --json state,mergedAt`. If
   merged: `git checkout main && git pull --ff-only`. Run `npm test`: expect **1,697 passed,
   143 files**. `npx vite-node scripts/cdsi/runTestCases.mjs`: "NEW 0", "moved 0".
2. `get_usage` and note it (for the Phase 2 measure).
3. Phase 2 per the plan, `fix-queue` loop; one PR per numbered item, against `main`.
4. MeningoVax `main` is unprotected but the plan says branch + PR; PneumoVax is
   branch → PR → squash. The owner merges both.
