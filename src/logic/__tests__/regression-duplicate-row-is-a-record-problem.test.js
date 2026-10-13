// The same shot recorded on two rows (owner decision 2026-10-12: "copy what
// MeningoVax does" — its G7, rule and wording).
//
// Two doses of the same pneumococcal vaccine are never given on the same day.
// A date that already appears on a COUNTED row of the same stream means the row
// was typed twice — the commonest slip when a paper record is being copied in.
//
// The GRADING was already right: the second row did not count. What was wrong
// was the explanation. Reproduced before the fix, on a 5-year-old with PCV20
// recorded twice on 2024-03-01:
//
//   "Given 0 days after the previous dose — the minimum interval is 8 weeks
//    (56 days) when the earlier dose was given at 12 months of age or older."
//   "This dose does not count toward the series — given too soon after the dose
//    it is measured from. It is not repeated; the next dose in this series is
//    due on or after 2024-04-22."
//
// That sends a clinician to look at spacing, and hands them a due date, for a
// problem that exists only in the typing. Same family as S10-N2 and the
// future-dated rule: a RECORD PROBLEM, settled in `recordProblemFor` ahead of
// every vaccine rule, not inside a validator.
//
// The control tests below are the point of the whole thing in a pneumococcal
// app: PCV and PPSV23 on ONE day is ordinary co-administration, and must stay
// untouched. The two streams are walked separately, which is what makes that
// safe — but "safe by construction" is exactly the claim that deserves a test.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';

const TODAY = '2026-10-12';
const DOB = '2021-01-01';
const SAME_DAY = '2024-03-01';

function run({ pcvDoses = [], ppsv23Doses = [], ageMonths = 69, dob = DOB, riskIds = [] }) {
  return analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today: TODAY, dob, riskIds });
}
const allText = (v) => [...(v.reasons ?? []), v.detail ?? ''].join(' ');

const INTERVAL = /minimum interval/i;
const DUE_DATE = /due on or after/i;
const REPEAT = /repeat this dose only/i;

describe('one shot recorded on two rows is a record problem, not a spacing problem', () => {
  const twice = () => run({
    pcvDoses: [
      { date: SAME_DAY, product: 'PCV20' },
      { date: SAME_DAY, product: 'PCV20' },
    ],
  }).pcv;

  it('the first row still counts', () => {
    const r = twice();
    expect(r.perDose[0].status).toBe('valid');
    expect(r.effective.length).toBe(1);
  });

  it('the second row does not count, and is marked a duplicate entry', () => {
    const v = twice().perDose[1];
    expect(v.status).toBe('invalid');
    expect(v.doesNotCount).toBe(true);
    expect(v.recordProblem).toBe('duplicate');
  });

  it('says the row was typed twice, and what to do about it', () => {
    const text = allText(twice().perDose[1]);
    expect(text).toMatch(/already recorded on an earlier row/i);
    expect(text).toMatch(/entered twice/i);
    expect(text).toMatch(/correct its date|remove this row/i);
  });

  it('no longer blames the interval, and no longer hands out a due date', () => {
    // The whole finding. Before the fix both of these matched.
    const text = allText(twice().perDose[1]);
    expect(text).not.toMatch(INTERVAL);
    expect(text).not.toMatch(DUE_DATE);
    expect(twice().perDose[1].intervalRuleId ?? null).toBeNull();
  });

  it('never tells the clinician to repeat a shot the patient has already had', () => {
    expect(allText(twice().perDose[1])).not.toMatch(REPEAT);
  });

  it('applies to PPSV23 rows the same way', () => {
    const r = run({
      ppsv23Doses: [
        { date: SAME_DAY, product: 'PPSV23' },
        { date: SAME_DAY, product: 'PPSV23' },
      ],
      ageMonths: 849,
      dob: '1956-01-01',
      riskIds: ['asplenia'],
    }).ppsv23;
    expect(r.perDose[1].recordProblem).toBe('duplicate');
    expect(allText(r.perDose[1])).not.toMatch(INTERVAL);
  });
});

describe('a row that does not name a brand is still the same dose written twice', () => {
  it('a PCV20 and an unnamed product on one day is a duplicate, and says why', () => {
    const v = run({
      pcvDoses: [
        { date: SAME_DAY, product: 'PCV20' },
        { date: SAME_DAY, product: '' },
      ],
    }).pcv.perDose[1];
    expect(v.recordProblem).toBe('duplicate');
    expect(allText(v)).toMatch(/does not name a product/i);
  });

  it('does not add that sentence when both rows name the same product', () => {
    const text = allText(run({
      pcvDoses: [
        { date: SAME_DAY, product: 'PCV20' },
        { date: SAME_DAY, product: 'PCV20' },
      ],
    }).pcv.perDose[1]);
    expect(text).not.toMatch(/does not name a product/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// TWO DIFFERENT PRODUCTS ON ONE DAY — owner decision, 2026-10-12.
//
// Caught by the sweep gate, not by anyone reading the code: importing
// MeningoVax's G7 whole moved 792 of the 16,250 sweep patients and turned the
// two assertions holding S14-4C and S14-7 red. G7 is sound in MeningoVax —
// each of its streams holds ONE vaccine family, so a same-day pair can only be
// a double entry. PneumoVax's PCV stream holds five products.
//
// The owner chose BOTH answers rather than either: the existing verdict and its
// existing wording stand, and a "check the record" sentence is ADDED. Nothing
// is reclassified; the clinician keeps the clinical answer and is also pointed
// at the record.
// ─────────────────────────────────────────────────────────────────────────
describe('two DIFFERENT products on one day keep their verdict and gain a sentence', () => {
  const SAME_VISIT = /given at the same visit as the/i;
  const CHECK = /check the record/i;

  const adultPair = () => run({
    pcvDoses: [
      { date: SAME_DAY, product: 'PCV20' },
      { date: SAME_DAY, product: 'PCV21' },
    ],
    ageMonths: 849,
    dob: '1956-01-01',
  }).pcv.perDose[1];

  it('is NOT reclassified as a duplicate', () => {
    expect(adultPair().recordProblem ?? null).toBeNull();
  });

  it("keeps S14-4C's sentence word for word", () => {
    const v = adultPair();
    expect(v.extraDose).toBe(true);
    expect(allText(v)).toMatch(SAME_VISIT);
    expect(allText(v)).not.toMatch(/after the series was already complete/);
  });

  it('and gains the sentence telling the clinician to check the record', () => {
    const text = allText(adultPair());
    expect(text).toMatch(CHECK);
    expect(text).toMatch(/PCV20/);
    expect(text).toMatch(/PCV21/);
  });

  it('reaches the child case too, which S14-4C never did', () => {
    // A 5-year-old with PCV13 and PCV15 on one day completes no series, so the
    // INTERVAL rule grades it — the more misleading of the two messages, since
    // it hands out a due date for a problem in the typing. The verdict is
    // unchanged (the owner chose not to reclassify); the sentence is added.
    const v = run({
      pcvDoses: [
        { date: SAME_DAY, product: 'PCV13' },
        { date: SAME_DAY, product: 'PCV15' },
      ],
    }).pcv.perDose[1];
    expect(v.recordProblem ?? null).toBeNull();
    expect(allText(v)).toMatch(INTERVAL);
    expect(allText(v)).toMatch(CHECK);
  });

  it('says nothing extra when the two doses are on different days', () => {
    const text = allText(run({
      pcvDoses: [
        { date: '2024-03-01', product: 'PCV13' },
        { date: '2024-06-01', product: 'PCV15' },
      ],
    }).pcv.perDose[1]);
    expect(text).not.toMatch(CHECK);
  });

  it('says nothing extra about a PCV and a PPSV23 sharing a date', () => {
    // The sentence is per STREAM. Co-administering a conjugate and PPSV23 is
    // ordinary practice and must not be questioned.
    const r = run({
      pcvDoses: [{ date: SAME_DAY, product: 'PCV20' }],
      ppsv23Doses: [{ date: SAME_DAY, product: 'PPSV23' }],
      ageMonths: 849,
      dob: '1956-01-01',
      riskIds: ['asplenia'],
    });
    expect(allText(r.pcv.perDose[0])).not.toMatch(CHECK);
    expect(allText(r.ppsv23.perDose[0])).not.toMatch(CHECK);
  });
});

describe('CONTROLS — what must NOT become a duplicate', () => {
  it('a PCV and a PPSV23 on the same day are ordinary co-administration', () => {
    // The case this rule could most easily break in a pneumococcal app. Both
    // doses stand; neither is called a duplicate.
    const r = run({
      pcvDoses: [{ date: SAME_DAY, product: 'PCV15' }],
      ppsv23Doses: [{ date: '2025-06-01', product: 'PPSV23' }],
      ageMonths: 849,
      dob: '1956-01-01',
    });
    expect(r.pcv.perDose[0].recordProblem ?? null).toBeNull();
    expect(r.ppsv23.perDose[0].recordProblem ?? null).toBeNull();
  });

  it('a PCV and a PPSV23 carrying the SAME date are still both real doses', () => {
    const r = run({
      pcvDoses: [{ date: SAME_DAY, product: 'PCV20' }],
      ppsv23Doses: [{ date: SAME_DAY, product: 'PPSV23' }],
      ageMonths: 849,
      dob: '1956-01-01',
      riskIds: ['asplenia'],
    });
    expect(r.pcv.perDose[0].recordProblem ?? null).toBeNull();
    expect(r.ppsv23.perDose[0].recordProblem ?? null).toBeNull();
    expect(r.pcv.effective.length).toBe(1);
  });

  it('two doses genuinely given too close together keep the interval wording', () => {
    // W1 is not reopened. A real second dose a few days later is a TIMING
    // problem and must still read as one — that is the sentence this fix
    // removes from duplicates, so it has to be proved still present here.
    const v = run({
      pcvDoses: [
        { date: '2024-03-01', product: 'PCV13' },
        { date: '2024-03-08', product: 'PCV13' },
      ],
    }).pcv.perDose[1];
    expect(v.recordProblem ?? null).toBeNull();
    expect(allText(v)).toMatch(INTERVAL);
  });

  it('matches against rows that COUNTED, not every row walked', () => {
    // PCV7 never counts, so it never enters `kept`. A PCV20 sharing its date is
    // therefore the first real row on that date, not a duplicate of it. If this
    // ever matched against the raw input instead, a patient whose PCV7 and PCV20
    // were given at one visit would lose the dose that actually counts.
    const r = run({
      pcvDoses: [
        { date: SAME_DAY, product: 'PCV7' },
        { date: SAME_DAY, product: 'PCV20' },
      ],
    }).pcv;
    expect(r.perDose[0].status).toBe('noncounting');
    expect(r.perDose[1].recordProblem ?? null).toBeNull();
    expect(r.effective.length).toBe(1);
  });

  it('an undated row is never a duplicate of another undated row', () => {
    // Two rows with no date share no date. Counting them as duplicates would
    // silently delete a real dose from a paper record that simply has no dates.
    const r = run({
      pcvDoses: [{ product: 'PCV13' }, { product: 'PCV13' }],
    }).pcv;
    expect(r.perDose.every((v) => (v.recordProblem ?? null) === null)).toBe(true);
    expect(r.effective.length).toBe(2);
  });
});
