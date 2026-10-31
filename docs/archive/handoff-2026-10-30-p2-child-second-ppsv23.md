# PneumoVax — Handoff after P2, a child's second PPSV23 (2026-10-30)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-30-p2-child-second-ppsv23`, off `main` at `ed841e6` (PR #97 merged).
**Pushed.** PR [#98](https://github.com/jojohuhu-git/PneumoVax/pull/98) **open, awaiting her
squash-merge** (sessions cannot merge in auto mode). Baseline was **1,703** passing; now
**1,730 passing (154 files), 0 failing**, run on this tree. P2 is commit `6fcbaab`; this
handoff is the commit after it.

⚠ **The full suite takes ~41 SECONDS, not 25–40 minutes.** Measured twice on 2026-10-30
(`Duration 41.49s`). The previous handoff's warning was wrong by ~40×, and it taught
sessions to skip the one command that proves a claim. **Run the full suite every time.**

---

## What's done

### P2 — `6fcbaab` — a child's second PPSV23 inside five years
Full write-up: `CLINICAL_SPEC.md` **§C-P2**. Guard:
`regression-p2-2026-10-30-child-second-ppsv23.test.js` (21 tests, all hand-built children —
the grid dates no two PPSV23 doses inside five years).

| Child | Now | Ruling |
|---|---|---|
| Leo, 10, asplenia, 2nd PPSV23 2 months early | counts, note *"…Counted; never give a third"*; card complete + "came early" sentence | owner 2026-10-29 |
| Ava, same, cochlear implant | **extra dose** — not needed, not counted, nothing to repeat | owner 2026-10-30 |
| Sofia, 18, asplenia, PPSV23 ×2 **then** PCV13 | **PCV20 only** (no third PPSV23) | owner 2026-10-30 |
| Zoe, 14, asplenia, PCV13 **then** PPSV23 ×2 | complete (was wrong on main, even on time) | control she was shown |

- **The 4-day grace stays** on `CHILD-PPSV23-AFTER-PPSV23` — owner decision 2026-10-30, the
  ONE recommendation row with a grace, pinned by name (`GRACED_RECOMMENDATIONS` in
  `rule-docs-match-code.test.js`). Without it 708 grid patients moved, 22 of them adults.
- **Two rows now**, split on `anchorCounted`: after a COUNTED PPSV23 → recommendation (P2);
  after a REJECTED one → `CHILD-PPSV23-AFTER-INVALID-PPSV23`, the old floor, byte-identical
  chip text to main (Ruling D).
- Verdict corpus **96 / 17,016** moved (all Sofias); record-problem corpus **0 / 18,264**.
- `uncreditedSources.mjs`: **0** pairs over 17,311 cards (−96 = the Sofias' removed card).
- 7 mutations, each caught: 5 / 8 / 5 / 3 / 19 / 4 / 1 failing tests.
- Driven in the app: Ava, Leo (chip + card "Why this"), and the rules page's two new rows.

Six judgement calls are listed in the PR body for her audit — chiefly Ava's sentence wording
(states CDC's reason instead of "complete") and the cautious reading for PPSV23s on both sides
of the conjugate (keeps PCV20; moves no grid patient).

---

## What's NOT done — the remaining queue

### Owner questions — ask with a patient, inside the question box, don't default
1. **Widen Ava's ruling?** A non-IC child's **on-time** second PPSV23 is just as unneeded,
   but still counts silently. She ruled on the early one only.
2. **Ruling D on a PPSV23 (noticed, not changed):** a child whose first PPSV23 was rejected
   (4 weeks after a PCV) is told the repeat can come **5 years** later. Possibly not intended.
3. **Group B (640 cards) — carried over, still "think about it".** An at-risk child whose card
   says "complete" at 18 is owed a dose at 19 (Maya, cochlear implant, PCV13 at 7y11m, PPSV23
   at 12y11m). Not a copy of the age-50 line. Detail: the superseded handoff below.

### Queue
- **P4** — the supplemental PCV20 at 24–51 days: offer "count it and document", **withheld
  for immunocompromised and asplenic children**. Default (repeat) is already right.
- **"Also state the minimum"** — every card advising a date states the true earliest beside
  it (shape approved 2026-10-23 for infants). Largest remaining item. Not started.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`) — she is thinking about design;
  no instruction yet. Two gaps named to her: it covers recorded-dose validity only, and its
  "who says so" has two tiers where her tables use three (expert opinion / literature).
- **Do not re-raise:** the eleven new references (closed 2026-10-26); `mmwr7203a1` on cards
  (closed 2026-10-29).

## Why this is a good stopping point
P2 is complete as one unit, every surface checked (chip, card, rules page, spec), and both
corpora explained. Nothing in the queue depends on it except owner question 1, which only
widens it.

## Resuming
1. If PR #98 is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. `npm test` — confirm **1,730 passing (154 files)** before new work. ~41 seconds.
3. Ask the owner questions above first, one patient each, the whole scenario in the box.
4. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break the fix several ways (Python exact replace with an
   `assert count == 1`, restore from a scratchpad copy and byte-compare) → drive the app →
   commit per item → PR → **she squash-merges**.
5. ⚠ Measure the blast radius **against an untouched copy of main** (`git worktree add`),
   grouped by kind of patient, before asking her anything — P2's first draft moved 708
   patients the handoff said did not exist, because the old rule's grace hid them.
6. ⚠ The grid cannot build a vaccinated child aged 2–18 or two PPSV23 doses inside 5 years.
   Hand-build. In the app, recorded-dose chips sit inside the closed card — open it.
7. Dev server: `preview_start` "PneumoVax dev server"; read the real port from the logs
   (5174 today). Dose fields use `useId` ids — `getElementById` + native setter.
