// ── P2-3, grey-zone audit of 2026-11-01 (OWNER RULE, same day) ──────────
//
// "Complete should only be used if no additional doses/boosters are needed."
//
// G39: 4, HIV, four PCV15 as a baby. Her Option B card said "1 dose of PPSV23
// … then ≥5 years later give 1 dose of PCV20 or a 2nd PPSV23", and in the same
// note "Either a single dose of PCV20 or a PPSV23 completes the recommended
// series". For an immunocompromised child a PPSV23 does not complete anything.
// ACIP 2023's own words carry the qualifier the paraphrase dropped: "Either a
// single dose of PCV20 or PPSV23 using previously recommended dosing and
// schedules is recommended to complete the recommended vaccine series." 198
// immunocompromised cards on the grid. Non-IC cards are right as they were.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-11-01';
const d = (product, dates) => dates.map((date) => ({ product, date }));
const text = (r) => (typeof r.note === 'string' ? r.note : `${r.note.lead} ${r.note.detail}`);
const OLD = 'Either a single dose of PCV20 or a PPSV23 completes the recommended series';
const IC_NEW = 'ACIP recommends either a single dose of PCV20, or PPSV23 on its previously recommended schedule [c]. Only PCV20 finishes the series in one dose.';

const G39 = { dob: '2022-10-27', today: TODAY, riskIds: ['hiv'], pcvDoses: d('PCV15', ['2022-12-27', '2023-02-27', '2023-04-27', '2023-10-27']), ppsv23Doses: [] };
const DIABETES_TWIN = { ...G39, riskIds: ['diabetes'] };
const IC = new Set(['asplenia', 'immunodeficiency', 'immunosuppression', 'hiv', 'solid_organ_transplant', 'ckd_advanced']);

describe('P2-3: an immunocompromised card never says a PPSV23 completes the series', () => {
  it('G39: both options carry ACIP\'s qualifier instead', () => {
    for (const r of recommend(G39).recs) {
      expect(text(r)).not.toContain(OLD);
      expect(text(r)).toContain(IC_NEW);
      expect((text(r).match(/\[c\]/g) || []).length).toBe(r.noteCites.length);
    }
  });

  it('CONTROL: the diabetic twin keeps the sentence — for her a PPSV23 does complete it', () => {
    for (const r of recommend(DIABETES_TWIN).recs) expect(text(r)).toContain(OLD);
  });

  it('over the grid: no immunocompromised card says it, and the cards that carried it now carry the qualifier', () => {
    let old = 0; let qualified = 0;
    for (const c of buildCases()) {
      if (!c.input.riskIds?.some((x) => IC.has(x))) continue;
      let res; try { res = recommend(c.input); } catch { continue; }
      for (const r of res.recs ?? []) {
        if (text(r).includes(OLD)) old += 1;
        if (text(r).includes(IC_NEW)) qualified += 1;
      }
    }
    expect(old).toBe(0);
    expect(qualified).toBe(198);
  });
});
