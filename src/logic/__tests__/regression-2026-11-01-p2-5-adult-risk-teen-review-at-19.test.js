// ── P2-5, grey-zone audit of 2026-11-01 (owner: "agree with fixing") ────
//
// G59: 17, smokes, four PCV13 as a baby. Smoking is an adult pneumococcal risk
// factor that CDC's child schedule does not list, so her card is the healthy
// 5-18 one — rightly — and `riskAgeNote` says the tick is not acted on at her
// age. But the card ended "Re-evaluate at age 50", and at 19 the adult
// schedule gives her a dose. The next look is 19.
//
// Same mechanism as §B-AT19: the patient is run forward to 19 and the line is
// given only when the adult card there really asks for a dose. A teen whose
// adult card at 19 says nothing is due keeps the age-50 line.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-01';
const d = (product, dates) => dates.map((date) => ({ product, date }));
const card = (p) => recommend({ today: TODAY, ...p }).recs[0];
const detail = (r) => r.note.detail;
const keys = (r) => r.noteCites.map((c) => c.key);
const AT50 = 'Re-evaluate at age 50';

const G59 = { dob: '2009-10-27', riskIds: ['smoking'], pcvDoses: d('PCV13', ['2009-12-27', '2010-02-27', '2010-04-27', '2010-10-27']), ppsv23Doses: [] };
const G58 = { dob: '2010-10-27', riskIds: ['alcoholism'], pcvDoses: [], ppsv23Doses: [] };

describe('P2-5: a teen with an adult-only risk is told to look again at 19', () => {
  it('G59 (smoking)', () => {
    const r = card(G59);
    expect(r.doseLabel).toBe('Not indicated (healthy 5–18y)');
    expect(detail(r)).not.toContain(AT50);
    expect(detail(r)).toContain('Re-evaluate at age 19, when the adult schedule counts cigarette smoking as a risk condition and recommends a dose [c].');
    expect(keys(r).at(-1)).toBe('cdcAdultRiskFactorList');
    expect(keys(r)).not.toContain('adultRoutine50');
    expect((`${r.note.lead} ${detail(r)}`.match(/\[c\]/g) || []).length).toBe(r.noteCites.length);
  });

  it('G58 (alcohol use disorder)', () => {
    expect(detail(card(G58))).toContain('counts alcohol use disorder as a risk condition');
  });

  it('the line is true: the same teen at 19 is offered a dose', () => {
    const at19 = recommend({ ...G59, today: '2028-10-27' }).recs[0];
    expect(['risk-based', 'due']).toContain(at19.status);
  });

  it('CONTROL: a healthy 16-year-old with no tick keeps the age-50 line', () => {
    expect(detail(card({ ...G58, riskIds: [] }))).toContain(AT50);
  });

  it('CONTROL: a smoker whose adult card at 19 says complete keeps the age-50 line', () => {
    const r = card({ ...G59, pcvDoses: d('PCV20', ['2009-12-27', '2010-02-27', '2010-04-27', '2010-10-27']) });
    expect(detail(r)).toContain(AT50);
  });
});
