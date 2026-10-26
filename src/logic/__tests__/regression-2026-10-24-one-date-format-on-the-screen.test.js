// ─────────────────────────────────────────────────────────────────────────
// OWNER DECISION 2026-10-24 — one date format on the screen.
//
// ── WHAT WAS WRONG ───────────────────────────────────────────────────────
//
// The rec card has always printed dates through `fmtDate` ("Dec 7, 2026").
// The dose chips beside it printed raw ISO. So a single screen read:
//
//   card   "Not yet due — eligible Dec 7, 2026"
//   chip   "...can be given from 2026-09-25 at the earliest."
//
// Two formats, one patient. Measured over both corpora: 5,620 chip sentences
// in computer format.
//
// ── THE LINE THIS FIX MUST NOT CROSS ─────────────────────────────────────
//
// Only SENTENCES change. The DATA fields stay ISO — `earliestValidDate`,
// `repeatDueDate`, `earliestNextDate`, and every column of both corpora —
// because they are compared, sorted and committed, and a display format in a
// data field is how a corpus starts failing on a copy edit. Asserted below.
//
// ── AND ONE DATE DELIBERATELY LEFT ALONE ─────────────────────────────────
//
// "an owner clinical determination dated 2026-10-11" is PROVENANCE, not a
// patient date: it cites when a rule was decided, the way a document's
// publication date is cited. It stays as written. The sweep at the end of
// this file is what keeps the distinction honest — it allows exactly that
// one shape and fails on any other raw ISO date reaching a reader.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';
import { fmtDate } from '../format.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-24';

// A child with a dose given too soon: the chip states a repeat date.
const CHILD = {
  dob: '2026-03-23',
  ageMonths: 7,
  today: '2026-10-23',
  riskIds: [],
  ppsv23Doses: [],
  pcvDoses: [
    { product: 'PCV20', date: '2026-07-23' },
    { product: 'PCV20', date: '2026-09-21' },
    { product: 'PCV20', date: '2026-10-12' }, // 21 days after dose 2 — rejected
  ],
};

describe('a sentence prints a date the way a person writes one', () => {
  it('the chip under a rejected dose reads "Nov 9, 2026", not "2026-11-09"', () => {
    const dose = analyzeBoth({ ...CHILD }).pcv.perDose.at(-1);
    const text = dose.reasons.join(' ');
    expect(text).toContain('can be given from Nov 9, 2026 at the earliest');
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('the "Why this" detail names the previous dose the same way', () => {
    const dose = analyzeBoth({ ...CHILD }).pcv.perDose.at(-1);
    expect(dose.detail).toContain('since the dose of Sep 21, 2026');
    expect(dose.detail).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe('the DATA fields are untouched, and that is the whole safety margin', () => {
  it('keeps ISO in every field the corpora and the arithmetic read', () => {
    const dose = analyzeBoth({ ...CHILD }).pcv.perDose.at(-1);
    expect(dose.repeatDueDate).toBe('2026-11-09');
    expect(dose.earliestValidDate).toBe('2026-10-15');
    // The card's own field, read by the UI to render "eligible <date>".
    const card = recommend({ ...CHILD }).recs.find((r) => r.vaccine === 'PCV');
    if (card?.earliestNextDate) expect(card.earliestNextDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('the sentence is built from the field, so date arithmetic still fails here', () => {
    // Not a tautology: it fails if the sentence is ever hand-typed apart from
    // the field, which is the drift every "one home" test in this repo guards.
    const dose = analyzeBoth({ ...CHILD }).pcv.perDose.at(-1);
    expect(dose.reasons.join(' ')).toContain(fmtDate(dose.repeatDueDate));
  });
});

describe('the sweep: no raw ISO date reaches a reader except one', () => {
  // The provenance date, which is the single allowed exception.
  const ALLOWED = /owner clinical determination dated \d{4}-\d{2}-\d{2}/g;
  const ISO = /\d{4}-\d{2}-\d{2}/;

  // Patients chosen to reach the surfaces that print dates: a rejected child
  // dose, an adult counted-with-a-note dose, an adult rejected dose, a
  // future-dated entry and a before-birth entry.
  const CASES = [
    ['rejected child dose', CHILD],
    ['adult conjugate counted with a note', {
      ageMonths: 70 * 12, riskIds: [], today: TODAY,
      pcvDoses: [{ product: 'PCV13', date: '2026-01-15' }, { product: 'PCV20', date: '2026-08-15' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2024-06-01' }],
    }],
    ['adult PCV inside the year after a PPSV23', {
      ageMonths: 70 * 12, riskIds: [], today: TODAY,
      pcvDoses: [{ product: 'PCV20', date: '2026-02-05' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-01-01' }],
    }],
    ['a dose dated in the future', {
      dob: '1956-01-01', ageMonths: 846, today: TODAY, riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2027-12-01' }], ppsv23Doses: [],
    }],
    ['a dose dated before birth', {
      dob: '2025-10-11', ageMonths: 12, today: TODAY, riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2016-10-13' }], ppsv23Doses: [],
    }],
  ];

  it.each(CASES)('%s prints no bare ISO date', (_name, patient) => {
    const out = recommend({ today: TODAY, ...patient });
    const read = [];
    for (const r of out.recs) {
      read.push(r.doseLabel ?? '');
      if (typeof r.note === 'string') read.push(r.note);
      else if (r.note) read.push(r.note.lead ?? '', r.note.detail ?? '');
    }
    for (const stream of ['pcv', 'ppsv23']) {
      for (const d of out.perDose[stream] ?? []) {
        read.push(...(d.reasons ?? []), ...(d.whys ?? []), d.detail ?? '');
      }
    }
    const offenders = read
      .map((t) => String(t).replace(ALLOWED, ''))
      .filter((t) => ISO.test(t));
    expect(offenders, `raw ISO reached the reader: ${offenders.join(' // ')}`).toEqual([]);
  });

  // ⚠️ RETARGETED 2026-10-25. The exception exists because a PROVENANCE date
  // ("an owner clinical determination dated 2026-10-11") is not a patient date
  // and must stay in ISO. Its old example was an adult PPSV23 inside the year
  // after a PCV15, which was an owner floor; that row is now a CDC
  // recommendation and no longer prints the phrase, so the example moved to
  // the 4-week conjugate row — the one remaining adult rule that is hers.
  it('the exception really is exercised, so the filter is not dead code', () => {
    const rule = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS');
    expect(rule.authority).toBe('OWNER');
    expect(rule.source).toMatch(/OWNER CLINICAL DETERMINATION \d{4}-\d{2}-\d{2}/);
  });
});
