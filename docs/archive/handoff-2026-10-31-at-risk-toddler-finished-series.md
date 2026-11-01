# PneumoVax — Handoff after the at-risk toddler PCV20 fix, and a realistic finish line (2026-10-31, late)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-31-at-risk-toddler-finished-pcv20-series`, off `main` at `89de774`
(PR #105, squash-merged). Pushed with this handoff; a PR is open for **her squash-merge**
(sessions cannot merge in auto mode). Baseline was **1,885** passing (171 files); now
**1,898 passing (172 files), 0 failing**. 0 uncredited source pairs over 17,311 cards.

---

## What's done

1. **`d417127` — §B-TODDLER-PCV20, OWNER RULING "Mark complete".** Maya, 4, diabetes, PCV13
   at 2/4/6 months, PCV20 at 12 months: the app offered another PCV20. CDC (child notes,
   at-risk Age 2–5, read live 2026-10-31) and p2016 Table 4 both say a finished series with a
   PCV20 needs nothing. Cause: `enoughAt24mo` in `pcvRiskChild` read "3+ doses before 24
   months" as p2016's "3 doses, all before 12 months" row. Now `finishedBabySeries` = 3+ doses
   before 24 months **and** a dated dose at 12–23 months. Group A's quote now asks
   `pcv20CompleteRowKey()` (shared with Group B), so a 2–5 year old quotes CDC's Age 2–5
   sentence. Measured vs `main`: 0 / 17,016 verdicts, 0 / 18,264 record-problem rows,
   0 / 35,280 card lines (the grid builds no toddler with baby doses). Hand-built: **3,840 of
   8,400** at-risk 2–5 year olds moved, every one to "PCV complete (includes PCV20)". Seven
   mutations, each caught. Checked in the running app (Maya). Guard:
   `regression-2026-10-31-at-risk-toddler-finished-series-with-pcv20.test.js`.
2. **The handoff's "undated PCV20 ignored" item is mostly answered by (1).** A finished dated
   series plus an undated PCV20 now reads complete. The remaining shape, three baby doses
   before 12 months plus an undated PCV20, still gets PCV20/PPSV23 on purpose (the undated
   dose might have been a 4th infant dose). Pinned in the guard.

## What this session learned about the remaining work

**This bug was found by testing an ORDINARY child, not an unusual one.** The 17,016-patient
grid uses fixed "days ago" offsets, so it cannot build a child of 2–18 who got her shots on
time as a baby (see memory "the grid cannot build a vaccinated teenager"). Every one of the
recent fixes (Maya; the 8-year-old with diabetes; FINDING M) sat in that blind spot. So
**the highest-value next step is a sweep of typical real-world histories**, not more
one-off scenarios: children 2–18 with an on-time baby series (each product mix), with and
without a PPSV23 at 2, for each risk class, with every card's dose checked against CDC's
row for that history. Build it on the hand-built approach in this session's guard (dates
from DOB, not days-ago). Report families, not shapes.

## What's NOT done

### Recommended next (realistic, common patients)
- **TYPICAL-SWEEP**: the sweep above. 1–2 sessions depending on what it finds.

### Owner questions, all uncommon. Ask only if she wants them
- **Family C**: an at-risk child who STARTED PCV at 12–23 months and has only two doses (13
  and 15 months). CDC calls it finished; p2016 row 1 asks for two more. Case (b). Unchanged.
- **P4**: a supplemental PCV20 24–51 days after a 22-month PCV13 (rejected today; "count it
  and document"?). Carried over.
- **Mixed history** (PCV13 as a baby and again at 8, then PCV20 at 10). **Recommend parking**
  as very unlikely.
- Audit only: the adult card at 19 for a three-PPSV23 adult uses ACIP's two-dose row.

### Owner design
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about it.

**Do not re-raise:** "also state the minimum" (closed); the eleven new references;
`mmwr7203a1` on cards; the timing of the PCV20/21 stand-in after a PCV15.

## Why this is a good stopping point
Her one ruling today is built, guarded, specced, measured and checked in the app. Everything
left is either a sweep that needs no decision to start or an uncommon history.

## Resuming
1. If the PR is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. Run the suite and confirm **1,898 passing (172 files)**:
   `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`.
3. Start TYPICAL-SWEEP unless she picks otherwise. Only bring her a family that is common
   and where the card is wrong. Put the patient in the question box, in plain words.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → break each clause (python exact replace, restore from a scratchpad copy, `cmp`)
   → measure vs `main` (`git worktree add <scratch>/pv-main origin/main`, symlink
   `node_modules`, `node scripts/proseDiff.mjs dump`) → drive the app → commit.
5. Dev server: `preview_start` usually refuses (5 servers from other chats). Use
   `lsof -nP -iTCP -sTCP:LISTEN | grep node`, check the process's cwd with `lsof -p <pid> |
   grep cwd`, and `navigate` there (5178 served this folder). Enter patients with the native
   value setter and `document.forms[0].requestSubmit()`.
6. Branch → PR → her squash-merge. Never push to `main`.
