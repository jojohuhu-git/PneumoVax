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

  it('the 50+ sentence is kept, on the half of the note it actually supports', () => {
    const card = reviewCard(chronicOnly1949());
    // The detail half states what happens at 50; that is what adultBothNotAt65
    // says. Two [c] markers, two cites, in order.
    expect(card.noteCites.map((c) => c.key)).toEqual([
      'adultChronicOnlyReviewAt50',
      'adultBothNotAt65',
    ]);
    expect(card.note.lead.match(/\[c\]/g) ?? []).toHaveLength(1);
    expect(card.note.detail.match(/\[c\]/g) ?? []).toHaveLength(1);
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
    expect(cases).toHaveLength(16008);
    expect(CORPUS_TODAY).toBe(TODAY);
  });

  it('not one review-at-50 card anywhere quotes the give-a-dose sentence first', () => {
    const offenders = [];
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const r of out.recs ?? []) {
        if (!/review at age 50/i.test(r.doseLabel ?? '')) continue;
        if (r.noteCites?.[0]?.key !== 'adultChronicOnlyReviewAt50') {
          offenders.push(`${c.key} → ${r.noteCites?.[0]?.key}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('175 cards carry the new citation — the measured count that moved', () => {
    let moved = 0;
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const r of out.recs ?? []) {
        if ((r.noteCites ?? []).some((x) => x.key === 'adultChronicOnlyReviewAt50')) moved++;
      }
    }
    // Every one of them is 19y in the grid: 228 months is the only adult age
    // below 50 the grid carries, so this count is the one age's worth. If the
    // grid gains another 19-49 age this number must go UP, never down.
    expect(moved).toBe(175);
  });

  it('the new sentence never reaches a 50+ or a paediatric card', () => {
    const wrongAges = [];
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      const carries = (out.recs ?? []).some((r) => (r.noteCites ?? []).some((x) => x.key === 'adultChronicOnlyReviewAt50'));
      if (!carries) continue;
      const am = c.input.ageMonths;
      if (am < ADULT_SCHED_MIN_M || am >= ROUTINE_ADULT_MIN_M) wrongAges.push(`${c.key} @${am}m`);
    }
    expect(wrongAges).toEqual([]);
  });
});
