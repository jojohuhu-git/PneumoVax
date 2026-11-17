> **SUPERSEDED 2026-11-17** by `handoff-2026-11-17-meningovax-phase3-built.md`. Families 2–5
> and STOP B are built; do not resume from this file.

# MeningoVax port — Handoff after Phase 3 family 1, Ruling D (2026-11-16)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-stop-c-answered.md` (banner added).

## Branches and PRs

| Repo | Branch | Commit | State | Suite |
|---|---|---|---|---|
| MeningoVax | `main` | `f2bf9ed` | #89 (STOP C) **merged** | — |
| MeningoVax | `feature/2026-11-15-port-3-ruling-d` (pushed) | `0777a62` | **PR #90**, waiting for the owner (squash) | **1,848 passed, 146 files** (verified 2026-11-16, before the last docs-only commit); build OK |
| PneumoVax | `docs/2026-11-16-meningovax-ruling-d-handoff` | this file + plan status | PR to open (docs only) | not run (docs only) |

PneumoVax's own checkout was left alone: it sits on `feat/2026-11-15-undated-pcv-not-counted` with
**uncommitted edits** (`CLINICAL_SPEC.md`, `docs/agent/clinical-rules.md`,
`src/components/doseChipLabel.js`) not made by this session. This handoff was written in a separate
worktree off `origin/main`.

## What's done — Phase 3 family 1 (MeningoVax PR #90)

Ruling D: when a dose does not count, the next dose is timed from THAT dose (CDC Timing and
Spacing, read live 2026-11-16: *"The repeat dose should be spaced after the invalid dose by the
recommended minimum interval"*; the same paragraph says it covers minimum interval **or age**).
Dose numbers and totals stay on the doses that counted. Owner answers applied:
- **C2** clock from the dose given (validator, card, chip). **C9** early booster: repeat 5/3 (MenB
  1/2) years after it. **C12** healthy MenB dose 2 under 4 weeks does not count
  (`MENB-HEALTHY-DOSE-2-GAP`). **E1** too-young first dose: 4 weeks after it (deliberate difference
  from CDC, matches PneumoVax). **E2** wrong-family MenB: next dose ≥4 weeks after it
  (`MENB-REPEAT-GAP`, `applyRepeatFloor`). E1/E2 now recorded in the STOP C packet.
- Moved and explained: saved answers **538 of 17,580** (0 of 5,820 impossible); prose **542**
  (the 538 + 4 whose label now measures from the dose given); CDC test patients **3**
  (2024-0036, 2025-0014 now agree with CDSI; 2024-0081 a deliberate E2 difference). The table
  of the 538 is in the PR #90 body.
- Docs: `clinical-rules.md` (new Ruling D section), `meningococcal-rules-summary.md` §4 rewritten,
  `testing.md` counts, MeningoVax `CLAUDE.md` status.
- Commits: `c0ec1ff` (the earlier WIP build), `96bcdeb` (finish), `0777a62` (status line).
- Hepatitis B example on CDC's page (repeat "after the 2nd valid dose") treated as a hep-B-only
  exception, as PneumoVax did (`handoff-2026-10-23-c10-2-routine-date-vs-minimum.md`).

## What's NOT done

- **Owner merges MeningoVax PR #90** and this PneumoVax docs PR.
- **Ask the owner (open, not decided):** CDC test patient 2013-0489 — MenQuadfi 5 days before the
  16th birthday is *set aside* (valid, not counted), so Ruling D starts no clock and the booster is
  due 5 days later; CDSI calls it too young and waits 8 weeks. Should a set-aside dose start the
  clock? Listed OPEN in `scripts/cdsi/cdsiCore.mjs`.
- **Ask the owner:** E2's other option, a card choice to switch to the other MenB family's product
  (ACIP 2020 "one product should be selected"). Not built; her exact words were not saved.
- **Wording (Phase 4/6):** the card shows the moved date ("eligible Dec 17, 2026") but never says
  it is N weeks after the dose that did not count; PneumoVax names it on card and chip
  (`regression-2026-10-25-card-and-chip-name-one-date`).
- **E4 Q2 gap:** the two new rows widened no sweep (`sweep-never-events`, `sweep-dose-counter`);
  covered only by the rule-table hand patient and saved answers.
- **Phase 3 families 2–5, not started** (from the STOP C handoff): (2) undated, C1 (+ C17 removed);
  (3) MenB dose 3: C5, C6, C7 — and reword CLAUDE.md's "MenB D3 — Both Floors"; (4) MenACWY gaps:
  C10, C11, C13; (5) relabels: C8, C9 floors, CDSI map statuses → owner for C3, C4, C14, C15.
  STOP B's five answers are also Phase 3 work.
- Still open from before: the `fmtMinAge()` days-vs-months wording bug (fix queue); PneumoVax PCV
  undated-dose question (C1 follow-up); Phases 4–9.

## Why this is a good stopping point

Family 1 is one complete PR: built, every moved answer explained, docs in the same PR, suite
green, checked live. Families 2–5 are independent of it except that they now build on Ruling D's
clock — so merge #90 before starting them.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 90 --json state`. If merged:
   `git checkout main && git pull --ff-only`. `npm test`: expect **1,848 passed, 146 files**.
2. `preview_start` "MeningoVax dev server".
3. Put the two open questions above to the owner (packet format: issue, sources quoted, a
   recommendation, worked patients + control). Ask, don't default.
4. Next family: before each, `verify-clinical-source` live, a failing test, measure and explain
   every moved answer (`npm run sweep:update`, `npm run prose -- dump/diff`,
   `npx vite-node scripts/cdsi/runTestCases.mjs --save-answers`), docs in the same commit.
5. MeningoVax: branch + PR, owner merges. PneumoVax: branch → PR → squash (owner merges).
