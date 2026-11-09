// R4's third shape — OWNER RULING 2026-11-08 on "Max": "PCV20 only".
//
// Max, 5, no spleen. A year ago he got a PCV (product not recorded) and a
// PPSV23 on the same day, so the PPSV23 does not count (CHILD-PPSV23-AFTER-PCV).
// The 24-71-month at-risk catch-up card offered PCV20 or PCV15 and said "if
// PCV15 is used, add PPSV23 ≥8 weeks after". But any PPSV23 is held 5 years
// (§C-P2-FIVE), and once a PCV15 was given the next card asked for PCV20 in the
// PPSV23's place (§C-P2-ONE) — so choosing PCV15 cost him one extra shot, while
// PCV20 today finishes the series. Shown this, she chose "PCV20 only", as she
// had for Leah (a child, §C-P2-ONE), Sam (an adult, §C-P2-ONE-ADULT) and Kai
// (two thrown-out shots on this same card, §C-P2-NOTHIRD).
//
// Scope, as worked: ONE PPSV23, thrown out for coming too soon after a PCV, on
// the 24-71-month catch-up card. A single PPSV23 thrown out for being given
// under age 2 is not covered (not put to her) and is pinned unchanged below.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-11';
const MAX = { dob: '2021-10-11', today: TODAY, riskIds: ['asplenia'],
  pcvDoses: [{ product: '', date: '2025-10-11' }], ppsv23Doses: [{ date: '2025-10-11' }] };
const text = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const markers = (r) => (text(r).match(/\[c\]/g) ?? []).length;

describe('Max, 5: one PPSV23 thrown out for coming too soon after a PCV — PCV20 only', () => {
  it('the catch-up card offers PCV20 alone and says why not PCV15', () => {
    const out = recommend(MAX);
    expect(out.recs.map((r) => [r.doseLabel, r.brands])).toEqual([
      ['PCV dose 2 of 2 (at-risk catch-up)', ['PCV20 (Prevnar 20)']],
    ]);
    const card = out.recs[0];
    expect(card.dueToday).toBe(true);
    expect(text(card)).toContain('Give 2 doses of PCV20, ≥8 weeks after the most recent pneumococcal dose and ≥8 weeks apart [c] [c].');
    expect(text(card)).toContain('PCV15 is not offered: it would need a PPSV23 after it [c] — a second PPSV23 shot.');
    expect(text(card)).not.toMatch(/PCV15 is used/);
    expect(text(card)).not.toContain('that PPSV23 is followed by one further dose');
    expect(markers(card)).toBe(card.noteCites.length);
  });

  it('the line under the PPSV23 names no 2030 date, and the dose is not repeated', () => {
    const d = recommend(MAX).perDose.ppsv23[0];
    expect(d.reasons.join(' ')).toBe('Same day as PCV. Minimum interval 8 weeks.');
    expect(d.disposition).toBe('no-repeat');
  });

  it('his twin with a cochlear implant reads the same', () => {
    const out = recommend({ ...MAX, riskIds: ['cochlear_implant'] });
    expect(out.recs.map((r) => r.brands)).toEqual([['PCV20 (Prevnar 20)']]);
    expect(text(out.recs[0])).toContain('— a second PPSV23 shot.');
  });

  it('given the PCV20, he is complete — no extra shot', () => {
    const out = recommend({ ...MAX, today: '2026-12-06',
      pcvDoses: [...MAX.pcvDoses, { product: 'PCV20', date: '2026-10-11' }] });
    expect(out.recs.map((r) => r.status)).toEqual(['complete']);
  });

  it('the control: the same child with no PPSV23 is still offered PCV15', () => {
    const out = recommend({ ...MAX, ppsv23Doses: [] });
    expect(out.recs[0].brands).toContain('PCV15 (Vaxneuvance)');
  });

  it('not covered: a single PPSV23 thrown out for being given under age 2 keeps PCV15', () => {
    // PPSV23 at 20 months (too young), one PCV at 4: not Max's history, not ruled on.
    const out = recommend({ ...MAX, ppsv23Doses: [{ date: '2023-06-11' }] });
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(out.perDose.ppsv23[0].intervalRuleId ?? null).toBe(null);
    expect(out.recs[0].brands).toContain('PCV15 (Vaxneuvance)');
  });
});
