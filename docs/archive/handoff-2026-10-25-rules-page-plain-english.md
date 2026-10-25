# PneumoVax — Handoff after the rules-page plain-English pass (2026-10-25, later session)

Branch: **`claude/sharp-rubin-2y3rw3`**, off `main` at `1c3fe52` (PR #87, merged).
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.

Baseline at the start of this session was **1,606 passing in 144 files**; now
**1,626 passing in 145 files, 0 failures, 0 skips**.

**No clinical rule changed. No verdict moved. No card a patient or clinician sees changed:**
`node scripts/proseDiff.mjs diff` reports **0 of 35,280 lines changed** across both grids,
and both sweep corpora are byte-identical.

## What she asked for, and what was built

Three asks, all about the "How recommendations are made" page built by C14.

### 1. "42 days is hard to comprehend" (section 3)

The products table printed the conjugate minimum age as the figure it is STORED in. It now
goes through `ageInWords()` in `src/data/rulebook.js`, which hands a day-stated minimum to
`intervalPhrase` — the app's single place where a day count becomes words. The conjugates
read **6 weeks**, PCV21 **18 years**, PPSV23 **2 years**. The stored figure and every
validity check are untouched; only the words moved.

### 2. "there should be a section where nuance is applied" (section 4)

New block, **"Where the evidence runs out"**, and each rule now carries a **"this app"** or
**"CDC / ACIP"** tag read from its own `authority` field. All of it is `CLINICAL_SPEC.md`
§K's own determination of 2026-10-11 and its evidence, said to the clinician the rule is
applied to rather than left in a file.

**⚠ HER PREMISE NEEDED ONE CORRECTION, AND IT IS WHY THE BLOCK SPLITS BY AGE.** She said
there is no data on the minimum duration between PPSV23→PPSV23, PCV→PCV or PPSV23→PCV.
That is an **adult** fact. For a CHILD those minimums ARE published — CDC's catch-up
schedule prints a column headed *"Minimum Interval Between Doses"*, which is the column that
voided the 15-month-old's third dose on 2026-10-23. Writing her sentence flat would have
contradicted this app's own paediatric floors. Every claim in the block is therefore made
per age group. **Raise this with her** — she may not have meant children.

### 3. "clean up extraneous language… simplify the explanations"

- **Rule ids are off the page.** `CHILD-PCV-AFTER-PCV` and the other 16.
- **Three outcomes, one vocabulary**, hers: *On time* / *Off schedule, still valid* / *Not
  valid — repeat it*, plus *Not judged*. `enforcement` maps onto them one to one, so a
  reader never meets the engine's word and the page's word for the same thing.
- **Each rule now states its interval** ("Minimum: 8 weeks", "Recommended: 1 year"),
  generated from its own `interval:` spec. The page previously named no numbers at all,
  so it could not answer the question its own heading asked.
- **The authority explanation appears once**, not on all 17 rows — that repetition was most
  of what made the section long.
- **The 17 rule descriptions were rewritten** for a clinician reading cold. `what` is not
  one of the seven cells `rule-docs-match-code.test.js` compares to §K, so §K is untouched
  and still matches.
- A never-flagged rule now says WHY (`whyNotJudged`, new field, required on
  `enforcement: 'none'` rows). Without it the page said "no interval is applied" and
  stopped — which on `ADULT-PPSV23-AFTER-PCV15-MEETS-SHORTER-ADVICE` was misleading, because
  a SHORTER gap there is still caught by the floor row.

### 4. "Make it clear distinctions on child vs adult rules"

Each group in section 4 is now a band carrying its **age range** (interpolated from
`ADULT_SCHED_MIN_M`, so it can never disagree with section 1's boundary table) and a one-line
statement of what KIND of rule it holds:

- **Children — under 19 years.** *“CDC states these as MINIMUM intervals, in those words. A
  dose given sooner does not count, and the series still owes one.”*
- **Adults — 19 years and over.** *“CDC states these as the RECOMMENDED spacing for the next
  dose, and states no minimum at all. Where a rule below still refuses a dose, it is tagged
  ‘this app’ …”*

Guarded: every `rulebook` value the engine uses must have a group, the heading must carry the
boundary constant, and the two leads must actually say MINIMUM and RECOMMENDED.

## Two things for her, recorded and NOT changed

Both surfaced while measuring the nuance block; each would move doses. **Laid out as two
tables in `CLINICAL_SPEC.md` §K-EVIDENCE** — age, risk, doses on record, interval applied,
what the app actually says, and the reference under it — at her request on 2026-10-25. Every
cell is the running engine's own output, and the four patients are pinned by
`regression-2026-10-25-rulebook-evidence-limits.test.js` so the tables cannot drift from the
code the way the post-transplant schedule did.

1. **Tension 1 — the same 5-year gap, two different authorities.** A 10-year-old and a
   60-year-old, both with asplenia, both PPSV23 2024-01-01 and 2025-01-01. Identical verdict,
   identical 2030 date — but the child's rests on CDC's *“at least 5 years”* and the adult's
   on the owner's determination of 2026-10-11, which the adult's own dose text says
   (*“not by ACIP”*).
2. **Tension 2 — a conjugate after a PPSV23.** A 6-year-old and a 60-year-old, both with
   asplenia, both PPSV23 2026-01-01 and PCV20 2026-01-08. The child: both doses valid, no
   note at all, card reads **“PCV complete (includes PCV20)”**. The adult: the PCV20 **does
   not count**, repeat from 2027-01-08. The adult bar is her ruling of 2026-10-24
   (§K-INVALID); the child silence is nobody's decision — a row that was never written.

§K-EVIDENCE lists her options under each, with which of them move doses.

## The preview

Published as a private artifact: **https://claude.ai/artifact/Fnwi4W8htqsSrQBto9zkiR**

Built with `npx vite build --base ./ --outDir dist-preview` (relative base; the committed
config's `/PneumoVax/` base is untouched, and `dist-preview/` is gitignored). **The published
page is deliberately NOT a whole HTML document** — the artifact service wraps the page in its
own `<html>/<head>/<body>`, so the first attempt nested one document inside another. It is
now the stylesheet link, `<div id="root">` and the module script, nothing else. Verified by
rebuilding that exact wrapper locally and rendering it: app mounts, both group bands present,
**0 console errors**. Rebuild and republish to the same URL after any UI change — the
artifact does not follow the repo.

## How it was verified

- **Seven mutations, all caught**, each restored from a backup copy and never by
  `git checkout`: `ageInWords` ignoring the day figure (**2** fail); a hand-typed age in a
  page sentence (**1**); a floor's number labelled *Recommended* (**1**); the rule ids put
  back (**1**); the child second-PPSV23 rule relabelled as the app's own (**3**); the adult
  conjugate-after-PPSV23 floor turned into a note (**1**); a new rule judging a child's
  conjugate after a PPSV23 (**1**).
- **Driven in the running app** at 980px and at 390px. The phone pass found a real defect in
  the first draft: the nuance table's "In a child / In an adult" headers are hidden by the
  page's own mobile rule, leaving two sentences running together with no way to tell which
  patient each was about. It is a labelled list now, not a table.
- `npm run build` clean.

## Guards

| File | Holds |
|---|---|
| `src/components/__tests__/regression-c14-…-rulebook-matches-the-engine.test.jsx` | every number on the page is a constant; every list is the engine's; no rule id is printed; a floor's number is not labelled as advice |
| `src/data/__tests__/regression-2026-10-25-rulebook-evidence-limits.test.js` | every cell of the nuance table driven through `analyzeBoth()` on a named patient; every OWNER rule is an adult rule; every child rule is CDC's |

### 5. Worked examples (her 2026-10-25 ask)

New **section 5, “Worked examples — a history in, a dose out”**: 14 patients, 7 children and
7 adults, put through `recommend()` when the page loads. Her reason is the requirement:
*“to make this easier to validate and follow for future updates”*, so **nothing in a row is
typed** — the risk words are the risk factor's own label, the history is written out from the
dose list (a child's doses by the AGE they were given at, an adult's by how long ago), and
everything right of it is the engine's answer. Two of the 14 are the §K-EVIDENCE tension
patients, pinned by name in the guard.

## THE OWNER'S 2026-10-25 REVIEW OF THE TWO TENSIONS — READ THIS FIRST

Full detail, with the measurement, in `CLINICAL_SPEC.md` §K-EVIDENCE.

**Tension 1 — nothing changes.** She is right and the app already agrees: a PPSV23-only adult
is offered a conjugate at ≥1 year (card: *“PCV (PCV15, PCV20, or PCV21) ≥1 year after
PPSV23”*), and PneumoRecs says the same. The 5 years is applied only to PPSV23→PPSV23. **One
open item:** she asked that `rr7203a1` be CITED for the 5-year rule. The entry exists and the
rule's `source` names it in prose, but it is on no card because §K's standing rule of
2026-10-16 says never to cite it for an adult interval. That rule was made about the adult
PCV15→PPSV23 interval. **Ask her whether it now reads “never for an adult CONJUGATE
interval”.**

**Tension 2 — I WAS WRONG, AND IT IS A DIVERGENCE BUG.** The previous entry said no source
states a paediatric conjugate-after-PPSV23 interval. She supplied one: ACIP 2023
PCV20-in-children **Table 1**, the 6–18 no-previous-conjugate row, *“≥8 weeks after the most
recent dose of pneumococcal vaccination”* — and that document is **already in `refs.js`**.
PneumoRecs prints the same 8 weeks. **And the app already says it on the recommendation
side** (`pcvRiskChild` Option A, `anchorPneumo` + `WK8`) while validating nothing — the exact
“two numbers for one dose” shape P0 was written to end.

**Measured, as a throwaway mutation, then reverted: 198 of 17,016 real patients move** (104
recommendations, 94 dose chips only) and 22 of 18,264 impossible entries. 132 are 6–18, 66
are 19+ with a childhood dose. **NOT BUILT** — it moves verdicts, so it is hers. Two
questions go with it: does the floor stop at age 6 (her row says “6–18”; an age split must be
a SECOND ROW), and is it a floor or a note (the mirror direction,
`CHILD-PPSV23-AFTER-PCV`, is a floor on CDC's authority from an equally
recommendation-shaped sentence)?

**⚠ cdc.gov is DENIED by this container's network policy**, so neither document could be
re-read live this session. Everything above rests on her quotes, on `refs.js` entries that
earlier sessions verified live, and on the PneumoRecs resolver. **A session that can reach
cdc.gov should re-read ACIP 2023 Table 1 and mm7401a1 before the fix lands** (FINDING F: read
the document, including its tables).

## What is NOT done — the queue, unchanged from the previous handoff

| Priority | Item |
|---|---|
| **P1 — OWNER DECISION** | The 40 Group-B cards. Carried over untouched. Ask; do not widen it alone. |
| **P1 — OWNER DECISION** | The three wording items from the 66-patient comparison, in PR #87's body: the healthy 5-year-old told "Not indicated"; the 25-year-old with asplenia told "Complete"; **the PCV-naive 2-year-old told "≥8 weeks after the most recent PCV" when there is no most recent PCV** (flagged 2026-10-17, still unfixed). |
| **P2** | Patient E's "of 3"; dead `advisory` flag; `intervalWords().adj` has no consumer; the long PCV7 non-counting sentence. |
| **P2** | `docs/agent/testing.md` calls §K's rule table "the 16-row table"; it has had 17 rows for some time. One stale number, nothing rests on it. |
| **P2** | On a phone the PRODUCTS table (section 3) still stacks without its headers, so "6 weeks" sits on a line of its own. The same fix as the nuance block would work — labels in the cells. |
| **P2 — DESIGN PARITY** | MeningoVax has neither of C14's two surfaces, and now neither of this pass's. Consult `vaccine-parity` first. |
| — | MeningoVax: she wants the same audit there. Not started. |

## Resuming

1. `npx vitest run --reporter=json` — confirm **1,626 passing in 145 files** before any new work.
2. Put the two §K-EVIDENCE questions to her, with the named patients above.
3. Her standing style rules: plain language for a non-coder, specific patient examples, card
   text abbreviated with an expander, worded clinically and succinctly.
