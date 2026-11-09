> **SUPERSEDED 2026-11-08** by `handoff-2026-11-08-r4-and-meningovax-plan.md`. Do not resume from this file.

# PneumoVax — Handoff after the "Why this" wording pass (2026-11-08)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Read `CLAUDE.md` first.

Branch `fix/2026-11-08-why-this-wording`, PR #145 into `main`. It was built on #144, which she squash-merged
the same evening. `main` was then merged into this branch; the file tree was identical before and after, so
nothing moved. **She merges.**

Baseline on #144: **2,463 passing**. Now **2,467 passing, 0 failed** (vitest JSON reporter, `.claude/**` excluded).

## What's done

| Item | What changed | Commit |
|---|---|---|
| **WHY-THIS** | She approved five sample rewrites (*"Yes, rewrite all"*). Every card's "Why this" now follows the §M-L3 style rules. Wording only: 0 verdicts, dose labels, dose lines or citation lists moved. The longest paragraph went from 118 to 92 words. Paragraphs over 60 words went from 36 to 23. New guard sweeps all three test sets. `CLINICAL_SPEC.md` §M-L5. Inventory scripts: `scripts/wordingAudit/whyParagraphs.mjs`, `whySentences.mjs`. | `80c9652` |

Checked in the running app: a healthy 10-year-old and an asplenic 9-year-old (PCV13 ×4, one PPSV23). The new wording shows, the citation numbers match their buttons, and there are no console errors.

## What's NOT done (offer, don't do unasked)

- **Sentences that stay in view above "Why this"** were left alone, as she was told. One still has a semicolon
  and two dashes (`recommend.js`, the "This child has already had a PPSV23 …; the further dose — PCV20 or a
  second PPSV23 — waits" line).
- **Whole notes on "Complete" / "Not indicated" cards** (shut by default) still say "CDC's row for …" in
  places. One example is the Maya/Noah complete cards pinned in `regression-p2-2026-10-30-child-second-ppsv23`.
- 23 "Why this" paragraphs still run over 60 words. Mostly that is the folded lead plus the PCV15 sentence on
  rare histories (a product not recorded).

**Carried from earlier handoffs, unchanged:**
- Whether `childLines.mjs` should become a test (offer only).
- The rare cases she asked not to have pushed (future-dated PPSV23, the baby with smoking/alcohol,
  P2-PARK-1).
- MeningoVax waits until PneumoVax is done.
- R4 (117) and R7 (208) in the whole-app checks.

## Resuming

1. Check `gh pr view 145 --json state`. Once merged: `git checkout main && git pull`,
   then run the suite and expect **2,467 passing**.
2. Ask her what she wants next.
