// @vitest-environment happy-dom
// CDSI FINDING 1 — OWNER RULING 2026-11-08 (Ava and Ben).
//
// A baby under 2 months with no PCV doses was told "Due today: PCV dose 1 of 4"
// at every age from birth — 0, 7, 14, 28, 37 and 41 days alike. A first dose
// cannot count before 6 weeks (CDC: "minimum age: 6 weeks [PCV15], [PCV 20]"),
// and the routine age is 2 months. Found by CDC's CDSI test patient 2013-0575
// (a newborn), whose CDSI forecast is earliest 6 weeks, recommended 2 months.
//
// Her ruling, for EVERY baby under 2 months with no doses (her rule of
// 2026-10-24: the routine date, plus a comment on the earliest):
//   Ava, 2 weeks: "Due at 2 months, on Dec 25, 2026. It can be given from
//                  Dec 6 (age 6 weeks) if needed."
//   Ben, 7 weeks: "Due at 2 months, on [date]. It can be given today if needed."
// The day a baby turns 2 months is on time, not early, so it stays "due today"
// (P2-8, Mia).
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { recommend } from '../../logic/recommend.js';
import RecCard from '../RecCard.jsx';

const card = (input) => recommend({ riskIds: [], pcvDoses: [], ppsv23Doses: [], ...input }).recs.find((r) => r.vaccine === 'PCV');
const keys = (rec) => (rec.noteCites ?? []).map((c) => c.key);

describe('CDSI finding 1: a baby under 2 months with no doses is not told "due today"', () => {
  it('Ava, 2 weeks old: due Dec 25 (2 months), can be given from Dec 6 (6 weeks)', () => {
    const rec = card({ dob: '2026-10-25', today: '2026-11-08' });
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBe('2026-12-25');
    expect(rec.note.lead).toContain('Due at 2 months, on Dec 25, 2026.');
    expect(rec.note.lead).toContain('It can be given from Dec 6, 2026 (age 6 weeks) if needed [c].');
    expect(keys(rec)).toContain('pedsMinAge');
    // The badge must not read "Due" above "Next dose due Dec 25".
    expect(rec.status).toBe('routine');
    const { container } = render(<RecCard rec={rec} />);
    expect(container.querySelector('.next-date').textContent).toBe('Next dose due Dec 25, 2026');
    expect(container.querySelector('.due-pill')).toBeNull();
  });

  it('Ben, 7 weeks old: due at 2 months, and can be given today', () => {
    const rec = card({ dob: '2026-09-19', today: '2026-11-08' });
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBe('2026-11-19');
    expect(rec.note.lead).toContain('Due at 2 months, on Nov 19, 2026.');
    expect(rec.note.lead).toContain('It can be given today if needed, as the minimum age of 6 weeks has passed [c].');
  });

  it('a newborn on the day of birth (CDSI 2013-0575): CDSI\'s own two dates', () => {
    const rec = card({ dob: '2026-08-05', today: '2026-08-05' });
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBe('2026-10-05'); // CDSI recommended
    expect(rec.note.lead).toContain('It can be given from Sep 16, 2026 (age 6 weeks) if needed'); // CDSI earliest
  });

  it('a baby with a risk condition reads the same', () => {
    const rec = card({ dob: '2026-10-25', today: '2026-11-08', riskIds: ['asplenia'] });
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBe('2026-12-25');
    expect(rec.note.lead).toContain('Due at 2 months, on Dec 25, 2026.');
  });

  it('control: the day a baby turns 2 months, the first dose is due today, as before', () => {
    const rec = card({ dob: '2026-09-08', today: '2026-11-08' });
    expect(rec.dueToday).toBe(true);
    expect(rec.status).toBe('due');
    expect(rec.earliestNextDate).toBeNull();
    expect(rec.note.lead).not.toContain('Due at 2 months');
    expect(keys(rec)).not.toContain('pedsMinAge');
  });

  it('control: a 3-month-old with no doses is due today, as before', () => {
    const rec = card({ dob: '2026-08-01', today: '2026-11-08' });
    expect(rec.dueToday).toBe(true);
  });

  it('age entered without a date of birth: 1 month old, no date for the 6 weeks', () => {
    const rec = card({ ageMonths: 1, today: '2026-11-08' });
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBe('2026-12-08');
    expect(rec.note.lead).toContain('It can be given from age 6 weeks if needed [c].');
  });
});
