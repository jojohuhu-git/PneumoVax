/**
 * Two owner answers of 2026-11-06.
 *
 * P2-9: Mia, 4 months, healthy, PCV20 on time at 2 months. Her card read
 * "Catch-up". Every baby's did once one dose was recorded. She chose: "Routine"
 * when on time, and "Catch-up" stays for a baby who is actually behind.
 *
 * P2-10: shown a 3-year-old with no spleen and no doses, she asked: "this patient
 * has no prior pneumococcal doses so why is the 8 week interval being mentioned".
 * The card measured from a dose that does not exist. Every card in that family
 * now says only what the patient needs.
 *
 * No dose, date or interval changes in either.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-06';
const run = (dob, riskIds, pcv = [], ppsv = []) => recommend({
  today: TODAY, dob, riskIds,
  pcvDoses: pcv.map(([product, date]) => ({ product, date })),
  ppsv23Doses: ppsv.map((date) => ({ product: 'PPSV23', date })),
});
const text = (c) => (typeof c.note === 'string' ? c.note : `${c.note?.lead} ${c.note?.detail}`);
const allText = (r) => r.recs.map((c) => `${c.doseLabel} ${text(c)}`).join(' || ');

describe('P2-9: "Routine" for an on-time baby', () => {
  it('Mia, on the day dose 2 is due', () => {
    const c = run('2026-07-06', [], [['PCV20', '2026-09-06']]).recs[0];
    expect(c.status).toBe('routine');
    expect(c.dueToday).toBe(true);
  });

  it('a dose not yet due, on schedule', () => {
    const c = run('2026-08-06', [], [['PCV20', '2026-10-06']]).recs[0];
    expect(c.status).toBe('routine');
    expect(c.dueToday).toBe(false);
  });

  it('an on-time baby with three doses, waiting for the 12-month dose', () => {
    const c = run('2026-02-06', [], [['PCV20', '2026-04-06'], ['PCV20', '2026-06-06'], ['PCV20', '2026-08-06']]).recs[0];
    expect(c.status).toBe('routine');
  });

  it('the 12-15 month dose at 14 months', () => {
    const c = run('2025-09-06', [], [['PCV20', '2025-11-06'], ['PCV20', '2026-01-06'], ['PCV20', '2026-03-06']]).recs[0];
    expect(c.status).toBe('routine');
  });

  it('CONTROL: the day after the routine age, the baby is behind', () => {
    const c = run('2026-07-05', [], [['PCV20', '2026-09-05']]).recs[0];
    expect(c.status).toBe('catchup');
  });

  it('CONTROL: past 15 months with the last dose still owed is behind', () => {
    const c = run('2025-06-06', [], [['PCV20', '2025-08-06'], ['PCV20', '2025-10-06'], ['PCV20', '2025-12-06']]).recs[0];
    expect(c.status).toBe('catchup');
  });

  it('CONTROL: a series started late, with its own total, stays catch-up', () => {
    const c = run('2026-02-06', [], [['PCV20', '2026-10-06']]).recs[0];
    expect(c.doseLabel).toBe('PCV dose 2 of 3');
    expect(c.status).toBe('catchup');
  });

  it('CONTROL: four doses before 7 months owes a fifth, which is not the routine series', () => {
    const c = run('2026-02-06', [], [['PCV20', '2026-04-06'], ['PCV20', '2026-05-06'], ['PCV20', '2026-06-06'], ['PCV20', '2026-07-06']]).recs[0];
    expect(c.doseLabel).toBe('PCV dose 5 of 5');
    expect(c.status).toBe('catchup');
  });

  it('CONTROL: a first dose still reads Due', () => {
    expect(run('2026-09-06', []).recs[0].status).toBe('due');
  });
});

describe('P2-10: no dose on record, nothing to measure from', () => {
  it('3 years, no spleen: two doses, 8 weeks apart', () => {
    const c = run('2023-11-06', ['asplenia']).recs[0];
    expect(c.note.lead).toBe('Give 2 doses of PCV20 or PCV15, ≥8 weeks apart [c] [c].');
    expect(c.dueToday).toBe(true);
  });

  it('a healthy 3-year-old', () => {
    const c = run('2023-11-06', []).recs[0];
    expect(c.note.lead).toMatch(/^Give 1 dose of PCV15 or PCV20 \[c\] \[c\]/);
  });

  it('10 years, cochlear implant: both options, no measured interval before the first dose', () => {
    const r = run('2016-11-06', ['cochlear_implant']);
    expect(r.recs.map((c) => c.doseLabel)).toEqual([
      'Option A: 1 dose PCV20', 'Option B-1: 1 dose PCV15', 'Option B-2: PPSV23 (≥8 weeks after PCV15)',
    ]);
    expect(allText(r)).not.toMatch(/most recent/);
    expect(allText(r)).not.toMatch(/previously given/);
    // The gap that remains is real: PCV15, then PPSV23.
    expect(r.recs[1].note.lead).toContain('Option B — 1 dose of PCV15, then ≥8 weeks later 1 dose of PPSV23');
  });

  it('an untouched row in the form is not a dose', () => {
    const r = recommend({ today: TODAY, dob: '2023-11-06', riskIds: ['asplenia'], pcvDoses: [{ product: '', date: '' }], ppsv23Doses: [] });
    expect(r.recs[0].note.lead).toBe('Give 2 doses of PCV20 or PCV15, ≥8 weeks apart [c] [c].');
  });

  it('CONTROL: one PCV on record keeps the 8 weeks after it', () => {
    const c = run('2023-11-06', ['asplenia'], [['PCV13', '2026-10-01']]).recs[0];
    expect(c.note.lead).toContain('after the most recent pneumococcal dose');
  });

  it('CONTROL: a PPSV23 and no conjugate keeps it too', () => {
    const r = run('2016-11-06', ['cochlear_implant'], [], ['2026-10-01']);
    expect(r.recs[0].doseLabel).toBe('Option A: 1 dose PCV20 (≥8 weeks)');
    expect(allText(r)).toContain('after the most recent pneumococcal vaccine');
  });

  it('CONTROL: a PPSV23 that was thrown out keeps it, because a dose was given', () => {
    // Given at 18 months, under the minimum age, so it does not count.
    const c = run('2023-11-06', ['asplenia'], [], ['2025-05-06']).recs[0];
    expect(text(c)).toContain('after the most recent pneumococcal dose');
  });

  it('CONTROL: an undated dose keeps it, because a dose exists', () => {
    const c = run('2023-11-06', ['asplenia'], [['PCV13', '']]).recs[0];
    expect(text(c)).toContain('after the most recent pneumococcal dose');
  });
});
