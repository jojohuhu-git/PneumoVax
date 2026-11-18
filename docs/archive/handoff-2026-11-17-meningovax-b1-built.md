> **SUPERSEDED 2026-11-17.** Phase 4 was built after this (MeningoVax PR #100). The port plan and its
> handoffs moved to MeningoVax (owner decision): read
> `~/Downloads/MeningoVax-main/docs/archive/handoff-2026-11-17-meningovax-phase4-built.md`.
> Do not resume from this file.

# MeningoVax port — Handoff after B-1 was built (2026-11-17, latest)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`) and is
iCloud-synced: commit early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-17-meningovax-d10-built.md` (banner added).

## State (verified 2026-11-17)

- MeningoVax **#98 merged** (`main` at `e8cc183`; baseline confirmed **1,976 passed, 157 files**).
- MeningoVax branch `feature/2026-11-17-b1-grace-only-when-it-helps`, two commits off `main`
  (`8bb4525`, `07b0ee8`). **Pushed; PR #99 open against `main`, waiting for the owner** (owner
  merges). Now **1,996 passed, 0 failing (158 files)**, working tree clean. MeningoVax has no CI
  checks.
- PneumoVax: this file + the plan status on branch `docs/2026-11-17-meningovax-b1-built` (PR to
  owner). PneumoVax's own checkout sits on `chore/2026-11-17-remove-dead-undated-code`, 2 behind its
  remote; it was not touched.

## What's done — B-1 (STOP B), Phase 3 is now complete

The 4-day grace at a MenACWY age line that picks the schedule, **only when it means fewer doses
owed** (PneumoVax §A-GRACE12-HELPS carried over). `recommend()` reads the history twice (window
doses at real age / on the birthday) and keeps the reading owing fewer MenACWY doses; a tie keeps
the real age. Lines: **3 months, 7 months, 2 years, 16 years** (`menacwyGraceLine`,
`MENACWY_GRACE_LINES_M` in `intervals.js`). The "on the birthday" reading also treats the patient as
having reached that birthday from the dose day on (`menacwyAgeFloorMonths`, MenACWY only; MenB and
pentavalent keep the real age). Details, sources and measurements: PR #99 body;
`docs/agent/clinical-rules.md` "B-1" section.

Owner answers this session (MeningoVax `docs/archive/decisions-2026-11-17-open-questions.md`):
- **D11** age 7: no grace; a primary finished 1–4 days before 7 keeps the 3-year booster.
- **D12** 3 months: yes, grace helps.
- **D13** 16 years: "Complete" on the dose day (CDC 2013-0488, 2013-0511 now agree; removed from
  `scripts/cdsi/cdsiCore.mjs` OPEN list).

Measured vs untouched `main`: saved answers 0 of 5,820; prose 0 of 24,600; CDSI 2 moved (both now
agree; OPEN 6 → 4); whole-app check 6 grace faults 7 → 1 (the one left is D11, deliberate), checks
3/5/7 unchanged; hand-built sweep 2,940 of 92,736 moved, 0 owe more, 0 lost Complete, 0 MenB or
pentavalent changes. Live-checked: 7-month travel baby and the 16-year teen.

## What's NOT done

**Owner action first:** merge MeningoVax **#99** and this PneumoVax docs PR.

**Open from #99 (say so, don't decide):**
- The chips are also handed the dose-day age (so card and chips read one age); breaking that
  changed no patient anywhere. Kept for consistency; nothing proves it matters.
- The 92,736-patient window sweep was a one-off (scratch script, not in the repo). Owner may want
  window patients as a permanent sweep (E4 Q2).
- Wording: the record line prints the real age ("age 15 years 11 months") beside a card that reads
  the dose as given at 16 ("A MenACWY dose at age 16 or older completes…"); same at 7 months.
  A "counted as given at 16 (4-day grace)" phrase belongs in Phase 4/6.

**Still-open owner questions (ask, don't default; packet format):** MenB of unknown product at
16+ (CDC 2024-0069); healthy MenB rescue dose 3 vs 6 months from dose 1 (2024-0034/0035); the
1-day calendar difference (2024-0040, shared with PneumoVax).

**Found earlier, not changed (Phase 4 wording, from the D10 handoff):** outbreak first-booster
note misdescribes a 2nd+ asplenia booster; set-aside chip "Off-window - repeat" beside "does not
count"; "Up to date" for an infant with no counted dose; two identical "ACIP 2020 MMWR" chips on the
young-child outbreak card; check 5 "chip says repeat, no card asks" 8,656 grid / 244 typical.

**Next: Phase 4 — one label per dose.** Per the plan, **STOP E1 before building**: ask Q5–Q8
(Q5 "Not counted — do not repeat" vs "— repeat"; Q6 label for MenACWY before 10 / healthy MenB
before 16; Q7 keep "Booster"; Q8 "Extra" = the card that day did not ask for it), each with a
patient and the PneumoVax equivalent.

## Why this is a good stopping point

B-1 closes Phase 3: every STOP B and STOP C answer is now built. #99 is one PR with its docs,
measured, and checked live. Phase 4 starts with owner questions, so nothing can be built until she
answers.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 99 --json state`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` → expect **1,996 passed, 158 files**.
   If NOT merged, ask the owner; do not build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Phase 4: draft Q5–Q8 as a packet (issue, sources quoted live, recommendation, worked patient +
   control; memory `clinical-questions-issue-sources-recommendation-examples`). Ask, don't default.
4. Each item: `verify-clinical-source` where a rule moves, failing test, change, then measure:
   `npm run sweep:update`; `npm run prose -- dump/diff` against `main`;
   `npx vite-node scripts/cdsi/runTestCases.mjs --save-answers`;
   `npm run whole-app -- --checks 3,5,6,7 --out x.json` on a `main` worktree and the branch.
   Docs in the same commit.
5. MeningoVax: branch + PR against `main`, owner merges. PneumoVax: branch → PR → squash (owner).
