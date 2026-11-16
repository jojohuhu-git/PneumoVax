> **SUPERSEDED (2026-11-15)** by `handoff-2026-11-15-meningovax-stop-b-answered.md`. #84 (1.5)
> merged; STOP B is answered and recorded in the plan; 1.5 is now a required test (MeningoVax PR #85).
> Do not resume from this file.

# MeningoVax port — Handoff after Phase 1.5 (CDC's CDSI test patients) (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-phase1-4-done.md` (banner added).

## Branches and PRs (MeningoVax) — one PR at a time against `main`

| Item | Branch | Commit | State | Suite |
|---|---|---|---|---|
| 1.1–1.4 | — | `b070b14`, `420d4d1`, `ed1ec16`, `6e2834a` on `main` | **merged** (#80–#83; #83 at 2026-11-16 02:13 UTC) | — |
| 1.5 | `feature/2026-11-15-phase1-5-cdsi-test-patients` (pushed) | `b9686d9` off `6e2834a` | **PR #84** against `main`, waiting for CI and the owner | **1,692 passed, 0 failed** (unchanged: no test added), build OK, measured on this branch 2026-11-15 |

## What's done

- **Baseline verified** at session start: `main` = `6e2834a`, suite 1,692 green.
- **1.5 CDC's CDSI test patients** (M-CDSI-2), `b9686d9`:
  - `scripts/cdsi/extractTestCases.py` (copied from PneumoVax; groups MCV/MENB and
    Meningococcal/Meningococcal B) → `cdc-files/meningo-test-cases.json`, **104 patients**
    (52 MenACWY, 52 MenB).
  - `scripts/cdsi/runTestCases.mjs` — `npx vite-node scripts/cdsi/runTestCases.mjs`, <1 s.
    Every difference sorted into a named family in its `KNOWN` table (OPEN / DELIBERATE /
    SAME ADVICE / NOT COMPARABLE). **Improvement over PneumoVax's version:** it also saves
    every patient's answer (`cdc-files/meningo-app-answers.json`) and lists any that MOVE —
    a break on purpose showed a known patient's date could move unseen.
  - Result: **65 of 104 agree fully; 39 differ** → 23 OPEN (11 of them same date, label only),
    8 DELIBERATE, 3 SAME ADVICE, 5 NOT COMPARABLE. 0 NEW, 0 moved.
  - Proven by 3 breaks of the app on purpose (each caught; source restored, `git diff src`
    empty). Two worked patients seen on screen (2013-0500, 2020-UC-0004).
  - Report: `MeningoVax-main/docs/archive/report-2026-11-15-cdsi-test-patients.md`
    (15 families, one worked patient each, CDSI 4.65 rule values quoted).
  - `CLAUDE.md` status, `MAP.md`, `scripts/cdsi/README.md`, the port pointer updated.
- **Side finding (not a CDC difference):** the pentavalent card says "Both … are due today"
  while the MenB card still says "Answers needed" — 2,909 of 35,281 saved/typical patients
  (1,816 grid / 1,093 typical). Listed in the 1.5 report.

## What's NOT done

- **STOP B — owner** (Phase 1 is now built). She sees both reports: 1.4's
  `report-2026-11-15-whole-app-checks.md` and 1.5's. **Ask, don't default**, one question per
  box, in the memory format `clinical-questions-issue-sources-recommendation-examples`
  (short: one patient, what the app says, what the source says, my answer):
  - from 1.4: A (college/military under 16), B (outbreak top-up; "Complete" beside
    "Booster due at 16y" — 1.5 adds 13 CDC patients, 11 same date), E (grace vs schedule).
  - new from 1.5: **family 5** (MenACWY at 10 years minus 1–4 days: count it, or a dose at 11
    as CDSI does? — 2013-0500), **family 12** (military recruit: keep "Complete, check the
    service", or book the 5-year booster? — 2025-UC-0019), **side finding** (should the
    pentavalent card wait for dose answers?).
  - Families 6, 7, 9, 10 → packet 1 Q2; family 8 → packet 1 Q1 (Ruling D). Not for STOP B.
- **End of Phase 1**: measure usage (`get_usage`) and correct the plan's estimate table.
- **Make 1.5 a required test** (fails on a NEW disagreement or a moved answer) — after STOP B,
  as for PneumoVax's P-CDSI-2.
- **PneumoVax follow-up:** port the "answers moved" check into PneumoVax's
  `scripts/cdsi/runTestCases.mjs` (same hole there). Not started.
- Not started: Phases 2–9; Phase 0 findings N2–N4, N6–N12 wait for their phases.

## Why this is a good stopping point

Phase 1 (1.1–1.5) is fully built; every item is merged or in one open PR. 1.5 changed no app
code. What comes next is STOP B, the owner's decision, so no code work should start before it.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 84 --json state,mergedAt`.
   If merged: `git checkout main && git pull --ff-only`. Run the suite: expect **1,692 passed**.
2. Re-run `npx vite-node scripts/cdsi/runTestCases.mjs`: expect "NEW disagreements: 0" and
   "answers moved since saved: 0".
3. STOP B with the owner (above). Ask, don't default. Record her answers in the plan.
4. Then Phase 2 per the plan (rule table, 0 answers may move; 2.3 is the CDSI rule comparison
   — the CDSI 4.65 XML values printed in the 1.5 report are a head start).
5. MeningoVax `main` is unprotected but the plan says branch + PR; PneumoVax is
   branch → PR → squash. The owner merges both. This handoff rides on PneumoVax PR #154.
