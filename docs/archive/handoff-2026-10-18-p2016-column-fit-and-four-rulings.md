# PneumoVax — Handoff after the p2016 column-fit audit and four owner rulings (2026-10-18)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.

Branch: **`main`**, in sync with `origin/main` at **`a7dc1e3`**, working tree **clean**.
Suite **1,256 passing in 108 files**, all green, no skips (measured twice this session).
Uncredited (source, statement) pairs: **43** — `npx vite-node scripts/uncreditedSources.mjs`.

**NO CODE WAS WRITTEN THIS SESSION.** It was an audit + owner-decision session, and the
owner chose to do the implementation in a fresh conversation. Everything below is measured,
not remembered. Four findings are newly discovered here and exist in no earlier document.

PR #69 was already merged when this session began; `feature/2026-10-18-c8-doc3-p2016` can
be deleted.

⚠ `scripts/proseDiff.mjs` needs plain **`node`**; `scripts/uncreditedSources.mjs` needs
**`vite-node`**. No `timeout` command on this machine. The dev server's reported port has
been wrong before — read it from `preview_logs`.

## THE NEW OWNER RULE THAT DRIVES ALL OF THIS

> **"If using p2016 tables, all columns need to fit patient criteria in order to use
> recommendations."** (owner, 2026-10-18)

p2016 Table 4's columns are **Child's age now | Number of previous PCV13, PCV15, or PCV20
doses | Option A | Option B**. A row governs a patient only when the age column AND the
prior-dose column both fit. Matching the age band alone is not enough — the prior-dose
column is where every finding below was hiding. This rule also answers C7's long-open
**structural question** (may a table cell be quoted as governing text?): yes, with that
constraint. The owner quoted p2016 cells as governing text throughout this session.

Read p2016 with `scripts/pdfLayout.py` so each cell keeps its row and column. Downloaded
live this session: HTTP 200, 211,252 bytes, Item #P2016 (2/16/2024) — unchanged edition.

## Sources verified live this session (quote these, do not re-derive)

1. **MMWR Sept 16 2022, Vol 71 No 37, p.1176**, heading *Recommendations for Use of PCV*
   (local copy: `~/Downloads/pneumococcal children 2022.pdf`; app ref key `mmwr7137a3`):
   > "ACIP recommends use of PCV (either PCV13 or PCV15) for all children aged 2–59 months.
   > In addition, risk-based PCV use is recommended for children aged 60–71 months with risk
   > conditions, and persons aged 6–18 years with an immunocompromising condition,
   > cerebrospinal fluid leak, or cochlear implant. **For all recommendations, PCV13 and
   > PCV15 can be used interchangeably.** Interruption of the vaccination schedule does not
   > require reinstitution of the entire series or the addition of extra doses."

2. **CDC, Summary of Risk-based Pneumococcal Vaccination Recommendations**, page dated
   **MAY 8, 2026**, read fully expanded in the browser.
   `https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html`
   Its **"Children 6 through 18 years old"** section has only TWO history branches:
   *"Never received PCV13, PCV15, or PCV20"* and *"Received PCV13 or PCV15 **before age 6
   years**, never received PCV20"* (then split IC / non-IC, then on PPSV23 received or not).
   **CDC has no branch for a conjugate dose given at or after age 6** — that is p2016's
   rows 8/9 territory, and the two documents give identical advice for the two age placements.

3. **p2016 Table 3** risk lists (needed to read Table 4's non-IC / IC rows): non-IC =
   chronic lung, chronic heart, chronic liver, diabetes, CSF leak, cochlear implant, chronic
   kidney (except as IC-listed). IC = asplenia, congenital/acquired immunodeficiency,
   immunosuppressive drugs/radiation, HIV, solid organ transplant, sickle cell, dialysis,
   nephrotic syndrome.

## The four OWNER RULINGS given this session

1. **Unknown-product dose (102 cards).** It cannot be assumed a PCV20 was given. Since
   PCV13 and PCV15 give the same answer, use p2016's **6–18y rows 8/9** recommendations:
   1 dose PCV20 ≥8 weeks after the most recent PCV dose, **or** 1 dose PPSV23 ≥8 weeks
   (IC keeps its 5-year follow-on). The engine already outputs exactly this — **wording only.**
2. **FINDING I (96 cards)** — cite CDC's risk-indications 6–18 guidance quoted above.
   The engine's dose is already right; wording + citation only.
3. **FINDING J (864 cards)** — "as long as they received a PCV20 dose at least 8 weeks
   after the last PCV dose, their vaccinations are complete", per the same CDC page.
4. **PCV13 and PCV15 are interchangeable when assessing how to move forward in the
   schedule.** This settles FINDING D and the PCV15 half of the 112.

## What's NOT done — the queue, in priority order

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`.

### P0 — settled by an owner ruling, ready to implement, no decision needed

| ID | Cards | Scope |
|---|---|---|
| **FINDING H** | **380** | Card says *"Non-immunocompromising at-risk child with **PCV13** at/after age 6 who has received PPSV23 — no further doses"* to children who had **PCV15 (310)** or an **unknown product (70)**. Verified against a PCV13 control patient: **byte-identical output**, so the engine is not reading the product on this branch. FINDING G fixed this shape on the *no-PPSV23* branch and left the *PPSV23-given* branch untouched. Verdict ("complete") is RIGHT and must not move — wording + citation only. |
| **The 112 residue** | **112** | Card says *"…child 6–18 years with **PCV13 only** (at/after age 6)"* to PCV15 (64), unknown product (32), PCV15 + a rejected same-day PCV20 (16). Pinned by part D of `regression-c8-2026-10-18-card-names-the-history-the-patient-has.test.js`, which asserts `toBe(112)` — **that test must be updated in the same commit.** |
| **FINDING I** | **96** | Card says *"…child who completed PCV13/15 **before age 6**…"* to a teenager vaccinated at 17. Root cause is one line: FINDING G's `if (pcv.count >= 3 \|\| allCountingPcvBefore72mo)` at `src/logic/recommend.js:1049`. The `>= 3` half was kept deliberately for **undated** histories but also catches **dated** 3-dose histories given at/after age 6. Split: 16 without PPSV23, 80 with. |
| **FINDING J** | **864** | Remove p2016 from the *"At-risk child whose PCV series includes PCV20"* cards and cite CDC risk-indications instead. p2016's only matching row demands *"Completed PCV series before age 6 years, including one or more doses of PCV20"*; **864 of 960 don't fit** (PCV20 given at 17–18). Only 96 fit. The `[c]` number already points at CDC's notes, which carry no age condition. **Verified: no logic change needed** — the engine already rejects a PCV20 given <8 weeks after a prior PCV (5 weeks → rejected, not complete; 9 weeks → complete). |
| **Interchangeability citation** | — | Add a quoted refs entry for the MMWR sentence above. `mmwr7137a3` exists at `src/data/refs.js:988` as an unquoted whole-page entry, `rulebook: 'child'`, no `population`. Owner confirmed the sentence applies to **all paediatric risk classes** — set `population` accordingly, or `regression-2026-10-17-every-quote-names-its-patient.test.js` will fail. |

**Verified patients for each (run these, don't invent new ones):**
- FINDING H: 18y0m, chronic heart disease, one PCV15 at age 16, PPSV23 at 17.
- 112 residue: 18y0m, cochlear implant, one PCV15 at age 16, no PPSV23.
- FINDING I: 18y0m, asplenia, three PCV13 at 17y5m / 17y7m / 17y8m, all valid, no PPSV23.
- FINDING J: 18y0m, asplenia, PCV13 at age 8 and PCV20 at age 17.

### P0 — ONE JUDGEMENT CALL the owner has not yet answered

**Which document goes on FINDING I's cards.** The owner pointed at CDC's 6–18 guidance, but
that branch is headed *"Received PCV13 or PCV15 **before age 6 years**"*, which under her own
all-columns rule does **not** fit a teen vaccinated at 17. **p2016 rows 8/9** (*"PCV13 only,
given at or after age 6 years"*) fit exactly and give word-for-word the same advice. This
session's proposal, put to her and **not yet answered**: cite **p2016 rows 8/9** for the
at/after-6 children and **CDC's branch** for the genuinely-before-6 ones. Same dose either
way. **Ask, do not default.**

### P0 — THE PROCESS QUESTION, asked by the owner and left open

She asked: *"a mix of references need to be used… Are you able to make these judgement
calls or do we need to run through each specific case to confirm recs."*

The proposal put to her, awaiting sign-off:
- **Decide without asking** when the documents agree on the dose and the only question is
  which one goes on the card. Rule: a card carries every document that has a row whose
  columns all fit this patient, and none that don't. The dose never changes.
- **Always escalate** three cases: (a) no document has a row for the history; (b) two
  documents give different doses; (c) the change would move a verdict, not just wording.
- **Pair it with a machine guard** — extend the citation test so every cited document must
  have a row whose columns all fit, failing the suite otherwise. Rationale given to her:
  FINDING F got six removals approved on a reading that never opened mm7401a1's table, and
  three of this session's first five column-fit predicates were wrong (caught only by
  re-running against hand-built patients). A promise is not a guard.
- **List every judgement call in the PR body**, grouped, so she audits them in one place.

She may also want this written as a `CLAUDE.md` section before any code lands — she was
offered that and did not choose.

### P1 — unchanged from the previous handoff

| Item | Scope |
|---|---|
| **C8 doc 3 — p2016's remaining CITEs** | 33 statements, 8,235 cards. The structural question is now answered (see the owner rule above), so these are unblocked apart from the per-card column check. |
| **C8 — Catch-up Job Aid** | Statement 1 (1,584 cards) is the decision she asked **not** to be re-raised — **do not re-ask**. Statement 2 (144 cards) is a clean CITE. |
| **C8 — CDC Child/Adolescent Notes** | 7 statements, 1,115 cards. Two are fallout from FINDING 2 moving a number onto MMWR and leaving 220 five-dose cards with a numberless grey chip. |
| **C8 — CDC Adult Notes** | 1 statement, 25 cards. |
| **`CLAUDE.md` corpus sizes are stale** | It says 16,008 and 17,652. Counted from the committed files this session: **17,016** (`verdict-corpus.tsv`) and **18,264** (`record-problem-corpus.tsv`). Flagged to the owner, deliberately not silently corrected — it is her rulebook. |
| **Grid gap, recorded not fixed** | `buildCases()` cannot express p2016 row 2's patient (0 of 440 at-risk 24–71mo cases have 3 doses all before 12 months). Adding that history moves both corpora and needs the owner. |
| **Dead `advisory` flag** | Owner approved removal as its own change; needs a field-level corpus diff to show 0 real verdict moves. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. |
| **Job aid footnote §, unread** | p.1 carries PPSV23 minimum intervals after PCV13. Nothing rests on it. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

## Why this is a good stopping point

Nothing is half-applied — no code changed, the tree is clean, and the suite is green at the
same commit `main` already had. Every finding is measured against the committed grid and
reproduced on a hand-built patient, and every source is quoted from a live read dated today.
The four owner rulings are recorded with the patients that produced them, so the next session
starts at implementation rather than at re-discovery.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull --ff-only`
2. Run `npm test` — confirm **1,256 passing in 108 files**, no skips, before any new work.
3. `npx vite-node scripts/uncreditedSources.mjs` — confirm **43** pairs. Never quote a count
   from a log; the logs predate the IC-children fix and read low.
4. **Answer the two open questions first** (the FINDING I citation call, and the process
   rule). **Ask, do not default.** Her standing instruction: *"If you need other citation
   decisions, I need the age, risk factors and vaccine history to find them for you."*
   Decisions come back immediately when put as patients and get bounced when put as
   statements.
5. Branch off `main`, then per-item: reproduce → failing test (**say the pre-fix failure
   count and check it is the number you expected, not merely non-zero**) → fix → full suite
   green → **break the fix and quote the counts** → **`node scripts/proseDiff.mjs` and
   classify every changed line** → **drive the running app** → commit named by the item ID.
6. **No verdict should move** on any P0 item above — all four are wording and citation. If
   `sweep-verdict-corpus.test.js` moves, stop and work out why before running
   `npm run sweep:update`.
7. Push/merge: branch → PR → squash merge, then confirm the Pages deploy. This session's
   model could not merge (`gh pr merge` is blocked by the auto-mode classifier); hand over a
   green PR if that is still true.
