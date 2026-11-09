# Plan — bringing PneumoVax's way of working to MeningoVax (DRAFT, 2026-11-08)

**Status: draft for the owner to review. Nothing in MeningoVax has been changed.** Revised the same day to list every presentation decision (the section "Every PneumoVax presentation decision").
MeningoVax repo: `/Users/joannehuang/Downloads/MeningoVax-main`, `main` at `c1118c1` (2026-10-17).
PneumoVax's `main` has 50 commits since that date (counted 2026-11-08 with `git log --since`). This is the one real plan for the port; when
work starts, MeningoVax gets a pointer file to it, not a copy (memory `both-apps-docs-are-pointers-not-copies`).

## The goal, in the owner's words (2026-11-08)

> The goal with meningovax is the same as pneumovax. The goal apps is to use age, risk factors
> and prior vaccine history to help assess the appropriateness of prior doses given as well as
> forecast when and what subsequent doses are due. The recommendations should all be pulling
> from the rulebook. Dates or ages when next doses are due should be clearly stated under
> recommendations. Any dose that does not follow standard schedules should have some feedback as
> to if the dose is counted but unnecessary/extra or if doses are valid based on standard/catch up
> schedules, or if doses are valid based on app specific guidance. Invalid doses should also be
> flagged as to whether they should be repeated or not repeated in future doses. Explanations
> under why this or next to dose chips should be stated in simple clear clinical language and
> should not sound AI generated.

## Ground rules for every step

- **Port the rule, not the code.** The two engines are different shapes. Each step starts by
  reading MeningoVax's own `recommend.js` / `validate.js` for that behaviour (memory
  `read-the-engine-before-offering-options`).
- **Nothing pneumococcal carries over.** p2016, PCV7, the PCV15→PPSV23 pairing, the IC/non-IC
  child split, the thrown-out PPSV23 rulings: none of these exist in meningococcal vaccination.
- **Meningococcal rules are read live** from CDC/ACIP before any clinical change
  (`verify-clinical-source` skill). A PneumoVax ruling is never applied to MeningoVax as if
  it were a meningococcal one; where the same QUESTION comes up (for example "is a dose given too
  soon repeated?"), it is put to the owner with a meningococcal patient.
- **One PR per step**, `fix-queue` loop: reproduce, failing test, fix, full suite, break each new
  clause, check in the running app.
- Mirror files stay identical (`dateUtils.js`; the transplant hard stop) — already enforced by tests.

## What MeningoVax has today, against each part of the goal

Surveyed 2026-11-08 by reading the code; each line still to be measured before its step starts.

| Part of the goal | PneumoVax now | MeningoVax now |
|---|---|---|
| Every rule from the rulebook | `CLINICAL_SPEC.md` + a test comparing its rule table to the code cell by cell | `docs/agent/meningococcal-rules-summary.md` + `rule-docs-match-code.test.js` (exists — scope not yet checked) |
| One place for every interval rule | `doseIntervalRules.js`, each row marked "voids the dose" or "advice only" | No table; intervals are spread through `validate.js` (1,346 lines) and `recommend.js` |
| A changed answer cannot slip through | Two committed verdict lists (17,016 real + 18,264 impossible patients) and a prose diff | A shared test grid (`src/test-grid.js`) and three sweeps, but no committed verdict list and no prose diff |
| The app agrees with itself | Seven whole-app checks over 77,496 patients, four of them required tests | None |
| Dates clearly stated | "Next dose due <date>" (Remy, 2026-11-07); the routine date advised, the minimum stated beside it | "Next dose not yet due - eligible <date>" (`RecCard.jsx:472`) |
| Repeat dose measured from the dose given (Ruling D) | Yes | **No** — measured 2026-11-01: a 20-year-old with asplenia, Menveo 8/1 then 8/22, is advised 9/26; CDC's rule gives 10/17 |
| Every recorded dose gets one label from a closed list | Yes (§M): counted / extra / valid by catch-up / valid by app rule / not counted–repeat / not counted–do not repeat / record problem | Partly: `doseChipLabel.js` has "Extra dose", "Dose N of M", record problems — but one plain "Invalid" with no repeat / do-not-repeat split |
| Plain clinical wording | Her §M-L3 style rules, swept by test | "Why this" lead/detail split exists; no style rules applied |
| Short card with details behind "Why this" | The fold (WORD-1) — **she chose "PneumoVax only" on 2026-11-06** | Not folded |

## Every PneumoVax presentation decision, and whether MeningoVax has it

Added 2026-11-08 at the owner's request: *"I want to make sure all work on pneumovax is captured in
meningovax plan. This includes consistency with the chip recommendations used, citing sources using
the same superscript order, using the same succinct clinical language throughout etc."*

The first draft of this plan named the five goals but **did not list these decisions**. They are listed
here one by one so that none is lost. "MeningoVax now" is from reading its code on 2026-11-08, and
"to measure" means not yet checked. Each row gets measured before its step starts. The **Step**
column says which step below carries it.

### A. The label and line beside a recorded dose

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| A1 | Every dose starts with exactly one label from a closed list: Dose N / Dose N of M; Counted — given early, accepted; Counted — not needed; Counted — product not recorded; Counted — date not recorded; Not counted — Extra. Do not repeat.; Not counted — repeat; Not counted — do not repeat; Check the date. | §M, 2026-11-08 | Own list in `doseChipLabel.js`: "Extra dose — more than this series needs", one plain "Invalid", "Off-window - repeat", "Booster" | 4 |
| A2 | Green for counted, blue for extra/not counting, red for not counted, grey for record problems | §M | to measure | 4 |
| A3 | A dose rejected for timing is "do not repeat"; a dose rejected for age or product is "repeat" | W1 (2026-10-11), §M | Uses "repeat this dose only (do not restart the series)" for most invalid doses | 4 |
| A4 | The line beside the label: the label plus one reason; answer first; about the patient, not the document; one idea per sentence; no semicolons, at most one dash; no arguing; never repeats the label; same situation same words; plain clinical terms and US spelling (no "~", "at birth", "about 18 months"); bold only the decision | §M-L3 style rules, 2026-11-08 | Not applied | 6 |
| A5 | Next-dose wording on a dose line: "Next dose from <date> at the earliest". The line never states the due date, because only the card knows the routine date. | 2026-10-24 ruling, §M-L3 rule 9 | to measure | 5 |
| A6 | A dose line never promises a date for a dose no card asks for | §K-NOPROMISE (2026-10-25), §C-P2-R4 (2026-11-08) | to measure | 5 |
| A7 | State the shortfall against the rule ("shorter than the 5 years ACIP advises"), not just the rule | owner, 2026-10-25 | to measure | 6 |
| A8 | Explanations sit under "Why this" beside the dose, not in the line | 2026-10-25; §M "Ok to live under why this for all explanations" | Card notes have "Why this"; dose lines to measure | 6 |
| A9 | A record problem (future date, before birth, entered twice) takes neither a repeat nor a next-dose sentence | S10-N2 | Has this; the wording was ported FROM MeningoVax and has since diverged (§M-L3 note) | 6 |
| A10 | A dose rejected for AGE names no product ("any vaccine approved for that age"); a dose rejected for the wrong PRODUCT names the one to give ("Give PCV20 instead. Do not restart the series.") | §I-AGEREMEDY (2026-10-29), §I-REMEDY (2026-10-26) | to measure | 4 |
| A11 | A thrown-out dose that was later repeated points to the repeat: "Repeated on <date>. See that dose." | §C-P2-LATER, 2026-10-31 | to measure | 4 |
| A12 | Never print a product the record does not show (an unrecorded product reads "a PCV dose", i.e. the vaccine name only) | FINDING H (2026-10-18); PR #103 | to measure | 6 |
| A13 | The 4-day grace decides what the app ACCEPTS, never what it ADVISES: a dose line never gives a date inside the grace | 2026-10-24 ruling | to measure | 5 |
| A14 | "This dose met that minimum" only for a dose that met it | §K-MET-ONLY, 2026-10-31 | to measure | 6 |

### B. The recommendation card

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| B1 | Top line says "Next dose due <date>", never "eligible" | Remy, §L-2, 2026-11-07 | "Next dose not yet due - eligible <date>" (`RecCard.jsx:472`) | 5 |
| B2 | The app advises the routine date and states the minimum beside it ("it can be given today if needed, as the minimum interval of 4 weeks has already passed") | C10-2, §L-2, 2026-10-23 | States the minimum only | 5 (decision) |
| B3 | "Complete" only when nothing more is owed; "No dose now" while a later dose is still coming | §C-COMPLETE (2026-11-01), P1-2 (2026-11-06) | Uses "Complete"; to measure against the rule | 5 |
| B4 | "Routine" for an on-time patient, "Catch-up" once the routine date has passed | P2-9, §L-2, 2026-11-06 | to measure | 5 |
| B5 | A card never advises an age already passed: it says "was due … and is overdue — it can be given now" | §K-READING 1, 2026-10-24 | to measure | 5 |
| B6 | One date format on screen (`fmtDate`, e.g. "Dec 7, 2026"); the data stays ISO | §K-READING 2, 2026-10-24 | `fmtDate` used in 7 component places; to measure the rest | 5 |
| B7 | Ages in weeks, months and years as the schedules write them, never days | Rulebook review, 2026-10-31 | to measure | 6 |
| B8 | One short clinical line in view, the rest behind "Why this"; disposition in bold | owner, 2026-10-25 | Has the "Why this" lead/detail split (PneumoVax copied it from MeningoVax) | 6 |
| B9 | "Why this" follows the same style rules as the dose lines | §M-L5 / §WHY-THIS, 2026-11-08 | Not applied | 6 |
| B10 | The sentences in view and shut "Complete" cards follow the style rules too | §WORD-TIDY, 2026-11-08 | Not applied | 6 |
| B11 | The result page folds: only what must be seen stays in view (a named list, each with its reason) | §WORD-1, 2026-11-06. **Her answer then: "PneumoVax only"** | Not folded | 6 (decision) |
| B12 | Option cards: "Choose ONE option" wording; each option names its own wait | §D-note-8W, P0-1 | to measure (pentavalent card) | 6 |
| B13 | No "now" in a sentence under a date still in the future | P2-1 (R9), 2026-11-06 | to measure | 6 |
| B14 | No interval is mentioned when nothing is on the record ("with nothing on the record, a card has nothing to measure from") | P2-10, owner question 2026-11-06 | to measure | 6 |
| B15 | A "Why this" holding only sources is titled "Sources" | PR #135, 2026-11-07 | to measure | 8 |

### C. Sources and superscripts

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| C1 | Hovering a raised number names the document | C1, 2026-10-17 | **Done** (`c1118c1`) | — |
| C2 | The grey source buttons carry the same number as the superscripts in the text; numbered citations come first, in the order they appear, then any other sources | C2/C3, 2026-10-17; `cardSources()` | Not done (C1 only) | 8 |
| C3 | Every number has a button on the card; no number without a button | G2 guard | Not done | 8 |
| C4 | A card credits only the documents that speak for it — each (document, statement) pair is cited or taken off, never left in between | CLAUDE.md "A card credits only…", 2026-10-17 to 10-29 | Not done | 8 |
| C5 | Every quoted source names the patient group it was written about (`population`); a card never shows another group's quote except where declared | 2026-10-17 | Not done | 8 |
| C6 | Cite CDC first; use immunize.org only where CDC does not state the claim | 2026-10-23 | Not done | 8 |
| C7 | One source per claim, one number per sentence a document states; never the same sentence twice | FINDING N, 2026-10-23 | Not done | 8 |
| C8 | Sources row sits inside "Why this" | §WORD-1 decision, 2026-11-06 | Not done | 8 |
| C9 | A CDC link opens the closed section that holds the quoted sentence | #141, 2026-11-07 | Uses `#:~:text=` links; to measure | 8 |
| C10 | A source button comes off a card when its row does not fit the patient (all columns must fit) | §B-JOBAID-NOROW, 2026-10-18 / 11-07 | Not done | 8 |
| C11 | Each number sits on the exact claim its document states (e.g. the word "complete" cites the sentence that says "complete", not a page giving only the interval) | P2-7, 2026-11-06 | Not done | 8 |

### D. The Rulebook page

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| D1 | An in-app Rulebook tab in the app's own logic order, with numbered decision chips and one source per claim | PR #117, 2026-11-01 | `meningococcal-rules-summary.md` only (no in-app page) | 7 |
| D2 | Her review notes: chronological ages; each group says WHAT changes; which risk wins; weeks/months/years; how products combine; standard schedules first; the dose-chip labels used in the spacing section; opens in its own section; works on a phone (pinned first column, closed parts) | memory `rules-page-owner-design-notes`; PRs #117–#118 | — | 7 |

### E. Already shared by both apps (no work, guarded by test)

`dateUtils.js`; the transplant / CAR-T / B-cell hard stop; the design-review universal rules (no
decorative icons, no pill shapes, CSS custom properties only, three ways to close a pop-up).

**Not to carry over:** anything pneumococcal (p2016, PCV7, PCV15→PPSV23, the IC/non-IC child split, the
thrown-out PPSV23 rulings, the age-19 and age-50 lines).

## Proposed order (one PR each)

**Step 1 — Safety nets first.** A committed verdict list for MeningoVax's grid (real patients, and
impossible entries in a second file), the prose-diff script, and its own whole-app checks
(advice is accepted; the plan holds; complete means complete; card and chip agree; stable over
time). No clinical change. Every later step then shows exactly which patients it moved.
*Why first:* in PneumoVax, two changes each moved thousands of answers while the older checks
stayed green.

**Step 2 — One table for every interval rule.** Move MeningoVax's spacing rules into one table
like `doseIntervalRules.js`, each row saying which schedule states it and whether it voids the
dose or is advice only. Verdict list must not move (a pure move).

**Step 3 — Ruling D: measure a repeat from the dose given.** Already measured above. **Owner
decision needed** — the 2026-11-01 question was never answered. Ask with the asplenia patient.

**Step 4 — One label per recorded dose, and repeat / do not repeat.** The closed label list,
with "Not counted — repeat" and "Not counted — do not repeat" split, and "valid by catch-up" /
"valid by app rule" named. **Owner decision needed per family** where meningococcal guidance
does not say whether a dose is repeated (to be listed after reading MeningoVax's invalid paths).

**Step 5 — Dates stated plainly.** "Next dose due <date>"; the routine date advised and the
minimum stated beside it where both exist (MenB dose 3, MenACWY boosters).
**Owner decision needed:** whether MeningoVax advises a routine date at all where today it states
only the minimum.

**Step 6 — Wording.** Her §M-L3 style rules and the "Why this" rules applied to every card and
dose line, with the same sweep test. Whether to fold the result page is **her decision** — her
2026-11-06 answer was "PneumoVax only".

**Step 7 — The rulebook.** A MeningoVax `CLINICAL_SPEC.md`-style rulebook with every rule and its
source, held to the code by test, and the in-app Rulebook page if she wants it there too.

**Step 8 — Citations (C2–C8 of the 2026-10-16 citations plan).** Each card credits only the
documents that speak for it. MeningoVax has done C1 only. Last, because it is the largest and
depends on steps 4–7 having settled the wording.

## Decisions for the owner before or during the port

1. Does this order suit you, or should anything move first? (Recommended: safety nets first.)
2. Ruling D for MeningoVax (step 3).
3. Advise a routine date as well as the minimum (step 5, B2)?
4. Fold MeningoVax's result page like PneumoVax's (step 6, B11)? Her answer on 2026-11-06 was
   "PneumoVax only". Her 2026-11-08 request for "the same succinct clinical language throughout"
   may change that, so ask again rather than assume either way.
5. MeningoVax-only labels with no PneumoVax twin (A1): "Booster" and "Off-window - repeat". Keep them, or
   map them onto the closed list?

## How this list was checked, and what is left to check

Built from the rulebook's section list, the `design-review` skill and the owner-decision memories. Then
checked against the titles of the 33 wording, label and citation merges among the 50 commits on
PneumoVax's `main` since 2026-10-17, and the full
descriptions of 7 of them. That check added A10–A14, B13–B15 and C11. **Not yet done:** reading the full
descriptions of the other 26, and marking the remaining 17 merges (mostly clinical rules, which are
pneumococcal-only). Do both before step 4 starts.

## Not in this plan

- PneumoVax's remaining open item, R4's "Max" family (`CLINICAL_SPEC.md` §C-P2-R4), is a
  PneumoVax decision and is asked separately.
- The 23 "Why this" paragraphs over 60 words in PneumoVax.
