> **SUPERSEDED 2026-11-17** by `handoff-2026-11-17-meningovax-b1-built.md`. #98 merged; B-1 built
> (MeningoVax #99). Do not resume from this file.

# MeningoVax port — Handoff after D9/D10 were asked and D10 built (2026-11-17, later)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`) and is
iCloud-synced: commit early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-17-meningovax-d1-d8-built.md` (banner added).

## State (verified 2026-11-17)

- MeningoVax **#97 merged** (`main` at `41f2fee`; baseline confirmed 1,970 passing).
- MeningoVax branch `feature/2026-11-17-menb-outbreak-one-booster`, one commit `22df150` off
  `main`. **Pushed; PR #98 open against `main`, waiting for the owner** (owner merges). Now
  **1,976 passing, 0 failing (157 files)**, working tree clean.
- PneumoVax docs PR **#160** (D1–D8 handoff) still open; this file and the plan status were added
  to the same branch (`docs/2026-11-17-meningovax-d1-d8-built`), so #160 now carries both.

## What's done (owner IDs; record in MeningoVax `docs/archive/decisions-2026-11-17-open-questions.md`, "Asked later the same day")

1. **D9, the college "Complete" card: no code change.** Asked: keep "Complete", or "Covered for
   college until <date>" plus "if still in a residence hall then, give 1 dose"? Owner: *"I do
   not see a reference where a repeat dose is needed in 5 years if remaining in residence
   hall."* She was right; that line had no source. The 5-year check happens once, at college
   entry (the box is "First-year college student"). "Complete" stays. Rules summary clarified.
2. **D10, serogroup B outbreak gets one MenB booster** (`22df150`). Outbreak-only patients get
   one booster ≥1 year after the primary series. After it the card reads "Complete (outbreak
   booster given)". Asplenia, complement and microbiologist boosters stay every 2–3 years and
   win when also ticked. ACIP 2020 Table 8 (read live): *"Single dose if ≥1 yr after MenB
   primary series completion…"*. In `recommend.js` (`outbreakOnly`, `seriesBoosterLine`); the
   citation is `acip2020Table8MenbOutbreakBooster` in `refs.js`.
   - Saved answers: 80 of 18,780 moved, all outbreak-only. The grid gained one MenB history
     (primary + booster, +1,200 patients), measured on `main` first (0 moved).
   - Wording: 1,748 of 24,600 patients, all outbreak-only. CDC test patients: 0 moved.
   - Whole-app: check 3 984 → 2,187 (college + outbreak patients now reach the existing college
     5-year pattern). Check 5 4,197 → 4,753: a new group, "MenB: Complete (outbreak booster
     given)" beside an old "repeat" chip, which is the known Phase 4 family.
   - Never-events property 12 (157 rows; fails on `main`).
   - Checked live: card, dose chips, and the hover on the source number.
   - The 6-month public-health option is not offered.
   - Not read: immunize.org P2018 (the PDF can't be extracted here: no poppler or pypdf) and
     the AAP Red Book.

## What's NOT done

**Owner action first:** merge MeningoVax **#98** and PneumoVax **#160**.

**Phase 3, deferred: B-1** (STOP B, owner-decided, not built). It waited for #98 because both
rewrite `saved-answers.tsv` and `docs/agent/testing.md` counts. The 4-day grace at an age line
"only when it helps": 7 months (infant series 4→2 doses), the dose-2 ≥7-month shortcut, 2 years,
7 years, and 16 (CDC 2013-0488, 2013-0511, OPEN in `scripts/cdsi/cdsiCore.mjs`). D2 interacts at
16: a dose 1–4 days before 16 should count as the booster under B-1; today it gets a booster 8
weeks later.

**Still-open owner questions (ask, don't default; packet format):** MenB of unknown product at
16+ (CDC 2024-0069); healthy MenB rescue dose 3 vs 6 months from dose 1 (2024-0034/0035); the
1-day calendar difference (2024-0040, shared with PneumoVax). D1's Table 10 Boosters row
(*"Not routinely recommended…"*) is consistent with D1; confirm only if the owner raises it.

**Found, not changed (Phase 4 wording):**
- The outbreak first-booster note still opens "A MenB booster, 1 year after the primary series
  was completed". On a 2nd+ asplenia booster, that sentence misdescribes the dose.
- Set-aside chip "Off-window - repeat" beside "Safe… does not count".
- "Up to date" shows for an infant with no counted dose.
- Two identical "ACIP 2020 MMWR" chips on the young-child outbreak card.
- Check 5 "chip says repeat, no card asks" is now 4,753/182.

**Then:** Phase 4 (one label per dose; ask Q5–Q8 first), per the plan.

## Why this is a good stopping point

Both owner answers from this session are recorded. The one with code (D10) is built, measured,
checked live, and in one PR with its docs. B-1 is independent, but it should start from `main`
after #98 lands so the saved-answer files don't conflict.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 98 --json state`. If merged:
   `git checkout main && git pull --ff-only`, then `npm test`; expect **1,976 passed, 157
   files**. If NOT merged, ask the owner; do not build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. B-1: `verify-clinical-source` (CDC Timing and Spacing, 4-day grace at minimum age), failing
   test, change, then measure:
   - Widen the grid on a `main` worktree first, if needed.
   - `npm run sweep:update`; `npm run prose -- dump/diff` against `main`.
   - `npx vite-node scripts/cdsi/runTestCases.mjs --save-answers`.
   - `npm run whole-app -- --checks 3,5 --out x.json` on both, compared.
   - Docs in the same commit; one PR against `main`.
4. MeningoVax: branch + PR against `main`, owner merges. PneumoVax: branch → PR → squash.
