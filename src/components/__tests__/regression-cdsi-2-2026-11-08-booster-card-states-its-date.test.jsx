// @vitest-environment happy-dom
// CDSI FINDING 2 — OWNER RULING 2026-11-08 (Nora), "Date plus reason".
//
// A baby whose next PCV is the final (booster) dose was told only "This final
// dose is not due until the patient reaches 12 months", with no date anywhere.
// The final dose also needs 8 weeks after the most recent one (CDC catch-up
// table, "8 weeks (as final dose)"). When those 8 weeks end AFTER the first
// birthday, the age the card named was too early, and the app's own checker
// throws out a dose given on it. Found by CDC's CDSI test patient 2013-0598.
//
// Nora, born Nov 1, 2025, PCV20 Jul 1 and Sep 15, 2026, seen Sep 20:
//   "This final dose is due on Nov 10, 2026: 8 weeks after the most recent
//    dose, which is after the 1st birthday."
// Control, last dose at 9 months: "This final dose is due at 12 months, on
// Nov 1, 2026." The card's top line carries the same date.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { recommend } from '../../logic/recommend.js';
import RecCard from '../RecCard.jsx';

const pcv = (dates) => dates.map((date) => ({ product: 'PCV20', date }));
const run = (input) => recommend({ riskIds: [], ppsv23Doses: [], ...input });
const card = (input) => run(input).recs.find((r) => r.vaccine === 'PCV');

describe('CDSI finding 2: the 12-month booster card states its date', () => {
  it('Nora: the 8 weeks end after her birthday, so Nov 10, and the reason', () => {
    const rec = card({ dob: '2025-11-01', today: '2026-09-20', pcvDoses: pcv(['2026-07-01', '2026-09-15']) });
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBe('2026-11-10');
    expect(rec.note.lead).toContain('This final dose is due on Nov 10, 2026: 8 weeks after the most recent dose, which is after the 1st birthday.');
    expect(`${rec.note.lead} ${rec.note.detail}`).not.toContain('not due until the patient reaches 12 months');
    const { container } = render(<RecCard rec={rec} />);
    expect(container.querySelector('.next-date').textContent).toBe('Next dose due Nov 10, 2026');
  });

  it('Nora given the dose on the date the card names: it counts and the series is complete', () => {
    const out = run({ dob: '2025-11-01', today: '2026-11-10', pcvDoses: pcv(['2026-07-01', '2026-09-15', '2026-11-10']) });
    expect(out.perDose.pcv.map((d) => d.status)).toEqual(['valid', 'valid', 'valid']);
    expect(out.recs.find((r) => r.vaccine === 'PCV').status).toBe('complete');
  });

  it('control: last dose at 9 months, so the birthday is the date', () => {
    const rec = card({ dob: '2025-11-01', today: '2026-09-20', pcvDoses: pcv(['2026-07-01', '2026-08-01']) });
    expect(rec.earliestNextDate).toBe('2026-11-01');
    expect(rec.note.lead).toContain('This final dose is due at 12 months, on Nov 1, 2026.');
  });

  it('CDSI 2013-0598: a 4th dose 5 days before the birthday is an extra infant dose; the booster is 8 weeks later', () => {
    const rec = card({ dob: '2025-08-10', today: '2026-08-05',
      pcvDoses: [['2025-10-10'], ['2025-12-10'], ['2026-02-10'], ['2026-08-05']].map(([date]) => ({ product: 'PCV15', date })) });
    expect(rec.earliestNextDate).toBe('2026-09-30'); // CDSI's earliest and recommended
    expect(rec.note.lead).toContain('This final dose is due on Sep 30, 2026: 8 weeks after the most recent dose');
  });

  it('a routine baby with 3 doses by 6 months: due at 12 months, on her birthday', () => {
    const rec = card({ dob: '2026-01-10', today: '2026-08-01', pcvDoses: pcv(['2026-03-10', '2026-05-10', '2026-07-10']) });
    expect(rec.earliestNextDate).toBe('2027-01-10');
    expect(rec.note.lead).toContain('This final dose is due at 12 months, on Jan 10, 2027.');
  });

  it('age entered without a date of birth still gets a date', () => {
    const rec = card({ ageMonths: 7, today: '2026-08-01', pcvDoses: pcv(['2026-03-10', '2026-05-10', '2026-07-10']) });
    expect(rec.earliestNextDate).toBe('2027-01-01');
    expect(rec.note.lead).toContain('This final dose is due at 12 months, on Jan 1, 2027.');
  });
});
