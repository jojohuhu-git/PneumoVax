# PneumoVax — Handoff after the "complete" cards' citations, and a Table 2 gap (2026-10-23)

> ## ⚠ SUPERSEDED — do not work this queue
>
> Consumed on 2026-10-23 by the session that produced
> `docs/archive/handoff-2026-10-23-c9-healthy-5to18-cdc-over-p2016.md`. **Go there instead.**
>
> Its P0 (the Table 2 5–18 gap) is SETTLED: the owner answered with a general rule —
> *"Ok to cite p2016 if you cannot just cite the CDC references"* — and p2016 came off that
> card in `3c246a7`. The queue table below is also stale: 24 pairs is now 23.

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
**it reported port 63441 and actually served 5174 this session; always read the real port
from `preview_logs`.** What the app is: a client-side React SPA giving pneumococcal vaccine
advice across the lifespan. No backend; **every clinical claim on a card must be traceable
to a document that speaks for *that patient***.

Branch: **`feature/2026-10-23-c9-complete-card-citations`**, off `main`. Pushed, working
tree **clean** at `af14353`. Baseline was 1,389 passing in 125 files; now **1,397 passing in
126 files**, all green, no skips. Uncredited pairs **29 → 24**.

Consumed and superseded: `handoff-2026-10-23-p0-dose3-floor-and-c9-p2016.md`.

## ⚠ FIRST: the PR situation, and one thing only the owner can do

| PR | State | Action |
|---|---|---|
| [#78](https://github.com/jojohuhu-git/PneumoVax/pull/78) | **`test` check PASSED**, open | awaiting the owner's squash merge |
| [#76](https://github.com/jojohuhu-git/PneumoVax/pull/76) | open | **CLOSE IT, do not merge** |

**#76 is redundant and was verified so, not assumed.** `main` already contains its commit —
it arrived inside **#77's squash merge**, because #77's branch was cut from #76's.
`git diff origin/main HEAD` against that branch is empty in the direction that matters: #76
holds nothing `main` lacks. Identical to #73 last week. A session agent cannot close or
merge PRs (the classifier blocks `gh pr merge`), so both actions are the owner's.

## What's done (by ID)

**C9-3 — the "complete because PPSV23 was given" cards say who says so** (`3ea7fd5`, 860
cards), plus a docs commit (`af14353`). TWO OWNER DECISIONS, taken on real patients run
through the engine:

1. **CASE 1, 840 cards — p2016 comes OFF.** An 18-year-old with a cochlear implant, PCV13
   at age 8, PPSV23 at 13. p2016 Table 4 rows 8/9 fit her history but their Option B only
   ORDERS the PPSV23 she has had; footnote § ("then child is complete") is the mark on rows
   **4/5**, whose column reads "Completed PCV series BEFORE age 6 years" — she fails it.
   CDC's notes state her whole claim verbatim. Owner: *"Take p2016 off."*
2. **CASE 2, 20 cards — ACIP mm7137a3, not p2016 §.** A 24-month-old with a cochlear
   implant, three PCV13 doses at 17/19/21 months, PPSV23 given. Her card said "complete
   [1]" where [1] was CDC's *"administer 1 dose PCV20 or 1 dose PPSV23"* — an order for a
   dose, on a card saying she needs none. Owner: *"p2016 doesn't cite this case. The MMWR
   pediatric PCV15 paper should."* New entry `pedsRiskSinglePpsv23AfterPcv`, read live.
   The card now splits the claims: **[1] ACIP for completion, [2] CDC for the choice**, past
   tense, so the CDC number reads as the row she FOLLOWED.

Also in that commit: the paediatric block now asks **per card** (`childRefs` /
`childRefsExcept` / `childRefsSwap`, the twin of `adultRefs`) instead of spreading one
`refs` list over every card — the shape `CLAUDE.md` forbids and the origin of the owner's
original question.

**Two cards were fixed, not one** (the owner saw only the 5-card version; the 15-card
24–71-month card makes the same claim in different words).

**A FALSE FINDING, withdrawn and recorded.** A first draft added an `isIC` wording branch to
the 24–71-month card, claiming its gate let an IC child reach a note hard-coded
"(non-immunocompromising)". Impossible by arithmetic — a first PPSV23 cannot count before 24
months, a second needs ≥5 years, so two counting doses cannot exist before ~84 months, past
the block's 71-month ceiling (exhaustive search: **0** reachable combinations). Branch
removed; unreachability guarded instead.

Evidence: `proseDiff` over both grids — **860 of 35,280 rows changed, 0 added, 0 removed, 0
impossible entries**; field by field **840 differ ONLY by the dropped chip** (clinical
sentence byte-identical) and 20 by the Case 2 rewording. Card counts unchanged 840/15/5.
Five mutations fail **2 / 4 / 1 / 1 / 3**. Both patients driven in the running app.
Guard: `regression-c9-2026-10-23-complete-after-ppsv23-cards.test.js`.

## ⚠ FOUND THIS SESSION, NOT FIXED — and it needs the owner

**p2016 Table 2 has no row for the commonest patient on its biggest remaining card.**

The next queue item was going to be Table 2 row 3 (statement #1, **1,584 cards**, healthy
5–18 "no PCV indicated"). The previous handoff said *"all 1,584 verified as 'no previous
doses or an incomplete schedule', so the row fits every one."* **That is true of the grid
and false of the code.**

- Measured: all 1,584 grid patients have **no dose before 24 months at all** (many have
  doses — 1,314 of them — but the earliest is at 36 months). So at 24 months each had an
  empty, hence incomplete, schedule, and the row fits.
- But the same card fires for a **healthy 10-year-old who COMPLETED her 4-dose infant series
  at 2/4/6/12 months** (asserted directly — the grid cannot build her). p2016's 5–18 row
  covers only *"No previous doses or any incomplete PCV schedule by 24 months"*. She
  **completed** by 24 months, so the row excludes her. The row that describes her —
  *"Completed any PCV schedule… by 24 mos → No additional doses"* — is printed in the
  **24-through-59-months** band, which she has aged out of.

So citing Table 2 row 3 across this card would cite a row that excludes the commonest real
patient it serves. This is FINDING I's shape (a wrong ROW of a fitting document) and
**escalation case (a)** — a history no document has a row for. The all-columns guard is
blind to it because every grid patient fits.

**Clinically nothing moves** (no PCV indicated either way), and the claim is NOT orphaned —
CDC's notes are cited first on that card. Options to put to her:
- **(a, recommended)** split by the prior-dose column: cite Table 2's 5–18 row only where
  the child had no doses or an incomplete schedule by 24 months; where she completed by 24
  months, take p2016 off (no row fits).
- **(b)** take p2016 off the card entirely (1,584 cards), discarding a row that does fit
  most of them.
- **(c)** cite the "Completed any PCV schedule by 24 mos" row anyway — **violates her
  2026-10-18 all-columns rule**, so not recommended.

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`. **Re-measure, never quote a count
from a log or a handoff** — `npx vite-node scripts/uncreditedSources.mjs` reports **24** pairs
(23 p2016 + 1 Job Aid) right now.

| Priority | Item | Scope |
|---|---|---|
| **P0 (owner)** | **Table 2 row 3 — the gap above** | 1,584 cards. **Ask, do not default.** |
| **P1** | **p2016 Table 1 — the infant/catch-up totals** | ~1,342 cards over 8 statements (#3/#6/#7/#9/#10/#12/#15/#20). Table 1 is transcribed in this session's scratch reading; footnote † is the 4wk/8wk interval. **Two traps found:** (i) footnote † keys the interval on the CHILD's age while CDC's Catch-up Table 2 keys it on the age at the earlier dose — they DISAGREE for a 15-month-old whose only dose was at 3 months (p2016 8 weeks, CDC 4 weeks, app follows CDC). Under the owner's 2026-10-17 CDC-governs ruling the app is right; **cite p2016 for the TOTAL only, never for the interval sentence.** (ii) the five-dose card (#9, 132 cards) has **no p2016 row at all** — Table 1's prior-dose column stops at 3 — so p2016 should come OFF it; CDC already carries the booster clause. |
| **P1** | **p2016 Table 4 rows 4/5 and 8/9, Option A and B** | ~1,100 cards over ~13 statements. Rows transcribed verbatim in the new guard's header and in `regression-c9-2026-10-23-p2016-no-prior-pcv-6to18-rows`. Mostly decide-alone: the dose is unchanged and the rows fit. PCV15 and unrecorded-product variants ride the owner's 2026-10-18 interchangeability / "an unrecorded product is not a PCV20" rulings, already in the cards' own words. |
| **P2** | Card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread; the recommendation-anchor vs ACIP's repeat rule | Unchanged from the previous handoff. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** FINDING L (wrong premise); the p2016/576 question (owner said NO,
2026-10-18); "add a number-has-a-chip guard" (G2 does it); the Catch-up Job Aid's 144-card
statement. The Job Aid's **other** statement — 1,584 cards, healthy 5–18s not caught up — is
the decision the owner asked **not** to be re-raised. (The Table 2 gap above is a DIFFERENT
pair on that same card and does not touch her Job Aid question.)

## Why this is a good stopping point

Both owner decisions are applied, guarded, measured and driven in the real app, and both are
written into `CLAUDE.md` with the patient that produced them. PR #78 is green. The next item
is blocked on a question only the owner can answer, and that question is stated above with
its measurement rather than left for the next session to rediscover — which is what the
previous handoff's wrong claim about those 1,584 cards would otherwise have cost.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-23-c9-complete-card-citations`
2. **Check whether #78 merged and whether #76 was closed.** If #78 merged, branch fresh off
   `main`. **Do not leave a branch without a PR.**
3. `npx vitest run` — confirm **1,397 passing in 126 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable count use `--reporter=json --outputFile=…`.
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **24** pairs.
5. **Ask the owner the Table 2 question above before touching that card.** Then p2016
   Table 1 or Table 4 rows 4/5 — both decide-alone, both with traps noted above.
6. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix in more than one way
   and quote the counts** → **`node scripts/proseDiff.mjs dump` on both sides, compared
   field by field in python** → **drive the running app** → commit named by the item ID.
7. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict. Everything else where the dose
   is unchanged is yours to decide (OWNER DECISION 2026-10-18), grouped in the PR body.

## Lessons this session paid for

- **"What else is cited?" is the right first question, and it reversed two recommendations.**
  Asked that, the owner's two cards turned out to cite exactly one sentence each — and on
  one of them that sentence ORDERED a dose on a card saying none was needed. Neither option
  originally offered was correct. **Dump the card's full citation picture before proposing a
  disposition.**
- **`scripts/proseDiff.mjs` needs plain `node`, not `vite-node`.** Its CLI is gated on
  `import.meta.url === file://${process.argv[1]}`, which never matches under vite-node, so
  the command exits 0 and writes nothing — a silent no-op that looks like success.
- **A handoff's "verified" can be true of the grid and false of the code.** The 1,584-card
  claim was both. Assert the history the grid cannot build before trusting a sweep.
- **Prove a state is reachable before adding a branch for it.** An exhaustive search over
  every age and date pair is cheap and turned a confident finding into a withdrawn one.
- **A bulk `str_replace` over a citation file hits more than you aimed at** — converting one
  quote's `≥` escapes rewrote 18 unrelated adult quotes. Revert and redo narrowly;
  `git diff` deletions should be 0 for a pure insertion.
