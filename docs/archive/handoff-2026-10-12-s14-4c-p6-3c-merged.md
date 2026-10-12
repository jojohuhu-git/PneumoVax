# PneumoVax — Handoff after merging S14-4C and P6-3c (2026-10-12)

> ⛔ **SUPERSEDED 2026-10-12 by `handoff-2026-10-12-p0-p1-3-merged.md`.** Do not resume this
> queue. This file reaches `main` late (it sat on PR #37's branch while two further sessions
> landed), so its mtime is newer than the handoff that replaced it — it is archive, not the
> current plan. Its item **1 (the P0 row mismatch) is DONE and MERGED** (PR #38, `13b5d9c`);
> its item **2 (the sweep blind spot) is still open** and is carried forward in the
> superseding file.

> **Supersedes `handoff-2026-10-12-s8-merged-s14-4b-p2-8-p2-9-done.md`.** Both of its open
> queue items — **1 (same-day PCV20 + PPSV23 wording)** and **2 (the two uncited sources)**
> — are DONE and merged. Resume from "What's NOT done" below.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, in sync with `origin/main` at **`efc99a8`**. Nothing unmerged,
no branch waiting. PR #36 squash-merged; the GitHub Pages deploy succeeded and both
changes were confirmed present in the deployed bundle.
Baseline at session start was 585 passing; now **621 passing (54 test files)**, all green.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and in
UI copy.

## What's done

### 1. `S14-4C` — a dose given at the SAME VISIT as the completing dose — PR #36 (`efc99a8`)
A same-day PCV20 + PPSV23 read *"CDC advises at least 1 year… this dose still counts"* —
advice to fix a spacing problem that is not the problem, since **no PPSV23 follows a
PCV20/PCV21 at any interval**. S14-4B had excluded same-day to protect its "given AFTER"
wording, which protected the sentence and abandoned the verdict.

It was also an **asymmetry, not a principle**: the PCV arm already called a same-day
completing pair an extra dose *and already said "after" about it*. Both streams fixed.

- **Owner decision 2026-10-12: chip and sentence together.** Same-day joins the extra-dose
  class; new sentence *"Given at the same visit as the PCV20 (Prevnar 20) dose, which
  completes the adult series on its own: no PPSV23 was needed, and this dose does not add
  to the series."* Both sentences now live in one place (`validate.js`,
  `extraDoseSentence`).
- **The bound:** a PPSV23 an **earlier** PCV15 already owed stays counted when a PCV20
  lands the same visit — either dose finishes the series, so neither is called surplus.
- **Sweep: 144 of 16,250 moved**, 0 added, 0 removed, **0 recommendations and 0 PCV-stream
  verdicts changed**. All 144 in 4 shapes, every one an adult PPSV23 dated the same day as
  a PCV20/PCV21.
- **Corrected a false claim in the rulebook.** `CLINICAL_SPEC.md` and the rule's own
  comment said the same-day pair was the *only* pair `ADULT-PPSV23-AFTER-PCV-CATCH-ALL`
  could speak for. Measured: **324** patients reach it in 9 shapes, **180** of them
  anchored on a PCV whose **product was not recorded** — which no product-keyed row can
  ever name. That is the row's real job; the S14-7 catch-all assertion is now anchored
  there, having been moved off a completing-product pair twice.

### 2. `P6-3c` — the first per-dose verdict citations — PR #36 (`efc99a8`)
P6-3 built the whole citation mechanism and wired it to **nothing**. Now wired, and both
keys deleted from `citation-orphans.test.js`'s `KNOWN_UNCITED`:
- **`immPCV7`** on the PCV7 "does not count" verdict (quote fetched live 2026-10-12 and
  added — it had none).
- **`pedsMinAge`** on the minimum-age verdicts, PCV and PPSV23, dated and undated.

**The clinical-copy rule (owner-delegated):** a `[c]` goes only on a claim the quoted
sentence supports. `pedsMinAge` states two numbers (6 weeks, 2 years), so those cite it;
**PCV21's 18 years cites nothing** — different number, different source. That control is
tested.

**`pedsMinAge`'s deep link was dead** and is fixed: its quote was CDC's heading *plus* the
parenthetical, which the page renders as two elements, so the `#:~:text=` fragment matched
nothing and silently dropped the reader at the top of the page. **No test can catch this
(it needs the network)** — see `docs/agent/architecture.md` for the by-hand check.

### 3. Owner decision recorded: **PCV7 never counts, for everyone** (2026-10-12)
The cited immunize.org sentence is scoped to *"an older teen or adult patient at increased
risk"*; the app's rule is broader. The owner was shown the gap and **confirmed the broad
rule stands**. Do NOT narrow the engine to match the citation. Reasoning is beside the
quote in `refs.js` and in agent memory.

## What's NOT done — the remaining queue

### 1. ⚠ P0 — per-dose verdicts are shown against the WRONG dose row. **Owner is taking this in a new conversation.**
`Results.jsx:105-106` passes the raw state arrays (**input order**) alongside `perDose`,
which `validate.js` sorts **chronologically** before the walk; `RecCard.doseRowsWithGroups`
pairs them **by index**. Enter doses newest-first and every verdict lands on the wrong row.

> Reproduced: `[{PCV20, 2024-01-01}, {PCV7, 2008-05-02}]`, age 40 → the **PCV20** row shows
> "Off-window - repeat" with the PCV7 explanation; the PCV7 row shows "Dose 1". Also seen
> live in the running app.

`validate.js`'s header still claims *"perDose — parallel to input"*, untrue since the sort
went in. **Open decision:** re-key verdicts to input order, or render the list in date
order (the latter also fixes the D1/D2 row numbers). A task chip holds the full write-up.

### 2. The sweep cannot see the S14-4C clinical error. **Owner wants to brainstorm this in a new conversation — ask, don't default.**
Proved by mutation: deleting the owed-PPSV23 guard fails the hand-written control in
`regression-s14-4c-same-day-completing-dose.test.js` and its UI twin, and leaves
`sweep-verdict-corpus.test.js` **fully green** — `src/test-grid.js` has no shape pairing an
earlier PCV15 with a same-day PCV20 + PPSV23. Adding that shape closes the gap but
multiplies into every age and risk profile and **moves the 16,250 figure that many docs and
tests quote**. Deliberately not taken.

### 3. `P2-9`'s follow-ups (from the coverage report). **Sonnet 5, Low–Medium.**
- `validateHistory()` is exported and called by nothing — keep or delete is an API call.
- `validate.js` still hardcodes `const minAgeM = 24` for PPSV23 — the open **`P2-12`** item.
- *(The two uncovered undated minimum-age branches named in that report are now covered by
  `regression-p6-3c-verdict-citations.test.js`.)*

### 4. `S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`. **Sonnet 5, Low–Medium.**
Unranked leftovers; several predate S14 and may be moot. Re-read each before starting.
**`S7` is cheaper now** — build its four invariant sweeps on `src/test-grid.js`.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both investigated and closed in earlier sessions.

## Why this is a good stopping point

`main` holds everything, green, deployed and spot-checked. Nothing is half-built and no
branch is waiting. The two live items are independent of each other and of the older
queue, and the owner has explicitly taken both into separate conversations.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main`. Confirm `git log -1` is **`efc99a8`**.
2. Confirm the suite: **621 passing / 0 failing**. Stop and diagnose any mismatch.
3. **Do not re-litigate:** S14-4C's chip-and-sentence decision and its owed-PPSV23 bound;
   the PCV7-never-counts confirmation (item 3 above); P6-3c's marker rule; the S14-4B
   mirror decision and its no-undated-mirror limit; the S8 rulebook decision; the sweep
   hard-gate; ANCHOR-1 and its same-day tie-break; the 2026-10-11 adult-floor
   determination; `A-P1-1`; the three `P0-2` decisions; the paediatric risk lists
   (`CLINICAL_SPEC.md` §C); the seven S14-RC decisions; `W1`'s scope and wording.
   **Ask, don't default:** queue items 1 and 2 above.
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green
   → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the
   count.** Every guard added this session was mutation-tested; do the same for the next.
6. Changing a row of `doseIntervalRules.js` means changing `CLINICAL_SPEC.md` §K's table in
   the same commit. Add a table row, never an age test in the evaluator. Every adult floor
   is an OWNER determination — never cite ACIP or CDC.
7. **If the suite reports moved verdicts, do not run `npm run sweep:update` until you can
   say why those patients should get a different answer.** Then put the count in the PR.
8. **Use `analyzeBoth()`, not two `analyzeHistory()` calls**, for anything needing both streams.
9. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to `main`.**
10. **Dev server:** `preview_start` can fail outright with "Maximum 5 dev servers per
    folder" when other chats hold the slots. Those servers serve THIS working tree, so
    `curl` the ports (`lsof -nP -iTCP -sTCP:LISTEN | grep node`) to find one answering at
    `/PneumoVax/`, confirm it is serving your edits, and drive that. Its reported port is
    also often wrong — read the real one from `preview_logs`.
11. **Adding a `quote` to `refs.js`:** load the page and confirm the exact string sits in a
    SINGLE leaf element. A `textContent` search is not enough — it spans element
    boundaries, and a fragment that spans them matches nothing and dies silently.
