// ── P1-2, grey-zone audit of 2026-11-01 (OWNER RULING "yes", same day) ───
//
// Isla, 8, no spleen, never vaccinated. Her card offered Option A (PCV20) or
// Option B (PCV15, then PPSV23 8 weeks later) and said nothing after that. If
// she took Option B, the app's next card asked for PCV20 or a second PPSV23
// five years after the PPSV23 — a third dose today's card never mentioned.
// 216 of 222 such cards on the grid.
//
// Asked whether that dose is owed, the owner answered yes, quoting ACIP
// mm7137a3 (read live 2026-11-01, once on the page): "Children aged ≥2 years
// who have an immunocompromising condition should receive a second dose of
// PPSV23 ≥5 years after the first PPSV23 dose." So the Option B cards now
// say it. WORDING ONLY — the later card already asked for it.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-01';
const d = (product, dates) => dates.map((date) => ({ product, date }));
const recs = (p) => recommend({ today: TODAY, ...p }).recs;
const byLabel = (p, start) => recs(p).find((r) => r.doseLabel?.startsWith(start));
const text = (r) => (typeof r.note === 'string' ? r.note : `${r.note.lead} ${r.note.detail}`);
const keys = (r) => r.noteCites.map((c) => c.key);
const balanced = (r) => (text(r).match(/\[c\]/g) || []).length === r.noteCites.length;

const ISLA = { dob: '2018-10-27', riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [] };
const ISLA_PPSV_AT_7 = { ...ISLA, ppsv23Doses: d('PPSV23', ['2025-10-27']) };
const DIABETES_8 = { ...ISLA, riskIds: ['diabetes'] };

describe('P1-2: the immunocompromised Option B card names the dose 5 years on', () => {
  it('Isla: Option B-1 says PCV20 or a second PPSV23 follows the PPSV23 by 5 years', () => {
    const r = byLabel(ISLA, 'Option B-1');
    expect(text(r)).toContain('For an immunocompromising condition, that PPSV23 is followed by one further dose — PCV20 or a second PPSV23 — ≥5 years later [c].');
    expect(keys(r)).toContain('pedsSecondPpsv5y');
    expect(balanced(r)).toBe(true);
  });

  it('Isla: Option B-2 (the PPSV23 step) says it too', () => {
    const r = byLabel(ISLA, 'Option B-2');
    expect(text(r)).toContain('≥5 years later [c]');
    expect(keys(r)).toContain('pedsSecondPpsv5y');
    expect(balanced(r)).toBe(true);
  });

  it('a PPSV23 already counted: no PPSV23 after the PCV15, the further dose 5 years after hers', () => {
    const r = byLabel(ISLA_PPSV_AT_7, 'Option B-1');
    expect(text(r)).toContain('This child has already had a PPSV23 (Oct 27, 2025), so none follows the PCV15 now');
    expect(text(r)).toContain('PCV20 or a second PPSV23 — waits until ≥5 years after that PPSV23 [c]');
    expect(balanced(r)).toBe(true);
    expect(byLabel(ISLA_PPSV_AT_7, 'Option B-2')).toBeUndefined();
  });

  it('CONTROL: a child with diabetes reads as before — no 5-year dose', () => {
    expect(text(byLabel(DIABETES_8, 'Option B-1'))).not.toContain('5 years');
    expect(text(byLabel(DIABETES_8, 'Option B-2'))).not.toContain('5 years');
  });

  it('nothing but the words moved', () => {
    const r = byLabel(ISLA, 'Option B-1');
    expect([r.status, r.brands, r.minIntervalDays, r.dueToday]).toEqual(['risk-based', ['PCV15 (Vaxneuvance)'], 56, true]);
  });
});

describe('the card promises what the next visit asks for', () => {
  it('Isla after PCV15 and PPSV23: PCV20 or a 2nd PPSV23, 5 years after the PPSV23', () => {
    const next = recommend({ ...ISLA, today: '2027-03-01', pcvDoses: d('PCV15', ['2026-11-01']), ppsv23Doses: d('PPSV23', ['2026-12-27']) }).recs;
    expect(next.map((r) => r.earliestNextDate)).toEqual(['2031-12-27', '2031-12-27']);
  });

  it('PPSV23 at 7 then PCV15: the further dose 5 years after that PPSV23', () => {
    const next = recommend({ ...ISLA_PPSV_AT_7, today: '2027-01-15', pcvDoses: d('PCV15', ['2026-11-01']) }).recs;
    expect(next.map((r) => r.earliestNextDate)).toContain('2030-10-27');
  });
});
