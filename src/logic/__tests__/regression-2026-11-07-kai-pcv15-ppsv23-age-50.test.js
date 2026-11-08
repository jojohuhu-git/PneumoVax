// OWNER RULING 2026-11-07 — Kai, "Drop it, like Nina" (CLINICAL_SPEC.md §B-5TO18).
//
// Kai is 5 and healthy: PCV15 at 2, 4, 6 and 12 months, and a PPSV23 at 4 he
// did not need (his chip reads "extra"). His card ended, under "Why this",
// "Re-evaluate at age 50". Run forward, at 50 the adult card reads
// "Complete (PCV15 + PPSV23)": 50 brings him nothing. Control: the same boy
// with PCV13 instead is owed PCV20 or PCV21 at 50, so his line is right.
//
// The 66 "invalid PCV20" cards of the last two handoffs are this family: each
// also has a PCV15 and a PPSV23, and that pair — not the PCV20 — is why the
// adult card at 50 reads Complete. 237 grid cards in all, every one a healthy
// 5–18 card with a PCV15 and a PPSV23 on record.
//
// HOW: the card runs the same patient forward to 50 (as §B-AT19 does at 19)
// and keeps the line only when the adult card there asks for something. Leo
// and Nina's PCV20 rule is the same answer for their histories; it is now read
// off that one run instead of being a second reading of the adult schedule.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-11-07';
const DOB = '2021-11-07'; // 5 years exactly
const AT_50 = '2071-11-07';
const AGE_50 = 'Re-evaluate at age 50, when routine pneumococcal vaccination begins for every adult [c].';
const INFANT = ['2022-01-07', '2022-03-07', '2022-05-07', '2022-11-07'];
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const markers = (r) => (noteText(r).match(/\[c\]/g) ?? []).length;
const pcvOf = (product, dates) => dates.map((date) => ({ product, date }));

function child({ pcv, ppsv = [], riskIds = [], today = TODAY }) {
  return recommend({
    dob: DOB, today, riskIds,
    pcvDoses: pcv,
    ppsv23Doses: ppsv.map((date) => ({ product: 'PPSV23', date })),
  });
}
const KAI = { pcv: pcvOf('PCV15', INFANT), ppsv: ['2025-11-07'] };
const CONTROL = { pcv: pcvOf('PCV13', INFANT), ppsv: ['2025-11-07'] };
const card = (out) => out.recs.find((r) => r.doseLabel === 'Not indicated (healthy 5–18y)');

describe('Kai: no age-50 line when the adult card at 50 would read Complete', () => {
  it('the premise: his PPSV23 is extra today, and at 50 he reads Complete (PCV15 + PPSV23)', () => {
    expect(child(KAI).perDose.ppsv23[0].extraDose).toBe(true);
    const at50 = child({ ...KAI, today: AT_50 }).recs;
    expect(at50.map((r) => r.doseLabel)).toEqual(['Complete (PCV15 + PPSV23)']);
  });

  it('Kai — no line, no adult source; the card is otherwise unchanged', () => {
    const c = card(child(KAI));
    expect(c.status).toBe('not-indicated');
    expect(c.dueToday).toBe(false);
    expect(noteText(c)).not.toContain('Re-evaluate at age 50');
    expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
    expect(c.note.detail).toBe('CDC recommends PCV catch-up for healthy children only through age 4. After that, PCV is recommended only for a child with a risk condition [c].');
    expect(markers(c)).toBe(c.noteCites.length);
  });

  it('control — PCV13 + PPSV23: keeps the line, because at 50 he is owed PCV20 or PCV21', () => {
    const c = card(child(CONTROL));
    expect(c.note.detail).toContain(AGE_50);
    expect(c.noteCites.map((x) => x.key)).toContain('adultRoutine50');
    expect(child({ ...CONTROL, today: AT_50 }).recs.some((r) => r.dueToday)).toBe(true);
  });

  it('control — Kai WITHOUT the PPSV23: keeps the line, because at 50 he is owed PPSV23', () => {
    const noPpsv = { pcv: KAI.pcv };
    expect(card(child(noPpsv)).note.detail).toContain(AGE_50);
    expect(child({ ...noPpsv, today: AT_50 }).recs.some((r) => r.dueToday)).toBe(true);
  });

  it('the "invalid PCV20" family: same-day PCV15 + PCV20, then a PPSV23 — no line', () => {
    const p = { pcv: pcvOf('PCV15', ['2023-11-07']).concat(pcvOf('PCV20', ['2023-11-07'])), ppsv: ['2025-11-07'] };
    const out = child(p);
    expect(out.perDose.pcv.some((d, i) => out.orderedDoses.pcv[i].product === 'PCV20' && d.status === 'invalid')).toBe(true);
    expect(noteText(card(out))).not.toContain('Re-evaluate at age 50');
    expect(child({ ...p, today: AT_50 }).recs.every((r) => r.status === 'complete')).toBe(true);
  });

  it('a dose dated in the FUTURE does not take the line off — the forward run leaves it out', () => {
    // A PCV20 typed as next year is "a dose the patient never had" today. At 50
    // its date is in the past, and the adult card would count it. The prose
    // diff found 96 impossible entries losing the line this way.
    const out = child({ pcv: pcvOf('PCV13', INFANT).concat(pcvOf('PCV20', ['2027-11-07'])) });
    expect(out.perDose.pcv[4].recordProblem).toBeTruthy();
    expect(card(out).note.detail).toContain(AGE_50);
    // Kai's PPSV23 typed as next year: same — he is owed PPSV23 at 50.
    expect(card(child({ pcv: KAI.pcv, ppsv: ['2027-11-07'] })).note.detail).toContain(AGE_50);
  });

  it('smoking ticked: no line at all — not 50, and not the "19" swap either', () => {
    const c = card(child({ ...KAI, riskIds: ['smoking'] }));
    expect(noteText(c)).not.toMatch(/Re-evaluate at age (50|19)/);
    expect(c.noteCites.map((x) => x.key)).not.toContain('adultRoutine50');
    expect(c.noteCites.map((x) => x.key)).not.toContain('cdcAdultRiskFactorList');
    expect(markers(c)).toBe(c.noteCites.length);
  });

  it('over the whole grid: the line is on a healthy 5–18 card exactly when 50 asks for something', () => {
    // The direct statement of her ruling, and the guard against a future
    // card that names an age at which the app itself does nothing.
    const fiftieth = (dob) => `${+dob.slice(0, 4) + 50}${dob.slice(4)}`;
    let withLine = 0; let without = 0;
    for (const c of buildCases()) {
      const r = card(recommend(c.input));
      if (!r) continue;
      const at50 = recommend({ ...c.input, ageMonths: undefined, today: fiftieth(c.input.dob) }).recs;
      const asks = at50.some((x) => !['complete', 'no-dose-now', 'not-indicated'].includes(x.status));
      const hasLine = noteText(r).includes('Re-evaluate at age 50');
      // The smoking/alcohol "age 19" swap replaces the line; it only happens
      // where 50 asked for something too, so it counts as "a line".
      const has19 = /Re-evaluate at age 19/.test(noteText(r));
      expect(hasLine || has19, c.key).toBe(asks);
      if (hasLine || has19) withLine += 1; else without += 1;
      expect(markers(r), c.key).toBe(r.noteCites.length);
    }
    expect(withLine).toBe(957); // 553 say "50", 404 say "19"
    // Leo + Nina's PCV20 families plus Kai's 237. Pinned exactly so that a
    // change widening or narrowing the gate fails here and is looked at.
    expect(without).toBe(WITHOUT_LINE);
  });
});

// Measured 2026-11-07: 390 on main before Kai (Leo + Nina), 627 after (+237).
const WITHOUT_LINE = 627;
