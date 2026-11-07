/**
 * P2-1 (R9): "may be given now" over a date still in the future.
 *
 * Pax, 40, HIV. PCV13 and two PPSV23, the last one 4 years ago. The header read
 * "Not yet due — eligible Nov 5, 2027" and the note read "1 dose of PCV20 or
 * PCV21 may be given now, ≥5 years after the last pneumococcal dose". ACIP's row
 * (mm7401a1) sets the 5 years; it has no "now" in it, so the word comes off. The
 * same sentence is then true whether or not the five years have passed, and the
 * header stays the one place that says which.
 *
 * Wording only: same products, same status, same date.
 */
import { describe, it, expect } from 'vitest';
import { recommendBeforeFold as recommend } from '../recommend.js';

const TODAY = '2026-11-06';
const IC_TWO_PPSV = (lastPpsv) => ({
  today: TODAY,
  ageMonths: 480,
  riskIds: ['hiv'],
  pcvDoses: [{ product: 'PCV13', date: '2012-03-01' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2013-03-01' }, { product: 'PPSV23', date: lastPpsv }],
});
const card = (r) => r.recs.find((c) => /^Review at age 50/.test(c.doseLabel));

describe('P2-1: the note makes no claim about today', () => {
  it('Pax, 4 years since the last dose: no "now" under a future date', () => {
    const c = card(recommend(IC_TWO_PPSV('2022-11-06')));
    expect(c.dueToday).toBeFalsy();
    expect(c.earliestNextDate).toBeTruthy();
    expect(c.note.lead).not.toMatch(/\bnow\b/);
    expect(c.note.lead).toContain('may be given ≥5 years after the last pneumococcal dose');
  });

  it('6 years since the last dose: the dose is due today and the sentence still reads true', () => {
    const c = card(recommend(IC_TWO_PPSV('2020-11-06')));
    expect(c.dueToday).toBe(true);
    expect(c.note.lead).toContain('may be given ≥5 years after the last pneumococcal dose');
  });
});
