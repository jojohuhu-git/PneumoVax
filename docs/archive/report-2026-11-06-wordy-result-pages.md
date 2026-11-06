# Why the result page feels wordy, and what to do about it

Measured 2026-11-06 on commit `887f19f` (the "No dose now" work). Nothing in the app was changed.
All numbers come from rendering the real results page. "Before a click" means what shows when the page opens.

## The short answers

1. **Can all the explanations go under "Why this"? Almost all, not quite all.** About two thirds of the explanation words can fold. A short list has to stay in view, because you ruled that it must, or because hiding it could cause a wrong dose.
2. **Does this need much wordsmithing? No.** Most of the note repeats the card's own heading, and the heading is already written the way the rulebook is. Folding alone does most of the work.
3. **My recommendation:** fold first, in one change. Then shorten only the 10 to 20 most common lines, and only on the recorded-dose lines.
4. **The biggest single block of words is not an explanation.** The disclaimer at the bottom is 144 words, on every page. That is 61% of the words on a typical page.

| 8,817 grid patients who see any explanation | Now | After fold |
|---|---|---|
| Explanation words, typical patient | 94 | 26 |
| Explanation words, wordiest 1 in 10 | 181 or more | 64 or more |
| Explanation words, worst patient | 367 | 154 |
| All words except the disclaimer, typical patient | 189 | 122 |

## What is on the page today

The page has these parts. Words are per patient across the 15,598 grid patients who get a result (the other 1,418 stop at the transplant message).

| Part of the page | Shows before a click? | Share of words (leaving out the disclaimer) |
|---|---|---|
| Sentences under each recorded dose | Yes | 21% |
| List of recorded doses (date, age, product) | Yes | 13% |
| Top of page (title, age, conditions, buttons) | Yes | 13% |
| The note on the card | Yes | 11% |
| PCV21 geographic note (50 words, adults) | Yes | 8% |
| Heading on the card | Yes | 5% |
| "Why this" and "How this was worked out" buttons | Yes | 5% |
| Sources row | Yes | 4% |
| Adult-risk-factor note (58 words, children ticked for smoking or alcohol) | Yes | 4% |
| Disclaimer (not in the percentages) | Yes | 144 words, always |

Behind a click already, per patient on average: "How this was worked out" 64 words, "Why this" on the note 21, "Why this" under doses 14. "Complete" and "Not indicated" cards are already folded shut, along with whatever they contain.

**Words per patient, before any click**

| | Typical | Wordiest 1 in 10 | Worst |
|---|---|---|---|
| Everything, 15,598 grid patients | 238 | 408 | 671 |
| Everything except disclaimer | 94 | 264 | 527 |
| Explanations only | 47 | 142 | 367 |
| Behind a click | 150 | 306 | 548 |

**Who feels it.** 57% of grid patients see any explanation. The other 43% are folded cards with about 36 words. So the problem is real for action cards and invisible on finished ones. Among the 60,480 typical patients (vaccinated school-age children and adults), 40% see an explanation, with a typical 64 words.

**Worst families, words except disclaimer (typical / wordiest 1 in 10 / worst)**

| Family | Patients | Words |
|---|---|---|
| 2 to 5 years, 3 or more doses | 814 | 222 / 377 / 466 |
| 7 to 23 months, 3 or more doses | 627 | 197 / 309 / 383 |
| 6 to 18 years, 3 or more doses | 3,201 | 41 / 292 / 527 |
| 19 to 49 years, 3 or more doses | 1,331 | 38 / 320 / 456 |
| 50 and over, 3 or more doses | 3,993 | 39 / 271 / 336 |

**Named patients, on 2026-11-06**

| Patient | Words except disclaimer, now | After fold | Explanation words, now | After fold |
|---|---|---|---|---|
| Mia, 4 months, healthy, PCV20 at 2 months | 82 | 67 | 15 | 0 |
| Sadie, 15 months, no spleen, PCV13 at 2, 4, 6, 12 months | 151 | 151 | 37 | 37 (your "No dose now" ruling) |
| Cora, 14, cochlear implant, PCV13 baby series | 193 | 128 | 72 | 7 |
| Hank, 60, healthy, no doses | 133 | 86 | 68 | 21 |
| Pax, 40, HIV, PCV13, two PPSV23, the last 4 years ago | 192 | 115 | 80 | 3 |
| Max, 5, no spleen, PPSV23 thrown out a year ago | 175 | 107 | 88 | 20 |
| Noor, 10, HIV, PCV13 series, PPSV23 at 5 | 180 | 146 | 48 | 14 |
| Grid's worst: 6, no spleen, four PCV13 in 5 months, old PPSV23 | 525 | 308 | 367 | 150 |

## Why folding works so well: the note repeats the heading

Cora's Option B card:

- **Heading:** Option B: 1 dose PPSV23 (≥8 weeks)
- **Note:** Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV. Choose Option A or B, not both. Either a single dose of PCV20 or a PPSV23 completes the recommended series.

Hank's and Pax's are the same. Pax's heading reads "Review at age 50 — or PCV20 or PCV21 ≥5 years after the last pneumococcal dose", and the note says that again in two sentences.

**The heading already reads like the rulebook.** The rulebook says "PCV20 or PCV21, ≥1 year after PCV13". The heading says "PCV20 or PCV21 ≥1 year after PCV13 — completes the series". So the rulebook-style text is mostly already on screen.

Two more easy savings need no rewriting. The same sentence prints under every dose: four PCV7 doses print 30 words four times. Showing a repeated line once takes the wordiest 1 in 10 from 264 to 244 words, and the worst patient from 527 to 427. Option A and Option B cards also repeat each other's closing sentence, as Cora's do.

## What must stay in view

A fold cannot hide these. Each has a ruling or a safety reason.

| What stays | Example | Why | Guarded by |
|---|---|---|---|
| Your bold sentences | "Wait until Nov 22…", "Advised ≥8 weeks after…", "Held to 5 years after…" | Your request of 2026-10-24: "Make these nuanced comments in red or bolded". They qualify the heading | `regression-2026-10-24-note-emphasis` |
| A later dose on a "No dose now" card | Sadie: "One further dose falls due at age 2 years" | Your ruling 2026-11-06. It was moved out of "Why this" on purpose | `regression-2026-11-06-p1-2-no-dose-now`, pins 369 cards |
| PCV15 must be followed by PPSV23 | Hank: "1 dose of PCV15 followed by PPSV23 ≥1 year later" | PCV15 always needs its follow-up. Without this line, PCV15 looks like a one-dose choice | `brands.js` flag, `CLAUDE.md` |
| "This final dose is not due until the patient reaches 12 months" | Baby with 4 early doses | This card has no date anywhere else | Whole-app checks read this sentence |
| "Choose Option A or B, not both" | Cora, Noor | Stops two doses being given. A safety line, no ruling | None |
| Option B owes more | "then ≥5 years later give 1 dose of PCV20 or a 2nd PPSV23", "Only PCV20 finishes the series in one dose" | The heading of Option B does not show the extra dose an immunocompromised child owes | `regression-2026-11-01-p2-3-complete-only-when-nothing-more-is-owed` pins "Only PCV20 finishes…" |
| Adult 8-week option at 50 and over | "A minimum interval of 8 weeks may be considered…" | Your S15 decision: 8 weeks is named as an option there. This one could move if you prefer | No test pins this sentence |
| Under a dose: what to do | "Repeat this dose only", "Not repeated; next dose from…" | Rulebook round 4: every Invalid dose states an action. Measured: all 16,858 invalid doses keep an action line | No test pins this rule. The fold should add one |
| Under a dose: "Counted; …" and the shortfall | "shorter than the 5 years ACIP advises" | Your card rules of 2026-10-25: bold the outcome, state the shortfall | `regression-2026-10-24-note-emphasis` |
| "Check the record" for two vaccines on one day | Mistyped date warning | It asks the clinician to act | `regression-duplicate-row-is-a-record-problem` |
| The adult-risk-factor note | A 15-year-old ticked for smoking | Your hold on PR #20: "don't ship a silent ignore". MeningoVax's comment says the same: readable without a click. It can be shortened, not hidden | `regression-p3-9-risk-age-note` |

**No change needed:**
- Iris's "Complete" card stays folded, as you chose.
- The transplant message is untouched. It must match MeningoVax word for word.
- Every sentence keeps its citation, because a sentence and its number fold together. So "a card whose citation orders a dose must say that dose has been given" still holds.

**One thing already hidden that the rule says should show.** `CLAUDE.md` says both numbers go on the card: the advised 8 weeks and "it can be given today if needed, as the minimum interval of 4 weeks has already passed". That clause sits behind "Why this" today, in `recommend.js:1064`, and has since C10-2. Its reason reads "A second number the reader can see is not that bug; an invisible one is". It did not appear for any of the 77,496 patients, so it needs hand-built patients to see.

## What the page would look like

Everything else goes behind "Why this".

| Kind of card | What shows |
|---|---|
| One dose due (Mia, Hank) | Heading, product, "Today" or the date. Plus the PCV15 line if PCV15 is offered |
| Option A / Option B (Cora) | Two headings, "Choose Option A or B, not both." Plus what Option B still owes |
| Not yet due (Pax) | Heading, "Not yet due — eligible Nov 6, 2027" |
| Waiting on a recent dose (Noor with PCV15) | Heading, date, bold "Wait until…" line |
| No dose now (Sadie) | Unchanged |
| Complete, Not indicated | Unchanged, folded |
| Under a dose | Label, then one line: what to do, or "Counted; …" |

**Measured, simulated over every patient**

| | Grid now | Grid after | Typical patients now | After |
|---|---|---|---|---|
| Explanation words, average | 57 | 18 | 33 | 12 |
| Explanation words, wordiest 1 in 10 | 142 | 58 | 86 | 57 |
| Explanation words, worst | 367 | 154 | 292 | 123 |
| Words except disclaimer, wordiest 1 in 10 | 264 | 163 | 219 | 159 |
| Words except disclaimer, worst | 527 | 310 | 487 | 293 |

This includes the PCV21 note folding to its title and repeated lines showing once. Without those two, the grid's wordiest 1 in 10 is 187, not 163.

The typical patient's total barely moves (94 to 91 on the grid), because the typical grid patient has a folded card already. The change is on open cards.

**MeningoVax does not do this.** It has the same one-line note plus "Why this". It leaves its one line in view, and its Sources row always shows. But its lines are short: 13 words typically, 22 at most, per card. That is measured on 3,048 patients with no doses, so it flatters MeningoVax. PneumoVax's visible note reaches 144 words for one patient. So "copy MeningoVax" means one short line, not an empty note. It also has no "Why this" under recorded doses at all; PneumoVax is ahead there. The design rule says design changes in one app go to the other, so tell me if MeningoVax should change too.

## Rulebook-style rewriting: how much work

**How the rulebook writes:** the action or product first, then the interval. ≥ signs. "Minimum interval", "dose", "valid", "invalid". Every invalid dose names an action. No "this child".

**How many sentences exist.** Counting patterns (dates, ages and products treated as blanks), the app prints **272 different sentences**: 98 in notes, 84 in "Why this", 63 under doses, 27 in the "Why this" under doses. These are the sentences reached by the 77,496 patients. Sentences no patient reached are not counted.

A few do most of the work:

| Most common sentences | Share of visible explanation words, grid | Typical patients |
|---|---|---|
| Top 10 | 51% | 65% |
| Top 20 | 67% | 82% |
| Top 50 | 86% | 97% |

**Before and after.** No dose, date or interval changes in any of these.

| | Today | Rulebook style | Words | Patients | Check against its source |
|---|---|---|---|---|---|
| 1 | Given 28 days after the previous dose — for dose 3 of the series, when the earlier dose was given at 12 months of age or older, CDC's minimum interval is 8 weeks. | Given 28 days after the last dose; minimum interval 8 weeks. | 29 to 11 | 3,608 | Carries no number today. The age condition moves behind "Why this". Claim unchanged |
| 2 | This dose does not count toward the series — given too soon after the dose it is measured from. It is not repeated; the next dose in this series can be given from Sep 12, 2026 at the earliest. | Not repeated. Next dose from Sep 12, 2026 at the earliest. | 36 to 11 | 1,735+ | Must keep "earliest" and never say "due" (your 2026-10-24 ruling). Label already says Invalid |
| 3 | PCV7 (Prevnar 7) is not counted toward the pneumococcal series. Per ACIP/immunize.org, PCV7 doses are ignored when determining current pneumococcal needs — treat the patient as if PCV-naïve for these doses. | Not counted. Treat as PCV-naïve. [1] (once, not per dose) | 30 to 5 | 10,692 | immunize.org's quote says PCV7 doses "should be ignored". True. Keep "PCV-naïve": "unvaccinated" would be false for someone who has had PPSV23 |
| 4 | Not needed: PPSV23 is given only to children with certain medical conditions or risk factors, per CDC, and none is recorded for this child. This dose isn't harmful, it isn't counted, and nothing needs to be repeated. | No risk condition recorded: PPSV23 not indicated. Not counted. Do not repeat. | 37 to 12 | 14,424 | **Part of this is your own wording**, so it needs your OK |
| 5 | At-risk non-immunocompromising child who completed PCV13/15 before age 6 (no PCV20, no PPSV23): Option A — 1 dose of PCV20 ≥8 weeks after the most recent PCV. | Heading: Option A: PCV20, ≥8 weeks after the last PCV. Sentence folds | 25 to 0 | 458 | CDC: "at least 8 weeks after the most recent PCV dose". True |
| 6 | Give ONE further pneumococcal dose — either 1 dose of PCV20 or a 2nd PPSV23 — ≥5 years after the first PPSV23. Choose ONE option, not both. | Headings: PCV20, ≥5 years after the first PPSV23 / 2nd PPSV23, ≥5 years after the first PPSV23. Line: Choose one. | 24 to 2 | 6,477 | CDC: "at least 5 years have passed since they received their first PPSV23 dose. Then give 1 dose of PCV20 or PPSV23." True |

**Also found, small:** a few headings say "≥5y", where you asked for weeks, months and years spelled out.

**Size of the work**

| Job | Sentences | Tests | PRs |
|---|---|---|---|
| Fold notes only | Moves sentences, rewrites none | 80 tests in 29 files | 1 |
| Fold notes and dose lines | Same | 134 tests in 50 files | 1, could be 2 |
| Rewrite top 20 visible | 20 | About 23 exact-wording checks | 1 |
| Rewrite top 50 | 50 | Not counted one by one | 2 |
| Rewrite all 272 | 272 | At least 256 exact-wording checks across 81 test files | Several. Not recommended |

Test counts for the fold came from trying it in a throwaway copy, 1,627 tests in 139 files. The same 50 files pass 576 of 576 without the fold, so every failure comes from the fold. Most failures are tests that look for a sentence in the visible note and now need to look in note plus "Why this". The chip fold in this trial dropped citations crudely, so 134 runs slightly high. The two saved-answer sweeps were not run. They record no wording, so they should not move, but that is not measured.

## Recommendation

**Do the fold, then rewrite the top 20 dose lines. Skip the rest.**

- The fold takes visible explanation from 94 to 26 words for a typical patient who sees any, with no sentence rewritten and no citation lost.
- Dose lines are where a rewrite pays: they are 21% of the words, and folding them cannot fully work without shorter lines, because your rule keeps the shortfall in view.
- Note sentences mostly vanish under the fold, so rewriting them is effort on text nobody sees first.
- Add a check that fails if visible words creep back up. A fold without one will drift, as your other rules have.

**What folding could hide that matters**

- **Already hidden today.** PCV15 is offered to an at-risk child or adult on 6,123 cards. On 2,262 of them the word PPSV23 appears nowhere in view, only behind "Why this". They are at-risk babies and the 2 to 5 catch-up (Max's card is one). The fold neither fixes nor worsens this. I would add one visible line.
- **The "Choose one" lines.** Keep them. They are the only thing stopping two doses.
- **Sources numbers.** See decision 2.

## What you need to decide

1. **The keep list.** Is the "must stay in view" table right? Anything to add or drop?
2. **The Sources row.** Today all 37,054 open cards show a number in the sentence that matches a Sources button. After the fold, 33,148 of them (89%) show no number in view, so the row sits there unconnected, which is the question you asked on 2026-10-17. Put Sources inside "Why this" with the sentences they support (my pick, one click to verify), or leave the row showing (as MeningoVax does)?
3. **Under recorded doses.** Max's PPSV23 today shows three sentences. Should it show only "Not repeated. Next dose from Nov 6, 2030 at the earliest", with the gap behind "Why this"? Your 2026-10-25 rule says state the shortfall. "Why this" already says "Gap: same day. Minimum: 8 weeks". For an invalid dose, is that enough? I kept the shortfall in view for doses that counted.
4. **The disclaimer.** 144 words on every page. Shorten it, or put the PPSV23 paragraph behind a click? That paragraph was added on 2026-10-10 (P6-7) to state an assumption the app makes, so removing it from view is your call.
5. **The PCV21 note.** 50 words on every adult who could get PCV21. Fold to its title?
6. **The PCV15 line** on the 2,262 cards. Add it?
7. **Your own wording** in rewrite 4 ("isn't harmful, isn't counted"). Keep or shorten?
8. **MeningoVax.** Apply the same fold there?

## Technical notes

- Scripts and raw output are in a throwaway scratch folder, not kept. `build.mjs` bundles `Results.jsx` twice, once with disclosures shut and once with them forced open. `sweep.cjs` sorts rendered text by CSS class. `fold.cjs` simulates the fold. `templates.cjs` counts sentences. `pins.cjs` counts wording pins. `safety.cjs` runs the safety checks. `foldtry/` is the throwaway copy.
- Word counts leave out [N] markers. "Explanation" means note lead, reasons under doses, the adult-risk note and the PCV21 note.
- The grid uses its fixed date, 2026-10-11. Named patients use 2026-11-06.
- The grid holds no vaccinated teenager, so typical-patient figures are given beside it. Typical-patient runs cover age 7 and over only.
- The keep list is regular-expression rules in `fold.cjs`, a stand-in for the real thing. Sentence patterns are split at full stops, so a few long sentences may count twice.
- Build it in the engine, moving sentences from `lead` to `detail` at the 42 `lead:` sites in `recommend.js`, rather than filtering in `RecCard`. Then `lead` keeps meaning "what shows", and no clinical sentence selection lives in a component. `noteCites` is one ordered list across lead then detail, so moving a sentence that sits before a kept sentence must reorder its cites. The trial did this in one wrapper. Some cards end with an empty `lead`, so `RecNote` must cope, and `withAtNineteen` and `.endsWith` read `card.note` as a string.
- Folding a dose reason into `whys` loses its `[c]`: `reasonCites` indexes `reasons` only. `reasonCiteSlices` must be extended first, as the warning in `RecCard.jsx` says.
- `scripts/proseDiff.mjs` must run before and after. The wholeApp `readCard()` reads note text to find "not due until…", so keep that sentence or update the reader.

Found in passing, not part of this: Mia, due on the day she turns 4 months, shows "Catch-up", and "Why this" says the dose "is overdue".
