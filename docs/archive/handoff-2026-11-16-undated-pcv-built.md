> **SUPERSEDED 2026-11-17** by `handoff-2026-11-17-undated-pcv-screen-wording.md`. Item 1 (the "Date (optional)" question) is answered and built; resume from the newer file.

# PneumoVax — Handoff after building §A-UNDATED, undated PCV not counted (2026-11-16)

Branch `feat/2026-11-15-undated-pcv-not-counted`, off `main` 36e7cc6. Pushed; PR open (see below).
PneumoVax's `main` is protected: branch → PR → the owner squash-merges (agents cannot merge in auto
mode). Baseline on this branch before the build: 2,534 passed + the 6 intended failures of the new
test, plus one speed test that fails only when another test run competes for the machine. Now
**2,543 passed, 0 failed (229 files)**, run alone on commit `b966f92`.

Supersedes `handoff-2026-11-15-undated-pcv-not-counted.md`. `handoff-2026-11-15-meningovax-stop-c-answered.md`
still governs the MeningoVax port, which is separate.

## What's done
§A-UNDATED (OWNER DECISION 2026-11-15), commit `b966f92`:
- An undated PCV is `noncounting` + `noDate`, label "Not counted — no date", cites `gbpWrittenDatedRecords`
  (CDC GBP Timing and Spacing). Undated PPSV23 unchanged ("Counted — date not recorded").
- "Check the date — none recorded" / `extraDoseUnverified` removed (unreachable).
- `recommend.js`: undated PCVs not folded like PCV7; `noDoseOnRecord` ignores undated PCVs (no "≥8 weeks
  after" clause); `cardsOnTheDayOf` bails only on an undated PPSV23.
- Rules page (`rulebook.js`): new label row + worked patient (65-year-old); "date not recorded" example
  is now a PPSV23.
- 21 older tests rewritten (old-rule asserts reversed against a no-dose control; shorthand fixtures dated).
- Docs: `CLINICAL_SPEC.md` §A-UNDATED (new), §B (3 passages), §C-P1-3, §K S14-4, §M table;
  `docs/agent/clinical-rules.md`.
- Measured: 0/17,016 verdicts, 0/18,264 record-problem rows, 0/35,280 prose lines; whole-app checks
  77,496 patients, 0 failures, 0 unsorted. Ruth and Omar checked in the running app.

## What's NOT done
1. **Owner question, asked in the PR: "Date (optional)"** in `DoseEditor.jsx:200`. For a PCV row,
   leaving the date blank now means the dose does not count. Changing UI copy is her call
   (`design-review` skill). Ask, don't default.
2. **Dead-code clean-up (deferred, no answer moves):** `band.undated`, `priorBand.undated`,
   `hasUndatedCompleting`, `undatedAsInfant` and the `pcv.count >= 3` half of the FINDING G/I gate in
   `recommend.js` (~20 sites) can no longer run, because `summarizePcv` only gets counted doses and an
   undated PCV is never counted. Separate PR, so the clinical PR stays readable. Prove it the usual way:
   corpora + prose diff unchanged.
3. **PR review and merge** by the owner.

## Resuming
1. `cd ~/Downloads/PneumoVax && git checkout feat/2026-11-15-undated-pcv-not-counted` (or `main` once merged).
2. Run the suite alone (`npx vitest run`; never two runs at once, or the 2-second speed test in
   `regression-2026-11-06-p1-3-unasked-conjugates-by-family` fails); confirm **2,543 passing**.
3. Ask her item 1 if the PR has no answer yet.
4. For item 2: delete one dead reference at a time, run the suite, then
   `node scripts/proseDiff.mjs dump` old vs new (plain node, not vite-node). Expect 0 changes.
5. Ship via the `ship` skill: branch → PR → she merges.
