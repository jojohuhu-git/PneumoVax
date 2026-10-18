# PneumoVax — Handoff after the patient-population field (2026-10-17, late evening)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`
("PneumoVax dev server") — started cleanly this time on **port 5173**, path `/PneumoVax/`,
read from `preview_logs` rather than trusted from the tool's own report.

Branch: **`feature/2026-10-17-patient-population-field`**, off `main` at `f61d063`, pushed,
two commits. Suite **1,127 passing in 98 files**, all green.

**PR [#65](https://github.com/jojohuhu-git/PneumoVax/pull/65) is open and awaiting the owner's merge.** (This session could not merge:
the auto-mode classifier refuses `gh pr merge` — see the memory note. It is the permission
mode, not the repo.)

**Already merged earlier today: PR #64** (findings C, D, E) — `main` is at `f61d063`, Pages
deployed, and the live site was spot-checked, not just the deploy's green tick.

## What's done

### The patient-population field — the owner's stated fear, closed

> "a right-sounding quote written about a different patient"

Every QUOTED entry in `refs.js` now declares `population`: the patient group(s) **its
sentence is about**. `populationOf()` in `riskFactors.js` is the patient-side half (it calls
`pedsRiskRowClass` rather than re-deriving the IC test; both boundaries are
`ADULT_SCHED_MIN_M` / `ROUTINE_ADULT_MIN_M`, never a literal).
Guard: `regression-2026-10-17-every-quote-names-its-patient.test.js`, 20 tests.

**It records scope, not print location** (owner decision). Recording provenance instead
would have failed **4,639 correct showings** — see the test header for the three.

**Four cards fixed**, right advice quoting the wrong instance, with the patient's own
sentence a few lines away on the same page:

| card | showings | now quotes |
|---|---|---|
| 19–49 adult, PPSV23 only | 230 | `adultPpsvOnly1949` |
| immunocompromised 6–18y, no PCV | 198 | `pedsIc6to18NoPcv` |
| 19–49 adult, PCV13+PPSV23, IC/cochlear/CSF | 190 | `adultIc1949BothPcv13Ppsv` |
| immunocompromised child 2–5y | 24 | `pedsIcPcv20orPpsv23` |

The last is the clinical one: only the IC twin carries *"…at least 5 years after dose 1
PPSV23"*. No advice moved; both corpora 0 of 17,016 and 0 of 18,264.

**Four declared cross-references**, pinned by name so a fifth cannot appear quietly:
`adultRoutine50`, `adultBothNotAt65`, `cdcChildSpecialSituations`, `immPCV7`.

⚠ **The guard's one weak point, found by mutating it and now closed.** Widening a source's
`population` instead of fixing the call site makes a wrong quote legal and the sweep goes
**silent** — it failed only 2 specific assertions. The set of sources spanning more than one
group is therefore pinned by name too, and that mutation now fails 3. **Never widen a
`population` to quiet the guard.** A test cannot re-read cdc.gov, so a scope claim stays a
human judgement; the pin only makes changing one impossible by accident.

Mutation counts (each run, then restored from the scratchpad, never `git checkout`): revert
19–49 PPSV23 citation **3**; IC 6–18 **3**; IC 2–5 **1**; fake a cross-reference marker
**3**; delete one `population` **4**; widen a scope **3**.

Documented where the repo's rules say: `CLAUDE.md` (the short non-negotiable) and
`docs/agent/testing.md` (the guard's row with its measured counts).

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
reading log `docs/archive/c7-2026-10-17-source-readings.md`.

| Item | Scope |
|---|---|
| **C2/C3** | Branch `feature/2026-10-17-c2-c3-numbered-sources`, held and unpushed, 2 commits (`RecCard.jsx`, `citations.jsx`, `refs.js`, 420 lines of tests). It predates **three** merges into `refs.js` now (Finding A, C/D/E, and this one) — **re-check it against `main` before anything else**. C8 depends on it. Backup at `backup/2026-10-17-c2-c3-pre-rebase`. |
| **Doc 4 statement 1** | **1,494 cards.** Open owner decision, three readings in the C7 log. **She was shown this twice and asked that it not be pushed again. Do not re-ask unprompted.** |
| **C8** | Apply all six documents' dispositions. Needs per-card sources; reuse `ROUTINE_ADULT_MIN_M`, never a second age test. |
| **G1, G4, G5** | G1 can only pass once C8 is done. |
| **p2016 label** | `refs.js` says "(Tables 1–4)"; the live 2/16/2024 PDF has **five**. Label only — do **not** re-add Table 5's schedule (transplant is a hard stop). |
| **Dead `advisory` flag** | Owner approved removing it as its own change. Not started. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". It caught a hand-typed interval in FINDING E's new text, so the blind spot is real but narrow. |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. Wording question, not a citation one. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

Still recorded and unfixed from document 3: 110 cards state a 5-dose infant series p2016
never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before 12
months". Citation accuracy, not wrong advice.

## Why this is a good stopping point

The citation work the last three handoffs have been circling is finished as a unit: the
field, its guard, the four cards it caught, and the documentation — with the guard proved by
breaking the code six ways rather than by a green run. Nothing is half-applied, and the one
way the guard could be silenced is itself pinned.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. **Merge PR #65** if it is still open, then confirm the Pages deploy and spot-check live.
3. Run `npm test` — confirm **1,127 passing in 98 files**.
4. `preview_start` the dev server; read the real port from `preview_logs`. If the per-folder
   cap refuses, find a running server and confirm it serves this tree before trusting it.
5. **Ask, do not default**, on which item is next. Do **not** re-raise doc 4 statement 1.
6. Per-item workflow: reproduce → failing test (confirm it fails pre-fix) → fix → full suite
   green → **drive the running app** → commit named by the item ID.
7. Push/merge: branch → PR → squash merge; then confirm the deploy.

## What this session learned

- **Mutate the guard, not just the code.** The population guard looked complete and green;
  breaking it six ways found the one escape — widening a source's declared scope — that no
  amount of staring would have.
- **A measurement is only as good as what it read.** One attribution in this session's own
  earlier report was backwards because the check searched a string typed while reading the
  page instead of the string stored in `refs.js`. Drive every quote check from the code.
- **Counting beats finding.** "Does this quote appear on the page" was already true of all
  of them. "How many times, and in which block" is what produced five findings in a day.
