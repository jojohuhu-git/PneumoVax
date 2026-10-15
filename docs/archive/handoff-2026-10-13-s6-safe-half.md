> ⚠️ **SUPERSEDED (2026-10-15) by `handoff-2026-10-15-s6-and-s9-merged.md`.** Do not resume
> from this file. Everything it leaves open is now closed: PR #42 merged (`eda91f7`), the
> MeningoVax decision was taken and shipped as PR #71 (`f0ec86d`), and `S9` is merged
> (PR #43, `0a64391`). The remaining queue has been reordered and added to in the newer file.

# PneumoVax — Handoff after S6's safe half (2026-10-13)

> **Supersedes `handoff-2026-10-12-parity-1-and-s11-keyboard.md`.** Its PR **#41 is MERGED**
> (`ade789c`) and the GitHub Pages deploy succeeded — live site returns 200. Its `S11` and
> `PARITY-1` are done and shipped. `S9` and `S5` are untouched and carried forward below.
> Its `S6` is **half done**: the behaviour-preserving half shipped as PR #42; the interval-prose
> half was deliberately deferred by the owner.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`refactor/s6-one-number-one-home`**, off `main`, pushed and clean at **`421e7ca`**.
Open PR: **[#42](https://github.com/jojohuhu-git/PneumoVax/pull/42)** — 4 commits,
**`test` check PASSED**, awaiting the owner's review.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**
Baseline at session start **786 passing / 73 files**; now **813 passing (77 test files)**,
all green, `vite build` exits 0.

Sibling repo **MeningoVax** (`~/Downloads/MeningoVax-main`): branch
**`parity/avg-days-per-month`** off `main`, **committed (`e6f9636`) but NOT PUSHED — the
owner has not yet decided whether to push it.** Suite there **1635 passing / 135 files**.
Its PR #70 is still open on a different branch and was not touched.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner is
a clinician, not a coder — explain every what and why in plain English, in chat and UI copy.

## Owner decisions this session

1. **Merge PR #41 immediately** (done — merged, deployed, live site checked).
2. **S6 ships as its SAFE HALF ONLY, in its own PR.** The ~58 interval prose strings
   (census step 6) are deliberately held back so a verdict change can never hide behind a
   tidy-up. Do not fold them into PR #42.
3. **PneumoVax and MeningoVax's `dateUtils.js` must stay the same** — "unless there is a
   clinical concern from your end", and there is none for PneumoVax, which never calls the
   affected helper. So the S6-4 change was applied to **both** repos as byte-identical text.

## What's done

Four commits, each with a mutation-proved guard. Full detail and the mutation table are in
[PR #42](https://github.com/jojohuhu-git/PneumoVax/pull/42) — not restated here.

1. **`S6-1`** — `d021c18`. Age 50 (routine adult start) was in `recommend.js` **and**
   `format.js`. Now `ROUTINE_ADULT_MIN_M` in `scheduleConstants.js`, which exports **three**
   constants now, not two. Also killed a bare `228` in `format.js` and a comment pointing at
   a non-existent `AGE_GROUP_CHIPS`.
2. **`S6-2`** — `fbf889f`. Both dose editors had `const isAdult = (ageMonths ?? 0) >= 216`.
   The number was right, the **name was the hazard** — 216 is Capvaxive's 18y product floor,
   not the 19y adult schedule boundary. Now `meetsPcv21MinAge` reading `PCV21_MIN_AGE_M`, on
   both surfaces.
3. **`S6-3`** — `6bf4aee`. Deleted five unused entries from the engine's `M` age table,
   three of them aliases (`y2`=`m24`, `y5`=`m60`, `y6`=`m72`). Census said "de-alias and
   delete `m16`"; measured, there was nothing to de-alias and two more to delete.
4. **`S6-4`** — `421e7ca` (+ MeningoVax `e6f9636`). `30.4375` → `AVG_DAYS_PER_MONTH`
   exported from `dateUtils.js` (MeningoVax's own name). **Also the first test ever on the
   `dateUtils.js` mirror** — CLAUDE.md has required it identical since L2 with nothing
   checking it. It is **skipped, not failed, when the sibling repo is absent**, so only a
   local run catches drift.

**Zero verdicts moved.** Both corpora (16,250 real patients, 18,460 impossible records)
reproduce byte-for-byte across all four commits. `npm run sweep:update` was **never** run.

## Facts measured this session that contradict older docs

- **`dateUtils.js` is NOT "byte-for-byte identical"** across the two apps and never was: the
  `L2 MIRROR NOTE` comment exists only in PneumoVax's copy. Zero lines of *code* differ.
  CLAUDE.md now states the exception and the measurement.
- **The two apps use the shared file differently, legitimately.** PneumoVax calls only
  `DAYS.weeks` (2×); MeningoVax calls `DAYS.months` 17× and `DAYS.years` 12×. PneumoVax
  deliberately moved its month/year comparisons onto the calendar-exact helpers. This is not
  drift — do not "fix" it.
- **The impossible-record corpus is 18,460, not 17,485.** CLAUDE.md and `testing.md` both
  said 17,485; `testing.md` is corrected, **CLAUDE.md's copy is NOT** (left alone to avoid
  churning a non-negotiables section for a count — fix it in passing next time).
- **Census step 4 (PPSV23 min age) was already closed by queue `P2-12`,** not by S6.
- The census claimed 6 copies of `30.4375`; only **3** were live code.

## What's NOT done — the remaining queue

**Owner's stated order was `S6`, then `S9`, then `S5`.** `S6`'s safe half is done, so **`S9`
is next** unless the owner reorders.

- **`S6` second half — the ~58 interval prose strings.** Census step 6: a single
  `intervalPhrase(days)` helper so the displayed words ("8 weeks", "1 year") cannot diverge
  from the computed `minIntervalDays`. Confined to `recommend.js` and `riskFactors.js`.
  **Deferred on purpose, not forgotten** — this one CAN change what a clinician reads, so it
  needs its own PR and its own verdict-movement story. Opus 5, high effort.
- **`S9` / `P4-1` — the dose editor is still duplicated** in `StepHistory.jsx` and
  `Results.jsx`. MeningoVax already merged its into `DoseEditor.jsx`. **This session made the
  case stronger a third time**: `S6-2`'s one-line fix had to be written twice, and the new
  test had to assert both surfaces. Sonnet 5, medium. Pure UI.
- **`S5` / `P2-1` — the test clock is still NOT pinned** (no `setSystemTime` anywhere;
  `src/test-setup.js` only does cleanup). MeningoVax has `src/test-today.js` as a reference.
  Plus `P2-13` (wire `scripts/*.mjs` into the suite — only `check-root-notes` is wired) and
  `P2-11`. Sonnet 5, medium. Expect fixtures to turn red; fix the fixtures, do not unpin.
- **`S12` — verify and strike off, do not start.** Previously checked: the Color key legend
  is gone and status labels read plainly. Confirm, then close.
- **`S7` — needs re-scoping**, largely overtaken by `src/test-grid.js` and the two corpora.
- **Did NOT reproduce, do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note,
  `S10-N1`.

### New, found this session — not acted on

- **A dose card states one dose's age in two units at once.** DOB 2026-09-01 + PCV13 on
  2026-09-20: the chip says "age 2 weeks", the reason beside it says "~0 months", and the
  minimum it is judged against is stated in weeks. Cause: `format.js`'s `fmtAgeMonths` uses
  weeks below ~2 months, `validate.js`'s `fmtAgeM` (~line 80) uses months below 24.
  **`fmtAgeM`'s flooring is deliberate (P3-4) and must not be reverted** — extend it to speak
  weeks. Logged as a background task with full repro.
- **MeningoVax may still use the averaged month where it should not.** It calls
  `DAYS.months` 17 times; that file's comments record real bugs from exactly that
  (a 181-day Bexsero gap failing a 183-day "6 month" minimum). **I did not audit those 17
  call sites** — flagged, not diagnosed. A MeningoVax session should.
- **MeningoVax's `brands.js` keeps its own copy of `30.4375` on purpose** — a written,
  reasoned decision (that file takes no dependency on the logic layer's date arithmetic).
  Left standing. Do not "finish the job" there without asking.
- MeningoVax still has the identical orphaned dose labels in `DoseEditor.jsx` (from the
  previous session, still unacted).

## Why this is a good stopping point

All four commits in PR #42 are provably behaviour-neutral — the two corpora say so — so it is
one coherent thing to review: "numbers moved house, no answers changed." CI is green, both
trees are clean, nothing is half-built. The deferred half of S6 is the part that can change
words on screen, and it belongs in its own PR for exactly that reason.

## Resuming

1. `cd ~/Downloads/PneumoVax`. **PR #42 is open and green — the owner reviews it.** If
   merged: `git checkout main && git pull`, then branch fresh. If not:
   `git checkout refactor/s6-one-number-one-home`.
2. Confirm the suite: **813 passing / 77 files, 0 failing.** Stop and diagnose any mismatch.
3. **ONE OPEN OWNER DECISION: push MeningoVax's `parity/avg-days-per-month` (`e6f9636`)?**
   It is committed locally only. Until it is pushed and merged, the two `dateUtils.js` copies
   differ, and the new mirror test will FAIL on any machine that has both repos checked out.
   MeningoVax's `main` is not protected (direct push allowed; branch+PR fine for review).
   **Ask — do not default.**
4. Per item: reproduce → failing test first (**confirm it fails, and for the right reason**)
   → fix → full suite green → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the count.**
6. **Never `git checkout <file>` to undo a mutation on uncommitted work** — copy to the
   scratchpad and restore from there. Used four times this session; it works.
7. **A UI regression test needs `// @vitest-environment happy-dom` as its first line**, and
   `fireEvent` rather than `.click()`. **`Results` is a CONTROLLED component** — use a
   stateful harness when the assertion depends on state changing.
8. **A source guard must strip comments first** — the comments explaining a rule name the very
   thing being forbidden. Reuse the `codeOnly()` helper (replace comment text with its own
   newlines so line numbers stay true). Three tests here do it.
9. **Dev server:** `preview_start` with `.claude/launch.json`. Its reported port was **correct**
   this session (5173), unlike last session — still read the real port rather than trusting it.
   **`read_console_messages` returns the tab's whole history**, including errors from your own
   branch switches and server restarts; open a FRESH TAB for a clean reading.
10. **Do not re-litigate:** the three decisions at the top of this file; plus everything earlier
    handoffs list (PneumoVax-matches-MeningoVax, warn-do-not-trap, K4 focus-on-phones,
    P0's date order, P1-3, S14-4C, PCV7-never-counts, P6-3c, S14-4B, the S8 rulebook decision,
    the sweep hard-gate, ANCHOR-1, the 2026-10-11 adult-floor determination, `A-P1-1`, the
    three `P0-2` decisions, `CLINICAL_SPEC.md` §C, the seven S14-RC decisions, W1's scope,
    the two-corpora split, duplicate = same product only).
