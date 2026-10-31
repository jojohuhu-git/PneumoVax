// ── §K-PPSV23THENPCV (2026-10-31): the card holds a conjugate after an EXTRA
// PPSV23, and a THROWN-OUT PPSV23 holds off nothing ──────────────────────────
//
// THREE OWNER ANSWERS, one day, in order — kept together because the second
// and third withdrew the first.
//
//   1. Eli (asplenia; catch-up PCV13 Feb 1 and Apr 1, 2023; PPSV23 Apr 29,
//      thrown out for spacing; PCV20 Jun 1, 33 days after it): "Yes, 8 weeks
//      after any PPSV23".
//   2. Rosa (PCV13 at 2, 4, 6 months; PPSV23 given BY MISTAKE at 12 months;
//      the PCV13 booster a week later), asked because the literal reading of
//      (1) reached only babies like her on the grid: "The Sep 8 PCV13 dose
//      should count as a valid dose 4, and no repeat is needed. Per CDC:
//      repeat dose should be spaced after the invalid dose by the recommended
//      minimum interval. This means this rule applies when the repeat dose is
//      the same as the invalid dose."
//   3. Eli again, laid out dose by dose because her reason in (2) covers him
//      too: "Count it".
//
// So a THROWN-OUT PPSV23 — for spacing or for age — holds off no conjugate.
// ANCHOR-1 ("an unnecessary dose cannot reset a clock") stands, unchanged.
// What DOES hold is a PPSV23 that counted, or an EXTRA one (Ben, 2026-10-30).
//
// WHAT THE QUESTION FOUND, and what this file guards. Ben's ruling had reached
// the dose check and not the card: the check measured from the last PPSV23
// that counted OR was extra, the card's advised date from the last that
// counted. A diabetic 5-year-old whose extra PPSV23 was 3 weeks old was told
// her conjugate was "due today" — and the app threw that dose out when it was
// given. Both now read one function, `lastPpsv23HoldingAConjugate`.
//
// ⚠ The grid builds none of these children. Every one is hand-built.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';
import { addDays, addCalendarMonths } from '../dateUtils.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));

describe('Eli — the PCV20 after his thrown-out PPSV23 counts (her final answer)', () => {
  const ELI = {
    dob: '2021-01-01', ageMonths: 34, today: '2023-11-01', riskIds: ['asplenia'],
    pcvDoses: [...d('PCV13', ['2023-02-01', '2023-04-01']), ...d('PCV20', ['2023-06-01'])],
    ppsv23Doses: d('PPSV23', ['2023-04-29']),
  };
  it('the PPSV23 is thrown out; the PCV20 33 days later counts; he is complete', () => {
    const a = analyzeBoth(ELI);
    expect(a.ppsv23.perDose[0].status).toBe('invalid');
    expect(a.pcv.perDose[2].status).toBe('valid');
    expect(recommend(ELI).recs[0].status).toBe('complete');
  });
});

describe('Rosa — a PPSV23 given by mistake at 12 months holds off nothing', () => {
  const ROSA = {
    dob: '2025-09-01', ageMonths: 13, today: '2026-10-31',
    pcvDoses: d('PCV13', ['2025-11-01', '2026-01-01', '2026-03-01', '2026-09-08']),
    ppsv23Doses: d('PPSV23', ['2026-09-01']),
  };
  for (const riskIds of [[], ['asplenia']]) {
    it(`${riskIds.length ? 'with asplenia' : 'healthy'}: the Sep 8 booster is valid dose 4, series complete`, () => {
      const p = { ...ROSA, riskIds };
      const a = analyzeBoth(p);
      expect(a.ppsv23.perDose[0].status).toBe('invalid');
      expect(a.pcv.perDose.map((x) => x.effectiveDoseNum)).toEqual([1, 2, 3, 4]);
      expect(recommend(p).recs[0].doseLabel).toBe('PCV series complete (4 doses)');
    });
  }
});

describe('an EXTRA PPSV23 holds the card\'s date, as it holds the dose check', () => {
  // Diabetes, 5 years 10 months. PCV13 x3 before 12 months, so one catch-up
  // dose is owed. PPSV23 at 2 (counted) and again 3 weeks ago (extra: CDC
  // gives a non-immunocompromised child one PPSV23).
  const KID = {
    dob: '2020-01-01', ageMonths: 70, today: '2025-11-10', riskIds: ['diabetes'],
    pcvDoses: d('PCV13', ['2020-03-01', '2020-05-01', '2020-07-01']),
    ppsv23Doses: d('PPSV23', ['2022-02-01', '2025-10-20']),
  };
  it('the card waits until 8 weeks after the extra dose — pre-fix it said "due today"', () => {
    expect(analyzeBoth(KID).ppsv23.perDose[1].extraDose).toBe(true);
    const card = recommend(KID).recs[0];
    expect(card.dueToday).toBe(false);
    expect(card.earliestNextDate).toBe('2025-12-15');
  });

  it('and a conjugate given on that date counts; one given "today" does not', () => {
    const given = (on) => analyzeBoth({ ...KID, today: on,
      pcvDoses: [...KID.pcvDoses, ...d('PCV20', [on])] }).pcv.perDose.at(-1);
    expect(given('2025-12-15').status).toBe('valid');
    expect(given('2025-11-10').intervalRuleId).toBe('CHILD-PCV-AFTER-PPSV23');
  });

  it('the dose check and the card name one PPSV23 — validate.js\'s `conjugateHold`', () => {
    expect(analyzeBoth(KID).ppsv23.conjugateHold).toBe('2025-10-20');
    const thrownOut = { dob: '2021-01-01', ageMonths: 28, today: '2023-05-15', riskIds: ['asplenia'],
      pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01']), ppsv23Doses: d('PPSV23', ['2023-04-29']) };
    expect(analyzeBoth(thrownOut).ppsv23.conjugateHold).toBeNull();
  });
});

// The property itself, over hand-built children: give the conjugate on the
// date the card advises, and the PPSV23 wait must not throw it out.
describe('advice = grading, swept', () => {
  const RISKS = [['asplenia'], ['diabetes'], ['cochlear_implant'], []];
  const cases = [];
  for (const am of [30, 50, 70, 100, 150]) {
    const today = '2026-10-31';
    const dob = addCalendarMonths(today, -am);
    for (const riskIds of RISKS) {
      for (const pcvAges of [[2, 4, 6], [25, 27], []]) {
        if (pcvAges.some((a) => a > am - 3)) continue;
        for (const ppsvBack of [[10], [30], [50], [400, 20], [2000, 20], [2000, 40]]) {
          const ppsvDates = ppsvBack.map((b) => addDays(today, -b));
          if (ppsvDates.some((x) => x < addCalendarMonths(dob, 20))) continue;
          cases.push({ dob, ageMonths: am, today, riskIds,
            pcvDoses: pcvAges.map((a) => ({ product: 'PCV13', date: addCalendarMonths(dob, a) })),
            ppsv23Doses: ppsvDates.map((x) => ({ product: 'PPSV23', date: x })) });
        }
      }
    }
  }

  it('a PCV given on the advised date is never thrown out for following a PPSV23', () => {
    let checked = 0;
    let afterExtra = 0;
    const bad = [];
    for (const p of cases) {
      const card = recommend(p).recs.find((r) => r.vaccine === 'PCV' && r.status !== 'complete'
        && r.status !== 'not-indicated');
      if (!card) continue;
      const on = card.dueToday ? p.today : card.earliestNextDate;
      if (!on) continue;
      if (analyzeBoth(p).ppsv23.perDose.some((x) => x.extraDose)) afterExtra++;
      const given = { ...p, today: on, pcvDoses: [...p.pcvDoses, { product: 'PCV20', date: on }] };
      const v = analyzeBoth(given).pcv.perDose.at(-1);
      checked++;
      if (v.intervalRuleId === 'CHILD-PCV-AFTER-PPSV23') bad.push(`${p.riskIds} ${p.ageMonths}m ppsv ${p.ppsv23Doses.map((x) => x.date)} → ${on}`);
    }
    expect(checked).toBeGreaterThan(60);
    // The sweep must reach the children the bug was about.
    expect(afterExtra).toBeGreaterThan(5);
    expect(bad).toEqual([]);
  });
});
