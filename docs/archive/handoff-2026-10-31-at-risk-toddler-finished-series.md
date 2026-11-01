> **SUPERSEDED 2026-10-31 (night)** by `handoff-2026-10-31-adults-and-early-doses-check.md`.
> Both PRs below (#106, #107) are merged, and the "adults + early-dose check" this file
> offered has been run. Do not resume from here.

# PneumoVax — Handoff after the typical-patient check: two toddler fixes (2026-10-31, late)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

**Two PRs are open for her squash-merge**, both off `main` at `89de774`, independent of each
other (sessions cannot merge in auto mode). This file lives on #106's branch.

| PR | Branch | Suite on that branch |
|---|---|---|
| [#106](https://github.com/jojohuhu-git/PneumoVax/pull/106) at-risk toddler, finished series with a PCV20 | `fix/2026-10-31-at-risk-toddler-finished-pcv20-series` | 1,898 passed / 172 files |
| [#107](https://github.com/jojohuhu-git/PneumoVax/pull/107) toddler started at 12–23 months: 2 doses | `fix/2026-10-31-toddler-two-dose-series` | 1,894 passed / 172 files |

Baseline on `main` was **1,885 passed (171 files)**. With both merged, expect **1,907**
(1,885 + 13 + 9). Re-run, don't trust that sum.

---

## What's done

1. **#106 — §B-TODDLER-PCV20, OWNER RULING "Mark complete".** Maya, 4, diabetes, PCV13 at
   2/4/6 months and PCV20 at 12, was offered another PCV20. Cause: `enoughAt24mo` read "3+
   doses before 24 months" as p2016's "3 doses, all before 12 months". Now
   `finishedBabySeries` = 3+ before 24 months AND a dated dose at 12–23. Group A quotes the
   Age 2–5 sentence via `pcv20CompleteRowKey()`. Typical children: 1,260 of 9,900 moved (924
   to complete, incl. 252 IC children with a PPSV23 at 2; 336 wording only). Commits
   `d417127`, `1dd556e` (wording correction, below).
2. **#107 — §L-T1-12TO23, OWNER RULING "Complete at 2".** Ella, first seen at 15 months, was
   told "2 doses in total", then "dose 3 of 3" after both. Cause: `target = at12plus + 1` in
   the 12–23 month rung. Now 2. An at-risk toddler's under-2 "complete" card (newly reachable
   with two doses) says 2 more PCV doses fall due from age 2, matching her 24-month card.
   600 of 600 such toddlers moved. Commit `25b9a6a`.
3. **A correction I made to my own earlier claim.** I first called "at-risk child started at
   12–23 months with two doses" a CDC/p2016 disagreement. It is not: CDC's catch-up table
   calls that second dose final only "for healthy children", so both ask for two more at
   age 2, which the app already does. Fixed in #106's comment, test, spec and PR body.

## The typical-patient check (TYPICAL-SWEEP), what it covered and what it found

Scripts are in this session's scratchpad (not committed): an independent reading of CDC's
child rows, compared with the app over **9,900 typical children aged 2–18**; a **forward
walk** that follows the app's advice, every branch, checking the category and the date at each
step (**5,893 steps**); and a **baby walk** (192 babies first seen at 2–18 months, each shot
on time or 2 weeks / 6 weeks / 3 months late), checked against CDC Catch-up Table 2.
**Every checker was proved against `main` first** (924 and 66 problems found there).

With both PRs: **0 disagreements** for typical children, **0 date problems** (never before
CDC's earliest, never >1 month after), **0 problems** in the baby walk. Left, all rare:
- An at-risk child with **no PCV at all until age 6**, then PCV15: the app then offers
  "PCV20 or PPSV23" (reading CDC's "PCV13 at or after 6" row); the row she followed says
  PPSV23. Not harmful. **Recommend parking.**
- PPSV23 given before any PCV (the Sofia/Zoe ruling) — behaves as ruled.

**Seen, not a dose error:** a baby's last shot held to the first birthday shows no date line,
only "This final dose is not due until the patient reaches 12 months" (deliberate,
`needs12moFloor`). Mention to her only if she wants a date there.

## What's NOT done
- **Not covered by the check yet:** adults with typical histories (the grid's day-offset
  doses model adults well, so lower risk), and children whose recorded doses were given
  *too early* (spacing errors). One session would cover both if she wants it.
- Owner questions, uncommon: **P4** (a supplemental PCV20 24–51 days after a 22-month PCV13);
  the unvaccinated-to-6 PCV15 row above; **mixed history** (PCV13 as a baby and at 8, PCV20
  at 10; recommend parking).
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): her design.
- **Do not re-raise:** "also state the minimum" (closed); the eleven new references;
  `mmwr7203a1` on cards; the PCV20/21 stand-in timing after a PCV15.

## Why this is a good stopping point
Both rulings are built, guarded, specced, measured against `main` and checked in the running
app. The typical-patient check came back clean with both fixes.

## Resuming
1. If both PRs are merged: `git checkout main && git pull`, run the suite, expect ~1,907.
   If not, ask her to merge; each branch passes on its own.
2. `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`.
3. Ask her: adults + early-dose check next, P4, or the rules map. Don't default.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → break each clause (python exact replace, restore from a scratchpad copy, `cmp`;
   remove any check no break needs) → measure vs `main` (`git worktree add
   <scratch>/pv-main origin/main`, symlink `node_modules`, `node scripts/proseDiff.mjs dump`)
   → drive the app → commit.
5. Dev server: `preview_start` usually refuses (5 servers from other chats). Find one with
   `lsof -nP -iTCP -sTCP:LISTEN | grep node`, confirm with `lsof -p <pid> | grep cwd`
   (5178 served this folder). Enter patients with the native value setter and
   `document.forms[0].requestSubmit()`; "No risk factors apply" then needs `requestSubmit()`.
6. Branch → PR → her squash-merge. Never push to `main`.
