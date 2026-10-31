// ── P2 (2026-10-30): a child's second PPSV23 given inside five years ────────
//
// TWO OWNER RULINGS, one per risk class, and they differ on purpose.
//
// IMMUNOCOMPROMISED (her row of 2026-10-29): a 2nd PPSV23 given inside 5 years
// should COUNT, and the child should never be offered a THIRD. CDC's
// immunocompromising list is the only one that orders a second PPSV23 at all —
// "If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years
// after dose 1 PPSV23" (child-adolescent-notes.html, read live 2026-10-30) —
// and it states the interval and stops there. "A dose given inside it does not
// count" is a further claim no document makes. This is the adult Ruling F
// relabelling run again: `ADULT-PPSV23-AFTER-PPSV23` was relaxed the same way
// on 2026-10-25, with the note "Counted; never give a third."
//
// NOT IMMUNOCOMPROMISED (her ruling of 2026-10-30, on Ava below): CDC's other
// at-risk list — cochlear implant, CSF leak, chronic heart/lung/liver/kidney
// disease, diabetes — gives ONE PPSV23 and never mentions a second (read live
// the same day). So Ava's second dose was never needed, early or on time. Asked
// with Ava's own card, she chose "Extra dose": not needed, not harmful, not
// counted, nothing to repeat — her own words of 2026-10-23 for a baby's extra
// 5.1-month PCV dose.
//
// WHAT THE APP SAID BEFORE: both children's second PPSV23 was thrown out as
// "too soon", and the note under it read "the next dose in this series can be
// given from Nov 15, 2027 at the earliest". For Leo the card then offered PCV20
// or a "2nd PPSV23" — his THIRD. For Ava the card said "complete" while the
// note under the dose pointed at another one.
//
// ⚠ THE GRID CANNOT REACH THESE CHILDREN — 0 of 17,016 patients have two
// PPSV23 doses inside five years. Every case here is hand-built.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';

const PCV13_AS_A_BABY = ['2016-03-01', '2016-05-01', '2016-07-01', '2017-01-05']
  .map((date) => ({ product: 'PCV13', date }));

function child(riskIds, ppsvDates) {
  return {
    dob: '2016-01-01', ageMonths: 129, today: '2026-10-30', riskIds,
    pcvDoses: PCV13_AS_A_BABY,
    ppsv23Doses: ppsvDates.map((date) => ({ product: 'PPSV23', date })),
  };
}

// Leo: 10 years old, no spleen. PPSV23 at 2, a second at 6y10m — two months
// before the five years were up.
const LEO = child(['asplenia'], ['2018-01-15', '2022-11-15']);
const LEO_ON_TIME = child(['asplenia'], ['2018-01-15', '2023-02-01']);
// Ava: the same history exactly, with a cochlear implant instead.
const AVA = child(['cochlear_implant'], ['2018-01-15', '2022-11-15']);
const AVA_ONE_DOSE = child(['cochlear_implant'], ['2018-01-15']);

// THREE CARDS THAT NEVER ASKED "has the second PPSV23 been given?" Before P2
// an immunocompromised child under ~7 could not hold two counting PPSV23
// doses (the early one was thrown out, and on time takes 5 years), so the
// cards for her age never checked. Once the early dose counts, each of these
// children was offered PCV20 or a "2nd PPSV23" — her THIRD.
const d = (product, dates) => dates.map((date) => ({ product, date }));
// Maya, 4, no spleen: full infant PCV13 series, PPSV23 at 24 and 29 months.
const MAYA_AGE_4 = {
  dob: '2022-01-01', ageMonths: 57, today: '2026-10-30', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2022-03-01', '2022-05-01', '2022-07-01', '2023-01-05']),
  ppsv23Doses: d('PPSV23', ['2024-01-15', '2024-06-01']),
};
// Noah, 4, no spleen: no infant doses; catch-up PCV13 x2 after age 2, then
// PPSV23 at 29 and 32 months. The 24-71-month catch-up card, which was written
// "(non-immunocompromising)" because only a non-IC child could reach it.
const NOAH_AGE_4 = {
  dob: '2022-01-01', ageMonths: 57, today: '2026-10-30', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2024-02-01', '2024-04-01']),
  ppsv23Doses: d('PPSV23', ['2024-06-01', '2024-09-01']),
};
// Zoe, 14, no spleen: PCV13 at 7, PPSV23 at 7y3m and an early second at 10y3m.
const ZOE_EARLY = {
  dob: '2012-01-01', ageMonths: 177, today: '2026-10-30', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2019-02-01']),
  ppsv23Doses: d('PPSV23', ['2019-04-01', '2022-04-01']),
};
// ⚠ ZOE ON TIME WAS ALREADY WRONG ON MAIN, before P2: second PPSV23 at 12y3m,
// five years and four days after the first, both counting — and the card
// offered PCV20 or a "2nd PPSV23". The grid cannot build her.
const ZOE_ON_TIME = { ...ZOE_EARLY, ppsv23Doses: d('PPSV23', ['2019-04-01', '2024-04-05']) };

// Sofia, 18, no spleen: BOTH PPSV23 doses first (8 and 13), then PCV13 at 17.
// CDC's row gives its dose AFTER the PCV13, so it is not finished — but the
// PPSV23 option would be her third. OWNER RULING 2026-10-30: PCV20 only.
const SOFIA = {
  dob: '2008-06-01', ageMonths: 220, today: '2026-10-30', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2026-04-30']),
  ppsv23Doses: d('PPSV23', ['2016-06-15', '2021-07-01']),
};

// A second PPSV23 two days short of five years: inside CDC's 4-day grace, so
// on time — no note, as on main (OWNER DECISION 2026-10-30, keep the grace).
const LEO_TWO_DAYS_SHORT = child(['asplenia'], ['2018-01-15', '2023-01-13']);
const AVA_TWO_DAYS_SHORT = child(['cochlear_implant'], ['2018-01-15', '2023-01-13']);

const EARLY_SENTENCE = ' The second PPSV23 came less than 5 years after the first; it is counted, and no third PPSV23 is given.';

const secondPpsv = (p) => analyzeBoth(p).ppsv23.perDose[1];
const recsOf = (p) => recommend(p).recs;
const everyWord = (p) => JSON.stringify(recommend(p));

describe('Leo — immunocompromised: the early second PPSV23 counts', () => {
  it('the dose is valid, carries one note, and owes no repeat', () => {
    const d = secondPpsv(LEO);
    expect(d.status).toBe('valid');
    expect(d.effectiveDoseNum).toBe(2);
    expect(d.earlyAdvisory).toBe(true);
    expect(d.intervalRuleId).toBe('CHILD-PPSV23-AFTER-PPSV23');
    expect(d.repeatDueDate).toBeUndefined();
    expect(d.earliestValidDate).toBeUndefined();
    expect(d.reasons).toEqual([
      'Given 4 years 10 months after the previous PPSV23 dose of Jan 15, 2018 — shorter than the 5 years advised between PPSV23 doses. **Counted; never give a third.**',
    ]);
    expect(d.whys).toEqual([
      "CDC's child schedule gives an immunocompromised child a second PPSV23 at least 5 years after the first, and never a third. The dose counts because setting it aside would only invite a third PPSV23.",
    ]);
  });

  it('his card reads complete and offers nothing — no third PPSV23, no PCV20', () => {
    const recs = recsOf(LEO);
    expect(recs.map((r) => [r.vaccine, r.status])).toEqual([['PCV', 'complete']]);
    expect(recs[0].doseLabel).toBe('PCV series complete (PCV before age 6 + PPSV23)');
  });

  it('and the card says the second dose came early and is counted', () => {
    expect(recsOf(LEO)[0].note.detail).toContain(
      'The second PPSV23 came less than 5 years after the first; it is counted, and no third PPSV23 is given.',
    );
  });

  it('control: on time, the same card without that sentence', () => {
    const d = secondPpsv(LEO_ON_TIME);
    expect(d.status).toBe('valid');
    expect(d.earlyAdvisory).toBeUndefined();
    const recs = recsOf(LEO_ON_TIME);
    expect(recs.map((r) => [r.vaccine, r.status])).toEqual([['PCV', 'complete']]);
    expect(recs[0].note.detail).not.toContain('came less than');
    // Everything else on the card is the same words as Leo's.
    expect(recsOf(LEO)[0].note.detail.replace(
      ' The second PPSV23 came less than 5 years after the first; it is counted, and no third PPSV23 is given.', '',
    )).toBe(recs[0].note.detail);
  });
});

describe('Ava — not immunocompromised: the second PPSV23 is an extra dose', () => {
  it('the note under it is the extra-dose sentence and nothing else', () => {
    const d = secondPpsv(AVA);
    expect(d.status).toBe('valid');
    expect(d.extraDose).toBe(true);
    expect(d.effectiveDoseNum).toBeNull();
    expect(d.earlyAdvisory).toBeUndefined();
    expect(d.repeatDueDate).toBeUndefined();
    expect(d.earliestValidDate).toBeUndefined();
    expect(d.whys ?? []).toEqual([]);
    expect(d.reasons).toEqual([
      // Her preview said "Ava was already complete after her first PPSV23"; the
      // shipped sentence states CDC's reason instead, because "complete" is not
      // always true (a 2-5-year-old's conjugate series can still be open) and
      // "one PPSV23" is false for a HEALTHY child, who gets none. Same four
      // points she chose: not needed, not harmful, not counted, nothing to repeat.
      'Not needed: CDC gives a second PPSV23 only to a child with an immunocompromising condition; the first was given on Jan 15, 2018. This dose isn’t harmful, it isn’t counted, and nothing needs to be repeated.',
    ]);
  });

  it('nothing anywhere on her screen points to another dose', () => {
    const all = everyWord(AVA);
    expect(all).not.toContain('next dose in this series');
    expect(all).not.toContain('Nov 15, 2027');
    expect(all).not.toContain('2027-11-15');
  });

  it('her card is word-for-word the card of a child with one PPSV23', () => {
    expect(recsOf(AVA)).toEqual(recsOf(AVA_ONE_DOSE));
  });
});

describe('no immunocompromised child with two counted PPSV23 doses is offered a third', () => {
  for (const [name, p] of [['Maya', MAYA_AGE_4], ['Noah', NOAH_AGE_4], ['Zoe early', ZOE_EARLY], ['Zoe on time', ZOE_ON_TIME]]) {
    it(`${name}: one card, complete, no PPSV23 or PCV offered`, () => {
      expect(analyzeBoth(p).ppsv23.perDose.map((x) => x.effectiveDoseNum)).toEqual([1, 2]);
      const recs = recsOf(p);
      expect(recs.map((r) => [r.vaccine, r.status])).toEqual([['PCV', 'complete']]);
      expect(JSON.stringify(recs)).not.toContain('non-immunocompromising');
    });
  }

  it('Maya — the completed-series card, with the early-dose sentence', () => {
    const card = recsOf(MAYA_AGE_4)[0];
    expect(card.doseLabel).toBe('Complete (PCV series + 2 PPSV23)');
    expect(card.note).toBe(
      "At-risk immunocompromised child who completed the PCV series and has received both PPSV23 doses — complete. CDC's row for an immunocompromised child this age gives a PCV20 or a second PPSV23 at least 5 years after the first PPSV23, and the second PPSV23 has been given [c]." + EARLY_SENTENCE,
    );
    // Age 2-5: CDC's IC row printed under "Age 2-5 years", not the 6-18 one.
    expect(card.noteCites.map((c) => c.key)).toEqual(['pedsIcPcv20orPpsv23']);
  });

  it('Noah — the catch-up card names him immunocompromised and drops ACIP\'s single-dose line', () => {
    const card = recsOf(NOAH_AGE_4)[0];
    expect(card.doseLabel).toBe('PCV complete (at-risk catch-up done)');
    expect(card.note).toBe(
      "At-risk immunocompromised child 24–71 months who has received the age-appropriate at-risk PCV catch-up dose(s) at ≥24 months and both PPSV23 doses — complete. CDC's row for an immunocompromised child this age gives a PCV20 or a second PPSV23 at least 5 years after the first PPSV23, and the second PPSV23 has been given [c]." + EARLY_SENTENCE,
    );
    expect(card.noteCites.map((c) => c.key)).toEqual(['pedsIcPcv20orPpsv23']);
  });

  it('Zoe — the at/after-6 card cites the row that ordered her second dose', () => {
    const early = recsOf(ZOE_EARLY)[0];
    const onTime = recsOf(ZOE_ON_TIME)[0];
    expect(early.doseLabel).toBe('Complete (PCV13 + 2 PPSV23 at/after age 6)');
    expect(onTime.note).toBe(
      "Immunocompromising at-risk child with PCV13 at/after age 6 who has received both PPSV23 doses — complete. CDC's row for this history gives a PCV20 or a second PPSV23 at least 5 years after the first PPSV23, and the second PPSV23 has been given [c].",
    );
    expect(early.note).toBe(onTime.note + EARLY_SENTENCE);
    expect(early.noteCites.map((c) => c.key)).toEqual(['pedsIcPcv13AndPpsvAt6']);
  });
});

describe('Sofia — PPSV23 twice, THEN the conjugate: PCV20 only, never a third PPSV23', () => {
  it('one card, PCV20, due today, and it says why there is no PPSV23 option', () => {
    const recs = recsOf(SOFIA);
    expect(recs.map((r) => [r.vaccine, r.status, r.doseLabel])).toEqual([
      ['PCV', 'risk-based', '1 dose PCV20 (immunocompromising)'],
    ]);
    expect(recs[0].dueToday).toBe(true);
    expect(recs[0].note.lead).toBe(
      'Give 1 dose of PCV20 ≥5 years after the first PPSV23 [c]. Two PPSV23 doses have already been given, so a PPSV23 is not offered — no third PPSV23 is given.',
    );
    expect(recs[0].note.detail).not.toContain('whichever product');
  });

  it('control: Zoe had the PCV13 FIRST, so the same two PPSV23 doses finish the row', () => {
    expect(recsOf(ZOE_ON_TIME).map((r) => r.status)).toEqual(['complete']);
  });
});

describe("CDC's 4-day grace still decides what is on time", () => {
  it('Leo, two days short: counted, no note, exactly as on main', () => {
    const dz = secondPpsv(LEO_TWO_DAYS_SHORT);
    expect(dz.status).toBe('valid');
    expect(dz.effectiveDoseNum).toBe(2);
    expect(dz.earlyAdvisory).toBeUndefined();
    expect(dz.reasons ?? []).toEqual([]);
  });

  // ⚠ REVERSED THE SAME DAY (OWNER RULING 2026-10-30, "Yes, extra dose too"):
  // a non-IC child's on-time second PPSV23 is an extra dose as well, so the
  // grace no longer decides HER label — only the reason it gives. Kept,
  // renamed, as the record. Guard: regression-2026-10-30-on-time-second-ppsv23-is-extra.
  it('Ava, two days short: on time, and now an extra dose all the same', () => {
    const dz = secondPpsv(AVA_TWO_DAYS_SHORT);
    expect(dz.status).toBe('valid');
    expect(dz.extraDose).toBe(true);
    expect(dz.effectiveDoseNum).toBeNull();
    expect(dz.earlyAdvisory).toBeUndefined();
  });
});

describe('the two cases P2 does not cover keep their own answers', () => {
  // The suite's sickle-cell patient (late-and-ambiguous-window), with her
  // PCV13 moved to age 7: PPSV23 at 2, PCV13 at 7, PPSV23 at 9 and 11.
  const SICKLE_CELL = {
    ageMonths: 225, today: '2026-07-09', riskIds: ['asplenia'],
    pcvDoses: d('PCV13', ['2014-11-02']),
    ppsv23Doses: d('PPSV23', ['2009-11-02', '2017-05-18', '2019-05-16']),
  };

  it('a THIRD PPSV23 for an IC child is an extra dose, never "counted"', () => {
    const third = analyzeBoth(SICKLE_CELL).ppsv23.perDose[2];
    expect(third.extraDose).toBe(true);
    expect(third.effectiveDoseNum).toBeNull();
    expect(third.reasons).toEqual([
      'Not needed: two PPSV23 doses have already been given (Nov 2, 2009 and May 18, 2017), and CDC never gives a third. This dose isn’t harmful, it isn’t counted, and nothing needs to be repeated.',
    ]);
  });

  it('and with one PPSV23 before the conjugate, she keeps the PCV20 alone', () => {
    const recs = recsOf(SICKLE_CELL);
    expect(recs.map((r) => [r.vaccine, r.status])).toEqual([['PCV', 'risk-based']]);
    expect(recs[0].brands).toEqual(['PCV20 (Prevnar 20)']);
  });

  // RULING D: a PPSV23 given after a PPSV23 that was REJECTED is a repeat,
  // spaced from the dose given — not P2's "second dose".
  //
  // ⚠ REVERSED THE SAME DAY (OWNER RULING 2026-10-30, on Noah). When P2
  // shipped, this child's repeat was thrown out at FIVE years, as a second
  // PPSV23. But no PPSV23 had counted, so the repeat is her FIRST: it counts
  // once it is 8 weeks after the rejected dose. Kept, renamed, as the record
  // of the reversal. Guard: regression-2026-10-30-repeat-of-a-rejected-first-ppsv23.
  const REPEAT_OF_A_REJECTED_PPSV23 = child(['asplenia'], ['2018-01-29', '2019-02-01']);
  REPEAT_OF_A_REJECTED_PPSV23.pcvDoses = d('PCV13', ['2016-03-01', '2016-05-01', '2016-07-01', '2018-01-01']);

  it('a repeat of a rejected FIRST PPSV23 is not P2 — and it now counts as the first', () => {
    const [first, second] = analyzeBoth(REPEAT_OF_A_REJECTED_PPSV23).ppsv23.perDose;
    expect(first.status).toBe('invalid');
    expect(first.intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
    expect(second.status).toBe('valid');
    expect(second.effectiveDoseNum).toBe(1);
    expect(JSON.stringify(second)).not.toContain('never give a third');
  });
});
