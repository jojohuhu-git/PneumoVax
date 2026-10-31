# PneumoVax — Handoff after Ivy, the first-chip ruling and Leo (2026-10-31, evening)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-31-ivy-and-first-chip`, off `main` at `7b954b3` (PR #101 merged). Pushed
with this handoff; PR opened for **her squash-merge** (sessions cannot merge in auto mode).
Baseline was **1,817** passing (163 files); now **1,841 passing (165 files), 0 failing**, run
on this tree. Item commits: `39efc20`, `3898ed1`, `7753149`; this handoff follows.

---

## What's done (each put to her with a patient, inside the question box)

All three came from the afternoon handoff's open questions 1–2.

1. **Ivy — `39efc20` — §C-P2-NOTHIRD.** Two PPSV23 shots, BOTH too young (13 and 20 months):
   *"PCV20 only"*. The no-third-shot rule now fires on **two or more shots, none counted**,
   whatever threw them out. A future/before-birth row is not a shot, and nor is a second row
   on the same date (`duplicateEntry()` deliberately leaves the twin of a thrown-out dose
   unlabelled), which also fixed Sam-plus-a-duplicate reading "3 PPSV23 doses". Found by
   driving the app: Ivy's second chip still said "repeat this dose only"; it now says *"It is
   not repeated."* (`validate.js` hands over every dose's `closingSentence` / `closingLead`).
   0 grid patients moved, 0 rendered lines.
2. **First chip — `3898ed1` — §C-P2-LATER.** Asked first, she replied with a question: does
   Sam's second PPSV23 count, given the 5-year rule? Answered from live CDC General Best
   Practices + CDSI 4.64: no — the 5 years runs "after dose 1 PPSV23", a dose that counted; a
   too-young first dose is repeated "on or after the date when the child reaches at least the
   minimum age", no gap stated for a non-live vaccine. His Jan 5 shot stays thrown out by her
   8-week rule. Re-asked: *"Point to the later dose"* — a thrown-out PPSV23 with a later one on
   record reads *"It was repeated on <date> — see that dose."* (Sam, Noah, Ivy).
3. **Leo — `7753149` — §C-P2-LATER widened.** Scoped first to children with NO counted PPSV23
   (her option text kept one-thrown-out children's wording). Widening measured 128 grid
   18-year-olds (PPSV23 on the day of a PCV, again five years later, counted; 12 still
   promised a 2016/2017 date). Shown Leo and his cochlear-implant twin: *"Point to the later
   dose"* for every child. **128 / 35,280 rendered lines, 0 verdicts, 0 record-problem rows.**
   The 2026-10-25 date-promise sweep's pins fell by exactly that family (2544→2428 withdrawn,
   1851→1839 kept), re-pinned with the reason.

Every clause broken separately; redundant ones (`j > i`, a `closingSentence` test, a
`forwardLookingReason` clear, an undated-row clause) removed with the reason in a comment.

## Judgements within her rulings — listed in the PR for her audit, not asked
- Ivy's twin who is not immunocompromised → PCV20 only (her Max ruling).
- Ivy with no conjugate on record → catch-up card, PCV20 only, PCV15 dropped (her Kai ruling).
- Ivy's second chip → *"It is not repeated."* (her Noah ruling: the repeat drops its promise).
- With three shots, the grey-area note keeps naming the FIRST repeat (unchanged behaviour, now
  tested).

## What's NOT done

### Owner questions: ask with a patient, inside the question box, and don't default
1. **Adults with a thrown-out PPSV23 and a later one.** §C-P2-LATER is children only. An adult
   whose PPSV23 was thrown out (e.g. given as a baby) still reads "repeat this dose only" /
   a forward date. Not measured on the grid; measure first, then ask with a patient.
2. Carried over from PR #100, audit only: the adult card at 19 for a three-PPSV23 adult uses
   ACIP's two-dose row.

### Queue (carried over, unchanged)
- **P4**: the supplemental PCV20 at 24–51 days. Offer "count it and document", but withhold
  for immunocompromised and asplenic children.
- **"Also state the minimum"**: every card advising a date also states the true earliest date.
  Largest remaining item. Not started.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about the design.
- **Do not re-raise:** the eleven new references; `mmwr7203a1` on cards; whether the 5-year
  PPSV23 interval applies to a repeat of a too-young dose (answered above).

## Why this is a good stopping point
Each ruling is its own commit with a guard test (`regression-2026-10-31-ivy-two-too-young-ppsv23`,
`regression-2026-10-31-first-chip-points-to-the-later-ppsv23`), a `CLINICAL_SPEC.md` entry
(§C-P2-NOTHIRD's Ivy paragraph, new §C-P2-LATER) and a check in the running app (Ivy, Sam,
Leo). Both corpora unmoved; the one prose family is explained to the patient.

## Resuming
1. If the PR is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. Run the suite and confirm **1,841 passing (165 files)** before any new work. Use
   `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json` and pass
   several files as a zsh array.
3. Ask the owner question above first: one patient, the whole scenario in the box.
4. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break each clause separately (python exact replace with
   `assert count == 1`, restore from a scratchpad copy, `cmp`) → drive the app → commit.
5. ⚠ Measure against untouched `main`: `git worktree add <scratch>/pv-main main`, symlink
   `node_modules`, `node scripts/proseDiff.mjs dump/diff`; the diff prints only 8 samples, so
   load both dumps (tab-separated key → text) and group every changed key by family.
6. Dev server: `preview_start` "PneumoVax dev server" (came up on **5176** today). Doses use
   `useId` ids: set values with the native setter and `requestSubmit()`; rec cards start
   collapsed; the app's "today" is the real date, so ages differ from test fixtures.
7. Branch → PR → her squash-merge. Never push to `main`.
