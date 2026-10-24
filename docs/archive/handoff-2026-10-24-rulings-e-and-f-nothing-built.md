# PneumoVax — Handoff after two owner rulings on families 1 and 3; NOTHING BUILT (2026-10-24)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
**read the real port from `preview_logs`**. What the app is: a client-side React SPA giving
pneumococcal vaccine advice across the lifespan. No backend; **every clinical claim on a card
must be traceable to a document that speaks for *that patient***.

Branch: **`feature/2026-10-23-ruling-d-repeat-dose-anchor`** at `0015756`, off `main` at
`9da398d`, **pushed, nothing ahead or behind**, working tree **clean**.
[PR #83](https://github.com/jojohuhu-git/PneumoVax/pull/83) **open, green, NOT merged**.
Suite **1,438 passing in 131 files, 0 failures, 0 skips** (run this session). Uncredited
(source, statement) pairs: **1** — the Job Aid one the owner asked not to have re-raised.

Consumed and superseded: `handoff-2026-10-24-c11-grace-and-the-adult-families.md`.

## What's done

**No code changed. No tests written. No commits.** The owner stopped the session after
giving two rulings, and this handoff exists so none of it is re-derived.

1. **Baseline verified** — the numbers above are from actual runs, not the previous handoff.
2. **Her patients run through the engine** (today = 2026-10-24). All four results below are
   measured, not predicted:

| Patient | App today |
|---|---|
| **Family 3** — 50y no risk / 50y chronic heart / 30y chronic heart; PCV15 2026-07-19, PPSV23 2026-10-11 | card **"PPSV23 due — series INCOMPLETE"**, earliest **2027-07-19**; chip **"does not count"**, `repeatDueDate 2027-10-11` |
| *(control)* 30y **HIV**, same dates | **"Complete (PCV15 + PPSV23)"** — already matches her |
| **Family 1** — 70y no risk; PCV13 2016-10-13, PPSV23 2021-10-13, PCV20 2025-10-10 | PCV20 **invalid** (`ADULT-PCV20-21-5Y-AFTER-PPSV23`, `earliestValidDate 2026-10-09`, `repeatDueDate 2030-10-10`); card **"PCV20 or PCV21 … due TODAY"** |
| **Family 2** — 70y no risk; PPSV23 2025-10-11, PCV15 2026-06-19 + 2026-07-19 | both PCV15 **invalid** (`ADULT-PCV-AFTER-PPSV23`); card **"PCV ≥1 year after PPSV23 … due TODAY"** |
| *(control)* 70y; PPSV23 2020-01-01, PCV15 2023-01-01 | **"Complete (PCV15 + PPSV23)"** — her "PPSV23 alone → one PCV ≥1 year later, no further PPSV23" rule is **already built** |

## The owner's rulings of 2026-10-24 — verbatim, with what they change

### RULING E — family 3, and her own correction supersedes her first answer

**First answer (SUPERSEDED, do not implement):** *"None of the three patients needs another
dose. PCV15 followed by PPSV23 completes the series for all of them… The 10/11/26 dose was
past that minimum, so it is valid, just earlier than the recommended timing."*

**Her correction, which governs:** *"None of the three qualifies for the 8-week interval, so
the PPSV23 came before ACIP's recommended interval for all of them. ACIP does not say how to
handle a PPSV23 given 8 weeks to 1 year after PCV15 in an adult without one of those three
conditions… CDC's invalid-dose rule would space the repeat PPSV23 from the invalid dose. That
means at least 1 year after 10/11/26, so on or after 10/11/27. ACIP's adult pathway still
includes only one valid PPSV23 after PCV15. Alternative: ACIP allows PCV20 or PCV21 to
complete the series after PCV15 when PPSV23 is unavailable. Either one finishes the series
without a further PPSV23. Timing for that option after an early PPSV23 is not specified."*

**Then, third message:** *"PPSV23 to PPSV23 spacing should be 5 years but there are only
limited scenarios when a repeat PPSV23 is needed… Children: only immunocompromised children
get a second PPSV23, ≥5 years after the first."* The scenarios she listed do **not** include
a repeat of an early PPSV23 — which is why Q2 below is open rather than settled at 2027.

So family 3 keeps its floor; the dose does **not** count; only the DATE is in question.

### RULING F — family 1, unambiguous, and it reverses a floor

*"Nothing further is due if they are healthy, with chronic conditions, or immunocompromised.
Once an adult has received PCV20, ACIP recommends no additional pneumococcal doses… The only
issue is timing. If the doses were given about 4 years apart… the PCV20 came before the
recommended ≥5 years after the PPSV23. ACIP describes that as recommended timing and does not
say an earlier dose is invalid or must be repeated."*

So the PCV20 **counts**, the card must read **Complete**, and
`ADULT-PCV20-21-5Y-AFTER-PPSV23` stops being a floor — reversing her own
2026-10-11 determination for that row only. **363 cards, 132 of them currently "due today".**

### The principle she herself framed, confirmed — families 2 vs 3 follow different rules

Her question: *"isn't family 2 following the PPSV to conjugate spacing rule while family 3 is
following the CDC invalid timing rule of counting from the last dose given?"* Yes, and it
states as one rule: **only a document's own words put a dose on the clock; CDC's invalid-dose
rule supplies a length, never a new pairing.**

| Family | Mistimed dose | Dose needed | Stated interval between *those two products*? | Clock from | Date |
|---|---|---|---|---|---|
| 2 | PCV15 | a conjugate | **No** — adults have no conjugate-to-conjugate interval | the PPSV23 the row names | 11 Oct 2026 |
| 3 | PPSV23 | a PPSV23 | **Yes** — ACIP states PPSV23-to-PPSV23 (the ≥5-year row) | the PPSV23 she got | 11 Oct 2027 |

### ⚠ ONE CORRECTION TO HER STATED REASON — record it, never adopt it

She wrote twice that ACIP "names 8 weeks as the minimum interval" for PCV15→PPSV23. **The
8 weeks attaches ONLY to an immunocompromising condition, cochlear implant or CSF leak**
(mm7401a1 ≥50 row; the 19–49 chronic row says ≥1 year and names no option). For a healthy
50-year-old or a chronic-heart patient **no document names any minimum**. Neither of her
conclusions depends on the claim, so both stand — but do not let it into `CLINICAL_SPEC.md`
as fact. This is the second session it has been corrected.

## What's NOT done — TWO OPEN OWNER QUESTIONS. Ask; never default.

**Q1 — does RULING F reach family 2?** Both patients are *an adult conjugate given earlier
than ACIP's recommended interval after a PPSV23*; only the numbers differ (4 years of a
recommended 5; ~8 months of a recommended 1 year), and neither interval names a minimum.
- **Yes, both count** → family 2's patient reads **Complete, nothing due** (the engine
  already produces that once the PCV15 counts — see the control row above). 66 cards. This
  replaces her earlier *"10/11/26 is correct"*, which answered *which date*, not *does it
  count*.
- **No, only the 5-year row** → family 2 keeps its floor and a conjugate stays due.

**Q2 — family 3's repeat PPSV23 date.** Three candidates, all hers:
11 Oct **2027** (1 year from the dose given, her correction) · 11 Oct **2031** (her 5-year
polysaccharide spacing) · **no repeat PPSV23 at all — complete with PCV20 or PCV21** (her own
alternative; needs a date from her, ACIP specifies none).

## Implementation notes found this session — do not re-read the engine for these

- **Family 1 build** = `ADULT-PCV20-21-5Y-AFTER-PPSV23`, `src/logic/doseIntervalRules.js:393`:
  `enforcement: 'floor'` → `'recommendation'`, `grace: true` → `false` (the "Recommendations"
  block comment says no grace, deliberately), and a source rewritten to record the
  2026-10-24 reversal. `advise()` at `src/logic/validate.js:504` already keeps `status:
  'valid'` plus `effectiveDoseNum` and sets `earlyAdvisory` — the machinery exists.
- **⚠ HAZARD, found by reading `evaluateDoseInterval` (`doseIntervalRules.js:901`): the walk
  returns on the FIRST unmet row, floor or recommendation.** The 5-year row sits deliberately
  BEFORE `ADULT-PCV20-21-1Y-AFTER-PCV`, the 1-year conjugate-to-conjugate floor. Turn the
  5-year row into a recommendation and a dose that misses BOTH escapes the floor, because the
  walk returns at the recommendation. Order the floor first, then **count** the both-unmet
  patients and diff their prose — do not assume it is zero.
- **Same-commit edits:** `CLINICAL_SPEC.md:936` (§K row table — `rule-docs-match-code.test.js`
  compares it cell by cell) and `CLINICAL_SPEC.md:1019`. Tests naming the id:
  `regression-s14-7-one-rule-table.test.js:427` (expects a **floor** verdict with that
  ruleId), `regression-anchor-1-counting-doses-only.test.js:14` (comment), plus
  `__corpus__/verdict-corpus.tsv`. It is a **verdict move** → `npm run sweep:update` with both
  moved counts in the PR and a field-level diff (`sweep:update` calls every row moved).
- **The previous handoff's "family 1 reading error" is probably MOOT.** It proposed fixing
  `lastDoseDate()` (`src/logic/recommend.js:2825`, which builds "the last pneumococcal vaccine
  dose" from counting doses only) to get Oct 2030. Under RULING F no next dose is due at all
  for that patient. **Measure whether the reading is still reachable before building it**, and
  never build it on the old rationale.
- **FINDING, not fixed — raise, do not change.** `ADULT-PCV20-21-1Y-AFTER-PCV` enforces 1 year
  between conjugate doses as an OWNER floor, described in the code as "the second leg" of the
  5-year row. Her family-2 words — a conjugate-to-conjugate interval *"exists in no
  document"* — are in tension with that row existing at all.

## The rest of the queue — unchanged

| Priority | Item |
|---|---|
| **P2** | Patient E's "of 3" — probably not a defect; put the two readings to her first. |
| **P2** | Overdue children read oddly ("due at age 4 months" on a 12-month-old) — pre-existing on `main`, wording only. |
| **P2** | Chips print ISO dates (`2026-11-09`) while cards print `Dec 7, 2026`; cosmetic, consistent within chips. |
| **P2** | Card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread. |
| — | **C4, C5** — MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** everything the previous handoff listed, Ruling D, C11, and PR #83's
first question. The Job Aid's last statement (1,584 cards, the one uncredited pair) is still
the decision she asked **not** to be re-raised.

## Why this is a good stopping point

Nothing is half-built: the tree is clean and the suite is green at the same commit the last
session ended on. Both of her new rulings are recorded verbatim with the engine's current
answer for every patient they concern, so the next session starts at "ask Q1 and Q2" rather
than at "re-read the engine".

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-23-ruling-d-repeat-dose-anchor`
   — **or branch fresh off `main` if PR #83 has merged.** A branch stacked on an unmerged PR
   is what produced the 2026-10-23 conflict.
2. `npx vitest run` — confirm **1,438 passing in 131 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a file count use `--reporter=json` and `len(testResults)`.
3. **Ask Q1 and Q2 above.** RULING F (family 1) needs no further answer and is the one item
   buildable immediately — it is also the largest (363 cards).
4. Per item: reproduce → failing test (say the pre-fix failure count) → fix → full suite green
   → **break the fix in more than one way and quote the counts** → `node scripts/proseDiff.mjs
   dump` on both sides (plain `node`, NOT `vite-node`), compared **field by field** → **drive
   the running app** → commit per item ID.
5. Push/merge policy: **branch → PR → the owner squash-merges.** A session agent cannot merge.
   Ask her to squash-merge PR #83 so the next work can branch off `main` and arrive as one
   small PR per family, which is what lets her accept one family and refuse another.
6. If `~$INICAL_SPEC.md` reappears (a Word lock file for `CLINICAL_SPEC.md`), **never commit
   it** — `git add -A` picks it up and the root-hygiene hook correctly blocks the commit.
