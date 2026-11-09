# PneumoVax / MeningoVax — Handoff after reviewing the MeningoVax port plan (2026-11-08)

Repos: `/Users/joannehuang/Downloads/PneumoVax` (this file, and the plan) and
`/Users/joannehuang/Downloads/MeningoVax-main` (untouched). Read each repo's `CLAUDE.md` first.

**Supersedes** `handoff-2026-11-08-r4-and-meningovax-plan.md` (banner added). Its PR #147
**merged** 2026-11-09 03:05 UTC (`e45bbdd` on `main`); its open PneumoVax items are carried
below so nothing is lost.

Branch `docs/2026-11-08-meningovax-port-plan-review`, off `main` at `e45bbdd`. **Committed and pushed with a PR at the owner's request (2026-11-08); she merges.** Before that it was not committed,
not pushed** — a planning session; she asked that nothing be worked on. Docs only: no app code
changed in either repo.

Tests, run 2026-11-08 with the vitest JSON reporter, `.claude/**` excluded:
- PneumoVax: **2,481 passing, 0 failed, 0 skipped (223 files)** — same as recorded before PR #147 merged
- MeningoVax (`main` at `c1118c1`, clean): **1,636 passing, 0 failed, 0 skipped (136 files)** — Phase 0's baseline.

## What's done

| Item | What | Where |
|---|---|---|
| Plan review | Ten findings (R-1 to R-10) from reading MeningoVax's `validate.js`, `intervals.js`, `doseChipLabel.js`, its rulebook and its rule-docs test, and CDC's CDSI v4.64 meningococcal files | plan §"Review of the draft" |
| Shared method | How every dose is decided in both apps: one row per rule with five answers; the floor / advice / app-rule ladder; the ten rules every patient gets, with MeningoVax's status | plan §"How every dose is decided" |
| Phases | The draft's 8 steps became 9 phases (0–9), each with numbered items, a STOP for her, and an estimate | plan §"The phases" |
| Estimate | **16–17 sessions, ≈ 80–90% of one week's Pro allowance, over 2–3 calendar weeks** | plan §"Totals" |
| Decisions | 13 owner questions (Q0–Q12) in the order they come up, each with the patient to ask it with | plan §"Decisions for the owner" |

The three findings that matter most:
- **R-2** MeningoVax's *validator*, not only its card, measures a dose from the last dose that
  counted, and its rulebook states that as a rule. ACIP says the repeat is spaced from the
  invalid dose. So Ruling D will move verdicts there. It waits for the safety nets.
- **R-3** CDC's CDSI writes a hard floor on almost every meningococcal gap, boosters included.
  This is the opposite of adult pneumococcal. So most MeningoVax floors are CDC-backed, and the
  port is mostly labelling who says so.
- **R-4** Three gaps where MeningoVax and CDSI differ. Candidates only, each needs a live read:
  the MenACWY "4 weeks between any two doses" floor; the high-risk MenB dose 3 "6 months from
  dose 1" floor (CDSI: 0 days); and the healthy MenB rows (not yet read).

## What's NOT done

**Needs her (MeningoVax):** Q0, approve the phase order. Nothing clinical is asked until STOP C.

**Not started:** all of Phases 0–9. Nothing in MeningoVax has been touched.

**Carried from the superseded handoff (PneumoVax; possible but rare, not to be raised unasked):**
P2-PARK-1; Leah's card with two invalid PPSV23; the unvaccinated-to-6 PCV15 row; the mixed
history; P4. **Small:** the 23 "Why this" paragraphs over 60 words. **Not checked:** whether the
adult branch of `adultRepeatAfterInvalidDose` / `adultRepeatDueDate` is unreachable since PR #90.

**Usage at the end of this session:** 78% of the week used, resets 2026-11-12. About 22% is left:
enough for Phase 0 and maybe Phase 1.1, not Phase 1 whole.

## Why this is a good stopping point

The plan is complete as a document and waits on one yes/no. Nothing is half-built. The first
phase that changes code (Phase 1) changes no clinical answer.

## Resuming

1. In PneumoVax: `git checkout docs/2026-11-08-meningovax-port-plan-review`. If she approved
   committing it, commit the plan, this handoff and the banner (use the `ship` skill), open a PR,
   and **she merges** (memory `cannot-merge-prs-in-auto-mode`).
2. Ask Q0 if she has not answered it. **Ask, don't default.**
3. On a yes: `cd ~/Downloads/MeningoVax-main`, read its `CLAUDE.md`, create a branch, and start
   **Phase 0** (plan §"Phase 0"). Phase 0 changes no code. Run the suite first and expect the
   MeningoVax count above.
4. Each later phase: the `fix-queue` loop; one PR per item; stop at every STOP in the plan with
   a handoff; never run `sweep:update`-style rewrites of the saved-answer files without
   explaining every moved patient.
5. MeningoVax is iCloud-synced: commit early, re-apply an edit that "disappears".
6. Dev servers: `PneumoVax dev server` (read the real port from `preview_logs`);
   `MeningoVax dev server` on 5175.
7. Re-measure usage with `get_usage` at the end of Phase 1, and correct the plan's estimate table.

## Added later the same session (CDSI checks)

- **Monthly source check is live**: scheduled task `monthly-vaccine-source-check` (1st of the month,
  09:00, read-only, both apps), state seeded in its `last-seen.json`. First run 2026-12-01.
- **PneumoVax vs CDSI 4.65, measured**: `scripts/cdsiCompare.mjs` (uncommitted) → AGREE 26, DIFFERENT 2,
  PARTLY 2 of 30. All four non-agreements are PneumoVax being stricter than CDSI on a child's
  PPSV23/PCV gap, each resting on CDC's wording or an owner ruling. Details and limits:
  `docs/archive/plan-2026-11-08-cdsi-checks-both-apps.md`.
- **Not started:** P-CDSI-1, P-CDSI-2 (PneumoVax); M-CDSI-1, M-CDSI-2 (now items 2.3 and 1.5 of the
  port plan). They need three files from CDC that the owner downloads (listed in that plan).

## Added by a second session, 2026-11-08 evening (organizing + CDC test patients)

The planning work above was committed and pushed by then as **PR #148**. This session's work was
then committed and pushed too, at the owner's request: PneumoVax `2c296cf` on the same branch (PR #148,
open), and MeningoVax `eb02c2a` as **MeningoVax PR #74** (open). **She merges both.**

**PneumoVax** (branch `docs/2026-11-08-meningovax-port-plan-review`):
- `scripts/cdsi/` — new home for the CDSI checks: `cdsiCompare.mjs` (moved from `scripts/`),
  `runTestCases.mjs` + `extractTestCases.py` (CDC's 140 pneumococcal test patients), `README.md`
  (how to re-run and update), `cdc-files/` (CDC's 4.65 XML and both test workbooks).
- `docs/archive/report-2026-11-08-cdsi-test-patients.md` — **117 of 140 agree; 23 differ, all
  explained; brands and age limits unchanged 4.64 → 4.65 (508 rows, 0 differences).**
  Five OPEN findings. Two are typical-patient bugs for the `fix-queue`: (1) a baby under 6 weeks
  with no doses is told "Due today: PCV dose 1 of 4" (confirmed on screen, 2-week-old); (2) the
  12-month booster card gives no date and its stated age is too early when the 8-week gap ends
  after the birthday. Three are owner questions: (3) per-dose minimum ages 10/14 weeks;
  (4) the 4-day grace at the 24-month line; (5, rare) a teen with HIV, two PPSV23 then PCV13.
- MAP.md, README.md, CLAUDE.md (source table) brought up to date; four stale handoffs bannered;
  four `.claude/prompts/` queues copied into `docs/archive/` with an "archived copy" banner.
- `plan-2026-11-08-cdsi-checks-both-apps.md` — status, paths, P-CDSI-2's findings half marked done.

**MeningoVax** (branch `docs/2026-11-08-organize-cdsi-files-and-port-pointer`, off `main` at `c1118c1`, PR #74):
- `scripts/cdsi/` — CDC's 4.65 MenACWY and MenB XML, the code list, both test workbooks, `README.md`.
  CDSI 4.65 moved MenQuadfi's minimum age to 6 weeks everywhere — CDC's software now agrees with
  the app's 2026-09-23 rule. No MenB change in 4.65.
- `docs/archive/plan-2026-11-08-meningovax-port--SEE-PNEUMOVAX.md` — the pointer (plan item 0.1, done early).
- CLAUDE.md: a "Current Work" pointer; two rules it was missing (transplant hard stop mirrored,
  dateUtils mirrored); vaxapp removed from it and from three `docs/agent/` files. MAP.md updated.
  Two finished handoffs bannered; nine `.claude/prompts/` queues copied into `docs/archive/`.

**Blocked:** the monthly scheduled task still runs `scripts/cdsiCompare.mjs` "if that file exists".
After this work merges, that path is gone and the task will skip it silently. Updating the task was
refused by the permission check; the owner decides (Dec 1 is the first run).

**Still needs her:** merging #148 and MeningoVax #74; Q0 (phase order); the scheduled-task path; whether to work findings 1 and 2.
