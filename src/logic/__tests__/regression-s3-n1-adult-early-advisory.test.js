// S3-N1 (2026-10-11) — an adult's too-close doses used to silently read as
// routine, same as any other valid dose.
//
// S3 deliberately did not mark them invalid: CDC's adult notes state their gaps
// as recommendations for the NEXT dose ("1 dose PCV20 or 1 dose PCV21 at least
// 1 year after the last PCV13 dose"), never as minimum intervals, and nowhere
// say a short adult gap stops a dose counting. Calling one invalid would
// substitute a minimum for a recommendation — the mistake A-P1-1 corrected.
//
// The honest answer is a third thing: **this dose counts, and it was given
// sooner than CDC advises.** validate.js names the flag `earlyAdvisory` — S14-3
// (owner decision 2026-10-11) renamed it off `offWindow`, which collided with
// MeningoVax's sense of "off-window": a dose that does NOT count and is owed
// a repeat. This one counts; the two must never share a name.
//
// THE SAFETY PROPERTY THIS FILE EXISTS TO PROTECT: a dose carrying this flag
// still counts. `status` stays 'valid' and `effectiveDoseNum` is still
// assigned, so no consumer that counts doses can treat it as dropped. The
// advisory is a flag on top, never a new counting state. If a future change
// turns `earlyAdvisory` into its own status, these assertions are what should
// stop it.
//
// Sources, fetched live 2026-10-11 (see CLINICAL_SPEC.md §K):
//   "Previously received only PCV13: 1 dose PCV20 or 1 dose PCV21 at least 1
//    year after the last PCV13 dose."
//   "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15
//    dose (may use minimum interval of 8 weeks for adults with an
//    immunocompromising condition, cochlear implant, or cerebrospinal fluid
//    leak)."
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { addCalendarMonths, addDays } from '../dateUtils.js';

const DOB = '1956-01-01';
const TODAY = '2026-06-01';
const AM = 845;                 // ~70 years

function adultPcv(dates, products = []) {
  return analyzeHistory('PCV', dates.map((date, i) => ({ date, product: products[i] || 'PCV13' })),
    AM, TODAY, DOB);
}

function adultPpsv(ppsvDate, pcvDate, { product = 'PCV15', riskIds = [] } = {}) {
  return analyzeHistory('PPSV23', [{ date: ppsvDate }], AM, TODAY, DOB, {
    pcvDoses: [{ date: pcvDate, product }],
    riskIds,
  });
}

describe('S3-N1 — adult PCV to PCV, CDC advises at least 1 year', () => {
  it('flags five weeks as off-window — and the dose STILL COUNTS', () => {
    const a = adultPcv(['2026-01-05', '2026-02-09'], ['PCV13', 'PCV20']);
    const second = a.perDose[1];

    expect(second.earlyAdvisory).toBe(true);
    expect(second.reasons.join(' ')).toMatch(/at least 1 year/);
    // The safety property: counts, numbered, not dropped.
    expect(second.status).toBe('valid');
    expect(second.doesNotCount).toBeFalsy();
    expect(second.effectiveDoseNum).toBe(2);
    expect(a.effective).toHaveLength(2);
    // The copy must reassure, not read as an error: it says the dose counts,
    // and never borrows the invalid path's wording.
    expect(second.reasons.join(' ')).toMatch(/still counts/);
    expect(second.reasons.join(' ')).not.toMatch(/does not count toward the series/);
    expect(second.reasons.join(' ')).not.toMatch(/repeat this dose only/);
  });

  it('does not flag a gap of exactly 1 calendar year, or longer', () => {
    const first = '2026-01-05';
    expect(adultPcv([first, addCalendarMonths(first, 12)], ['PCV13', 'PCV20'])
      .perDose[1].earlyAdvisory).toBeFalsy();
    expect(adultPcv([first, addCalendarMonths(first, 18)], ['PCV13', 'PCV20'])
      .perDose[1].earlyAdvisory).toBeFalsy();
  });

  it('flags one day short of the year', () => {
    const first = '2026-01-05';
    const a = adultPcv([first, addDays(addCalendarMonths(first, 12), -1)], ['PCV13', 'PCV20']);
    expect(a.perDose[1].earlyAdvisory).toBe(true);
  });

  it('never flags the first dose — there is no previous dose to be early after', () => {
    expect(adultPcv(['2026-01-05']).perDose[0].earlyAdvisory).toBeFalsy();
  });

  it('leaves children alone: a too-close paediatric dose is invalid, not off-window', () => {
    const child = analyzeHistory('PCV', [
      { date: '2026-03-01', product: 'PCV13' },
      { date: '2026-03-15', product: 'PCV13' },
    ], 4, '2026-05-01', '2026-01-01');
    expect(child.perDose[1].status).toBe('invalid');
    expect(child.perDose[1].earlyAdvisory).toBeFalsy();
  });

  it('does not flag an undated dose', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-01-05', product: 'PCV13' },
      { product: 'PCV20' },
    ], AM, TODAY, DOB);
    expect(a.perDose.every((d) => !d.earlyAdvisory)).toBe(true);
  });
});

describe('S3-N1 — adult PCV15 to PPSV23, the A-P1-1 interval', () => {
  it('flags 3 months for an adult with no immunocompromising condition', () => {
    const a = adultPpsv('2026-04-05', '2026-01-05');
    expect(a.perDose[0].earlyAdvisory).toBe(true);
    expect(a.perDose[0].reasons.join(' ')).toMatch(/at least 1 year/);
    expect(a.perDose[0].effectiveDoseNum).toBe(1);
    expect(a.effective).toHaveLength(1);
  });

  it('does NOT flag 3 months when the 8-week minimum may be considered', () => {
    // CLAUDE.md / A-P1-1: an immunocompromising condition, cochlear implant or
    // CSF leak may use the 8-week minimum. Three months clears it, so this is a
    // legitimate choice and must not be second-guessed.
    expect(adultPpsv('2026-04-05', '2026-01-05', { riskIds: ['hiv'] }).perDose[0].earlyAdvisory)
      .toBeFalsy();
    expect(adultPpsv('2026-04-05', '2026-01-05', { riskIds: ['cochlear_implant'] }).perDose[0].earlyAdvisory)
      .toBeFalsy();
  });

  it('flags 4 weeks even when the 8-week minimum applies — it is short of that too', () => {
    const a = adultPpsv('2026-02-02', '2026-01-05', { riskIds: ['hiv'] });
    expect(a.perDose[0].earlyAdvisory).toBe(true);
    expect(a.perDose[0].reasons.join(' ')).toMatch(/8 weeks/);
  });

  it('does not flag a full year', () => {
    expect(adultPpsv(addCalendarMonths('2026-01-05', 12), '2026-01-05').perDose[0].earlyAdvisory)
      .toBeFalsy();
  });
});

// These go through recommend(), not analyzeHistory(), on purpose. The unit
// tests above pass `riskIds` straight into the validator, so they stayed green
// while recommend() was not forwarding it at all — every adult was judged
// against the flat 1-year advice and an immunocompromised patient who had
// legitimately used the 8-week option was told their dose was early. Driving
// the running app is what caught it. Assert the WIRING, not just the unit.
describe('S3-N1 — riskIds actually reach the validator from the engine', () => {
  function ppsvAfterPcv15(riskIds) {
    const out = recommend({
      ageMonths: AM, dob: DOB, today: TODAY,
      pcvDoses: [{ date: '2026-01-05', product: 'PCV15' }],
      ppsv23Doses: [{ date: '2026-04-05' }],   // 3 months later
      riskIds,
    });
    return out.perDose.ppsv23[0];
  }

  it('an immunocompromised adult is NOT told a 3-month gap was early', () => {
    expect(ppsvAfterPcv15(['hiv']).earlyAdvisory).toBeFalsy();
  });

  it('a cochlear implant gets the same treatment', () => {
    expect(ppsvAfterPcv15(['cochlear_implant']).earlyAdvisory).toBeFalsy();
  });

  it('but an adult with only a chronic condition IS flagged', () => {
    expect(ppsvAfterPcv15(['diabetes']).earlyAdvisory).toBe(true);
  });

  it('and so is an adult with no risk factors at all', () => {
    expect(ppsvAfterPcv15([]).earlyAdvisory).toBe(true);
  });
});

describe('S3-N1 — the engine still counts off-window doses', () => {
  it('a 70-year-old PCV13 + PCV20 five weeks apart is a 2-dose history to the engine', () => {
    const out = recommend({
      ageMonths: AM, dob: DOB, today: TODAY,
      pcvDoses: [
        { date: '2026-01-05', product: 'PCV13' },
        { date: '2026-02-09', product: 'PCV20' },
      ],
      ppsv23Doses: [], riskIds: [],
    });
    expect(out.meta.pcvCount).toBe(2);
    expect(out.perDose.pcv[1].earlyAdvisory).toBe(true);
    expect(out.perDose.pcv[1].effectiveDoseNum).toBe(2);
    // PCV20 completes an adult series; the early gap does not change that.
    expect(out.recs.some((r) => r.status === 'complete' || r.status === 'not-indicated')).toBe(true);
  });
});
