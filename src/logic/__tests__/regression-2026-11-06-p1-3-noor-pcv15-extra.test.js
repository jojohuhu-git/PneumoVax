// ── P1-3 (OWNER RULING 2026-11-06, on Noor: "Yes, flag it extra") ─────────
//
// Noor, 10, HIV. PCV13 at 2, 4, 6 and 12 months, PPSV23 at 5, then a PCV15. For
// that history CDC offers PCV20 or a 2nd PPSV23 and no PCV15 (child notes,
// immunocompromising list, age 6-18, read live 2026-11-06), so the card never
// asked for the dose and the chip used to read plain "valid". It is now an
// extra dose. The next dose still waits 8 weeks after it, because CDC counts
// from "the most recent PCV dose", which it is.
//
// SCOPED TO HER PATIENT. Other unasked-for conjugates (no PPSV23 yet, a healthy
// child, a series finished by PCV20) were not ruled on, so the controls below
// keep them as they were. `CLINICAL_SPEC.md` §C-P1-3.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { allPatients } from '../../../scripts/wholeApp/replay.mjs';

const DOB = '2016-10-11';
const babySeries = ['2016-12-11', '2017-02-11', '2017-04-11', '2017-10-11'].map((date) => ({ product: 'PCV13', date }));
const ppsv = (...dates) => dates.map((date) => ({ product: 'PPSV23', date }));
const PCV15_ON = '2026-09-27';
const pcv15 = { product: 'PCV15', date: PCV15_ON };
const noor = (over = {}) => recommend({
  dob: DOB, riskIds: ['hiv'], today: '2026-10-11', pcvDoses: [...babySeries, pcv15], ppsv23Doses: ppsv('2021-10-11'), ...over,
});
const chipFor = (r, date) => r.perDose.pcv[r.orderedDoses.pcv.findIndex((d) => d.date === date)];
const noteOf = (c) => `${c.note?.lead ?? c.note} ${c.note?.detail ?? ''}`;

describe('Noor: the PCV15 is an extra dose', () => {
  const r = noor();
  const chip = chipFor(r, PCV15_ON);

  it('the chip says extra, and it does not count', () => {
    expect(chip.extraDose).toBe(true);
    expect(chip.effectiveDoseNum).toBeNull();
  });

  it('the chip says why, and that nothing is repeated', () => {
    const text = chip.reasons.join(' ');
    expect(text).toContain('Not needed');
    expect(text).toContain('PCV20 or a 2nd PPSV23');
    expect(text).toContain('nothing needs to be repeated');
  });

  it('the four PCV13 doses and the PPSV23 are untouched', () => {
    expect(r.perDose.pcv.slice(0, 4).every((d) => d.status === 'valid' && d.effectiveDoseNum)).toBe(true);
    expect(r.perDose.ppsv23[0].status).toBe('valid');
  });

  it('both cards still wait 8 weeks after the PCV15', () => {
    expect(r.recs.map((c) => c.earliestNextDate)).toEqual(['2026-11-22', '2026-11-22']);
  });

  it('both cards name the PCV15 as what they are waiting for', () => {
    for (const c of r.recs) expect(noteOf(c)).toContain('8 weeks after the PCV15 of Sep 27, 2026');
  });

  it('the card reads the row she followed, not the at-or-after-6 row', () => {
    const keys = r.recs[0].noteCites.map((c) => c.key);
    expect(keys).toContain('pedsIcBefore6NoPcv20At6to18');
    expect(keys).not.toContain('pedsIcPcv13AndPpsvAt6');
    expect(keys).not.toContain('pedsPcv13Pcv15Interchangeable');
  });
});

describe('What happens next', () => {
  it('a PPSV23 two weeks after the extra PCV15 is thrown out, so the 8 weeks is real', () => {
    const r = noor({ today: '2026-10-11', ppsv23Doses: ppsv('2021-10-11', '2026-10-11') });
    expect(r.perDose.ppsv23[1].status).toBe('invalid');
  });

  it('the same PPSV23 on the advised date counts, and the series moves on', () => {
    const r = noor({ today: '2026-11-22', ppsv23Doses: ppsv('2021-10-11', '2026-11-22') });
    expect(r.perDose.ppsv23[1].status).toBe('valid');
    expect(r.perDose.ppsv23[1].extraDose).toBeFalsy();
  });

  it('a PCV20 on the advised date counts', () => {
    const r = noor({ today: '2026-11-22', pcvDoses: [...babySeries, pcv15, { product: 'PCV20', date: '2026-11-22' }] });
    expect(chipFor(r, '2026-11-22').status).toBe('valid');
    expect(chipFor(r, '2026-11-22').extraDose).toBeFalsy();
  });

  it('a PCV20 two weeks after the extra PCV15 is thrown out, and the wait stays', () => {
    const r = noor({ pcvDoses: [...babySeries, pcv15, { product: 'PCV20', date: '2026-10-11' }] });
    expect(chipFor(r, '2026-10-11').status).toBe('invalid');
    expect(r.recs[0].earliestNextDate).toBe('2026-11-22');
  });

  it('with the 8 weeks past, the cards are due and the wait line is gone', () => {
    const r = noor({ today: '2027-01-15' });
    expect(r.recs.every((c) => c.dueToday)).toBe(true);
    expect(noteOf(r.recs[0])).not.toContain('8 weeks after the PCV15');
  });
});

describe('Controls: she ruled on Noor, not on these', () => {
  it('no PCV before the PCV15: CDC offers it, so it counts', () => {
    const r = noor({ pcvDoses: [pcv15] });
    expect(chipFor(r, PCV15_ON).extraDose).toBeFalsy();
    expect(chipFor(r, PCV15_ON).effectiveDoseNum).toBe(1);
  });

  it('no PPSV23 yet: left as it was', () => {
    expect(chipFor(noor({ ppsv23Doses: [] }), PCV15_ON).extraDose).toBeFalsy();
  });

  it('a child with no immunocompromising condition: left as it was', () => {
    expect(chipFor(noor({ riskIds: ['chronic_heart'] }), PCV15_ON).extraDose).toBeFalsy();
  });

  it('a series finished with PCV20: left as it was', () => {
    const pcvDoses = [...babySeries.map((d) => ({ ...d, product: 'PCV20' })), pcv15];
    expect(chipFor(noor({ pcvDoses }), PCV15_ON).extraDose).toBeFalsy();
  });

  it('two PPSV23 doses: left as it was', () => {
    expect(chipFor(noor({ ppsv23Doses: ppsv('2019-10-11', '2024-10-11') }), PCV15_ON).extraDose).toBeFalsy();
  });

  it('a PPSV23 given AFTER the PCV15 does not make the PCV15 extra', () => {
    // The one path that hands over later doses: `analyzeHistory` for a single
    // stream. The two-stream walk has not reached a later dose yet.
    const { perDose } = analyzeHistory('PCV', [...babySeries, pcv15], 120, '2026-11-30', DOB, {
      ppsv23Doses: ppsv('2026-11-29'), riskIds: ['hiv'],
    });
    expect(perDose.at(-1).extraDose).toBeFalsy();
  });

  it('a conjugate on record at or after 6, before the PCV15: left as it was', () => {
    const pcvDoses = [{ product: 'PCV13', date: '2024-10-11' }, pcv15];
    expect(chipFor(noor({ pcvDoses }), PCV15_ON).extraDose).toBeFalsy();
  });

  it('an unrecorded product in the series: left as it was', () => {
    const pcvDoses = [{ product: '', date: '2017-10-11' }, pcv15];
    expect(chipFor(noor({ pcvDoses }), PCV15_ON).extraDose).toBeFalsy();
  });

  it('a PCV15 at 5, before the row for age 6-18 begins: left as it was', () => {
    const r = noor({
      today: '2022-06-01',
      pcvDoses: [...babySeries, { product: 'PCV15', date: '2022-05-01' }],
      ppsv23Doses: ppsv('2020-10-11'),
    });
    expect(chipFor(r, '2022-05-01').extraDose).toBeFalsy();
  });

  it('once she is 19 the adult rows read every dose received, as they do for PPSV23', () => {
    const r = noor({ today: '2035-10-11' });
    expect(chipFor(r, PCV15_ON).extraDose).toBeFalsy();
  });
});

describe('A teenager whose next dose falls past 19: the adult answer stands', () => {
  // Same history, but the PPSV23 came at 14, so five years ends after the 19th
  // birthday and the adult card answers from today. That card counts the PCV15.
  const teen = (today) => recommend({
    dob: '2011-10-11', riskIds: ['asplenia'], today,
    pcvDoses: [...['2011-12-11', '2012-02-11', '2012-04-11', '2012-10-11'].map((date) => ({ product: 'PCV13', date })), { product: 'PCV15', date: '2026-09-27' }],
    ppsv23Doses: ppsv('2025-10-11'),
  });

  it('the chip does not call extra the dose the card calls complete', () => {
    const r = teen('2026-10-11');
    expect(r.recs[0].doseLabel).toBe('Complete at 19 (PCV15 + PPSV23)');
    expect(chipFor(r, '2026-09-27').extraDose).toBeFalsy();
    expect(chipFor(r, '2026-09-27').effectiveDoseNum).toBeGreaterThan(0);
  });

  it('the record on the answer agrees with the chip', () => {
    const step = teen('2026-10-11').path.find((p) => p.step === 'Doses already given' || p.title === 'Doses already given');
    expect(JSON.stringify(step)).not.toMatch(/extra/i);
  });
});

describe('The size of it, so a wider rule fails here', () => {
  it('flags exactly the patients with her history', () => {
    let flagged = 0;
    for (const p of allPatients()) {
      const r = recommend(p.input);
      if ((r.perDose?.pcv ?? []).some((d) => d.extraDose && d.notAskedFor)) flagged += 1;
    }
    expect(flagged).toBe(3442);
  });
});
