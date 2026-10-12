> ## ⚠ SUPERSEDED (2026-10-12) — do not resume from this file
>
> Both of this handoff's open queue items are **DONE and merged** in PR #36 (`efc99a8`):
> item **1** (the same-day PCV20 + PPSV23 wording) became **S14-4C**, and item **2** (the
> two sources the app showed nobody) became **P6-3c**. Its `P2-9` follow-ups are partly
> done too — the two uncovered undated minimum-age branches are now covered.
>
> **Current handoff: `handoff-2026-10-12-s14-4c-p6-3c-merged.md`.**

# PneumoVax — Handoff after merging S8 and shipping S14-4B + P2-8/P2-9 (2026-10-12)

> ⛔ **SUPERSEDED 2026-10-12 by `handoff-2026-10-12-p0-p1-3-merged.md`.** Do not resume
> this queue — two further sessions have landed since (S14-4C + P6-3c, then P0 + P1-3).
> Read that file for the current state and remaining items.

> **Supersedes `handoff-2026-10-11-s8-done-pr32-awaiting-merge.md`.** Its item **1 (merge
> PR #32)** is DONE, and so are its item **2 (`P2-8` + `P2-9`)** and its item **4 (the
> silent PPSV23)**. Resume from "What's NOT done" below.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, in sync with `origin/main` at **`f71e958`**. Nothing is
unmerged and no branch is waiting.
Baseline at session start was 561 passing; now **585 passing (50 files)**, all green.
All three PRs merged and the GitHub Pages deploy succeeded after each.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and in
UI copy.

## What's done

### 1. `S8` merged — PR #32 (`6d88acd`)
Was green and blocked only by a permission refusal in the previous session. Merged
unchanged; no code touched. `CLINICAL_SPEC.md` is the rulebook, the docs-match-code
tripwire and the 16,250-patient sweep gate are now on `main`.

### 2. `S14-4B` — a PPSV23 after the series was already complete now says so — PR #33 (`d1da4cc`)
`stepStream`'s extra-dose branch opened with `vaccine === 'PCV'`, so S14-4's rule never
reached the PPSV23 stream. An adult's PPSV23 dated after a counting PCV20/PCV21 was
labelled "series dose 1" in silence, reading **identically** to a PPSV23 that had actually
completed a PCV15 series. Where an interval row did speak, it quoted "CDC advises at least
1 year… still counts" for a dose no recommendation ever asked for.

**Owner decision 2026-10-12: mirror the PCV sentence exactly.** No new clinical rule — the
premise is `pcvAdult`'s own complete-by-product branch (`adultPcv20or21Complete`).

- **Sweep: 648 of 16,250 moved**, all accounted for — 348 formerly silent, 300 formerly
  carrying the advisory. No recommendation and no PCV-stream verdict changed; 0 added/removed.
  Correctly did NOT move: 117 (PPSV23 before age 19), 55 (excluded cases), 12 (the PCV20/21
  itself invalid — ANCHOR-1).
- **Two deliberate narrowings vs. the PCV side**, reasoned out in `CLINICAL_SPEC.md` §K:
  the completing dose must be **dated and strictly earlier** (same-day is co-administration),
  and there is **no undated mirror**.
- One existing `regression-s14-7-one-rule-table.test.js` assertion used the exact dose this
  reclassifies; **repointed, not deleted**, at the same-day pair — the only pair
  `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` can still speak for.
- Live-verified in the running app, both the case and its control.

### 3. `P2-8` + `P2-9` — PR #34 (`f71e958`)
**`P2-8`.** `lastVerified` was read by **nothing in `src/`**, and **17 of 40** entries had
no date — both CDC schedule-notes pages, all five MMWRs, p2016, p3086, Fred Hutch LTFU.
(The ledger's "1 of 18" was stale; measured, not recalled.) All 17 re-read live and dated.
**Found real rot:** CDC had moved `cdcAlteredImmunocompetence`; the old URL only still
worked through a redirect. Two new tripwires — `citation-freshness.test.js` (with the
guard-on-the-guard, ported *before* `P2-1` pins a clock) and `citation-orphans.test.js` (a
**static** check; the sweep-based version was written first and was wrong). Proven by
mutation: **5/5** and **3/3** caught, controls clean.

**`P2-9`.** `@vitest/coverage-v8` + `npm run test:coverage`, scoped to the two engine
files, **no threshold on purpose**. Report: `docs/archive/coverage-2026-10-12-engine-uncovered.md`.
Found and deleted two dead functions in `validate.js` (`fmtDays`, `fmtDayCount`) duplicated
verbatim in `doseIntervalRules.js`.

## What's NOT done — the remaining queue

### 1. OPEN OWNER DECISION — wording for a same-day PCV20 + PPSV23. **Ask, don't default.**
A PCV20 and a PPSV23 given at **one visit** still reads *"CDC advises at least 1 year
between a conjugate dose and PPSV23. This dose still counts."* Poor wording for a PPSV23
nobody needed — but "given after the series was already complete" would be **false** for a
same-day dose, so it needs new wording. Flagged, deliberately not invented (precedent: W1).
This is the only pair `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` still reaches.

### 2. OPEN OWNER DECISION — two sources the app shows nobody. **Ask, don't default.**
Both are in `citation-orphans.test.js`'s `KNOWN_UNCITED` with the reason recorded, so they
cannot be forgotten, and the test fails if either excuse goes stale.
- **`immPCV7`** — the immunize.org source for a CLAUDE.md non-negotiable ("PCV7 never
  counts"). The rule runs; the citation is never shown.
- **`pedsMinAge`** — a quoted citation for the paediatric minimum ages, referenced by nothing.
Both need per-dose verdict citations = the unfinished **`P6-3c`** (see `validate.js`,
`withCites`). Which sentence a verdict cites is a clinical-copy decision.

### 3. `P2-9`'s follow-ups (from the coverage report). **Sonnet 5, Low–Medium.**
- The two **real** uncovered clinical branches: an **undated** dose whose patient is already
  below the minimum age — PCV (`validate.js:228`) and PPSV23 (`validate.js:275`). Both
  produce wording a clinician reads. Highest value.
- `validateHistory()` is exported and called by nothing — keep or delete is an API call.
- `validate.js:274` still hardcodes `const minAgeM = 24` — the open **`P2-12`** item.

### 4. `S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`. **Sonnet 5, Low–Medium.**
Unranked leftovers; several predate S14 and may be moot. Re-read each before starting.
**`S7` is cheaper now** — build its four invariant sweeps on `src/test-grid.js`.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both investigated and closed in earlier sessions.

## Why this is a good stopping point

`main` holds everything, green, deployed. Nothing is half-built and no branch is waiting on
a merge. The two open items are both *decisions*, not code — neither blocks the other, and
both are pinned by a test that fails if they are quietly dropped.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main`. Confirm `git log -1` is **`f71e958`**.
2. Confirm the suite: **585 passing / 50 files**. Stop and diagnose any mismatch.
3. **Do not re-litigate:** the S14-4B mirror decision and its two narrowings; the S8
   rulebook decision; the hard-gate decision for the sweep; ANCHOR-1 and its same-day
   tie-break; the keep-the-adult-floors and order decisions; the 2026-10-11 adult-floor
   determination; `A-P1-1`; the three `P0-2` decisions; the paediatric risk lists
   (`CLINICAL_SPEC.md` §C); the seven S14-RC decisions; `W1`'s scope and wording.
   **Ask, don't default:** queue items 1 and 2 above.
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green
   → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the
   count.** Both P2-8 tripwires were mutation-tested; do the same for the next one.
6. Changing a row of `doseIntervalRules.js` means changing `CLINICAL_SPEC.md` §K's table in
   the same commit. Add a table row, never an age test in the evaluator. Every adult floor
   is an OWNER determination — never cite ACIP or CDC.
7. **If the suite reports moved verdicts, do not run `npm run sweep:update` until you can
   say why those patients should get a different answer.** Then put the count in the PR.
8. **Use `analyzeBoth()`, not two `analyzeHistory()` calls**, for anything needing both streams.
9. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to `main`.**
10. **Dev server:** `preview_start` reports the wrong port. It said **58965** this session
    while the real server was on **5177** at `/PneumoVax/`. Always read the port from
    `preview_logs`. If `read_page` returns an empty page with viewport 0x0, the pane is
    hidden — take a `screenshot` once to make it render, then carry on.
