> **SUPERSEDED 2026-11-27** by `handoff-2026-11-27-rulebook-reorg-built.md`. The plan below was
> BUILT the same day (with three owner changes: E15 wording, a Rulebook-only grace source, and a
> new footer). Do not resume from this file.

# PneumoVax — Handoff: Rulebook screen reorganization planned, not built (2026-11-27)

Repo `/Users/joannehuang/Downloads/PneumoVax`. Client-side React app, pneumococcal vaccine
decision support. This session changed **no app code**. It planned the reorganization of the
in-app **Rulebook** screen (header switch "Patient | Rulebook"; `src/components/Rulebook.jsx`,
content in `src/data/rulebook.js`) into MeningoVax's layout, with the owner, by mock-up.

**Git state.** The checkout sits on `chore/2026-11-17-remove-dead-undated-code`, whose PR #159
is **merged**; it is stale (local `main` is behind too). `origin/main` is `28f7257`.
Uncommitted in the working tree: this file, the mock-up
`docs/archive/mockup-2026-11-27-pneumovax-rulebook-v1.html`, and a superseded banner on
`handoff-2026-11-17-undated-code-removed.md`. They are untracked or modified, so they carry
over `git checkout main`. **Commit them in the build PR** so the plan reaches `main`.

Suite on `origin/main` `28f7257` (run alone, JSON reporter, `.claude/**` excluded):
**2,551 tests in 231 files: 2,550 passed, 1 failed**. The failure is the known 2-second
speed test (`regression-2026-11-06-p1-3-unasked-conjugates-by-family`, "a child with 10 late doses
still answers at once"), which fails when the machine is busy. Re-run alone: **33 of 33 passed**.

## The plan: open the mock-up first
`docs/archive/mockup-2026-11-27-pneumovax-rulebook-v1.html` is the spec. Every fold is open
for review. Amber tags E1–E18 mark each edit. Its wording is the owner-reviewed text: copy it,
don't re-word it. At 375 px it was measured with all 8 folds open: 0 elements overflow.

### Layout (owner decisions, 2026-11-27)
- **L1** One fold, "How PneumoVax decides", with five steps: 1 Stop check · 2 Read the record ·
  3 Children's schedule · 4 Adults' schedule · 5 **Time between doses**. Below a "Reference"
  label: PneumoVax decisions · Sources. **Every fold starts closed.**
- **L2 / E18** Each fold has its own Show/Hide. "Show all" sits beside the "How PneumoVax
  decides" bar and is the same height. It opens every fold, Decisions and Sources included,
  and then reads "Hide all". **Use MeningoVax's own components and CSS, not new ones.** Her
  words: *"use the same show and show all buttons as meningovax."* Source:
  `MeningoVax-main/src/components/Rulebook.jsx` (`FoldButton`, `Fold`, `Step`, the `rb-how-head`
  block, lines ~470–577) and `src/App.css` (`.rb-tap`, `.rb-full-btn`, `.rb-fold-mark`,
  `.rb-how-head`, `.rb-show-all`, `.rb-step*`, lines ~1702–1772).
- **L3** Removed because each repeats another part: the row of 7 jump buttons, "Common series
  patterns", the Age lines box, and the separate risk-group lists. Each risk group's
  conditions go under its name in the group tables.
- **L4** "More than one condition" appears once in each schedule (Option A). The children's
  list has no smoking or alcohol use disorder: those are adult-only risk conditions.
- **L5** Step 5 is named "Time between doses". The owner did not understand MeningoVax's
  "Set the dates". **MeningoVax renames its step 5 to "Time between doses" too** (owner,
  2026-11-27: "yes"). That is a MeningoVax change: a separate PR in that repo.

### Edits E1–E17 (listed in chat 2026-11-27; tags in the mock-up)
E1 intro plus a two-item key · E2 the stop heading names all four conditions (today's heading
omits B-cell malignancy) · E3 vaccine table goes to 3 columns, "Counts?" dropped · E4 label
key: "the line under the dose", not "note" · E5 A dose that does not count: general rules plus
special cases, worked example kept · E6 the unrequested PCV moves to special cases (it is not
counted) and its decision is renamed "A PCV given when none was due" · E7 children's group
table (no "step 2" wording) · E8 healthy row rewritten · E9 **new** table of doses in all by
age at dose 1 (engine 2026-11-27: 2–6 months 4, 7–11 months 3, 12–23 months 2, healthy 2–4
years 1, healthy 5+ none); **generate it from the engine, and test it** · E10 "Next dose falls
after 19 years" moves to step 3 · E11 adults' group table; prior-vaccines table drops its
"Any" column · E12 step 5's heading count was wrong (said 3, listed 5) · E13 "If given sooner"
column; "Not counted" replaces "Invalid" · E14 each decision's "Applies in" names its step and
table, and its wording is trimmed · E15 two new adult decisions (below) · E16 sources grouped by
type, no counts or read dates · E17 footer reworded to *"This page explains the app's
reasoning; it is not a clinical reference. Where it and a CDC or ACIP document disagree, the
document governs. Report the discrepancy."* **Both apps carry the same footer** (owner,
2026-11-27: "both should have the same footer"). MeningoVax's copy is at the end of its
`Rulebook.jsx`; change it in the same MeningoVax PR as L5.

### Clinical content behind E15 and step 5, checked against the engine on 2026-11-27
- **No adult dose is voided for timing.** Of `DOSE_INTERVAL_RULES`, the adult rows are 13
  `recommendation` and 2 `none`, with 0 floors; the children have 5 floors. This is the owner's
  ruling of 2026-10-25 (PR #90). Engine runs agree: a PPSV23 given the same day as PCV15 (HIV,
  30 years) reads "Counted — given early, accepted". The only adult dose not counted is one
  below the vaccine's minimum age (PCV21 at 17 → "Not counted — repeat").
- **The two new decision entries** ("An early adult dose still counts"; "PPSV23 under 8 weeks
  after a PCV") are worded as in the mock-up. The owner asked for the 8 weeks to be shown as
  an exception with its own entry. Before building, **read live** (verify-clinical-source
  skill): rr7203a1's "A minimum interval of 8 weeks can be considered…", and the claim that
  the current adult reports never call an early dose invalid. CDSI v4.64's `absMinInt = 0
  days` for adult intervals is in the local copy (see memory).
- **The children's step 5 heading** quotes ACIP General Best Practices (Timing and Spacing),
  the sentence that a dose given ≥5 days before the minimum interval is not counted. It is not
  in `refs.js` yet. Read it live and add the entry with its `population`.

## What's NOT done
1. **Build L1–L5 and E1–E18** on a new branch off `main`. No code is written.
2. **MeningoVax PR** (answered, not built): step 5 renamed "Time between doses" (L5) and the
   E17 footer. The text lives in `src/data/rulebookPage.js` and `src/components/Rulebook.jsx`.
   Two tests pin it: `regression-2026-11-20-rulebook-reorganization.test.jsx` and
   `regression-2026-11-21-rulebook-steps-hold-their-sections.test.jsx`.
3. Carried over from the superseded handoff, other repo: MeningoVax's `DoseEditor.jsx` still
   says "Date (optional)". Ask whether it takes PneumoVax's 2026-11-17 wording.

## Hazards for the build
- **Tests that read the Rulebook screen** will need updating, each for a stated reason:
  `regression-c14-2026-10-25-rulebook-matches-the-engine`,
  `regression-2026-11-01-rulebook-in-the-apps-order`,
  `regression-2026-11-01-rulebook-switch-keeps-the-patient`,
  `regression-p2-1-2026-11-08-rulebook-healthy-row-follows-the-rulings`,
  `regression-s6-2-pcv21-age-gate-one-home`, `regression-p3-9-risk-age-note` (components), and
  `regression-n6-citations-follow-the-rulebook` (data). Never loosen a check to pass; move it.
- **The transplant text must stay byte-identical to MeningoVax.** Check E2's heading and
  message against `regression-2026-10-16-transplant-stop-mirrors-meningovax` before changing
  them.
- No verdict, card or dose label may move: both corpora must stay green, and `proseDiff`
  should show 0 changed result lines.
- Live-verify at 375 px and on desktop in the running app, folds closed and opened.

## Resuming
1. `cd ~/Downloads/PneumoVax && git fetch && git checkout main && git pull --ff-only`, then
   branch `feat/2026-11-27-rulebook-reorg`.
2. Run the suite alone (`npx vitest run --exclude '.claude/**' --reporter=json
   --outputFile=<file>`; read `numPassedTests`). Expect 2,551 tests, all passing when nothing else is
   running.
3. No owner questions are open. Build from the mock-up step by step, with the suite green
   after each; then do the MeningoVax PR (L5, E17).
4. Ship with the `ship` skill: branch → PR → the owner squash-merges.
