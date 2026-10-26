# PneumoVax — Handoff after P1, the child conjugate floor (2026-10-25, desktop session)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: **`feature/2026-10-25-child-conjugate-after-ppsv23-repeat`**, off `main` at
`84ffe45` (PR #90, the adult table, merged before this session started). **Pushed; working
tree clean at `3133cd7`.** `main` is protected, so work lands branch → PR → **the owner
squash-merges** (a session agent cannot).

Baseline at session start: **1,632 passing**. Now: **1,643 passing in 148 files, 0 failing,
0 skipped.**

**PR [#91](https://github.com/jojohuhu-git/PneumoVax/pull/91) is OPEN and complete.** The
open question it carried has been **answered by the owner and built** (`3c11c3c`). Confirm
`gh pr checks 91` is green, then it is hers to squash-merge.

---

## What's done

### P1 — `CHILD-PCV-AFTER-PPSV23` is a floor again, commit `630ed66`

The owner's reversal of her own morning ruling. Asked *"Child's PCV <52 days after a PPSV23
— count (this morning's ruling) or repeat?"* she answered **"Repeat — her table wins"**.

- `enforcement` `'recommendation'` → `'floor'`, `grace` → `true`, **`authority` → `OWNER`**
  (the first paediatric floor that is hers), `optionalRepeat` removed, `message` rewritten to
  the floor shape `{reasons, detail}` **with the "owner clinical determination" disclosure**
  — the phrase PR #90 had removed from the entire app hours earlier.
- Guard **renamed and reversed**: `regression-2026-10-25-child-conjugate-after-ppsv23-`
  `counts.test.js` → `...-repeats.test.js`, 14 tests, kept as the record of the reversal.
- `CLINICAL_SPEC.md` **§K-PPSV23THENPCV** rewritten; the §K row's cells are now
  "Does not count / This app". `src/data/rulebook.js` needed **no** edit — it derives both
  fields from the row.
- `doseIntervalRules.js`'s header corrected: "the three paediatric floors" → three of four,
  and the `authority: 'OWNER'` paragraph no longer implies every owner row is dated
  2026-10-11.
- **231 of 17,016** verdicts and **22 of 18,264** record-problem rows moved — exactly the 231
  doses the rule flags. Three classes, all intended: the judged dose stops counting (231); a
  later dose's number drops (66); the recommendation card changes (115, of which 35 gain the
  PCV21 serotype-4 note).
- **24 pinned card counts** re-measured across **14 citation guards**, each with its delta
  written beside it. **Every "zero uncredited" / "zero unfitting row" invariant is
  unchanged** — only the family sizes moved.
- **One fixture re-dated, assertions untouched**: `TWO_PCV13` in
  `regression-c8-doc1-mmwr7401a1-cites-its-own-sentences.test.js` was dated 1 day and 29 days
  after a PPSV23. Both doses are now set aside (the second cascades), so the fixture stopped
  being an adult with PCV13 on her record and the citation row it exists to check was no
  longer exercised. Moved to the ordinary clinical order, matching the sibling file.

**Mutations, each caught:** floor → recommendation *with a matching message shape* → **37**
fail; `authority` relabelled CDC → **6**; grace removed → **6** (including both corpora); the
disclosure stripped → **2**.

**Live-verified** in the running app (`preview_start` "PneumoVax dev server" — it took port
**5176**; read the real port from `preview_logs`). Maya, 8, asplenia, PPSV23 1 Oct + PCV20
15 Oct: chip reads **Invalid**, *"Given 14 days after the PPSV23 dose of Oct 1, 2026…"*, with
22 Nov (would have counted) and 10 Dec (repeat due).

**MeningoVax unaffected** — pneumococcal logic lives in this repo only and `dateUtils.js`, the
one mirrored module, is untouched (`vaccine-parity` consulted).

### The finding this created, recorded not fixed, commit `3133cd7`

See `CLINICAL_SPEC.md` §K-PPSV23THENPCV, final block, and PR #91's body.

---

## What's NOT done

### (was P0, now DONE) — the card and the chip name one date, commit `3c11c3c`

The owner answered: *"make the card use the later of the two clocks so it says 10 Dec, and
measure how many patients' advised dates move."*

One line in `recommend.js` — `anchorForA` takes `mostRecent(anchorPneumo, anchorPcv)` when
the child has no **counting** conjugate. Both anchors already existed and carry the same
8 weeks, so no second reading of the interval entered the engine; it is the shape
`anchorPneumoGiven` already used for the 24–71-month block. All three cards in the 6–18
block read one `aState`, so one line moved them all.

**Measured: 750 advised dates moved LATER, 0 earlier, 0 "due today" flips**, over 18,667
card rows (grid + 810 hand-built children). All in the 6–18 block: 375 patients × 2 cards,
150 at each of ages 6/8/11/14/17. **0 grid patients moved**, so both corpora are
byte-identical — and the corpus records `earliestNextDate`, so that is a real check.
Controls: a child with **no** conjugate is untouched, and so is one whose conjugate counted.
Guard: `regression-2026-10-25-card-and-chip-name-one-date.test.js`. Live-verified: Maya's
card and chip both read **Dec 10, 2026**.

### ⚠️ NEW FINDING, NOT FIXED, and it PREDATES today — the card can anchor on the FIRST PPSV23

Found by a mutation that **passed all 1,643 tests**: swapping `anchorPneumo` for
`anchorPneumoGiven` changes nothing in the suite, because nothing anywhere builds a child
with **two counting PPSV23 doses**.

It is a real defect. A 12-year-old with asplenia, **PPSV23 2019-01-01 and 2026-09-01, no
conjugate**, is told her PCV20 is **due today** on a card whose label reads *"≥8 weeks"* —
54 days after her most recent pneumococcal dose. `anchorPneumo` reads
`ppsv.effective.find((d) => d.date)`, the **first** counting dose, though its own comment
says *"latest of PCV or PPSV23"* (`recommend.js:1345`).

**Verified identical on `main`** — not today's doing. Probe: `$SCRATCH/probe10.mjs`
(re-create it; 12 lines). **Ask her before fixing** — it moves advised dates (case (c)) —
and do **not** pin the current behaviour with a test, which would freeze it. The
`regression-2026-10-25-card-and-chip-name-one-date.test.js` header records the whole thing.

### P1 — the rest of her children's rows (unchanged from the previous handoff)

| Item | Her row | App today |
|---|---|---|
| **P2** | 2nd PPSV23 <5y, immunocompromised child → **Count**, never a third | App rejects it (`CHILD-PPSV23-AFTER-PPSV23`). **0 grid patients** — needs a hand-built one. |
| **P3** | Five rows say the remedy is **PCV20, not another dose of the same vaccine** | App only knows "repeat this dose". The one genuinely new capability; shared by adults and children. |
| **P4** | Supplemental PCV20 24–51 days after last PCV | Default (repeat) right; needs the "count it and document" alternative, **withheld for immunocompromised/asplenic children**. |
| **P5** | Infant doses 1–3 before 38/66/94 days | **Already correct** — 38+28+28 = 94 exactly. Zero slack, so it deserves a guard. |
| — | PCV21 under 18 | Rejected correctly; wording says "repeat this dose" where it should name PCV20. |

### P1 — "also state the minimum" (not started)
Every card that advises a date should state the true minimum beside it — the shape she
approved 2026-10-23 for infants.

### P1 — the rules map (not started, **ask her first**)
`a66219a` rebuilt both rulebooks as a nine-column lookup (`src/data/rulebook.js` +
`src/components/Rulebook.jsx`). **She has not seen it.** It lacks the recommendation side and
a third authority tier — "Who says so" has only "CDC / ACIP" and "This app", while her tables
add **expert opinion / literature**.

### P2 — eleven new reference entries (not started, **open owner decision**)
AAP **Red Book 2024–2027**, *Pediatrics* 2025 (invalid doses), the paediatric **HIV OI
guidelines**, *Pediatrics in Review*, and seven immunogenicity/hyporesponsiveness papers.
**Ask: cite as given, or fetch and quote each one live?** It was in PR #90's body as a
question and she has not answered it. The 2014 *Vaccine* paper is one of them and is
**deliberately not yet cited** on the new floor, though it is named in the row's `source`
prose as her basis.

### Still open from `a66219a`
Pinned by number in
`regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`: the healthy
child with a PPSV23 (11 + 14 patients); the 3-doses-before-12-months row (22); whether
`ADULT-PCV20-21-5Y-AFTER-PPSV23` should offer the optional repeat.

---

## Why this is a good stopping point

The rule reversal is a complete clinical unit — implemented, measured, spec'd, mutation-
tested, live-verified and open as a PR she can read on its own. The card/chip problem it
created is **found, reproduced, measured and written down in three places** (PR body, spec
section, commit `3133cd7`) rather than half-fixed, because the repair changes advised dates
and that is hers to approve. Nothing is half-applied and the tree is clean.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-25-child-conjugate-after-ppsv23-repeat`
2. `npx vitest run` — confirm **1,643 passing, 0 failing** before touching anything.
3. `gh pr checks 91` — confirm green. #91 is complete and is hers to squash-merge.
4. **Open decisions — ask, do not default:** (a) **the first-PPSV23 anchor finding above**;
   (b) the eleven new references (cite as given vs. verify live); (c) has she looked at the
   rules-map lookup; (d) the three `a66219a` questions.
5. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break the fix more than one way and quote the counts (**mutate
   the `message` shape with the `enforcement`** — flipping `enforcement` alone tests nothing)
   → **drive the running app** → commit per item.
6. ⚠️ **The grid cannot build a vaccinated child aged 2–18.** Every one of this ruling's 231
   grid patients is 18–19. A sweep over `buildCases()` is **not** a guard for these children
   — hand-build them, as `probe8.mjs` and the Maya/Noor fixtures do.
7. ⚠️ **Never `import` a top-level script to inspect it** — importing
   `scripts/updateVerdictCorpus.mjs` *executes* it and silently regenerates both corpora.
   Take before/after from `git show HEAD:<path>`, never the working tree.
8. **Branch → PR → the owner squash-merges.** A session agent cannot merge.
9. `vaccine-parity`: pneumococcal logic is PneumoVax-only; only `dateUtils.js` is mirrored.
