// ── §K-IC-PCV20-5Y (OWNER RULING 2026-10-31): an IC child's early PCV20 says so ──
//
// A 6-year-old with no spleen, PCV13 as a baby, PPSV23 a year ago. Her card
// advises PCV20 or a second PPSV23 five years after the first PPSV23. Given
// the SECOND PPSV23 a year early, her chip read "shorter than the 5 years
// advised … Counted"; given the PCV20 a year early instead, it read nothing.
// Shown both, the owner chose "Add a note". The dose counts either way.
//
// CDC, Risk-based Pneumococcal Recommendations, immunocompromising condition,
// "Received PPSV23", read live 2026-10-31: "Wait until at least 5 years have
// passed since they received their first PPSV23 dose. Then give 1 dose of
// PCV20 or PPSV23."
//
// The note is the CARD'S answer, not a second reading of it: recommend() runs
// the patient on the day of the dose with only the earlier doses, and adds the
// note exactly when that card was holding a PCV20 to five years. The sweep at
// the bottom holds it to that over the whole grid, both ways.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { addDays, calendarMonthsBetween } from '../dateUtils.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const NOTE = 'Given 12 months after the first PPSV23 dose of Oct 11, 2025 — shorter than the 5 years CDC advises. **Counted; no repeat indicated.**';
const BABY = d('PCV13', ['2020-12-01', '2021-02-01', '2021-04-01', '2021-10-05']);
const HER = { dob: '2020-10-01', ageMonths: 72, today: '2026-10-12', riskIds: ['asplenia'],
  pcvDoses: [...BABY, ...d('PCV20', ['2026-10-12'])], ppsv23Doses: d('PPSV23', ['2025-10-11']) };
const lastPcv = (out) => out.perDose.pcv.at(-1);
const anyNote = (dose) => (dose.reasons ?? []).some((t) => t.includes('the first PPSV23 dose of'));

describe('her: PCV20 one year after the PPSV23', () => {
  const out = recommend(HER);
  const dose = lastPcv(out);

  it('counts, and now says it came early', () => {
    expect(dose.status).toBe('valid');
    expect(dose.effectiveDoseNum).toBe(5);
    expect(dose.earlyAdvisory).toBe(true);
    expect(dose.reasons).toEqual([NOTE]);
    expect(dose.whys).toEqual([expect.stringMatching(/^CDC's child schedule gives an immunocompromised child who has had PPSV23 a PCV20 or a second PPSV23 at least 5 years after the first PPSV23/)]);
  });

  it('her card is unchanged: complete', () => {
    expect(out.recs.map((r) => [r.status, r.doseLabel])).toEqual([['complete', 'PCV complete (includes PCV20)']]);
  });

  it('the same sentence shape as her early second PPSV23 (the control she was shown)', () => {
    const twin = recommend({ ...HER, pcvDoses: BABY, ppsv23Doses: d('PPSV23', ['2025-10-11', '2026-10-12']) });
    expect(twin.perDose.ppsv23[1].reasons[0]).toMatch(/^Given 12 months after the previous PPSV23 dose of Oct 11, 2025 — shorter than the 5 years advised between PPSV23 doses\. \*\*Counted;/);
  });
});

describe('no note where the card was not holding the PCV20 to five years', () => {
  it('on time: five years after the PPSV23', () => {
    const out = recommend({ ...HER, today: '2030-10-15', ageMonths: 120, pcvDoses: [...BABY, ...d('PCV20', ['2030-10-15'])] });
    expect(anyNote(lastPcv(out))).toBe(false);
  });

  it('not immunocompromised (diabetes): the PPSV23 already finished her, no five-year PCV20', () => {
    const out = recommend({ ...HER, riskIds: ['diabetes'] });
    expect(anyNote(lastPcv(out))).toBe(false);
  });

  it('inside 8 weeks of the PPSV23: thrown out by the floor, which says why', () => {
    const out = recommend({ ...HER, today: '2025-11-20', ageMonths: 61, pcvDoses: [...BABY, ...d('PCV20', ['2025-11-20'])] });
    expect(lastPcv(out).status).toBe('invalid');
    expect(anyNote(lastPcv(out))).toBe(false);
  });

  it('a PCV13 in place of the PCV20: CDC\'s five years names PCV20 or PPSV23, not a PCV13', () => {
    const out = recommend({ ...HER, pcvDoses: [...BABY, ...d('PCV13', ['2026-10-12'])] });
    expect(anyNote(lastPcv(out))).toBe(false);
  });

  it('a toddler\'s CATCH-UP PCV20 the card held to 8 weeks, given 54 days on (inside the 4-day grace, so it counts)', () => {
    const out = recommend({ dob: '2024-10-11', ageMonths: 25, today: '2026-12-04', riskIds: ['asplenia'],
      pcvDoses: [...d('PCV13', ['2026-03-25', '2026-04-22', '2026-05-20']), ...d('PCV20', ['2026-12-04'])],
      ppsv23Doses: d('PPSV23', ['2026-10-11']) });
    expect(lastPcv(out).status).toBe('valid');
    expect(anyNote(lastPcv(out))).toBe(false);
  });

  it('an adult: the adult row speaks, once', () => {
    const out = recommend({ dob: '1960-06-01', ageMonths: 796, today: '2026-10-12', riskIds: ['asplenia'],
      pcvDoses: d('PCV13', ['2020-07-01', '2026-10-12']).map((x, i) => (i ? { ...x, product: 'PCV20' } : x)),
      ppsv23Doses: d('PPSV23', ['2025-10-11']) });
    const notes = lastPcv(out).reasons;
    expect(notes.filter((t) => /shorter than the 5 years/.test(t))).toHaveLength(1);
    expect(anyNote(lastPcv(out))).toBe(false);
  });
});

describe('the grid: the note appears exactly when the card held a PCV20 to five years', () => {
  // Every grid child, a PCV20 added 1, 60 and 400 days on. Measured
  // 2026-10-31: 612 notes, 0 where the card did not hold it, 0 missed; 102
  // more were inside the 8-week floor and thrown out, which is right.
  it('both ways, counts pinned', () => {
    const t = { fired: 0, floor: 0, falseFire: 0, miss: 0 };
    for (const c of buildCases()) {
      for (const off of [1, 60, 400]) {
        const day = addDays(c.input.today, off);
        const am = calendarMonthsBetween(c.input.dob, day);
        if (am >= 228) continue;
        const before = recommend({ ...c.input, today: day, ageMonths: am });
        const held = before.recs.some((r) => r.vaccine === 'PCV' && r.minIntervalMonths === 60
          && r.brands.some((b) => b.startsWith('PCV20')) && r.earliestNextDate > day);
        const after = recommend({ ...c.input, today: day, ageMonths: am, pcvDoses: [...c.input.pcvDoses, { product: 'PCV20', date: day }] });
        const dose = after.perDose.pcv.at(-1);
        if (!dose) continue;
        const fired = anyNote(dose);
        if (held && fired) t.fired += 1;
        else if (held && dose.status !== 'valid') t.floor += 1;
        else if (held) t.miss += 1;
        else if (fired) t.falseFire += 1;
      }
    }
    expect(t).toEqual({ fired: 612, floor: 102, falseFire: 0, miss: 0 });
  });
});
