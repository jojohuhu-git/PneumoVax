# PneumoVax — Handoff after the too-early-dose check and Leah's ruling (2026-10-31, late night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

`main` is at `ed27ee5` (#108 and #109 both merged). **Two PRs are open for her squash-merge.**
They are independent, both mergeable onto today's `main`, and merge with each other without
conflict. Sessions cannot merge in auto mode. This file lives on #111's branch.

| PR | Branch | Suite on that branch |
|---|---|---|
| [#110](https://github.com/jojohuhu-git/PneumoVax/pull/110) Adult early dose: keep its note | `fix/2026-10-31-adult-early-dose-note-kept` | 1,956 passed; CI passed |
| [#111](https://github.com/jojohuhu-git/PneumoVax/pull/111) Leah: PCV20 only | `fix/2026-10-31-one-ppsv23-too-soon-pcv20-only` | 1,947 passed; CI running at writing |

Trial-merged both onto `ed27ee5` locally: **1,982 passed, 0 failed (663 files)**. Re-run it,
don't trust the number.

---

## What's done

The owner chose the **too-early-dose check** (adults and children 2–18) over the rules-map
page. Two checkers, now committed on #111's branch:
`scripts/earlyDoseCheckChildren.mjs` (630 children, CDC child notes read live today) and
`scripts/earlyDoseCheckAdults.mjs` (906 adults, mm7401a1 plus CDC adult notes). Run each as
`node scripts/<name> "$PWD"`. The child checker was proved by breaking the app (problem kinds
3 → 12; problems 168 → 363).

1. **§K-NONE-KEEPS (#110, `314117e`). Wording only.** Dana, 30, HIV, PPSV23 4 weeks after
   PCV15: the dose counted with no note. A "never flagged" row in `doseIntervalRules.js` did
   `return null` and threw away the note collected above it (broken since "mention both gaps",
   2026-10-24). Now `break`. 312/17,016 grid patients, note fields only.
2. **§K-MET-ONLY (#110, `03aedc2`). Wording only.** Grace, 60, HIV, PPSV23 4 weeks after
   PCV15: her chip said both "shorter than the 8 weeks" and "this dose met that minimum". New
   row field `onlyIfMet`. 30/17,016, note count 2 → 1.
3. **§C-P2-ONE (#111, `77e928c`). OWNER RULING "PCV20 only + note".** Leah, 7, diabetes,
   PCV15 then PPSV23 51 days later (didn't count). The card offered PPSV23 today, which the
   app would then throw out (8 weeks from the invalid dose). Now PCV20 only, and the chip says
   "It is not repeated." This reuses `noThirdPpsv23()` for one shot. 72/17,016 (the PPSV23
   option removed). Two Noah tests and one sweep pin updated with dated notes.
   Her questions and the answers are in the PR body and `CLINICAL_SPEC.md` §C-P2-ONE.

After both PRs: **adults 906/906, children 630/630 agree.**

## What's NOT done

- **Parked for her, with a recommendation.** Two PPSV23 shots, both thrown out, on Leah's
  at-or-after-6 card (`pedsRiskPcv13At6`). Example: a 7-year-old with PCV15 at 7, then PPSV23
  20 and 51 days later. Today Option B still offers a **third** PPSV23. Her Sam/Max/Noah ruling
  covered only the before-6 cards. Recommend asking: "same answer, PCV20 only?". Pinned in
  `regression-2026-10-31-one-ppsv23-too-soon-pcv20-only.test.js`. Probably rare; she asked
  not to have rare histories raised, so offer it as one line, not a question block.
- **Not covered by the early-dose checkers:** a single PPSV23 given before age 2 (pinned
  unchanged), and the 24–71-month catch-up card with a too-soon PPSV23 (pinned unchanged;
  it still offers PCV15 then PPSV23).
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): still waiting on her design
  review.
- **Do not re-raise:** "also state the minimum" (closed), the eleven new references,
  `mmwr7203a1` on cards, the PCV20/21 stand-in timing after a PCV15. Older parked items: P4,
  the unvaccinated-to-6 PCV15 row, the mixed history.

## Why this is a good stopping point

Every family the two checkers found is fixed, or (the one rare case above) parked with a
test pinning today's behaviour. Each change is guarded, every clause was broken on purpose,
it's in the spec, measured against `main`, and checked in the running app. Both PRs pass
alone and together.

## Resuming

1. If both PRs are merged: `git checkout main && git pull`, run the suite, expect ~1,982.
   If not, ask her to merge them; either order works.
2. `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json` (zsh: don't
   pass several files in one variable).
3. Ask her what next: the rules-map design review, or another typical-patient sweep. Don't
   default.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → break each clause (python exact replace, restore from a scratchpad copy, `cmp`) →
   measure vs `main` (`git worktree add <scratch>/pv-main origin/main`, symlink
   `node_modules`, `node scripts/proseDiff.mjs dump`) → `npm run sweep:update` only once every
   moved row is explained → drive the app → commit. Confirm `scripts/uncreditedSources.mjs`
   still reports 0.
5. Dev server: `preview_start` refuses (5 servers from other chats). Port 5178 serves this
   folder (check `lsof -a -p <pid> -d cwd`). Drive with the native value setter and
   `document.forms[0].requestSubmit()`. The rec card body is collapsed: click its
   `[aria-expanded="false"]` header to see dose chips.
6. Branch → PR → her squash-merge. Never push to `main`.
