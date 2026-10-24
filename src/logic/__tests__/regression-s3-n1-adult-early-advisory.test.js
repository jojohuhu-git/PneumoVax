// S3-N1, as amended by S14-7 (owner decision 2026-10-11).
//
// WHAT THIS FILE USED TO ASSERT, AND WHY IT CHANGED.
//
// S3 found that an adult's too-close doses read as routine, the same as any
// other valid dose. S3-N1 answered that with a THIRD thing: the dose counts,
// and carries a note — `earlyAdvisory: true` on a `status: 'valid'` result.
// It deliberately did NOT void such a dose, on the grounds that CDC states
// adult gaps as recommendations for the NEXT dose and never as minimum
// intervals.
//
// The owner reviewed that evidence on 2026-10-11 and reversed it:
//
//   • CDSI v4.64, CDC's own machine-readable rule set, carries `minInt` (the
//     recommended gap) and `absMinInt` (the hard floor). Infant PCV dose 2
//     reads `absMinInt = 4 weeks − 4 days`. EVERY adult pneumococcal interval
//     reads `absMinInt = 0 days`.
//   • rr7203a1, mm7336a3 and mm7401a1 contain zero hits for "should be
//     repeated" or "does not count".
//
// The owner's determination: an interval is an interval, and a dose given
// inside one was not validly given, whatever age the patient was. So almost
// every gap that used to produce a note now VOIDS the dose. ⚠️ This is an
// owner clinical determination, recorded in CLINICAL_SPEC.md §K and in
// logic/doseIntervalRules.js — never cite ACIP or CDC for it.
//
// `earlyAdvisory` SURVIVES, for the two cases where a dose really does count
// and the timing is still worth saying out loud:
//   1. An adult who legitimately used the 8-week option after a PCV15 instead
//      of waiting the recommended year. The dose met the minimum CDC names
//      for them, so it counts; the note says the recommendation is a year.
//   2. A pair of adult doses no enumerated row names (PCV13→PCV15, say),
//      caught by ADULT-PCV-AFTER-PCV-CATCH-ALL so that "enumerate, never
//      generalise" does not turn into silence.
//
// THE SAFETY PROPERTY THIS FILE STILL EXISTS TO PROTECT: a dose carrying
// `earlyAdvisory` COUNTS. `status` stays 'valid' and `effectiveDoseNum` is
// still assigned, so no consumer that counts doses can treat it as dropped.
// The advisory is a flag on top, never a counting state of its own. If a
// future change turns `earlyAdvisory` into a status, these assertions are
// what should stop it.
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
// The clock sits AFTER every dose date these tests use, including the derived
// ones — `addCalendarMonths('2026-01-05', 12)` is 2027-01-05, and the 18-month
// case reaches 2027-07-05.
//
// It used to be 2026-06-01, which put those doses in the FUTURE: the fixtures
// recorded, as already given, shots dated months from "now". Nothing noticed,
// because the app did not check future dates at all. It does now (owner
// decision 2026-10-12), and these three cases turned red the moment it did.
// The rule under test here is the INTERVAL between two doses, which is
// unchanged — only the fixture was impossible, so the clock moved rather than
// the dates, keeping every gap exactly as it was.
const TODAY = '2028-01-01';
const AM = 864;                 // 72 years — DOB to TODAY, kept consistent

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

describe('S14-7 — an adult PCV20 inside the year after PCV13 does NOT count', () => {
  it('voids five weeks, and says the reason is the owner determination', () => {
    const a = adultPcv(['2026-01-05', '2026-02-09'], ['PCV13', 'PCV20']);
    const second = a.perDose[1];

    expect(second.status).toBe('invalid');
    expect(second.effectiveDoseNum).toBeNull();
    expect(second.doesNotCount).toBe(true);
    expect(a.effective).toHaveLength(1);
    expect(second.reasons.join(' ')).toMatch(/at least 1 year after the last PCV13 dose/);
    // W1 (owner-approved wording, 2026-10-11): this dose was never missing,
    // only early — it is not "repeated". See
    // regression-w1-too-soon-not-repeated.test.js for the dedicated coverage.
    expect(second.reasons.join(' ')).toMatch(/due on or after 2027-02-05/);
    expect(second.reasons.join(' ')).not.toMatch(/repeat this dose only/);
    // Must NOT keep the old reassurance — it is now false.
    expect(second.reasons.join(' ')).not.toMatch(/still counts/);
    // Honesty: the rule is the owner's, not ACIP's, and the detail says so.
    expect(second.detail).toMatch(/owner clinical determination dated 2026-10-11/i);
  });

  it('does not void a gap of exactly 1 calendar year, or longer', () => {
    const first = '2026-01-05';
    expect(adultPcv([first, addCalendarMonths(first, 12)], ['PCV13', 'PCV20'])
      .perDose[1].status).toBe('valid');
    expect(adultPcv([first, addCalendarMonths(first, 18)], ['PCV13', 'PCV20'])
      .perDose[1].status).toBe('valid');
  });

  // The owner's decision names the 4-day grace explicitly: "with the 4-day
  // grace around the 12-month interval". CDC's own sentence is the source of
  // the grace itself — "doses administered ≤4 days before the minimum age or
  // interval are considered valid ... ≥5 days earlier ... should be repeated".
  it('applies CDC\'s 4-day grace to the owner floor: 4 days short counts, 5 days short does not', () => {
    const first = '2026-01-05';
    const anniversary = addCalendarMonths(first, 12);
    expect(adultPcv([first, addDays(anniversary, -4)], ['PCV13', 'PCV20'])
      .perDose[1].status).toBe('valid');
    expect(adultPcv([first, addDays(anniversary, -5)], ['PCV13', 'PCV20'])
      .perDose[1].status).toBe('invalid');
  });

  it('never judges the first dose — there is no previous dose to be early after', () => {
    const only = adultPcv(['2026-01-05']).perDose[0];
    expect(only.status).toBe('valid');
    expect(only.earlyAdvisory).toBeFalsy();
  });

  it('a too-close paediatric dose is still invalid, on the paediatric rule', () => {
    const child = analyzeHistory('PCV', [
      { date: '2026-03-01', product: 'PCV13' },
      { date: '2026-03-15', product: 'PCV13' },
    ], 4, '2026-05-01', '2026-01-01');
    expect(child.perDose[1].status).toBe('invalid');
    // The paediatric minimum, stated by CDC — not the adult owner rule.
    expect(child.perDose[1].reasons.join(' ')).toMatch(/minimum interval is 4 weeks/);
    expect(child.perDose[1].detail ?? '').not.toMatch(/owner clinical determination/i);
  });

  it('never judges an undated dose — there is no date to measure from', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-01-05', product: 'PCV13' },
      { product: 'PCV20' },
    ], AM, TODAY, DOB);
    expect(a.perDose.every((d) => !d.earlyAdvisory)).toBe(true);
    expect(a.perDose[1].status).not.toBe('invalid');
  });
});

describe('S14-7 — the adult PCV15 to PPSV23 floors, keyed on risk, not age', () => {
  it('voids 3 months for an adult with no immunocompromising condition — their floor is the year', () => {
    const a = adultPpsv('2026-04-05', '2026-01-05');
    expect(a.perDose[0].status).toBe('invalid');
    expect(a.perDose[0].reasons.join(' ')).toMatch(/at least 1 year after PCV15/);
    expect(a.effective).toHaveLength(0);
    expect(a.perDose[0].detail).toMatch(/owner clinical determination/i);
  });

  it('keeps 3 months when the 8-week minimum may be considered — and SAYS it counts', () => {
    // CLAUDE.md / A-P1-1: an immunocompromising condition, cochlear implant or
    // CSF leak may use the 8-week minimum. Three months clears it, so the dose
    // is validly given and must not be voided. It still carries a note, because
    // ≥1 year remains the recommendation — the note states that the minimum was
    // met, which is information, not second-guessing.
    for (const risk of ['hiv', 'cochlear_implant', 'csf_leak']) {
      const a = adultPpsv('2026-04-05', '2026-01-05', { riskIds: [risk] });
      expect(a.perDose[0].status).toBe('valid');
      expect(a.perDose[0].effectiveDoseNum).toBe(1);
      expect(a.effective).toHaveLength(1);
      expect(a.perDose[0].earlyAdvisory).toBe(true);
      expect(a.perDose[0].reasons.join(' ')).toMatch(/met that minimum, so it counts/);
    }
  });

  it('voids 4 weeks even when the 8-week minimum applies — it is short of that too', () => {
    const a = adultPpsv('2026-02-02', '2026-01-05', { riskIds: ['hiv'] });
    expect(a.perDose[0].status).toBe('invalid');
    expect(a.perDose[0].reasons.join(' ')).toMatch(/8 weeks/);
    // CORRECTED 2026-10-11, after reading rr7203a1 live. This floor was first
    // labelled CDC's on the grounds that the adult notes call 8 weeks a
    // "minimum interval". The full sentence points the other way — "a minimum
    // interval of 8 weeks CAN BE CONSIDERED ... TO MINIMIZE THE TIME OF RISK"
    // is permission to vaccinate SOONER, not a bar to fall below — and
    // rr7203a1 never says a dose given sooner stops counting. So the INTERVAL
    // is ACIP's and the FLOOR is the owner's, and the text must say so.
    expect(a.perDose[0].detail).toMatch(/owner clinical determination/i);
    expect(a.perDose[0].detail).toMatch(/shortest interval ACIP recommends/i);
  });

  it('leaves a full year alone, with no note at all', () => {
    const a = adultPpsv(addCalendarMonths('2026-01-05', 12), '2026-01-05');
    expect(a.perDose[0].status).toBe('valid');
    expect(a.perDose[0].earlyAdvisory).toBeFalsy();
  });
});

// These go through recommend(), not analyzeHistory(), on purpose. The unit
// tests above pass `riskIds` straight into the validator, so they stayed green
// while recommend() was not forwarding it at all — every adult was judged
// against the flat 1-year advice and an immunocompromised patient who had
// legitimately used the 8-week option got second-guessed. Driving the running
// app is what caught it. Assert the WIRING, not just the unit.
//
// S14-7 raises the stakes: `riskIds` no longer decides whether a NOTE appears,
// it decides whether the dose COUNTS. A 3-month gap is valid for an
// immunocompromised adult and void for everyone else.
describe('S14-7 — riskIds actually reach the validator from the engine', () => {
  function ppsvAfterPcv15(riskIds) {
    const out = recommend({
      ageMonths: AM, dob: DOB, today: TODAY,
      pcvDoses: [{ date: '2026-01-05', product: 'PCV15' }],
      ppsv23Doses: [{ date: '2026-04-05' }],   // 3 months later
      riskIds,
    });
    return out.perDose.ppsv23[0];
  }

  it('an immunocompromised adult keeps their 3-month dose', () => {
    expect(ppsvAfterPcv15(['hiv']).status).toBe('valid');
    expect(ppsvAfterPcv15(['hiv']).effectiveDoseNum).toBe(1);
  });

  it('a cochlear implant gets the same treatment', () => {
    expect(ppsvAfterPcv15(['cochlear_implant']).status).toBe('valid');
  });

  it('but an adult with only a chronic condition has the dose voided', () => {
    expect(ppsvAfterPcv15(['diabetes']).status).toBe('invalid');
  });

  it('and so does an adult with no risk factors at all', () => {
    expect(ppsvAfterPcv15([]).status).toBe('invalid');
  });
});

describe('S14-7 — the catch-all keeps an unenumerated adult pair from going silent', () => {
  // PCV13 → PCV15 is not a path CDC recommends, so no enumerated row names it
  // and no floor applies. Without the catch-all it would pass in total
  // silence — the exact shape of bug S14-7 exists to remove.
  it('notes PCV13 then PCV15 five weeks later, and the dose still counts', () => {
    const a = adultPcv(['2026-01-05', '2026-02-09'], ['PCV13', 'PCV15']);
    const second = a.perDose[1];
    expect(second.status).toBe('valid');
    expect(second.earlyAdvisory).toBe(true);
    expect(second.effectiveDoseNum).toBe(2);
    expect(a.effective).toHaveLength(2);
    expect(second.reasons.join(' ')).toMatch(/at least 1 year between pneumococcal conjugate doses/);
    expect(second.reasons.join(' ')).toMatch(/still counts/);
    expect(second.reasons.join(' ')).not.toMatch(/does not count toward the series/);
    expect(second.reasons.join(' ')).not.toMatch(/repeat this dose only/);
  });

  it('and the engine still counts it: two doses, not one', () => {
    const out = recommend({
      ageMonths: AM, dob: DOB, today: TODAY,
      pcvDoses: [
        { date: '2026-01-05', product: 'PCV13' },
        { date: '2026-02-09', product: 'PCV15' },
      ],
      ppsv23Doses: [], riskIds: [],
    });
    expect(out.meta.pcvCount).toBe(2);
    expect(out.perDose.pcv[1].earlyAdvisory).toBe(true);
    expect(out.perDose.pcv[1].effectiveDoseNum).toBe(2);
  });
});

describe('S14-7 — a voided adult dose is dropped from the engine\'s count', () => {
  it('a 70-year-old PCV13 + PCV20 five weeks apart is a ONE-dose history now', () => {
    const out = recommend({
      ageMonths: AM, dob: DOB, today: TODAY,
      pcvDoses: [
        { date: '2026-01-05', product: 'PCV13' },
        { date: '2026-02-09', product: 'PCV20' },
      ],
      ppsv23Doses: [], riskIds: [],
    });
    // The PCV20 does not count, so the patient is a PCV13-only adult and is
    // owed the PCV20/PCV21 again — which is the whole point of calling the
    // dose invalid rather than noting it.
    expect(out.meta.pcvCount).toBe(1);
    expect(out.perDose.pcv[1].status).toBe('invalid');
    expect(out.perDose.pcv[1].effectiveDoseNum).toBeNull();
    expect(out.recs.some((r) => r.status === 'complete')).toBe(false);
  });
});
