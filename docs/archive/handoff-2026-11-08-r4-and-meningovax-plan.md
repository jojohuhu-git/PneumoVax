# PneumoVax — Handoff after R4 and the MeningoVax port plan draft (2026-11-08)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Read `CLAUDE.md` first.

**Supersedes** `handoff-2026-11-08-why-this-wording.md` and `handoff-2026-11-08-wording-tidy-ups.md`
(both carry a superseded banner).

Branch `fix/2026-11-08-r4-thrown-out-ppsv23`, off `main` at `d541e8f`, with `main` merged in after
PR #146 merged. Pushed; **PR #147** into `main`. **She merges** (memory `cannot-merge-prs-in-auto-mode`).

Baseline on `main` before this branch: **2,467 passing**. Now **2,481 passing, 0 failed, 0 skipped** (vitest JSON
reporter, `.claude/**` excluded). Working tree clean after the handoff commit.

## What's done

| Item | What changed | Commit |
|---|---|---|
| **R4, shapes 1 and 2** | The line under a thrown-out childhood PPSV23 drops "Next dose from <date>" when no card asks for a PPSV23 and none offers PCV15 (Ana, 19). Option B's PPSV23 step is dated by the 5-year hold only when the hold ends after the 8 weeks following Option B-1 (Ben, 6). `CLINICAL_SPEC.md` §C-P2-R4. Measured: 51 / 17,016 verdicts and 48 / 18,264 record-problem rows, each checked field by field; 99 / 35,280 prose lines, each one dropped sentence; whole-app R4 57 + 60 → 16 + 0, 0 unsorted. Live-checked (Ana, Ben). | `4426849` |
| **R7 leftover** | The baby with smoking or alcohol use ticked is now `class: 'ruling'` in `scripts/wholeApp/causes.mjs`. Owner, 2026-11-08: *"you can remove any planning for impossible cases such as a baby with smoking clicked."* No app change. | `4426849` |
| **R4 shape 3, Max** | OWNER RULING 2026-11-08, *"PCV20 only"*: the 24–71-month catch-up card offers PCV20 alone after one PPSV23 thrown out for coming too soon after a PCV (Kai's rebuild of that card). The PCV15 condition in shape 1's rule became unreachable and was removed. Measured: 16 / 17,016 and 40 / 18,264, each only PCV15 off the card and the PPSV23 line's date gone. **All seven whole-app checks now 0 over 77,496 patients.** `run.mjs` no longer exits 1 on the two "info" groups. Live-checked. | Max commit (after `4426849`) |
| **MeningoVax port plan** | Draft: `docs/archive/plan-2026-11-08-meningovax-port.md`. Her goal statement verbatim; what MeningoVax has against each part; **a 58-row table of every PneumoVax presentation and practice decision** (A dose labels and lines, B the card, C sources and superscripts, D the Rulebook page, E safety nets), added at her request, **and a ledger marking all 82 PneumoVax commits since MeningoVax last changed** (each read: 7 in full, 75 to the end of their opening); eight steps (safety nets first); six owner decisions. | handoff commit |

## What's NOT done

**Needs her decision (asked in the PR body and at the end of the session):**
- **The MeningoVax plan's six decisions** (order; Ruling D; routine date beside the minimum; fold; MeningoVax-only labels; early meningococcal doses).

**Still open, possible but rare (not to be raised unasked):** P2-PARK-1 (adult words name the last
dose, the date counts from the last that counted; 164 grid, 0 typical); Leah's card with two invalid
PPSV23; the unvaccinated-to-6 PCV15 row; the mixed history; P4.

**Dropped by her ruling today (impossible patients — do not carry forward):** the baby with smoking
or alcohol use; the future-dated PPSV23 the form cannot enter; the under-5 child with smoking or
alcohol use and no review line.

**Small, needs her only to shorten:** the 23 "Why this" paragraphs over 60 words (from #146's handoff).

**Not checked:** whether the adult branch of `adultRepeatAfterInvalidDose` / `adultRepeatDueDate`
in `doseIntervalRules.js` is unreachable since PR #90 (carried from #146's handoff).

## Why this is a good stopping point

R4 is fully fixed, and the whole app has no open problem left on any of its seven checks over
77,496 patients. The MeningoVax plan is a draft waiting on her, and touches nothing.

## Resuming

1. `gh pr view 147 --json state`. Once it has merged: `git checkout main && git pull`, then run the
   suite and expect the passing count recorded at the top of this file.
2. If she approved the MeningoVax plan: read `CLAUDE.md` in `~/Downloads/MeningoVax-main`, add a
   pointer file there to the plan, and start with step 1 (safety nets) on a branch with a PR, even
   though its `main` is unprotected.
3. Dev server: `preview_start {name: "PneumoVax dev server"}`. This session it came up on **5174**
   (5173 was taken); read the port from `preview_logs`.
