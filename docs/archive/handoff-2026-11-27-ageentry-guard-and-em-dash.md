# PneumoVax — Handoff after PNEUMO-AGEENTRY-GUARD and PNEUMO-EM-DASH (2026-11-27)

Repo `/Users/joannehuang/Downloads/PneumoVax` (client-side React app, pneumococcal decision
support; owner is a clinician, so plain English and a worked patient in every question).
Branch `feat/2026-11-27-ageentry-guard-and-em-dash`, off `main` `e62d320`. **Committed, NOT
pushed, no PR yet**; the owner decides when it goes up, and she squash-merges. PR body ready:
`docs/archive/pr-draft-2026-11-27-ageentry-guard-and-em-dash.md`.
Supersedes `handoff-2026-11-27-cdsi-checks-required.md` (its PRs #166, #167 are merged).

Tests: baseline on `main` 2,588 (2,587 passed; the known 2-second speed test failed under load
and passed 33 of 33 run alone). Now **2,596 of 2,596 passed, 237 files**
(`npx vitest run --exclude '.claude/**'`, JSON reporter).

## What's done

1. **PNEUMO-AGEENTRY-GUARD** (`51eefca`). `regression-2026-11-27-ageentry-mirrors-meningovax.test.js`
   compares PneumoVax's and MeningoVax's `ageEntry.js` with comments removed; skipped when the
   MeningoVax folder is absent. Mutation-checked (4 cases, table in the PR draft). CLAUDE.md
   section "ageEntry.js Is Mirror-Synced Too"; `docs/agent/testing.md` row; the
   `vaccine-parity` skill (outside the repo) now names both guards.
2. **PNEUMO-EM-DASH** (`eb743ae`). Owner answers 2026-11-27 (memory
   `pneumovax-em-dash-rulings-2026-11-27`): sentences like MeningoVax; card headers in brackets;
   dose labels keep their dash. Changed `recommend.js`, `validate.js`, `doseIntervalRules.js`
   (two dose-line reasons), `riskFactors.js` (two sublabels), `Disclaimer.jsx`; matchers in
   `rulebook.js` and `scripts/wholeApp/causes.mjs`. Prose diff: 21,125 of 35,280 lines, only
   punctuation, 0 moved between view and "Why this"; both answer records 0 moved. New guard
   `regression-2026-11-27-no-em-dash-in-sentences.test.jsx` (8 tests, mutation-checked).
   Live-checked on the dev server: healthy 10-year-old and 30-year-old with diabetes.

## What's NOT done

- **Push and open the PR** (owner's go-ahead). After merge, update MeningoVax's `CLAUDE.md`
  line "No test guards it yet; the guard belongs in PneumoVax" (section "ageEntry.js Matches
  PneumoVax's") to name the new test, and mark MeningoVax's
  `handoff-2026-11-27-meningovax-phase9-close.md` queue items PNEUMO-AGEENTRY-GUARD and
  PNEUMO-EM-DASH as done.
- Carried over, optional, not asked for: MeningoVax test-patient script as a required test;
  owner question from MeningoVax #155 (should the grey "CDC Child/Adolescent Notes" button
  open a section).
- Nothing else is queued in PneumoVax. The owner said she will propose new PneumoVax work.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout feat/2026-11-27-ageentry-guard-and-em-dash`;
   run `npx vitest run --exclude '.claude/**'` alone (never two at once): expect **2,596**.
2. Push and open the PR only with the owner's OK; body from the PR draft file.
3. Any new sentence with an em dash now fails the guard. Use a period, colon or comma; a
   header tail goes in brackets; never touch the dose labels or quotes.
