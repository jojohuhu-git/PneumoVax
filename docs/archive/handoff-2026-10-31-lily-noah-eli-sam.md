# PneumoVax — Handoff after Lily, Noah, Eli/Rosa and Sam (2026-10-31)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-31-lily-noah-eli-sam`, off `main` at `abb9782` (PR #99 merged). Pushed
with this handoff; PR opened for **her squash-merge** (sessions cannot merge in auto mode).
Baseline was **1,754** passing; now **1,785 passing (161 files), 0 failing**, run on this
tree. Item commits: `d861eb0`, `39f8ff6`, `476803a`, `5221be6`; this handoff follows them.

Measured against untouched `main` (`node scripts/proseDiff.mjs`): **85 of 35,280** rendered
lines changed, all real patients, every one the Noah item's new "at 19" line. **0 / 17,016**
verdicts and **0 / 18,264** record-problem rows moved. 0 uncredited source pairs.

---

## What's done (each put to her with a patient, inside the question box)

1. **Lily — `d861eb0` — §C-P2-THIRD.** An immunocompromised child's ON-TIME third PPSV23 is an
   extra dose (*"Extra dose"*). Knock-on, in the question she answered: at 19 the adult rows
   count all three, so ACIP's two-dose row now reads "two OR MORE" (same dose; a judgement).
   The adult card asks `mmwrBothPcv13PpsvKey()` instead of re-testing the count.
2. **Noah — `39f8ff6` — §B-AT19.** *"Yes, add the line"* for IC "complete" cards. Running
   hand-built children forward showed C13's line (a second reading of the adult rules)
   disagreeing with the adult card on **578** of them (PCV15 series, early-second cochlear,
   and the "before age 6 + PPSV23" card C13 missed). `recommend()` now runs the same patient
   forward to 19 and `atNineteen()` prints her sentence for the row that card cites, or
   nothing; `withAtNineteen()` adds it in one place. Grid: her 540 unchanged, +85 on the
   missed card, 60 PCV15 copies correctly get none.
3. **Eli and Rosa — `476803a` — §K-PPSV23THENPCV.** Three answers in one day: Eli *"8 weeks
   after any PPSV23"*; then Rosa (PPSV23 by mistake at 12 months) *"should count … applies
   when the repeat dose is the same as the invalid dose"*; then Eli again, dose by dose,
   *"Count it"*. **A thrown-out PPSV23 holds off nothing; ANCHOR-1 stands.** The question
   found a real bug: Ben's extra-dose hold reached the dose check, not the card (a child was
   told "due today", then had the dose thrown out). One function now,
   `lastPpsv23HoldingAConjugate()`; cards read `ppsv.holdDate`.
4. **Sam — `5221be6` — §C-P2-GREY.** Repeat of a too-young first PPSV23 stays thrown out (8
   weeks); card and chip carry her drafted grey-area note citing two CDC Timing and Spacing
   sentences (read live today); *"PCV20 only"*, no Option B (his third PPSV23 shot).

## What's NOT done

### Owner questions: ask with a patient, inside the question box, and don't default
1. **Sam's non-IC twin** (cochlear implant, same two too-young/5-week PPSV23s): keeps Option
   A PCV20 / Option B PPSV23 and no grey-area note. If the repeat counted she'd already be
   complete, so Sam's note's last sentence would be untrue for her. Not ruled.
2. **Sam-like children on two other cards**: still owed catch-up conjugates, or the 6-18
   no-prior-PCV trio (Option A PCV20 / B-1 PCV15 / B-2 PPSV23, B-2 a third PPSV23 shot). Not ruled.
3. **Noah's 6-week repeat** (first PPSV23 thrown out for SPACING, repeat 6 weeks later, also
   thrown out): his card still offers PCV20 or PPSV23, a third shot. Not a grey area (Ruling
   D is clear), but the "third shot" question is Sam's. Not ruled.
4. **A healthy toddler's too-young PPSV23** says "repeat this dose only", although a healthy
   child is not owed PPSV23 at all. Seen on Rosa (healthy). Not investigated.
5. Carried over: **the adult card at 19 for a three-PPSV23 adult** now uses ACIP's two-dose
   row; this is my judgement inside the Lily answer, listed in the PR for her audit.

### Queue (carried over, unchanged)
- **P4**: the supplemental PCV20 at 24–51 days. Offer "count it and document", but withhold it
  for immunocompromised and asplenic children.
- **"Also state the minimum"**: every card advising a date also states the true earliest
  date. Largest remaining item. Not started.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about the design.
- **Do not re-raise:** the eleven new references; `mmwr7203a1` on cards.

## Why this is a good stopping point
Each ruling is one commit, checked on every surface it touches (chip, card, "Why this", "How
this was worked out", rulebook) and driven in the app. Both corpora and the prose diff are
explained. Nothing in the queue depends on this PR.

## Resuming
1. If the PR is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. `npm test`, then confirm **1,785 passing (161 files)** before any new work.
3. Ask the owner questions above first, one patient each, the whole scenario in the box. She
   may answer with a question or a counter-example: rebuild the patient and re-ask, and check
   whether her reason reaches a ruling made earlier the same day (Rosa reversed Eli).
4. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break each clause separately (`python3` exact replace with
   `assert count == 1`, restore from a scratchpad copy, `cmp`) → drive the app → commit.
5. ⚠ **Measure against untouched `main` and group by family before trusting a change.** The
   Eli build looked like "0 grid patients" from the dose check alone; the card side moved 88,
   all a family she had not seen. `git worktree add <scratch>/pv-main main`, symlink
   `node_modules`, run `node scripts/proseDiff.mjs dump/diff` (plain `node`).
6. ⚠ **Tooling traps found today**: zsh does not split `$T`, so `vitest run $T` with several
   files runs nothing (use an array, `"${T[@]}"`); the terminal wrapper can swallow vitest's
   count line, so use `./node_modules/.bin/vitest run --reporter=json --outputFile=…`.
7. Dev server: `preview_start` "PneumoVax dev server" (port 5173 today). Dose fields use
   `useId` ids: set values with the native setter and `requestSubmit()`; rec cards start
   collapsed (`aria-expanded="false"`).
8. Branch → PR → her squash-merge. Never push to `main`.
