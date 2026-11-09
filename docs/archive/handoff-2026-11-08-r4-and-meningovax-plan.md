# PneumoVax — Handoff after R4 and the MeningoVax port plan draft (2026-11-08)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Read `CLAUDE.md` first.

**Supersedes** `handoff-2026-11-08-why-this-wording.md` and `handoff-2026-11-08-wording-tidy-ups.md`.
The second lives only on PR #146's branch until that PR merges; once it does, add a superseded
banner pointing here.

Branch `fix/2026-11-08-r4-thrown-out-ppsv23`, off `main` at `d541e8f`. Pushed; **PR #147** into
`main`. **She merges** (memory `cannot-merge-prs-in-auto-mode`). PR #146 (wording tidy-ups) is also
open; the two touch different lines of `recommend.js` and `CLINICAL_SPEC.md`.

Baseline on `main`: **2,467 passing**. Now **2,474 passing, 0 failed, 0 skipped** (vitest JSON
reporter, `.claude/**` excluded). Working tree clean after the handoff commit.

## What's done

| Item | What changed | Commit |
|---|---|---|
| **R4, shapes 1 and 2** | The line under a thrown-out childhood PPSV23 drops "Next dose from <date>" when no card asks for a PPSV23 and none offers PCV15 (Ana, 19). Option B's PPSV23 step is dated by the 5-year hold only when the hold ends after the 8 weeks following Option B-1 (Ben, 6). `CLINICAL_SPEC.md` §C-P2-R4. Measured: 51 / 17,016 verdicts and 48 / 18,264 record-problem rows, each checked field by field; 99 / 35,280 prose lines, each one dropped sentence; whole-app R4 57 + 60 → 16 + 0, 0 unsorted. Live-checked (Ana, Ben). | `4426849` |
| **R7 leftover** | The baby with smoking or alcohol use ticked is now `class: 'ruling'` in `scripts/wholeApp/causes.mjs`. Owner, 2026-11-08: *"you can remove any planning for impossible cases such as a baby with smoking clicked."* No app change. | `4426849` |
| **MeningoVax port plan** | Draft: `docs/archive/plan-2026-11-08-meningovax-port.md`. Her goal statement verbatim, what MeningoVax has against each part of it (read from the code, not yet measured), eight steps (safety nets first), four owner decisions. Nothing in MeningoVax changed. | handoff commit |

## What's NOT done

**Needs her decision (asked in the PR body and at the end of the session):**
- **R4 shape 3, "Max".** Max is 5, with no spleen. One PCV (product not recorded) and a PPSV23 were given on the same day a year ago, so the PPSV23 doesn't count. The 24–71-month catch-up card offers PCV20 or PCV15, saying "add PPSV23 ≥8 weeks after" a PCV15. But a PPSV23 is held to Oct 2030 (§C-P2-FIVE), and after a PCV15 the next card gives PCV20 instead (§C-P2-ONE's answer), so choosing PCV15 costs one extra shot. Options: **PCV20 only** (as Leah, Sam, Kai), or keep PCV15 and say on the card that PCV20 follows it. 16 grid children, 0 typical. Guarded: the check-5 pin in `whole-app-forward-checks-gate.test.js` is at exactly 16 grid / 0 typical.
- **The MeningoVax plan's four decisions** (order; Ruling D; routine date beside the minimum; fold).

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

R4 is fixed as far as it can go without her; the shape left is hers to decide and is pinned. The
whole app now has one open problem (that shape) over all 77,496 patients. The MeningoVax plan is a
draft waiting on her, and touches nothing.

## Resuming

1. `gh pr view 147 --json state` and `gh pr view 146 --json state`. When both have merged:
   `git checkout main && git pull`, then run the suite and expect **2,474** plus #146's own count change (none: #146 added no tests).
2. If she answered Max: follow `fix-queue` (re-run Max first, failing test, fix, full suite, both
   corpora with every move explained, whole-app checks, live check). Lower the check-5 pin to 0 and
   drop R4 from the allowed set.
3. If she approved the MeningoVax plan: read `CLAUDE.md` in `~/Downloads/MeningoVax-main`, add a
   pointer file there to the plan, and start with step 1 (safety nets) on a branch with a PR, even
   though its `main` is unprotected.
4. Dev server: `preview_start {name: "PneumoVax dev server"}`. This session it came up on **5174**
   (5173 was taken); read the port from `preview_logs`.
