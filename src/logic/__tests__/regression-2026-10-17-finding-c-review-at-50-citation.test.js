// FINDING C (2026-10-17) — a card that says "no dose now" was quoting the
// sentence that says GIVE a dose.
//
// WHAT THE CLINICIAN SAW. An adult aged 19-49 with a chronic (non-
// immunocompromising) condition who already has PCV13 and one PPSV23 on
// record gets the right advice:
//
//     No dose now — review at age 50
//     No additional pneumococcal dose now — re-evaluate at age 50 [1]
//
// Hovering [1] showed, verbatim:
//
//     "Previously received both PCV13 and PPSV23 but NO PPSV23 was received at
//      age 65 years or older: 1 dose PCV20 or 1 dose PCV21 at least 5 years
//      after the last pneumococcal vaccine dose."
//
// The quote instructs a dose on a card that says not to give one. It is also
// the wrong patient: that sentence is in CDC's "Routine vaccination / Age 50
// years or older" block. CDC's own 19-49 block states this patient's rule, and
// the app was not quoting it:
//
//     "Alcoholism, chronic heart/liver/lung disease, cigarette smoking, or
//      diabetes mellitus: no additional PCV or PPSV23 doses recommended at
//      this time. Review pneumococcal recommendations when age 50 years or
//      older."
//
// SOURCE, read live 2026-10-17 (browser pane, accordions expanded, 4,785
// characters of pneumococcal note; positive control: "Special situations"
// found at offset 1,764 so both blocks were present). Occurrence counting is
// what found this: every quote was checked for HOW MANY times it appears on
// its page and in WHICH block, not merely whether it appears. `adultBothNotAt65`
// appears exactly once, in the 50+ block, and the app showed it to 19-49s.
//
// MEASURED over `test-grid.js` (16,008 patients, corpus date 2026-10-11):
// 175 cards read "No dose now — review at age 50" and all 175 carried that
// 50+ sentence as the citation for their lead claim.
//
// WHY NO EXISTING GUARD CAUGHT IT. Both verdict corpora record a card's
// status, brands and dates — never its prose or its citations, so a card can
// keep a correct verdict while quoting a sentence that contradicts it.
// `regression-n6-citations-follow-the-rulebook` checks child-vs-adult only;
// both sentences here are adult, so N6 is silent by design.
//
// NOT CHANGED, deliberately: the detail half of the card says what happens at
// 50 ("At age 50, a dose of PCV20 or PCV21 is recommended, >=5 years after the
// last pneumococcal dose"). That claim DOES rest on the 50+ sentence, so
// `adultBothNotAt65` stays — moved to the half of the note it supports.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { ROUTINE_ADULT_MIN_M, ADULT_SCHED_MIN_M } from '../scheduleConstants.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const TODAY = '2026-10-11';

// A 19-49 adult with chronic conditions only, PCV13 and one PPSV23 on record.
const chronicOnly1949 = (riskIds = ['diabetes']) => recommend({
  ageMonths: 420,                       // 35y — inside 19-49, below ROUTINE_ADULT_MIN_M
  dob: null,
  today: TODAY,
  riskIds,
  pcvDoses: [{ product: 'PCV13', date: '2016-10-11' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2017-10-11' }],
});

const reviewCard = (out) => (out.recs ?? []).find((r) => /review at age 50/i.test(r.doseLabel ?? ''));

describe('FINDING C — the review-at-50 card quotes the 19-49 rule, not the 50+ one', () => {
  it('the card still gives the same advice (this fix changes citations, not verdicts)', () => {
    const card = reviewCard(chronicOnly1949());
    expect(card).toBeTruthy();
    expect(card.status).toBe('complete');
    expect(card.dueToday).toBe(false);
    expect(card.brands ?? []).toEqual([]);
  });

  it('the lead claim is cited to CDC\'s 19-49 chronic-conditions sentence', () => {
    const card = reviewCard(chronicOnly1949());
    expect(card.noteCites[0].key).toBe('adultChronicOnlyReviewAt50');
  });

  it('that sentence is stored verbatim as CDC prints it', () => {
    // Read live 2026-10-17 from the Special situations / Age 19-49 block.
    expect(REFS.adultChronicOnlyReviewAt50.quote).toBe(
      'Alcoholism, chronic heart/liver/lung disease, cigarette smoking, or diabetes mellitus: no additional PCV or PPSV23 doses recommended at this time. Review pneumococcal recommendations when age 50 years or older.',
    );
    expect(REFS.adultChronicOnlyReviewAt50.rulebook).toBe('adult');
    expect(REFS.adultChronicOnlyReviewAt50.url).toContain('adult-notes.html');
  });

  it('no citation on the card tells the clinician to give a dose', () => {
    const card = reviewCard(chronicOnly1949());
    // The failure this pins: a quote that instructs a dose, on a card that
    // says none is due. Asserted on the lead's citation, which is the one a
    // clinician reads beside "no additional pneumococcal dose now".
    expect(card.noteCites[0].quote).not.toMatch(/1 dose PCV20 or 1 dose PCV21 at least 5 years/);
    expect(card.noteCites[0].quote).toMatch(/no additional PCV or PPSV23 doses recommended at this time/);
  });

  // Asserted by HALF rather than by index (C8, document 2's CITEs,
  // 2026-10-17). This test used to pin `noteCites` as a two-element list in
  // order, which answered the right question only while the lead had exactly
  // one citation. C8 gave the lead a second one — the job aid's page 4 row,
  // the same "no dose now" claim in CDC's own words — and an index assertion
  // would have failed for a change that is precisely what it wants.
  //
  // The hazard is unchanged and now stated directly: the sentence that
  // INSTRUCTS a dose must sit on the detail half, and never beside "no
  // additional pneumococcal dose now". Read through `noteCiteSlices`, which is
  // the same function the screen uses to decide which number goes where, so
  // the test cannot pass while the rendered card disagrees.
  it('the 50+ sentence is kept, on the half of the note it actually supports', () => {
    const card = reviewCard(chronicOnly1949());
    const { lead, detail } = noteCiteSlices(card.note, card.noteCites);

    // The lead says no dose is due. Every citation beside it must be a
    // sentence that says the same, about this patient's own age band.
    expect(lead.map((c) => c.key)).toEqual([
      'adultChronicOnlyReviewAt50',
      'jobAidChronic1949ReviewAt50',
      // C8, document 1's CITE (2026-10-17): ACIP's own chronic-block row for
      // this history. A third document now states the same claim, which is
      // what this card is supposed to accumulate.
      'mmwrChronic1949ReviewAt50',
    ]);
    for (const c of lead) {
      // THE HAZARD, stated directly instead of through one phrase. The old
      // assertion required the words "no additional" or "no vaccines", which
      // was a proxy for "does not instruct a dose" — and it could not express
      // mm7401a1's row, which defers the question ("should be reviewed again
      // … at age 50") without ever saying "no". So both shapes are allowed,
      // and the thing actually forbidden is now forbidden by name.
      expect(c.quote, `${c.key} sits beside "no dose now"`)
        .toMatch(/no (additional|vaccines)|review(ed)? [^.]*again|review [^.]*when age/i);
      expect(c.quote, `${c.key} must not instruct a dose beside "no dose now"`)
        .not.toMatch(/\b(1 dose|a single dose|administer)/i);
      expect(REFS[c.key].population, c.key).toEqual(['adult-19to49']);
    }

    // The detail half is the only place the 50+ instruction belongs.
    expect(detail.map((c) => c.key)).toEqual(['adultBothNotAt65']);
    expect(detail[0].quote).toMatch(/1 dose PCV20 or 1 dose PCV21 at least 5 years/);

    // Marker counts still match the slices, so nothing is silently dropped.
    // The lead went 2 -> 3 on 2026-10-17 when C8 document 1 credited
    // mm7401a1's own chronic-block row; the detail is unchanged.
    const leadMarkers = (card.note.lead.match(/\[c\]/g) ?? []).length;
    const detailMarkers = (card.note.detail.match(/\[c\]/g) ?? []).length;
    expect(leadMarkers).toBe(3);
    expect(detailMarkers).toBe(1);
    // And every marker has a citation behind it. Without this, adding a "[c]"
    // and forgetting its cite would silently truncate the slice instead of
    // failing — the card would print a number that points at nothing.
    expect(card.noteCites).toHaveLength(leadMarkers + detailMarkers);
  });

  it('holds for every chronic-only risk condition, not just diabetes', () => {
    for (const id of ['diabetes', 'chronic_heart', 'chronic_liver', 'chronic_lung', 'smoking', 'alcoholism']) {
      const card = reviewCard(chronicOnly1949([id]));
      expect(card, id).toBeTruthy();
      expect(card.noteCites[0].key, id).toBe('adultChronicOnlyReviewAt50');
    }
  });

  it('the control: a 50+ adult still quotes the 50+ sentence', () => {
    // The sentence is not wrong — it was on the wrong card. A 50+ adult with
    // the same history is told to give the dose, and quotes the row that says so.
    const out = recommend({
      ageMonths: 660,
      dob: null,
      today: TODAY,
      riskIds: ['diabetes'],
      pcvDoses: [{ product: 'PCV13', date: '2016-10-11' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2017-10-11' }],
    });
    const card = out.recs[0];
    expect(card.doseLabel).toMatch(/PCV20 or PCV21/);
    expect(card.noteCites.map((c) => c.key)).toContain('adultBothNotAt65');
    expect(reviewCard(out)).toBeUndefined();
  });

  it('an immunocompromised 19-49 adult is a different card and is not touched here', () => {
    // IC / cochlear / CSF leak at 19-49 DO get a dose at >=5 years, so they
    // never reach the review-at-50 branch. Their citation is a separate,
    // recorded item (the quote agrees with the card, it is just the 50+
    // instance of it) and is deliberately out of scope for FINDING C.
    const out = recommend({
      ageMonths: 420,
      dob: null,
      today: TODAY,
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2016-10-11' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2017-10-11' }],
    });
    expect(reviewCard(out)).toBeUndefined();
    expect(out.recs[0].doseLabel).toMatch(/≥5 years/);
  });
});

describe('FINDING C — swept over the whole grid, with the count that moved', () => {
  const cases = buildCases();

  it('the grid is the committed one', () => {
    // 17,016 since FINDING D/E added the four-dose PCV13 infant history in the
    // same session; it was 16,008 when FINDING C was measured.
    expect(cases).toHaveLength(17016);
    expect(CORPUS_TODAY).toBe(TODAY);
  });

  // ⚠ NARROWED 2026-10-18, and narrowed to the HAZARD rather than relaxed.
  // This used to select cards by the words "review at age 50" in the dose
  // label alone. On 2026-10-18 a second, different card acquired that phrase:
  // the 19-49 immunocompromising card with TWO PPSV23 doses, which now follows
  // ACIP's order ("reviewed again ... at age 50. Alternatively, a single dose
  // ... >=5 years"). That card DOES offer a dose, so a quote instructing one
  // is exactly right on it -- the opposite of FINDING C's hazard.
  //
  // FINDING C is about a card that says NO dose is due standing beside a quote
  // that instructs one. So the selector is now "mentions the review at 50 AND
  // offers no product", which is what that card is, and the new card is
  // asserted separately below rather than merely excluded.
  const offersNoDose = (r) => (r.brands ?? []).length === 0;

  it('not one review-at-50 card that offers no dose quotes the give-a-dose sentence first', () => {
    const offenders = [];
    let seen = 0;
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const r of out.recs ?? []) {
        if (!/review at age 50/i.test(r.doseLabel ?? '')) continue;
        if (!offersNoDose(r)) continue;
        seen++;
        if (r.noteCites?.[0]?.key !== 'adultChronicOnlyReviewAt50') {
          offenders.push(`${c.key} → ${r.noteCites?.[0]?.key}`);
        }
      }
    }
    expect(offenders).toEqual([]);
    // Anti-vacuity: if a later change stops producing this card at all, the
    // assertion above would pass on an empty set and say nothing.
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +20 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      // -5, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
      // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
      // counting conjugate and her card family changes with it. The invariant
      // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
      expect(seen).toBe(210 + 20 - 5);
  });

  it('the review-at-50 card that DOES offer a dose leads with ACIP\u2019s two-dose row', () => {
    const found = [];
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const r of out.recs ?? []) {
        if (!/review at age 50/i.test(r.doseLabel ?? '')) continue;
        if (offersNoDose(r)) continue;
        found.push(r.noteCites?.[0]?.key);
      }
    }
    // The 45 two-dose 19-49 immunocompromising cards, all citing the row that
    // states the review at 50 -- not CDC's Adult Notes, which say only the
    // dose and its five years.
    // was 45; -5, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
    // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
    // counting conjugate and her card family changes with it. The invariant
    // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
    expect(found).toHaveLength(40);
    expect([...new Set(found)]).toEqual(['mmwrIc1949TwoPpsv']);
  });

  it('210 cards carry the new citation — the measured count that moved', () => {
    let moved = 0;
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const r of out.recs ?? []) {
        // C13 (2026-10-30): a CHILD's card may now quote this row about her own
        // 19th birthday, declared `aboutAnotherGroup` — that is a different
        // claim and is counted (282) in its own guard, not here.
        if ((r.noteCites ?? []).some((x) => x.key === 'adultChronicOnlyReviewAt50' && !x.aboutAnotherGroup)) moved++;
      }
    }
    // Every one of them is 19y in the grid: 228 months is the only adult age
    // below 50 the grid carries, so this count is the one age's worth. If the
    // grid gains another 19-49 age this number must go UP, never down.
    //
    // It did, in this same session: 175 when FINDING C was measured against
    // the 16,008-row grid, 210 once FINDING D/E added the four-dose PCV13
    // history (which gives 19-year-olds another way to arrive here). Both
    // numbers are real; neither replaces the other.
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +20 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      // -5, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
      // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
      // counting conjugate and her card family changes with it. The invariant
      // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
      expect(moved).toBe(210 + 20 - 5);
  });

  it('the new sentence never reaches a 50+ or a paediatric card', () => {
    const wrongAges = [];
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      // C13 (2026-10-30): the child's "at 19" line quotes it deliberately, as a
      // declared cross-reference; this guard is about the row standing as the
      // patient's OWN rule, which still never happens outside 19-49.
      const carries = (out.recs ?? []).some((r) => (r.noteCites ?? []).some((x) => x.key === 'adultChronicOnlyReviewAt50' && !x.aboutAnotherGroup));
      if (!carries) continue;
      const am = c.input.ageMonths;
      if (am < ADULT_SCHED_MIN_M || am >= ROUTINE_ADULT_MIN_M) wrongAges.push(`${c.key} @${am}m`);
    }
    expect(wrongAges).toEqual([]);
  });
});
