// ── P2-2, grey-zone audit of 2026-11-01 (owner: "agree with fixing") ────
//
// G27: 18 years 5 months, diabetes, PCV21 at 18 years 1 month. The dose counts
// (§I, owner decision 2026-10-16: licensed from 18), so the child's card says
// complete — but it was titled "PCV complete (includes PCV20)" and said the
// series "includes PCV20". Never print a product the record does not show
// (FINDING H). The CDC rows it cites are written for PCV20, so the card now
// says so instead of letting the reader assume the dose was one.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-01';
const d = (product, dates) => dates.map((date) => ({ product, date }));
const card = (p) => recommend({ today: TODAY, ...p }).recs[0];
const text = (r) => `${r.note.lead} ${r.note.detail}`;
const BRIDGE = "CDC's child rows name PCV20; PCV21 is licensed from age 18, and this app counts one given at 18 as completing the series as a PCV20 would (owner decision 2026-10-16).";

const G27 = { dob: '2008-05-27', riskIds: ['diabetes'], pcvDoses: d('PCV21', ['2026-06-27']), ppsv23Doses: [] };
const BABY_THEN_PCV21 = { ...G27, pcvDoses: [...d('PCV13', ['2008-07-27', '2008-09-27', '2008-11-27', '2009-05-27']), ...d('PCV21', ['2026-06-27'])] };
const AT_8_THEN_PCV21 = { ...G27, pcvDoses: [...d('PCV13', ['2016-06-27']), ...d('PCV21', ['2026-06-27'])] };

describe('P2-2: a PCV21 given at 18 is called a PCV21', () => {
  it.each([['G27, PCV21 first conjugate', G27], ['baby series then PCV21', BABY_THEN_PCV21], ['PCV13 at 8 then PCV21', AT_8_THEN_PCV21]])('%s', (_n, p) => {
    const r = card(p);
    expect(r.status).toBe('complete');
    expect(r.doseLabel).toBe('PCV complete (includes PCV21)');
    expect(text(r)).not.toContain('includes PCV20');
    expect(text(r)).toContain(BRIDGE);
    expect((text(r).match(/\[c\]/g) || []).length).toBe(r.noteCites.length);
  });

  it('CONTROL: a PCV20 reads exactly as before, with no bridge', () => {
    const r = card({ ...G27, pcvDoses: d('PCV20', ['2026-06-27']) });
    expect(r.doseLabel).toBe('PCV complete (includes PCV20)');
    expect(text(r)).not.toContain('PCV21');
  });
});
