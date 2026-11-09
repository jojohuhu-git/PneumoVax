# Retired 2026-11-08: the adult "given too soon to count" card

**Owner decision 2026-11-08:** *"Yes, remove it"*. She was asked whether to remove the adult card that no patient
can reach.

## What it was

The 2026-10-24 ruling built this card: an adult whose last dose did not count and who still owed one got a card
reading *"The PPSV23 dose of <date> was given too soon to count, so the series is INCOMPLETE. Give 1 dose of PCV20
or PCV21 …"*. The date and products came from the dose check.

## Why it could never appear

`adultRepeatOwed()` built the card only when the last dose was **invalid** under one of five adult interval rules
(`ADULT-PCV-AFTER-PPSV23`, `ADULT-PPSV23-AFTER-PCV15`, `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM`,
`ADULT-PPSV23-AFTER-PCV13`, `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM`). PR #90 (owner ruling 2026-10-25) made every
adult interval rule a `'recommendation'`, so no adult dose is ever invalid under them.

Measured 2026-11-08, before removal, with the card's code set to crash if reached:
- **0 of 95,760** test patients reached it (17,016 grid, 18,264 impossible entries, 60,480 typical). The 11,974
  adults whose last dose was invalid all had it thrown out under a **child's** rule (a dose given before 19):
  `CHILD-PPSV23-AFTER-PCV` 8,176, `CHILD-PCV-AFTER-PCV` 3,463, `CHILD-PCV-AFTER-PPSV23` 335.
- The full suite passed **2,467 / 0** with the crash in place, so no hand-built test reaches it either.

An earlier session had kept it on purpose, *"because it is the implementation of a ruling she might restore"*.
This file is that safeguard now. To bring the card back, reapply the two blocks below, put the `adultRepeat`
argument back on `pcvAdult` and its call, and restore `const adultRepeat = adultRepeatOwed(analysis, rawPcv,
rawPpsv, am);` in `recommend()`. The guard
`regression-2026-10-25-an-early-adult-dose-owes-nothing.test.js` still fails if any of those adult rules becomes
a floor again. That is the signal the card is needed.

The last commit that had it: the parent of the commit that adds this file (`git log -- docs/archive/retired-2026-11-08-adult-invalid-dose-card.md`).

## Block 1: the card, in `pcvAdult()` (verbatim)

```js
  // ── An invalid dose is the last thing on the record → a conjugate is owed
  //    (OWNER RULING 2026-10-24) ─────────────────────────────────────────
  //
  // PLACED AFTER THE TWO "COMPLETE" CHECKS ON PURPOSE, and that placement is
  // her dividing line, not an implementation detail: "Calling it 'invalid'
  // changes nothing, because no dose was owed." A patient whose COUNTING
  // history already completes the series keeps her complete card — an early
  // extra dose cannot un-finish her, which is Ruling F. This branch is only
  // for a patient who still owed a dose and whose attempt at it came too soon.
  //
  // It replaces two cards that were both wrong for these patients. Driven in
  // the app on her asplenic patient, the old screen read "PPSV23 (>=8 weeks
  // after PCV15) — Not yet due, eligible Oct 25, 2026" directly above a chip
  // reading "can be given from 2027-10-11": two dates, two different vaccines,
  // one patient.
  //
  // THE DATE AND THE PRODUCTS COME FROM `adultRepeat`, which the engine read
  // off the dose verdict. Nothing here recalculates either.
  if (adultRepeat) {
    const { dueDate, products, invalidDate, invalidVaccine, basis } = adultRepeat;
    const dueToday = dueDate <= today;
    const productWords = products.join(' or ');
    const gaveWhat = invalidVaccine === 'PPSV23' ? 'PPSV23' : 'conjugate';

    // HER RULING 6, the whole reason this sentence exists: "make it clear that
    // the 8 week interval is pediatric data with nothing clarifying adults.
    // Cite the reference. State using 1 year is an interpretation from ACIP
    // minimum interval for adults between PCV13 and the next conjugate. Cite
    // this too."
    //
    // So the two legs of her lookup say different things about their own
    // standing, and the clause is EMPHASISED because a reader who skims past
    // it is the reader who thinks the app has simply used the wrong number.
    //
    // ⚠️ THE PAEDIATRIC TABLE IS NAMED IN WORDS AND CARRIES NO [c]. A numbered
    // citation asserts "this document states my claim", and the claim here is
    // partly about what the document does NOT cover — there is no adult
    // 8-week conjugate-to-conjugate interval anywhere. CLAUDE.md's rule is
    // cite it or take it off; a negative claim can be neither, so it is stated
    // the way the dose chips already name CDC, in prose. The card's grey
    // buttons stay adult, which is also what `population` requires.
    // ⚠️ FINDING F IN MINIATURE, CAUGHT BY THE COUNT PINS. Narrowing this
    // card's sources to CDC's adult notes took the job aid off 56 cards it
    // DOES speak for. For a patient with a PCV15 on record whose PPSV23 came
    // too soon, the conjugate now being offered is literally standing in for
    // the PPSV23 she still owes — which is the job aid's footnote, and nothing
    // else in the app's source set states it (C8, document 2). So those cards
    // keep it, WITH a number and the sentence it is attached to. For family 2
    // there is no PPSV23 being substituted, so it stays off.
    //
    // This is the owner's 2026-10-18 rule in use: every candidate document
    // gives the SAME dose here, so the only question is which goes on the
    // card, and that is a judgement to take and record rather than escalate.
    const substitutingForOwedPpsv23 = invalidVaccine === 'PPSV23' && pcv.hasPCV15;
    const substitutionNote = substitutingForOwedPpsv23
      ? ' The PPSV23 this patient still owed may be replaced by PCV20 or PCV21 [c].'
      : '';
    const substitutionCites = substitutingForOwedPpsv23 ? [cite('jobAidPpsv23Unavailable')] : [];

    // THE SAME CORRECTION, FOR THE OTHER FAMILY AND THE OTHER DOCUMENT.
    // Narrowing the sources also took mm7401a1 off 132 family-2 cards, and
    // FINDING F's guard is what caught it. Its "PPSV23 only" row — identical in
    // all three adult blocks — states exactly this patient's disposition: "A
    // single dose of PCV21, PCV20, or PCV15 >=1 year after the last PPSV23
    // dose." With her conjugate set aside her counting history IS PPSV23-only,
    // so the row fits, and its own year has already elapsed.
    //
    // ⚠️ CITED FOR THE DISPOSITION, NOT FOR THE DATE. The card's date is later
    // than the row's, because the repeat must also clear the spacing from the
    // dose that did not count. Crediting mm7401a1 with the card's date would
    // be the "right-sounding quote written about something else" fault, so the
    // claim gets its OWN sentence and the sentence says why the date differs.
    // The two families are mutually exclusive: family 2 has no counting PCV15.
    const ppsvOnlyRowApplies = invalidVaccine === 'PCV' && !pcv.hasPCV15 && !pcv.hasPCV13;
    const ppsvOnlyRowNote = ppsvOnlyRowApplies
      ? ` With only a PPSV23 counting, a single dose of ${productWords} at least ${ADULT_GAP_WORDS} after it completes the series [c] — the later date above is the further spacing CDC's general rule requires from the dose that did not count.`
      : '';
    const ppsvOnlyRowCites = ppsvOnlyRowApplies
      ? [cite('mmwrPpsvOnlyThenPcv')]
      : [];

    // THE SAME CORRECTION AGAIN, FOR THE FAMILIES ADDED 2026-10-25.
    //
    // Extending this card to the two PCV13 rows took mm7401a1 off **212**
    // cards it speaks for, and the three C8 guards caught it the moment the
    // change ran (3,795 -> 3,583). That is FINDING F's mirror for the third
    // time on this one card, and the fix is the same shape as the two above:
    // read the document, find the row that fits, cite it in its own sentence.
    //
    // The row: with the PPSV23 set aside, this patient's COUNTING history is a
    // PCV13 and nothing else, which is precisely mm7401a1's "PCV13 only" row —
    // "A single dose of PCV21 or PCV20 >=1 year after the PCV13 dose." It
    // states her disposition outright, and it is the row the card she had
    // before this change was built on.
    //
    // ⚠️ CITED FOR THE DISPOSITION, NOT FOR THE DATE — the same care the
    // "PPSV23 only" sentence above takes, and for the same reason. The row's
    // year runs from the PCV13; the card's date is later, because the repeat
    // must also clear the spacing from the PPSV23 that did not count. That
    // gap IS the owner's 2026-10-25 ruling (she was shown both dates and chose
    // the later), so the sentence says which number belongs to the document
    // and which to the ruling, and never lets the document carry the date.
    //
    // Mutually exclusive with both branches above: this one needs a counting
    // PCV13 and no PCV15, `substitutingForOwedPpsv23` needs a PCV15, and
    // `ppsvOnlyRowApplies` needs neither conjugate.
    //
    // `mmwrPcv13OnlyCite` is the existing picker (the 19-49 IC/CSF/cochlear
    // block prints this row one word differently). Reused, never re-derived —
    // a second risk-class test here would be the S14-RC fault.
    const pcv13OnlyRowApplies = invalidVaccine === 'PPSV23' && pcv.hasPCV13 && !pcv.hasPCV15;
    const pcv13OnlyRowNote = pcv13OnlyRowApplies
      ? ` With only the PCV13 counting, ACIP's own row for this history gives a single dose of ${productWords} at least ${ADULT_GAP_WORDS} after that PCV13 [c] — the later date above is the further spacing CDC's general rule requires from the dose that did not count.`
      : '';
    const pcv13OnlyRowCites = pcv13OnlyRowApplies
      ? [cite(mmwrPcv13OnlyCite)]
      : [];

    const standing = basis === 'ppsv23ToConjugate'
      ? ` **ACIP states this interval itself — a conjugate dose comes at least ${ADULT_GAP_WORDS} after the last PPSV23, for every risk group, with no 8-week option [c]. Counting it from the dose that was given, rather than from the one before it, follows CDC's general rule that a repeat is spaced from the invalid dose.**`
      : ` **The ${ADULT_GAP_WORDS} is read across from the only adult conjugate-to-conjugate interval ACIP states — PCV20 or PCV21 at least ${ADULT_GAP_WORDS} after the last PCV13 dose [c] — and applied here to a conjugate that has to be repeated, which ACIP does not discuss. It is an interpretation, not a stated rule. The 8-week conjugate interval is paediatric: it is CDC's catch-up schedule, whose own scope line reads "Children age 4 months through 6 years", and no adult source states one.**`;

    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `${productWords} ≥${ADULT_GAP_WORDS} after the ${gaveWhat} dose of ${fmtDate(invalidDate)} — completes the series`,
      dueToday, earliestNextDate: dueToday ? null : dueDate,
      minIntervalMonths: MO12,
      brands: products.map((k) => (k === 'PCV20' ? 'PCV20 (Prevnar 20)' : 'PCV21 (Capvaxive)')),
      note: {
        lead: `The ${gaveWhat} dose of ${fmtDate(invalidDate)} was given too soon to count, so the series is INCOMPLETE. Give 1 dose of ${productWords} ${dueToday ? 'now' : `on or after ${fmtDate(dueDate)}`} and the series is complete [c].${standing}`,
        detail: `PPSV23 is not what is owed here: ACIP's only interval between two PPSV23 doses is 5 years, and a repeat conjugate completes the series on its own. PCV15 is not used either — it adds nothing over a conjugate already on the record, and it would itself require a PPSV23 afterwards.${ppsvOnlyRowNote}${pcv13OnlyRowNote}${substitutionNote}`,
      },
      noteCites: [
        cite('adultPcv20or21Complete'),
        basis === 'ppsv23ToConjugate'
          ? cite(isOlderAdult ? 'adultPpsvOnly' : 'adultPpsvOnly1949')
          : cite(notesRow('adultPcv13Only')),
        ...ppsvOnlyRowCites,
        ...pcv13OnlyRowCites,
        ...substitutionCites,
      ],
      // ⚠️ CDC'S ADULT NOTES ALONE, and this is the fix for a real defect the
      // first draft shipped. `adultRefs()` with no exclusions spreads all three
      // adult documents over the card — exactly the shape CLAUDE.md forbids,
      // "never a single list computed once and spread over every card" — and
      // it left 188 cards carrying mm7401a1 and job-aid buttons that no number
      // on the card pointed at. Every numbered citation this card makes is a
      // sentence of CDC's adult notes: the completion claim, and whichever leg
      // of the interval lookup applies. The job aid and mm7401a1 say nothing
      // about repeating an invalid dose, so they come off — "cite it, or take
      // it off that card".
      // Each family carries the documents that speak for ITS sentences and no
      // others: CDC's notes always, mm7401a1 only where its "PPSV23 only" row
      // fits, the job aid only where its substitution footnote does.
      // Each family carries the documents that speak for ITS sentences, and
      // the branch order matches the four `...RowApplies` flags above.
      // `pcv13OnlyRowApplies` (2026-10-25) keeps mm7401a1 for its "PCV13 only"
      // row and drops the job aid, which says nothing about a repeat.
      refs: ppsvOnlyRowApplies
        ? adultRefsExcept('cdcAdultTimingJobAid')
        : pcv13OnlyRowApplies
          ? adultRefsExcept('cdcAdultTimingJobAid')
          : substitutingForOwedPpsv23
            ? adultRefsExcept('mmwr7401a1')
            : adultRefsExcept('cdcAdultTimingJobAid', 'mmwr7401a1'),
    })];
  }
```

## Block 2: the gate, before `recommend()` (verbatim)

```js
// The adult families whose RECOMMENDATION CARD follows the invalid dose, per
// the owner's ruling of 2026-10-24. See `adultRepeatOwed` for why this is a
// named set and not "every adult floor".
const CARD_FOLLOWS_INVALID_DOSE = new Set([
  'ADULT-PCV-AFTER-PPSV23',
  'ADULT-PPSV23-AFTER-PCV15',
  'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM',
  // OWNER DECISIONS 2026-10-25, the two PCV13 twins of the rows above.
  //
  // Shown two 60-year-olds alike in every particular but one — PCV13 on
  // 2026-07-19 against PCV15 on the same day, each followed by a PPSV23 three
  // months later — the owner ruled: *"A is treated the same as B."* The PCV15
  // patient's screen had agreed with itself since 2026-10-24; the PCV13
  // patient's card said 2027-07-19 while her own dose chip said 2027-10-11.
  // Nothing in ACIP or CDC separates them: rr7203a1 states both halves in one
  // sentence, and `CLINICAL_SPEC.md` §K already recorded the two rows as
  // having "the same two-tier shape... for the same reason".
  'ADULT-PPSV23-AFTER-PCV13',
  // ...and the same for her 8-week class. Asked to confirm the number, she
  // asked back whether the conjugate is owed "at least 1 year after the last
  // PCV", which is ONE of the two clocks and the earlier one. Shown a
  // 40-year-old with asplenia (PCV13 2026-08-30, PPSV23 2026-10-11) scored
  // both ways — 2027-08-30 counting from the PCV13, 2027-10-11 counting from
  // the PPSV23 that did not count, 2027-10-11 taking the later of the two —
  // she chose the later of the two, *"and i want the rationale to be
  // explained and cited when its recommended"*. That explanation is the
  // sentence `invalidAdultDoseCard` already carries, which is why extending
  // the set is the whole change: both intervals have to be satisfied, so the
  // conjugate waits for whichever runs out last.
  'ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM',
]);

/**
 * The repeat an adult's invalid dose leaves owing, or null.
 *
 * Returns the date and products the RULES TABLE computed, plus which leg of
 * her two clocks set it, so the card can say whether its number is stated by
 * ACIP or read across from a neighbouring rule.
 */
function adultRepeatOwed(analysis, rawPcv, rawPpsv, ageMonths) {
  if (ageMonths < ADULT_SCHED_MIN_M) return null;
  const dated = (list) => (list ?? []).filter((d) => d?.date)
    .slice().sort((a, b) => a.date.localeCompare(b.date));
  const rows = [
    ...(analysis.pcv?.perDose ?? []).map((v, i) => ({ v, d: dated(rawPcv)[i], vaccine: 'PCV' })),
    ...(analysis.ppsv23?.perDose ?? []).map((v, i) => ({ v, d: dated(rawPpsv)[i], vaccine: 'PPSV23' })),
  ].filter((r) => r.d?.date).sort((a, b) => a.d.date.localeCompare(b.d.date));
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  // Only an invalid LAST dose leaves something owing (her "repaired" proviso),
  // and never a record problem — "a dose the patient never had".
  if (last.v.status !== 'invalid' || last.v.recordProblem || !last.v.repeatDueDate) return null;
  // ⚠️ DELIBERATELY NARROW, AND THE FIRST DRAFT WAS NOT. Applied to every
  // adult whose last dose is invalid, this moved 667 of 17,016 verdicts and
  // broke eleven citation guards — because it overrode cards that reason from
  // a RICHER history with a blunter rule. The clearest casualty: an
  // immunocompromised adult with PCV13 + two PPSV23 doses, the second given
  // too soon, lost her mm7401a1 "review again at age 50" card altogether and
  // was told to come back for a conjugate in a year. Her counting history owes
  // a conjugate at FIVE years, which is Ruling F's territory, and no ruling
  // said otherwise.
  //
  // So this fires only for the families the owner actually worked through, and
  // they are named by the rule that rejected the dose rather than inferred:
  //
  //   ADULT-PCV-AFTER-PPSV23                    her patients 1 and 2
  //   ADULT-PPSV23-AFTER-PCV15                  her patient 3
  //   ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM  her patient 4, the asplenic one
  //
  // Every other adult family keeps the card it had. `ADULT-PPSV23-AFTER-PCV13`
  // (402 patients) is the same clinical shape and is the previous handoff's
  // "clearest defect", but widening to it moves verdicts in a family she has
  // not been shown — her own 2026-10-18 rule sends that back to her. It is
  // flagged, not taken.
  if (!CARD_FOLLOWS_INVALID_DOSE.has(last.v.intervalRuleId)) return null;
  const alt = last.v.conjugateAlternative;
  return {
    dueDate: last.v.repeatDueDate,
    products: ADULT_OWED_AFTER_INVALID_DOSE,
    invalidDate: last.d.date,
    invalidVaccine: last.vaccine,
    invalidProduct: last.d.product || null,
    // `conjugateAlternative` is only attached by the one row that opts in, so
    // fall back to the leg the date implies.
    basis: alt?.basis ?? (last.vaccine === 'PPSV23' ? 'ppsv23ToConjugate' : 'conjugateToConjugate'),
  };
}
```
