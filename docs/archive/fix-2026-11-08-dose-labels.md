# Fix queue: one fixed set of dose labels, and plain wording next to each dose (2026-11-08)

> **STATUS: IN PROGRESS.** Started 2026-11-08 on branch `fix/2026-11-08-dose-labels`, off `main` at
> `670e888` (#143). Baseline **2,446 passing, 0 failed** (vitest JSON reporter, `.claude/**` excluded).

## Why this exists

The owner asked for one final audit (2026-11-08): every recorded dose should say clearly whether it
counted, whether it was needed, and whether to repeat it, in plain clinical words. Her test patient:
born 1954-10-01, healthy, PCV13 2019-10-17, PPSV23 2020-09-25 and 2020-10-23, PCV20 2026-09-01. Her
second PPSV23 read "Dose 2 ... 5 years advised. **Counted; never give a third.**" and nothing said it
was not needed. The "5 years advised" was wrong for her: no second PPSV23 was ever due.

## Owner decisions (2026-11-08, in chat)

1. **The label set** (her approval of the proposal, with one change of her own): every dose starts
   with exactly one of
   - `Dose 2` / `Dose 2 of 4`: counted, on schedule, **no line** (her choice to follow what is done now)
   - `Counted — given early, accepted`
   - `Counted — not needed. No more PPSV23.`
   - `Counted — product not recorded`
   - `Not counted — Extra. Do not repeat.` (**her wording**, replacing "Extra dose — more than this series needs")
   - `Not counted — repeat`
   - `Not counted — do not repeat`
   - `Not counted — PCV7`
   - `Check the date`
2. **Every explanation goes under "Why this"**, whether the reason is a CDC/ACIP source or an app
   rule made where CDC is silent.
3. **The wording pass follows style rules she approved**, listed below, rather than each sentence
   one at a time.
4. "Make sure this captures all test patients and is updated in the rulebook."

## Style rules (approved 2026-11-08)

1. The line next to a dose is short: the label plus one reason, about 15 words. The rest goes under Why this.
2. Answer first, then the reason.
3. Talk about the patient, not the document ("CDC recommends", not "CDC's row for").
4. One idea per sentence. No semicolons; at most one dash per sentence.
5. No arguing or defending ("which does not change the answer", "either way").
6. The line does not repeat the label.
7. The same situation gets the same words everywhere.
8. Plain clinical terms, US spelling ("at birth", "pediatric").
9. Next-dose wording: "Next dose on or after [date]" or "Next dose at age [X]".
10. Bold only the decision, never the explanation.

## Items

| ID | What | Status |
|---|---|---|
| **L1** | The engine stamps one `disposition` on every recorded dose; `doseChipLabel` maps it to the approved words; a test sweeps every test patient (both corpora plus the typical set) and fails if any dose has no disposition. Rulebook page key and `CLINICAL_SPEC.md` updated. | DONE `3962691` |
| **L2** | An adult's second PPSV23 within 5 years, with no immunocompromising condition, CSF leak or cochlear implant: `Counted — not needed. No more PPSV23.` (ACIP mm7401a1 prints a two-PPSV23 row only for those three groups, read live 2026-11-08.) | DONE `b3b6933` |
| **L3** | Dose lines rewritten to the style rules: drop words the label now says, move reasons to Why this. | DONE (this commit) |
| **L4** | The style rules written into the repo, with a test for the parts a machine can check. | DONE with L3 |

## Conflicts found with earlier rulings (applied, not re-litigated)

- **"Not counted — repeat on or after [date]"** was proposed with a date. The owner's ruling of
  2026-10-24 says the dose chip never states the due date; the result card is the only surface that
  knows the routine date. So the label is `Not counted — repeat`, and the date stays on the card.
