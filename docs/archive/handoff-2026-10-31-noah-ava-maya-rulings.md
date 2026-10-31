> **SUPERSEDED 2026-10-31** by [handoff-2026-10-31-lily-noah-eli-sam.md](handoff-2026-10-31-lily-noah-eli-sam.md).
> All four owner questions below were answered and built (Lily, Noah, Eli/Rosa, Sam). Do not
> resume from this file.

# PneumoVax — Handoff after three owner rulings: Noah, Ava, Maya (2026-10-31)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React app for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-30-three-rulings-repeat-extra-dose-age-19`, off `main` at `6ad741b`
(PR #98 merged). Pushed with this handoff; PR opened for **her squash-merge**, because
sessions cannot merge in auto mode. Baseline was **1,730** passing; now **1,754 passing
(157 files), 0 failing**, run on this tree. Item commits: `eecd349`, `3c8a63e`, `e36842c`;
this handoff is the commit after them.

The full suite takes about 45 seconds. **Run it every time.**

---

## What's done (each asked with a patient, in the question box, and answered)

### 1. Noah — `eecd349` — the repeat of a thrown-out FIRST PPSV23 counts (§C-P2-REPEAT)
Noah, 5, no spleen: PPSV23 4 weeks after his PCV13 (thrown out), repeated 10 weeks later.
The app threw the repeat out too, at 5 years ("not until Jul 10, 2028"), and offered a
third PPSV23. Now it counts as dose 1. New row `CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST`
(8 weeks from the thrown-out dose); the 5-year row now applies only once a PPSV23 has counted.
CDC General Best Practices was read live: *"The repeat dose is counted as the valid second dose."*
**0 / 17,016** verdicts moved, **0 / 18,264** record-problem rows. Mutations caught: 6/3/3/8.

### 2. Ava — `3c8a63e` — on-time second PPSV23 for a non-IC child is an extra dose (§C-P2-ONTIME)
She widened P2: early or on time, the same "extra dose" label. **Two limits, both measured first:**
- **Ben ruling** (18, diabetes, PPSV23 at 8 and 13, PCV13 the next day): *"Yes, still wait 8
  weeks"*. An extra PPSV23 still holds off a conjugate (`CHILD-PCV-AFTER-PPSV23` now reads
  `lastPpsv23Received`). Without it, 72 conjugates would have counted and 34 cards flipped to "Complete".
- **Only a patient who is a child today.** Without that, 16 nineteen-year-olds (cochlear/CSF)
  had their card switch to ACIP's one-dose row. The dose was the same either way; this is my
  judgement inside her ruling, and it is in the PR.
**464 / 17,016** moved. All are children, and in each only the label under the 2nd PPSV23 changed
(0 conjugate verdicts, 0 cards, 0 card sentences). Record-problem 0. Mutations: 5/7/10/11.
**Also fixed, found by driving the app:** "How this was worked out" counted extra doses as
counted ("2 of 2 PPSV23 doses counted" under "it isn't counted"). This was wrong for every
extra dose since the panel was written.

### 3. Maya — `e36842c` — Group B cards say what happens at 19 (§B-AT19)
**The handoff's "640" was its own counts added wrong: it is 540.** All 540 were run forward to 19
before she was asked. They split four ways (156 dose / 282 review-at-50 / 32 two-PPSV23 /
70 unrecorded product), so she chose **one line per group**, each citing the adult row the
19-year-old's card cites (all read live). `atNineteen()` in `recommend.js` is a SECOND reading
of the adult rules, held to the first by `regression-c13-2026-10-30-what-happens-at-19.test.js`
(every card run forward to 19). 540 cards gained a line, nothing else; 0 verdicts moved.
Mutations: 4/5/5/4. CLAUDE.md's "exactly four cross-references" paragraph was updated.

---

## What's NOT done

### Owner questions: ask with a patient, inside the question box, and don't default
1. **An immunocompromised child's on-time THIRD PPSV23** still counts silently as dose 3. CDC
   never gives a third, and an early third is already "extra". Not ruled. 0 grid patients.
2. **A first PPSV23 thrown out for AGE (under 2).** Noah's 8-week row catches its repeat too.
   CDC General Best Practices puts that repeat "on or after" the minimum age, with no
   interval for a non-live vaccine. So for a dose at 22–24 months the app is up to 8 weeks
   stricter than CDC. Main asked for 5 years, so this only loosens it. 0 grid patients.
3. **The IC twin of "PCV complete (at-risk catch-up done)"** (reachable since P2) has no "at 19" line.
   It was not in her nine families.
4. Still never put to her: a PPSV23 that was **thrown out** (not extra) holds off no conjugate
   (ANCHOR-1). Ben's ruling covers an *extra* dose only.

### Queue (carried over, unchanged)
- **P4**: the supplemental PCV20 at 24–51 days. Offer "count it and document", but **withhold it
  for immunocompromised and asplenic children**.
- **"Also state the minimum"**: every card advising a date also states the true earliest date.
  This is the largest remaining item. Not started.
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`): she is thinking about the design;
  no instruction yet.
- **Do not re-raise:** the eleven new references; `mmwr7203a1` on cards.

## Why this is a good stopping point
Each ruling is one commit, checked on every surface (dose chip, card, "How this was worked
out", rules page, spec) and driven in the app. Both corpora are explained. Nothing in the
queue depends on this PR.

## Resuming
1. If the PR is merged: `git checkout main && git pull`. If not, its branch holds this file.
2. `npm test`, then confirm **1,754 passing (157 files)** before any new work.
3. Ask the owner questions above first, one patient each, with the whole scenario in the box.
4. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the same
   commit → full suite → break the fix several ways (`python3` exact replace with
   `assert count == 1`, restore from a scratchpad copy, byte-compare) → drive the app → commit.
5. ⚠ **Measure the change against untouched `main`, then group it before you trust it.**
   `git worktree add <scratch>/pv-main main`, symlink `node_modules`, then split moved patients
   by child/adult and by card-vs-chip, and run `node scripts/proseDiff.mjs` (plain `node`,
   not vite-node, or it writes nothing). Ava's first draft moved 34 cards and 16 adult
   sentences that only this grouping showed.
6. ⚠ The grid cannot build a vaccinated child aged 2–18 or a repeat after a thrown-out PPSV23.
   Hand-build those patients.
7. Dev server: `preview_start` "PneumoVax dev server". Read the real port from the result
   (5176, then 5173 after it restarted). Dose fields use `useId` ids: use `getElementById`
   plus the native value setter, and `requestSubmit()`. Rec cards start collapsed, so
   click `aria-expanded="false"`.
