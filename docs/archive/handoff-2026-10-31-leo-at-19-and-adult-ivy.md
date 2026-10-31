# PneumoVax — Handoff after Leo at 19, the same-day "PCV15" chip, and Ivy grown up (2026-10-31, night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-31-adult-later-ppsv23-chip`, off `main` at `94530ea` (PR #102 merged).
Pushed with this handoff; **PR #103** (https://github.com/jojohuhu-git/PneumoVax/pull/103) is
open for **her squash-merge** (sessions cannot merge in auto mode).
Baseline was **1,841** passing (165 files); now **1,859 passing (168 files), 0 failing**, run
on this tree. Item commits: `25eddf9`, `6fb4244`, `e6c1399`; this handoff follows.
0 uncredited source pairs over 17,311 cards (`scripts/uncreditedSources.mjs`).

---

## What's done

1. **Same-day chip names the real PCV — `25eddf9`** (my call, not asked: dose unchanged,
   2026-10-18 rule; listed in the PR for her review). The child rule `CHILD-PPSV23-AFTER-PCV`
   said *"PCV15 and PPSV23 should not be given at the same visit"* for every product. It was
   shown 583 times on the grid and never next to a PCV15. Now it reads *"Given on the same day
   as a PCV13 dose — PPSV23 is given at least 8 weeks…"*. CDC's PCV15 clause is kept for a
   PCV15 only. `doseIntervalRules.js`; `CLINICAL_SPEC.md` §K item 2.
2. **Leo at 19 — `6fb4244` — §C-P2-LATER widened to adults.** Asked with a patient: *"Point to
   the later dose"* at every age. The children-only gate (`populationOf`) is removed from
   `withLaterShot` in `recommend.js`. Only a childhood dose can be thrown out here, so no age
   test is needed. 88 grid patients (all 19-year-olds), 0 verdicts. The 2026-10-25
   date-promise sweep is re-pinned: 2428→2350 withdrawn, 1839→1829 kept.
3. **Ivy grown up — `e6c1399` — §C-P2-NOTHIRD for adults.** Asked with a patient: *"Same as a
   child: PCV20/21 only"*. The adult no-history card (`pcvAdult`) registers a PCV15-free
   version in `NO_PCV15_ALTERNATIVE` (a WeakMap). `noThirdPpsv23()` uses it when 2+ PPSV23
   shots were given and none counted. The card gets PCV20/PCV21 only, with the PCV15 reason
   under "Why this". The 50+ eight-week option is dropped, the grey-area note is kept, and the
   second chip reads *"It is not repeated."* Hand-built only: 0 grid lines move.

Measured against untouched `main`: **0 / 17,016** verdicts and **0 / 18,264** record-problem
rows. **737 / 35,280** rendered lines changed, all explained: 88 from Leo's family, 495 real +
154 impossible from the same-day product name. Every new clause was broken separately; one gap
was found and closed (the grey-area citations were not asserted). Leo at 19 and Ivy at 20 were
checked in the running app.

## What's NOT done

### Owner questions: ask with a patient, inside the question box, and don't default
1. **An adult who already had a PCV15, plus two thrown-out baby PPSV23 shots.** Their card still
   says *"PPSV23 (≥1 year after PCV15) — completes the series"* (≥8 weeks at 19–49 with an
   immunocompromising condition, cochlear implant or CSF leak). That PPSV23 would be shot three.
   Hand-built sweep: every adult age and risk class with a PCV15 reaches it (19y, 25y, 50y, 65y;
   healthy only at 50+). Getting around it means a PCV20/PCV21 after the PCV15. **No document has
   been read that says so.** Use `verify-clinical-source` on mm7401a1 and CDC's Adult Notes
   first (case (a) of the 2026-10-18 rule), then ask with a patient. Sweep script pattern: a
   scratch `adultSweep.mjs` that runs `recommend()` over ages × risks × PCV histories, with
   PPSV23 at 13 and 20 months.
2. Carried over from PR #100, for her audit only: the adult card at 19 for a three-PPSV23
   adult uses ACIP's two-dose row.

### Queue (carried over, unchanged)
- **P4**: the supplemental PCV20 at 24–51 days. Offer "count it and document", but withhold
  for immunocompromised and asplenic children.
- **"Also state the minimum"**: every card advising a date also states the true earliest date.
  Largest remaining item. Not started.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about the design.
- **Do not re-raise:** the eleven new references; `mmwr7203a1` on cards; whether the 5-year
  PPSV23 interval applies to a repeat of a too-young dose.

## Why this is a good stopping point
Each ruling is its own commit, with a guard test, a `CLINICAL_SPEC.md` entry and a check in the
running app. Both corpora are unmoved, and every changed rendered line is explained by family.
The one gap left (question 1) needs a source read before it can be asked honestly.

## Resuming
1. If PR #103 is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. Run the suite and confirm **1,859 passing (168 files)** before any new work. Use
   `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`.
3. Owner question 1 first: read the source live, then one patient, the whole scenario in the box.
4. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break each clause separately (python exact replace with
   `assert count == 1`, restore from a scratchpad copy, `cmp`) → drive the app → commit.
5. ⚠ Measure against untouched `main`: `git worktree add <scratch>/pv-main main`, symlink
   `node_modules`, `node scripts/proseDiff.mjs dump/diff`; load both dumps and group every
   changed key by family (the diff prints only 8 samples).
6. Dev server: `preview_start` "PneumoVax dev server" (came up on **5177** today). Set values
   with the native setter and `requestSubmit()`; open rec cards via `button[aria-expanded=false]`.
   The app's "today" is the real date.
7. Branch → PR → her squash-merge. Never push to `main`.
