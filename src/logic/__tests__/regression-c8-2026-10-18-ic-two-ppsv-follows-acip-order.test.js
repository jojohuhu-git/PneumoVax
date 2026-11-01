/**
 * The 19-49 immunocompromised card with PCV13 and TWO PPSV23 doses — 45 cards.
 *
 * ── WHAT WAS WRONG ────────────────────────────────────────────────────────
 *
 * mm7401a1's immunocompromising block answers a PCV13 + PPSV23 history in two
 * rows, and they are not the same answer:
 *
 *   PCV13 and 1 dose of PPSV23
 *     "A single dose of PCV21 or PCV20 >=5 years after the last pneumococcal
 *      vaccine dose. The pneumococcal vaccination series is complete..."
 *     -> a flat recommendation. Give it.
 *
 *   PCV13 and 2 doses of PPSV23
 *     "The pneumococcal vaccination recommendations should be reviewed again
 *      when the person turns age 50 years. ALTERNATIVELY, a single dose of
 *      either PCV21 or PCV20 should be administered >=5 years after the last
 *      pneumococcal vaccine dose..."
 *     -> review at 50 FIRST, the dose as the alternative.
 *
 * The app gave both patients the same card, stating the dose flatly. Not a
 * contradiction — ACIP's "Alternatively" sentence is word-for-word permission
 * — but the app hid a choice its own source prints, on the one card where
 * ACIP's lead is to wait. It was raised to the owner as an emphasis question.
 *
 * ── OWNER DECISION 2026-10-18: *"use MMWR"* ──────────────────────────────
 *
 * She answered with the full row, which is now what the card says and what its
 * citation quotes. The ONE-dose card is untouched: ACIP's one-dose row really
 * is a flat recommendation, and treating the two the same is the error, in
 * either direction.
 *
 * ── WHAT DID NOT CHANGE ───────────────────────────────────────────────────
 *
 * `status` and the dose's due date. The dose remains available today; ACIP
 * permits it explicitly. Only the card's WORDS change — its note and its dose
 * label, so the header and the body do not disagree with each other. The
 * verdict corpora record no prose and no dose labels by design, so neither
 * moves: a red corpus must always mean a patient's answer changed.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-11';
const run = (input) => recommend({ today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [], ...input });
const noteText = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));
const citeKeys = (rec) => (rec.noteCites ?? []).map((c) => c.key);
const effectivePpsv = (r) => (r.perDose?.ppsv23 ?? []).filter((d) => d.effectiveDoseNum != null).length;

const TWO_PCV13 = [{ product: 'PCV13', date: '2014-03-01' }, { product: 'PCV13', date: '2015-03-01' }];
const PCV13 = [{ product: 'PCV13', date: '2015-03-01' }];
const ONE_PPSV = [{ product: 'PPSV23', date: '2016-03-01' }];
const TWO_PPSV = [{ product: 'PPSV23', date: '2016-03-01' }, { product: 'PPSV23', date: '2021-03-01' }];
const IC_19_49 = { ageMonths: 228, riskIds: ['asplenia'] };
const AT_55 = { ageMonths: 660, riskIds: ['asplenia'] };

// mm7401a1's two-dose row, in full, as the owner quoted it.
const ROW_TWO_PPSV = 'The pneumococcal vaccination recommendations should be reviewed again '
  + 'when the person turns age 50 years. Alternatively, a single dose of either PCV21 or PCV20 '
  + 'should be administered ≥5 years after the last pneumococcal vaccine dose. If PCV21 or '
  + 'PCV20 is used, the series is complete, and it need not be followed by additional '
  + 'pneumococcal vaccine doses.';

const twoDoseCard = () => {
  const r = run({ ...IC_19_49, pcvDoses: TWO_PCV13, ppsv23Doses: TWO_PPSV });
  expect(effectivePpsv(r)).toBe(2);
  return (r.recs ?? [])[0];
};

describe('the 19-49 IC card with two PPSV23 doses follows ACIP’s order', () => {
  it('quotes the whole row, not just its "Alternatively" sentence', () => {
    expect(REFS.mmwrIc1949TwoPpsv.quote).toBe(ROW_TWO_PPSV);
    expect(REFS.mmwrIc1949TwoPpsv.quote.startsWith('The pneumococcal vaccination recommendations')).toBe(true);
  });

  it('the card leads with the review at 50 and offers the dose as the alternative', () => {
    const card = twoDoseCard();
    const text = noteText(card);
    const review = text.indexOf('age 50');
    const dose = text.indexOf('PCV20 or PCV21');
    expect(review, text).toBeGreaterThan(-1);
    expect(dose, text).toBeGreaterThan(-1);
    expect(review, 'the review at 50 must come first').toBeLessThan(dose);
    expect(text).toContain('Alternatively');
    // The dose label is the first line a clinician reads, so it must not
    // still lead with the dose while the note leads with the review.
    expect(card.doseLabel.indexOf('50')).toBeLessThan(card.doseLabel.indexOf('PCV20'));
  });

  it('both documents are still cited, each beside the half it supports', () => {
    const card = twoDoseCard();
    // mm7401a1's row is the only source for "review again at 50"; CDC's Adult
    // Notes state only the dose and its five years.
    expect(citeKeys(card)).toContain('mmwrIc1949TwoPpsv');
    expect(citeKeys(card)).toContain('adultIc1949BothPcv13Ppsv');
    expect(REFS.adultIc1949BothPcv13Ppsv.quote).not.toContain('50');
  });

  it('the dose is still available today — only the words changed', () => {
    const card = twoDoseCard();
    expect(card.vaccine).toBe('PCV');
    expect(card.status).toBe('risk-based');
    expect(card.brands).toEqual(['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)']);
  });

  // The half ACIP states flatly must STAY flat, or this fix has simply moved
  // the error from one row to the other.
  it('the ONE-dose IC card still states the dose, with no review at 50', () => {
    const card = (run({ ...IC_19_49, pcvDoses: PCV13, ppsv23Doses: ONE_PPSV }).recs ?? [])[0];
    const text = noteText(card);
    expect(text).toContain('PCV13 and PPSV23 already given');
    expect(text).not.toContain('Alternatively');
    expect(text).not.toContain('age 50');
    expect(citeKeys(card)).toContain('mmwrIc1949OnePpsv');
  });

  it('the 50+ card with two PPSV23 doses is untouched', () => {
    const card = (run({ ...AT_55, pcvDoses: TWO_PCV13, ppsv23Doses: TWO_PPSV }).recs ?? [])[0];
    const text = noteText(card);
    expect(text).toContain('PCV13 and PPSV23 already given');
    expect(text).not.toContain('Alternatively');
    expect(citeKeys(card)).toContain('mmwrBothPcv13Ppsv50plus');
  });
});

describe('over the whole grid', () => {
  const counts = (() => {
    let acipOrder = 0;
    let flat = 0;
    for (const c of buildCases()) {
      let r;
      try { r = recommend(c.input); } catch { continue; }
      if (r.excluded) continue;
      for (const rec of r.recs ?? []) {
        const t = noteText(rec);
        if (t.startsWith('Review the pneumococcal recommendations again at age 50')) acipOrder++;
        if (t.startsWith('PCV13 and PPSV23 already given')) flat++;
      }
    }
    return { acipOrder, flat };
  })();

  it('exactly the 45 two-dose 19-49 cards changed', () => {
    // was 45; -5, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
    // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
    // counting conjugate and her card family changes with it. The invariant
    // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
    expect(counts.acipOrder).toBe(40);
  });

  it('the other 1,467 PCV13 + PPSV23 cards keep the flat wording', () => {
    // 2026-10-24, RULING F: the 363 patients whose early PCV20 now counts
    // read "Complete (history includes PCV20)" instead of a dose-due card.
    // All 363 are at 50+. They split by the mm7401a1 row their OLD card
    // used: 253 from the flat ">=5 years after the last pneumococcal dose"
    // row, and 110 from the shared-clinical-decision row at >=65, which
    // already carried a job-aid button. Measured with scripts/proseDiff.mjs
    // over both grids; see CLINICAL_SPEC.md section K, Ruling F.
    // 185 + 952 + 330 measured by effective dose count and age band,
    // then - 253: the flat-wording half of Ruling F's 363.
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +159 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      // +/-132, 2026-10-31 (§H-ANY65, owner ruling "Pat, 70"): a 70-year-old with a
      // PPSV23 before 65 AND one at 65 now reads the shared-decision card, as CDC
      // words his row, so its buttons (the job aid's and mm7401a1's at-65 rows)
      // move with the card. Zero uncredited is unchanged.
      expect(counts.flat).toBe(185 + 952 + 330 - 253 + 159 - 132);
  });
});
