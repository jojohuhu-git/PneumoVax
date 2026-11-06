/**
 * P2-3 (R8): a card said "at or after age 6" about doses given before 6.
 *
 * Ada, 8, cochlear implant. PCV13 at 2, 4, 6 and 12 months, PPSV23 at 2, PCV15 at
 * 7. Her card read "Complete (PCV13 and PCV15 + PPSV23 at/after age 6)". Only the
 * PCV15 was. CDC calls her complete either way, so the dose never moved, and her
 * 2026-10-18 rule lets the wording be settled without asking.
 *
 * The words stay wherever they are true (the control patients below). No test
 * here moves a dose, a status or a date.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-06';
const DOB = '2018-07-01';
const BABY = ['2018-09-01', '2018-11-01', '2019-01-01', '2019-07-01'];
const doses = (product, dates) => dates.map((date) => ({ product, date }));
const run = (riskIds, pcvDoses, ppsv23Doses = []) => recommend({ today: TODAY, dob: DOB, riskIds, pcvDoses, ppsv23Doses });
const text = (c) => [c.doseLabel, typeof c.note === 'string' ? c.note : `${c.note?.lead} ${c.note?.detail}`].join(' | ');
const allText = (r) => r.recs.map(text).join(' || ');
const AT_6_OR_LATER = /at\/after age 6|at or after age 6/;

describe('P2-3: no "at or after age 6" over a dose given before 6', () => {
  it('Ada: complete, and the label and note make no claim about age', () => {
    const r = run(['cochlear_implant'], [...doses('PCV13', BABY), ...doses('PCV15', ['2026-01-01'])], doses('PPSV23', ['2020-07-01']));
    expect(r.recs[0].status).toBe('complete');
    expect(r.recs[0].doseLabel).toBe('Complete (PCV13 and PCV15 + PPSV23)');
    expect(allText(r)).not.toMatch(AT_6_OR_LATER);
  });

  it('an immunocompromised child with the same history keeps her dose, without the claim', () => {
    const r = run(['asplenia'], [...doses('PCV13', BABY), ...doses('PCV15', ['2026-01-01'])], doses('PPSV23', ['2020-07-01']));
    expect(r.recs.some((c) => c.doseLabel === '1 dose PCV20 (immunocompromising)')).toBe(true);
    expect(allText(r)).not.toMatch(AT_6_OR_LATER);
  });

  it('Option A with no PPSV23 yet: the dose stays, the claim goes', () => {
    const r = run(['asplenia'], [...doses('PCV13', BABY), ...doses('PCV15', ['2026-01-01'])]);
    expect(r.recs.some((c) => c.doseLabel === 'Option A: 1 dose PCV20 (≥8 weeks)')).toBe(true);
    expect(allText(r)).not.toMatch(AT_6_OR_LATER);
  });

  it('PCV20 as a baby and a PCV15 at 7: says the doses fall both sides of 6', () => {
    const r = run(['asplenia'], [...doses('PCV20', BABY), ...doses('PCV15', ['2026-01-01'])]);
    const c = r.recs[0];
    expect(c.doseLabel).toBe('PCV complete (includes PCV20)');
    expect(c.note.detail).toContain('both before and after age 6');
    expect(c.note.detail).not.toMatch(AT_6_OR_LATER);
    expect(c.note.detail).not.toContain('before the PCV20 was');
  });

  it('the conjugate at 7 and the PPSV23 at 2: the label drops the claim about the PPSV23', () => {
    const r = run(['cochlear_implant'], doses('PCV15', ['2026-01-01']), doses('PPSV23', ['2020-07-01']));
    expect(r.recs[0].doseLabel).toBe('Complete (PCV15 + PPSV23)');
    // The note's own claim is about the conjugate, and it is true.
    expect(r.recs[0].note).toContain('with PCV15 at/after age 6 who has received PPSV23');
  });
});

describe('P2-3: the words stay where they are true', () => {
  it('both doses at 6 or later: label and note unchanged', () => {
    const r = run(['cochlear_implant'], doses('PCV13', ['2026-01-01']), doses('PPSV23', ['2026-04-01']));
    expect(r.recs[0].doseLabel).toBe('Complete (PCV13 + PPSV23 at/after age 6)');
    expect(r.recs[0].note).toContain('with PCV13 at/after age 6 who has received PPSV23');
  });

  it('Option A for a child whose only conjugate came at 7: unchanged', () => {
    const r = run(['asplenia'], doses('PCV13', ['2026-01-01']));
    const c = r.recs.find((x) => x.doseLabel === 'Option A: 1 dose PCV20 (≥8 weeks)');
    expect(text(c)).toContain('with PCV13 only (at/after age 6)');
  });

  it('baby doses then a conjugate at 8 then PCV20 at 9 is untouched by the all-before-6 card', () => {
    const r = run(['diabetes'], [...doses('PCV13', BABY), ...doses('PCV20', ['2026-01-01'])]);
    expect(r.recs[0].note.detail).toContain('were all given before age 6');
  });
});
