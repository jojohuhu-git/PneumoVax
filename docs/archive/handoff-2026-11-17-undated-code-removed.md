# PneumoVax — Handoff after removing the dead undated-PCV code (2026-11-17)

Repo `/Users/joannehuang/Downloads/PneumoVax`. Branch `chore/2026-11-17-remove-dead-undated-code`,
off `main` `505a134` (PR #157 merged). Pushed; PR open, **the owner squash-merges** (`main` is
protected; agents cannot merge in auto mode).

Baseline on `main`: 2,548 tests, 2,547 passed, 1 failed — the known 2-second speed test in
`regression-2026-11-06-p1-3-unasked-conjugates-by-family`, which fails when the machine is busy.
After the change, one full run: **2,550 tests in 231 files, 2,549 passed, 1 failed** — the failure
was `rule-docs-match-code` (the new spec paragraph named two deleted identifiers). The spec was
reworded (docs only) and that file then passed **72 of 72**. The full suite was not re-run after
that docs-only edit; CI runs it on the PR.

Supersedes `handoff-2026-11-17-undated-pcv-screen-wording.md` (banner added). The MeningoVax
port is a separate track: `handoff-2026-11-17-meningovax-phase3-built.md` (on PneumoVax PR #158,
docs only, open) governs it.

## What's done
- **Item 2 of the superseded handoff — dead undated-PCV code removed** (commit `403bcc1`).
  Since §A-UNDATED (2026-11-15) the validator never counts an undated PCV, so `recommend.js`'s
  undated policy always read zero. Deleted: the undated band and its prior-dose twin, the
  "undated dose is an infant dose" ladder input, "an undated PCV20 completes a toddler", and the
  `pcv.count >= 3` half of the FINDING G/I gate (now just `allCountingPcvBefore72mo`).
  `summarizePcv()` now **throws** if an undated PCV reaches it (a tripwire; the engine already
  throws for programmer errors in `intervals.js`). Judgement call flagged in the PR body.
- **Proof nothing moved:** 50,472 hand-built patients with an undated PCV (every product, 46 ages,
  6 risk sets, 10 histories, ±PPSV23) byte-identical before/after; `proseDiff` 0 of 35,280 lines;
  both corpora green in the full run.
- **Guard:** `regression-2026-11-17-no-undated-pcv-reaches-the-engine.test.js`. Mutation-tested:
  making the validator count an undated PCV fails both its tests, with the throw and without it.
- **Live check** (dev server, hidden pane, driven by script): 3-year-old, PCV13 at 2, 4, 13 months
  + PCV20 with no date → "PCV series complete"; the PCV20 reads "Not counted — no date"; dated
  doses numbered 1–3; no console errors.
- `CLINICAL_SPEC.md` §A-UNDATED records the deletion; the §B-PCV20-AFTER-BEFORE6 `priorBand`
  line updated; FINDING I's test header marked as history.

## What's NOT done
1. **PR review and merge** by the owner.
2. **MeningoVax follow-up (carried over, not this repo):** its `DoseEditor.jsx` still says
   "Date (optional)". Ask the owner whether MeningoVax gets PneumoVax's 2026-11-17 wording
   (MeningoVax also chose "Not counted" for undated doses). Ask, don't copy.
3. Nothing else is queued on the PneumoVax track.

## Why this is a good stopping point
The undated-PCV work is finished end to end: rule, labels, screen wording, and now the dead code.
The change moves no answer, so it blocks nothing and nothing waits on it but the merge.

## Resuming
1. `cd ~/Downloads/PneumoVax && git fetch && gh pr list --state all --head chore/2026-11-17-remove-dead-undated-code`.
   If merged: `git checkout main && git pull --ff-only`.
2. Run the suite alone (`npx vitest run --exclude '.claude/**' --reporter=json --outputFile=<file>`,
   read `numPassedTests`); expect **2,550 tests**, all passing when nothing else is running.
3. Next work is the owner's choice: the MeningoVax track (PR #158's handoff, six owner questions,
   then B-1) or a new PneumoVax item. Ask, don't default.
4. Ship via the `ship` skill: branch → PR → she merges.
