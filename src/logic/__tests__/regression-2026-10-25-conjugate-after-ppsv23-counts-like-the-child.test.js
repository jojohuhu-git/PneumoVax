// OWNER DECISION 2026-10-25 — "count like the child, provide alternative in
// comments."
//
// WHAT SHE WAS SHOWN. Two patients given the same two vaccines on the same two
// dates, fourteen days apart:
//
//   a 55-year-old with chronic lung disease   PPSV23 2026-06-01, PCV20 2026-06-15
//   a 6-year-old with asplenia                PPSV23 2026-06-01, PCV20 2026-06-15
//
// The child's conjugate counted and her series read Complete. The adult's was
// thrown out and she was told to come back on 2027-06-15. Nothing clinical
// separated them: the child rulebook simply has no conjugate-after-PPSV23 row,
// while the adult rulebook had `ADULT-PCV-AFTER-PPSV23`, an owner floor of
// 2026-10-11. Asked which answer was right, she chose the child's.
//
// THE ROW'S FOURTH STATE. floor (2026-10-11) -> recommendation (2026-10-24
// morning, "family 2") -> floor (2026-10-24 afternoon, on a 70-year-old whose
// PCV15 came 8 months after her PPSV23) -> recommendation. Because her
// 2026-10-24 afternoon ruling had named PCV15 specifically, she was asked
// whether this reaches it: *"All three — PCV15 too but make sure the
// alternative option is listed in the expander."*
//
// THE ALTERNATIVE IS PART OF THE RULING. Asked what the comment should say she
// chose *"Counted + alternative with a date"*. The date is the one the card and
// the chip printed while the row was a floor — same function, same clock — so
// a clinician who prefers to treat the dose as invalid reads the same day she
// would have read yesterday.
//
// Measured: 132 of 17,016 verdicts moved, 0 of 18,264 record-problem rows,
// every one of the 132 from "incomplete, return in a year" to Complete.
//
// See CLINICAL_SPEC.md §K, "OWNER DECISION 2026-10-25 — a second row left that
// table".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-25';
const run = (p) => recommend({ today: TODAY, ...p });
const ruleById = (id) => DOSE_INTERVAL_RULES.find((r) => r.id === id);
const whysOf = (d) => (d?.whys ?? []).join(' ');

// Her two patients, to the day.
const ADULT = {
  ageMonths: 55 * 12,
  riskIds: ['chronic_lung'],
  pcvDoses: [{ product: 'PCV20', date: '2026-06-15' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-01' }],
};
const CHILD = {
  ageMonths: 6 * 12,
  riskIds: ['asplenia'],
  pcvDoses: [{ product: 'PCV20', date: '2026-06-15' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-01' }],
};

describe('the two patients she was shown now agree', () => {
  it('the child counts her conjugate and reads complete — unchanged', () => {
    const out = run(CHILD);
    expect(out.perDose.pcv[0].status).toBe('valid');
    expect(out.recs.some((r) => r.status === 'complete')).toBe(true);
  });

  it('and so does the adult — the whole point of the ruling', () => {
    const out = run(ADULT);
    expect(out.perDose.pcv[0].status).toBe('valid');
    expect(out.recs.some((r) => r.status === 'complete')).toBe(true);
    // The row still SPEAKS for the dose. A silent pass would be a different
    // bug: she asked for a comment, not for the gap to go unremarked.
    expect(out.perDose.pcv[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
    expect(out.perDose.pcv[0].reasons.join(' '))
      .toContain('shorter than the 1 year CDC advises');
    expect(out.perDose.pcv[0].reasons.join(' '))
      .toContain('Counted; no repeat indicated');
  });

  it('neither patient is told to come back for a conjugate', () => {
    for (const p of [ADULT, CHILD]) {
      const labels = run(p).recs.map((r) => r.doseLabel).join(' ');
      expect(labels).not.toContain('≥1 year after the conjugate dose');
    }
  });
});

describe('all three conjugate products, because she said so by name', () => {
  // Her 2026-10-24 afternoon ruling had been about a PCV15, so the scope was
  // put to her explicitly. If a later change splits this row by product, this
  // is where it fails.
  for (const product of ['PCV15', 'PCV20', 'PCV21']) {
    it(`${product} given 14 days after a PPSV23 counts`, () => {
      const out = run({ ...ADULT, pcvDoses: [{ product, date: '2026-06-15' }] });
      expect(out.perDose.pcv[0].status).toBe('valid');
      expect(out.perDose.pcv[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
      expect(out.recs.some((r) => r.status === 'complete')).toBe(true);
    });
  }

  it('her own 70-year-old, the PCV15 patient of 2026-10-24, counts too', () => {
    const out = run({
      ageMonths: 70 * 12,
      riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    });
    expect(out.perDose.pcv[0].status).toBe('valid');
  });
});

describe('the alternative, with its date, in the expander', () => {
  const dose = () => run(ADULT).perDose.pcv[0];

  it('names the products, the date, and that the dose would be the one repeated', () => {
    expect(whysOf(dose()))
      .toContain('Alternative, if this dose is treated as invalid: 1 dose of PCV20 or PCV21 on or after Jun 15, 2027');
  });

  it('is in the WHY and not on the chip line — she asked for the expander', () => {
    expect(dose().reasons.join(' ')).not.toContain('Alternative, if this dose');
    expect(whysOf(dose())).toContain('Alternative, if this dose');
  });

  it('is emphasised, with balanced markers so the renderer cannot swallow it', () => {
    expect(whysOf(dose())).toMatch(/\*\*Alternative, if this dose is treated as invalid:[\s\S]*?\*\*/);
    for (const w of (dose().whys ?? [])) expect(w.split('**').length % 2).toBe(1);
  });

  it('says which kind of number it is — her 2026-10-24 honesty instruction', () => {
    // "State using 1 year is an interpretation from ACIP minimum interval for
    // adults between PCV13 and the next conjugate." That clause used to sit
    // on the recommendation card these patients no longer get, so it has to
    // survive here or it is lost.
    expect(whysOf(dose()))
      .toContain('read across from the only adult conjugate-to-conjugate interval ACIP states');
    expect(whysOf(dose())).toContain('an interpretation and not a stated rule');
  });

  it('and the chip still states CDC\'s own advised interval as advice', () => {
    expect(whysOf(dose()))
      .toContain('states that as recommended timing and does not direct that an earlier dose be repeated');
  });

  // ONE READING OF THE CLOCK. The alternative's date must be the number
  // `adultRepeatAfterInvalidDose` gives, because that is the number the card
  // and the chip printed while the row was a floor. Checked by MOVING the dose
  // and watching the alternative move with it by the same amount: a
  // hard-coded or separately-computed date would not.
  it('the date follows the dose given, a year later, to the day', () => {
    const cases = [
      ['2026-06-15', 'Jun 15, 2027'],
      ['2026-07-04', 'Jul 4, 2027'],
      ['2026-02-28', 'Feb 28, 2027'],
    ];
    for (const [given, expected] of cases) {
      const out = run({
        ...ADULT,
        ppsv23Doses: [{ product: 'PPSV23', date: '2026-02-01' }],
        pcvDoses: [{ product: 'PCV20', date: given }],
      });
      expect(whysOf(out.perDose.pcv[0])).toContain(`on or after ${expected}`);
    }
  });

  it('and never inside CDC\'s 4-day grace', () => {
    // The 2026-10-24 ruling the alternative must not undo: the grace decides
    // what the app ACCEPTS, never what it ADVISES.
    expect(whysOf(dose())).toContain('Jun 15, 2027');
    expect(whysOf(dose())).not.toContain('Jun 11, 2027');
  });
});

describe('the row itself', () => {
  it('is a CDC recommendation with no grace', () => {
    const rule = ruleById('ADULT-PCV-AFTER-PPSV23');
    expect(rule.enforcement).toBe('recommendation');
    // CDC, not OWNER — the Ruling F relabelling. As a recommendation it
    // asserts only CDC's own sentence; the owner-invented bar is what went.
    expect(rule.authority).toBe('CDC');
    // A recommendation counts every dose, so a grace could only move the day
    // the note starts printing.
    expect(rule.grace).toBe(false);
  });

  it('still covers all three conjugates and only a PPSV23-only history', () => {
    const rule = ruleById('ADULT-PCV-AFTER-PPSV23');
    expect(rule.products).toEqual(['PCV15', 'PCV20', 'PCV21']);
    expect(rule.needsNoPriorPcv).toBe(true);
    expect(rule.needsPriorPpsv23).toBe(true);
  });

  it('records its four states, so no superseded ruling reads as current', () => {
    const src = ruleById('ADULT-PCV-AFTER-PPSV23').source;
    expect(src).toMatch(/FOUR STATES, AND THIS IS THE FOURTH/);
    expect(src).toContain('count like the child');
    expect(src).toContain('All three — PCV15 too');
  });

  it('is no longer in the set of families whose CARD follows an invalid dose', () => {
    // It cannot reject a dose, so an entry there would be unreachable — and an
    // unreachable entry in a named set reads to a later session as evidence
    // the case is handled. Asserted through the engine rather than the set,
    // which is private: no patient of this family gets the repeat card.
    const out = run(ADULT);
    const text = out.recs.map((r) => (typeof r.note === 'string' ? r.note : r.note?.lead ?? '')).join(' ');
    expect(text).not.toContain('was given too soon to count');
  });
});

describe('no adult conjugate can be rejected for its timing any more', () => {
  // A CONSEQUENCE OF THE RULING, measured rather than assumed, and recorded
  // because it quietly killed a sentence.
  //
  // ADULT-PCV-AFTER-PPSV23 was the last adult row that could reject a PCV
  // dose; the other five adult PCV rows are recommendations or never flagged.
  // So `adultRepeatAfterInvalidDose`'s `conjugateToConjugate` basis can no
  // longer reach a recommendation CARD — a card only appears when the last
  // dose is invalid, and the last dose can no longer be an invalid conjugate.
  //
  // The sentence that basis prints — "It is an interpretation, not a stated
  // rule", with the paediatric 8 weeks named as paediatric — is therefore
  // unreachable on a card: measured 0 of 35,223 cards over both grids. It has
  // NOT been deleted. The same clause now rides the dose's own disclosure for
  // all 132 patients, and if a later ruling re-floors an adult conjugate the
  // card path is there and correct. What a later session must not do is
  // "clean up" the card branch on the strength of a coverage report.
  it('every adult PCV row is a recommendation or never flagged', () => {
    const adultPcvRows = DOSE_INTERVAL_RULES
      .filter((r) => r.rulebook === 'adult' && r.vaccine === 'PCV');
    expect(adultPcvRows.length).toBeGreaterThan(0);
    for (const r of adultPcvRows) expect(r.enforcement, r.id).not.toBe('floor');
  });

  it('so no PCV dose in the grid is ever rejected by an adult rule', () => {
    // ⚠️ KEYED ON THE RULE THAT FIRED, not on the patient's age today, and the
    // first draft got that wrong: filtering by `ageMonths >= 228` found 1,287
    // "offenders", every one of them a 50-, 65- or 70-year-old with a dose
    // recorded in CHILDHOOD and rejected by CHILD-PCV-AFTER-PCV. The rulebook
    // is chosen by the age AT THE DOSE (`rulebookOf(ctx.ageAtDose)`), so an
    // adult patient's infant doses are a child's doses. Those rejections are
    // correct and are not what this test is about — and they cannot reach the
    // card either, because `adultRepeatOwed` only fires for the ADULT rule ids
    // in its named set.
    const offenders = [];
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      for (const d of (out.perDose?.pcv ?? [])) {
        if (d.status === 'invalid' && !d.recordProblem
          && String(d.intervalRuleId ?? '').startsWith('ADULT-')) {
          offenders.push([c.key, d.intervalRuleId]);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('and the card\'s conjugate-to-conjugate wording appears on no card at all', () => {
    // 0 of 35,223 cards over both grids when this was measured. Kept as the
    // record that the clause did not vanish, it MOVED — the companion count
    // is the 132 in the sweep below.
    let onCards = 0;
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      for (const r of (out.recs ?? [])) {
        const t = typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`;
        if (t.includes('It is an interpretation, not a stated rule')) onCards++;
      }
    }
    expect(onCards).toBe(0);
  });
});

describe('swept over the grid', () => {
  // The exact population, pinned. A RISE means doses are being counted that
  // were not part of her ruling; a FALL means some of her 132 have been taken
  // back. Either is a clinical change.
  it('exactly 132 patients are judged by this row, and every one of them counts', () => {
    let judged = 0;
    const offenders = [];
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      const hits = (out.perDose?.pcv ?? [])
        .filter((d) => d.intervalRuleId === 'ADULT-PCV-AFTER-PPSV23');
      if (!hits.length) continue;
      judged++;
      if (hits.some((d) => d.status !== 'valid')) offenders.push(c.key);
      // And every one carries the alternative she asked for.
      if (hits.some((d) => !whysOf(d).includes('Alternative, if this dose is treated as invalid')))
        offenders.push(`NO-ALTERNATIVE ${c.key}`);
    }
    expect(offenders).toEqual([]);
    expect(judged).toBe(132);
  });

  it('no child is judged by it — the adult rulebook keeps its own row', () => {
    // "Count like the child" moved the adult to the child's answer. It did
    // NOT give the child an adult rule, which would be the opposite mistake.
    for (const c of buildCases()) {
      if ((c.input.ageMonths ?? 0) >= 228) continue;
      let out; try { out = recommend(c.input); } catch { continue; }
      for (const d of (out.perDose?.pcv ?? [])) {
        expect(d.intervalRuleId).not.toBe('ADULT-PCV-AFTER-PPSV23');
      }
    }
  });
});
