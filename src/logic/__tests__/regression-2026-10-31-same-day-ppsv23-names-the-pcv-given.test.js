// ── A same-day PPSV23 names the PCV the record shows (2026-10-31) ─────────
//
// Under the child rules a PPSV23 given at the same visit as a PCV read "PCV15
// and PPSV23 should not be given at the same visit" for EVERY product. On the
// grid that sentence was shown 583 times and not once beside a PCV15: PCV13
// 297, unknown product 154, PCV20 121, PCV21 11. CLAUDE.md: never print a
// product the record does not show.
//
// CDC's notes name PCV15 alone ("PCV15 and PPSV23 should not be administered
// during the same visit"), so that clause stays for a PCV15 and only for it.
// Every other product is thrown out by the 8-week rule, which the sentence
// already states. Wording only: the verdict is the row's, unchanged.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
// A 3-year-old with no spleen, a finished infant series, then a conjugate and
// a PPSV23 at the same visit at 30 months.
const child = (product) => ({
  dob: '2023-01-01', ageMonths: 45, today: '2026-10-31', riskIds: ['asplenia'],
  pcvDoses: [...d('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-05']), { product, date: '2025-07-01' }],
  ppsv23Doses: d('PPSV23', ['2025-07-01']),
});
const sameDay = (product) => recommend(child(product)).perDose.ppsv23[0];

describe('the sentence names the product given', () => {
  it('PCV13: names PCV13, not PCV15', () => {
    const r = sameDay('PCV13');
    expect(r.status).toBe('invalid');
    expect(r.reasons[0]).toBe('Given on the same day as a PCV13 dose — PPSV23 is given at least 8 weeks (56 days) after a PCV dose.');
  });

  it('PCV15: keeps CDC\'s own sentence, which names PCV15', () => {
    expect(sameDay('PCV15').reasons[0]).toBe('Given on the same day as a PCV15 dose — PCV15 and PPSV23 should not be given at the same visit, and PPSV23 is given at least 8 weeks (56 days) after a PCV dose.');
  });

  it('an unrecorded product names no product', () => {
    expect(sameDay('').reasons[0]).toBe('Given on the same day as a PCV dose — PPSV23 is given at least 8 weeks (56 days) after a PCV dose.');
  });

  it('only a PCV15 is ever named as PCV15', () => {
    for (const p of ['PCV13', 'PCV20', 'PCV21', '']) {
      expect(sameDay(p).reasons.join(' ')).not.toContain('PCV15');
    }
  });
});
