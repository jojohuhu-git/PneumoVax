// ── P1-3, grey-zone audit of 2026-11-01 ─────────────────────────────────
//
// G04: 30, diabetes, PPSV23 in Oct 2024, PCV15 in Oct 2025. Her card listed
// those two dates and, directly under them, said "PCV15 followed by PPSV23 is
// a complete pneumococcal series" — citing CDC's "If PCV15 is used, administer
// 1 dose PPSV23 at least 1 year after the PCV15 dose". The verdict (complete)
// is right; the sentence describes the opposite order, and the row it cites is
// not the row she followed. 675 of 17,016 grid patients.
//
// The row she followed is CDC's "Previously received only PPSV23 … If PCV15 is
// used, no additional PPSV23 doses are recommended." That last sentence is
// printed in BOTH the 19-49 and the 50+ lists (read live 2026-11-01); the 50+
// entry's quote stopped one sentence short and now carries it. Cite the row the
// patient FOLLOWED (owner rule 2026-10-23); the dose is unchanged, so this is
// decided without asking (owner rule 2026-10-18).

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';

const TODAY = '2026-11-01';
const d = (product, dates) => dates.map((date) => ({ product, date }));
const card = (p) => recommend({ today: TODAY, ...p }).recs[0];
const keys = (r) => r.noteCites.map((c) => c.key);
const balanced = (r) => (r.note.match(/\[c\]/g) || []).length === r.noteCites.length;

const G04 = { dob: '1996-10-27', riskIds: ['diabetes'], pcvDoses: d('PCV15', ['2025-10-27']), ppsv23Doses: d('PPSV23', ['2024-10-27']) };
const G06 = { ...G04, dob: '1986-10-27', riskIds: ['hiv'] };
const G05 = { ...G04, dob: '1971-10-27', riskIds: [] };
// CONTROL: the usual order.
const PCV15_FIRST = { ...G04, pcvDoses: d('PCV15', ['2024-10-27']), ppsv23Doses: d('PPSV23', ['2025-10-27']) };

const PPSV_FIRST_NOTE = 'PPSV23 was given first and PCV15 after it. When PCV15 follows a PPSV23, no additional PPSV23 doses are recommended — the series is complete [c]';

describe('P1-3: an adult who had PPSV23 first is told so, with the row she followed', () => {
  it('G04 (19-49, diabetes)', () => {
    const r = card(G04);
    expect(r.status).toBe('complete');
    expect(r.note).not.toContain('PCV15 followed by PPSV23');
    expect(r.note).toContain(PPSV_FIRST_NOTE);
    expect(keys(r)).toEqual(['adultPpsvOnly1949']);
    expect(balanced(r)).toBe(true);
  });

  it('G06 (19-49, HIV): the same', () => {
    expect(keys(card(G06))).toEqual(['adultPpsvOnly1949']);
    expect(card(G06).note).toContain(PPSV_FIRST_NOTE);
  });

  it('G05 (50+): the 50+ row, plus the job aid as before', () => {
    const r = card(G05);
    expect(r.note).toContain(PPSV_FIRST_NOTE);
    expect(keys(r)).toEqual(['adultPpsvOnly', 'jobAidSeriesCompleteAt50']);
    expect(balanced(r)).toBe(true);
  });

  it('the 50+ quote now carries the sentence the card leans on, verbatim from CDC', () => {
    expect(REFS.adultPpsvOnly.quote).toBe('Previously received only PPSV23: 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PPSV23 dose. If PCV15 is used, no additional PPSV23 doses are recommended.');
  });

  it('CONTROL: PCV15 first, PPSV23 after — wording and source unchanged', () => {
    const r = card(PCV15_FIRST);
    expect(r.note).toBe('PCV15 followed by PPSV23 is a complete pneumococcal series — no further doses needed [c].');
    expect(keys(r)).toEqual(['adultPcv15ThenPpsv']);
  });

  it('a PCV13 in the history too: not "only PPSV23", so the old row stays', () => {
    const r = card({ ...G04, pcvDoses: [...d('PCV13', ['2020-10-27']), ...d('PCV15', ['2025-10-27'])] });
    expect(keys(r)).not.toContain('adultPpsvOnly1949');
  });
});
