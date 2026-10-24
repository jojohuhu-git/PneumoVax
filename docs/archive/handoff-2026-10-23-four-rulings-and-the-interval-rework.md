# PneumoVax — Handoff after the P0 citation measurement and four owner rulings (2026-10-23)

> **SUPERSEDED (2026-10-23)** — its P0 item (C10-1, the citation pass) is done and shipped as
> [PR #81](https://github.com/jojohuhu-git/PneumoVax/pull/81); immunize.org p2016 is now at zero
> uncredited pairs and the whole-app count is 23 → 1. Its instruction that **PR #76 must be
> CLOSED is also out of date**: #76 was merged, and the merge was a verified no-op (the trees
> before and after are byte-identical), so there is nothing to undo. Read
> `handoff-2026-10-23-c10-1-p2016-table1-citations.md` instead. **Rulings C and D are still
> live** and are carried forward there as C10-2.

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` — always
read the real port from `preview_logs`. What the app is: a client-side React SPA giving
pneumococcal vaccine advice across the lifespan. No backend; **every clinical claim on a card
must be traceable to a document that speaks for *that patient***.

Branch: **`main`**, clean, in sync with `origin/main` at **`47f75de`**. **No code was changed
this session — the owner asked for no implementation work.** Suite re-run from scratch:
**1,403 passing in 127 files, 0 failures, 0 skips.** `npx vite-node scripts/uncreditedSources.mjs`
reports **23** pairs (22 p2016 + 1 Catch-up Job Aid).

Consumed and superseded: `handoff-2026-10-23-c9-healthy-5to18-cdc-over-p2016.md`.

## ⚠ FIRST: the one thing only the owner can do

[PR #76](https://github.com/jojohuhu-git/PneumoVax/pull/76) — **CLOSE IT, do not merge.**
Re-confirmed open today. `main` already contains its commit (it arrived inside #77's squash
merge). A session agent cannot close or merge PRs. **PR #79 merged** — that is `47f75de`.

## 🔴 FOUR OWNER RULINGS FROM 2026-10-23 (afternoon) — read before any work

These came out of five worked patients. **None is implemented.** They are not yet in
`CLAUDE.md` or `CLINICAL_SPEC.md`; writing them there is part of item 1 below.

**RULING A — the document ranking for paediatric intervals and totals.** Her words:
*"The Immunize.org sheet is built from the CDC/ACIP schedule. If the two ever differ, the
CDC/ACIP schedule is the authoritative source. CDC also says its catch-up table should be
used together with the Notes. The way I interpret this is the catch up table is not the
source of truth and may be considered if immunize.org does not provide a specific
recommendation."* So the order is **CDC/ACIP schedule Notes → immunize.org p2016 → CDC
catch-up table**. It does **not** disturb the 2026-10-17 rule (CDC beats immunize.org where
they disagree); it ranks the *catch-up table* below p2016 as an adjunct.
**Two things verified live, record both:** CDC's catch-up page does say, verbatim,
*"Always use this table in conjunction with Table 1 and the Notes that follow."*
But **p2016 carries no provenance statement at all** — the whole PDF was searched: no "based
on ACIP", no CDC technical-review footer, only a pointer to CDC's PneumoRecs app. So the
ranking is an **OWNER CLINICAL DETERMINATION**, like the adult floors — not something a
document says. Do not cite p2016 for its own authority.

**RULING B — p2016 Table 1 cites the dose TOTAL, for every child.** Table 1 is headed
*"…to all children (healthy and those with risk conditions) age 2 through 23 months"*, so it
covers healthy children too. There is **no healthy/at-risk split to build** — this is a
simplification of what the previous session's P1 assumed.

**RULING C — "advice only": the validity floor does NOT change.** A dose already given is
graded by the rule that applied to that dose. Child E (below) keeps her second dose. Only the
*recommended* number moves.

**RULING D — ACIP's repeat-dose anchor is now FOLLOWED, reversing the app's behaviour.**
Her words: *"the repeat dose should be spaced from the invalid dose by the minimum interval.
This should be followed."* This **closes** the item `CLAUDE.md` records as *"Still open and NOT
to be changed without her"*. Verified live 2026-10-23 at
`https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html`:
*"The repeat dose should be spaced after the invalid dose by the recommended minimum interval
(Table 3-2)."* Worked example on the same page: *"The repeat dose should be administered ≥4
weeks after the invalid dose (in this case, the second)."*
⚠ **ACIP prints at least one per-vaccine exception to its own sentence** — for hepatitis B,
*"the repeat dose can be administered as early as 8 weeks after the 2nd valid dose"*. **Check
for pneumococcal-specific guidance that overrides the general rule before implementing.**

## The five patients these rulings were decided on

Assert these by hand in tests. **The grid cannot build most of them** — `GRID_AGES_MONTHS` is
`[2, 4, 6, 7, 12, 15, 24, 60, 72, 216, 227, 228, 600, 780, 840]`, so the 12–23-month band holds
only ages 12 and 15, and fixed day-offsets place the doses.

| | Age now | Risk | PCV doses | App today | Wanted |
|---|---|---|---|---|---|
| **D** | 15 mo | none / any | PCV20 at 3 mo | "dose 2 of 3", next due **4 weeks** after the most recent | **8 weeks** (p2016 Table 1, 12–23 mo, 1 dose before 12 mo) |
| **E** | 15 mo | none | PCV20 at 11 mo and 12.5 mo (6-week gap) | "dose 3 of 3", both count, next 8 weeks | **unchanged** — ruling C. (Minor open point: the card says "of 3"; the row she named gives a total of 2) |
| **F** | 4 mo | none | PCV20 at 2.0 and 3.0 mo | "dose 3 of 4", due **today**, 4 weeks | **routine date (6 mo) recommended, 4-week minimum commented** |
| **F+** | 6 mo | none | PCV20 at 2.0, 3.0, 4.0 mo | "dose 4 of 4", not due until 12 mo, 8 weeks | **unchanged — already correct** |
| **G** | 11 mo | none | PCV20 at 2 mo and 9 mo | "dose 3 of 3", 8 weeks, held to 12 mo | **unchanged — already correct** |

## The P0 measurement is DONE — this is its result

All 22 remaining p2016 statements were measured against the 2026-10-23 CDC-over-p2016 rule.
Both documents read live today: CDC child notes and catch-up table via the browser pane with
`textContent` (positive controls "cochlear"/"diabetes" present, 75,047 chars); p2016
re-downloaded (HTTP 200, 211,252 bytes, Item #P2016 2/16/2024, sha256 `9a59f0e4…`) and read
page by page with `scripts/pdfLayout.py`.

**18 of 22 statements — 1,633 cards — are removals.** CDC states the claim and a CDC citation
is already on the card:
- **14 statements, 1,072 cards** — the at-risk Option A / Option B cards. CDC's notes carry
  every word, the PPSV23 alternative and the IC *"at least 5 years after dose 1 PPSV23"*
  follow-on included. Every one already cites a `peds*` CDC key.
- **3 statements, 429 cards** — the routine 4-dose infant cards (`pedsRoutine4Dose` states it).
- **1 statement, 132 cards** — the five-dose card; p2016's Table 1 prior-dose column stops at 3,
  so it has no row (already settled by the previous session).

**4 statements — 781 cards — are NOT removals.** The card states a total of 2 or 3 while
footnoting CDC's *"4-dose series at 2, 4, 6, 12–15 months"* — **a quote stating a different
number from the card**. Under ruling B these cite p2016 Table 1 for the total, for healthy and
at-risk children alike. Split measured with `populationOf()` (not a raw risk list — adult-only
ticks inflate it): 366 child-routine, 610 child-nonIC, 366 child-IC.

## The remaining queue — three items, in order

| Priority | Item | Scope |
|---|---|---|
| **P0** | **C10-1 — the citation pass** | Cite p2016 Table 1 for the dose total on the 781 cards; remove p2016's stale chip from the 1,633 others; cite CDC's catch-up table for the **interval** cells only (dose 1→2, 2→3, 3→4), never for a total; quote the dose-4 sentence (*"only necessary for children age 12 through 59 months regardless of risk, or age 60 through 71 months with any risk, who received 3 doses before age 12 months"*) **only on cards where the patient matches it**. Also: `pcvInfant` spreads one flat `refs` list (`recommend.js:386`) over every card it builds — the shape `CLAUDE.md` forbids. Give it the `adultRefs` / `childRefs` / `healthyRefsExcept` treatment. **No verdicts move.** Decide-alone per the 2026-10-18 rule; group the judgement calls in the PR body. **There is no refs.js entry for CDC's Catch-up Immunization Schedule** — it must be added; the app implements it in `intervals.js` and shows it on no card. |
| **P1** | **C10-2 — routine interval vs minimum interval** (rulings C + D, and D's absorbed) | Recommend the **routine** date and **comment the shortest interval**, the way the adult side already does — copy the shape of `adultPpsvRecommendedInterval()` / `adultPpsvShorterMinimumOffered()` in `riskFactors.js`. Child D's 4→8 weeks falls out of this, so items 2 and 3 of the session's discussion are ONE piece of work. **This moves verdicts** — it changes which infants read "due today" — so both corpora must be re-measured and the counts explained in the PR. Then apply **ruling D**: anchor a repeat dose to the **invalid** dose + minimum interval, not to the last valid dose. **Open design question the owner has already agreed is a real one:** a child genuinely behind (first dose at 9 months, say) has no routine date left — her card must fall back to the minimum. Decide that shape and say so in the PR. |
| **P2** | Unchanged from the previous handoff | Card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** the Table 2 5–18 gap; FINDING L (wrong premise); the p2016/576
question; "add a number-has-a-chip guard" (G2 does it); the Catch-up Job Aid's 144-card
statement; **and the "last valid dose" anchor, now settled by ruling D.** The Job Aid's other
statement (1,584 cards) remains the decision the owner asked **not** to be re-raised.

## Why this is a good stopping point

The P0 measurement the previous handoff asked for is finished, and it did collapse the queue:
18 of 22 statements are removals needing no decision, and the healthy/at-risk split the
previous session expected does not exist. Four owner rulings are recorded with the patients
that produced them and the documents read live. Nothing is half-built — the tree is clean and
the suite is green, because the owner asked for no implementation this session.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. **Check whether #76 was closed.** Branch fresh off `main`; do not leave a branch without a PR.
3. `npx vitest run` — confirm **1,403 passing in 127 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable count use `--reporter=json --outputFile=…`
   and read `len(testResults)` for the file count (`numTotalTestSuites` is 449 and is NOT files).
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **23** pairs. Re-measure, never
   quote a count from a log or a handoff.
5. **Write the four rulings into `CLAUDE.md` and `CLINICAL_SPEC.md` in the same commit as the
   code they govern** — they are nowhere yet.
6. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix in more than one way and
   quote the counts** → **`node scripts/proseDiff.mjs dump` on both sides** (plain `node`, NOT
   `vite-node` — its CLI gate never matches under vite-node and it silently writes nothing),
   compared field by field in python → **drive the running app** → commit named by the item ID.
7. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict. C10-2 **is** case (c) — its moved
   counts go to the owner before merge. Everything else where the dose is unchanged is yours
   to decide (OWNER DECISION 2026-10-18), grouped in the PR body.
8. Push/merge policy: **branch → PR → the owner squash-merges.** A session agent cannot merge.

## Lessons this session paid for

- **A patient example can be wrong in the direction that matters.** Child D was offered to the
  owner as evidence that an interval change moves due dates. It does not — she is overdue
  under both numbers, so only the printed sentence changes. The real bite was on *grading* a
  dose already given, and that only surfaced after running Child E. **Run the patient before
  describing what she shows.**
- **"The two documents disagree" was half of it.** p2016 also disagrees with ITSELF here: its
  Table 1 row says 8 weeks where its footnote † says a 4-week minimum. The row is a schedule,
  the footnote is explicitly "Minimum interval between doses". That distinction is what
  dissolved a finding that looked like a regression risk — and it is the third time a p2016
  self-contradiction has settled a question (cf. the 2026-10-17 IC PCV20 timing ruling).
- **`populationOf()` or the count is wrong.** A first pass keyed "at risk" off a non-empty
  `riskIds` and reported 1,220 at-risk / 122 healthy. The real split is 976 / 366 — smoking and
  alcoholism are adult-only ticks and the grid applies them to babies.
- **Ask the owner to confirm what her own sentence settled.** One clause — "based on the last
  valid dose" — would have closed a flagged open item by inference. Put back to her
  explicitly, she reversed it and chose ACIP instead.
