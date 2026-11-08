// P2-2 (wording audit, 2026-11-08) — OWNER RULING 2026-11-08, "Name the date".
//
// A 7-year-old with asplenia. Nov 8, 2021 (age 2): PCV13 and PPSV23 on the
// same day; the PPSV23 is Invalid ("Same day as PCV. Minimum interval 8
// weeks"). Nov 8, 2026: a second PPSV23, which counts as dose 1. Both cards
// read "≥5 years after first PPSV23", due Nov 8, 2031. The DATE is right — it
// runs from the PPSV23 that counted — but the record's first PPSV23 is 2021,
// and 2021 + 5 years is today. Asked how the card should word it, she chose to
// name the date: "≥5 years after the PPSV23 of Nov 8, 2026".
//
// Scope, as she was shown it: only where the first PPSV23 on the record did
// not count. Where it did, "first PPSV23" already names it, and stays.
//
// The pair is built in FOUR places in recommend.js (the 24–71-month card, the
// before-6 card at 6–18, the completed-series card, and the at/after-6 card).
// One helper words all four; the second describe block sweeps the grid so a
// fifth site, or a site that missed the helper, fails here.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const PCV13 = { product: 'PCV13', date: '2021-11-08' };
const base = { dob: '2019-11-08', today: '2026-11-08', riskIds: ['asplenia'], pcvDoses: [PCV13] };
const FIVE_YEAR = /≥5 years after/;

describe('P2-2: the five-year cards name the PPSV23 the clock runs from', () => {
  it('the named patient: the thrown-out 2021 PPSV23 is not called "first"', () => {
    const out = recommend({ ...base, ppsv23Doses: [{ product: 'PPSV23', date: '2021-11-08' }, { product: 'PPSV23', date: '2026-11-08' }] });
    expect(out.perDose.ppsv23.map((d) => d.status)).toEqual(['invalid', 'valid']);
    const cards = out.recs.filter((r) => FIVE_YEAR.test(r.doseLabel ?? ''));
    expect(cards.map((r) => r.doseLabel)).toEqual([
      '1 dose PCV20 (≥5 years after the PPSV23 of Nov 8, 2026)',
      '2nd PPSV23 (alternative, ≥5 years after the PPSV23 of Nov 8, 2026)',
    ]);
    for (const r of cards) {
      expect(r.earliestNextDate).toBe('2031-11-08');
      expect(noteText(r)).toMatch(/after the PPSV23 of Nov 8, 2026/);
      expect(noteText(r)).not.toMatch(/first PPSV23/);
    }
  });

  it('control: the PPSV23 8 weeks after the PCV13 counted, so "first PPSV23" stays', () => {
    const out = recommend({ ...base, ppsv23Doses: [{ product: 'PPSV23', date: '2022-01-08' }] });
    const labels = out.recs.map((r) => r.doseLabel);
    expect(labels).toContain('1 dose PCV20 (≥5 years after first PPSV23)');
    expect(labels).toContain('2nd PPSV23 (alternative, ≥5 years after first)');
    expect(out.recs.filter((r) => FIVE_YEAR.test(r.doseLabel ?? '')).every((r) => /the first PPSV23/.test(noteText(r)))).toBe(true);
  });
});

describe('P2-2 over the grid: no five-year card calls a thrown-out PPSV23 "first"', () => {
  it('every card naming "first PPSV23" has a first PPSV23 that counted', () => {
    let named = 0, first = 0;
    for (const c of buildCases()) {
      const out = recommend(c.input);
      const raw = (out.orderedDoses?.ppsv23 ?? []).map((d, i) => ({ d, v: out.perDose.ppsv23[i] }))
        .filter((x) => x.d.date && !x.v?.recordProblem);
      if (!raw.length) continue;
      const firstCounted = ['valid', 'counted', 'unknown'].includes(raw[0].v?.status) && !raw[0].v?.extraDose;
      for (const r of out.recs ?? []) {
        if (!FIVE_YEAR.test(r.doseLabel ?? '')) continue;
        const words = `${r.doseLabel} ${noteText(r)}`;
        if (/≥5 years after first|after the first PPSV23/.test(words)) {
          first++;
          expect(firstCounted, `${c.key ?? ''} ${r.doseLabel}`).toBe(true);
        }
        if (/after the PPSV23 of /.test(words)) named++;
      }
    }
    expect(first).toBeGreaterThan(0);
    expect(named).toBeGreaterThan(0);
  });
});
