// OWNER RULING 2026-11-07 — "Match the baby card" (CLINICAL_SPEC.md §B-50BABY).
//
// The healthy 24–59-month "series complete" card ends "Re-evaluate at age 50".
// Earlier the same day she ruled the healthy BABY's complete card gets that line
// with two limits, each found by running the baby forward. The toddler card had
// carried the line since C12 with neither limit. Shown Ava — 3, healthy, PCV20 at
// 2, 4, 6 and 12 months: nothing at 19, "Complete" at 50 — and a toddler with a
// PCV15 series and smoking ticked, who is given a dose at 19, she chose the baby
// card's rule for the toddler card:
//   • a series that includes PCV20 — no line (at 50 it reads Complete);
//   • an ADULT-only tick (smoking, alcohol use disorder) — no line ("50" would
//     name the wrong age; the adult schedule acts at 19).
// Every other healthy toddler keeps the line. The dose is untouched.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-07';
const DOB = '2023-09-07'; // 3 years 2 months
const INFANT_DATES = ['2023-11-07', '2024-01-07', '2024-03-07', '2024-09-07'];
const AGE_50 = 'Re-evaluate at age 50, when routine pneumococcal vaccination begins for every adult [c].';
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);

function toddler(product, riskIds = [], today = TODAY) {
  return recommend({
    dob: DOB, today, riskIds, ppsv23Doses: [],
    pcvDoses: INFANT_DATES.map((date) => ({ product, date })),
  });
}
const card = (out) => out.recs.find((r) => r.vaccine === 'PCV');
const markers = (r) => (noteText(r).match(/\[c\]/g) ?? []).length;

describe('the healthy 24–59-month complete card follows the baby card', () => {
  it('control — four PCV15, healthy: keeps the age-50 line, cited to the adult schedule', () => {
    const c = card(toddler('PCV15'));
    expect(c.doseLabel).toBe('PCV series complete');
    expect(noteText(c)).toContain(AGE_50);
    expect(c.noteCites.at(-1).key).toBe('adultRoutine50');
    expect(markers(c)).toBe(c.noteCites.length);
  });

  it('and it is under "Why this", as on the baby card — not on the opened card', () => {
    // Owner, same day: "Yes, under Why this". `detail` is behind the toggle.
    const c = card(toddler('PCV15'));
    expect(c.note.detail).toBe(AGE_50);
    expect(c.note.lead).not.toContain('Re-evaluate');
    expect(c.note.lead).toContain('(A series that includes PCV20 also needs no PPSV23.)');
  });

  it('Ava — four PCV20: no age-50 line, and no adult source on her card', () => {
    const c = card(toddler('PCV20'));
    expect(c.doseLabel).toBe('PCV series complete');
    expect(noteText(c)).not.toContain('Re-evaluate at age 50');
    expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
    expect(markers(c)).toBe(c.noteCites.length);
  });

  it('why: Ava run forward reads nothing at 19 and Complete at 50', () => {
    expect(card(toddler('PCV20', [], '2042-09-07')).status).toBe('not-indicated');
    expect(card(toddler('PCV20', [], '2073-09-07')).status).toBe('complete');
  });

  it('a PCV20 anywhere in the series is enough — mixed PCV13 then PCV20', () => {
    const c = card(recommend({
      dob: DOB, today: TODAY, riskIds: [], ppsv23Doses: [],
      pcvDoses: INFANT_DATES.map((date, i) => ({ product: i < 3 ? 'PCV13' : 'PCV20', date })),
    }));
    expect(c.status).toBe('complete');
    expect(noteText(c)).not.toContain('Re-evaluate at age 50');
  });

  for (const tick of ['smoking', 'alcoholism']) {
    it(`${tick} ticked, PCV15 series: no age-50 line — the adult schedule gives a dose at 19`, () => {
      const c = card(toddler('PCV15', [tick]));
      expect(c.doseLabel).toBe('PCV series complete');
      expect(noteText(c)).not.toContain('Re-evaluate at age 50');
      expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
      expect(markers(c)).toBe(c.noteCites.length);
      // At 19 the card due is the PPSV23 that follows PCV15 — any card, not just PCV.
      expect(toddler('PCV15', [tick], '2042-09-07').recs.some((r) => r.dueToday)).toBe(true);
    });
  }

  it('the dose is untouched — wording and sources only', () => {
    for (const out of [toddler('PCV20'), toddler('PCV15', ['smoking']), toddler('PCV15')]) {
      expect(card(out).status).toBe('complete');
      expect(card(out).dueToday).toBe(false);
    }
  });
});
