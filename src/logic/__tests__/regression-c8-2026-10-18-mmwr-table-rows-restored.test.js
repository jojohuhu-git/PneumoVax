/**
 * FINDING F — mm7401a1 was removed from cards whose exact history it has a row
 * for, because the reading that justified the removals had not read its table.
 *
 * ── WHAT WENT WRONG ───────────────────────────────────────────────────────
 *
 * `docs/archive/c7-2026-10-17-source-readings.md` records THREE sentences for
 * this document — (A) and (B) from the Summary box, (C) from the body prose
 * under "Recommendations for Use of PCV". On that basis six statements were
 * dispositioned REMOVE, the owner approved them as a batch ("Approve all six
 * removals"), and `1ec86c6` took the document off 5,356 cards. The stated
 * reason, in `recommend.js`, was that mm7401a1 "states none of these".
 *
 * The document's clinical guidance TABLE was not read until the NEXT session,
 * which then cited it seven times (`1a4d968`). Nobody went back to re-check
 * the removals against the newly-read table. Five of the six statements are
 * in it, in full sentences.
 *
 * ── WHAT THIS FILE RESTORES, AND WHAT IT DELIBERATELY DOES NOT ────────────
 *
 * The owner was shown each patient and each row on 2026-10-18 and split the
 * reversal in two.
 *
 * RESTORED — 1,594 cards, where the table's ROW HEADING is the patient's
 * exact history, so the sentence cannot be about anyone else:
 *
 *   1,154  19-49 or 50+, PPSV23 only, no PCV
 *          row "PPSV23 only" — identical wording in all three blocks
 *     440  >=65, PCV13 and a PPSV23 given at 65 or older
 *          row "PCV13 at any age and PPSV23 at age >=65 years"
 *
 * NOT RESTORED — 238 cards (PCV15 given, PPSV23 pending). The sentence fits
 * the advice but is printed inside the "None or PCV7 only" row: it is the
 * instruction for a clinician CHOOSING PCV15, read by a patient already one
 * step past that choice. OWNER DECISION 2026-10-18: *"use job aid since PCV15
 * isn't listed in the MMWR table"*. The assertions below hold that line, so a
 * later "while we are here" change cannot quietly widen the reversal.
 *
 * NOT RESTORED — the two completed-series families (2,610 and 914 cards).
 * Those removals were correct: the table never says a series containing
 * PCV20/PCV21 is complete, nor that PCV15 followed by PPSV23 completes one.
 *
 * ── WHY NOTHING EXISTING COULD CATCH THIS ─────────────────────────────────
 *
 * No test compares a document's prose to the cards that cite it, and both
 * verdict corpora record status, brands and dates but never citations. The
 * only signal was `scripts/uncreditedSources.mjs`, which by construction can
 * only see a document that IS on a card — a document removed from a card it
 * speaks for is invisible to it. This file is the mirror: it asserts the
 * document is PRESENT where it speaks.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const TODAY = '2026-10-11';
const MMWR_URL = 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm';

const run = (input) => recommend({ today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [], ...input });
const noteText = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));
const findByNote = (result, needle) => (result.recs ?? []).find((r) => noteText(r).startsWith(needle));
const citeKeys = (rec) => (rec.noteCites ?? []).map((c) => c.key);
const buttonUrls = (rec) => (rec.citations ?? []).map((c) => c.url);
const creditedUrls = (rec) => {
  const slices = noteCiteSlices(rec.note, rec.noteCites);
  return new Set([...slices.lead, ...slices.detail].map((c) => c.page));
};

// The two rows as mm7401a1 prints them, kept here as literals so this file is
// a second opinion on refs.js rather than a copy of it. Re-read 2026-10-18
// from the live page and from the article PDF, which agree exactly.
const ROW_PPSV23_ONLY =
  'A single dose of PCV21, PCV20, or PCV15 ≥1 year after the last PPSV23 dose.';
const ROW_SHARED_DECISION =
  'Shared clinical decision-making is recommended regarding administration of either a '
  + 'single dose of PCV21 or PCV20 for any adult aged ≥65 years who has completed the '
  + 'recommended vaccination series with both PCV13 and PPSV23 (i.e., PPSV23 administered '
  + 'at age ≥65 years) but PCV21, PCV20, or PCV15 not yet received. If a decision to '
  + 'administer PCV21 or PCV20 is made, a single dose is recommended ≥5 years after '
  + 'the last pneumococcal vaccine dose.';

describe('FINDING F — mm7401a1 is restored where its row names the history', () => {
  it('the quotes are mm7401a1’s, character for character', () => {
    expect(REFS.mmwrPpsvOnlyThenPcv.quote).toBe(ROW_PPSV23_ONLY);
    expect(REFS.mmwrSharedDecision65.quote).toBe(ROW_SHARED_DECISION);
    // mm7336a2 (12 Sep 2024) prints the shared-decision row with one comma
    // fewer. The chip links to mm7401a1, so this must NOT be that version.
    expect(REFS.mmwrSharedDecision65.quote).not.toContain('PCV21, PCV20 or PCV15');
    expect(REFS.mmwrSharedDecision65.url).toBe(MMWR_URL);
    expect(REFS.mmwrPpsvOnlyThenPcv.url).toBe(MMWR_URL);
  });

  it('19y with asplenia and PPSV23 only lists mm7401a1 and credits the row', () => {
    const r = run({ ageMonths: 228, riskIds: ['asplenia'], ppsv23Doses: [{ product: 'PPSV23', date: '2016-10-13' }] });
    const card = findByNote(r, 'Give 1 dose of PCV15, PCV20, or PCV21');
    expect(card).toBeDefined();
    expect(buttonUrls(card)).toContain(MMWR_URL);
    expect(citeKeys(card)).toContain('mmwrPpsvOnlyThenPcv');
    expect(creditedUrls(card).has(MMWR_URL)).toBe(true);
  });

  it('the same history at 50+ quotes the SAME key — the row is word-identical in every block', () => {
    const young = run({ ageMonths: 228, riskIds: ['asplenia'], ppsv23Doses: [{ product: 'PPSV23', date: '2016-10-13' }] });
    const old = run({ ageMonths: 600, ppsv23Doses: [{ product: 'PPSV23', date: '2016-10-13' }] });
    const keyOf = (r) => citeKeys(findByNote(r, 'Give 1 dose of PCV15, PCV20, or PCV21'))
      .find((k) => k.startsWith('mmwr'));
    expect(keyOf(young)).toBe('mmwrPpsvOnlyThenPcv');
    expect(keyOf(old)).toBe('mmwrPpsvOnlyThenPcv');
    expect(REFS.mmwrPpsvOnlyThenPcv.population).toEqual(
      expect.arrayContaining(['adult-19to49', 'adult-50plus']),
    );
  });

  it('65y with PCV13 and a PPSV23 given at 65 lists mm7401a1 and credits the shared-decision row', () => {
    const r = run({
      ageMonths: 780, dob: '1961-10-11',
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    });
    const card = findByNote(r, 'An additional PCV20 or PCV21');
    expect(card).toBeDefined();
    expect(card.status).toBe('shared-decision');
    expect(buttonUrls(card)).toContain(MMWR_URL);
    expect(citeKeys(card)).toContain('mmwrSharedDecision65');
    expect(creditedUrls(card).has(MMWR_URL)).toBe(true);
  });

  // ── The line the owner drew, held in both directions ────────────────────

  it('a PCV15-given / PPSV23-pending card still does NOT list mm7401a1', () => {
    for (const who of [
      { ageMonths: 228, riskIds: ['chronic_heart'] },   // >=1 year
      { ageMonths: 600, riskIds: ['asplenia'] },        // >=1 year + the 8-week option
      { ageMonths: 228, riskIds: ['asplenia'] },        // >=8 weeks
    ]) {
      const r = run({ ...who, pcvDoses: [{ product: 'PCV15', date: '2024-10-11' }] });
      const card = (r.recs ?? []).find((x) => noteText(x).startsWith('Give PPSV23'));
      expect(card, JSON.stringify(who)).toBeDefined();
      expect(buttonUrls(card), JSON.stringify(who)).not.toContain(MMWR_URL);
    }
  });

  it('the completed-series cards still do NOT list mm7401a1', () => {
    const complete = run({ ageMonths: 600, pcvDoses: [{ product: 'PCV20', date: '2024-10-11' }] });
    const card = findByNote(complete, 'A pneumococcal series that includes PCV20 or PCV21');
    expect(card).toBeDefined();
    expect(buttonUrls(card)).not.toContain(MMWR_URL);
  });
});

describe('FINDING F — over the whole grid', () => {
  const stats = (() => {
    let listing = 0;
    let uncredited = 0;
    let ppsvOnly = 0;
    let shared = 0;
    for (const c of buildCases()) {
      let r;
      try { r = recommend(c.input); } catch { continue; }
      if (r.excluded) continue;
      for (const rec of r.recs ?? []) {
        const keys = citeKeys(rec);
        if (keys.includes('mmwrPpsvOnlyThenPcv')) ppsvOnly++;
        if (keys.includes('mmwrSharedDecision65')) shared++;
        if (!buttonUrls(rec).includes(MMWR_URL)) continue;
        listing++;
        if (!creditedUrls(rec).has(MMWR_URL)) uncredited++;
      }
    }
    return { listing, uncredited, ppsvOnly, shared };
  })();

  it('restores exactly the two card families, at their measured counts', () => {
    expect(stats.ppsvOnly).toBe(1154);
    expect(stats.shared).toBe(440);
  });

  it('mm7401a1 stays fully credited — every restored button has a number', () => {
    expect(stats.listing).toBe(2564 + 1154 + 440);
    expect(stats.uncredited).toBe(0);
  });
});
