// queue P2-12: the 2-year minimum age for PPSV23 was written down twice — once
// in the product catalogue (`PPSV23_PRODUCT.minAgeM`, where every other
// product's minimum lives) and once as a bare `const minAgeM = 24` inside the
// validator, with "2 years" spelled out by hand in five of its messages.
//
// Two copies of a clinical number is how an app ends up comparing against one
// number and telling the clinician another. These tests read the minimum from
// the catalogue — the single home — and check that both the DECISION and every
// SENTENCE follow it. Change the catalogue number and these fail unless the
// validator followed.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';
import { PPSV23_PRODUCT } from '../../data/brands.js';
import { readFileSync } from 'node:fs';

const MIN_M = PPSV23_PRODUCT.minAgeM;

// The minimum as the messages say it, derived from the catalogue rather than
// typed out: 24 months → "2 years" and "2-year".
const minYears = MIN_M / 12;
const asNoun = `${minYears} year${minYears === 1 ? '' : 's'}`;
const asAdjective = `${minYears}-year`;

const DOB = '2020-01-01';
const TODAY = '2026-01-01';

// Returns the PPSV23 verdict for a single dose given at `date`. An undated
// row needs `detailsUnknown` to be a dose at all: a PPSV23 row is born with
// its product already filled in, so without that tick it is an empty row
// nobody typed in, and the engine drops it (queue P1-3).
function ppsv23Verdict({ date, ageMonths }) {
  const r = analyzeBoth({
    pcvDoses: [],
    ppsv23Doses: [date ? { date, product: 'PPSV23' } : { date: '', product: 'PPSV23', detailsUnknown: true }],
    ageMonths,
    today: TODAY,
    dob: date ? DOB : null,
    riskIds: [],
  });
  return r.ppsv23.perDose[0];
}

describe('queue P2-12 — the PPSV23 minimum age has one home', () => {
  it('the catalogue states a minimum age for PPSV23', () => {
    expect(typeof MIN_M).toBe('number');
    expect(MIN_M).toBeGreaterThan(0);
  });

  it('a dose a month below the catalogue minimum is rejected, and says the catalogue number', () => {
    // One month under, well clear of the 4-day grace.
    const monthsUnder = MIN_M - 1;
    const d = new Date(Date.UTC(2020, 0, 1));
    d.setUTCMonth(d.getUTCMonth() + monthsUnder);
    const v = ppsv23Verdict({ date: d.toISOString().slice(0, 10), ageMonths: 72 });

    expect(v.status).toBe('invalid');
    const text = [...v.reasons, v.detail].join(' ');
    expect(text).toContain(asAdjective);  // "below the 2-year minimum age"
    expect(text).toContain(asNoun);       // "Minimum: 2 years"
  });

  it('a dose a month above the catalogue minimum is accepted', () => {
    const monthsOver = MIN_M + 1;
    const d = new Date(Date.UTC(2020, 0, 1));
    d.setUTCMonth(d.getUTCMonth() + monthsOver);
    const v = ppsv23Verdict({ date: d.toISOString().slice(0, 10), ageMonths: 72 });
    expect(v.status).not.toBe('invalid');
  });

  it('an undated dose on a patient below the minimum says the catalogue number', () => {
    const v = ppsv23Verdict({ date: '', ageMonths: MIN_M - 6 });
    expect(v.status).toBe('invalid');
    expect([...v.reasons, v.detail].join(' ')).toContain(asAdjective);
  });

  it('an undated dose on an older patient says what age it must have been given at', () => {
    const v = ppsv23Verdict({ date: '', ageMonths: 72 });
    expect([...v.reasons, v.detail].join(' ')).toContain(asNoun);
  });

  it('no PPSV23 minimum-age message writes the number out by hand', () => {
    // The comments in that function explain the history and may name the
    // number freely; what must never do so is a sentence shown to a clinician.
    const src = readFileSync(new URL('../validate.js', import.meta.url), 'utf8');
    const block = src.slice(
      src.indexOf('function validateOnePPSV23'),
      src.indexOf('// ── Core walk')
    );
    expect(block.length).toBeGreaterThan(100);
    const code = block
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .map((l) => l.replace(/\s+\/\/.*$/, ''))   // trailing comments too
      .join('\n');
    expect(code).not.toMatch(/\d+[- ]year|\d+ month|\d+ week/);
  });
});
