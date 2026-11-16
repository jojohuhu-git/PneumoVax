> **SUPERSEDED (2026-11-15)** by `handoff-2026-11-15-meningovax-phase1-midpoint.md`. Everything
> this file waited on has merged (MeningoVax #76, #77; N5 re-landed as #79 after #78 merged into
> #77's branch instead of `main`; PneumoVax #153). Do not resume from this file.

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

| MeningoVax | **#77** N1 fix | `fix/2026-11-15-n1-penmenvy-six-months` | `main` at `2f46974` |
| MeningoVax | **#78** N5 fix | `fix/2026-11-15-n5-16y-booster-8-weeks` | **#77's branch** (both edit the test-count table). Merge #78 first, then #77 |

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

**Owner rulings, 2026-11-15, and the fixes (done, in open PRs):**
- **N1 — yes:** Penmenvy is not offered again within 6 months of a Penmenvy dose (Penmenvy MMWR).
  PR #77; tests 1,636 → 1,642. The old test pinning "Penmenvy deliberately untouched" was
  removed with a note.
- **N5 — yes, "advise and count":** the 16-year booster waits 8 weeks after dose 1, and a
  booster given sooner (beyond the 4-day grace) does not count. Also the college, military
  and outbreak cards that ask for that booster. PR #78; tests → **1,656 passing, 0 failed
  (138 files)**. Its repeat is still measured from dose 1 (Ruling D undecided).
- **Fix now**, ahead of the port: both done before Phase 1, as she chose.
- **How she wants clinical questions** (memory `clinical-questions-issue-sources-recommendation-examples`):
  the issue, the sources with quotes, my recommended answer, full worked patients with a
  control, all of it **short**. A long box got *"These explanations are way too long for me to
  understand"*; the 5-sentence re-ask was answered at once.

## What's NOT done

**New findings, listed, not fixed** (report §"Things found that the plan did not list"):
- ~~N1~~ and ~~N5~~: ruled and fixed, see above (PRs #77, #78).
- **N2** High-risk MenB early dose 3: mm7349a3's "unless ≥6 months after dose 1" is not in the
  app. Following it would mean fewer doses, so AAP must be read first. → packet 1
- **N3** Healthy MenB dose 2 has no lower limit (7 days counts). → packet 1 (was R-4c)
- **N4** Travel, microbiologist and outbreak boosters have no gap check beyond 4 weeks. → packet 1
- N6–N12: wording, labels and colours, for Phases 1.4, 4, 5 and 6.

**Needs the owner (ask, don't default):**
1. Merge MeningoVax #76 and PneumoVax #153 (independent), and MeningoVax **#78 then #77**.
2. The monthly scheduled task `monthly-vaccine-source-check` still runs
   `scripts/cdsiCompare.mjs`, which moved to `scripts/cdsi/cdsiCompare.mjs`. The task skips it
   silently. First run Dec 1. Its "known result" line may also be out of date since #149–#152.

**Not started:** Phases 1–9. AAP (Red Book) not read; needed before N2 and the booster floors
go to the owner.

## Why this is a good stopping point

Phase 0 is complete as a unit and changed no app code. Phase 1 (the safety nets) is the next
self-contained block. It changes no clinical answer and needs nothing from the owner until
STOP B.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`. Once #76, #77 and #78
   are all merged, the suite should be **1,656 passing (138 files)**; with only #76, 1,636. If
   #77 was squash-merged before #78, move #78's one commit (`0363ae8`) onto `main` with a
   cherry-pick on a fresh branch (as #75 → #76 was done). Start Phase 1 on a fresh branch off
   `main`, never stacked on an open PR.
2. Read the report and the inventory before starting. The inventory is the row list Phase 2
   builds from. **Inventory row A6 and the report's N1/N5 lines describe the code before #77
   and #78.**
3. Ask decisions 1–2 above if they are still open.
4. Phase 1, one PR per numbered item, `fix-queue` loop: 1.1 saved-answer files from
   `src/test-grid.js`, 1.2 the prose diff, 1.3 typical patients, 1.4 the whole-app checks
   (findings listed, not fixed), 1.5 CDC's test patients (copy PneumoVax's
   `scripts/cdsi/extractTestCases.py` and `runTestCases.mjs`). Then STOP B, with a handoff.
5. The read-only measurement scripts from this session were in the session scratchpad and are
   gone. Phase 1.4 replaces them with committed checks.
6. MeningoVax `main` is unprotected but the plan says branch + PR; PneumoVax is branch → PR →
   squash merge. The owner merges both.
7. Dev server: `MeningoVax dev server` on port 5175 (`.claude/launch.json`).
