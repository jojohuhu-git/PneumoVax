# PneumoVax — Handoff after the undated-PCV screen wording (2026-11-17)

Branch `feat/2026-11-15-undated-pcv-not-counted`, off `main` 36e7cc6. Pushed; **PR #157 open**, the
owner squash-merges (PneumoVax `main` is protected; agents cannot merge in auto mode).
Baseline was 2,543 passing; now **2,548 tests: 2,547 passed, 1 failed** in one full run on commit
`bee913f`. The one failure is the 2-second speed test in
`regression-2026-11-06-p1-3-unasked-conjugates-by-family`, which fails when the machine is busy
(the dev server was running); run alone it passes **33 of 33**.

Supersedes `handoff-2026-11-16-undated-pcv-built.md`. The MeningoVax port is a separate track:
`handoff-2026-11-16-meningovax-ruling-d-built.md` on `main` governs it.

## What's done
- **§A-UNDATED** (commit `b966f92`, 2026-11-16) — an undated PCV does not count. Unchanged here;
  see the superseded handoff for its detail.
- **Item 1, the "Date (optional)" question — ANSWERED and built** (commit `bee913f`). Owner
  decisions 2026-11-17, both chosen from three options:
  - Date box label `Date (optional)` → **`Date`** (`DoseEditor.jsx`). A blank date is still
    accepted; the box is not required.
  - History step intro (`StepHistory.jsx`), found by driving the app, not in the old handoff:
    *"Date is optional (counting works without it)."* → **"Enter the date if known; a PCV with no
    date does not count. PCV7 is recorded but never counts toward the series."**
  - Both surfaces (History step, Results "Recorded doses" panel) checked in the running app with
    Ruth (65, PCV20, no date → "Not counted — no date", PCV due today).
  - Guard `regression-2026-11-17-dose-date-label-not-optional.test.jsx` (5 checks, all failed
    before the change); S9 and S11 tests updated; `CLINICAL_SPEC.md` §A-UNDATED records both.

## What's NOT done
1. **PR #157 review and merge** by the owner.
2. **Dead-code clean-up (deferred, no answer moves):** `band.undated`, `priorBand.undated`,
   `hasUndatedCompleting`, `undatedAsInfant` and the `pcv.count >= 3` half of the FINDING G/I gate
   in `recommend.js` (~20 sites) can no longer run. Separate PR **after #157 merges** (stacking on
   an unmerged branch breaks on squash). Prove it: corpora + prose diff unchanged.
3. **MeningoVax follow-up (port, not this repo):** its `DoseEditor.jsx:145` still says
   "Date (optional)". Decide it with MeningoVax's own undated rule (port Phase 3 family 2, C1);
   the owner chose "Not counted" there too, so the same wording question applies. Ask, don't copy.

## Why this is a good stopping point
The undated-PCV change is complete on every surface PneumoVax has: engine, dose label, card,
Rules page, date box and intro line. Nothing waits on anything but the owner's merge.

## Resuming
1. `cd ~/Downloads/PneumoVax && git fetch && gh pr view 157 --json state`. If merged:
   `git checkout main && git pull --ff-only`.
2. Run the suite alone (`npx vitest run --exclude '.claude/**'`; the rtk wrapper turns it into
   JSON, so read `numPassedTests`); expect **2,548 tests**, all passing when nothing else is running.
3. For item 2: new branch off `main`; delete one dead reference at a time, run the suite, then
   `node scripts/proseDiff.mjs dump` old vs new (plain node, not vite-node). Expect 0 changes.
4. Ship via the `ship` skill: branch → PR → she merges.
