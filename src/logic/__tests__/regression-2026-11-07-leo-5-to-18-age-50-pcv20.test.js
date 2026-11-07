// OWNER RULING 2026-11-07 — Leo, "Match the toddler card" (CLINICAL_SPEC.md §B-5TO18).
//
// The healthy 5–18 card ends, under "Why this", "Re-evaluate at age 50". Leo is
// 5 and healthy: PCV13 at 2, 4 and 6 months, then a PCV20 catch-up dose at 2.
// Run forward he reads nothing at 19 and "Complete" at 50, so 50 brings him
// nothing. Shown him beside a PCV13-only control (owed PCV20 or PCV21 at 50),
// she chose the baby and toddler cards' rule: no line when a PCV20 counted.
//
// Then NINA, same day ("Drop it for Nina too"): 17, healthy, PCV13 as a baby,
// and a PCV20 at 16 she did not need. Her chip reads "Not needed … Not counted.
// Do not repeat.", so Leo's rule left her line on — yet at 50 the adult
// schedule counts every dose received and reads Complete. An EXTRA PCV20 takes
// the line off too (198 grid cards). A PCV20 that is INVALID — a same-day
// duplicate, or one day after a PPSV23 — keeps it: 14 of those really are owed
// a dose at 50. (Before building, she had been told those 14 would lose the
// line; measured, they keep it, and she was told so.)
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-11-07';
const DOB = '2021-09-07'; // 5 years 2 months
const AGE_50 = 'Re-evaluate at age 50, when routine pneumococcal vaccination begins for every adult [c].';
const BABY = [['PCV13', '2021-11-07'], ['PCV13', '2022-01-07'], ['PCV13', '2022-03-07']];
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const markers = (r) => (noteText(r).match(/\[c\]/g) ?? []).length;

function child(doses, riskIds = [], today = TODAY) {
  return recommend({
    dob: DOB, today, riskIds, ppsv23Doses: [],
    pcvDoses: doses.map(([product, date]) => ({ product, date })),
  });
}
const LEO = [...BABY, ['PCV20', '2023-09-07']];
const card = (out) => out.recs.find((r) => r.vaccine === 'PCV');

describe('the healthy 5–18 card: no age-50 line once a PCV20 has counted', () => {
  it('control — PCV13 only: keeps the line, under Why this, cited to the adult schedule', () => {
    const c = card(child(BABY));
    expect(c.doseLabel).toBe('Not indicated (healthy 5–18y)');
    expect(c.note.detail).toContain(AGE_50);
    expect(c.noteCites.map((x) => x.key)).toContain('adultRoutine50');
    expect(markers(c)).toBe(c.noteCites.length);
    expect(child(BABY, [], '2071-09-07').recs.some((r) => r.dueToday)).toBe(true);
  });

  it('Leo — a PCV20 catch-up at 2: no line, no adult source; Why this keeps its reason', () => {
    const c = card(child(LEO));
    expect(c.doseLabel).toBe('Not indicated (healthy 5–18y)');
    expect(noteText(c)).not.toContain('Re-evaluate at age 50');
    expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
    expect(c.note.detail).toMatch(/^CDC's catch-up row covers healthy children only through age 4\./);
    expect(markers(c)).toBe(c.noteCites.length);
  });

  it('why: Leo run forward reads nothing at 19 and Complete at 50', () => {
    expect(card(child(LEO, [], '2040-09-07')).status).toBe('not-indicated');
    expect(card(child(LEO, [], '2071-09-07')).status).toBe('complete');
  });

  it('smoking ticked with a PCV20: no line at all — not 50, and not the "19" swap either', () => {
    const c = card(child(LEO, ['smoking']));
    expect(noteText(c)).not.toMatch(/Re-evaluate at age (50|19)/);
    expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
    expect(c.noteCites.map((x) => x.key)).not.toContain('cdcAdultRiskFactorList');
    expect(markers(c)).toBe(c.noteCites.length);
    // At 19 the adult card reads Complete: nothing to send him back for.
    expect(card(child(LEO, ['smoking'], '2040-09-07')).status).toBe('complete');
  });

  it('smoking ticked, PCV13 only: still the "Re-evaluate at age 19" line (P2-5, unchanged)', () => {
    const c = card(child(BABY, ['smoking']));
    expect(c.note.detail).toMatch(/Re-evaluate at age 19, when the adult schedule counts cigarette smoking/);
    expect(markers(c)).toBe(c.noteCites.length);
  });

  it('Nina — 17, an unneeded PCV20 recorded as extra: no line either', () => {
    const NINA = { dob: '2009-09-07', riskIds: [], ppsv23Doses: [], pcvDoses: [
      ['PCV13', '2009-11-07'], ['PCV13', '2010-01-07'], ['PCV13', '2010-03-07'], ['PCV13', '2010-09-07'],
      ['PCV20', '2025-10-01'],
    ].map(([product, date]) => ({ product, date })) };
    const out = recommend({ ...NINA, today: TODAY });
    expect(out.perDose.pcv[4].extraDose).toBe(true); // the premise: not counted
    const c = card(out);
    expect(c.doseLabel).toBe('Not indicated (healthy 5–18y)');
    expect(noteText(c)).not.toContain('Re-evaluate at age 50');
    expect(markers(c)).toBe(c.noteCites.length);
    expect(card(recommend({ ...NINA, today: '2059-09-07' })).status).toBe('complete');
  });

  it('a PCV20 that is INVALID (same day as a PCV15) keeps the line — he is owed a dose at 50', () => {
    const SAME_DAY = { dob: DOB, riskIds: [], ppsv23Doses: [], pcvDoses: [
      ['PCV15', '2023-09-07'], ['PCV20', '2023-09-07'],
    ].map(([product, date]) => ({ product, date })) };
    const out = recommend({ ...SAME_DAY, today: TODAY });
    expect(out.perDose.pcv.find((d, i) => out.orderedDoses.pcv[i].product === 'PCV20').status).toBe('invalid');
    expect(noteText(card(out))).toContain(AGE_50);
    expect(recommend({ ...SAME_DAY, today: '2071-09-07' }).recs.some((r) => r.dueToday)).toBe(true);
  });

  it('the answer is untouched — wording and sources only', () => {
    for (const out of [child(LEO), child(LEO, ['smoking']), child(BABY)]) {
      expect(card(out).status).toBe('not-indicated');
      expect(card(out).dueToday).toBe(false);
    }
  });

  it('over the whole grid, every healthy 5–18 card has one cite per marker', () => {
    // The P2-5 "age 19" swap replaces the age-50 sentence and swaps its cite. On
    // a card that no longer carries the sentence it would add a cite with no
    // marker. No card reaches that today (with a counted PCV20 the adult card at
    // 19 asks for nothing); this sweep is what fails if one ever does.
    let seen = 0;
    for (const c of buildCases()) {
      const r = recommend(c.input).recs?.find((x) => x.doseLabel === 'Not indicated (healthy 5–18y)');
      if (!r) continue;
      seen += 1;
      expect(markers(r), c.key).toBe(r.noteCites.length);
    }
    expect(seen).toBeGreaterThan(1000);
  });
});
