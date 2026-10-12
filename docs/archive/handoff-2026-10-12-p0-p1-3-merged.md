# PneumoVax — Handoff after merging P0 and P1-3 (2026-10-12)

> **Supersedes `handoff-2026-10-12-s14-4c-p6-3c-merged.md`** (which lives only on PR #37's
> branch, not on `main` — see "Loose end" below) **and
> `handoff-2026-10-12-s8-merged-s14-4b-p2-8-p2-9-done.md`.** Both of the live items the
> S14-4C handoff left open are addressed here: item **1 (the P0 row mismatch) is DONE and
> MERGED**; item **2 (the sweep blind spot) is still open and still wants a conversation.**
> Resume from "What's NOT done" below.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, in sync with `origin/main` at **`13b5d9c`**.
Baseline at session start was 621 passing; now **655 passing (58 test files)**, all green.
PR #38 squash-merged; `Tests` and `Deploy to GitHub Pages` both green on `main`; the live
site serves `assets/index-DcgqHNrr.js`, the **same asset hash** as the local `npm run
build`, which proves the deployed site is exactly the merged code.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and in
UI copy.

## What's done

### 1. `P0` — a dose verdict is shown against the dose it was computed for — PR #38 (`13b5d9c`)
`validate.js` sorts doses into DATE order before grading them (a gap can only be measured
from a dose given earlier), so `perDose` comes back chronological. `Results.jsx` passed the
RAW state arrays — input order — alongside it, and `RecCard.doseRowsWithGroups` paired them
**by index**. A history typed newest-first put every verdict on the wrong row: a valid
PCV13 read "Off-window - repeat" with the PCV7 explanation, and the PCV7 read "Dose 1".

- **Owner decision 2026-10-12: render the list in DATE order.** The alternative was
  re-keying verdicts back to input order. Date order also fixes the `D1 / D2` labels, which
  `describeDose` derives from the row's position and which were wrong for the same reason.
- **Structural, not a sort in the component.** `stepStream` now records each dose at the
  same entry point that produces its verdict, so `doses[i]` IS the dose `perDose[i]` was
  computed for. The engine exposes both as **`result.orderedDoses`**. A sort re-implemented
  in `Results` would have been a second copy of the walk's ordering — the two-sources-of-
  truth shape `P6-5` removed.
- **Sweep: 0 of 16,250 moved.** This changes which dose a verdict is displayed beside,
  never the verdict.
- **Known and deliberately unchanged:** two doses of ONE stream on the SAME DAY keep their
  typed order. The sort is stable and there is no third fact to break the tie — the
  existing same-day convention (ANCHOR-1, S14-4C), not something this reopened. The
  grid-wide backwards-entry assertion excludes exactly those cases and asserts the
  exclusion still leaves >1500 patients standing.
- `validate.js`'s header promise *"perDose — parallel to input"* was untrue since the sort
  went in. Corrected, with the reason.

### 2. `P1-3` — a row nobody typed in is not a dose — PR #38 (`13b5d9c`)
"+ Add PCV dose" created `{date:'', product:''}` and nothing removed it. Measured: a
2-year-old with NO history, one click and nothing typed → recommendation `due` → `catchup`,
`meta.pcvCount` 0 → 1.

- **Not a silent drop.** An empty row meant two things the app could not tell apart ("not
  typed yet" / "a dose happened, I have no card"). The second is a real entry the engine
  grades, so the clinician now says which: a tick reading **"A dose was given, but the date
  and product are unknown"** (`detailsUnknown`), shown only while the row is otherwise
  empty. A ticked row is a dose; the undocumented-dose pathway is unchanged.
- **The half that is easy to miss:** a PPSV23 row is born carrying `product: 'PPSV23'`
  (the card prints the product of every recorded dose; without it the row reads "product
  unknown"). A naive "is every field empty?" check calls that row filled in and leaves half
  the bug standing. `STAMPED_AT_CREATION` in `doseIdentity.js` knows that one value is a
  label, not an answer. **Keep that list to values the APP writes at creation.**
- **Blanks are dropped in exactly ONE place** — `analyzeBoth`'s walk — plus the UI's tidy-up
  on leaving a history step (`App.jsx:sweepHistory`) or closing the Results panel
  (`Results.jsx:closeDosePanel`), **never while the clinician is still in it.**
- `Recorded doses (N)` counts doses, not rows.
- New `src/logic/doseIdentity.js`, ported from MeningoVax `K1` (`6b37c4a`) — the RULE, not
  the code. **NOT mirror-synced** (unlike `dateUtils.js`); the header records the two
  deliberate differences (`product` vs `brand`; no `id`/`doseAnswerKey`, because PneumoVax
  stores nothing keyed to one dose). **Parity: fixed in PneumoVax; MeningoVax already
  carries this rule and needs no change.**
- Four existing fixtures recorded an undated PPSV23 in the now-ambiguous way
  (`{product:'PPSV23'}`, `{}`); each now says `detailsUnknown: true`. Clinical cases
  unchanged.
- **Sweep: 0 of 16,250 moved** — every grid dose is dated, so none was blank.

### 3. A defect found in this session's OWN work, by mutation
`recommend.js` filtered blank rows a SECOND time before handing them to the walk. Deleting
that filter broke **no test**, because the walk already does it and `meta.pcvCount` is
counted from the walk's output. A second place deciding what a dose is, invisible to the
suite. Removed, with a comment in its place saying not to re-add it. **This is what a
redundant source of truth looks like before it drifts — keep mutating.**

## What's NOT done — the remaining queue

### 1. The sweep cannot see the S14-4C clinical error. **Owner wants to brainstorm — ask, don't default.**
Unchanged from the previous handoff. Proved by mutation: deleting the owed-PPSV23 guard
fails the hand-written control in `regression-s14-4c-same-day-completing-dose.test.js` and
its UI twin, and leaves `sweep-verdict-corpus.test.js` **fully green** — `src/test-grid.js`
has no shape pairing an earlier PCV15 with a same-day PCV20 + PPSV23. Adding that shape
closes the gap but multiplies into every age and risk profile and **moves the 16,250 figure
that many docs and tests quote.** Deliberately not taken. **Opus 5, High.**

### 2. Small, visible, cheap — one PR could hold all of these. **Sonnet 5, Low–Medium.**
Each was re-verified against the live code on 2026-10-12, not taken on trust:
- **queue `P1-2`** — `RecCard.jsx:218` is still `useState(!isNeutral)`, seeded once at
  mount while `isNeutral` also decides whether the expand button renders. Press "Adjust
  age" so a complete card becomes a due card → body gone, no control to bring it back.
  Fix: derive what is SHOWN from current props (`showBody = !collapsible || expanded`).
  *(Noticed in passing: a `complete` / `not-indicated` card collapses its body by default,
  which is why the P0 reproduction had to use a `due` patient to have any visible surface.)*
- **`P2-12`** — `validate.js:339` still hardcodes `const minAgeM = 24` for PPSV23. The
  one-number-one-home item; `S6` is its full version.
- **`validateHistory()`** — exported, called by nothing. Keep or delete is an owner call.
- **queue `P1-4`** — `scripts/check-root-notes.sh:36` prints *"Only CLAUDE.md, MAP.md, and
  README.md belong at the top level"* while its own allowlist includes `CLINICAL_SPEC.md`.
  One line. (The allowlisting itself is deliberate — do NOT "fix" that.)
- **`S10-N2` (P3)** — the generic "repeat this dose only" line is appended to every invalid
  dose, including one dated before birth.

### 3. Larger leftovers — re-read each before starting; several predate S14.
- **`S5` / `P2-1`** — the test clock is **confirmed NOT pinned** (only one test uses
  `setSystemTime`). Tests are graded against the real calendar. Plus `P2-13` (wire
  `scripts/*.mjs` into the suite) and `P2-11`. **Sonnet 5, Medium.**
- **`S6`** — full one-number-one-home refactor (contains `P2-12`). Widest blast radius in
  the project. **Opus 5, High.**
- **`S9` / `P4-1`** — the dose editor is **confirmed duplicated** in `StepHistory.jsx` and
  `Results.jsx` (this session had to add the same tick to both). Extract one component.
  **Sonnet 5, Medium.**
- **`S11`** — keyboard and focus. Most buttons lack `type="button"`; **lower risk than the
  audit assumed, because there is no `<form>` element in the app**, so no Enter trap. Also
  noticed this session: the "Date (optional)" `<label>`s are not associated with their
  inputs (a screen-reader gap, and it makes `getByLabelText` unusable in tests).
  **Sonnet 5, Medium.**
- **`S7`** — largely overtaken by `src/test-grid.js` + the sweep corpus. **Needs
  re-scoping before it is worth starting.**
- **`S12`** — looks DONE: the "Color key" is already removed and labels are centralised in
  `doseChipLabel.js`. Verify and strike off rather than starting it.
- **MeningoVax's 9 inline styles** — different repo, owner's call.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both investigated and closed in earlier sessions. Peds audit `P1-2` ("PCV dose 5
of 4") was closed 2026-10-11.

## Loose end — PR #37
**[PR #37](https://github.com/jojohuhu-git/PneumoVax/pull/37) is still open** and holds the
previous session's handoff (`handoff-2026-10-12-s14-4c-p6-3c-merged.md`) plus a supersede
banner. **That file is not on `main`** — this handoff is now the complete chain, so #37 is
redundant. Owner's call: merge it for the archive, or close it. Either is safe.

## Why this is a good stopping point

`main` holds everything, green, deployed and verified against the live site by asset hash.
Nothing is half-built and no code branch is waiting. The two merged items were independent
of each other and of the older queue, and the one remaining live item (the sweep blind
spot) is a conversation the owner asked to have, not a task that is blocked.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. Confirm `git log -1` is
   **`13b5d9c`** (or later).
2. Confirm the suite: **655 passing / 58 files, 0 failing.** Stop and diagnose any mismatch.
3. **Do not re-litigate:** the P0 date-order decision and its same-day tie-break; P1-3's
   tick-rather-than-silent-drop decision and the `STAMPED_AT_CREATION` exception; S14-4C's
   chip-and-sentence decision and its owed-PPSV23 bound; PCV7-never-counts (2026-10-12);
   P6-3c's marker rule; S14-4B's mirror decision; the S8 rulebook decision; the sweep
   hard-gate; ANCHOR-1; the 2026-10-11 adult-floor determination; `A-P1-1`; the three
   `P0-2` decisions; the paediatric risk lists (`CLINICAL_SPEC.md` §C); the seven S14-RC
   decisions; `W1`'s scope and wording.
   **Ask, don't default:** remaining-queue item 1, and `validateHistory()`'s fate.
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green
   → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the
   count.** Every guard this session was mutation-tested, and one mutation found a real
   defect in the fix itself (see "What's done" item 3). Quote measured counts, never
   estimates.
6. **Anything pairing a verdict with a dose must read `result.orderedDoses`**, never its own
   input array. That is what P0 was.
7. **Anything deciding whether a row is a dose must call `isBlankDoseRow` /
   `dropBlankDoseRows`** — do not add a second filter. One was already removed for being
   invisible duplication.
8. Changing a row of `doseIntervalRules.js` means changing `CLINICAL_SPEC.md` §K's table in
   the same commit. Add a table row, never an age test in the evaluator. Every adult floor
   is an OWNER determination — never cite ACIP or CDC.
9. **If the suite reports moved verdicts, do not run `npm run sweep:update` until you can
   say why those patients should get a different answer.** Then put the count in the PR.
10. **Use `analyzeBoth()`, not two `analyzeHistory()` calls**, for anything needing both
    streams.
11. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
    `main`.**
12. **Dev server:** `preview_start` fails with "Maximum 5 dev servers per folder" when other
    chats hold the slots. Those servers serve THIS working tree — find the listening ports
    (`lsof -nP -iTCP -sTCP:LISTEN | grep node`), then confirm one is serving YOUR edits by
    curling a source file for a string you just wrote
    (`curl -s localhost:PORT/PneumoVax/src/components/Results.jsx | grep orderedDoses`).
    Half the ports in this folder were serving a different tree this session.
13. **Adding a `quote` to `refs.js`:** load the page and confirm the exact string sits in a
    SINGLE leaf element. A `textContent` search is not enough — a fragment that spans
    element boundaries matches nothing and dies silently.
