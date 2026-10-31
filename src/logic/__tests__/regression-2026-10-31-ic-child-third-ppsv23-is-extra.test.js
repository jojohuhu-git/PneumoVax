// ── §C-P2-THIRD (2026-10-31): an immunocompromised child's ON-TIME third PPSV23
// is an EXTRA dose ──────────────────────────────────────────────────────────
//
// OWNER RULING 2026-10-31, on "Lily": "Extra dose". CDC's child notes print
// "dose 2 PPSV23" and no third anywhere (read live 2026-10-30). P2 already
// called an EARLY third extra; an on-time third counted in silence, as dose 3,
// on a card that said "both PPSV23 doses have been received".
//
// THE KNOCK-ON AT 19, and why she was told of it in the question: at 19 the
// adult rows read every PPSV23 RECEIVED (§C-P2-ONTIME's "child today" limit),
// so Lily holds three, and mm7401a1 prints rows for one and for two. The
// two-dose row ("review at 50, or PCV20/PCV21 >=5 years") now speaks for two
// OR MORE — the dose it gives is the one the old fallback gave (same products,
// same five years, same status), so only the words and the citation move.
// Before: "PCV20 or PCV21 ... completes the series" with no ACIP number at all.
//
// ⚠ THE GRID CANNOT REACH THESE PATIENTS — it holds at most two PPSV23 doses.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));

// Lily: no spleen. PCV13 x2 at age 2, PPSV23 at 2y4m, 7y5m and 12y6m — each
// clear of the five years. 18 years 10 months today.
const LILY_HISTORY = {
  dob: '2008-01-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2010-01-05', '2010-03-05']),
  ppsv23Doses: d('PPSV23', ['2010-05-10', '2015-06-01', '2020-07-01']),
};
const LILY = { ...LILY_HISTORY, ageMonths: 226, today: '2026-10-31' };
const LILY_AT_19 = { ...LILY_HISTORY, ageMonths: 228, today: '2027-01-02' };
// The control: the same girl without the third dose.
const TWO_DOSE_AT_19 = { ...LILY_AT_19, ppsv23Doses: LILY_HISTORY.ppsv23Doses.slice(0, 2) };

const ppsvDoses = (p) => analyzeBoth(p).ppsv23.perDose;
const recsOf = (p) => recommend(p).recs;

describe('Lily — her on-time third PPSV23 is an extra dose', () => {
  it('the first two count; the third is extra, not dose 3', () => {
    const [a, b, c] = ppsvDoses(LILY);
    expect([a.status, a.effectiveDoseNum]).toEqual(['valid', 1]);
    expect([b.status, b.effectiveDoseNum]).toEqual(['valid', 2]);
    expect(c.extraDose).toBe(true);
    expect(c.effectiveDoseNum).toBeNull();
    expect(c.reasons.join(' ')).toContain(
      'Not needed: two PPSV23 doses have already been given (May 10, 2010 and Jun 1, 2015), and CDC never gives a third.',
    );
    expect(analyzeBoth(LILY).ppsv23.effective.map((x) => x.date)).toEqual(['2010-05-10', '2015-06-01']);
  });

  it('her card is still "complete", and now its "both" is true', () => {
    const recs = recsOf(LILY);
    expect(recs.map((r) => [r.vaccine, r.status])).toEqual([['PCV', 'complete']]);
    expect(JSON.stringify(recs[0].note)).toContain('both PPSV23 doses have been received');
  });

  it('an extra third still holds off a conjugate for 8 weeks (the Ben ruling)', () => {
    const p = { ...LILY, pcvDoses: [...LILY.pcvDoses, ...d('PCV20', ['2020-07-22'])] };
    const pcv20 = analyzeBoth(p).pcv.perDose[2];
    expect(pcv20.status).toBe('invalid');
    expect(pcv20.intervalRuleId).toBe('CHILD-PCV-AFTER-PPSV23');
  });
});

describe('at 19 she gets the two-dose girl\'s card', () => {
  it('both read "Review at age 50 — or PCV20 or PCV21", citing ACIP\'s two-dose row', () => {
    const lily = recsOf(LILY_AT_19);
    const control = recsOf(TWO_DOSE_AT_19);
    expect(lily.map((r) => [r.vaccine, r.status, r.doseLabel, r.earliestNextDate]))
      .toEqual(control.map((r) => [r.vaccine, r.status, r.doseLabel, r.earliestNextDate]));
    expect(lily[0].doseLabel).toMatch(/^Review at age 50/);
    expect(lily[0].noteCites.map((c) => c.key)).toContain('mmwrIc1949TwoPpsv');
  });

  it('her card says how many PPSV23 doses she has had', () => {
    expect(recsOf(LILY_AT_19)[0].note.detail).toContain('PCV13 and 3 doses of PPSV23');
    expect(recsOf(TWO_DOSE_AT_19)[0].note.detail).toContain('PCV13 and two doses of PPSV23');
  });
});

describe('limits', () => {
  it('a non-IC child is unchanged: the second is already extra, the third too', () => {
    const p = { ...LILY, riskIds: ['diabetes'] };
    expect(ppsvDoses(p).map((x) => x.effectiveDoseNum)).toEqual([1, null, null]);
  });

  it('an IC child\'s on-time SECOND still counts', () => {
    const p = { ...LILY, ppsv23Doses: LILY_HISTORY.ppsv23Doses.slice(0, 2) };
    expect(ppsvDoses(p).map((x) => [x.status, x.effectiveDoseNum])).toEqual([['valid', 1], ['valid', 2]]);
  });

  it('a third given AS AN ADULT is not touched — the adult rows count it', () => {
    const p = { ...LILY_AT_19, today: '2030-01-01', ageMonths: 264,
      ppsv23Doses: [...LILY_HISTORY.ppsv23Doses.slice(0, 2), ...d('PPSV23', ['2029-06-01'])] };
    expect(ppsvDoses(p)[2].extraDose).not.toBe(true);
  });
});
