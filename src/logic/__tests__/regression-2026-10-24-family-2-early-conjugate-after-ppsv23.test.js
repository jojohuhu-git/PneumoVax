// FAMILY 2 (owner, 2026-10-24) — an adult conjugate given sooner than a year
// after a PPSV23 STILL COUNTS, the series reads complete, and the card offers
// the alternative for a clinician who disagrees.
//
// The owner's patient: 70 years old, no risk factors, PPSV23 on 2025-10-11 and
// PCV15 on 2026-06-19 and 2026-07-19 — about 8 months after the PPSV23, where
// ACIP advises a year. Her ruling:
//
//   "No 8-week exception exists in this direction. ACIP allows 8 weeks only for
//    PCV15 -> PPSV23, and only in adults with an immunocompromising condition,
//    CSF leak, or cochlear implant. PPSV23 -> conjugate is >=1 year for every
//    group, including those high-risk adults. Could the card suggest [complete]
//    but also offer an alternative if treated as invalid, give PCV20/21 at
//    least 1 year after last PPSV23?"
//
// So: the dose counts, the card says it came early, AND it offers a PCV20 or
// PCV21 at >=1 year after the last PPSV23 for anyone who would rather treat the
// early dose as not counting. Both halves are asserted below — the alternative
// is the half she asked for, and a card that only said "complete" would be
// half the ruling.
//
// ⚠️ THIS REVERSES "CASE H", WHICH SHE HERSELF SET AS A CONTROL. On 2026-10-11
// she declined exactly this downgrade, and
// `regression-anchor-1-counting-doses-only.test.js` recorded a 70-year-old with
// a PPSV23 on 2018-01-01 and a PCV20 two months later as the reason: "If this
// case ever goes green, the fix has stopped being narrow and has become a
// loosening of the floor itself." Shown that case again on 2026-10-24 she
// ruled that it follows the same shape — complete, with the note and the
// alternative — because no document names ANY minimum here, so a cut-off at
// two months rather than eight would be an invented number. Case H is
// therefore asserted GREEN below, in this file, where the reversal is
// explained; its old home keeps the record of what it used to prove.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;

const run = (input) => {
  const out = recommend({ today: TODAY, ...input });
  return {
    pcv: out.perDose.pcv,
    recs: out.recs,
    text: out.recs.map((r) => {
      const n = r.note;
      const note = typeof n === 'string' ? n : `${n?.lead ?? ''} ${n?.detail ?? ''}`;
      return `${r.status} — ${r.doseLabel} — ${note}`;
    }).join(' || '),
  };
};

describe('FAMILY 2 — the owner\'s patient: PCV15 eight months after PPSV23', () => {
  const HERS = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [
      { product: 'PCV15', date: '2026-06-19' },
      { product: 'PCV15', date: '2026-07-19' },
    ],
    ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
  };

  it('counts the PCV15 — no document names a minimum in this direction', () => {
    const v = run(HERS);
    expect(v.pcv[0].status).toBe('valid');
    expect(v.pcv[0].earlyAdvisory).toBe(true);
    expect(v.pcv[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
    expect(v.pcv[0].earliestValidDate).toBeUndefined();
  });

  it('reads Complete (PCV15 + PPSV23), with nothing due', () => {
    const v = run(HERS);
    expect(v.recs.every((r) => r.status === 'complete')).toBe(true);
    expect(v.text).toMatch(/Complete \(PCV15 \+ PPSV23\)/);
  });

  it('says on the card that the dose came earlier than ACIP advises', () => {
    expect(run(HERS).text).toMatch(/earlier than/i);
  });

  it('offers the alternative: PCV20 or PCV21 at least a year after the PPSV23', () => {
    const v = run(HERS);
    expect(v.text).toMatch(/PCV20 or PCV21/);
    // 2025-10-11 + 1 year = 2026-10-11, which is 13 days before TODAY, so the
    // card must say it can be given NOW rather than printing a past due date
    // as though the patient were waiting for it.
    expect(v.text).toMatch(/now/i);
  });
});

describe('FAMILY 2 — CASE H, reversed on 2026-10-24', () => {
  // The owner's own 2026-10-11 control: a PPSV23 that counted, then a PCV20
  // two months later. Nothing else is wrong with this history.
  const CASE_H = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [{ product: 'PCV20', date: '2018-03-01' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2018-01-01' }],
  };

  it('counts the PCV20 at a two-month gap — the same rule as at eight months', () => {
    const v = run(CASE_H);
    expect(v.pcv[0].status).toBe('valid');
    expect(v.pcv[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
  });

  it('reads Complete, and no longer shows a PCV as due', () => {
    const v = run(CASE_H);
    expect(v.text).toMatch(/Complete \(history includes PCV20\)/);
    expect(v.text).not.toMatch(/≥1 year after PPSV23/);
  });
});

describe('FAMILY 2 — what it must NOT loosen', () => {
  it('leaves the PPSV23-to-PPSV23 five-year floor biting', () => {
    // Her words the same day: "PPSV23 to PPSV23 spacing should be 5 years."
    const v = recommend({
      today: TODAY, ageMonths: Y(70), riskIds: [],
      pcvDoses: [],
      ppsv23Doses: [
        { product: 'PPSV23', date: '2024-01-01' },
        { product: 'PPSV23', date: '2026-01-01' },
      ],
    });
    expect(v.perDose.ppsv23[1].status).toBe('invalid');
    expect(v.perDose.ppsv23[1].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PPSV23');
  });

  it('does not put the alternative on a Ruling F card', () => {
    // Family 1's patient: she ruled that NOTHING further is due once an adult
    // has had PCV20, so her card gets the completion sentence and no offer of
    // another conjugate. The alternative is keyed on the RULE that produced
    // the note, not on "a dose was early" — which is the only thing keeping
    // these two rulings apart on the very same card.
    const v = run({
      ageMonths: Y(70), riskIds: [],
      pcvDoses: [
        { product: 'PCV13', date: '2016-10-13' },
        { product: 'PCV20', date: '2025-10-10' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-13' }],
    });
    expect(v.text).toMatch(/Complete \(history includes PCV20\)/);
    expect(v.text).not.toMatch(/if you treat/i);
  });
});

describe('FAMILY 2 — the row itself', () => {
  const row = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PCV-AFTER-PPSV23');

  it('is a recommendation with no grace, crediting CDC', () => {
    expect(row.enforcement).toBe('recommendation');
    expect(row.grace).toBe(false);
    expect(row.authority).toBe('CDC');
  });

  it('records the 2026-10-24 ruling and the case-H reversal', () => {
    expect(row.source).toMatch(/2026-10-24/);
    expect(row.source).toMatch(/case H/i);
  });

  it('returns a string message, as a recommendation must', () => {
    const msg = row.message(
      { doseDate: '2026-06-19' },
      { date: '2025-10-11' },
      { words: '1 year', adj: '1-year' },
    );
    expect(typeof msg).toBe('string');
    expect(msg).toMatch(/still counts/);
  });
});
