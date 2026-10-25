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

## Two things for her, recorded and NOT changed

Both surfaced while measuring the nuance block. Each would move doses, so neither was
touched. They are in `CLINICAL_SPEC.md` §K-EVIDENCE with the measurement.

1. **The same 5-year gap carries two different authorities.** A child's second PPSV23 inside
   5 years is voided on **CDC's** authority; an adult's is voided on **the owner's**. The
   child row rests on CDC's *"at least 5 years"* and the adult rows on *"should be
   administered"* — a real difference in CDC's verbs, but the same number, the same vaccine
   pair, the same clinical question. The page says both, plainly.
2. **A conjugate after a PPSV23 is a hard stop in an adult and is not judged at all in a
   child.** Measured: a 6-year-old with asplenia given PPSV23 then PCV20 a week later gets
   `status: valid`, no rule, no note. The adult bar is her ruling of 2026-10-24 (§K-INVALID);
   the child silence is nobody's decision — it is a row that does not exist.

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
