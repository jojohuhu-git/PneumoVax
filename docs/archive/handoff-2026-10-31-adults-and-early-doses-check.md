# PneumoVax — Handoff after the ordinary-adult and too-early-dose checks (2026-10-31, night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

`main` is at `fed7bc7` (#106 and #107 both merged), **1,907 passed**. **Two PRs are open for
her squash-merge**, both independent and both mergeable onto today's `main`. Sessions cannot
merge in auto mode. This file lives on #109's branch.

| PR | Branch | Suite on that branch |
|---|---|---|
| [#108](https://github.com/jojohuhu-git/PneumoVax/pull/108) Pat & Ruth: adult with two PPSV23 | `fix/2026-10-31-adult-two-ppsv23-which-dose` (off `ac5b3c7`) | 1,912 passed / 174 files; CI passed |
| [#109](https://github.com/jojohuhu-git/PneumoVax/pull/109) Lily: 4-day grace at the 1st birthday | `fix/2026-10-31-four-day-grace-at-first-birthday` (off `fed7bc7`) | 1,919 passed / 174 files; CI pending at writing |

Trial-merged both onto `fed7bc7` locally: **1,933 passed, 0 failed (176 files)**. Re-run it,
don't trust the number.

---

## What's done

1. **§H-ANY65 (#108, `a79f11f`), owner ruling "Shared decision".** Pat, 70, diabetes, with
   PCV13 at 60 and PPSV23 at 60 **and** at 65, was told "recommended". The engine read only the
   first PPSV23's age. Now any counted PPSV23 at 65+ means shared decision. 132 of 17,016
   verdicts (status only; same dose and date).
2. **§H-PPSVLAST (#108, same commit), owner ruling "Count from last".** Ruth, 71, COPD, with
   PPSV23 at 60 and 6 months ago and no PCV, was told PCV was due today. Now the year runs from
   the last PPSV23. 0 grid verdicts; 141 of 4,008 hand-built adults, all later. 278 card lines
   now say "after the last PPSV23 dose". Seven pinned citation counts moved by exactly 132.
3. **§A-GRACE12 (#109, `c2f4ae3`), owner ruling "Grace applies".** Lily's booster 2 days
   before age 1 was called an extra dose. A dose 1–4 days before the 1st birthday now counts as
   the 12-month dose for the age bands **and** Table 2's spacing, through one helper,
   `pcvAgeAtTwelveMonthLine()` in `intervals.js`. 0 grid verdicts; 288 of 360 hand-built babies.
   My first version moved only the bands, which let a 5-weeks-too-soon booster read "complete".
   I caught that before the PR, and both versions of that booster are now rejected.

## The ordinary-patient check, part 2 (what it covered)
The scripts are in this session's scratchpad, not committed:
`/private/tmp/claude-501/-Users-joannehuang-Downloads-PneumoVax/780b79d2-9999-43d4-a465-581063b3f67b/scratchpad/`
`adult.mjs` (4,008 adults, independent reading of mm7401a1's table and CDC's adult notes,
both read live today) and `early.mjs` (360 babies walked forward with one early dose, checked
against Table 2). Run each as `node <script> <repo root>`.
- **Proved by breaking the app:** adult 138/144/212 flags for three breaks; baby walk 4 and 5
  problem kinds for two breaks.
- **With #108 and #109: adults 0 problems.** The baby walk shows two **checker artifacts,
  not app bugs**: 72 "app counts a dose CDC does not" (the app marks an extra infant dose
  `valid`, per the 2026-10-23 ruling, and still asks for the booster, which is CDC's answer) and
  6 "app stops" (the checker ignores the 4-day grace; CDC agrees the child is done).

## What's NOT done
- **Not covered by any check yet:** adults whose doses were given *too early* (only the
  owner's adult floors apply there); children 2–18 with early doses. Both are lower-yield than
  what was covered today.
- **Seen, not raised (rare):** the parked items from the previous handoff are unchanged: P4,
  the unvaccinated-to-6 PCV15 row, and the mixed history. Per her 2026-10-31 request, don't
  raise rare histories.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): still needs her design review
  of the existing page.
- **Do not re-raise:** "also state the minimum" (closed), the eleven new references,
  `mmwr7203a1` on cards, and the PCV20/21 stand-in timing after a PCV15.

## Why this is a good stopping point
All three rulings are built, guarded (every clause broken on purpose), specced, measured
against `main`, and checked in the running app. Both PRs pass alone and together.

## Resuming
1. If both PRs are merged: `git checkout main && git pull`, run the suite, expect ~1,933.
   If not, ask her to merge them; either order works.
2. `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`.
3. Ask her what next: rules-map design review, or the early-dose check for adults and
   children 2–18. Don't default.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → break each clause (python exact replace, restore from a scratchpad copy, `cmp`;
   remove any edit no break needs) → measure vs `main` (`git worktree add <scratch>/pv-main
   origin/main`, symlink `node_modules`, `node scripts/proseDiff.mjs dump`) → drive the app →
   commit. When a corpus moves, exact-pinned citation counts in the `regression-c8-*` tests move
   too: update each pin with a dated comment, and confirm `scripts/uncreditedSources.mjs` still
   reports 0.
5. Dev server: `preview_start` refuses (5 servers from other chats). They serve this folder:
   port 5178 (`lsof -nP -a -p <pid> -iTCP -sTCP:LISTEN`). Drive with the native value setter
   and `document.forms[0].requestSubmit()`; click "No risk factors apply" by its label text.
6. Branch → PR → her squash-merge. Never push to `main`.
