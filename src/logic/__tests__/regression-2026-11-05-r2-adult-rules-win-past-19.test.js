// ── R2 (OWNER RULINGS 2026-11-05, on Tess, Rafi and Cal) ──────────────────
//
// A child's screen gave a date on or after the 19th birthday, and on that date
// the adult rules said something else: "Complete", or a different product, or
// a date a year later. CDC's child pages stop at 18 and no document carries a
// child's dose past 19, so the owner ruled the adult rules win, and that the
// screen says so from today.
//
// The answer is the adult card's own, for the same patient on the 19th
// birthday, so the two cannot drift apart. Nothing here is a second reading of
// the adult rules. `CLINICAL_SPEC.md` §B-AT19, 2026-11-05.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-05';
const ppsv = (...dates) => dates.map((date) => ({ product: 'PPSV23', date }));
const series = (product) => ['2012-12-11', '2013-02-11', '2013-04-11', '2013-10-11']
  .map((date) => ({ product, date }));
const noteOf = (c) => (typeof c.note === 'string' ? c.note : `${c.note?.lead ?? ''} ${c.note?.detail ?? ''}`);

const tess = { dob: '2012-10-11', riskIds: ['asplenia'], pcvDoses: series('PCV15'), ppsv23Doses: ppsv('2026-10-12') };
const rafi = { ...tess, pcvDoses: series('PCV13') };
const cal = { dob: '2007-12-05', riskIds: ['chronic_heart'], pcvDoses: [{ product: 'PCV15', date: TODAY }], ppsv23Doses: [] };

describe('Tess: the adult rules call her complete, so no dose is promised', () => {
  const r = recommend({ ...tess, today: TODAY });

  it('shows one card, and it asks for nothing', () => {
    expect(r.recs).toHaveLength(1);
    expect(r.recs[0].status).toBe('complete');
    expect(r.recs[0].doseLabel).toBe('Complete at 19 (PCV15 + PPSV23)');
    expect(r.recs[0].earliestNextDate).toBeNull();
  });

  it('says why in words, and the note has no date that is a dose', () => {
    const note = noteOf(r.recs[0]);
    expect(note).toMatch(/^No dose now\./);
    expect(note).toContain('19th birthday, Oct 11, 2031');
    expect(note).toContain('complete pneumococcal series');
  });

  it('still agrees with the screen on the day she turns 19', () => {
    const at19 = recommend({ ...tess, today: '2031-10-11' });
    expect(at19.recs[0].status).toBe('complete');
    expect(at19.recs[0].doseLabel).toBe('Complete (PCV15 + PPSV23)');
  });

  it('the single PCV15 version of her history gets the same answer', () => {
    const one = recommend({ ...tess, pcvDoses: [{ product: 'PCV15', date: '2026-08-10' }], today: TODAY });
    expect(one.recs.map((c) => c.doseLabel)).toEqual(['Complete at 19 (PCV15 + PPSV23)']);
  });
});

describe('Rafi: the dose stays, on the adult card', () => {
  const r = recommend({ ...rafi, today: TODAY });

  it('offers PCV20 or PCV21 on the same date, and no 2nd PPSV23', () => {
    expect(r.recs).toHaveLength(1);
    expect(r.recs[0].earliestNextDate).toBe('2031-10-12');
    expect(r.recs[0].dueToday).toBe(false);
    expect(r.recs[0].brands.map((b) => b.split(' ')[0])).toEqual(['PCV20', 'PCV21']);
  });

  it('says the adult schedule applies, and that a 2nd PPSV23 is not offered', () => {
    const note = noteOf(r.recs[0]);
    expect(note).toContain('turns 19 on Oct 11, 2031');
    expect(note).toContain('adult schedule applies');
    expect(note).toContain('A 2nd PPSV23 is not offered at 19');
  });

  it('keeps the PCV21 regional advisory off a 14-year-old\'s screen', () => {
    // OWNER 2026-11-06: the note waits for the adult schedule, at 19, however
    // early a card names PCV21 for the dose he will get then.
    expect(r.recs[0].brands.some((x) => x.includes('PCV21'))).toBe(true);
    expect(r.pcv21Geo).toBeNull();
  });

  it('keeps it off at 18 too, and shows it on the 19th birthday', () => {
    // Same line as every other patient: the adult schedule's own start.
    expect(recommend({ ...rafi, today: '2030-10-11' }).pcv21Geo).toBeNull();
    expect(recommend({ ...rafi, today: '2031-10-10' }).pcv21Geo).toBeNull();
    expect(recommend({ ...rafi, today: '2031-10-11' }).pcv21Geo).not.toBeNull();
  });
});

describe('Cal: the adult wait replaces the 8 weeks', () => {
  const r = recommend({ ...cal, today: TODAY });

  it('offers PPSV23 a year after the PCV15', () => {
    expect(r.recs).toHaveLength(1);
    expect(r.recs[0].earliestNextDate).toBe('2027-11-05');
    expect(r.recs[0].brands.map((b) => b.split(' ')[0])).toEqual(['PPSV23']);
  });

  it('does not say a 2nd PPSV23 is withheld: that sentence is Rafi\'s', () => {
    expect(noteOf(r.recs[0])).not.toContain('not offered at 19');
  });
});

describe('the sentence about a 2nd PPSV23 is only for someone offered one', () => {
  it('a thrown-out PCV21 at 17: the adult card applies, and no PPSV23 was on offer', () => {
    const r = recommend({
      dob: '2007-11-11', riskIds: ['asplenia'], today: '2026-10-11',
      pcvDoses: [{ product: 'PCV21', date: '2025-10-11' }], ppsv23Doses: ppsv('2026-10-11'),
    });
    expect(r.recs[0].earliestNextDate).toBe('2027-10-11');
    expect(noteOf(r.recs[0])).toContain('adult schedule applies');
    expect(noteOf(r.recs[0])).not.toContain('not offered at 19');
  });
});

describe('a child who reaches the dose before 19 does not change', () => {
  it('the girl two years younger keeps the child rules: dose at 17', () => {
    const r = recommend({
      ...tess, dob: '2014-10-11', pcvDoses: [{ product: 'PCV15', date: '2026-08-10' }], today: TODAY,
    });
    expect(r.recs.map((c) => c.doseLabel)).toEqual([
      '1 dose PCV20 (≥5 years after first PPSV23)', '2nd PPSV23 (alternative, ≥5 years after first)',
    ]);
    expect(r.recs[0].earliestNextDate).toBe('2031-10-12');
  });

  it('a date the day before the 19th birthday stays a child card', () => {
    const r = recommend({ ...tess, dob: '2012-10-13', today: TODAY });
    expect(r.recs.map((c) => c.doseLabel)).toContain('1 dose PCV20 (≥5 years after first PPSV23)');
  });

  it('a date ON the 19th birthday is already an adult answer', () => {
    const r = recommend({ ...tess, dob: '2012-10-12', today: TODAY });
    expect(r.recs.map((c) => c.doseLabel)).toEqual(['Complete at 19 (PCV15 + PPSV23)']);
  });
});

describe('an adult source on a child screen is declared', () => {
  it('every quoted citation on these cards says why it is there', () => {
    for (const p of [tess, rafi, cal]) {
      for (const c of recommend({ ...p, today: TODAY }).recs) {
        expect(c.noteCites.length).toBeGreaterThan(0);
        for (const ct of c.noteCites) expect(ct.aboutAnotherGroup, ct.key).toMatch(/adult schedule/);
      }
    }
  });
});

describe('a dose given anyway', () => {
  const pcv20 = (date) => ({ product: 'PCV20', date });

  it('at 18, under the child rules: counted, and the 5-year note stays', () => {
    const r = recommend({ ...tess, pcvDoses: [...tess.pcvDoses, pcv20('2030-11-01')], today: '2030-12-01' });
    const dose = r.perDose.pcv.at(-1);
    expect(dose.status).toBe('valid');
    expect(dose.earlyAdvisory).toBe(true);
    expect(dose.reasons.join(' ')).toContain('recommends 5 years');
  });

  it('after 19: accepted, and nothing is flagged', () => {
    const r = recommend({ ...tess, pcvDoses: [...tess.pcvDoses, pcv20('2031-10-12')], today: '2031-11-01' });
    expect(r.perDose.pcv.at(-1).status).toBe('valid');
    expect(r.perDose.pcv.at(-1).earlyAdvisory).toBeFalsy();
  });
});

describe('the record of how the answer was reached', () => {
  it('names the adult rules, and only when they answered', () => {
    const adult = recommend({ ...tess, today: TODAY }).path.map((p) => p.step);
    expect(adult).toContain('Adult rules answer');
    const child = recommend({ ...tess, dob: '2014-10-11', pcvDoses: [{ product: 'PCV15', date: '2026-08-10' }], today: TODAY });
    expect(child.path.map((p) => p.step)).not.toContain('Adult rules answer');
    expect(child.childCardsReplaced).toBeNull();
  });

  it('a date past 19 that the adult card makes due on the birthday is dated that birthday', () => {
    const r = recommend({
      dob: '2008-10-11', riskIds: ['asplenia'], today: '2026-10-11',
      pcvDoses: [{ product: '', date: '2025-10-11' }], ppsv23Doses: ppsv('2026-10-10'),
    });
    expect(r.recs[0].dueToday).toBe(false);
    expect(r.recs[0].earliestNextDate).toBe('2027-10-11');
  });
});
