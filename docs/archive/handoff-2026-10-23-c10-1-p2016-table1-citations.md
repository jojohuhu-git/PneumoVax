# PneumoVax — Handoff after C10-1, the p2016 Table 1 citation pass (2026-10-23)

> ## ⚠ SUPERSEDED — do not work this queue
>
> Consumed on 2026-10-23 by the session that produced
> `docs/archive/handoff-2026-10-23-c10-2-routine-date-vs-minimum.md`. **Go there instead.**
>
> Its P1 item **C10-2 is done and shipped** as
> [PR #82](https://github.com/jojohuhu-git/PneumoVax/pull/82) — the routine-date/minimum split
> AND the catch-up chip, which it had listed as a separate item. Its instruction to merge
> **PR #80 is out of date** (#80 merged, which is what left #81 behind its base; #81 has since
> been brought up to date and is CLEAN). The ⚠ it raised against ruling D — "check for
> pneumococcal-specific guidance that overrides the general rule" — **has been answered: there
> is none**, and the evidence is in the new handoff.


Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` — always
read the real port from `preview_logs`. What the app is: a client-side React SPA giving
pneumococcal vaccine advice across the lifespan. No backend; **every clinical claim on a card
must be traceable to a document that speaks for *that patient***.

Branch: **`feature/2026-10-23-c10-1-p2016-table1-citations`**, off `main` at `7d95620`, pushed,
**[PR #81](https://github.com/jojohuhu-git/PneumoVax/pull/81) open and awaiting the owner's
squash-merge** (a session agent cannot merge). Working tree clean at `5f1f491`.
Baseline was 1,403 passing in 127 files; now **1,414 passing in 128 files, 0 failures, 0 skips**.

Consumed and superseded: `handoff-2026-10-23-four-rulings-and-the-interval-rework.md`.

## ⚠ FIRST: two things only the owner can do

1. **[PR #81](https://github.com/jojohuhu-git/PneumoVax/pull/81) — squash-merge it.** This is C10-1.
2. **[PR #80](https://github.com/jojohuhu-git/PneumoVax/pull/80) — squash-merge it too.** Docs only
   (+173 lines): the previous handoff plus a superseded banner. **It is still not on `main`**, so
   the four rulings live only on that branch and in PR bodies until it merges.

**PR #76 is settled — nothing to undo.** It was merged (02:53 UTC 2026-10-24) rather than closed as
the previous handoff asked, but the merge was a **complete no-op**: `git diff 47f75de 7d95620` is
empty and the two trees are byte-identical (`7e2db689…`). `main` already held its commit via #77's
squash, so GitHub replayed an identical snapshot. The only trace is an extra log line.

## What's done — C10-1 (commit `5f1f491`)

**The fault.** The infant catch-up card states a total for the child in front of you ("2 doses in
total for this child [1]") and `[1]` pointed at CDC's *"4-dose series at 2, 4, 6, 12–15 months"* —
a quote saying four carrying a claim of two, on **781 cards**. FINDING 2's fault at the other end
of the range. CDC cannot carry it: read live today its note punts, *"For other catch-up guidance,
see Table 2."*

1. **781 cards now cite the p2016 Table 1 row that states their own number.** Eight
   `p2016Table1_*` entries in `refs.js`, one per branch of the engine's total ladder.
2. **The engine records WHICH row it used** (`t1row` / `table1Row` in `pcvInfant`), and cites it
   **only when the row's own stated total equals the number printed**. This **closes FINDING I for
   the infant block by construction** — `CLAUDE.md` had recorded that as needing exactly this.
3. **p2016 removed from 1,633 cards** CDC already states and cites by number: 1,072 at-risk
   Option A/B, 429 routine 4-dose, 132 five-dose (Table 1 has no row that high).
4. **`pcvInfant`'s flat `refs` list is gone** — the last block doing the thing `CLAUDE.md` forbids.
   It asks per card via `infantRefsExcept`.
5. **Rulings A and B written into `CLAUDE.md` and `CLINICAL_SPEC.md` §A-cite**, in the same commit.

Measured, never quoted: uncredited pairs **23 → 1**; p2016's own **22 → 0** (fourth document at
zero); p2016 chip footprint **4,927 → 3,294**; verdicts moved **0** (both sweeps green, neither
corpus file touched); clinical prose changed **0** (35,280 lines dumped both sides — all 13,848
differences are citation apparatus). Guard
`regression-c10-1-2026-10-23-infant-total-cites-p2016-table1.test.js`, proved to bite four ways
(4 / 5 / 4 / 2 failing tests).

**The near miss, recorded because no test could see it.** The first draft let a row take the marker
at a total of 4 too, pushing **CDC off 231 cards it speaks for** — a removal by side effect, the
FINDING F fault. The measurement caught it; nothing in the suite would have. The guard now asserts
"CDC keeps its marker" over the whole grid.

## The remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P1** | **C10-2 — routine interval vs minimum interval** (rulings C + D) | Recommend the **routine** date and **comment** the shortest interval, copying `adultPpsvRecommendedInterval()` / `adultPpsvShorterMinimumOffered()` in `riskFactors.js`. Child D's 4→8 weeks falls out of this. **This moves verdicts** — both corpora must be re-measured and the counts explained before merge (case (c): owner decides). Then **ruling D**: anchor a repeat dose to the **invalid** dose + minimum interval, not the last valid one. ⚠ ACIP prints a hepatitis-B exception to its own sentence — **check for pneumococcal-specific guidance that overrides it before implementing**. Open design question the owner agreed is real: a child genuinely behind (first dose at 9 months) has no routine date left and must fall back to the minimum — decide the shape and say so in the PR. |
| **P1** | **The catch-up table becomes a visible chip** (owner answered 2026-10-23) | She ruled **yes — add a `refs.js` entry for CDC's Catch-up Immunization Schedule and cite it for the INTERVAL cells only (dose 1→2, 2→3, 3→4), never for a total**, and ruled the work belongs **in C10-2**, not C10-1, so it is written against the final behaviour. Today that document is what `intervals.js` is built from and it appears on **no card**. |
| **P2** | Unchanged | Card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** everything the previous handoff listed, **plus the whole p2016 citation
question** — zero uncredited pairs. The Job Aid's remaining statement (1,584 cards) is still the
decision the owner asked **not** to be re-raised.

**Still open and NOT to be changed without her:** nothing from C10-1. Child E's card says "of 3"
while the p2016 row she named gives a total of 2 — flagged, not touched; raise it inside C10-2.

## Why this is a good stopping point

C10-1 is a complete unit: one document taken from 22 uncredited statements to zero, no verdict
moved, no clinical wording changed, and the engine left recording which row it cited — which is
the thing C10-2 will need when it decides whether an interval comes from p2016 or the catch-up
table. Nothing is half-built.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. **Check #81 and #80 merged.** Branch fresh off `main`; never leave a branch without a PR.
3. `npx vitest run` — confirm **1,414 passing in 128 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable file count use `--reporter=json` and read
   `len(testResults)` (`numTotalTestSuites` is not files).
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **1** pair. Re-measure, never quote.
5. Per item: reproduce → failing test (say the pre-fix failure count) → fix → full suite green →
   **break the fix in more than one way and quote the counts** → `node scripts/proseDiff.mjs dump`
   on both sides (plain `node`, NOT `vite-node`), compared **field by field** — strip the citation
   field and the `[c]` markers *with their leading space*, or a stray space reads as 5,577 false
   differences → **drive the running app** → commit named by the item ID.
6. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict. **C10-2 is case (c).** Everything
   dose-unchanged is yours to decide (OWNER DECISION 2026-10-18), grouped in the PR body.
7. Push/merge policy: **branch → PR → the owner squash-merges.** A session agent cannot merge.

## Lessons this session paid for

- **A removal can be a side effect of an addition.** Giving p2016 the marker at a total of 4 took
  CDC off 231 cards. FINDING F is usually told as "read the document before removing it"; this is
  the same fault reached without ever intending a removal. **Measure the other documents after a
  citation change, not just the one you are working on.**
- **A dangling reference reads as success.** Replacing `const refs` in `pcvInfant` left one later
  use undefined; the card threw, `recommend` skipped it, and the uncredited count *improved*. The
  tell was `cards produced` dropping from 17,361 — a number I only had because the first
  measurement printed it. **Check the denominator, not just the metric.**
- **A liveness proxy can expire.** `uncredited-sources-smoke` asserted "at least one uncredited
  pair" — true when written, false once the work succeeded. Replaced with a stronger check rather
  than deleted. **A test that fails when the codebase gets better is the wrong test, but it is
  still guarding something: find out what, before weakening it.**
