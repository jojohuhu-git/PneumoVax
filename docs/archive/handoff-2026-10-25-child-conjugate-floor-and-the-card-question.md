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

**PR [#91](https://github.com/jojohuhu-git/PneumoVax/pull/91) is MERGED** — `main` is at
`7feb43a`. Everything below the "What's done" heading is landed.

> ## ⚠️ READ FIRST — three owner decisions of 2026-10-26, after #91 merged
>
> 1. **SKIP the eleven new references.** Closed, not deferred. Do not re-raise them, and do
>    not add the 2014 *Vaccine* hyporesponsiveness paper to the new floor — it stays named
>    in the row's `source` prose as her basis, with no citation chip. (Was P2 below.)
> 2. **ADD the 2023 adult MMWR as a citation — but ASK WHICH CLAIM FIRST.** See the section
>    below; this is not a straightforward add, because the document is already in the app
>    and is uncited *by her own decision of 2026-10-16*.
> 3. **The PPSV23 anchor: both schedule rules are correct.** The defect is which DOSE the
>    app feeds into the 8-week rule, not the rule. Her words: *"both statements are
>    correct"*. Rewritten below.
>
> **⚠️ BUDGET.** Her Pro weekly limit was **100% used on 2026-10-26, resetting 2026-10-29
> ~16:00Z**, with about **$25** of the $200 monthly extra usage left. Prefer the small,
> fully-specified items (the anchor fix, the P5 guard, the PCV21 wording) and **leave the
> citation pass and P3 until the weekly resets** — the 2026-10-25 citation work alone moved
> 24 pinned counts across 14 files.

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

### ⚠️ NOT FIXED, PREDATES 2026-10-25 — the 8-week rule is measured from the FIRST PPSV23

**Both schedule rules are correct and neither is in question** — owner, 2026-10-26: *"both
statements are correct. 'Give PPSV23 dose 2 ≥5 years after dose 1 PPSV23' is the routine
schedule when spacing out 2 PPSV23 doses. 'Give the next conjugate ≥8 weeks after the most
recent pneumococcal vaccine' is correct when spacing out conjugate from PPSV23 or between
conjugate vaccines."*

**The defect is which DOSE the app feeds into the 8-week rule.** `anchorPneumo`
(`recommend.js:1345`, inside `pcvRiskChild`, so **at-risk children only**) is built from
`ppsv.effective.find((d) => d.date)` — the **first** counting PPSV23 — although its own
comment says *"latest of PCV or PPSV23"*.

The worked patient, run on the engine:

| | |
|---|---|
| asplenic 12-year-old, **no conjugate ever** | PPSV23 **1 Jan 2019** + PPSV23 **1 Sep 2026** |
| 5-year spacing | 7y 8m apart — satisfied, both doses count |
| next conjugate **should** be | **27 Oct 2026** (8 weeks after 1 Sep 2026) |
| the app says | **DUE TODAY** on 25 Oct — it measured from 1 Jan 2019 |

That is 54 days after her real last pneumococcal dose, two short, on a card whose own label
reads *"≥8 weeks"*.

**The 5-year card is NOT affected and must stay as it is.** It reaches for dose 1 directly
(`ppsv.effective.find(...)` passed straight into `dueStateMonths(..., MO60, ...)` at lines
1744 / 1975 / 2083 / 2241), which is right for *"dose 2 ≥5 years after dose 1"*. Only the
three **8-week** callers read `anchorPneumo`: lines 342, 1690, 2094.

**Why nothing caught it:** with one PPSV23 on record, "first" and "most recent" are the same
dose, and no patient in the grid or in the 810 hand-built children has two counting PPSV23
doses.

**Candidate fix, trialled 2026-10-26 and reverted — nothing is committed:**

```js
const anchorPneumo = mostRecent(pcv.lastDate, ppsv.lastDate || null);
```

Gives the patient above **eligible 2026-10-27**, keeps **all 1,643 tests green**, and moves
**0 of 18,667 card rows** — so it is safe but **completely unguarded**. It needs a hand-built
patient like the one above or it will silently come back. Reproduce the defect with:

```js
recommend({ today: '2026-10-25', dob: '2014-10-01', ageMonths: 144, riskIds: ['asplenia'],
  pcvDoses: [], ppsv23Doses: [{ date: '2019-01-01' }, { date: '2026-09-01' }] })
// both PCV cards: dueToday: true, earliestNextDate: null
```

**One related question she has NOT been asked:** a PPSV23 given 54 days ago but *rejected*
for falling inside 5 years currently does **not** hold off a conjugate (ANCHOR-1, *"an
unnecessary dose cannot reset a clock"*). That is the designed behaviour, not this bug —
raise it separately if it matters.

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

### (was P2) — the eleven new references: **SKIPPED, owner decision 2026-10-26**

AAP Red Book 2024–2027, *Pediatrics* 2025, the paediatric HIV OI guidelines, *Pediatrics in
Review* and the seven immunogenicity/hyporesponsiveness papers are **not being added**. This
closes the question that sat in PR #90's and #91's bodies. The 2014 *Vaccine* paper is one of
them: it stays named in `CHILD-PCV-AFTER-PPSV23`'s `source` prose as her stated basis, and
gets **no citation chip**. Nothing to do; do not re-raise.

### NEW — add the 2023 adult MMWR as a citation (owner decision 2026-10-26, **but ask which claim**)

Her words: *"I do want to add the MMWR pneumococcal 19 and older 2023 document to cite."*
That is **`mmwr7203a1`** — *ACIP, Use of pneumococcal vaccines among U.S. adults ≥19 years*,
`rulebook: 'adult'`, `lastVerified: '2026-10-12'`, already in `src/data/refs.js`.

**⚠ It is on NO card today, and that is deliberate — her own decision of 2026-10-16
("option A"), recorded in `src/data/__tests__/citation-orphans.test.js`.** Two claims rested
on it and both moved on:

- the **adult PCV15→PPSV23 interval** → replaced by `mm7401a1` (Jan 2025) and the CDC Adult
  Timing Job Aid (Mar 2025). CLAUDE.md states: *"rr7203a1 is superseded. Never cite it for an
  adult interval again."*
- the **adult risk-factor list** → it sat on only **4 of 17** risk conditions, so the sources
  at the foot of an adult card changed with which box was ticked.

**So do not just re-attach it.** Put to her, with patients rather than statement names
(memory: *"Citation decisions need patients"*): **which claim should it carry?** If the
answer is an interval, that reverses the 2026-10-16 decision and the CLAUDE.md line above
must change in the same commit — confirm she means to before building. If it is a general
adult source chip, decide which adult cards and measure the count, because the 4-of-17
problem above is exactly what going back in naively would re-create. The orphan test will
need its entry updated either way.

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
4. **Open decisions — ask, do not default:** (a) **which claim the 2023 adult MMWR should
   carry** (see its section — it is uncited by her own 2026-10-16 decision); (b) has she
   looked at the rules-map lookup; (c) the three `a66219a` questions. The eleven references
   are **closed — skipped**, and the anchor finding is **explained and costed**, needing only
   her go-ahead plus a hand-built guard.
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
