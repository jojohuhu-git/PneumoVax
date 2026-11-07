// Two owner rulings of 2026-11-07, both about a HEALTHY child's last word.
//
// P2-6 / R7 — "Add it under Why this". A healthy baby whose PCV series is
// complete read "The age-appropriate PCV series appears complete" and nothing
// else, while the healthy 24-59-month child with the same doses is told
// "Re-evaluate at age 50". Shown a 14-month-old with four PCV15, she chose the
// same sentence and citation on the baby's card. Run forward, that baby reads
// "Not indicated (no risk, <50y)" at 19 and is owed a PPSV23 at 50, so 50 is the
// next event. Two limits, each from running the patient forward:
//   • a series that includes PCV20 reads "Complete" at 50 — no line;
//   • an ADULT-only tick (smoking, alcohol use disorder) gets a dose at 19 —
//     no line, because "50" would name the wrong age (P2-5's finding).
//
// G34 — "Confirm Not indicated". A healthy 5-year-old (5y 0m) with one PCV at 2
// months is not caught up; the same child at 4y 11m is. CDC's notes ("Healthy
// children ages 2–4 years with any incomplete PCV series: 1 dose PCV") and AAP's
// pneumococcal page (last updated 10/09/2025, read live 2026-11-07: catch-up
// for "Healthy children ages 24 – 59 months with incomplete PCV vaccination
// status") agree. Nothing changed in the engine; this pins the line.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-07';
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const AGE_50 = 'Re-evaluate at age 50, when routine pneumococcal vaccination begins for every adult [c].';
const INFANT_DATES = ['2025-11-07', '2026-01-07', '2026-03-07', '2026-09-07'];

function baby(product, riskIds = []) {
  return recommend({
    dob: '2025-09-07', today: TODAY, riskIds, ppsv23Doses: [],
    pcvDoses: INFANT_DATES.map((date) => ({ product, date })),
  });
}
const pcvCard = (out) => out.recs.find((r) => r.vaccine === 'PCV');

describe('R7: the healthy baby whose series is complete', () => {
  it('four PCV15: the card carries the age-50 sentence, cited to the adult schedule', () => {
    const card = pcvCard(baby('PCV15'));
    expect(card.status).toBe('complete');
    expect(card.doseLabel).toBe('PCV series complete (4 doses)');
    expect(noteText(card)).toContain(AGE_50);
    const last = card.noteCites[card.noteCites.length - 1];
    expect(last.key).toBe('adultRoutine50');
    expect(last.aboutAnotherGroup).toMatch(/routine adult vaccination begins/);
    // Markers and cites move together, or the numbers slide.
    expect((noteText(card).match(/\[c\]/g) ?? []).length).toBe(card.noteCites.length);
  });

  it('and it is under "Why this", as she chose — not on the opened card', () => {
    // `detail` is what the card shows under "Why this"; `lead` shows when opened.
    const card = pcvCard(baby('PCV15'));
    expect(card.note.detail).toBe(AGE_50);
    expect(card.note.lead).not.toContain('Re-evaluate');
  });

  it('the reason it belongs: nothing at 19, a dose at 50', () => {
    const at = (today) => recommend({
      dob: '2025-09-07', today, riskIds: [], ppsv23Doses: [],
      pcvDoses: INFANT_DATES.map((date) => ({ product: 'PCV15', date })),
    }).recs;
    expect(at('2044-09-07').map((r) => r.status)).toEqual(['not-indicated']);
    // At 50 the card due is the PPSV23 that follows PCV15.
    expect(at('2075-09-07').some((r) => r.dueToday)).toBe(true);
  });

  it('a series that includes PCV20 gets no line: at 50 it already reads Complete', () => {
    expect(noteText(pcvCard(baby('PCV20')))).not.toContain('Re-evaluate at age 50');
    const at50 = pcvCard(recommend({
      dob: '2025-09-07', today: '2075-09-07', riskIds: [], ppsv23Doses: [],
      pcvDoses: INFANT_DATES.map((date) => ({ product: 'PCV20', date })),
    }));
    expect(at50.status).toBe('complete');
  });

  it('an adult-only tick gets no line: the adult schedule acts at 19, not 50', () => {
    for (const tick of ['smoking', 'alcoholism']) {
      expect(noteText(pcvCard(baby('PCV15', [tick])))).not.toContain('Re-evaluate at age 50');
    }
  });

  it('the dose is untouched — wording and sources only', () => {
    const card = pcvCard(baby('PCV15'));
    expect(card.dueToday).toBe(false);
    expect(card.earliestNextDate ?? null).toBe(null);
  });
});

describe('G34: a healthy 5-year-old with one PCV dose is not caught up (confirmed 2026-11-07)', () => {
  const oneDose = (dob, dose) => pcvCard(recommend({
    dob, today: TODAY, riskIds: [], ppsv23Doses: [], pcvDoses: [{ product: 'PCV20', date: dose }],
  }));

  it('at 5 years 0 months: Not indicated', () => {
    const card = oneDose('2021-11-07', '2022-01-07');
    expect(card.status).toBe('not-indicated');
    expect(card.doseLabel).toBe('Not indicated (healthy 5–18y)');
  });

  it('the control, one month younger at 4 years 11 months: one dose due today', () => {
    const card = oneDose('2021-12-07', '2022-02-07');
    expect(card.status).toBe('catchup');
    expect(card.dueToday).toBe(true);
  });
});
