# PneumoVax — Handoff after the healthy 5–18 card's citations, and a new OWNER RULE (2026-10-23)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
**it served port 5173 this session; always read the real port from `preview_logs`.** What the
app is: a client-side React SPA giving pneumococcal vaccine advice across the lifespan. No
backend; **every clinical claim on a card must be traceable to a document that speaks for
*that patient***.

Branch: **`feature/2026-10-23-c9-healthy-5to18-cdc-over-p2016`**, off `main`. Pushed, working
tree **clean** at `3c246a7`. Baseline was 1,397 passing in 126 files; now **1,403 passing in
127 files**, all green, no skips. Uncredited pairs **24 → 23**.

Consumed and superseded: `handoff-2026-10-23-c9-complete-cards-and-the-table2-gap.md`.

## ⚠ FIRST: two things only the owner can do

| PR | State | Action |
|---|---|---|
| [#79](https://github.com/jojohuhu-git/PneumoVax/pull/79) | **`test` check PASSED** (1m52s), open | awaiting the owner's squash merge |
| [#76](https://github.com/jojohuhu-git/PneumoVax/pull/76) | open since 2026-10-23 | **CLOSE IT, do not merge** |

**#76 is still open and still redundant.** `main` already contains its commit — it arrived
inside #77's squash merge, because #77's branch was cut from #76's. This was verified last
session, not assumed, and re-confirmed as still open today. A session agent cannot close or
merge PRs (the classifier blocks `gh pr merge`), so both actions are the owner's.

## 🔴 THE NEW OWNER RULE — read this before any citation work

**OWNER DECISION 2026-10-23:** *"Ok to cite p2016 if you cannot just cite the CDC references."*

It is in `CLAUDE.md` beside the 2026-10-17 CDC-vs-immunize.org ruling, and it is a
**different rule**: that one says who wins when the two DISAGREE; this one applies when they
**agree**, and says which goes on the card. **If CDC's own pages carry the card's claim,
cite CDC and leave immunize.org off.** p2016 is the fallback for a claim CDC does not state.

**It very likely shrinks the remaining queue.** 23 of the 23 outstanding uncredited pairs are
p2016 (22) and the Job Aid (1). **Nobody has yet checked how many of those 22 are claims CDC
already states** — do that measurement FIRST, before working any of them individually. If CDC
carries a statement, the item is a removal, not a citation hunt.

**Reading p2016 in full is still required before removing it** (FINDING F). The rule says CDC
wins when both speak, not that p2016 need not be read.

**Note how the rule arrived.** It was escalated to her as case (a) — "no document has a row
for this history". She declined the framing and gave a general rule instead. A case-(a)
escalation may come back as a rule rather than a yes/no.

## What's done (by ID)

**C9-4 — the healthy 5–18 "no PCV indicated" card cites CDC, not p2016** (`3c246a7`, 1,584
cards). p2016's Table 2 has only THREE rows and its 5–18 band has ONE, whose prior-dose
column reads *"No previous doses or any incomplete PCV schedule by 24 months"* — written
about a child who never finished. A healthy 10-year-old who COMPLETED her series at 2/4/6/12
months fails it, and the row describing her sits in the 24–59-month band she has aged out of.
Both pages and all five tables read live before removing (Table 4 = risk conditions, Table 5
= HSCT). CDC's catch-up row stopping at age 4 is the card's whole claim and covers all three
children, so p2016 was never needed.

Also in that commit: **`pcvHealthyChild` now asks per card** (`healthyRefsExcept`, the twin of
`adultRefs` / `childRefsExcept`) instead of spreading one `refs` list over every card — the
shape `CLAUDE.md` forbids and the origin of the owner's original question.

Evidence: new test fails **4 of 6** pre-fix; three mutations fail **5 / 3 / 2**; `proseDiff`
over both grids = **2,352 of 35,280 rows changed** (1,584 real + 768 impossible), 0 added, 0
removed, and field by field **all 2,352 differ only by the two p2016 tokens disappearing**;
**0 verdicts moved**; Child B driven in the running app. Guard:
`regression-c9-2026-10-23-healthy-5to18-cdc-over-p2016.test.js`.

**The Catch-up Job Aid chip was deliberately NOT touched** — different (document, statement)
pair, and the owner's do-not-re-raise decision. The new test **pins its presence** so a tidy-up
cannot take it along.

**The all-columns guard's anti-vacuity threshold is now PINNED EXACTLY at 4,927**, not floored
at `>5000`, with the measured history beside it (7,371 → 6,511 after C9-3 → 4,927 after C9-4).
C8/C9 keep lowering this number and a floor absorbs each drop silently. `CLAUDE.md`'s stale
7,371 corrected to match. **If it fails, do not edit the number until you can say which cards
moved and why** — then edit it and add a line.

## ⚠ A TRAP THIS SESSION PAID FOR

**The grid cannot build the ordinary vaccinated teenager.** All 17,016 cases: of the 1,584 on
this card, 90 have no doses and 1,494 have their earliest dose at 36 months. **ZERO completed
by 24 months** — the grid's fixed day-offsets cannot place an infant dose under a
5–18-year-old. So the patient this whole item turned on registers as **0 rows moved** in both
corpora and in `proseDiff`. She is **asserted by hand** in the test. Any card serving children
5–18: assert the completed-infant-series child directly; never infer her from a sweep.

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`. **Re-measure, never quote a count
from a log or a handoff** — `npx vite-node scripts/uncreditedSources.mjs` reports **23** pairs
(22 p2016 + 1 Job Aid) right now.

| Priority | Item | Scope |
|---|---|---|
| **P0** | **Measure the new rule against all 22 remaining p2016 pairs** | For each, ask first: does a CDC page state this claim? If yes it is a REMOVAL under the 2026-10-23 rule, not a citation hunt. Do this before working any item individually — it may collapse most of the queue. |
| **P1** | **p2016 Table 1 — the infant/catch-up totals** | ~1,342 cards over 8 statements (#3/#6/#7/#9/#10/#12/#15/#20). **Two traps:** (i) footnote † keys the interval on the CHILD's age while CDC's Catch-up Table 2 keys it on the age at the earlier dose — they DISAGREE for a 15-month-old whose only dose was at 3 months (p2016 8 weeks, CDC 4 weeks, app follows CDC). **Cite p2016 for the TOTAL only, never the interval sentence.** (ii) the five-dose card (#9, 132 cards) has **no p2016 row at all** — Table 1's prior-dose column stops at 3 — so p2016 comes OFF it; CDC already carries the booster clause. |
| **P1** | **p2016 Table 4 rows 4/5 and 8/9, Option A and B** | ~1,100 cards over ~13 statements. Rows transcribed verbatim in the C9 guards' headers. Mostly decide-alone: dose unchanged, rows fit. PCV15 and unrecorded-product variants ride the 2026-10-18 interchangeability rulings, already in the cards' own words. |
| **P2** | Card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread; the recommendation-anchor vs ACIP's repeat rule | Unchanged from the previous handoff. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** the Table 2 5–18 gap (settled by C9-4 above); FINDING L (wrong
premise); the p2016/576 question (owner said NO, 2026-10-18); "add a number-has-a-chip guard"
(G2 does it); the Catch-up Job Aid's 144-card statement. The Job Aid's **other** statement —
1,584 cards on this same card — remains the decision the owner asked **not** to be re-raised.

**One judgement call left on the table, flagged in #79 and not taken:** CDC's second sentence
(*"For children without risk conditions, PCV20 is not indicated if they have received 4 doses
of PCV13 or PCV15 or another age appropriate complete PCV series"*, `pedsNoPcv20IfComplete`,
already in `refs.js`) is written directly about the completed-series child. The card is
correctly sourced without it — the scope argument covers her — so it was NOT added. If the
owner wants her to have her own sentence, that is the change.

## Why this is a good stopping point

The owner's new rule is applied, guarded, measured over both corpora and driven in the real
app, and written into `CLAUDE.md` with the patient that produced it. PR #79 is green. The next
item is a **measurement**, not a decision — and doing it first may close most of what is left.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-23-c9-healthy-5to18-cdc-over-p2016`
2. **Check whether #79 merged and whether #76 was closed.** If #79 merged, branch fresh off
   `main`. **Do not leave a branch without a PR.**
3. `npx vitest run` — confirm **1,403 passing in 127 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable count use `--reporter=json --outputFile=…`.
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **23** pairs.
5. **Do the P0 measurement above before working any individual p2016 item.**
6. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix in more than one way and
   quote the counts** → **`node scripts/proseDiff.mjs dump` on both sides** (plain `node`, NOT
   `vite-node` — its CLI gate never matches under vite-node and it silently writes nothing),
   compared field by field in python → **drive the running app** → commit named by the item ID.
7. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict. Everything else where the dose is
   unchanged is yours to decide (OWNER DECISION 2026-10-18), grouped in the PR body.
8. Push/merge policy: **branch → PR → the owner squash-merges.** A session agent cannot merge.

## Lessons this session paid for

- **A case-(a) escalation can come back as a general rule.** Asked to choose between four
  dispositions for one card, the owner answered with a policy covering the whole queue.
  Offer the rule-shaped question when the per-card options all share a premise.
- **"True of the grid, false of the code" struck again, and the grid was right this time.**
  The previous handoff flagged 1,584 cards as possibly mis-cited; re-measuring confirmed the
  row fits all 1,584 grid patients — and the real problem was a patient the grid cannot build.
  **Measure the grid AND assert the patient it cannot express.**
- **An anti-vacuity floor silently absorbs legitimate drift.** `>5000` would have gone on
  passing for two more removals and then failed for a reason nobody could reconstruct. Pin
  counts exactly and keep the history beside them.
- **Read the whole table before believing a gap.** p2016 Table 2 turned out to have three rows,
  not the two the queue assumed, and Table 5 (HSCT) exists — `refs.test.js` once froze
  "p2016 has only 4 tables".
