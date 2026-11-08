/**
 * P2-7: "PCV15 followed by PPSV23 is a complete pneumococcal series".
 *
 * The word "complete" pointed at CDC's Adult Notes, whose quote gives the
 * interval and never says complete. CDC's risk page says it, under "Adults 19
 * through 49 years old": "Their pneumococcal vaccinations are then complete."
 * That page has no 50+ section, so at 50+ the job aid keeps the claim.
 *
 * Citation only. Same dose, same status.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';

const TODAY = '2026-11-06';
const patient = (ageMonths, riskIds) => ({
  today: TODAY,
  ageMonths,
  riskIds,
  pcvDoses: [{ product: 'PCV15', date: '2024-03-01' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2025-03-15' }],
});
const card = (input) => recommend(input).recs.find((c) => c.doseLabel === 'Complete (PCV15 + PPSV23)');
const keys = (c) => (c.noteCites ?? []).map((x) => x.key);

describe('P2-7: each marker sits on the claim its document states', () => {
  it('a 40-year-old: the sequence cites the Adult Notes, "complete" cites the risk page', () => {
    const c = card(patient(480, ['diabetes']));
    expect(c.status).toBe('complete');
    expect(c.note).toBe('PCV15 followed by PPSV23 [c] is a complete pneumococcal series — no further doses needed [c].');
    // 2026-11-07: same words, the 19-49 copy (it opens Special situations; the 60-year-old's opens Routine).
    expect(keys(c)).toEqual(['adultPcv15ThenPpsv1949', 'adultPcv15PpsvComplete1949']);
  });

  it('a 60-year-old: same sentence, and "complete" cites the job aid, not the risk page', () => {
    const c = card(patient(720, []));
    expect(c.note).toBe('PCV15 followed by PPSV23 [c] is a complete pneumococcal series — no further doses needed [c].');
    expect(keys(c)).toEqual(['adultPcv15ThenPpsv', 'jobAidSeriesCompleteAt50']);
  });

  it('each quote the word "complete" leans on says it; the Adult Notes quote does not', () => {
    expect(REFS.adultPcv15PpsvComplete1949.quote).toMatch(/are then complete/);
    expect(REFS.jobAidSeriesCompleteAt50.quote).toMatch(/complete/);
    expect(REFS.adultPcv15ThenPpsv.quote).not.toMatch(/complete/);
  });

  it('the new quote is about 19-49 only', () => {
    expect(REFS.adultPcv15PpsvComplete1949.population).toEqual(['adult-19to49']);
  });
});
