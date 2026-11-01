// C9 (2026-10-23) — p2016's two 24-71 MONTH rows, credited on the cards built
// from them.
//
// 976 cards showed the at-risk catch-up and listed immunize.org p2016 as a grey
// button with no number pointing at it. That is the fault C8/C9 exist to
// remove, and here it was not a cosmetic one: p2016's row is the ONLY source on
// the card that names the products and the interval in one sentence.
//
//   CDC Child & Adolescent Notes (what the card already cited):
//     "Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after the most
//      recent dose and administered at least 8 weeks apart)"
//   immunize.org p2016 Table 4, row 1 (what it now also cites):
//     "Any incomplete schedule of 0, 1, or 2 PCV doses by age 24 months —
//      2 doses of PCV20 or PCV15, given at least 8 weeks apart"
//
// CDC says "PCV". The card says "PCV20 or PCV15". Only p2016 says that.
//
// AND THE FOOTNOTE IS PART OF THE ROW (the FINDING F lesson, applied before the
// fact rather than after). The "PCV15" in both rows carries footnote ‡:
//   "If PCV15 is used, one or two additional pneumococcal vaccine doses will be
//    needed. For options, refer to the appropriate row of this table for a child
//    age 2 through 18 years (IC or non-IC) who completed the PCV series before
//    age 6 years without a dose of PCV20."
// which is the card's closing sentence about a PPSV23 after a PCV15.
//
// ⚠ THE GRID CANNOT REACH ROW 2, so this file builds that patient by hand.
// `buildCases()` places historical doses at fixed day-offsets, so "a child
// 24-71 months with 3 PCV doses, ALL before 12 months" has no case — the gap
// recorded in the 2026-10-23 handoff. A sweep over the grid would have reported
// `p2016AtRiskCatchup24to71ThreeBefore12` as unused and proved nothing either
// way, which is exactly how a row with no cases passes as guarded.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices, markerCount } from '../../components/citations.jsx';

const noteOf = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

/** Every citation a number on this card points at, in reading order. */
const citesOf = (rec) => {
  const sl = noteCiteSlices(rec.note, rec.noteCites);
  return [...(sl.lead ?? []), ...(sl.detail ?? [])];
};

const catchupCard = (res) => (res.recs ?? []).find((r) => /the at-risk catch-up for a child 24–71 months/.test(noteOf(r)));

describe('p2016 Table 4 row 1 — the 2-dose at-risk catch-up', () => {
  // A 3-year-old with asplenia and one PCV13 given in infancy: an incomplete
  // schedule of 1 PCV dose by age 24 months, which is row 1's prior-dose column.
  const child = {
    ageMonths: 36,
    dob: '2023-10-23',
    today: '2026-10-23',
    riskIds: ['asplenia'],
    pcvDoses: [{ product: 'PCV13', date: '2023-12-23' }],   // age 2 months
    ppsv23Doses: [],
  };

  it('credits the row that names the products, and the footnote on its PCV15', () => {
    const card = catchupCard(recommend(child));
    expect(card, 'no at-risk catch-up card for this child').toBeTruthy();
    // Both halves of CDC's row since 2026-10-25 — it states "at least 8 weeks
    // after the most recent dose AND administered at least 8 weeks apart",
    // and the lead printed only the second.
    expect(noteOf(card)).toMatch(
      /Give 2 doses of PCV20 or PCV15, ≥8 weeks after the most recent pneumococcal dose and ≥8 weeks apart/,
    );
    const cites = citesOf(card);
    expect(cites.map((c) => c.key)).toEqual([
      'pedsRiskIncompleteCatchup',
      'p2016AtRiskCatchup24to71Incomplete',
      'p2016Pcv15NeedsFurtherDoses',
      // P1-1 (2026-11-01): an immunocompromised child's card now also says the
      // dose owed five years after the PPSV23, with its own source.
      'pedsSecondPpsv5y',
    ]);
    // The row's quote carries both halves the card's sentence needs.
    const row = cites[1];
    expect(row.quote).toContain('2 doses of PCV20 or PCV15');
    expect(row.quote).toContain('at least 8 weeks apart');
    // And the prior-dose column the patient actually fits.
    expect(row.quote).toContain('0, 1, or 2 PCV doses by age 24 months');
  });

  it('puts the footnote on the PCV15 sentence, not on the lead', () => {
    // Markers pair to cites by POSITION, so WHERE each number sits is the
    // claim being made. The footnote is about the PCV15 follow-up; it must not
    // drift onto the lead, where it would read as the source for the 2 doses.
    const card = catchupCard(recommend(child));
    const sl = noteCiteSlices(card.note, card.noteCites);
    expect(sl.lead.map((c) => c.key)).toEqual([
      'pedsRiskIncompleteCatchup', 'p2016AtRiskCatchup24to71Incomplete',
    ]);
    // P1-1 (2026-11-01): then the five-year sentence, which is about the PPSV23.
    expect(sl.detail.map((c) => c.key)).toEqual(['p2016Pcv15NeedsFurtherDoses', 'pedsSecondPpsv5y']);
  });
});

describe('p2016 Table 4 row 2 — the 1-dose at-risk catch-up, which no grid case reaches', () => {
  // THE PATIENT THE GRID CANNOT BUILD. Three PCV13 doses at 2, 4 and 6 months —
  // all before 12 months — and now 3 years old with asplenia. Row 2's
  // prior-dose column is "3 doses of PCV, all before 12 months", and FINDING G
  // is the reminder that it says before TWELVE, not before 24.
  const child = {
    ageMonths: 36,
    dob: '2023-10-23',
    today: '2026-10-23',
    riskIds: ['asplenia'],
    pcvDoses: [
      { product: 'PCV13', date: '2023-12-23' },   // 2 months
      { product: 'PCV13', date: '2024-02-23' },   // 4 months
      { product: 'PCV13', date: '2024-04-23' },   // 6 months
    ],
    ppsv23Doses: [],
  };

  it('is a real card, and it credits row 2 rather than row 1', () => {
    const card = catchupCard(recommend(child));
    expect(card, 'no at-risk catch-up card for this child').toBeTruthy();
    expect(noteOf(card)).toMatch(/Give 1 dose of PCV20 or PCV15/);
    expect(noteOf(card)).toMatch(/3 PCV doses, all before 12 months/);
    const cites = citesOf(card);
    expect(cites.map((c) => c.key)).toEqual([
      'pedsRiskIncompleteCatchup',
      'p2016AtRiskCatchup24to71ThreeBefore12',
      'p2016Pcv15NeedsFurtherDoses',
      // P1-1 (2026-11-01): an immunocompromised child's card now also says the
      // dose owed five years after the PPSV23, with its own source.
      'pedsSecondPpsv5y',
    ]);
    expect(cites[1].quote).toContain('3 doses of PCV, all before 12 months');
    // The two rows must never be interchangeable: row 1's column would be a
    // false claim about this child, who has three doses and not "0, 1, or 2".
    expect(cites[1].quote).not.toContain('0, 1, or 2');
  });

  it('the grid really cannot reach it — so the hand-built patient is load-bearing', () => {
    // Measured, not assumed. If a future grid change DOES reach this card, this
    // count stops being 0 and the assertion tells you to lean on the sweep
    // instead of a single case.
    let reached = 0;
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        if (/3 PCV doses, all before 12 months/.test(noteOf(rec))) reached += 1;
      }
    }
    expect(reached).toBe(0);
  });
});

describe('every at-risk catch-up card in the grid is balanced and credited', () => {
  it('each has three numbers and three citations, in the same order', () => {
    let cards = 0;
    const unbalanced = [];
    const uncredited = [];
    const wrongRow = [];
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        const text = noteOf(rec);
        if (!/the at-risk catch-up for a child 24–71 months/.test(text)) continue;
        cards += 1;
        const cites = citesOf(rec);
        // One cite per marker. An orphan marker renders as nothing and an
        // orphan cite is dropped silently, so neither shows on screen — the
        // reason this is asserted rather than eyeballed.
        if (markerCount(rec.note?.lead) + markerCount(rec.note?.detail) !== cites.length) {
          unbalanced.push(c.key);
        }
        // `cite()` names the document in `doc` (the ref's `short`), which is
        // the same string the grey chip prints — see refs.js's C1 note. The
        // chips themselves carry `short`; the citations do not.
        if (!cites.some((x) => x.doc === 'immunize.org p2016')) uncredited.push(c.key);
        // The card's own sentence says which row it used; the quote must agree.
        const saysTwoDoses = /Give 2 doses of PCV20 or PCV15/.test(text);
        const row = cites[1];
        const rowIsIncomplete = row?.key === 'p2016AtRiskCatchup24to71Incomplete';
        if (saysTwoDoses !== rowIsIncomplete) wrongRow.push(c.key);
      }
    }
    // Anti-vacuity: this swept something.
    expect(cards).toBe(976);
    expect(unbalanced.slice(0, 5)).toEqual([]);
    expect(uncredited.slice(0, 5)).toEqual([]);
    expect(wrongRow.slice(0, 5)).toEqual([]);
  });
});
