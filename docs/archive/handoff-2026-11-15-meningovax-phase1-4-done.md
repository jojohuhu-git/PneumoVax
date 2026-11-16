# MeningoVax port — Handoff after Phase 1.4 (whole-app checks built) (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-phase1-midpoint.md` (banner added).

## Branches and PRs (MeningoVax) — stacked LOCALLY, one PR at a time against `main`

| Item | Branch | Commit | State | Expected suite |
|---|---|---|---|---|
| 1.1 | — | `b070b14` on `main` | **merged (#80)** | — |
| 1.2 | `feature/2026-11-15-phase1-2-prose-diff-onto-main` | `db97147` | **PR #81** against `main`, CI green, mergeable; waiting for the owner | 1,675 / 140 files |
| 1.3 | `feature/2026-11-15-phase1-3-typical-patients-onto-main` | `95bd68a` (on `db97147`) | **local only** | 1,682 / 141 |
| 1.4 | `feature/2026-11-15-phase1-4-whole-app-checks` | `2f70a1b` (on `95bd68a`) | **local only**, working tree clean | **1,692 / 142** |

Measured 2026-11-15: 1.2 branch 1,675 passing, 0 failed, 140 files (build OK); 1.4 branch
**1,692 passing, 0 failed, 0 skipped, 142 files** (build OK). 1.3 was not re-run on its own
branch this session (same commit as last session's `c4e1f3d`, replayed with no conflicts).

The old local branches `feature/2026-11-15-phase1-{2,3}-…` (without `-onto-main`) are the
pre-merge originals; ignore them.

## What's done

- **1.2 replayed onto `main`** after #80 merged; opened as **#81**. Checked live: cards still
  start collapsed, "Why this" closed, both open on click, no console errors.
- **Monthly task fixed** (owner said yes): `monthly-vaccine-source-check` now runs
  `scripts/cdsi/cdsiCompare.mjs`. Ran it: "AGREE 26 DIFFERENT 2 PARTLY 2", the known result.
- **1.4 Whole-app checks** (E3), `2f70a1b`. `scripts/wholeApp/{replay,checks,run}.mjs`,
  `npm run whole-app` (51 s, 35,281 patients, ~1.06 M screens). Seven checks adapted to
  meningococcal. **Findings listed, not fixed**:
  `MeningoVax-main/docs/archive/report-2026-11-15-whole-app-checks.md` — counts by check,
  grouped by clinical family, one worked patient each (two seen on screen). Headlines:
  A (check 1, = Phase 0 N9) military/college under 16, the card asks for a dose the chip
  won't count, for ever: 1,146 grid / 117 typical. B (check 3) "Complete" with a booster
  or outbreak top-up still coming: 2,552 / 1,616. C (check 5, = A3) "repeat this dose"
  where no card asks: 3,613 / 140. D (check 7) an infant's date one day late: 0 / 5.
  E (check 6) grace vs which schedule applies — a question: 0 / 7. Checks 2 and 4: zero.
  Only the zero parts are in the suite: `whole-app-gate.test.js` (10 tests); the app was
  broken 8 ways on purpose and each turned it red (listed in the report).
- `CLAUDE.md` status line, `MAP.md`, `docs/agent/testing.md` (new section + counts) updated.

## What's NOT done

- **1.5 CDC's CDSI test patients** — not started. Copy PneumoVax
  `scripts/cdsi/extractTestCases.py` and `runTestCases.mjs`; MeningoVax's CDC files are in
  `scripts/cdsi/cdc-files/`. See `plan-2026-11-08-cdsi-checks-both-apps.md`. Own PR.
- **STOP B** (after 1.5): the owner sees counts per check by clinical family, one worked
  patient each (1.4's half is the report above). The owner questions it raises, **ask,
  don't default**: A — what should a college-dorm/military patient under 16 be told?
  B — outbreak box still ticked: ask for the top-up (and not say Complete), or Complete and
  never ask? Healthy 10–15 with a routine dose: keep status Complete beside "Booster due at
  16y"? E — confirm the grace stays out of schedule choice (plan §3 already says so).
- **End of Phase 1**: measure usage (`get_usage`) and correct the plan's estimate table.
- Not started: Phases 2–9; Phase 0 findings N2–N4, N6–N12 wait for their phases.

## Why this is a good stopping point

1.4 is complete as a unit, committed, and proven (every zero check shown to fail on a
break). 1.5 is self-contained and not begun. Nothing is half-built; the only pending
thing is the owner merging #81.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 81 --json state`.
2. **Land the stack one PR at a time, each against `main`** (never a PR against another
   PR's branch — that stranded N5 once):
   - #81 open → ask the owner to merge it.
   - #81 merged → `git checkout -b feature/2026-11-15-phase1-3-typical-patients-pr origin/main`,
     `git cherry-pick 95bd68a`, suite (expect 1,682 / 141), push, PR against `main`.
   - That merged → same with `2f70a1b` for 1.4 (expect 1,692 / 142). Its PR body must carry
     the E4 checklist: (1) no clinical numbers added to tests; (2) no capability added — the
     checks are new sweeps over every patient; (3) no clinical rule changed; (4) +10 tests,
     +1 file.
   - `docs/agent/testing.md`, `MAP.md` and `CLAUDE.md` conflicts are counts and added
     sections: keep both, and re-measure the counts table (a test checks it).
3. Then 1.5 on a fresh branch from `main` (it needs nothing from 1.3/1.4), `fix-queue` loop;
   build, run, **list** findings, break each new check on purpose, full suite, commit.
4. MeningoVax `main` is unprotected but the plan says branch + PR; PneumoVax is
   branch → PR → squash. The owner merges both. This handoff rides on PneumoVax PR #154.
