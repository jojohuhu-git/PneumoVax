// OWNER RULING 2026-11-07 — Zoe, "Drop it, like Kai" (CLINICAL_SPEC.md §B-50BABY).
//
// Zoe is 2 years 3 months and healthy: PCV15 at 2, 4, 6 and 12 months, and a
// PPSV23 at 2 she did not need (her chip reads "extra"). Her 24–59-month card
// ended, under "Why this", "Re-evaluate at age 50". Run forward, at 50 the
// adult card reads "Complete (PCV15 + PPSV23)": 50 brings her nothing. This is
// Kai's history (regression-2026-11-07-kai-pcv15-ppsv23-age-50) one card
// younger. Control: the same girl with PCV13 instead is owed PCV20 or PCV21 at
// 50, so her line is right.
//
// HOW: the toddler card asks the same forward run to 50 that Kai's 5–18 card
// asks, in place of its own "series includes PCV20" test — one reading of the
// adult schedule, not two. The adult-only-tick limit (Ava's ruling) stays: a
// smoker is given a dose at 19, which a run to 50 cannot see.
//
// Measured over 2,178 hand-built healthy complete toddlers before the fix: 120
// carried the line while 50 asks for nothing, every one PCV15 + PPSV23. The
// grid builds none of them. Babies: 0 (a PPSV23 cannot count before age 2).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-07';
const DOB = '2024-08-07'; // 2 years 3 months
const AT_50 = '2074-08-07';
const AGE_50 = 'Re-evaluate at age 50, when routine pneumococcal vaccination begins for every adult [c].';
const INFANT = ['2024-10-07', '2024-12-07', '2025-02-07', '2025-08-07'];
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const markers = (r) => (noteText(r).match(/\[c\]/g) ?? []).length;
const pcvOf = (product, dates) => dates.map((date) => ({ product, date }));

function child({ pcv, ppsv = [], riskIds = [], today = TODAY, dob = DOB }) {
  return recommend({
    dob, today, riskIds,
    pcvDoses: pcv,
    ppsv23Doses: ppsv.map((date) => ({ product: 'PPSV23', date })),
  });
}
const ZOE = { pcv: pcvOf('PCV15', INFANT), ppsv: ['2026-08-07'] };
const CONTROL = { pcv: pcvOf('PCV13', INFANT), ppsv: ['2026-08-07'] };
const card = (out) => out.recs.find((r) => r.doseLabel === 'PCV series complete');
const LEAD = 'Healthy child 24–59 months whose age-appropriate PCV schedule is complete — no additional doses needed [c] [c]. (A series that includes PCV20 also needs no PPSV23.)';

describe('Zoe: the toddler card drops "age 50" when the adult card at 50 would read Complete', () => {
  it('the premise: her PPSV23 is extra today, and at 50 she reads Complete (PCV15 + PPSV23)', () => {
    expect(child(ZOE).perDose.ppsv23[0].extraDose).toBe(true);
    expect(child({ ...ZOE, today: AT_50 }).recs.map((r) => r.doseLabel)).toEqual(['Complete (PCV15 + PPSV23)']);
  });

  it('Zoe — no line, no adult source; the card is otherwise unchanged', () => {
    const c = card(child(ZOE));
    expect(c.status).toBe('complete');
    expect(c.note).toBe(LEAD);
    expect(c.noteCites.map((x) => x.key)).toEqual(['pedsNoPcv20IfComplete', 'p2016HealthyComplete24to59']);
    expect(markers(c)).toBe(c.noteCites.length);
  });

  it('control — PCV13 + PPSV23: keeps the line, because at 50 she is owed PCV20 or PCV21', () => {
    const c = card(child(CONTROL));
    expect(c.note.detail).toBe(AGE_50);
    expect(c.noteCites.map((x) => x.key)).toContain('adultRoutine50');
    expect(child({ ...CONTROL, today: AT_50 }).recs.some((r) => r.dueToday)).toBe(true);
  });

  it('control — Zoe WITHOUT the PPSV23: keeps the line, because at 50 she is owed PPSV23', () => {
    const noPpsv = { pcv: ZOE.pcv };
    expect(card(child(noPpsv)).note.detail).toBe(AGE_50);
    expect(child({ ...noPpsv, today: AT_50 }).recs.some((r) => r.dueToday)).toBe(true);
  });

  it('Ava (PCV20 series) still has no line — the forward run gives her answer too', () => {
    const c = card(child({ pcv: pcvOf('PCV20', INFANT) }));
    expect(c.note).toBe(LEAD);
    expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
  });

  it('a PPSV23 dated in the FUTURE does not take the line off — the forward run leaves it out', () => {
    const out = child({ pcv: ZOE.pcv, ppsv: ['2027-08-07'] });
    expect(out.perDose.ppsv23[0].recordProblem).toBeTruthy();
    expect(card(out).note.detail).toBe(AGE_50);
  });

  it('smoking ticked: still no line (Ava\'s limit — the dose comes at 19, not 50)', () => {
    const c = card(child({ pcv: pcvOf('PCV15', INFANT), riskIds: ['smoking'] }));
    expect(noteText(c)).not.toContain('Re-evaluate at age 50');
    expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
  });

  it('over hand-built healthy babies and toddlers: the line is on a complete card exactly when 50 asks for something', () => {
    // The grid builds no healthy toddler with a PPSV23, so this sweep is the
    // guard. Every age, every product per dose, with and without a PPSV23 and
    // an extra PCV20 at 14 months.
    const addM = (d, m) => { const x = new Date(`${d}T00:00:00Z`); x.setUTCMonth(x.getUTCMonth() + m); return x.toISOString().slice(0, 10); };
    const P = ['PCV13', 'PCV15', 'PCV20'];
    const counts = { babyLine: 0, babyNone: 0, toddlerLine: 0, toddlerNone: 0 };
    for (const ageM of [13, 16, 20, 23, 25, 30, 40, 50, 59]) {
      const dob = addM(TODAY, -ageM);
      const slots = [2, 4, 6, 12].filter((m) => m <= ageM - 1);
      let combos = [[]];
      for (let i = 0; i < slots.length; i += 1) combos = combos.flatMap((c) => P.map((p) => [...c, p]));
      for (const extraPcv20 of [false, true]) {
        if (extraPcv20 && ageM < 15) continue;
        for (const ppsvAt of [null, 24, 36]) {
          if (ppsvAt && ppsvAt > ageM - 1) continue;
          for (const prods of combos) {
            const pcv = slots.map((m, i) => ({ product: prods[i], date: addM(dob, m) }));
            if (extraPcv20) pcv.push({ product: 'PCV20', date: addM(dob, 14) });
            const input = { dob, today: TODAY, riskIds: [], pcvDoses: pcv, ppsv23Doses: ppsvAt ? [{ product: 'PPSV23', date: addM(dob, ppsvAt) }] : [] };
            const r = recommend(input).recs[0];
            if (r?.status !== 'complete') continue;
            const asks = recommend({ ...input, today: addM(dob, 600) }).recs
              .some((x) => !['complete', 'no-dose-now', 'not-indicated'].includes(x.status));
            const hasLine = noteText(r).includes('Re-evaluate at age 50');
            const who = `${ageM}m ${prods.join('+')}${extraPcv20 ? '+PCV20' : ''} ppsv@${ppsvAt}`;
            expect(hasLine, who).toBe(asks);
            expect(markers(r), who).toBe(r.noteCites.length);
            counts[`${ageM < 24 ? 'baby' : 'toddler'}${hasLine ? 'Line' : 'None'}`] += 1;
          }
        }
      }
    }
    // Pinned exactly so a change widening or narrowing the gate is looked at.
    // Before the fix the toddler split was 208 / 1,898; Zoe's family is the 120.
    expect(counts).toEqual({ babyLine: 64, babyNone: 503, toddlerLine: 88, toddlerNone: 2018 });
  });
});
