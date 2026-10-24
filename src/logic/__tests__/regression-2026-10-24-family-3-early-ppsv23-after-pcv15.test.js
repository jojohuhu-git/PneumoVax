// FAMILY 3 (owner, 2026-10-24) — an adult PPSV23 given sooner than a year
// after a PCV15, in a patient who does NOT qualify for the 8-week option,
// STILL COUNTS; the series reads complete and the card offers the alternative.
//
// Her three patients, all with PCV15 on 2026-07-19 and PPSV23 on 2026-10-11
// (about twelve weeks): a 50-year-old with no risk factors, a 50-year-old with
// chronic heart disease, and a 30-year-old with chronic heart disease. None of
// them has an immunocompromising condition, a cochlear implant or a CSF leak,
// so the 8-week option is not theirs and ACIP's advice for them is a year.
//
// She first said the series was complete, then corrected herself to say the
// dose did not count and a repeat should be spaced from it. Asked to choose,
// she answered:
//
//   "These are niche cases since ACIP still has no explicit guidance for this
//    exact scenario, so either path rests on inference from the guidelines.
//    Either 1 or series is complete could be considered"
//
// and then settled it in the same shape as family 2: COMPLETE, with a note
// that the dose came early, PLUS the alternative — "if you treat that dose as
// not counting, give PCV20 or PCV21 on or after [last PPSV23 + 1 year]".
// For these patients the PPSV23 is 2026-10-11, so that date is 2027-10-11 —
// a FUTURE date, which is what makes this family the mirror of family 2 and
// worth asserting separately: the card must print the date, not "now".
//
// ⚠️ ORDERING. Turning this row into a recommendation would have let a second
// PPSV23 given too soon escape `ADULT-PPSV23-AFTER-PPSV23`, the five-year
// floor, because `evaluateDoseInterval` returns on the first unmet row of
// EITHER kind and the PCV15 row came first. The owner reaffirmed that floor
// the same day — "PPSV23 to PPSV23 spacing should be 5 years" — so the floor
// is ordered ahead of this row. Asserted below.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;

const run = (riskIds, ageMonths) => {
  const out = recommend({
    today: TODAY, ageMonths, riskIds,
    pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
  });
  return {
    ppsv: out.perDose.ppsv23,
    recs: out.recs,
    text: out.recs.map((r) => {
      const n = r.note;
      const note = typeof n === 'string' ? n : `${n?.lead ?? ''} ${n?.detail ?? ''}`;
      return `${r.status} — ${r.doseLabel} — ${note}`;
    }).join(' || '),
  };
};

const HER_THREE = [
  ['50, no risk factors', [], Y(50)],
  ['50, chronic heart disease', ['chronic_heart'], Y(50)],
  ['30, chronic heart disease', ['chronic_heart'], Y(30)],
];

describe('FAMILY 3 — all three of the owner\'s patients', () => {
  for (const [who, riskIds, am] of HER_THREE) {
    it(`${who}: the PPSV23 counts and the series reads complete`, () => {
      const v = run(riskIds, am);
      expect(v.ppsv[0].status).toBe('valid');
      expect(v.ppsv[0].earlyAdvisory).toBe(true);
      expect(v.ppsv[0].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15');
      expect(v.ppsv[0].earliestValidDate).toBeUndefined();
      expect(v.text).toMatch(/Complete \(PCV15 \+ PPSV23\)/);
    });

    it(`${who}: offers the alternative at a FUTURE date, not "now"`, () => {
      const v = run(riskIds, am);
      // PPSV23 2026-10-11 + 1 year = 2027-10-11, which is ahead of TODAY. The
      // mirror of family 2, whose date had already passed.
      expect(v.text).toMatch(/2027-10-11/);
      expect(v.text).toMatch(/PCV20 or PCV21/);
      expect(v.text).not.toMatch(/may be given now/);
    });
  }
});

describe('FAMILY 3 — the control that keeps it narrow', () => {
  it('an immunocompromised adult at the same dates was ALREADY complete', () => {
    // The previous session's control: the 8-week option is hers, twelve weeks
    // clears it, and nothing about her card changes. If this ever starts
    // showing the alternative, the change has stopped being about the
    // patients ACIP gives a year.
    const out = recommend({
      today: TODAY, ageMonths: Y(30), riskIds: ['hiv'],
      pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    });
    expect(out.perDose.ppsv23[0].status).toBe('valid');
    expect(out.perDose.ppsv23[0].earlyAdvisory).toBeFalsy();
    const note = out.recs.map((r) => (typeof r.note === 'string'
      ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`)).join(' ');
    expect(note).not.toMatch(/if you prefer to treat it as not counting/i);
  });

  it('a PPSV23 under 8 weeks after PCV15 is STILL rejected for that patient', () => {
    // The 8-week floor for an immunocompromising condition is untouched.
    const out = recommend({
      today: TODAY, ageMonths: Y(30), riskIds: ['hiv'],
      pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-08-19' }],
    });
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(out.perDose.ppsv23[0].intervalRuleId)
      .toBe('ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM');
  });

  it('a second PPSV23 inside five years is STILL rejected', () => {
    // ⚠️ THE ORDERING HAZARD. This second PPSV23 misses BOTH the year after
    // the PCV15 and the five years after the first PPSV23. The five-year rule
    // is still a floor and must be the one that speaks, or a recommendation
    // placed ahead of it would wave the dose through.
    const out = recommend({
      today: TODAY, ageMonths: Y(70), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-01-01' }],
      ppsv23Doses: [
        { product: 'PPSV23', date: '2024-01-01' },
        { product: 'PPSV23', date: '2026-03-01' },
      ],
    });
    expect(out.perDose.ppsv23[1].status).toBe('invalid');
    expect(out.perDose.ppsv23[1].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PPSV23');
  });

  it('orders the five-year PPSV23 floor BEFORE the PCV15 recommendation', () => {
    const ids = DOSE_INTERVAL_RULES.map((r) => r.id);
    expect(ids.indexOf('ADULT-PPSV23-AFTER-PPSV23'))
      .toBeLessThan(ids.indexOf('ADULT-PPSV23-AFTER-PCV15'));
  });
});

describe('FAMILY 3 — the row itself', () => {
  const row = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PPSV23-AFTER-PCV15');

  it('is a recommendation with no grace, crediting CDC', () => {
    expect(row.enforcement).toBe('recommendation');
    expect(row.grace).toBe(false);
    expect(row.authority).toBe('CDC');
  });

  it('records the 2026-10-24 ruling', () => {
    expect(row.source).toMatch(/2026-10-24/);
  });

  it('returns a string message, as a recommendation must', () => {
    const msg = row.message(
      { doseDate: '2026-10-11' },
      { date: '2026-07-19' },
      { words: '1 year', adj: '1-year' },
    );
    expect(typeof msg).toBe('string');
    expect(msg).toMatch(/still counts/);
  });
});
