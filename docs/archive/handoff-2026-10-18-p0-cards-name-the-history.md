# PneumoVax — Handoff after the four P0 citation findings (2026-10-18)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.
What the app is: client-side React SPA giving pneumococcal vaccine advice across the
lifespan. It has no backend; every clinical claim on a card must be traceable to a
document that speaks for *that patient*.

Branch: **`feature/2026-10-18-p0-cards-name-the-history`**, off `main` at `a7dc1e3`.
**Pushed**; PneumoVax's `main` is protected and requires the `test` check, so this lands
branch → PR → squash merge.
Baseline was 1,256 passing; now **1,277 passing in 112 files**, all green, no skips.
Working tree clean.

Consumed and superseded: `handoff-2026-10-18-p2016-column-fit-and-four-rulings.md`, which
for most of 2026-10-18 existed **only on the unmerged branch `docs/2026-10-18-p2016-column-fit-handoff`**
and was therefore invisible from `main`. It reached `main` as PR #70 while this PR was in
review; this branch adds its superseded banner, which is what the `origin/main` merge in
this branch resolved. Both `docs/2026-10-18-p2016-column-fit-handoff` and
`feature/2026-10-18-c8-doc3-p2016` can now be deleted.

## What's done (by ID)

1. **FINDING H + the 112 residue + two groups found by sweeping the class** — `aab21d2`.
   A card no longer prints a conjugate product the record does not show. Measured
   product-wrong before the fix: 380 (FINDING H's non-IC "complete" card), **228 (its IC
   twin, which no earlier document had noticed)**, 112 (the Option A residue), 224 ("the
   most recent PCV13"), 32 (an unrecorded product called "PCV13/15"). 720 cards now carry
   ACIP's interchangeability sentence explaining why a PCV13-worded row governs them.
   New source `pedsPcv13Pcv15Interchangeable`; new helper `pcvProductWords()` in
   `recommend.js`. FINDING G's part D goes `toBe(112)` → `toBe(0)`.
2. **FINDING I** — `500897c`. One line: the rows-4/5 gate was
   `pcv.count >= 3 || allCountingPcvBefore72mo`, so a teenager with three *dated* PCV13
   doses at 16 was told they "completed PCV13/15 before age 6". Now
   `(pcv.count >= 3 && pcv.band.ge72 === 0) || allCountingPcvBefore72mo`.
3. **FINDING J** — `5bbe336`. p2016 comes off the 864 "series includes PCV20" cards whose
   PCV20 was given at/after age 6, and **stays on the 96** whose row fits. All five p2016
   tables were read cell by cell first (FINDING F's lesson). The replacement chip's label
   stopped advertising one row — it had named *"never received PCV20"*, which would have
   been false on all 864.
4. **The all-columns machine guard + the rulebook** — `236153b`.
   `regression-2026-10-18-every-p2016-card-has-a-row-that-fits.test.js` holds p2016's whole
   row inventory; 7,371 cards carry the chip, 0 lack a fitting row. `CLAUDE.md` now records
   the owner rule, the decide-alone rule with its three escalations, the guard **and its
   limit**, and the interchangeability ruling.

**No verdict moved on any of the four.** Both corpora are byte-identical throughout; this
was checked rather than assumed, because FINDING I re-routes cards between rows that anchor
their 8 weeks differently (`anchorPneumo` vs `anchorPcv`).

## Owner decisions made this session (apply, do not re-litigate)

- **Which document goes on FINDING I's cards: BOTH** — p2016 rows 8/9 as the only row whose
  columns all fit, CDC's 6–18 guidance for currency. Her first answer was "CDC alone, it is
  not age-limited"; the live page shows CDC's only prior-conjugate branch is headed
  *"Received PCV13 or PCV15 before age 6 years"*, she was shown that, and she changed it.
- **Process: decide alone when the dose is unchanged.** Escalate always on (a) no document
  has a row, (b) two documents give different doses, (c) a verdict would move. Paired with
  the machine guard, and every judgement call listed in the PR body.
- She did **not** want the rule written into `CLAUDE.md` as a gating commit first; it is in
  `CLAUDE.md` now, in the same PR as the work.

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`.

Uncredited (source, statement) pairs: **51** (was 43). It went UP, and the accounting is:
p2016 8,235→7,371 cards and 33→40 statements (−864 from FINDING J; +7 because a card naming
the real product splits one sentence into several), Child/Adolescent Notes 1,115→1,067
(FINDING I **gained** 48 cards a citation), and a new row: CDC Risk-based Pneumococcal,
864 cards / 1 statement — FINDING J's replacement chip, not yet numbered.

| Priority | Item | Scope |
|---|---|---|
| **P1** | **C8 doc 3 — p2016's remaining CITEs** | 40 statements, 7,371 cards. Unblocked: the structural question is answered and the all-columns guard now backs it. |
| **P1** | **C8 — CDC Risk-based Pneumococcal, new** | 864 cards, 1 statement. FINDING J put this chip on; it needs a number. ⚠ The page states the completion **three times** — under "Never received PCV13, PCV15, or PCV20", and under both halves of "Received PCV13 or PCV15 before age 6 years" — and **every one sits under a branch heading a PCV20-at-17 patient does not match.** This is escalation case (a): put the three to her as patients. |
| **P1** | **C8 — Catch-up Job Aid** | Statement 1 (1,584 cards) is the decision she asked **not** to be re-raised — do not re-ask. Statement 2 (144 cards) is a clean CITE. |
| **P1** | **C8 — CDC Child/Adolescent Notes** | 7 statements, 1,067 cards. |
| **P1** | **C8 — CDC Adult Notes** | 1 statement, 25 cards. |
| **P2** | **The wrong-ROW gap the new guard cannot close** | The guard asks whether *some* p2016 row fits, not whether the row the card *used* fits — proved by reverting FINDING I and watching it stay green. Closing it generally needs the engine to record which row it used. Recorded in the test header and `CLAUDE.md`. |
| **P2** | **Grid gap, recorded not fixed** | `buildCases()` cannot express p2016 row 2's patient (0 of 440 at-risk 24–71mo cases have 3 doses all before 12 months). Adding that history moves both corpora and needs the owner. |
| **P2** | **Dead `advisory` flag** | Owner approved removal as its own change; needs a field-level corpus diff to show 0 real verdict moves. |
| **P2** | **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **P2** | **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. |
| **P2** | **Job aid footnote §, unread** | p.1 carries PPSV23 minimum intervals after PCV13. Nothing rests on it. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

`CLAUDE.md`'s stale corpus sizes are **fixed** this session (16,008/17,652 → 17,016/18,264,
counted with `wc -l` on the committed header-less TSVs), so that item is off the queue.

## Why this is a good stopping point

The four P0 items were one family — a card describing a patient it was not written about —
and they are closed together, with a guard that makes the next one of its kind fail the
suite rather than wait for a spot-check. Nothing is half-applied: the tree is clean, the
suite is green, every number here was measured this session, and every remaining item is
independent of the four.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-18-p0-cards-name-the-history`
   (or `main` once the PR is merged).
2. Run `npm test` — confirm **1,277 passing in 112 files**, no skips, before any new work.
3. `npx vite-node scripts/uncreditedSources.mjs` — confirm **51** pairs. Never quote a
   count from a log.
4. **The one open decision is the CDC Risk-based Pneumococcal citation (864 cards).**
   **Ask, do not default** — put the three candidate sentences to her as patients, which
   is the form her answers come back in. Her standing instruction: *"If you need other
   citation decisions, I need the age, risk factors and vaccine history to find them for
   you."*
5. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected, not merely non-zero**) → fix → full suite green → **break the fix
   and quote the counts** → **`node scripts/proseDiff.mjs` and classify every changed
   line** → **drive the running app** → commit named by the item ID.
6. Push/merge: branch → PR → squash merge, then confirm the Pages deploy.

⚠ Tooling notes that cost time: `scripts/proseDiff.mjs` needs plain **`node`**;
`scripts/uncreditedSources.mjs` needs **`vite-node`**. No `timeout` command on this machine.
**The dev server's reported port is wrong** — `preview_start` said 55586, the real port was
5174; read it from `preview_logs`. CDC notes pages are accordions shut by default and an
un-expanded fetch looks like it worked: expand, then check a positive control (the
pneumococcal note is ~39,886 chars with "PPSV23" ×37).
