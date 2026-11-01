// ── §H-PPSVLAST: an adult with PPSV23 only waits a year from the LAST PPSV23
//    (OWNER RULING 2026-10-31, on "Ruth, 71") ─────────────────────────────
//
// Ruth, 71, COPD: PPSV23 at 60 and again at 70 (six months ago), never a PCV.
// The card counted the year from her FIRST PPSV23 and said "due today". CDC
// Adult Schedule Notes (read live 2026-10-31): "Previously received only
// PPSV23: 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21 at least 1 year after
// the last PPSV23 dose." The note under a PCV given too early already measured
// from the last dose, so the card and the note disagreed for the same woman.
// The adult twin of Hana's fix for children (2026-10-26). Owner chose "Count
// from last".

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));

const RUTH = {
  dob: '1955-07-31', today: '2026-10-31', riskIds: ['chronic_lung'],
  pcvDoses: [], ppsv23Doses: d('PPSV23', ['2016-03-01', '2026-04-30']),
};
const card = (p) => recommend(p).recs[0];

describe('Ruth, the patient she was shown', () => {
  it('is not due today: her PCV falls due a year after her 30 Apr 2026 PPSV23', () => {
    const r = card(RUTH);
    expect(r.dueToday).toBe(false);
    expect(r.earliestNextDate).toBe('2027-04-30');
  });

  it('does not depend on the order the doses were typed in', () => {
    expect(card({ ...RUTH, ppsv23Doses: [...RUTH.ppsv23Doses].reverse() }).earliestNextDate).toBe('2027-04-30');
  });

  it('the card says "the last PPSV23 dose" when there are two, and keeps its wording for one', () => {
    expect(card(RUTH).note.lead).toContain('after the last PPSV23 dose');
    expect(card({ ...RUTH, ppsv23Doses: d('PPSV23', ['2026-04-30']) }).note.lead).toContain('≥1 year after the PPSV23 dose');
  });

  it('a 19-49 adult with a risk condition reads the same way (CDC prints the row in both blocks)', () => {
    const young = { ...RUTH, dob: '1986-07-31', riskIds: ['diabetes'], ppsv23Doses: d('PPSV23', ['2016-03-01', '2026-04-30']) };
    expect(card(young).earliestNextDate).toBe('2027-04-30');
  });
});

describe('what does not move', () => {
  it('with both doses more than a year ago, she is due today', () => {
    expect(card({ ...RUTH, ppsv23Doses: d('PPSV23', ['2016-03-01', '2021-08-01']) }).dueToday).toBe(true);
  });

  it('the products are unchanged: PCV15, PCV20 or PCV21', () => {
    expect(card(RUTH).doseLabel).toBe('PCV (PCV15, PCV20, or PCV21) ≥1 year after PPSV23');
  });
});
