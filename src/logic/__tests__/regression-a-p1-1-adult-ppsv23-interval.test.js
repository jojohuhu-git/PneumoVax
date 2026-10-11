// A-P1-1 (2026-10-10) — the PCV15 → PPSV23 interval for adults.
//
// OWNER DECISION 2026-10-10, which amends the CLAUDE.md non-negotiable rule
// "Adult PPSV23 Interval Is Risk-Class-Keyed":
//
//   "When PCV15 is used, it should be followed by a dose of PPSV23 at least
//    1 year later. The minimum interval (8 weeks) can be considered in adults
//    with an immunocompromising condition, cochlear implant, or cerebrospinal
//    fluid leak. Their pneumococcal vaccinations are then complete."
//
// Source, CDC Adult Immunization Schedule Notes, fetched live 2026-10-10. The
// sentence appears EXACTLY TWICE on that page, identically — once under
// "Routine vaccination / Age 50 years or older" and once under "Special
// situations / Age 19-49 years with certain underlying medical conditions":
//
//   "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the
//    PCV15 dose (may use minimum interval of 8 weeks for adults with an
//    immunocompromising condition,* cochlear implant, or cerebrospinal fluid
//    leak)."
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
//
// So the primary source carries NO age distinction: >=1 year is the
// recommendation for every adult 19+, and 8 weeks is a minimum that MAY BE
// CONSIDERED for IC / cochlear / CSF at any adult age. The app previously
// substituted the 8-week minimum FOR the recommendation whenever the patient
// was IC/cochlear/CSF, and so contradicted itself one step apart: a 60y HIV
// patient with no history was told "PCV15 followed by PPSV23 >=1 year later",
// and then, once that PCV15 was recorded, "PPSV23 (>=8 weeks after PCV15)".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

// P6-4 (S13, 2026-10-10): a note is now `{ lead, detail }` — `lead` is what to
// do for THIS patient, `detail` sits behind a "Why this" disclosure. Short
// notes that were never split are still plain strings.
//
// `noteLead` asserts against the half the clinician sees WITHOUT clicking.
// Use it wherever the claim is something they must act on; `noteText` (both
// halves) is for supporting context that may legitimately be disclosed.
const noteLead = (r) => (typeof r.note === 'string' ? r.note : (r.note?.lead ?? ''));
const noteText = (r) => (typeof r.note === 'string'
  ? r.note
  : [r.note?.lead, r.note?.detail].filter(Boolean).join(' '));

const TODAY = '2026-10-10';
const PCV15_ON = '2026-10-10';

function afterPcv15({ ageMonths, dob, riskIds }) {
  const r = recommend({
    dob, ageMonths, riskIds, today: TODAY,
    pcvDoses: [{ date: PCV15_ON, product: 'PCV15' }],
    ppsv23Doses: [],
  });
  return r.recs.find((x) => x.vaccine === 'PPSV23');
}

const SIXTY = { ageMonths: 725, dob: '1966-05-01' };
const THIRTY = { ageMonths: 365, dob: '1996-05-01' };

describe('A-P1-1 — >=1 year is the recommendation for every adult', () => {
  for (const [label, who] of [['60y (>=50)', SIXTY], ['30y (19-49)', THIRTY]]) {
    for (const risk of ['hiv', 'cochlear_implant', 'csf_leak', 'diabetes']) {
      it(`${label} + ${risk} is told >=1 year`, () => {
        const r = afterPcv15({ ...who, riskIds: [risk] });
        expect(r).toBeDefined();
        expect(r.minIntervalMonths).toBe(12);
        expect(r.minIntervalDays).toBe(null);
        expect(r.doseLabel).toMatch(/1 year/);
        expect(r.doseLabel).not.toMatch(/8 weeks/);
      });
    }
  }

  it('the earliest date is the real 1-year anniversary', () => {
    const r = afterPcv15({ ...SIXTY, riskIds: ['hiv'] });
    expect(r.earliestNextDate).toBe('2027-10-10');
  });
});

describe('A-P1-1 — the 8-week minimum is NAMED, never silently substituted', () => {
  it('is offered to an immunocompromised adult, at either age', () => {
    for (const who of [SIXTY, THIRTY]) {
      const r = afterPcv15({ ...who, riskIds: ['hiv'] });
      expect(noteLead(r)).toMatch(/8 weeks/);
      expect(noteLead(r)).toMatch(/minimum/i);
      expect(noteLead(r)).toMatch(/immunocompromising|cochlear|cerebrospinal/i);
    }
  });

  it('is offered for cochlear implant and CSF leak', () => {
    for (const risk of ['cochlear_implant', 'csf_leak']) {
      expect(noteLead(afterPcv15({ ...SIXTY, riskIds: [risk] }))).toMatch(/8 weeks/);
    }
  });

  it('is NOT offered for a chronic, non-immunocompromising condition', () => {
    const r = afterPcv15({ ...SIXTY, riskIds: ['diabetes'] });
    expect(noteLead(r)).not.toMatch(/8 weeks/);
  });
});

describe('A-P1-1 — the app no longer contradicts itself one step apart', () => {
  it('says the same interval before and after the PCV15 is recorded', () => {
    const naive = recommend({
      ...SIXTY, riskIds: ['hiv'], today: TODAY, pcvDoses: [], ppsv23Doses: [],
    }).recs[0];
    expect(noteLead(naive)).toMatch(/PPSV23 ≥1 year later|PPSV23 at least 1 year/i);

    const after = afterPcv15({ ...SIXTY, riskIds: ['hiv'] });
    expect(after.doseLabel).toMatch(/1 year/);
  });
});

describe('A-P1-1 — "their pneumococcal vaccinations are then complete"', () => {
  it('PCV15 followed by PPSV23 closes the series at any adult age', () => {
    for (const who of [SIXTY, THIRTY]) {
      for (const risk of ['hiv', 'cochlear_implant', 'diabetes']) {
        const r = recommend({
          ...who, riskIds: [risk], today: TODAY,
          pcvDoses: [{ date: '2024-01-01', product: 'PCV15' }],
          ppsv23Doses: [{ date: '2025-06-01', product: 'PPSV23' }],
        });
        expect(r.recs[0].status).toBe('complete');
      }
    }
  });
});

describe('A-P1-1 — the OTHER rule that shared this predicate must not move', () => {
  // require8wk() was doing double duty: it also decided whether a 19-49 adult
  // with PCV13 + PPSV23 is on CDC's ">=5 years" row or the "review at 50" row.
  // CDC notes, 19-49 special situations:
  //   "Cochlear implant, cerebrospinal fluid leak, or an immunocompromising
  //    condition: 1 dose PCV20 or 1 dose PCV21 at least 5 years after the last
  //    pneumococcal vaccine dose."
  //   "Alcoholism, chronic heart/liver/lung disease, cigarette smoking, or
  //    diabetes mellitus: no additional PCV or PPSV23 doses recommended at this
  //    time. Review pneumococcal recommendations when age 50 years or older."
  const bothDoses = {
    pcvDoses: [{ date: '2015-01-01', product: 'PCV13' }],
    ppsv23Doses: [{ date: '2016-01-01', product: 'PPSV23' }],
  };

  for (const risk of ['hiv', 'cochlear_implant', 'csf_leak']) {
    it(`19-49 with ${risk} still gets the >=5 year dose, not "review at 50"`, () => {
      const r = recommend({ ...THIRTY, riskIds: [risk], today: TODAY, ...bothDoses });
      expect(r.recs[0].doseLabel).not.toMatch(/review at age 50/i);
      expect(r.recs[0].minIntervalMonths).toBe(60);
    });
  }

  it('19-49 with a chronic condition only still gets "review at 50"', () => {
    const r = recommend({ ...THIRTY, riskIds: ['diabetes'], today: TODAY, ...bothDoses });
    expect(r.recs[0].doseLabel).toMatch(/review at age 50/i);
  });
});
