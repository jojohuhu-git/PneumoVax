# MeningoVax port — Handoff after Phase 0 (measure, change nothing) (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-08-meningovax-port-plan-review.md` (banner added). Every PR it
waited on has merged, MeningoVax #74 included (squash-merged 2026-11-15, `2f46974`).

## PRs (pushed at the owner's request, 2026-11-15; she merges)

| Repo | PR | Branch | Off |
|---|---|---|---|
| MeningoVax | **#76** | `docs/2026-11-15-phase-0-measured` | `main` at `2f46974` |
| PneumoVax | **#153** | `docs/2026-11-15-meningovax-phase0-done` | `main` at `6d58990` |

MeningoVax #75 (same commit, stacked on #74's branch) was closed and replaced by #76 once #74
was squash-merged. The two branches carry identical content (checked by tree hash), and #74's
squash was identical to its branch. The old branch `docs/2026-11-15-phase-0-measure` is still
on GitHub and can be deleted.

Tests, run 2026-11-15 after the edits (vitest JSON reporter, `.claude/**` excluded):
- MeningoVax: **1,636 passing, 0 failed, 0 skipped (136 files)**, the same as the baseline
- PneumoVax: **2,534 passing, 0 failed, 0 skipped (228 files)**

## What's done

| Item | What | Where |
|---|---|---|
| Q0 | Owner approved the phase order, 2026-11-15 ("Yes, start Phase 0"). STOP A is passed | plan status line |
| 0.1 | Pointer file (done earlier; its "latest handoff" line now points here) | MeningoVax #74 (merged) + #76 |
| 0.2 | Baseline confirmed: 1,636 / 136 | report |
| 0.3 | Every "to measure" cell in tables A–E and §3 filled, with file:line or a grid count | MeningoVax `docs/archive/report-2026-11-15-phase0-measured.md` |
| 0.4 | Every place a dose is judged: 14 not-counted rules, 6 set-aside rules, 2 count-early rules, 3 record problems, the extra cap. Each has its source quote and CDSI 4.65 row | MeningoVax `docs/archive/inventory-2026-11-15-every-place-a-dose-is-judged.md` |
| 0.5 | Read live in the built-in browser (cdc.gov refuses curl): CDC child and adult notes, ACIP 2020 RR-9, mm7349a3, mm7315a4, mm7501a2, CDC Timing and Spacing | report §"Sources read live" |
| Ledger | PneumoVax #148–#152 added to the plan's ledger (marked from titles; read in full before porting) | plan |

R-2, R-4a, R-4b, R-5b and R-8 were each confirmed with a worked patient (P1, P3, P4, P6, P7).

## What's NOT done

**New findings, listed, not fixed** (report §"Things found that the plan did not list"):
- **N1** Penmenvy is re-offered within 6 months of a Penmenvy dose. The Penmenvy MMWR
  (mm7501a2, Jan 8 2026) says to use separate vaccines then. The code's comment rests on the
  CDC notes page, which never names Penmenvy. → owner
- **N2** High-risk MenB early dose 3: mm7349a3's "unless ≥6 months after dose 1" is not in the
  app. Following it would mean fewer doses, so AAP must be read first. → packet 1
- **N3** Healthy MenB dose 2 has no lower limit (7 days counts). → packet 1 (was R-4c)
- **N4** Travel, microbiologist and outbreak boosters have no gap check beyond 4 weeks. → packet 1
- **N5** The 16-year booster card is due 5 weeks after dose 1; ACIP says 8 weeks. → packet 1
- N6–N12: wording, labels and colours, for Phases 1.4, 4, 5 and 6.

**Needs the owner (ask, don't default):**
1. Merge MeningoVax #76 and PneumoVax #153 (independent of each other).
2. Should N1 and/or N5 be fixed **now**, ahead of the port? The plan's default holds every
   clinical change for packet 1 (STOP C). Each card currently advises something a current CDC
   source advises against.
3. The monthly scheduled task `monthly-vaccine-source-check` still runs
   `scripts/cdsiCompare.mjs`, which moved to `scripts/cdsi/cdsiCompare.mjs`. The task skips it
   silently. First run Dec 1. Its "known result" line may also be out of date since #149–#152.

**Not started:** Phases 1–9. AAP (Red Book) not read; needed before N2 and the booster floors
go to the owner.

## Why this is a good stopping point

Phase 0 is complete as a unit and changed no app code. Phase 1 (the safety nets) is the next
self-contained block. It changes no clinical answer and needs nothing from the owner until
STOP B.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull` (once #76 is merged; until
   then `docs/2026-11-15-phase-0-measured`). Run the suite and confirm **1,636 passing**. Start
   Phase 1 on a fresh branch off `main`, never stacked on an open PR.
2. Read the report and the inventory before starting. The inventory is the row list Phase 2 builds from.
3. Ask decisions 1–3 above if they are still open.
4. Phase 1, one PR per numbered item, `fix-queue` loop: 1.1 saved-answer files from
   `src/test-grid.js`, 1.2 the prose diff, 1.3 typical patients, 1.4 the whole-app checks
   (findings listed, not fixed), 1.5 CDC's test patients (copy PneumoVax's
   `scripts/cdsi/extractTestCases.py` and `runTestCases.mjs`). Then STOP B, with a handoff.
5. The read-only measurement scripts from this session were in the session scratchpad and are
   gone. Phase 1.4 replaces them with committed checks.
6. MeningoVax `main` is unprotected but the plan says branch + PR; PneumoVax is branch → PR →
   squash merge. The owner merges both.
7. Dev server: `MeningoVax dev server` on port 5175 (`.claude/launch.json`).
