// §K-THROWNOUTTIMING (OWNER RULINGS 2026-11-01) — a PPSV23 that did not count
// still sets the date of the next conjugate.
//
// Her words, children: *"give PCV20 at least 8 weeks after the last PCV and at
// least 8 weeks after the invalid PPSV23, whichever date is later ... the
// 8-week PPSV23-to-PCV spacing is about immune response, not dose validity."*
// Asked whether a PCV20 given sooner then stops counting (Eli), she chose
// "Still counts (advise only)": the ADVISED date moves, the dose check does
// not, and the card states the earlier date it could be given — the C10-2
// rule for a card carrying two numbers.
//
// Adults: *"give PCV20 or PCV21 at least 1 year after whichever came later,
// the PCV or the PPSV23 ... After PCV15: the same 1-year interval applies. No
// PPSV23 is needed after that dose."*
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
// A card's note is a string on some cards and { lead, detail } on others.
const lead = (r) => (typeof r.note === 'string' ? r.note : r.note.lead);

// The toddler of §C-P2-FIVE: 25 months, diabetes, PPSV23 at 23½ months.
const TODDLER = {
  dob: '2024-09-30', today: '2026-11-01', riskIds: ['diabetes'],
  pcvDoses: d('PCV15', ['2024-11-30', '2025-01-30', '2025-03-30', '2025-09-30']),
  ppsv23Doses: d('PPSV23', ['2026-09-15']),
};
// Eli: asplenia; PCV13 Feb 1 and Apr 1, 2023; PPSV23 Apr 29 (28 days after
// the PCV13, thrown out); PCV20 Jun 1.
const ELI = {
  dob: '2020-06-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01']),
  ppsv23Doses: d('PPSV23', ['2023-04-29']),
};

describe('children — the PCV card waits 8 weeks after a PPSV23 that did not count', () => {
  it('the toddler: Option A PCV20 is advised from Nov 10, and may be given today', () => {
    const optionA = recommend(TODDLER).recs.find((r) => r.vaccine === 'PCV');
    expect(optionA.dueToday).toBe(false);
    expect(optionA.earliestNextDate).toBe('2026-11-10');
    expect(lead(optionA)).toContain('Advised ≥8 weeks after this child\'s PPSV23 of Sep 15, 2026, which did not count');
    expect(lead(optionA)).toContain('it can be given today if needed');
  });

  it('the toddler: Option B PPSV23 keeps its 5-year hold', () => {
    const optionB = recommend(TODDLER).recs.find((r) => r.vaccine === 'PPSV23');
    expect(optionB.earliestNextDate).toBe('2031-09-15');
  });

  it('Eli before his PCV20: advised Jun 24, 2023, and may be given from May 27', () => {
    const [card] = recommend({ ...ELI, today: '2023-05-10' }).recs;
    expect(card.vaccine).toBe('PCV');
    expect(card.earliestNextDate).toBe('2023-06-24');
    expect(lead(card)).toContain('it can be given from May 27, 2023 if needed');
  });

  it('Eli: his Jun 1 PCV20 still counts and his series is complete', () => {
    const out = recommend({ ...ELI, today: '2026-11-01', pcvDoses: [...ELI.pcvDoses, ...d('PCV20', ['2023-06-01'])] });
    expect(out.perDose.pcv[2].status).toBe('valid');
    expect(out.recs[0].status).toBe('complete');
  });

  it('once the 8 weeks have passed, nothing is added', () => {
    const [card] = recommend({ ...ELI, today: '2023-07-01' }).recs;
    expect(card.dueToday).toBe(true);
    expect(lead(card)).not.toContain('which did not count');
  });

  it('a PPSV23 that COUNTED is unchanged: its own 8-week hold, no new sentence', () => {
    const p = {
      dob: '2022-11-01', today: '2026-11-01', riskIds: ['asplenia'],
      pcvDoses: d('PCV13', ['2023-01-01', '2023-03-01', '2023-05-01', '2023-11-15']),
      ppsv23Doses: d('PPSV23', ['2026-10-01']),
    };
    for (const r of recommend(p).recs) expect(lead(r)).not.toContain('which did not count');
  });
});

describe('children — where the hold must NOT speak', () => {
  it('an EXTRA PPSV23 keeps its own hold (Ben) and is never called one that "did not count"', () => {
    const recs = recommend({
      dob: '2018-11-01', today: '2026-11-01', riskIds: ['diabetes'],
      pcvDoses: [], ppsv23Doses: d('PPSV23', ['2024-11-01', '2026-10-12']),
    }).recs;
    expect(recs[0].earliestNextDate).toBe('2026-12-07');
    for (const r of recs) expect(lead(r)).not.toContain('which did not count');
  });

  it('a finished series is left alone', () => {
    const [r] = recommend({
      ...TODDLER, pcvDoses: d('PCV20', ['2024-11-30', '2025-01-30', '2025-03-30', '2025-09-30']),
    }).recs;
    expect(r.status).toBe('complete');
    expect(lead(r)).not.toContain('which did not count');
  });

  it('a card already held later by its own PCV keeps that date (one max, never earlier)', () => {
    const [r] = recommend({
      dob: '2023-11-01', today: '2026-11-01', riskIds: ['diabetes'],
      pcvDoses: d('PCV13', ['2024-01-01', '2024-03-01']).concat(d('PCV15', ['2026-08-13', '2026-10-22'])),
      ppsv23Doses: d('PPSV23', ['2026-09-22']),
    }).recs;
    expect(r.earliestNextDate).toBe('2026-12-17');
    expect(lead(r)).not.toContain('Advised ≥8 weeks after this child');
  });
});

describe('adults — PCV20 or PCV21 at least 1 year after a PPSV23 that did not count', () => {
  it('PCV15, then a PPSV23 thrown out: PCV20 or PCV21 a year after the PPSV23, and no PPSV23', () => {
    // 19, diabetes: PCV15 at 18y11m and PPSV23 19 days later, under the child rules.
    const recs = recommend({
      dob: '2007-10-01', today: '2026-11-01', riskIds: ['diabetes'],
      pcvDoses: d('PCV15', ['2026-09-01']), ppsv23Doses: d('PPSV23', ['2026-09-20']),
    }).recs;
    expect(recs).toHaveLength(1);
    expect(recs[0].vaccine).toBe('PCV');
    expect(recs[0].brands.join(' ')).not.toMatch(/PCV15|PPSV23/);
    expect(recs[0].earliestNextDate).toBe('2027-09-20');
    expect(lead(recs[0])).toContain('No PPSV23 is needed after it');
  });

  it('the same at 19 with an immunocompromising condition: still a year, not 8 weeks', () => {
    const [r] = recommend({
      dob: '2007-10-15', today: '2026-11-01', riskIds: ['hiv'],
      pcvDoses: d('PCV15', ['2026-08-01']), ppsv23Doses: d('PPSV23', ['2026-08-22']),
    }).recs;
    expect(r.vaccine).toBe('PCV');
    expect(r.earliestNextDate).toBe('2027-08-22');
  });

  it('PCV15 in infancy, PPSV23 thrown out at 2: PCV20 or PCV21 due today, no PPSV23', () => {
    const recs = recommend({
      dob: '2006-09-01', today: '2026-11-01', riskIds: ['asplenia'],
      pcvDoses: d('PCV15', ['2006-11-01', '2007-01-01', '2007-03-01', '2008-09-01']),
      ppsv23Doses: d('PPSV23', ['2008-09-22']),
    }).recs;
    expect(recs).toHaveLength(1);
    expect([recs[0].vaccine, recs[0].dueToday]).toEqual(['PCV', true]);
    expect(recs[0].brands.join(' ')).not.toMatch(/PCV15|PPSV23/);
  });

  it('PCV13, then a PPSV23 thrown out: the year runs from whichever came later', () => {
    const [r] = recommend({
      dob: '2007-10-01', today: '2026-11-01', riskIds: ['diabetes'],
      pcvDoses: d('PCV13', ['2026-08-01']), ppsv23Doses: d('PPSV23', ['2026-08-22']),
    }).recs;
    expect(r.vaccine).toBe('PCV');
    expect(r.earliestNextDate).toBe('2027-08-22');
    expect(lead(r)).toContain('which did not count');
  });

  it('a PPSV23 BEFORE the PCV15 is not this rule: the PPSV23 after PCV15 is still offered', () => {
    const [r] = recommend({
      dob: '2006-09-01', today: '2026-11-01', riskIds: ['diabetes'],
      pcvDoses: d('PCV15', ['2025-10-01']), ppsv23Doses: d('PPSV23', ['2008-05-01']),
    }).recs;
    expect(r.vaccine).toBe('PPSV23');
  });
});
