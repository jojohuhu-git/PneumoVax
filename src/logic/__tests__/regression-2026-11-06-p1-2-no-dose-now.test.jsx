// @vitest-environment happy-dom
// P1-2 / R5 (OWNER RULING 2026-11-06) — "Complete" is not used while the patient
// still owes a dose on the schedule they are on now.
//
// Her rule of 2026-11-01: "Complete should only be used if no additional
// doses/boosters are needed." Shown three patients in the question box:
//
//   Sadie, 15 months, no spleen, PCV13 at 2, 4, 6, 12 months: a dose falls due at 2.
//   Ola, 45, diabetes, PCV13 and PPSV23: a dose is recommended at 50.
//   Iris, 7, cochlear implant, PCV13 series and PPSV23: the adult schedule gives
//   a dose at 19.
//
// she chose "Sadie and Ola": both still owe a dose on their CURRENT schedule. Iris's
// childhood series is finished, so she keeps "Complete" and stays folded.
//
// Found while asking, and what makes this more than a word: a "Complete" result
// folds shut, and both sentences naming the later dose were behind "Why this". So
// the sentence moved to the part that shows, not just the label.
//
// NO DOSE OR DATE MOVES. Both cards still have no date and nothing due today.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { recommend } from '../recommend.js';
import { addCalendarMonths } from '../dateUtils.js';
import { buildCases, buildTypicalCases } from '../../test-grid.js';
import RecCard from '../../components/RecCard.jsx';

const TODAY = '2026-11-06';
const Y = 12;
const baby = (p) => [[p, 2], [p, 4], [p, 6], [p, 12]];
const patient = (ageM, riskIds, pcv = [], ppsv = []) => {
  const dob = addCalendarMonths(TODAY, -ageM);
  return {
    dob, riskIds, today: TODAY,
    pcvDoses: pcv.map(([product, at]) => ({ product, date: addCalendarMonths(dob, at) })),
    ppsv23Doses: ppsv.map((at) => ({ product: 'PPSV23', date: addCalendarMonths(dob, at) })),
  };
};
const only = (p) => {
  const { recs } = recommend(p);
  expect(recs).toHaveLength(1);
  return recs[0];
};
const lead = (c) => (typeof c.note === 'string' ? c.note : c.note.lead);
const text = (c) => (typeof c.note === 'string' ? c.note : `${c.note.lead} ${c.note.detail}`);

const sadie = patient(15, ['asplenia'], baby('PCV13'));
const ola = patient(45 * Y, ['diabetes'], [['PCV13', 40 * Y]], [41 * Y]);
const iris = patient(7 * Y, ['cochlear_implant'], baby('PCV13'), [5 * Y]);

describe('Sadie: a dose still falls due on the childhood schedule', () => {
  it('reads "No dose now", and says "up to date", never "complete"', () => {
    const card = only(sadie);
    expect(card.status).toBe('no-dose-now');
    expect(card.doseLabel).toBe('PCV series up to date for age (4 doses)');
    expect(`${card.doseLabel} ${text(card)}`).not.toMatch(/complete/i);
  });

  it('says what falls due at 2 in the part that shows, not behind "Why this"', () => {
    expect(lead(only(sadie))).toMatch(/One further dose falls due at age 2 years: 1 dose of PCV20, or 1 dose of PPSV23 given ≥8 weeks after the most recent PCV dose/);
  });

  it('moves no dose and no date', () => {
    const card = only(sadie);
    expect(card.dueToday).toBe(false);
    expect(card.earliestNextDate ?? null).toBeNull();
  });

  it('keeps each citation on its own claim, in order', () => {
    const card = only(sadie);
    expect((card.noteCites ?? []).map((c) => c.key)).toEqual(['pedsRoutine4Dose', 'pedsIcPcv20orPpsv23']);
    expect(lead(card).split('[c]')).toHaveLength(3);
  });

  it('applies to the same baby without a spleen on PCV15, and a non-immunocompromised baby', () => {
    expect(only(patient(15, ['asplenia'], baby('PCV15'))).status).toBe('no-dose-now');
    expect(only(patient(15, ['chronic_heart'], baby('PCV13'))).status).toBe('no-dose-now');
  });

  it('applies to a toddler owed 2 doses from the 2nd birthday', () => {
    const card = only(patient(15, ['asplenia'], [['PCV13', 12], ['PCV13', 14]]));
    expect(card.status).toBe('no-dose-now');
    expect(card.doseLabel).toBe('PCV series up to date for age (2 doses)');
    expect(lead(card)).toMatch(/2 more PCV doses fall due from the 2nd birthday/);
    expect(`${card.doseLabel} ${text(card)}`).not.toMatch(/complete/i);
  });
});

describe('a toddler on PCV20 is still owed 2 doses at 2', () => {
  // Her rows key on the dose count, not the product (§L-T1-12TO23), so PCV20
  // does not make this child "Complete". Found by a deliberate break that no
  // other test here noticed.
  it('reads "No dose now", unlike the baby whose 4-dose series included PCV20', () => {
    const card = only(patient(15, ['asplenia'], [['PCV20', 12], ['PCV20', 14]]));
    expect(card.status).toBe('no-dose-now');
    expect(card.doseLabel).toBe('PCV series up to date for age (2 doses)');
    expect(lead(card)).toMatch(/2 more PCV doses fall due from the 2nd birthday/);
  });
});

describe('Ola: a dose is recommended at 50, on the adult schedule she is already on', () => {
  it('reads "No dose now", with her heading unchanged', () => {
    const card = only(ola);
    expect(card.status).toBe('no-dose-now');
    expect(card.doseLabel).toBe('No dose now — review at age 50');
  });

  it('says what is recommended at 50 in the part that shows', () => {
    expect(lead(only(ola))).toMatch(/At age 50, a dose of PCV20 or PCV21 is recommended, ≥5 years after the last pneumococcal dose/);
  });

  it('moves no dose and no date', () => {
    const card = only(ola);
    expect(card.dueToday).toBe(false);
    expect(card.earliestNextDate ?? null).toBeNull();
  });
});

describe('who keeps "Complete"', () => {
  it('Iris: her next dose belongs to the adult schedule, and she stays folded', () => {
    const card = only(iris);
    expect(card.status).toBe('complete');
    expect(card.doseLabel).toMatch(/^PCV series complete/);
  });

  it('a baby whose series includes PCV20: nothing further at any age', () => {
    const [p, ...rest] = baby('PCV20');
    const card = only(patient(15, ['asplenia'], [p, ...rest]));
    expect(card.status).toBe('complete');
    expect(card.doseLabel).toBe('PCV series complete (4 doses)');
  });

  it('a healthy baby', () => {
    const card = only(patient(15, [], baby('PCV13')));
    expect(card.status).toBe('complete');
    expect(card.doseLabel).toBe('PCV series complete (4 doses)');
  });
});

describe('a teenager whose adult card will read "No dose now" still hears about it', () => {
  // The readers that ask "does this card ask for nothing?" must count the new
  // label as asking for nothing, or the teenager's at-19 lines change meaning.
  it('a 15-year-old with an adult-only risk factor is not told the adult schedule recommends a dose', () => {
    const card = only(patient(15 * Y, ['chronic_heart', 'smoking'], [...baby('PCV13')], [5 * Y]));
    expect(card.status).toBe('complete');
    expect(text(card)).toMatch(/At 19, the adult schedule gives no dose now; re-evaluate at age 50/);
  });
});

describe('a teenager whose only tick is an adult risk factor', () => {
  it('is not told the adult schedule recommends a dose when the adult card reads "No dose now"', () => {
    const card = only(patient(15 * Y, ['smoking'], baby('PCV13'), [5 * Y]));
    expect(text(card)).not.toMatch(/recommends a dose/);
  });
});

describe('what shows on the screen', () => {
  const show = (p) => {
    const { recs } = recommend(p);
    render(<RecCard rec={recs[0]} today={p.today} dob={p.dob} />);
  };

  it('Sadie: open, labelled "No dose now", with the dose at 2 readable without a click', () => {
    show(sadie);
    expect(screen.getByTestId('rec-card').className).not.toMatch(/rec-card-collapsed/);
    expect(screen.getByTestId('rec-card').textContent).toMatch(/No dose now/);
    expect(screen.getByTestId('rec-card').textContent).toMatch(/One further dose falls due at age 2 years/);
    expect(screen.getByTestId('rec-card').textContent).not.toMatch(/Complete/);
  });

  it('Ola: open, with the dose at 50 readable without a click', () => {
    show(ola);
    expect(screen.getByTestId('rec-card').className).not.toMatch(/rec-card-collapsed/);
    expect(screen.getByTestId('rec-card').textContent).toMatch(/At age 50, a dose of PCV20 or PCV21 is recommended/);
    expect(screen.getByTestId('rec-card').textContent).not.toMatch(/Complete/);
  });

  it('Iris: still folded, still "Complete"', () => {
    show(iris);
    expect(screen.getByTestId('rec-card').className).toMatch(/rec-card-collapsed/);
    expect(screen.getByTestId('rec-card').textContent).toMatch(/Complete/);
  });
});

describe('the whole patient list', () => {
  const cards = [...buildCases(), ...buildTypicalCases()].flatMap((c) => {
    const r = recommend(c.input);
    return r.excluded ? [] : r.recs.map((card) => ({ key: c.key, card }));
  });

  it('no "Complete" card still names a dose on the schedule the patient is on', () => {
    const wrong = cards.filter(({ card }) => card.status === 'complete'
      && (card.doseLabel === 'No dose now — review at age 50' || /falls? due (at age 2|from the 2nd birthday)/.test(text(card))));
    expect(wrong.map((w) => w.key)).toEqual([]);
  });

  it('the new label reaches exactly the patients she was shown', () => {
    const labels = {};
    for (const { card } of cards) {
      if (card.status === 'no-dose-now') labels[card.doseLabel] = (labels[card.doseLabel] ?? 0) + 1;
    }
    expect(labels).toEqual({ 'No dose now — review at age 50': 369 });
  });
});
