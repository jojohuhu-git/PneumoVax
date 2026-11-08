// @vitest-environment happy-dom
// OWNER RULING 2026-11-07 — Remy, "Next dose due Jan 29, 2027".
//
// Remy is 7 months, HIV, PCV20 on Nov 6 and Dec 4. On Dec 4 the top of her
// card read "Not yet due — eligible Jan 29, 2027" while the note under it said
// "it can be given from Jan 1, 2027 if needed, which is the minimum interval of
// 4 weeks". "Eligible" named the later date; the note named an earlier one.
// For a 10-week-old with a first dose 4 weeks ago it was worse: "Not yet due —
// eligible Dec 29" over "it can be given today if needed".
//
// The date on the top line is the ADVISED date (the routine date, Rulings A and
// C of 2026-10-23), and the 2026-10-24 ruling is that the card states the
// routine date and comments on the earliest. So the top line now says "due".
// Wording only: no date, verdict or note moves. Hand-built babies: 2,595 of
// 9,546 not-yet-due cards named an earlier date or "today" beneath "eligible";
// the grid reaches 0 of them.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { fmtDate } from '../../logic/format.js';
import { recommend } from '../../logic/recommend.js';
import RecCard from '../RecCard.jsx';

const pcv = (dates) => dates.map((date) => ({ product: 'PCV20', date }));
const card = (input) => recommend({ ppsv23Doses: [], ...input }).recs.find((r) => r.vaccine === 'PCV');
const show = (rec) => render(<RecCard rec={rec} />);

describe('Remy: the top line says when the next dose is DUE, not when it is "eligible"', () => {
  it('Remy on Dec 4: "Next dose due Jan 29, 2027", and the note still names Jan 1', () => {
    const rec = card({ today: '2026-12-04', dob: '2026-05-06', riskIds: ['hiv'], pcvDoses: pcv(['2026-11-06', '2026-12-04']) });
    expect(rec.earliestNextDate).toBe('2027-01-29');
    const { container } = show(rec);
    expect(container.querySelector('.next-date').textContent).toBe('Next dose due Jan 29, 2027');
    expect(container.textContent).not.toMatch(/eligible/i);
    expect(container.textContent).not.toContain('Not yet due');
  });

  it('the 10-week-old whose minimum has passed: the top line gives the due date, the note keeps "today"', () => {
    const rec = card({ today: '2026-11-07', dob: '2026-08-29', riskIds: [], pcvDoses: pcv(['2026-10-10']) });
    expect(rec.dueToday).toBe(false);
    expect(rec.note.lead).toContain('it can be given today if needed');
    const { container } = show(rec);
    expect(container.querySelector('.next-date').textContent).toBe(`Next dose due ${fmtDate(rec.earliestNextDate)}`);
    expect(container.textContent).not.toMatch(/eligible/i);
  });

  it('a card due today shows no date line at all (unchanged)', () => {
    const rec = card({ today: '2026-11-07', dob: '2026-09-07', riskIds: [], pcvDoses: [] });
    expect(rec.dueToday).toBe(true);
    const { container } = show(rec);
    expect(container.querySelector('.next-date')).toBeNull();
  });
});
