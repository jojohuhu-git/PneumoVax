// OWNER DECISION 2026-10-25 — A REJECTED DOSE DOES NOT PROMISE A DOSE NOBODY
// IS ASKING FOR.
//
// ── The defect ───────────────────────────────────────────────────────────
//
// The grey note under a dose rejected for TIMING ended:
//
//   "...It is not repeated; the next dose in this series can be given from
//    2026-08-17 at the earliest."
//
// Swept over the grid, **647 of the 814 children** whose PPSV23 was rejected
// were shown that date on a screen where every card said they were finished or
// needed nothing:
//
//   398  at risk, series complete, PCV20 in it
//   111  PCV20 in the series, card reads "Not indicated"
//   138  no PCV20, complete or not indicated
//
// The worked patient that found it: a 5-year-old with asplenia, PCV20 on
// 2026-06-01 and a PPSV23 21 days later where 8 weeks are required. Her only
// card was about her PCV series; nothing on the screen asked for a PPSV23, and
// the note still named a date for one.
//
// ── What the owner ruled, and the document she gave ──────────────────────
//
// *"Children aged 2–18 years with any risk condition who completed a
// recommended PCV series before age 6 years: Completed series includes >=1
// dose of PCV20: No additional doses of any pneumococcal vaccine are
// indicated."*
//
// CDC/ACIP, "Use of 20-Valent Pneumococcal Conjugate Vaccine Among U.S.
// Children: Updated Recommendations of the Advisory Committee on Immunization
// Practices — United States, 2023", published 22 September 2023, **Table 1**.
// https://stacks.cdc.gov/view/cdc/133252 — verified live 2026-10-25, and the
// table read from the PDF, which is where the row lives (the stacks landing
// page carries metadata only).
//
// The recommendation CARDS already honoured this — `pcvInfant`'s complete
// branch has said "the series already includes PCV20, so no further
// pneumococcal dose is needed" since FINDING D. Only the note did not.
//
// ── THE TEST IS "IS ANYTHING OWED", NOT "IS A DOSE OF THIS VACCINE OWED" ──
//
// Deliberate, and the boundary this file mostly exists to hold. An adult whose
// PPSV23 was rejected IS owed something — a conjugate, per the 2026-10-24 and
// 2026-10-25 rulings — so her clause stays and goes on agreeing with her
// card's date. Keying on the vaccine STREAM would have stripped it from every
// one of those adults, one commit after the owner ruled that the two surfaces
// must agree. It is not an age test either: what separates these children is
// that nothing is owed, which `recs` states directly.
//
// Measured 2026-10-25 over both grids: 3,282 of 35,280 rendered lines changed
// (2,930 real patients, 352 impossible entries), 0 added, 0 removed, and every
// changed line is explained ENTIRELY by the clause being withdrawn — no line
// gained it, and nothing else in any line moved.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-24';
const run = (p) => recommend({ today: TODAY, ...p });
const chipsOf = (o) => [...o.perDose.pcv, ...o.perDose.ppsv23];
const textOf = (d) => (d.reasons ?? []).join(' ');
const FORWARD = 'can be given from';
const ASKS_FOR_NOTHING = new Set(['complete', 'not-indicated']);

describe('her worked child, and the sentence she should see', () => {
  it('a 5-year-old with asplenia whose PCV20 series covers her is promised nothing', () => {
    const out = run({
      ageMonths: 60,
      riskIds: ['asplenia'],
      pcvDoses: [
        { product: 'PCV20', date: '2026-06-01' },
        { product: 'PCV20', date: '2026-08-01' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-08-22' }],
    });
    // Table 1's row: the series is complete and contains PCV20.
    expect(out.recs.every((r) => ASKS_FOR_NOTHING.has(r.status))).toBe(true);
    const chip = out.perDose.ppsv23[0];
    expect(chip.status).toBe('invalid');
    // the half that is about the dose already given SURVIVES — it still does
    // not count, and it is still not repeated
    expect(textOf(chip)).toContain('This dose does not count toward the series');
    expect(textOf(chip)).toContain('It is not repeated.');
    // and the forward-looking half, with its date, is gone
    expect(textOf(chip)).not.toContain(FORWARD);
    expect(textOf(chip)).not.toMatch(/\d{4}-\d{2}-\d{2} at the earliest/);
  });

  it('a healthy 12-year-old whose only card reads "Not indicated" is promised nothing either', () => {
    const out = run({
      ageMonths: 144,
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2025-10-24' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-24' }],
    });
    expect(out.recs.map((r) => r.status)).toEqual(['not-indicated']);
    for (const chip of chipsOf(out).filter((d) => d.forwardLookingReason)) {
      expect(textOf(chip)).not.toContain(FORWARD);
    }
  });
});

describe('the boundary: a patient who IS owed something keeps her date', () => {
  // These two are the 2026-10-25 adult ruling, one commit earlier. If this
  // change ever keys on the vaccine stream instead of "is anything owed",
  // both of them lose the clause and go back to disagreeing with their cards.
  const A = {
    ageMonths: 720, riskIds: [],
    pcvDoses: [{ product: 'PCV13', date: '2026-07-19' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
  };
  const D4 = {
    ageMonths: 480, riskIds: ['asplenia'],
    pcvDoses: [{ product: 'PCV13', date: '2026-08-30' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
  };

  it('the adults of the PCV13 ruling keep the clause, and it matches their card', () => {
    for (const p of [A, D4]) {
      const out = run(p);
      const chip = chipsOf(out).find((d) => d.forwardLookingReason);
      expect(textOf(chip)).toContain(FORWARD);
      expect(textOf(chip)).toContain('Oct 11, 2027');
      // the same date the card states — the whole point of her 2026-10-24 ruling
      expect(out.recs[0].earliestNextDate).toBe('2027-10-11');
    }
  });

  it('a child who still owes a dose keeps hers too', () => {
    // Same asplenic 5-year-old, but only ONE PCV20 — her series is unfinished,
    // so a dose IS owed and the forward-looking date is honest.
    const out = run({
      ageMonths: 60,
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-06-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-22' }],
    });
    expect(out.recs.some((r) => !ASKS_FOR_NOTHING.has(r.status))).toBe(true);
    expect(textOf(out.perDose.ppsv23[0])).toContain(FORWARD);
  });
});

describe('swept over the grid', () => {
  it('no patient is ever promised a date while every card asks for nothing', () => {
    let withdrawn = 0; let kept = 0;
    const offenders = [];
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      if (!out?.recs?.length) continue;
      const chips = chipsOf(out).filter((d) => d.forwardLookingReason);
      if (!chips.length) continue;
      const nothingOwed = out.recs.every((r) => ASKS_FOR_NOTHING.has(r.status));
      const promises = chips.some((d) => textOf(d).includes(FORWARD));
      if (nothingOwed) {
        withdrawn++;
        if (promises) offenders.push(c.key);
      } else {
        kept++;
        // THE OTHER DIRECTION, and it is the one that matters most: a later
        // change must not quietly strip the clause from patients who need it.
        if (!promises) offenders.push(`LOST-WRONGLY ${c.key}`);
      }
    }
    expect(offenders).toEqual([]);
    // PINNED EXACTLY, both sides. A rise in `withdrawn` means the engine has
    // stopped asking for doses somewhere; a rise in `kept` means it has
    // started. Either is a clinical change and must be explained, not absorbed.
    expect({ withdrawn, kept }).toEqual({ withdrawn: 2930, kept: 2335 });
  });

  it('the surviving lead is on every one of them — the dose still does not count', () => {
    let seen = 0;
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      for (const d of chipsOf(out).filter((x) => x.forwardLookingReason)) {
        seen++;
        expect(textOf(d)).toContain('This dose does not count toward the series');
        expect(textOf(d)).toContain('It is not repeated');
      }
    }
    // anti-vacuity: the sweep above is worthless if nothing matches
    expect(seen).toBeGreaterThan(5000);
  });
});
