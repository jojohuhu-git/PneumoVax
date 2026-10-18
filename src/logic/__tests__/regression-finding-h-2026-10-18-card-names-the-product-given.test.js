// FINDING H + THE 112 RESIDUE (2026-10-18) — a card must name the PRODUCT the
// patient actually received, not the product named in the row the engine used.
//
// FINDING G fixed the AGE half of this fault: cards were saying "at/after age
// 6" to children vaccinated before 6. It pinned the PRODUCT half as an open
// owner decision and left it at a number, `toBe(112)`. This file is that half,
// and the class turned out to be bigger than the 112 — and bigger than the 380
// the handoff named.
//
// MEASURED OVER THE COMMITTED GRID, 2026-10-18, before the fix. Four statements
// name PCV13; in each, roughly half the cards carrying it belong to a child who
// never had a PCV13 dose:
//
//   statement                                            cards  product-wrong
//   ---------------------------------------------------------------------------
//   "...with PCV13 at/after age 6 who has received         760       380
//    PPSV23" (non-IC complete)  = FINDING H
//   "...whose only conjugate dose was PCV13 given at        456       228
//    or after age 6" (the IC twin, found by sweeping
//    the class rather than the one card reported)
//   "...with PCV13 only (at/after age 6)" (Option A)        224       112
//   "the most recent PCV13" (Options A and B)               448       224
//   "completed PCV13/15 before age 6" (rows 4/5)            288        32
//
// The wrong histories are: a PCV15 dose, a dose whose product the clinician
// could not name ("Unknown PCV product", a real option on the history step),
// and a PCV15 plus a same-day PCV20 the engine rejected. The last of the five
// is the unrecorded-product case only — "PCV13/15" is a fair description of a
// PCV13 or a PCV15, but not of a dose nobody recorded.
//
// THE DOSE DOES NOT MOVE, on any of them. Verified against a PCV13 control
// patient before the fix: an 18-year-old with chronic heart disease whose one
// dose at 16 was a PCV15 got output BYTE-IDENTICAL to the same child with a
// PCV13. So this is wording and citation only, and neither verdict corpus
// records prose.
//
// OWNER RULINGS THIS RESTS ON, both 2026-10-18:
//   1. "PCV13 and PCV15 are interchangeable when assessing how to move forward
//      in the schedule."
//   2. For a dose of unrecorded product, "it cannot be assumed a PCV20 was
//      given"; since PCV13 and PCV15 give the same answer, it takes the same
//      row.
//
// WHY A CITATION HAD TO BE ADDED, not just words changed. Every document that
// states a conjugate dose given at or after age 6 names PCV13 and only PCV13 —
// CDC's child notes ("Received PCV13 only at or after age 6 years"), p2016
// Table 4 rows 8/9 ("PCV13 only, given at or after age 6 years"), and CDC's
// risk-indications page, which has no at/after-6 branch at all. For a PCV15 at
// that age NO document has a row. Ruling 1 is ACIP's own sentence, read live
// 2026-10-18 from https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm
// ("interchangeably" appears exactly once in 44,208 chars):
//
//   "For all recommendations, PCV13 and PCV15 can be used interchangeably."
//
// It is `pedsPcv13Pcv15Interchangeable` in refs.js, and the card now says in
// its own words why a PCV13-worded row governs a PCV15 history.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { addCalendarMonths } from '../dateUtils.js';

/** Every note and dose label one patient is shown, as one searchable string. */
function proseOf(rec) {
  const note = typeof rec.note === 'string'
    ? rec.note
    : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' ');
  return `${note} ${rec.doseLabel ?? ''}`;
}

/**
 * The products of the doses the ENGINE counted, in order, '' for a dose whose
 * product the clinician could not name.
 *
 * Read from the engine's own `orderedDoses` + `perDose` rather than from the
 * input array, and that is not fussiness: 16 of the cards this fixes belong to
 * a child with a PCV15 and a same-day PCV20 that validate.js REJECTED. Against
 * the raw input that child looks like a PCV20 recipient, and a row describing
 * "PCV15 only" would read as a breach when it is correct. (P0 of 2026-10-12 is
 * the same lesson from the other direction: a caller that reads its own input
 * array alongside `perDose` puts every verdict on the wrong row.)
 */
const productsOf = (res) => (res.orderedDoses?.pcv ?? [])
  .map((d, i) => ({ d, v: res.perDose?.pcv?.[i] }))
  // 'noncounting' is PCV7, which never counts; 'invalid' is a rejected dose,
  // which is not a dose any row is written about. 'unknown' DOES count -- it is
  // the unrecorded-product case, and the whole point of ruling 2.
  .filter(({ v }) => v && v.status !== 'invalid' && v.status !== 'noncounting')
  .map(({ d }) => d.product || '');

/**
 * The statements that NAME a conjugate product, each with the test that the
 * patient really has it.
 *
 * Pinned as a table rather than inferred from the prose, because "PCV13" also
 * appears in these cards as part of a RECOMMENDATION ("1 dose of PCV15 or
 * PCV20"), and a sweep that could not tell the two apart would either miss the
 * fault or fire on correct text. Each needle below is a HISTORY clause.
 */
const HISTORY_CLAIMS = [
  { needle: 'with PCV13 only (at/after age 6)', holds: (p) => p.length > 0 && p.every((x) => x === 'PCV13') },
  { needle: 'with PCV15 only (at/after age 6)', holds: (p) => p.length > 0 && p.every((x) => x === 'PCV15') },
  { needle: 'with PCV13 and PCV15 only (at/after age 6)', holds: (p) => p.includes('PCV13') && p.includes('PCV15') && p.every((x) => x === 'PCV13' || x === 'PCV15') },
  { needle: 'with PCV13 at/after age 6 who has received PPSV23', holds: (p) => p.length > 0 && p.every((x) => x === 'PCV13') },
  { needle: 'with PCV15 at/after age 6 who has received PPSV23', holds: (p) => p.length > 0 && p.every((x) => x === 'PCV15') },
  { needle: 'conjugate dose was PCV13, given at or after age 6', holds: (p) => p.length === 1 && p[0] === 'PCV13' },
  { needle: 'conjugate dose was PCV15, given at or after age 6', holds: (p) => p.length === 1 && p[0] === 'PCV15' },
  { needle: 'completed PCV13/15 before age 6', holds: (p) => p.length > 0 && p.every((x) => x === 'PCV13' || x === 'PCV15') },
  // The anchor phrase. "the most recent PCV13" is only true of a child whose
  // most recent counting dose really was a PCV13; the fix replaces it with the
  // product-agnostic "the most recent PCV", which is also what p2016's Option A
  // cell and CDC's before-6 row both say.
  { needle: 'the most recent PCV13', holds: (p) => p.length > 0 && p[p.length - 1] === 'PCV13' },
];

/** Wording that must be gone from the app entirely after the fix. */
const RETIRED_WORDING = [
  'whose only conjugate dose was PCV13 given at or after age 6',
  '≥8 weeks after PCV13)',
];

describe('FINDING H - a card names the product the patient was actually given', () => {
  it('never names a conjugate product the patient did not receive', () => {
    const breaches = new Map();   // needle -> example keys
    const seen = new Map();       // needle -> cards carrying it
    const retired = new Map();    // retired needle -> cards still carrying it

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;

      const products = productsOf(result);
      for (const rec of result.recs ?? []) {
        const prose = proseOf(rec);

        for (const n of RETIRED_WORDING) {
          if (prose.includes(n)) retired.set(n, (retired.get(n) ?? 0) + 1);
        }

        for (const { needle, holds } of HISTORY_CLAIMS) {
          if (!prose.includes(needle)) continue;
          seen.set(needle, (seen.get(needle) ?? 0) + 1);
          if (!holds(products)) {
            const examples = breaches.get(needle) ?? [];
            if (examples.length < 4) examples.push(`${c.key} → [${products.map((x) => x || '?').join(',')}]`);
            breaches.set(needle, examples);
          }
        }
      }
    }

    expect(Object.fromEntries(retired)).toEqual({});
    expect(Object.fromEntries(breaches)).toEqual({});

    // ANTI-VACUITY, and the reason it is per-needle rather than one total.
    // Every assertion above is satisfied by prose that says nothing at all —
    // the hazard this repo has already been bitten by twice (the JOB_AID
    // label/short mix-up and `not.toContain` in the stale-identifier guard). So
    // each of the three product histories that really exist in the grid must
    // still be DESCRIBED somewhere, by name.
    expect(seen.get('with PCV13 only (at/after age 6)')).toBeGreaterThan(0);
    expect(seen.get('with PCV15 only (at/after age 6)')).toBeGreaterThan(0);
    expect(seen.get('with PCV13 at/after age 6 who has received PPSV23')).toBeGreaterThan(0);
    expect(seen.get('with PCV15 at/after age 6 who has received PPSV23')).toBeGreaterThan(0);
    expect(seen.get('completed PCV13/15 before age 6')).toBeGreaterThan(0);
  });

  it('a dose of unrecorded product is never described as PCV13, PCV15 or PCV20', () => {
    // OWNER RULING 2 (2026-10-18). The clinician chose "Unknown PCV product"
    // because they could not name it. The card must not name it for them — in
    // either direction: not as the PCV13 of the row it uses, and not as a PCV20
    // (which would complete the series and is the one guess that changes the
    // dose).
    const breaches = [];
    let cards = 0;

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;

      const products = productsOf(result);
      if (!products.some((x) => x === '')) continue;      // no unrecorded dose
      if (products.some((x) => x === 'PCV20' || x === 'PCV21')) continue;  // its own branch

      for (const rec of result.recs ?? []) {
        cards += 1;
        const prose = proseOf(rec);
        for (const { needle } of HISTORY_CLAIMS) {
          if (prose.includes(needle) && breaches.length < 6) {
            breaches.push(`${c.key} → "${needle}"`);
          }
        }
      }
    }

    expect(cards).toBeGreaterThan(0);        // the grid really reaches this patient
    expect(breaches).toEqual([]);
  });

  describe('the control patients, built by hand', () => {
    const patient = ({ ageMonths, riskIds, pcv, ppsv = [] }) => {
      const dob = addCalendarMonths(CORPUS_TODAY, -ageMonths);
      return recommend({
        ageMonths,
        dob,
        today: CORPUS_TODAY,
        riskIds,
        pcvDoses: pcv.map(([product, mo]) => ({ product, date: addCalendarMonths(dob, mo) })),
        ppsv23Doses: ppsv.map((mo) => ({ product: 'PPSV23', date: addCalendarMonths(dob, mo) })),
      });
    };
    const proseAll = (r) => (r.recs ?? []).map(proseOf).join('\n');

    it('FINDING H: 18y, chronic heart, PCV15 at 16 + PPSV23 at 17 — the card says PCV15', () => {
      const r = patient({ ageMonths: 216, riskIds: ['chronic_heart'], pcv: [['PCV15', 192]], ppsv: [204] });
      const prose = proseAll(r);
      expect(prose).toContain('with PCV15 at/after age 6 who has received PPSV23');
      // PCV13 is still NAMED — in the bridge sentence, which is the card saying
      // out loud why a PCV13-worded row speaks for this child. What it must not
      // do is CLAIM the history: "with PCV13".
      expect(prose).not.toContain('with PCV13');
      expect(prose).toContain('can be used interchangeably for all recommendations');
      // The VERDICT must not move. p2016 and CDC both end this child's series.
      expect((r.recs ?? []).map((x) => x.status)).toEqual(['complete']);
    });

    it('the PCV13 control gets the same dose and keeps its own product name', () => {
      const r = patient({ ageMonths: 216, riskIds: ['chronic_heart'], pcv: [['PCV13', 192]], ppsv: [204] });
      const prose = proseAll(r);
      expect(prose).toContain('with PCV13 at/after age 6 who has received PPSV23');
      // The row names what this child got, so there is nothing to bridge and
      // the card is byte-for-byte what it was before FINDING H.
      expect(prose).not.toContain('PCV15');
      expect(prose).not.toContain('interchangeably');
      expect((r.recs ?? []).map((x) => x.status)).toEqual(['complete']);
    });

    it('the 112 residue: 18y, cochlear implant, PCV15 at 16, no PPSV23 — Option A names PCV15', () => {
      const r = patient({ ageMonths: 216, riskIds: ['cochlear_implant'], pcv: [['PCV15', 192]] });
      const prose = proseAll(r);
      expect(prose).toContain('with PCV15 only (at/after age 6)');
      expect(prose).not.toContain('the most recent PCV13');
      // Both options still offered, with the products and the gap unchanged.
      const a = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option A'));
      const b = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option B'));
      expect(a?.brands).toEqual(['PCV20 (Prevnar 20)']);
      expect(b?.brands).toEqual(['PPSV23 (Pneumovax 23)']);
      expect(a?.minIntervalDays).toBe(56);
      expect(b?.minIntervalDays).toBe(56);
    });

    it('an unrecorded product at 16 is called exactly that, and is not assumed to be PCV20', () => {
      const r = patient({ ageMonths: 216, riskIds: ['cochlear_implant'], pcv: [['', 192]] });
      const prose = proseAll(r);
      expect(prose).toContain('unrecorded product');
      expect(prose).not.toContain('with PCV13');
      expect(prose).not.toContain('with PCV15');
      // Not assumed complete: a PCV20 would have ended the series here.
      expect((r.recs ?? []).map((x) => x.status)).not.toContain('complete');
    });
  });

  it('the interchangeability sentence is cited, and only where the row names another product', () => {
    // The bridge is the whole reason a PCV13-worded row may speak for a PCV15
    // history. If it were cited everywhere it would be noise; if nowhere, the
    // card would assert the substitution on its own authority.
    const KEY = 'pedsPcv13Pcv15Interchangeable';
    expect(REFS[KEY]?.quote).toBe('For all recommendations, PCV13 and PCV15 can be used interchangeably.');

    let citedWithPcv13Only = 0;
    let citedOtherwise = 0;
    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;
      const products = productsOf(result);
      for (const rec of result.recs ?? []) {
        if (!(rec.noteCites ?? []).some((x) => x.key === KEY)) continue;
        if (products.length > 0 && products.every((x) => x === 'PCV13')) citedWithPcv13Only += 1;
        else citedOtherwise += 1;
      }
    }
    expect(citedOtherwise).toBeGreaterThan(0);
    expect(citedWithPcv13Only).toBe(0);
  });
});
