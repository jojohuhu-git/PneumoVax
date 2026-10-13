# PneumoVax — Handoff after the impossible-entry work (2026-10-12)

> **Supersedes `handoff-2026-10-12-queue-small-items-and-record-problems.md`.** Its PR #40 is
> merged (`ceddabf`). Its remaining-queue **item 1** (the sweep blind spot) is DONE — it was the
> conversation the owner asked for, and it produced a second corpus. Its **item 2** is DONE in
> full: the future-dose chip is fixed in BOTH apps, the duplicate-entry port is taken (narrowed
> by a second owner decision), and the "future date of birth" finding was **wrong** — see below.
> Its **item 3** is untouched and carried forward unchanged.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/impossible-entries-coverage-and-warnings`**, off `main`, pushed, clean at
**`ac4f4e6`**. Open PR: **[#41](https://github.com/jojohuhu-git/PneumoVax/pull/41)** — four
commits, **`test` check PASSED on `ac4f4e6`**, awaiting the owner's review.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**
Baseline at session start was 693 passing / 63 files; now **743 passing (67 test files)**, all green.

Sibling repo, same session: **MeningoVax [PR #70](https://github.com/jojohuhu-git/MeningoVax/pull/70)**,
branch `fix/future-dose-chip-says-in-the-future`, pushed, **1641 passing / 136 files**, its `test`
check was still PENDING when this was written — **check it before assuming green.**

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner is a
clinician, not a coder — explain every what and why in plain English, in chat and in UI copy.

## What's done

### 1. A second sweep corpus, for records nobody could have given — `3c2612e`
Reproduced first, and the reproduction is the point: **deleting `isBeforeBirth()` outright left
`sweep-verdict-corpus.test.js` GREEN, 12 of 12**, and so did disabling `futureDated()`. The main
grid *builds* 15,340 before-birth combinations and discards them on one line, and writes every
dose as "days ago" so a future date cannot be expressed. The comment justifying the discard
claims duplicate keys would result; **measured, all 31,590 keys are unique, 0 duplicates.**

**Owner decision: a second FILE**, so 16,250 keeps meaning "patients a clinician could really
enter". `buildRecordProblemCases()` → `record-problem-corpus.tsv`, now **18,460** cases: the exact
complement of `buildCases()` (written as its skip condition negated, so they cannot drift), plus
`GRID_FUTURE_*` and `GRID_DUPLICATE_*` shapes. `npm run sweep:update` regenerates both.

### 2. One shot on two rows, and two brands on one day — `169e029`
**The sweep gate earned its keep here and the next session should read how.** Importing
MeningoVax's G7 whole moved 792 patients and broke the assertions holding **S14-4C** and
**S14-7**. Measured: of grid patients with two PCV rows sharing a date, **0 name the same product
and 910 name different products** — the whole conflict was on the second shape.

**Second owner decision, taken on that evidence — BOTH answers, not either:** same product (or
one row with no brand) → record problem `duplicate`; two different named products → **S14-4C's
wording kept word for word**, plus an added "check the record" sentence, which also reaches the
*child* shape S14-4C never did. Sweep moved **792 of 16,250 and 72 of 18,460**, and in every one
of those 864 lines the **only** field that changed is the per-dose reason count (n2→n3) —
verified mechanically by stripping every `nN` and comparing.

### 3. An impossible dose date says so as it is typed — `071a8c6`
**Owner decision: WARN, do not trap.** `DoseDateProblem.jsx`, used by **both** dose editors
(`StepHistory.jsx` and the inline one in `Results.jsx`), both asserted. The component decides
nothing — `dateEntryWarning()` in `validate.js` calls the same `futureDated` / `isBeforeBirth`
the engine grades with, and a test pins its answer to the engine's verdict for the same row.

### 4. The future-dose chip, in BOTH apps — `ac4f4e6` + MeningoVax `9b97bf9`
`D1 · May 1, 2030 · age 10 years 4 months` → `D1 · May 1, 2030 · In the future`. MeningoVax had
the identical bug; **owner decision: fix both.** Same synthetic patient in both repos' tests.

### 5. A finding that was WRONG — struck off, not worked on
The previous handoff's "a date of birth in the FUTURE is not rejected". **It is** — the age step
says *"That date of birth is in the future. Check the year"* and will not let you past. Verified
in the running app.

Every guard above was mutation-tested with the counts recorded in its commit message. All four
PneumoVax items were live-verified in the running app at desktop and 375px, no console errors.

## What's NOT done — the remaining queue

### 1. Two things to ask the owner before touching them
- **MeningoVax blocks, PneumoVax warns.** MeningoVax's history step **disables Next** on a future
  date; PneumoVax now warns and lets you through (her explicit choice). The two apps differ on
  purpose — but she has not been asked whether MeningoVax should be relaxed to match. **Ask.**
- **The two warnings look different.** MeningoVax's is a tinted box with a left border;
  PneumoVax's is plain `--r` text, matching PneumoVax's own `.age-error` for the identical
  message one step earlier. The `design-review` skill says design flows MeningoVax → PneumoVax,
  which argues for the tinted box. Recorded rather than silently applied. **Ask.**

### 2. Still open, unchanged from the previous handoff — re-read each before starting
- **`S5` / `P2-1`** — the test clock is confirmed NOT pinned. Plus `P2-13` (wire `scripts/*.mjs`
  into the suite) and `P2-11`. **Sonnet 5, Medium.**
- **`S6`** — full one-number-one-home refactor. Widest blast radius in the project. **Opus 5, High.**
- **`S9` / `P4-1`** — the dose editor is duplicated in `StepHistory.jsx` and `Results.jsx`.
  **This session made the case stronger**: `DoseDateProblem.jsx` exists precisely because that
  duplication would otherwise have produced a single-surface fix. **Sonnet 5, Medium.**
- **`S11`** — keyboard and focus; the "Date (optional)" `<label>`s are still not associated with
  their inputs. **MeningoVax has already done its keyboard queue (K1–K7)** — check it first.
- **`S7`** — largely overtaken by `src/test-grid.js`. **Needs re-scoping.**
- **`S12`** — looks DONE. Verify and strike off rather than starting it.
- **Did NOT reproduce, do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, `S10-N1`.

## Why this is a good stopping point

The four commits are independent of each other and of the older queue, CI is green on PneumoVax,
and nothing is half-built. The one item the previous handoff flagged as needing a conversation
has had it, and the answer is in the repo as a gate rather than a note. The two open questions
are both cosmetic-or-policy, not correctness.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. If PR #41 is merged, confirm
   `git log -1` is at or after that squash commit; if not, check out the branch instead.
   **Also check MeningoVax PR #70's `test` check — it was pending when this was written.**
2. Confirm the suite: **743 passing / 67 files, 0 failing.** Stop and diagnose any mismatch.
3. **Do not re-litigate** this session's decisions: the two-corpora split; duplicate = same
   product only, with S14-4C kept word for word and a sentence added; warn-do-not-trap; the chip
   wording in both apps. Plus everything earlier handoffs list (P0's date order, P1-3,
   S14-4C, PCV7-never-counts, P6-3c, S14-4B, the S8 rulebook decision, the sweep hard-gate,
   ANCHOR-1, the 2026-10-11 adult-floor determination, `A-P1-1`, the three `P0-2` decisions,
   `CLINICAL_SPEC.md` §C, the seven S14-RC decisions, W1's scope and wording).
   **Ask, don't default:** both items under "remaining queue 1".
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green →
   **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the count.**
6. **Add a rule to `recordProblemFor()` → add its shape to `GRID_DUPLICATE_*` / `GRID_FUTURE_*`
   in the same commit**, or it ships guarded by nothing, exactly as the first two did.
7. **Never `git checkout <file>` to undo a mutation on uncommitted work** — it reverts to HEAD and
   silently destroys the change you are testing. It happened twice this session; copy the file to
   the scratchpad and restore from there.
8. **A UI regression test needs two things that are easy to miss:** `// @vitest-environment
   happy-dom` as the first line, and assertions on `container.textContent` rather than
   `getByText` — the chip line is split across child elements, and a regex matcher silently finds
   nothing there, which made one negative assertion pass while the card still printed the string.
9. **Dev server:** `preview_start` with `.claude/launch.json`. **Its reported port was wrong
   again this session** (said 53440, really 5174) — read the real port from `preview_logs` and
   confirm it serves YOUR tree:
   `curl -s localhost:PORT/PneumoVax/src/components/RecCard.jsx | grep showBody`.
10. **If the suite reports moved verdicts, do not run `npm run sweep:update` until you can say
    why.** Then put BOTH counts in the PR, and say what the sweeps could not have seen.
