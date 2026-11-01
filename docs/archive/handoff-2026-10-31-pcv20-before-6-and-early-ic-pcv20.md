> **SUPERSEDED (2026-10-31, late)** by `handoff-2026-10-31-at-risk-toddler-finished-series.md`. Its PR (#105) is merged; the undated-PCV20 item is mostly answered there, and the queue is re-ordered around a typical-patient sweep. Resume from the newer file.

# PneumoVax — Handoff after the before-6 wording fix, the early IC PCV20 note, and closing "state the minimum" (2026-10-31, night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `feat/2026-10-31-also-state-the-earliest-date`, off `main` at `9c45ebd` (PR #104,
squash-merged). Pushed with this handoff; a PR is open for **her squash-merge** (sessions
cannot merge in auto mode). Baseline was **1,869** passing (169 files); now **1,885 passing
(171 files), 0 failing**, run on this tree. 0 uncredited source pairs over 17,311 cards.

---

## What's done

1. **`e3ce333` — §B-PCV20-AFTER-BEFORE6, a false sentence found while measuring.** An
   8-year-old with diabetes, four PCV13 as a baby, PCV20 at 7: the card said her PCV13s were
   "given at or after age 6 years" and quoted CDC's row for that opposite history. Cause: the
   card's before-6 test counted the PCV20 itself. `summarizePcv()` now carries `priorBand`
   (the non-PCV20/21 doses: how many were at ≥6, how many undated); when neither, the card
   says "were all given before age 6" and cites the Age 6–18 (or 2–5) "Received PCV before
   age 6 … Not previously received PCV20" row in her class's words. The age-band choice moved
   into one shared function, `before6NoPcv20RowKey()`. The dose and verdict didn't change, so
   this followed the 2026-10-18 rule, and she also said "fix it first". 0 verdicts / 0 prose
   lines moved (the grid has no such child). Guard:
   `regression-2026-10-31-pcv20-after-baby-doses-says-before-6.test.js`, 8 mutations caught.
2. **`ad40af6` — §K-IC-PCV20-5Y, owner ruling "Add a note".** An IC child's PCV20 given
   before CDC's 5 years after the first PPSV23 counted silently, while an early second PPSV23
   got a note. CDC Risk-based page read live 2026-10-31. **The note is the card's own answer:**
   `recommend()` runs the patient on the dose date with only the earlier doses and notes the
   PCV20 only if that card was holding it to 5 years (`earlyFiveYearPcv20`). A
   `DOSE_INTERVAL_RULES` row was tried first and disagreed with the card both ways (105 false,
   159 missed), so it was reverted. **Moved 108 / 17,016 verdicts**: each one only a PCV20 dose
   gaining the note (earlyAdvisory 0→1, +1 reason), checked field by field. 0 / 18,264
   record-problem rows. 108 / 35,280 prose lines, each differing only by the note. Corpus
   regenerated. Guard: `regression-2026-10-31-ic-child-early-pcv20-gets-a-note.test.js` (grid
   sweep pinned at 612 / 102 / 0 / 0). 10 mutations; 6 redundant checks removed.
3. **`777fb18` — "Also state the minimum" CLOSED by owner decision "Leave them".** Measured:
   3,235 non-infant cards advise a future date. 511 are only the 4-day grace. ~2,080 adult
   cards and ~590 IC-child cards would count an early dose any day. 48 are 18-year-olds turning
   19. An earliest date stays on babies' cards only. Recorded in `CLINICAL_SPEC.md` §L-2.

Both fixes were checked in the running app (8-year-old with diabetes; 6-year-old with
asplenia, PCV20 a year after PPSV23), with no console errors. The preview limit was full (5
servers from other chats in this folder), so I attached the browser pane to the existing
server on **5178**, which serves this folder.

## What's NOT done

### Owner questions (new, from this session)
- **A mixed history** (case (a), no document has a row): PCV13 as a baby **and** at 8, then
  PCV20 at 10. The card still says "given at or after age 6 years", which is false for the baby
  dose. Neither CDC row fits in full. Ask her with that patient; the card is unchanged until she
  answers. Noted in `CLINICAL_SPEC.md` §B-PCV20-AFTER-BEFORE6.
- **An undated PCV20 seems to be ignored** (seen, NOT investigated). A 4-year-old with diabetes,
  four baby PCV13 and a PCV20 with no date: the card says "no PCV20" and offers Option A
  PCV20 again. This is the behaviour on `main` too. Reproduce before raising it; it may be the
  deliberate "undated doses are not placed" policy, or a real gap.
- Carried over, for her audit only: the adult card at 19 for a three-PPSV23 adult uses ACIP's
  two-dose row.

### Queue (carried over)
- **P4**: the supplemental PCV20 at 24–51 days. Offer "count it and document", withheld for
  immunocompromised and asplenic children. Engine run on 2026-10-31: a 2-year-old with diabetes,
  PCV20 36 days after a 22-month PCV13, is rejected with "It is not repeated; the next dose …
  from Oct 20, 2025", and the card offers Option A PCV20 / B PPSV23.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about the design.
- **Do not re-raise:** "also state the minimum" (closed today); the eleven new references;
  `mmwr7203a1` on cards; the timing of the PCV20/21 stand-in after a PCV15.

## Why this is a good stopping point
All three of her answers from today are built, guarded, specced and checked in the app. The
two new owner questions are about other histories and block nothing.

## Resuming
1. If the PR is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. Run the suite and confirm **1,885 passing (171 files)**. Use
   `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`.
3. Ask her which next: the mixed-history question, the undated-PCV20 check, or P4. Don't
   default. Put the patient inside the question box, in plain words.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → break each clause separately (python exact replace, restore from a scratchpad copy,
   `cmp`) and **remove any check that survives** → drive the app → commit.
5. Measure against untouched `main`: `git worktree add <scratch>/pv-main origin/main`, symlink
   `node_modules`, then `node scripts/proseDiff.mjs dump` (use **node**, not vite-node: under
   vite-node it writes nothing and says nothing).
6. Dev server: `preview_start` "PneumoVax dev server". If it refuses (5 servers from other
   chats), `lsof -nP -iTCP -sTCP:LISTEN | grep node` and `navigate` to a PneumoVax one; they
   all serve this folder. Enter patients with the native value setter and `requestSubmit()`.
   Click a checkbox's `input` once only: `input?.click() ?? label.click()` clicks twice.
7. Branch → PR → her squash-merge. Never push to `main`.
