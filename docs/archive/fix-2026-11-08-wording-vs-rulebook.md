# Fix queue: card wording against the card's own date and against the Rulebook (2026-11-08)

> **STATUS: NOT STARTED.** Audit 3 of the three proposed on 2026-11-01 ("a sweep of card wording against
> the Rulebook and the 'complete' rule"). Read-only audit; nothing in `src/` was changed. The owner chose
> this audit first on 2026-11-08 ("Wording first"). Audits 1 and 2 status: see the end of this file.

Repo `/Users/joannehuang/Downloads/PneumoVax`. Audited on `main` at `f2b3009` (#141, CDC links), which
is byte-for-byte the code the sweeps ran on (the #141 branch, squash-merged during the audit).
Baseline: **2,435 tests passing, 0 failed** (vitest JSON reporter, `.claude/**` excluded).

## What was checked, in plain words

Every one of the 77,496 test patients (17,016 on the old grid plus 60,480 ordinary "typical" patients
from the 2026-11-05 checks) was run through the app, and every card was read.

**(a) Do the dates and numbers in a card's own sentences agree with the date the card shows?**

| Question | Result |
|---|---|
| "Wait until X: 8 weeks after the PCV15 of Y" — does Y + 8 weeks equal X, and is X the card's date? | **5,320** sentences, every sum right (8 weeks after PCV15 3,748; 8 weeks after PPSV23 1,395; 5 years after PPSV23 177) |
| "This patient turns 19 on X" / "after the 19th birthday, X" | All right (234 and 324) |
| "It can be given from X" — where does X come from? | Always last PCV + 8 weeks, the dose-check minimum; always before the card's date (Remy's ruling) |
| A card showing a future date whose words say "today" or "now" | **0** |
| A "Today" card whose words say "wait until" or "held to" | **0** |
| A card whose date is earlier than an interval its own words state | **164**, all one family: P2-PARK-1 below |
| The 5 Nov wording checks (W1 "at or after age 6", W2 "may be given now") | Still **0** and **0** |
| The card's date matches none of the numbers it states | Only the thrown-out-PPSV23 hold (R4 family, owner-ruled, bold sentence explains it) and P2-2 below |

**(b) Does every card say what the Rulebook page (`src/data/rulebook.js`) says?**

| Rulebook section | Patients checked | Result |
|---|---|---|
| Adults: age bands, Option A/B, every "prior vaccines" row | **11,376** adults | **0 mismatches** in product, status or date. Only gap: a conjugate of unknown product has no Rulebook row (55 grid patients) |
| Children 2–18: the four risk-group rows, claim by claim | **63,360** children | One real mismatch, P2-1. Everything else flagged was the audit script being stricter than the page (e.g. the Option B PPSV23 card after a PCV15 is the page's own step 2) |
| "A series that includes PCV20 is complete. PPSV23 is not needed." | at-risk children | **0** cards offer PPSV23 after a counted PCV20 |
| "PCV21: not licensed under 18" | all children | 84 cards for a 15–17-year-old name PCV21, all on the adult card shown for a dose that falls at 19 (§B-AT19); every one dated after the 18th birthday |
| Immunocompromised child "Complete" after one PPSV23 and no PCV20 | 324 | All are children whose 5-year dose falls at 19 or later, so the adult card answers (§B-AT19) |
| Chip legend: "Invalid … the note says whether to repeat it, and when" | 16,858 invalid chips | Every one says whether; 1,344 do not say when — see P2-NOTE-1 |

## Ground rules that bind every fix (from CLAUDE.md)

- Wording-only fixes. **No dose, date or status may move.** Run both corpora; both must read 0 moved.
- A sentence in the Rulebook is WRITTEN, not GENERATED: guard it with a worked patient whose
  `expect` asserts the sentence, or generate it from the engine's own predicate.
- Owner rulings in force, do not re-open: Kai/Zoe (drop "age 50" when 50 reads Complete, §B-50BABY),
  Leo/Nina (PCV20), §B-ADULTRISK19 (smoking/alcohol teen looks again at 19), §B-AT19, Remy
  ("Next dose due"), the thrown-out-PPSV23 hold (R4, parked).
- Plain language; one direct question per owner decision, with a named patient.

## Findings

### P2-1 — The Rulebook's healthy-child row is behind three owner rulings (11,463 children)

**What the page says** (Rulebook → "Age 2 to 18 years, by risk group" → Healthy → Result):
*"From 5 years: no catch-up; not indicated. Re-evaluate at 50 years, unless a PCV20 has been given."*
Source: `src/data/rulebook.js:919` (`CHILD_LANES[0].result.note`). Confirmed in the running app.

**What the cards say instead**, all correctly, per rulings already made:

| Children aged 5–18 | Card | Ruling | Patients (grid / typical) |
|---|---|---|---|
| No risk tick, PCV15 and PPSV23 on record | no age-50 line | Kai, 2026-11-07 (#139) | 6,465 (237 / 6,228) |
| Only smoking or alcohol ticked, no PCV20, not PCV15 + PPSV23 | "Re-evaluate at age 19, when the adult schedule counts cigarette smoking…" | §B-ADULTRISK19, 2026-11-01 | 1,726 (404 / 1,322) |
| Only smoking or alcohol ticked, PCV15 and PPSV23 on record | no line at all | Kai, applied to the forward run | 3,272 |

**Named patient:** Kai's sibling case, a healthy 10-year-old with PCV15 at 2, 4, 6 and 12 months and a
PPSV23 at 2. The card reads "Not indicated" with no age-50 line, and the Rulebook tells the reader to
expect one.

**Also, under 5:** the healthy row only describes "From 5 years", but a healthy toddler's Complete card
also says re-evaluate at 50 (§B-50BABY, 4 typical toddlers). The page never says so.

**Why nothing caught it:** `regression-c14-2026-10-25-rulebook-matches-the-engine.test.jsx` checks each
worked patient's card label and status, never the "Re-evaluate" sentence. The healthy row's worked
patients are `healthy3` and `healthy6`; neither has a PCV20, a PCV15 + PPSV23, or a smoking tick.

**Fix (no clinical decision needed, the rulings exist):** rewrite the note to match the three rulings,
e.g. *"From 5 years: no catch-up; not indicated. Re-evaluate at 50 years, unless the series already
includes PCV20, or PCV15 and PPSV23. With smoking or alcohol use disorder ticked, re-evaluate at 19."*,
and add a line to the under-5 Result for §B-50BABY. Add worked patients (Leo: PCV20; Kai: PCV15 +
PPSV23; `smoker10` already exists, give it a note expectation for "age 19") whose `expect.note`
asserts the sentence. Better still, build the sentence from the same predicate the engine uses for
the forward run, so the page cannot drift again.
**Test fixture:** the three patients above, asserting the Rulebook sentence and the card agree.
**Surfaces:** Rulebook page only. Cards unchanged (prove with `proseDiff`: 0 card lines).

### P2-2 — "≥5 years after first PPSV23" when the first PPSV23 on the record did not count (52 children)

**Named patient (checked in the running app 2026-11-08):** 7 years old, asplenia. PCV13 and PPSV23 on
the same day at age 2 (Nov 8, 2021); a second PPSV23 today (Nov 8, 2026).
- The 2021 PPSV23 is marked **Invalid**: "Same day as PCV; minimum interval 8 weeks. Repeated on Nov 8,
  2026; see that dose." Today's PPSV23 is marked **Dose 1**.
- Both cards read *"1 dose PCV20 (≥5 years after first PPSV23)"* and *"2nd PPSV23 (alternative, ≥5 years
  after first)"*, "Next dose due Nov 8, 2031".

The date is right: it counts from the PPSV23 that counted. But the record's first PPSV23 is 2021, and
2021 + 5 years is today. A reader who takes "first PPSV23" literally expects the dose now, and only the
Dose 1 chip says otherwise.

**How many:** 46 typical patients and 6 grid patients, 2 cards each (104 cards). Wording only.
**Fix options (owner's wording choice):** "≥5 years after the first PPSV23 that counted", or name it:
"≥5 years after the PPSV23 of Nov 8, 2026". Apply to both labels, and to the detail sentence ("≥5 years
after the first PPSV23 [c]").
**Suspected site:** `recommend.js` builds this pair of labels in FOUR places (lines 2742/2757,
3005/3025, 3134/3146, 3318/3335 at `f2b3009`). Fix all four, or one helper; a single-site fix leaves
the other three reading the old way.
**Test fixture:** the patient above, asserting the label names the counted dose; control: the same
child with the PCV13 and PPSV23 8 weeks apart keeps "first PPSV23" unchanged.

### P2-PARK-1 — Adult words name the last dose; the date counts from the last dose that counted (164 cards, grid only). Recommend parking.

Examples: an 18-year-old with asplenia whose three PCV13 doses were 4 weeks apart (doses 2 and 3
Invalid) reads "≥1 year after the last PCV13 dose", dated a year after dose 1, 2 months earlier;
a PCV20 given one day after a PPSV23 (Invalid) makes "≥5 years after the last pneumococcal dose" one day
off. **0 of the 60,480 ordinary patients.** Fixing it is not just wording: whether an Invalid PCV13
restarts the adult 1-year clock is a Ruling D scope question (Ruling D moved only the child PCV anchor).
Per the 2026-10-31 "skip unlikely scenarios" guidance, park it in the handoff.

### P2-NOTE-1 — An age-rejected PPSV23 chip says "Repeat this dose only" with no date (1,344 chips, grid). Recommend no change to the chip.

The Rulebook's chip legend says the note says "whether to repeat it, and when". For a PPSV23 given before
age 2 the chip says whether, and the rec card gives the date. Every case is a PPSV23 given in infancy (grid
only). If P2-1 is being edited anyway, soften the legend to "…whether to repeat it; the card says when."

## Per-item workflow

Reproduce → failing test with a synthetic fixture → fix → full suite → break the fix (restore from a copy,
not git) → `node scripts/proseDiff.mjs` against a worktree of `main` (expect only the intended lines) →
`node scripts/wholeApp/run.mjs --out <file>` both sides, compare → re-run the matching
`scripts/wordingAudit/*.mjs` sweep and quote its count → check in the running app → commit by ID
(`P2-1`, `P2-2`) → branch, PR, she merges.

Re-run any sweep from the repo root: `OUT_DIR=<scratch dir> node scripts/wordingAudit/<name>.mjs`.
`childRows.mjs` H2 is P2-1; `gaps3.mjs` E1 "first PPSV23" is P2-2 and E1/E2 "last" is P2-PARK-1.

## Audits 1 and 2 (proposed 2026-11-01), status measured 2026-11-08

- **Audit 2, adults near a line:** covered by the 2026-11-05 whole-app checks (19, 50 and 65, and adults
  either side of every 8-week, 1-year and 5-year spacing among the 60,480 ordinary patients). And
  (b) above found 0 adult mismatches against the Rulebook. **Recommend: done.**
- **Audit 1, children near an age line:** half done. Covered: a dose 1 day either side of 7, 12, 24, 60,
  72 months and 18–19 years, and 4–5 days short where CDC's grace applies. **Not covered:** the 6-week
  minimum age; anything a week to a month either side; and checking against CDC's own words rather than
  against the line's expected effect.
