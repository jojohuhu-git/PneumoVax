# MeningoVax port — Handoff at the Phase 1 midpoint (1.1–1.3 done) (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-phase0-done.md` (banner added). Everything it
waited on has merged: MeningoVax #76, #77, #79 and PneumoVax #153.

## First: N5 was stranded, and is now on `main`

#78 (N5, the 16-year booster waits 8 weeks) was opened against #77's branch, so merging it only
updated that branch. #77 was squash-merged into `main` 9 seconds earlier, which left N5 off `main`
and off the live site. Re-landed as **MeningoVax #79** (`e02c12c`, merged 2026-11-16 00:45 UTC,
CI green): the same commit replayed onto `main`, with app code identical to #78's result. Checked on screen:
born 10/25/2010, MenQuadfi 9/30/2026 → "Next dose not yet due - eligible Nov 25, 2026".
**Lesson: never open a PR against another PR's branch.** Build stacked work locally and open each
PR against `main` only after the one below it has merged.

## Branches and PRs (MeningoVax)

| Item | Branch | Commit | State |
|---|---|---|---|
| 1.1 | `feature/2026-11-15-phase1-1-saved-answers` | `a83dd37` | **PR #80**, against `main`, CI green, waiting for the owner |
| 1.2 | `feature/2026-11-15-phase1-2-prose-diff` | `e0f102d` | **local only, not pushed**, built on 1.1 |
| 1.3 | `feature/2026-11-15-phase1-3-typical-patients` | `c4e1f3d` | **local only, not pushed**, built on 1.2 |

Tests, run 2026-11-15 (vitest JSON reporter, `.claude/**` excluded):
- `main` (`e02c12c`): 1,656 passing (138 files)
- 1.1 branch: **1,670 passing, 0 failed (139 files)**
- 1.2 branch: **1,675 passing, 0 failed (140 files)**; production build OK
- 1.3 branch: **1,682 passing, 0 failed, 0 skipped (141 files)**, working tree clean

## What's done

- **1.1 Saved answers** (E1). `src/test-grid.js` "THE SAVED ANSWERS": 17,580 real patients and
  5,820 impossible entries. One prose-free answer line each, in `src/logic/__tests__/__saved__/`.
  `sweep-saved-answers.test.js` fails when any line moves; `npm run sweep:update` rewrites the
  files and prints the moved count. Histories are paired by what can change an answer. The full cross
  (35,925 patients, 10 MB) found no extra MenACWY or pentavalent answers. Its only extra MenB answers
  were 112 under-10s with all MenB doses rejected as too young. Broken on purpose 6 ways: N5 gap
  8→4 weeks moved 123; grace 4→3 days moved 492; a wording-only change stayed green, as designed.
  **Known gap:** the "a dose that did not count, then one that did" coverage check stays green if
  only the Ruling-D history is removed (other histories share the pattern).
- **1.2 Prose diff** (E2). `scripts/proseDiff.mjs`, `npm run prose -- dump|diff`. Draws the real
  results screen (`Results.jsx`, via `vite-node`) for all 23,400 saved patients in about 10 s. It keeps
  every word on screen and the hover text. Every "Why this" and collapsed card is drawn open through
  `src/components/openAllDisclosures.js`, which is off unless the tool turns it on. Checked
  live: cards start collapsed, "Why this" starts closed, and both open on click. Changing "Next dose
  not yet due" changed the wording for 4,566 patients; changing a sentence that only appears behind
  "Why this" changed 33. The smoke test `prose-diff-tool.test.js` catches all 4 tool breaks (the
  "switch left on in the app" break was missed at first and the test was fixed). Dumps are about
  80 MB: keep them in a scratch folder.
- **1.3 Typical patients** (E4). `buildTypicalCases()`: about 14,100 ordinary records (MenACWY at
  11 and 16, catch-up, the infant high-risk series, healthy and high-risk MenB, both pentavalents).
  A patient the app asks a risk-at-dose question about also appears answered "yes" (key `ty…`),
  an assumption stated in the code. In neither saved-answer file. `typical-patients.test.js` checks
  the list only.

## What's NOT done

**Phase 1 remaining** (plan §Phase 1):
- **1.4 Whole-app checks** (E3), on the saved and typical patients: advice is accepted; the plan
  holds; complete means complete; options agree (pentavalent vs two shots); card and chip agree;
  age lines clean (10, 11, 16, 19, 22, 24 years; 2, 7, 12, 24 months); stable over time. **Findings
  listed, not fixed.** Port the idea from PneumoVax `scripts/wholeApp/` and its `whole-app-*-gate`
  tests (PRs #119, #130, #131, #133), but read MeningoVax's engine first. Phase 0 report N9 (361
  grid cases where the card asks for a dose the validator sets aside) belongs to check 1.
- **1.5 CDC's CDSI test patients**: copy PneumoVax `scripts/cdsi/extractTestCases.py` and
  `runTestCases.mjs`; MeningoVax's files are in `scripts/cdsi/cdc-files/`. See
  `plan-2026-11-08-cdsi-checks-both-apps.md`.
- Then **STOP B**: the owner sees the counts per check, grouped by clinical family with one worked
  patient each. Write a handoff.

**Found this session, listed for 1.4, not changed:** a pentavalent and a MenB dose on the same day
are read as one shot typed twice (rule G7, `duplicateEntryProblem`, any brands). Those two shapes
are in the impossible-entry file on purpose (`SAVED_ANSWER_CROSS_DUPLICATES`).

**Still open from the last handoff (ask, don't default):** the monthly scheduled task
`monthly-vaccine-source-check` still runs `scripts/cdsiCompare.mjs`, which moved to
`scripts/cdsi/cdsiCompare.mjs`; it will skip silently on Dec 1. Not asked this session.

**Not started:** Phases 2–9. Findings N2–N4 and N6–N12 (Phase 0 report) wait for their phases.

## Why this is a good stopping point

1.1–1.3 are each complete and checked. 1.4 is the largest item in Phase 1 (a whole-app audit),
and 1.5 is self-contained. Neither has started, so nothing is half-built.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 80 --json state`.
2. **Land the stacked branches, one at a time, each against `main`:**
   - If #80 is still open: ask the owner to merge it. Don't push 1.2 against #80's branch.
   - Once #80 is merged: `git checkout -b feature/2026-11-15-phase1-2-prose-diff-onto-main origin/main`
     then `git cherry-pick e0f102d`, run the suite (expect 1,675 / 140), push, and open a PR against `main`.
     After that merges, do the same with `c4e1f3d` for 1.3 (expect 1,682 / 141).
   - `docs/agent/testing.md` and `MAP.md` are edited by all three commits. A cherry-pick conflict
     there is just counts and added sections: keep both.
3. Run the suite on the branch you start from and confirm the count above before new work.
4. Ask the monthly-task question above if the owner hasn't answered it.
5. 1.4, then 1.5, each its own PR against `main`, `fix-queue` loop: build the check, run it,
   **list** findings (counts plus one worked patient per clinical family), break each new check on
   purpose and quote what fails, full suite, commit. If a check changes what's on screen, check it in the
   running app (`MeningoVax dev server`, `.claude/launch.json`; port 5175, moves if busy).
6. At the end of Phase 1, measure usage with `get_usage` and correct the plan's estimate table.
7. MeningoVax `main` is unprotected, but the plan says branch + PR. PneumoVax is branch → PR → squash.
   The owner merges both.
