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

Added and completed 2026-11-08 at the owner's request: *"I want to make sure all work on pneumovax is captured in
meningovax plan. This includes consistency with the chip recommendations used, citing sources using
the same superscript order, using the same succinct clinical language throughout etc."*

The first draft of this plan named the five goals but **did not list these decisions**. They are listed
here one by one so that none is lost, and the ledger below marks every PneumoVax commit against them. "MeningoVax now" is from reading its code on 2026-11-08, and
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
| A14 | "This dose met that minimum" only for a dose that met it | §K-MET-ONLY, 2026-10-31; PR #110 | to measure | 6 |
| A15 | What "extra" means: a dose is extra (not needed, not counted, nothing repeated) when the card the patient had on the day of that dose did not ask for it | P1-3, owner rulings 2026-11-06 (Theo, Mateo, Lena, Ben) | Has an "Extra dose" label for doses past the series total; the "card on that day" test is to measure | 4 |
| A16 | An early dose where no source says to repeat it counts, with a note saying how early ("Counted — given early, accepted"). For PneumoVax adults this was ruled per vaccine (adult table 2026-10-25, PR #90; Ruling F 2026-10-24) | PRs #84, #90, #110 | MeningoVax already counts an early MenB D3 and adds a 4th dose (its CLAUDE.md); other early doses to measure | 4 (decision per vaccine) |
| A17 | A dose given too soon carries two dates that answer different questions: when THIS dose would have been valid (kept in the data) and when the NEXT dose may be given (shown). Both are in the saved-answer files | PR #86 (2026-10-25); 2026-10-24 ruling | to measure | 1 and 5 |
| A18 | The 4-day grace (ACIP General Best Practices) applies to minimum AGES as well as intervals | §A-GRACE12, PR #109 (Lily, 2026-10-31) | to measure | 2 |

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
| B12 | Option cards: "Choose ONE option" wording; each option names its own wait and its own date. Never an option due today beside one due years away under a single "due" | §D-note-8W, P0-1; FINDING A (PR #62) | to measure (pentavalent card) | 6 |
| B13 | No "now" in a sentence under a date still in the future | P2-1 (R9), 2026-11-06 | to measure | 6 |
| B14 | No interval is mentioned when nothing is on the record ("with nothing on the record, a card has nothing to measure from") | P2-10, owner question 2026-11-06 | to measure | 6 |
| B15 | A "Why this" holding only sources is titled "Sources" | PR #135, 2026-11-07 | to measure | 8 |
| B16 | The card's description of the patient matches the patient's real history, both age band and product (never "PCV13" for a PCV15, never "at or after 6" for baby doses) | FINDING G (PR #69), FINDING H (PR #71), §C-AGE6-WORDS | to measure | 6 |
| B17 | A line about a later age (PneumoVax: at 19, at 50) is the app's own answer for the same patient run forward to that age, never hand-written | §B-AT19 (2026-10-31), PRs #129, #134, #136, #139 | to measure (MeningoVax's analogues: boosters, the 16-year dose, MenB at 16–23) | 5 |
| B18 | The patient screen fits a phone: no sideways scrolling, no button past its box | PR #118, owner 2026-11-01 | to measure | 6 |

### C. Sources and superscripts

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| C1 | Hovering a raised number names the document | C1, 2026-10-17 | **Done** (`c1118c1`) | — |
| C2 | The source buttons sit under a row headed "Sources", and each carries the same number the text uses. **Numbering order is hers (2026-10-17): "The sentences dictate the order the references are listed out"** — the first document a sentence cites is [1]. Numbers and buttons come from one computation (`cardSources()`), never two lists | C2/C3, PR #66 | Not done (C1 only) | 8 |
| C3 | Every number has a button on the card; no number without a button | G2 guard | Not done | 8 |
| C4 | A card credits only the documents that speak for it — each (document, statement) pair is cited or taken off, never left in between | CLAUDE.md "A card credits only…", 2026-10-17 to 10-29 | Not done | 8 |
| C5 | Every quoted source names the patient group it was written about (`population`); a card never shows another group's quote except where declared | 2026-10-17 | Not done | 8 |
| C6 | Cite CDC first; use immunize.org only where CDC does not state the claim | 2026-10-23 | Not done | 8 |
| C7 | One source per claim, one number per sentence a document states; never the same sentence twice | FINDING N, 2026-10-23 | Not done | 8 |
| C8 | Sources row sits inside "Why this" | §WORD-1 decision, 2026-11-06 | Not done | 8 |
| C9 | A CDC link opens the closed section that holds the quoted sentence | #141, 2026-11-07 | Uses `#:~:text=` links; to measure | 8 |
| C10 | A source button comes off a card when its row does not fit the patient (all columns must fit) | §B-JOBAID-NOROW, 2026-10-18 / 11-07 | Not done | 8 |
| C11 | Each number sits on the exact claim its document states (e.g. the word "complete" cites the sentence that says "complete"; a dose TOTAL cites the row that states that total) | P2-7 (2026-11-06); C10-1 (PR #81) | Not done | 8 |
| C12 | Clicking or hovering a number shows the quoted sentence itself, in a pop-up over the number | PRs #114, #141 | Hover names the document (C1); the quote pop-up is to measure | 8 |
| C13 | A quote never says the opposite of its card (e.g. a "no dose now" card quoting "give 1 dose"), and is written about the card's own age band | FINDING C (PR #64), FINDING N (PR #75) | Not done | 8 |

### D. The Rulebook page

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| D1 | An in-app Rulebook tab in the app's own decision order, the app's own decisions named and numbered, one source per claim. A row's Source button shows only the sentences that row rests on, and only ones the app's own card for that patient cites; no Source on pure app decisions or on the app's own dose labels | PRs #114, #115, #117, 2026-11-01 | `meningococcal-rules-summary.md` only (no in-app page) | 7 |
| D2 | Her review notes: chronological ages; each group says WHAT changes; which risk wins; weeks/months/years; how products combine; standard schedules first; the dose-chip labels used in the spacing section; opens in its own section; works on a phone (pinned first column, closed parts) | memory `rules-page-owner-design-notes`; PRs #117–#118 | — | 7 |

### E. How PneumoVax keeps itself honest (steps 1 and 2)

| # | PneumoVax practice | Where | MeningoVax now | Step |
|---|---|---|---|---|
| E1 | Two saved-answer files (real and impossible patients), and every moved answer explained before they are rewritten | S8, 2026-10-12; PR #86 | Not present | 1 |
| E2 | A prose diff of every sentence a clinician reads, including text behind "Why this" | `scripts/proseDiff.mjs`; §K-READING | Not present | 1 |
| E3 | Seven whole-app checks over every patient: advice accepted, plan holds, complete means complete, options agree, card and chip agree, age lines clean, stable over time. Four are required tests | PRs #119, #130, #131, #133 | Not present | 1 |
| E4 | A typical-patient list (ordinary on-time histories), because the main grid cannot build them | PR #119 | Not present | 1 |
| E5 | The app advises and grades by ONE reading of each interval table ("the app had two numbers for one dose") | P0, PR #76, 2026-10-23 | to measure | 2 |
| E6 | Live audits against CDC's own sentences for ordinary patients near each age line | PR #143; PR #87 (CDC's PneumoRecs) | Not present | 1 |
| E7 | The rulebook is held to the code by a test, cell by cell | `rule-docs-match-code.test.js` | Has a test of the same name; scope to measure | 7 |

### F. Already shared by both apps (no work, guarded by test)

`dateUtils.js`; the transplant / CAR-T / B-cell hard stop; the design-review universal rules (no
decorative icons, no pill shapes, CSS custom properties only, three ways to close a pop-up).

**Not to carry over:** anything pneumococcal (p2016, PCV7, PCV15→PPSV23, the IC/non-IC child split, the
thrown-out PPSV23 rulings, the age-19 and age-50 lines).

## Ledger: every PneumoVax commit since MeningoVax last changed

All **82** commits on PneumoVax's `main` after `3dc0264` (C1, the twin of MeningoVax's last
commit `c1118c1`), oldest first, counted with `git rev-list --count 3dc0264..origin/main` on
2026-11-08. Every description was read on 2026-11-08: 7 in full, and the other 75 to the end of their
opening (the first 13–14 lines, where each states its decision and the patient it was decided on). A
row added later from a commit's deeper text is still possible; check a commit in full before
porting the item it is marked with. **Mark:** the table row(s)
above that it decided or changed; **P** = a pneumococcal clinical rule, not carried over; **Docs** =
handoffs and notes only. A commit marked P can still carry a general practice, named beside it.

| Commit | Date | Title | Mark |
|---|---|---|---|
| `a47010f` | 2026-10-17 | Immunocompromised children were being told their pneumococcal series was finished when it wasn't (#58) | P |
| `dd6731a` | 2026-10-17 | C7 document 6: read CDC's Adult Notes live — one statement, and it cites cleanly (#59) | C4 (method: read the document live) |
| `9b1bc1d` | 2026-10-17 | C7 document 4: read the catch-up job aid — one clean citation, one decision for the owner (#60) | C4 (method) |
| `070f333` | 2026-10-17 | Finding A: an immunocompromised child who already had PPSV23 waits five years, not eight weeks (#62) | B12; P |
| `af0103f` | 2026-10-17 | Handoff: Findings A and B merged, and the one half of B that is deliberately not started (#63) | Docs |
| `f61d063` | 2026-10-17 | Three citation defects: a quote that contradicts its card, a quote that excludes its patient, and a baby told nothing about age 2 (#64) | C13; C5 |
| `5bffe00` | 2026-10-17 | Every quoted source now says which patient it was written about (#65) | C5 |
| `cb7726e` | 2026-10-17 | The grey source buttons now carry the number the card's text uses (#66) | C2, C3 |
| `8a85618` | 2026-10-18 | C8, document 2: a card now credits only the documents that speak for it (#67) | C4 |
| `7c0559a` | 2026-10-18 | Four owner decisions: two documents now fully cited, and mm7401a1 goes back where it belongs (#68) | C4; P |
| `a7dc1e3` | 2026-10-18 | FINDING G: a card now names the vaccine history the patient actually has (#69) | B16 |
| `6a91beb` | 2026-10-18 | Docs: hand off the p2016 column-fit audit and four owner rulings (#70) | Docs; C10 |
| `2fdb48e` | 2026-10-18 | Four P0 citation findings: a card now names the patient it was written about (#71) | B16; C5 |
| `b6d6364` | 2026-10-23 | FINDING M: stop asking for a dose a child finished in their second year; and credit every source on both healthy 24-59m cards (#74) | B16; P |
| `770227d` | 2026-10-23 | CDC's Child/Adolescent Notes now say what they are on each card for — plus FINDING N, a 6-year-old quoted a toddler's rule (#75) | C13, C7 |
| `e4a379e` | 2026-10-23 | C9: immunize.org p2016 is credited on the cards built from its rows (2,128 cards) (#77) | C4; P (p2016) |
| `9946d93` | 2026-10-23 | The "complete because PPSV23 was given" cards now say who says so (860 cards) (#78) | C4; P |
| `47f75de` | 2026-10-23 | The healthy 5-18 "no PCV indicated" card now cites CDC, and drops immunize.org p2016 (1,584 cards) (#79) | C6 |
| `7d95620` | 2026-10-23 | P0: a PCV dose given too soon no longer counts — the app had two numbers for one dose (#76) | E5; P |
| `5534da7` | 2026-10-23 | Docs: the P0 citation measurement is done, and four owner rulings from 2026-10-23 (#80) | Docs |
| `fd35c7c` | 2026-10-23 | C10-1: the infant catch-up card now cites the row that states its own number (781 cards), and immunize.org p2016 comes off 1,633 it is silent on (#81) | C11; P |
| `9da398d` | 2026-10-23 | C10-2: the app advises the ROUTINE date and states the minimum beside it (patients D and F), and CDC's catch-up schedule appears on cards for the first time (#82) | B2 |
| `97277a7` | 2026-10-24 | Ruling D: the repeat dose is measured from the dose the patient actually got (#83) | Ruling D (step 3) |
| `1b36184` | 2026-10-24 | An invalid adult dose: families 2 and 3 reverted, Ruling F kept, and what the patient is actually owed (#84) | A16; P |
| `758f929` | 2026-10-25 | Your four decisions of 2026-10-25: the PCV13 patients, the later clock, the children's note, and the safety net (#86) | A17; E1 |
| `1c3fe52` | 2026-10-25 | A map of the rules, and 66 patients through CDC's PneumoRecs (#87) | E6 |
| `a66219a` | 2026-10-25 | A PPSV23 now anchors a child's next conjugate, an early one counts with the repeat offered, and both rulebooks become a lookup (#88) | A16; P |
| `84ffe45` | 2026-10-25 | Your adult table of 2026-10-25: no adult dose is thrown away for timing again (#90) | A16 (adults) |
| `7feb43a` | 2026-10-25 | Your ruling: a child's conjugate inside 8 weeks of a PPSV23 no longer counts (#91) | P |
| `c3503c5` | 2026-10-25 | Docs: record your three decisions of today so a fresh session starts with them (#92) | Docs |
| `0b6494a` | 2026-10-26 | Three children's items: the 8-week wait from her last PPSV23, the infant floors pinned, and a child's PCV21 naming PCV20 (#93) | A10; P |
| `ca1d6d7` | 2026-10-29 | Handoff after the three children's items, and a warning about PR #89 (#94) | Docs |
| `0bc8a7d` | 2026-10-29 | Your two decisions of today: a thrown-out dose names no vaccine, and both children with a recent PPSV23 wait eight weeks (#96) | A10 |
| `ed841e6` | 2026-10-30 | The last unexplained source chip comes off, and the card tells you to re-check at 50 (#97) | C4; P (age-50 line) |
| `6ad741b` | 2026-10-30 | P2: a child's second PPSV23 inside five years — counted if immunocompromised, an extra dose if not, never a third (#98) | A15; P |
| `abb9782` | 2026-10-31 | Noah, Ava, Maya: a repeat PPSV23 counts, an on-time extra dose, and what happens at 19 (#99) | A15; B17; P |
| `7cdb26c` | 2026-10-31 | Lily, Noah, Eli/Rosa, Sam: a third PPSV23 is extra, the 'at 19' line from the adult card, an extra PPSV23 holds the card, and a grey area named (#100) | A15; B17; P |
| `7b954b3` | 2026-10-31 | Max, Kai, Noah, Zoe: no third PPSV23 shot, and a healthy child's PPSV23 is 'not needed' (#101) | A1 (not needed); P |
| `94530ea` | 2026-10-31 | Ivy, Sam, Leo: no third PPSV23 shot after two too-young ones, and a thrown-out PPSV23 points to the later dose (#102) | A11; P |
| `d0d9461` | 2026-10-31 | Leo at 19, Ivy grown up, and a same-day PPSV23 names the PCV actually given (#103) | A11; A12; P |
| `9c45ebd` | 2026-10-31 | Adult with a PCV15 and two thrown-out baby PPSV23 shots: PCV20 or PCV21 instead of a third PPSV23 (#104) | P |
| `89de774` | 2026-10-31 | Baby doses then PCV20 at 6+: correct 'before age 6' wording; an IC child's early PCV20 gets a note; 'state the minimum' closed (#105) | B16; B2; P |
| `ac5b3c7` | 2026-10-31 | At-risk toddler who finished her baby series with a PCV20: complete, not 'give PCV20 again' (#106) | P |
| `fed7bc7` | 2026-10-31 | A toddler who started PCV at 12-23 months is finished after two doses, not three (#107) | P |
| `70aefe8` | 2026-10-31 | Adult with two PPSV23 doses: read the right one (§H-ANY65, §H-PPSVLAST) (#108) | P |
| `ed27ee5` | 2026-10-31 | A PCV dose 1–4 days before the first birthday counts as the 12-month dose (Lily) (#109) | A18 |
| `662bf44` | 2026-10-31 | Adult dose given too early: keep its note, and never say it met a minimum it missed (#110) | A14; A16 |
| `cb92649` | 2026-10-31 | Leah: a child whose only PPSV23 came too soon after a PCV gets PCV20 only (#111) | P |
| `e4ac542` | 2026-10-31 | PCV7 dose chip reads "Not counted", not "Off-window - repeat" (#112) | A1 (decision 5) |
| `2738347` | 2026-11-01 | §C-P2-FIVE: a child's PPSV23 after any earlier PPSV23 waits 5 years (#113) | P |
| `6af3c1a` | 2026-11-01 | Rules page redesign live; a PPSV23 that didn't count still sets the next PCV's date (#114) | D1; C12; P |
| `4d9af86` | 2026-11-01 | Rulebook: CDC re-check and your 2026-11-01 review (#115) | D1, D2 |
| `1de9b7e` | 2026-11-01 | Grey-zone audit: 8 wording and citation fixes (P1-1 to P2-5) (#116) | B16; C11; P |
| `96f72d5` | 2026-11-01 | Rulebook in the app's own order: one source per claim, numbered PneumoVax decisions (#117) | D1 |
| `83e095d` | 2026-11-01 | Rulebook on a phone: pinned first column, closed parts, three-line decisions (#118) | D2; B18 |
| `97b3863` | 2026-11-05 | Whole-app rule checks: seven questions asked of every patient (#119) | E3, E4 |
| `9286fc8` | 2026-11-05 | P0-1 (R1): the 2nd PPSV23 waits for the 8 weeks too, and the card says why (#120) | B12; P |
| `f5e8b23` | 2026-11-06 | P1-1 (R2): a dose falling at 19 or later gets the adult answer, shown from today (#121) | B17; P |
| `2486960` | 2026-11-06 | P1-3: Noor's PCV15 is an extra dose, and the next dose still waits for it (#122) | A15 |
| `f89f01f` | 2026-11-06 | P1-2: "No dose now", not "Complete", while a dose is still owed on this schedule (#123) | B3 |
| `e091139` | 2026-11-06 | Wording fixes: "now", "complete", "at or after age 6", "overdue" (P2-1, P2-3, P2-7, P2-8) (#124) | B13; C11; B5 |
| `9c7d820` | 2026-11-06 | P2-2 (R3): an infant's advised date holds across 7 months (#125) | B2; P |
| `2cb8931` | 2026-11-06 | P2-9, P2-10: "Routine" for an on-time baby; no interval before a first dose (#126) | B4; B14 |
| `e8c916d` | 2026-11-06 | WORD-1: fold the result page (#127) | B11; C8 |
| `b894934` | 2026-11-06 | P1-3: a child's conjugate no card asked for is an extra dose (Theo, Mateo, Lena, Ben) (#128) | A15 |
| `0ed8049` | 2026-11-07 | Four rulings of 2026-11-07: Sam, Cora, the healthy baby, the healthy 5-year-old (#129) | B17; P |
| `1c0e95b` | 2026-11-07 | Check 1 is a required test: a dose given on the advised date is never faulted (#130) | E3 |
| `e72887d` | 2026-11-07 | Check 7 is now a required test: looking at a record later does not change the answer (#131) | E3 |
| `27ec0b3` | 2026-11-07 | Check 5 is now a required test: the card and the chip under a dose name one date (#133) | E3 |
| `54a2c36` | 2026-11-07 | Owen: Option B says what PPSV23 leads to at 50, under "Why this" (#134) | B17; P |
| `bf9cd53` | 2026-11-07 | Ava: toddler age-50 line follows the baby card; "Why this" with only sources says "Sources" (#135) | B15; B17; P |
| `6679ace` | 2026-11-07 | Leo and Nina: the healthy 5–18 card drops "age 50" once a PCV20 is given (#136) | B17; P |
| `b3f2584` | 2026-11-07 | Mila: the Job Aid button comes off toddler cards it has no row for (#137) | C10 |
| `1713823` | 2026-11-07 | Theo: the Job Aid button comes off when its row says "today" and the card waits (#138) | C10 |
| `036af4c` | 2026-11-07 | Kai and Zoe: the healthy child cards drop "age 50" when 50 would read Complete (#139) | B17; P |
| `3b91535` | 2026-11-07 | Remy: the card's top line says "Next dose due", not "eligible" (#140) | B1 |
| `f2b3009` | 2026-11-07 | CDC links open the closed section that holds the quoted sentence (#141) | C9; C12 |
| `711afb2` | 2026-11-08 | Wording audit: the Rulebook's healthy row, and five-year cards name the PPSV23 that counted (P2-1, P2-2) (#142) | D1; A11; P |
| `670e888` | 2026-11-08 | Children near an age line: the app agrees with CDC for all 95 (Audit 1, second half) (#143) | E6 |
| `65d8186` | 2026-11-08 | Every recorded dose gets one label, in plain wording (dose labels, L1–L4) (#144) | A1, A2, A3, A4 |
| `d541e8f` | 2026-11-08 | Every card's "Why this" follows your style rules (wording only) (#145) | B9 |
| `6e637ce` | 2026-11-08 | Sentences in view and Complete cards follow your style rules (wording only) (#146) | B10; A4 |

**When a new PneumoVax commit lands:** add it to this ledger and, if it is not P or Docs, to the table.

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
   map them onto the closed list? (PneumoVax dropped "Off-window - repeat" for PCV7 on 2026-10-31, PR #112,
   and recorded that MeningoVax keeps it "in its own sense, a dose that really is repeated".)
6. Early meningococcal doses (A16): for each vaccine, does an early dose count with a note, or is it
   repeated? To be asked per family with a meningococcal patient once MeningoVax's paths are read.

## Not in this plan

- The 23 "Why this" paragraphs over 60 words in PneumoVax.
