# PneumoVax — Handoff after the invalid-adult-dose rule was built (2026-10-24, session 2)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
⚠️ **read the real port from `preview_logs`**: `preview_start` reported 54651 this session and
the server was actually on **5174**. Navigating to the reported port fails outright.

Branch: **`fix/2026-10-24-adult-early-dose-families`**, off `main` at `97277a7`, **pushed and
in sync**. Working tree **clean** at `74672a6`. Suite **1,505 passing in 136 files, 0
failures, 0 skips** (`npx vitest run --reporter=json`, run after the final commit).

[PR #84](https://github.com/jojohuhu-git/PneumoVax/pull/84) **open, NOT merged** — the owner
squash-merges; a session agent cannot. Title and body were REWRITTEN this session because the
PR's net effect is now the opposite of what it originally claimed. CI (`test`) was still
running when this was written — **check it before anything else.**

[PR #85](https://github.com/jojohuhu-git/PneumoVax/pull/85) (`docs/2026-10-24-invalid-dose-ruling`)
is also still open and its headline is now **WRONG**: it says Ruling F "splits at 1 year".
It does not — see item 1. Its other content holds. **Close it, or merge it and let this
session's decision doc supersede it.** Owner's call.

Consumed: `handoff-2026-10-24-invalid-dose-scheduling-ruling.md` (lives only on PR #85's
branch — the "handoff on an unmerged branch goes missing" failure, third occurrence).

## What's done

The owner made **nine rulings** across two question rounds. All are recorded verbatim with
citations in `docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md` — read that
before touching any of this.

1. **Ruling F STANDS WHOLE** (`868d01f`, unchanged from `main`'s predecessor). All 363 adult
   conjugates given sooner than 5 years after a PPSV23 still count. She was shown the 363
   decomposed four ways and chose "complete" for every group. Her ground generalises:
   **validity only matters when a dose was OWED.** It does NOT split at 1 year.
2. **Families 2 and 3 REVERTED** (`04a74df`) — an adult conjugate under 1 year after a PPSV23,
   and an adult PPSV23 early after a PCV15, are **invalid** again. Case H re-rejected.
   210 verdicts back (132 + 78). Guard:
   `regression-2026-10-24-families-2-3-reverted-ruling-f-kept.test.js`.
3. **The repeat rule, on the dose chip** (`e7ccca3`). What an invalid adult dose leaves owing
   is **1 dose of PCV20 or PCV21** — never a repeat PPSV23, never PCV15. The date is the later
   of two clocks (last valid dose; the invalid dose), each using the interval owed between
   that vaccine and the conjugate now due. **One year for every adult risk group** — her words:
   *"can you use 1 year for adults and 8 weeks for pediatrics with risks?"* Children untouched
   and measured so. Guard:
   `regression-2026-10-24-invalid-adult-dose-owes-a-conjugate.test.js`.
4. **The second PPSV23 keeps its 5-year date** and gains her emphasised alternative offering
   PCV20/21 at 1 year, with both reasons and ACIP named twice (same commit).
5. **The recommendation card now agrees with the chip** (`74672a6`), names the conjugate, and
   says which of its numbers is stated by ACIP and which is read across. 188 verdicts moved.
   Guard: `regression-2026-10-24-card-and-chip-agree-after-an-invalid-dose.test.js`.
6. **`CLINICAL_SPEC.md` §K-INVALID** written (same commit) — her four steps verbatim, both
   citations, the standing of each number, and the two families held out.

Totals: **398 of 17,016 verdicts moved** (210 revert + 188 card), **66 of 18,264**
record-problem rows (reason count only — field-level diff proves no verdict moved). Prose
diffs, mutation counts and the live-app verification are in each commit message and the PR
body; **re-measure, never quote them from here.**

## What's NOT done — the remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P0 — OWNER DECISION** | **`ADULT-PPSV23-AFTER-PCV13`, 402 patients** | Same clinical shape as family 3; the previous handoff's "clearest defect" (the chip repeats a PPSV23 when the valid history, PCV13 alone, owes a conjugate). The CHIP is already fixed by item 3; the CARD is deliberately not. Widening moves verdicts in a family she has not seen, so her 2026-10-18 rule sends it to her. **The boundary is pinned EXACTLY at 188 in the card guard** — widening fails that test, which is intended. |
| **P1 — OWNER DECISION** | **Children** | Every ruling above is adult-shaped. She confirmed the adult/paediatric split of the interval, but *what a child is owed* after an invalid dose has never been asked. Worked case to put to her: **C1** — 5y asplenia, PCV20 2026-06-01, PPSV23 2026-06-22 (21 days, floor 8 weeks). The app today repeats the PPSV23 on 2026-08-17. Under the adult ruling she would be owed PCV20/21 instead — but PCV20 is already on her record, so the adult shape does not transfer. **Ask with a worked child; do not carry the adult numbers across.** |
| **P1** | **The corpora cannot see a repeat date** | `doseVerdict` in `src/test-grid.js` records `earliestValidDate` and **not** `repeatDueDate`, so any change to a repeat date is invisible to both sweeps. That is why item 3's mutation counts are 2s and 3s while item 5's are 20s. Adding the column is a real improvement; it will mark every corpus row as moved, so do it in its own commit with a field-level diff showing 0 real changes (see the "corpus column drops" memory). |
| **P1** | **`ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` (210) and `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` (45)** | The 8-week IC rows. The second is already inside the new card rule (item 5, 15 patients moved); the first is not. Measured counts in `decision-2026-10-24-the-adult-floors-that-remain.md`. |
| **P2** | Patient E's "of 3"; overdue children read oddly ("due at age 4 months" on a 12-month-old, pre-existing on `main`); chips print ISO dates while cards print `Dec 7, 2026`; dead `advisory` flag; `intervalWords().adj` has no consumer | All wording/cosmetic, none clinical. |
| — | **MeningoVax: the owner wants the same audit there** — *"I will eventually need to go to meningovax to do the same audit."* Not started. Consult `vaccine-parity` first. | |

**Closed, do not reopen:** Ruling D, C11, case H, Ruling F (do NOT split it at 1 year — PR
#85 says otherwise and is wrong), families 2 and 3, PR #83's questions, the flat-8-week second
clock (declined, with her reason recorded), the Job Aid's last uncredited statement (1,584
cards — she asked for it not to be re-raised).

## Why this is a good stopping point

Every one of her nine rulings is implemented, measured, guarded and written into the rulebook,
and the two surfaces that disagreed now agree — verified by driving the app, not only by tests.
The three remaining items are each gated on an owner decision or are independent
infrastructure; none blocks the others. The branch is pushed and its PR body carries every
number and every judgement call she needs to audit in one place.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout fix/2026-10-24-adult-early-dose-families`
   — **branch fresh off `main` if PR #84 has merged**; a branch stacked on an unmerged PR
   produced the 2026-10-23 squash-merge conflict.
2. `npx vitest run --reporter=json` — confirm **1,505 passing in 136 files** before any new
   work. For the file count use `len(testResults)`; pipe to `tail`, never `head`.
3. **Check PR #84's `test` check** — it was still running when this was written — and **settle
   PR #85** (its Ruling F headline is wrong).
4. **Three owner decisions, in this order. Ask, do not default:** the 402-patient
   `ADULT-PPSV23-AFTER-PCV13` card; the paediatric question with patient C1 worked; and whether
   to add `repeatDueDate` to the corpora.
5. Per item: reproduce → failing test (quote the pre-fix count) → fix → `CLINICAL_SPEC.md` in
   the same commit → full suite → **break the fix more than one way and quote the counts** →
   `node scripts/proseDiff.mjs dump <file>` on both sides (plain `node`, NOT `vite-node`; it
   takes an outfile argument), compared field by field → **drive the running app** → commit per
   item.
6. Push/merge: **branch → PR → the owner squash-merges.** A session agent cannot merge.
7. If `~$INICAL_SPEC.md` appears (a Word lock file), **never commit it** — the root-hygiene
   hook correctly blocks it.

## Two traps this session paid for, both already in CLAUDE.md's spirit

- **A guard that binds a claim to one card fails on a correct card.** It happened twice more
  here: the note-emphasis test pointed at family 3's card (deleted by the revert), and the new
  boundary test checked for "completes the series", which the IC patient's *correct* mm7401a1
  card also says. Narrow every absence claim to the sentence that actually marks the thing.
- **Narrowing a card's sources removes documents that genuinely speak.** Scoping the new card
  to CDC's adult notes took mm7401a1 off 132 cards and the job aid off 56 that each state one
  of its sentences. FINDING F's own guard caught both. `scripts/uncreditedSources.mjs` cannot
  see this class — it only looks at documents already ON a card.
