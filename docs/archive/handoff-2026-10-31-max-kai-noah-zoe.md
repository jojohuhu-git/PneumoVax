# PneumoVax — Handoff after Max, Kai, Noah and Zoe (2026-10-31, afternoon)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-31-max-kai-noah-zoe`, off `main` at `7cdb26c` (PR #100 merged). Pushed
with this handoff; PR opened for **her squash-merge** (sessions cannot merge in auto mode).
Baseline was **1,785** passing (161 files); now **1,817 passing (163 files), 0 failing**, run
on this tree. Item commits: `f5fd696`, `3bbecd4`, `349194d`, `f733cc3`; this handoff follows.
0 uncredited source pairs over 17,311 cards (`scripts/uncreditedSources.mjs`).

---

## What's done (each put to her with a patient, inside the question box)

All four came from the morning handoff's open questions 1–4; she chose the recommended option
on every one.

1. **Max — `f5fd696` — §C-P2-NOTHIRD.** Sam's twin who is NOT immunocompromised (cochlear
   implant): *"PCV20 only + note"*. Card and chip are Sam's, citing CDC's non-IC rows; the note
   ends *"If it were counted, the series would already be complete."* 0 grid patients moved.
2. **Noah — `3bbecd4` — §C-P2-NOTHIRD.** First PPSV23 thrown out for SPACING, repeat thrown out
   too: *"PCV20 only"*, no grey-area note. The rule now fires on the repeat rule
   (`CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST`) whatever voided the first dose; the grey note
   only when the first was too young. `greyAreaRepeat` is now `noThirdPpsv23` in `recommend.js`.
3. **Kai — `349194d` — §C-P2-NOTHIRD.** No counted conjugate + Sam's two PPSV23 shots:
   *"PCV20 only + note"* on the 6–18 no-prior-PCV card AND the 24–71-month catch-up card (both
   rows). PCV15 is dropped and "Why this" says why. The catch-up PCV15 sentences are now
   shared constants (`CATCHUP_PCV15_SENTENCE_ROW1/2`). 0 grid patients moved.
4. **Zoe — `f733cc3` — §C-P2-HEALTHY.** A healthy child's PPSV23 is *"Not needed"* at any age
   (CDC PPSV23 VIS 5/29/25, read live). A dose that would have counted becomes an extra dose
   (still holds a conjugate 8 weeks); a thrown-out one stays thrown out (holds nothing) and
   loses "repeat this dose only". **Moved 1,164 / 17,016 verdicts and 126 / 18,264
   record-problem rows**, all one family: healthy 2–18-year-olds whose PPSV23 went from
   "dose 1" to extra. 0 cards, 0 at-risk children, 0 adults (prose diff against `main`).
   Fixed a side effect the grid caught: a duplicate PPSV23 entry next to an extra dose lost
   its "duplicate" label (12 rows). Six older tests that used a healthy child to stand for
   "not immunocompromised" now use a cochlear implant.

## Judgements within her rulings — listed in the PR for her audit, not asked
- Noah's twin who is NOT immunocompromised → PCV20 only (her Max and Noah rulings both reach him).
- The non-IC child on the 6–18 no-prior-PCV card → same as Kai (her Max ruling).
- A repeat thrown out for spacing on the catch-up card → PCV20 only, no note (her Noah ruling).
- Max's note says "the series", not "his series": the app does not know a patient's sex.
- The catch-up card's grey note has no "if it were counted" sentence: none is true for every
  child on it (an IC child would still owe a five-year dose).

## What's NOT done

### Owner questions: ask with a patient, inside the question box, and don't default
1. **The FIRST thrown-out PPSV23's chip on these cards.** Sam, Max and Kai's too-young first
   dose still says *"repeat this dose only (do not restart the series)"*. It was repeated, and
   the card now offers no PPSV23. Noah's first (too soon after a PCV) still says *"the next dose
   in this series can be given from Jun 24, 2023"*, a past date. Neither was changed; both
   were the same before today. Seen in the running app.
2. **Two PPSV23 shots BOTH thrown out for being too young** (for example at 13 and 20 months)
   in an at-risk child: the second is not a "repeat after an invalid first", so
   `noThirdPpsv23` does not fire and the card still offers a PPSV23, which would be a third
   shot. Not ruled, not built. Check that the patient is reachable before asking.
3. Carried over from PR #100, for her audit only: the adult card at 19 for a three-PPSV23
   adult uses ACIP's two-dose row.

### Queue (carried over, unchanged)
- **P4**: the supplemental PCV20 at 24–51 days. Offer "count it and document", but withhold
  for immunocompromised and asplenic children.
- **"Also state the minimum"**: every card advising a date also states the true earliest date.
  Largest remaining item. Not started.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about the design.
- **Do not re-raise:** the eleven new references; `mmwr7203a1` on cards.

## Why this is a good stopping point
Each ruling is its own commit, with a guard test, a `CLINICAL_SPEC.md` entry, every clause
broken separately (unreachable or redundant clauses removed), and a check in the running app.
Both corpora and the prose diff are explained down to one family. Nothing in the queue depends
on this PR.

## Resuming
1. If the PR is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. Run the suite and confirm **1,817 passing (163 files)** before any new work. Use
   `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json` (the
   terminal wrapper can swallow the count line) and pass several files as a zsh array.
3. Ask the owner questions above first: one patient each, the whole scenario in the box.
4. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break each clause separately (python exact replace with
   `assert count == 1`, restore from a scratchpad copy, `cmp`) → drive the app → commit.
5. ⚠ Measure against untouched `main` and group by family: `git worktree add <scratch>/pv-main
   main`, symlink `node_modules`, `node scripts/proseDiff.mjs dump/diff`. Today's family
   scripts (per-dose verdict diff of each corpus) caught the duplicate side effect.
6. Dev server: `preview_start` "PneumoVax dev server" (it came up on **5174** today, since
   5173 was taken). Doses use `useId` ids: set values with the native setter and
   `requestSubmit()`; the results button is "View Results"; rec cards start collapsed.
7. Branch → PR → her squash-merge. Never push to `main`.
