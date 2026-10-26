/**
 * The Adult Timing Job Aid's last three uncredited statements — 3,189 cards.
 *
 * ── THE QUESTION ──────────────────────────────────────────────────────────
 *
 * Three card statements rested on the job aid alone, and the job aid states
 * all three as TABLE CELLS and nowhere in words. Pulled with coordinates, its
 * `PCV13 at any age & PPSV23 at <65 yrs` row on page 1 contains exactly two
 * pieces of text:
 *
 *     y= 266.6  x= 246.1-286.9 | >=5 years
 *     y= 267.5  x= 309.5-396.3 | PCV20 or PCV21
 *
 * Two fragments at two x positions. The meaning comes from the row label and
 * the column header. A readable quote would have to be ASSEMBLED, which is
 * the "right-sounding sentence that isn't in the document" failure this whole
 * workstream exists to prevent — and the same reasoning already removed the
 * job aid's statement #8 (171 cards) for resting on page headings.
 *
 * ── OWNER DECISION 2026-10-18: *"use MMWR table"* ────────────────────────
 *
 * mm7401a1's clinical guidance table states all three in full sentences, so
 * ACIP's rows are cited and the job aid comes off those cards. She named the
 * three rows herself; they are asserted below as literals.
 *
 *   PPSV23 only      "A single dose of PCV21, PCV20, or PCV15 >=1 year after
 *                     the last PPSV23 dose."            (already present)
 *   PCV13 only       "A single dose of PCV21 or PCV20 administered >=1 year
 *                     after the PCV13 dose."            (added here)
 *   PCV13 + PPSV23   "A single dose of PCV21 or PCV20 >=5 years after the last
 *                     pneumococcal vaccine dose. The pneumococcal vaccination
 *                     series is complete, and it need not be followed by
 *                     additional pneumococcal vaccine doses."  (already there)
 *
 * ⚠ The "PCV13 only" row is printed in TWO wordings, ONE WORD apart: the
 * 19-49 immunocompromising block inserts "administered", the >=50 and 19-49
 * chronic blocks do not. Two entries, not one widened population. The
 * predicate that chooses between them is the S15 interval decision
 * (`ppsvIntervalDays != null` <=> 19-49 IC / cochlear / CSF), reused rather
 * than re-derived, so the risk-class split has one home.
 *
 * No advice moves: every one of the three cards already carried a full
 * sentence from CDC's Adult Notes for the same claim, and now carries ACIP's
 * as well.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const TODAY = '2026-10-11';
// ⚠ The card exposes `short`, not `label`. Writing the LABEL here made
// `not.toContain(JOB_AID)` pass on every card in the app, including ones that
// list the job aid — an assertion that can never fail is worse than none,
// because it reads as coverage. Asserted below that the two differ, so a
// later edit cannot reintroduce the same blind spot silently.
const JOB_AID = 'CDC Adult Timing Job Aid';
const MMWR = 'ACIP 2025 Adult MMWR';

const run = (input) => recommend({ today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [], ...input });
const noteText = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));
const findByNote = (r, needle) => (r.recs ?? []).find((x) => noteText(x).startsWith(needle));
const citeKeys = (rec) => (rec.noteCites ?? []).map((c) => c.key);
const shorts = (rec) => (rec.citations ?? []).map((c) => c.short || c.label);
const creditedShorts = (rec) => {
  const s = noteCiteSlices(rec.note, rec.noteCites);
  return new Set([...s.lead, ...s.detail].map((c) => REFS[c.key]?.short));
};

// The owner's three rows, as mm7401a1 prints them.
const ROW_PPSV23_ONLY = 'A single dose of PCV21, PCV20, or PCV15 ≥1 year after the last PPSV23 dose.';
const ROW_PCV13_ONLY_IC = 'A single dose of PCV21 or PCV20 administered ≥1 year after the PCV13 dose.';
const ROW_PCV13_ONLY_PLAIN = 'A single dose of PCV21 or PCV20 ≥1 year after the PCV13 dose.';
const ROW_BOTH_IC = 'A single dose of PCV21 or PCV20 ≥5 years after the last pneumococcal vaccine dose. '
  + 'The pneumococcal vaccination series is complete, and it need not be followed by additional pneumococcal vaccine doses.';

const IC_19 = { ageMonths: 228, riskIds: ['asplenia'] };
const CHRONIC_19 = { ageMonths: 228, riskIds: ['diabetes'] };
const AT_55 = { ageMonths: 660, riskIds: ['diabetes'] };

describe("the job aid's three cell-only statements now quote ACIP instead", () => {
  it('JOB_AID is the name a card actually carries, not the label', () => {
    expect(REFS.cdcAdultTimingJobAid.short).toBe(JOB_AID);
    expect(REFS.cdcAdultTimingJobAid.label).not.toBe(JOB_AID);
  });

  it('the three rows are mm7401a1’s own words', () => {
    expect(REFS.mmwrPpsvOnlyThenPcv.quote).toBe(ROW_PPSV23_ONLY);
    expect(REFS.mmwrPcv13OnlyThenPcv1949Ic.quote).toBe(ROW_PCV13_ONLY_IC);
    expect(REFS.mmwrPcv13OnlyThenPcv.quote).toBe(ROW_PCV13_ONLY_PLAIN);
    expect(REFS.mmwrIc1949OnePpsv.quote).toBe(ROW_BOTH_IC);
    // One word apart. If a later edit makes them identical, one of them is
    // quoting a block it was not printed in.
    expect(ROW_PCV13_ONLY_IC).not.toBe(ROW_PCV13_ONLY_PLAIN);
    expect(ROW_PCV13_ONLY_IC.replace(' administered', '')).toBe(ROW_PCV13_ONLY_PLAIN);
  });

  it('PPSV23 only: the job aid is gone, ACIP’s row is numbered', () => {
    for (const who of [IC_19, CHRONIC_19, AT_55]) {
      const r = run({ ...who, ppsv23Doses: [{ product: 'PPSV23', date: '2016-10-13' }] });
      const card = findByNote(r, 'Give 1 dose of PCV15, PCV20, or PCV21');
      expect(card, JSON.stringify(who)).toBeDefined();
      expect(shorts(card), JSON.stringify(who)).not.toContain(JOB_AID);
      expect(citeKeys(card)).toContain('mmwrPpsvOnlyThenPcv');
      expect(creditedShorts(card).has(MMWR)).toBe(true);
    }
  });

  it('PCV13 only: the job aid is gone, and the wording follows the block', () => {
    const pcv13 = [{ product: 'PCV13', date: '2016-10-13' }];
    const ic = findByNote(run({ ...IC_19, pcvDoses: pcv13 }), 'PCV13 was given previously');
    const chronic = findByNote(run({ ...CHRONIC_19, pcvDoses: pcv13 }), 'PCV13 was given previously');
    const older = findByNote(run({ ...AT_55, pcvDoses: pcv13 }), 'PCV13 was given previously');
    for (const card of [ic, chronic, older]) {
      expect(card).toBeDefined();
      expect(shorts(card)).not.toContain(JOB_AID);
      expect(creditedShorts(card).has(MMWR)).toBe(true);
    }
    // The IC block says "administered"; the other two do not.
    expect(citeKeys(ic)).toContain('mmwrPcv13OnlyThenPcv1949Ic');
    expect(citeKeys(chronic)).toContain('mmwrPcv13OnlyThenPcv');
    expect(citeKeys(older)).toContain('mmwrPcv13OnlyThenPcv');
    expect(citeKeys(ic)).not.toContain('mmwrPcv13OnlyThenPcv');
    expect(citeKeys(chronic)).not.toContain('mmwrPcv13OnlyThenPcv1949Ic');
  });

  it('PCV13 + PPSV23: the job aid is gone, ACIP’s row stays numbered', () => {
    const hist = { pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }], ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-11' }] };
    for (const who of [IC_19, AT_55]) {
      const card = findByNote(run({ ...who, ...hist }), 'PCV13 and PPSV23 already given');
      expect(card, JSON.stringify(who)).toBeDefined();
      expect(shorts(card), JSON.stringify(who)).not.toContain(JOB_AID);
      expect(creditedShorts(card).has(MMWR)).toBe(true);
    }
  });

  // The job aid must stay where it DOES speak in words — removing a document
  // wholesale is the failure FINDING F recorded, in the other direction.
  it('the job aid stays on the cards whose sentence it prints', () => {
    const shared = findByNote(run({
      ageMonths: 780, dob: '1961-10-11',
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    }), 'An additional PCV20 or PCV21');
    expect(shorts(shared)).toContain(JOB_AID);
    expect(creditedShorts(shared).has(JOB_AID)).toBe(true);

    const chronic50 = findByNote(run({
      ...CHRONIC_19,
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-11' }],
    }), 'No additional pneumococcal dose now');
    expect(shorts(chronic50)).toContain(JOB_AID);
  });
});

describe('over the whole grid', () => {
  const stats = (() => {
    let jobAid = 0;
    let jobAidUncredited = 0;
    for (const c of buildCases()) {
      let r;
      try { r = recommend(c.input); } catch { continue; }
      if (r.excluded) continue;
      for (const rec of r.recs ?? []) {
        if (!shorts(rec).includes(JOB_AID)) continue;
        jobAid++;
        if (!creditedShorts(rec).has(JOB_AID)) jobAidUncredited++;
      }
    }
    return { jobAid, jobAidUncredited };
  })();

  it('the job aid loses exactly the 3,189 cell-only cards', () => {
    // 2026-10-24, RULING F: the 363 patients whose early PCV20 now counts
    // read "Complete (history includes PCV20)" instead of a dose-due card.
    // All 363 are at 50+. They split by the mm7401a1 row their OLD card
    // used: 253 from the flat ">=5 years after the last pneumococcal dose"
    // row, and 110 from the shared-clinical-decision row at >=65, which
    // already carried a job-aid button. Measured with scripts/proseDiff.mjs
    // over both grids; see CLINICAL_SPEC.md section K, Ruling F.
    // + 253 of them newly list the job aid (the other 110 already did).
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +213 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      // -5, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
      // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
      // counting conjugate and her card family changes with it. The invariant
      // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
      expect(stats.jobAid).toBe(6805 - 3189 + 253 + 213 - 5);
  });

  it('and reaches zero uncredited — every remaining button has a number', () => {
    expect(stats.jobAidUncredited).toBe(0);
  });
});
