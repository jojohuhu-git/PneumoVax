> **SUPERSEDED (2026-11-01, later the same day)** by `handoff-2026-11-01-rules-page-live-and-thrown-out-ppsv23-timing.md`. Its open owner question (advise or require the conjugate wait after a thrown-out PPSV23) was answered — advise only — and built as §K-THROWNOUTTIMING; the rules-page canvas it mentions is now built (PR #114). Do not resume from this file.

# PneumoVax — Handoff after the rules-page engine check, the PCV7 chip and §C-P2-FIVE (2026-11-01)

Repo: `/Users/joannehuang/Downloads/PneumoVax` — client-side pneumococcal decision support.
Branch: `fix/2026-10-31-ppsv23-repeat-five-years`, off `main` (`e4ac542`). **Pushed**;
[PR #113](https://github.com/jojohuhu-git/PneumoVax/pull/113) is open, mergeable, CI `test`
green. `main` is protected: branch → PR → the owner squash-merges (auto mode cannot merge).
Baseline on `main` was 1,982 passing; this branch is **1,997 passing, 0 failing (180 files)**,
working tree clean at `12db23f` before this handoff's commit.

## What's done

1. **Rules-page canvas checked against the engine** — the Design canvas
   https://claude.ai/artifact/FTAgbULXSHK8GNKQ5WUDe6 (now v19). About 45 patients were run
   against every clinical sentence on its five boards. The sentences that disagreed with
   the app were reworded:
   - healthy 5–18 reads "Not indicated";
   - an invalid PCV "is not repeated" (the next dose takes its number);
   - dose 4 before 12 months is labelled "Dose 4 of 5";
   - the dose-label key gained Booster, "Extra dose? — no date recorded" and PCV7's chip.

   The Sources board counts match `SOURCE_GROUPS` exactly. No app code changed for this.
2. **PCV7 chip reads "Not counted"** — owner decision 2026-10-31, reversing S14-6
   ("Off-window - repeat"). `doseChipLabel.js`, `CLINICAL_SPEC.md` §K. **Merged as #112.**
3. **§C-P2-FIVE — a child's PPSV23 after any earlier PPSV23 waits 5 years** — owner ruling
   2026-10-31, reversing the 8 weeks of §C-P2-REPEAT (Noah) and §C-P2-GREY (Sam). Commit
   `12db23f`, PR #113. Four changes:
   - `CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST` changes from 8 weeks to 5 years.
   - The repeat date for a child's thrown-out PPSV23 is 5 years from that dose.
   - `holdPpsv23AfterThrownOut()` holds every child PPSV23 card to 5 years after a
     thrown-out dose.
   - `earlyFiveYearPcv20` now reads only the PCV card.

   Measured against main:
   - 934 / 17,016 verdicts, 312 / 18,264 record-problem rows and 369 / 35,280 rendered
     lines moved, in three families, all explained in the spec and the PR body.
   - Six mutations were each caught (2–11 tests failing).
   - Verified in the running app (the toddler's PPSV23 shows "eligible Sep 15, 2031").
   - Guard: `regression-2026-10-31-ppsv23-repeat-waits-five-years.test.js`.

## What's NOT done

- **OWNER QUESTION, open (she said she'll take it up in a new conversation).** She wrote:
  *"For Noah and Sam - they should be given PCV20 8 weeks after the second PPSV23 dose…
  They would need to meet the minimum requirement interval for PCV to PCV as well as
  PPSV23 to PCV."* Her **Eli and Rosa rulings** (§K-PPSV23THENPCV, 2026-10-31) say a
  thrown-out PPSV23 holds off no conjugate: Eli's PCV20, given 33 days after one, counts.
  So which does she mean?
  - **Advise only:** the card advises the conjugate ≥8 weeks after a thrown-out PPSV23,
    and an earlier one still counts.
  - **Required:** the dose check also throws an earlier one out, which reverses Eli and
    Rosa.

  It makes no difference to Noah or Sam (their 8 weeks is long past). It moves the
  toddler's PCV20 from today to Nov 10, 2026. The single home for the hold is
  `lastPpsv23HoldingAConjugate()` / `ppsv.holdDate`. **Ask, don't default.**
- **PR #113 awaits her merge.**
- **Rules-page redesign:** the canvas still awaits her review. Nothing is built into
  `Rulebook.jsx` / `src/data/rulebook.js`, and the CDC re-read of its sentences is still due.
- **Known leftover, pre-existing.** A 5-year-old with asplenia, a PCV20 and a same-day
  PPSV23 has a card owing a PCV catch-up dose. Her PPSV23 label still says "the next dose
  in this series can be given from <date>". The date is now right (5 years); the sentence
  is still pointless on that card. Not raised with her (a rare history).
- Older parked items, unchanged from `handoff-2026-10-31-early-dose-check-leah.md`:
  - Leah's at/after-6 card with two thrown-out PPSV23s;
  - P4;
  - the unvaccinated-to-6 PCV15 row;
  - the mixed history.

## Why this is a good stopping point

Both owner rulings from this session are built, guarded, measured and in a green PR (one
merged). The open question touches only the conjugate's advised date, a different rule
from what #113 changed. Nothing in #113 depends on the answer.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull` (if #113
   is merged; otherwise ask her to merge it).
2. `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`. Expect
   **1,997 passing**. In zsh, don't pass several test files in one variable.
3. Put the advise-or-require question to her with Eli and the toddler as worked patients.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → break each clause (restore from a scratchpad copy, `cmp`) → measure vs `main`
   (`git worktree add <scratch>/pv-main origin/main`, symlink `node_modules`, run
   `node scripts/proseDiff.mjs dump`) → `npm run sweep:update` only once every moved row
   is explained → drive the app → commit.
5. **Dev server:** `preview_start` refuses (5 servers from other chats). Ports 5173–5178
   all serve this folder, so use `preview_start {url: "http://localhost:5178/PneumoVax/"}`.
   Drive it with the native value setter and `document.forms[0].requestSubmit()`, and click
   `[aria-expanded="false"]` headers to open the card bodies.
6. Branch → PR → her squash-merge. Never push to `main`.
