# MeningoVax port — Handoff after STOP C was answered (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-phase2-3-cdsi-rules.md` (banner added).

## Branches and PRs

| Repo | Branch | Commit | State | Suite |
|---|---|---|---|---|
| MeningoVax | `main` | `dca2c9f` | #88 (2.3) **merged** | 1,824 / 145 at session start (verified) |
| MeningoVax | `feature/2026-11-15-port-stop-c-live-reads` (pushed) | `403c974` | **PR #89**, waiting for the owner | **1,824 passed, 145 files** (verified after the last commit) |
| PneumoVax | `docs/2026-11-15-meningovax-stop-c-answered` | plan status + this handoff | PR to open (docs only) | not run (docs only) |

PneumoVax #154 merged. Dev server "MeningoVax dev server" ran on port 5177 this session.

## What's done

- **The three reads before STOP C** (MeningoVax `c07d1dd`), each read live in a real browser and
  quoted in `src/data/refs.js`: (a) undated records, ACIP General Best Practice, Timing and Spacing
  (`gbpWrittenDatedRecords`, `gbpRecordsNotFoundSusceptible`); the two undated rows now `differs`,
  moved from Q4 to Q2 in `dose-rules-table.test.js`; (b) pentavalents from 26 (three refs held in
  `citation-integrity.test.js` KNOWN_UNCITED until Phase 3 cites them); (c) mm7349a3's old-course
  sentence (`menbBexseroOldCourseStands`, cited on `MENB-HEALTHY-EARLY-DOSE-2`). New: it covers
  healthy patients too. 0 moved: prose 0 of 23,400; CDC test patients NEW 0 / moved 0.
- **STOP C answered** (MeningoVax `403c974`): `docs/archive/stop-c-packet-2026-11-15.md`, questions
  C1–C18 with patients, controls, sources, and the **answers table at its bottom: the source of truth
  for Phase 3**. C3 is a deliberate difference from ACIP (owner principle: updated guidance applies
  to earlier doses). C13's question wording had an error, corrected in the packet.
- Memories saved: `updated-guidance-applies-to-earlier-doses`, `meningovax-wording-should-match-pneumovax`;
  `clinical-questions-…` widened (one line per group; say why the app does the odd thing).

## What's NOT done

- **Owner merges MeningoVax PR #89** and this PneumoVax docs PR.
- **Phase 3, apply packet 1. Not started.** One PR per family; before each, re-read the source live
  (`verify-clinical-source`), add a failing test, measure and explain every moved answer, update
  `docs/agent/clinical-rules.md` + `meningococcal-rules-summary.md` in the same commit, and run
  `npm run sweep:update` with a reason. Suggested families: **(1)** Ruling D: C2 + C9's
  repeat timing + C12's repeat (validator, card, chip; rulebook §4); **(2)** undated: C1 (+ C17
  removed); **(3)** MenB dose 3: C5, C6, C7; **(4)** MenACWY gaps: C10, C11; C13; **(5)** relabels
  only: C8, C9 floors, and CDSI map statuses → owner for C3, C4, C14, C15. CLAUDE.md's "MenB D3 —
  Both Floors" rule needs rewording with (3): the forecast keeps both lines; a given dose 3 ≥4 months
  after dose 2 counts. STOP B's five answers are also Phase 3 work (plan, Phase 1 table).
- **PneumoVax follow-up asked by the owner (C1):** put the same undated-dose question to her for
  **PCV**, as a PneumoVax question with PneumoVax patients (PPSV23 stays counted: CDC's own exception).
  Not started.
- **Fix-queue item found this session (not fixed):** a product's minimum age is printed in days when
  it is stated in months: "below the minimum age of 120 days for Penbraya" (10 years), "2 days" for
  Menveo, "9 days" for Menactra. About 2,000 lines in the saved screens. Cause: `fmtMinAge()` in
  MeningoVax `src/logic/doseRules.js` treats every `{unit, value}` age as days; `brandMinAge()`
  (`src/data/brands.js`) returns `{unit:'months'}` for every product except MenQuadfi. The verdicts
  are right. Use the `fix-queue` skill.
- Still open from before: no saved grid patient has an undated dose; Phases 4–9; PneumoVax's
  "answers moved" check and P-CDSI-1.

## Why this is a good stopping point

STOP C is a complete owner stop: every question is answered and written down, and no code moved.
Phase 3 is building work that needs its own sessions, one family per PR.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 89 --json state`. If merged:
   `git checkout main && git pull --ff-only`. `npm test`: expect **1,824 passed, 145 files**.
2. `preview_start` "MeningoVax dev server".
3. Read the packet's answers table. Ask, don't default, on anything the answers do not cover
   (memory `consequences-of-a-decision-are-questions`).
4. MeningoVax: branch + PR, owner merges. PneumoVax: branch → PR → squash (owner merges).
