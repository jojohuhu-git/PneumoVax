> **SUPERSEDED (2026-10-31, night)** by `handoff-2026-10-31-pcv20-before-6-and-early-ic-pcv20.md`. Its PR (#104) is merged and its queue moved on: "also state the minimum" is closed, and two new owner questions were added. Resume from the newer file.

# PneumoVax — Handoff after the adult PCV15 + two thrown-out PPSV23 ruling (2026-10-31, late night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-31-adult-pcv15-no-third-ppsv23`, off `main` at `d0d9461` (PR #103,
squash-merged). Pushed with this handoff; a PR is open for **her squash-merge** (sessions
cannot merge in auto mode). Baseline was **1,859** passing (168 files); now **1,869 passing
(169 files), 0 failing**, run on this tree. Item commit: `bf3f311`; this handoff follows.
0 uncredited source pairs over 17,311 cards (`scripts/uncreditedSources.mjs`).

---

## What's done

1. **Owner question 1 of the previous handoff — `bf3f311` — §C-P2-NOTHIRD for adults who
   already had a PCV15.** Ivy at 20, no spleen, PCV15 on 2026-09-20, PPSV23 at 13 and 20
   months (both thrown out). Her card ordered a third PPSV23. Owner ruling, quoting ACIP:
   *"For adults who have received PCV15 but have not completed their recommended pneumococcal
   vaccine series with PPSV23, 1 dose of PCV21 or PCV20 may be used if PPSV23 is not
   available."* Read live: footnote `*` in mm7401a1 and mm7336a3 (word for word), CDC Adult
   Notes "PPSV23 not available", job aid ¶, PneumoRecs footnote 1. **None gives a timing.**
   Asked with Ivy, she chose **"Use PPSV23's timing"** (an OWNER CLINICAL DETERMINATION).
   - The PCV15-then-PPSV23 card in `pcvAdult` registers a PPSV23-free version in
     `NO_THIRD_ALTERNATIVE` (renamed from `NO_PCV15_ALTERNATIVE`; the WeakMap now serves two
     adult cards). `noThirdPpsv23()` swaps it in when 2+ PPSV23 shots were given and none
     counted. Same status, interval and due date; vaccine becomes PCV20/PCV21; second chip
     reads *"It is not repeated."*
   - Two new refs: `mmwrPpsv23Unavailable` (mm7401a1 footnote *) and `adultPpsv23Unavailable`
     (CDC Adult Notes). Both added to the pinned multi-group list in
     `regression-2026-10-17-every-quote-names-its-patient.test.js`.
   - mm7401a1 goes back ON this card (its footnote is cited). Set via `citations:`, not
     `refs:` — `rec()` turns `refs` into `citations`, so a spread card's `refs` does nothing.
   - Guard: `regression-2026-10-31-adult-pcv15-no-third-ppsv23.test.js`. `CLINICAL_SPEC.md`
     §C-P2-NOTHIRD for adults who already had a PCV15.

Measured against untouched `main`: **0 / 17,016** verdicts, **0 / 18,264** record-problem rows,
**0 / 35,280** rendered lines (hand-built only — the grid has no adult with two childhood
PPSV23 shots). Seven mutations, each caught. Ivy checked in the running app.
Swept: only a PCV15 history reached the third-shot card; PCV13/20/21/7 already don't.

## What's NOT done

### Owner questions
- Carried over from PR #100, for her audit only: the adult card at 19 for a three-PPSV23
  adult uses ACIP's two-dose row.

### Queue (carried over, unchanged)
- **P4**: the supplemental PCV20 at 24–51 days. Offer "count it and document", but withhold
  for immunocompromised and asplenic children.
- **"Also state the minimum"**: every card advising a date also states the true earliest date.
  Largest remaining item. Not started.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about the design.
- **Do not re-raise:** the eleven new references; `mmwr7203a1` on cards; whether the 5-year
  PPSV23 interval applies to a repeat of a too-young dose; the timing of the PCV20/21 stand-in
  after a PCV15 (ruled today: the PPSV23's timing).

## Why this is a good stopping point
The one open owner question is answered, built, guarded, specced and checked in the app.
Nothing in the remaining queue depends on it.

## Resuming
1. If the PR is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. Run the suite and confirm **1,869 passing (169 files)** before any new work. Use
   `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`.
3. Ask her which queue item next — don't default.
4. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break each clause separately (python exact replace with
   `assert count == 1`, restore from a scratchpad copy, `cmp`) → drive the app → commit.
5. Measure against untouched `main`: `git worktree add <scratch>/pv-main origin/main`, symlink
   `node_modules`, `node scripts/proseDiff.mjs dump/diff`.
6. Dev server: `preview_start` "PneumoVax dev server" (came up on **5178** today; read the
   port from `preview_logs`). Set values with the native setter and `requestSubmit()`; open
   rec cards via `button[aria-expanded=false]`.
7. Branch → PR → her squash-merge. Never push to `main`.
