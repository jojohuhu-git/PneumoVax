// ── P1-3, the open half (OWNER RULINGS 2026-11-06, four patients) ───────────
//
// A child's conjugate nobody asked for. Noor's family was ruled first; these
// are the others, each answered on a named patient. `CLINICAL_SPEC.md` §C-P1-3.
//
//   Theo   no spleen, finished: "No, still complete"
//   Mateo  cochlear implant, finished: "Yes, PCV15 and PCV20"
//   Lena   cochlear implant, no PPSV23 yet: "Yes, flag it extra"
//   Ben    healthy, had earlier doses: "Yes, Ben only" (so not Priya)
//
// "Asked for" is read off the card the patient had on the day of the dose, not
// worked out a second time. The controls below are the histories that card DID
// ask for, or that she was not asked about.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { allPatients } from '../../../scripts/wholeApp/replay.mjs';

const DOB = '2018-10-11';
const TODAY = '2026-11-06';
const EXTRA_ON = '2026-10-23';      // two weeks ago
const WAIT_UNTIL = '2026-12-18';    // eight weeks after it
const series = (product = 'PCV13') => ['2018-12-11', '2019-02-11', '2019-04-11', '2019-10-11'].map((date) => ({ product, date }));
const given = (product) => ({ product, date: EXTRA_ON });
const ppsv = (...dates) => dates.map((date) => ({ product: 'PPSV23', date }));
const AT_2 = '2020-10-11';
const AT_7 = '2025-10-11';
const child = (riskIds, pcvDoses, ppsv23Doses = []) => recommend({ dob: DOB, today: TODAY, riskIds, pcvDoses, ppsv23Doses });
const chipFor = (r, date) => r.perDose.pcv[r.orderedDoses.pcv.findIndex((d) => d.date === date)];
const reasons = (c) => c.reasons.join(' ');
const citesOf = (card) => card.noteCites.map((c) => c.key);

describe('Theo: finished, and a PCV15 does not make him owe another dose', () => {
  const twoPpsv = ppsv(AT_2, AT_7);
  const before = child(['asplenia'], series(), twoPpsv);
  const r = child(['asplenia'], [...series(), given('PCV15')], twoPpsv);

  it('the control: without the PCV15 he is complete', () => {
    expect(before.recs.map((c) => c.status)).toEqual(['complete']);
  });

  it('with it he is still complete, and no PCV20 is asked for', () => {
    expect(r.recs.map((c) => c.status)).toEqual(['complete']);
    expect(r.recs[0].doseLabel).toBe(before.recs[0].doseLabel);
    expect(r.recs[0].earliestNextDate ?? null).toBeNull();
  });

  it('the PCV15 is extra, and says why', () => {
    const chip = chipFor(r, EXTRA_ON);
    expect(chip.extraDose).toBe(true);
    expect(chip.effectiveDoseNum).toBeNull();
    expect(reasons(chip)).toContain('Not needed');
    expect(reasons(chip)).toContain('already complete');
    expect(reasons(chip)).toContain('Do not repeat');
  });

  it('his earlier doses are untouched', () => {
    expect(r.perDose.pcv.slice(0, 4).every((d) => d.status === 'valid' && d.effectiveDoseNum)).toBe(true);
    expect(r.perDose.ppsv23.every((d) => d.status === 'valid' && !d.extraDose)).toBe(true);
  });
});

describe('Mateo: finished, so any conjugate after that is extra', () => {
  const onePpsv = ppsv(AT_2);
  const before = child(['cochlear_implant'], series(), onePpsv);

  for (const product of ['PCV15', 'PCV20']) {
    describe(product, () => {
      const r = child(['cochlear_implant'], [...series(), given(product)], onePpsv);

      it('the dose is extra', () => {
        expect(chipFor(r, EXTRA_ON).extraDose).toBe(true);
        expect(chipFor(r, EXTRA_ON).effectiveDoseNum).toBeNull();
      });

      it('at 19 the dose counts, the adult card says complete, and the child card carries no line', () => {
        // Owner, 2026-11-06, shown this on Theo: leave it.
        const at19 = recommend({ dob: DOB, today: '2037-10-11', riskIds: ['cochlear_implant'], pcvDoses: [...series(), given(product)], ppsv23Doses: onePpsv });
        expect(at19.recs[0].status).toBe('complete');
        expect(chipFor(at19, EXTRA_ON).effectiveDoseNum).toBe(5);
        expect(`${r.recs[0].note.lead} ${r.recs[0].note.detail}`).not.toMatch(/At 19,/);
      });

      it('the card reads the history he followed', () => {
        expect(r.recs[0].status).toBe('complete');
        expect(r.recs[0].doseLabel).toBe(before.recs[0].doseLabel);
        expect(citesOf(r.recs[0])).toContain('pedsRiskBefore6NoPcv20At6to18');
        expect(citesOf(r.recs[0])).not.toContain('pedsRiskDone');
        expect(citesOf(r.recs[0])).not.toContain('pedsPcv13Pcv15Interchangeable');
      });
    });
  }

  it('an immunocompromised child finished by a PCV20 is the same', () => {
    const r = child(['asplenia'], [...series('PCV20'), given('PCV15')], onePpsv);
    expect(chipFor(r, EXTRA_ON).extraDose).toBe(true);
    expect(r.recs[0].status).toBe('complete');
  });
});

describe('Lena: no PPSV23 yet, and CDC offers PCV20 or PPSV23, not PCV15', () => {
  for (const [who, riskIds, row] of [
    ['cochlear implant', ['cochlear_implant'], 'pedsRiskBefore6NoPcv20At6to18'],
    ['no spleen', ['asplenia'], 'pedsIcBefore6NoPcv20At6to18'],
  ]) {
    describe(who, () => {
      const r = child(riskIds, [...series(), given('PCV15')]);

      it('the PCV15 is extra and says what was on offer', () => {
        const chip = chipFor(r, EXTRA_ON);
        expect(chip.extraDose).toBe(true);
        expect(chip.effectiveDoseNum).toBeNull();
        expect(reasons(chip)).toContain('CDC offers PCV20 or PPSV23 here, not PCV15');
        expect(reasons(chip)).toContain('still waits 8 weeks');
      });

      it('she still owes the same dose, 8 weeks after the PCV15', () => {
        expect(r.recs.map((c) => c.earliestNextDate)).toEqual([WAIT_UNTIL, WAIT_UNTIL]);
        expect(r.recs[0].brands.join(' ')).toContain('PCV20');
        expect(r.recs[1].vaccine).toBe('PPSV23');
      });

      it('the card cites the row she followed, not the at-or-after-6 row', () => {
        expect(citesOf(r.recs[0])).toContain(row);
        expect(citesOf(r.recs[0])).not.toContain('pedsRiskPcv13At6');
        expect(citesOf(r.recs[0])).not.toContain('pedsPcv13Pcv15Interchangeable');
      });
    });
  }
});

describe('Ben and Priya: healthy, card said "Not indicated"', () => {
  it('Ben had earlier doses, so his PCV15 is extra', () => {
    const r = child([], [...series(), given('PCV15')]);
    expect(r.recs.map((c) => c.status)).toEqual(['not-indicated']);
    const chip = chipFor(r, EXTRA_ON);
    expect(chip.extraDose).toBe(true);
    expect(chip.effectiveDoseNum).toBeNull();
    expect(reasons(chip)).toContain('Not needed');
    expect(reasons(chip)).toContain('healthy child');
  });

  it('a PCV20 in the same place is extra too', () => {
    expect(chipFor(child([], [...series(), given('PCV20')]), EXTRA_ON).extraDose).toBe(true);
  });

  it('Priya: a first ever dose stays valid, dose 1', () => {
    const chip = chipFor(child([], [given('PCV20')]), EXTRA_ON);
    expect(chip.extraDose).toBeFalsy();
    expect(chip.effectiveDoseNum).toBe(1);
  });
});

describe('Controls: the card asked for these, or she was not asked', () => {
  it('Lena given the PCV20 her card offered: valid and counted', () => {
    const chip = chipFor(child(['cochlear_implant'], [...series(), given('PCV20')]), EXTRA_ON);
    expect(chip.extraDose).toBeFalsy();
    expect(chip.effectiveDoseNum).toBe(5);
  });

  it('an at-risk child with no PCV at all: CDC offers PCV15, so it counts', () => {
    const chip = chipFor(child(['cochlear_implant'], [given('PCV15')]), EXTRA_ON);
    expect(chip.extraDose).toBeFalsy();
    expect(chip.effectiveDoseNum).toBe(1);
  });

  it('an unrecorded product in the series: left as it was', () => {
    const pcvDoses = [{ product: '', date: '2019-10-11' }, given('PCV15')];
    expect(chipFor(child(['cochlear_implant'], pcvDoses), EXTRA_ON).extraDose).toBeFalsy();
  });

  it('a PCV13 at 6 or older is the product of its day: left as it was', () => {
    const chip = chipFor(child(['cochlear_implant'], [...series(), given('PCV13')], ppsv(AT_2)), EXTRA_ON);
    expect(chip.extraDose).toBeFalsy();
  });

  it('a dose the card was not offering at under 5: left as it was', () => {
    const r = recommend({ dob: '2022-06-01', today: '2026-05-20', riskIds: [], pcvDoses: [...['2022-08-01', '2022-10-01', '2022-12-01', '2023-06-01'].map((date) => ({ product: 'PCV13', date })), { product: 'PCV15', date: '2026-05-01' }], ppsv23Doses: [] });
    expect(chipFor(r, '2026-05-01').extraDose).toBeFalsy();
  });

  it('an at-risk child under 6 whose card said complete: she was shown a child of 8, left as it was', () => {
    const r = recommend({ dob: '2022-06-01', today: '2026-07-01', riskIds: ['cochlear_implant'], pcvDoses: [...['2022-08-01', '2022-10-01', '2022-12-01', '2023-06-01'].map((date) => ({ product: 'PCV20', date })), { product: 'PCV15', date: '2026-06-01' }], ppsv23Doses: [] });
    expect(r.recs[0].status).toBe('complete');
    expect(chipFor(r, '2026-06-01').extraDose).toBeFalsy();
  });

  it('a dose with no date on the record anywhere: nothing can be placed, left as it was', () => {
    const pcvDoses = [...series(), { product: 'PCV13' }, given('PCV15')];
    expect(chipFor(child(['cochlear_implant'], pcvDoses, ppsv(AT_2)), EXTRA_ON).extraDose).toBeFalsy();
  });

  it('a teenager the adult card answers for: the chip stays valid, as for Noor', () => {
    // §B-AT19: a PPSV23 at 16 puts five years past the 19th birthday.
    const r = recommend({
      dob: '2009-10-11', today: '2026-11-06', riskIds: ['asplenia'],
      pcvDoses: [...['2009-12-11', '2010-02-11', '2010-04-11', '2010-10-11'].map((date) => ({ product: 'PCV15', date })), given('PCV15')],
      ppsv23Doses: ppsv('2025-10-11'),
    });
    expect(chipFor(r, EXTRA_ON).extraDose).toBeFalsy();
  });

  it('a teenager whose own card offered a PCV20: it counts, even where the adult card says complete at 19', () => {
    // The child's cards decide, not the adult card that replaced them on the day.
    const r = recommend({
      dob: '2011-10-11', today: '2026-10-11', riskIds: ['asplenia'],
      pcvDoses: [...['2011-12-11', '2012-02-11', '2012-04-11', '2012-10-11'].map((date) => ({ product: 'PCV15', date })), { product: 'PCV20', date: '2026-08-16' }],
      ppsv23Doses: ppsv('2025-10-11'),
    });
    expect(chipFor(r, '2026-08-16').extraDose).toBeFalsy();
    expect(r.recs[0].doseLabel).toBe('PCV complete (includes PCV20)');
  });

  it('once he is 19 the adult rows read every dose received', () => {
    const r = recommend({ dob: DOB, today: '2037-11-06', riskIds: ['cochlear_implant'], pcvDoses: [...series(), given('PCV15')], ppsv23Doses: ppsv(AT_2) });
    expect(chipFor(r, EXTRA_ON).extraDose).toBeFalsy();
  });
});

describe('Asking what the card said does not slow the screen down', () => {
  it('a child with 10 late doses still answers at once', () => {
    // Measured 2026-11-06: 335 ms with `cardsSeen`, 5,066 ms without it, because
    // each late dose doubled the work. The bar sits between, with room for CI.
    const yearly = Array.from({ length: 10 }, (_, i) => ({ product: i % 2 ? 'PCV20' : 'PCV15', date: `${2015 + i}-10-11` }));
    const baby = ['2008-12-11', '2009-02-11', '2009-04-11', '2009-10-11'].map((date) => ({ product: 'PCV13', date }));
    const started = performance.now();
    const r = recommend({ dob: '2008-10-11', today: '2026-10-01', riskIds: ['cochlear_implant'], pcvDoses: [...baby, ...yearly], ppsv23Doses: ppsv('2011-04-11') });
    expect(r.perDose.pcv).toHaveLength(14);
    expect(performance.now() - started).toBeLessThan(2000);
  });
});

describe('The size of each family, so a wider rule fails here', () => {
  it('flags exactly the patients she ruled on', () => {
    const family = (c) => {
      const text = c.reasons.join(' ');
      if (text.includes('already complete')) return 'finished';
      if (text.includes('healthy child')) return 'healthy';
      return text.includes('one PPSV23') ? 'afterPpsv23' : 'noPpsv23';
    };
    const counts = {};
    for (const p of allPatients()) {
      const extras = (recommend(p.input).perDose?.pcv ?? []).filter((d) => d.extraDose && d.notAskedFor);
      for (const f of new Set(extras.map(family))) counts[f] = (counts[f] ?? 0) + 1;
    }
    expect(counts).toEqual({
      afterPpsv23: 3442, finished: 18430, healthy: 10088, noPpsv23: 4116,
    });
  });
});
