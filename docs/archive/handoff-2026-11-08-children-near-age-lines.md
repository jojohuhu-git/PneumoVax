> **DONE (banner added 2026-11-08).** PR #143 merged (`670e888`). Do not resume from this file.

# PneumoVax — Handoff after Audit 1's second half, children near an age line (2026-11-08)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page that gives pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch `audit/2026-11-08-children-near-age-lines`, off `main` at `711afb2` (#142). Pushed with a PR (see
`gh pr list`); **she merges** — `main` is protected and the safety check blocks `gh pr merge`.
Baseline was **2,446 passing**; still **2,446 passing, 0 failed, 219 files** (vitest JSON reporter,
`.claude/**` excluded). No app code changed.

## What's done

| Item | What changed | Commit |
|---|---|---|
| **Audit 1, second half** | Owner chose it 2026-11-08. 95 ordinary children a week to a month either side of 7 and 12 months, 2, 5, 6 and 19 years, plus the 6-week minimum age, each graded against CDC's notes and catch-up Table 2 read live today: **95 of 95 agree**. All 23 CDC quotes the app shows are on the live pages word for word. Proved by five deliberate breaks, each flagged (the 7-month one only after family `L2b` was added). Script `scripts/ageLineAudit/childLines.mjs`; report `docs/archive/report-2026-11-08-children-near-age-lines.md`; MAP.md line; Audit 1 marked DONE in `fix-2026-11-08-wording-vs-rulebook.md`. | `fc6c782` |

Four things looked wrong and are already ruled (the report lists them with their `CLINICAL_SPEC.md`
sections): the "not due until 12 months" card with no date, "PCV dose 5 of 5" after an early
booster, PPSV23 held to 5 years after a too-young PPSV23, and PCV20-or-PCV15-then-PPSV23 at 6+.

## What's NOT done

**Audit 2 (adults near a line) is DONE** — she said "Yes, mark it done" on 2026-11-08, on the queue
file's recommendation (2026-11-05 checks plus 0 adult Rulebook mismatches).

**Needs her (ask, don't default):**
- **Should `childLines.mjs` become a test?** It is a one-off script now, like `earlyDoseCheckChildren.mjs`.
  It found nothing, so there is no repeat escape arguing for a gate; offer it, don't do it unasked.

**Carried, still needing her — she asked (2026-10-31) not to have rare cases pushed at her, so raise only if
she asks:** today's card reading a future-dated PPSV23 (unreachable through the form); a baby with
smoking/alcohol selected whose "series complete" names no later age; **P2-PARK-1** (adult words name the
last dose, the date counts from the last that counted — a Ruling D scope question).

**Waiting by her ruling:** MeningoVax's "eligible" wording and Ruling D — wait until PneumoVax is done
(memory `meningovax-waits-until-pneumovax-done`).

**Parked earlier:** R4, Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed
history, P4, the "next dose from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

All three audits proposed on 2026-11-01 are finished (Audits 1, 2 and 3). Nothing is half-built; this branch only adds a script and documents.

## Resuming

1. Once the PR is merged (`gh pr view <N> --json state`): `cd /Users/joannehuang/Downloads/PneumoVax &&
   git checkout main && git pull`. Run the suite: expect **2,446 passing**.
2. Ask her what she wants next — there is no queued fix work.
3. Per item, if she gives one: reproduce, failing test, fix, full suite, break the fix (restore from a
   copy, not git), `node scripts/proseDiff.mjs` against a `git worktree` of `main`, whole-app checks on
   both sides, `node scripts/ageLineAudit/childLines.mjs "$PWD"` (expect 95 agree), running app,
   commit by ID.
4. Branch, PR, she merges. Never push to `main`. Check `gh pr view N --json state` before adding to a
   PR branch.
