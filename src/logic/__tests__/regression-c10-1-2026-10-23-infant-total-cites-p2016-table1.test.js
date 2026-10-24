// C10-1 (2026-10-23) — the infant catch-up card cites the row that states its
// own number, and immunize.org p2016 comes off every card it is silent on.
//
// ── THE FAULT ────────────────────────────────────────────────────────────
//
// The infant catch-up card states a SERIES TOTAL for the child in front of
// you -- "Catch-up infant PCV (PCV15 or PCV20): 3 doses in total for this
// child [c]" -- and its one marker pointed at CDC's routine sentence,
//
//     "Routine vaccination with PCV / 4-dose series at 2, 4, 6, 12-15 months"
//
// A quote saying FOUR, carrying a claim of two or three, on 781 cards. It is
// the same fault FINDING 2 (2026-10-18) fixed at the top of the range, where
// a total ABOVE 4 was credited to a document whose largest row says 4 --
// found again at the bottom of the range, which is where the measurement in
// `docs/archive/handoff-2026-10-23-four-rulings-and-the-interval-rework.md`
// put it.
//
// CDC's notes cannot be made to carry it. Read live 2026-10-23 (accordions
// expanded; 75,723 chars; positive controls "cochlear" and "diabetes"
// present), the pneumococcal note gives the routine series and then punts
// every other total:
//
//     "For other catch-up guidance, see Table 2."
//
// So under OWNER RULING A (2026-10-23) -- CDC/ACIP schedule Notes, then
// immunize.org p2016, then the CDC catch-up table -- p2016 is the document
// that states these numbers, and this is exactly what its fallback is for.
//
// ── OWNER RULING B, AND WHY THERE IS NO HEALTHY/AT-RISK SPLIT ────────────
//
// Table 1's own heading, verbatim from `scripts/pdfLayout.py`:
//
//     "Table 1. Recommended schedule for administering pneumococcal conjugate
//      vaccine (PCV) to all children (healthy and those with risk conditions)
//      age 2 through 23 months"
//
// so every row is about all three child populations. The previous session's
// P1 had assumed a split to build; the owner ruled there is none.
//
// ── ONE ROW PER BRANCH: FINDING I CLOSED FOR THIS BLOCK ──────────────────
//
// `regression-2026-10-18-every-p2016-card-has-a-row-that-fits` asks whether
// SOME p2016 row fits the patient, which cannot catch the wrong ROW of a
// document that does cover them (FINDING I). CLAUDE.md records that closing
// it generally "needs the engine to record which row it used, which it does
// not do". For the infant block it now does: the `target` ladder in
// `recommend.js` IS Table 1 cell by cell, so it records the row as it picks
// it, and the card is only given a row whose own stated total equals the
// number the card prints.
//
// ── PROVED TO BITE (2026-10-23), four separate mutations ─────────────────
//
//   • cite `pedsRoutine4Dose` for the total again (revert the fix)  -> fails
//   • drop the `target < 4` guard on `table1Row`                    -> fails
//   • keep p2016 on the routine 4-dose card                         -> fails
//   • keep p2016 on the at-risk Option A/B cards                    -> fails
//
// The second of those is not hypothetical: the first draft of this change
// omitted it and pushed CDC's own notes off 231 cards it speaks for -- a
// removal by side effect, the FINDING F fault, caught by the measurement and
// not by any test that existed. That is why `cdcKeepsItsMarker` below is
// asserted over the whole grid rather than on a sample.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { REFS } from '../../data/refs.js';
import { reasonCiteSlices, noteCiteSlices } from '../../components/citations.jsx';

const P2016_URL = 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf';
const CDC_NOTES_URL = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo';

/** The total each Table 1 entry's quote states, read off the quote itself. */
const ROW_TOTAL = {
  p2016Table1_7to11_noneBefore7: 3,          // "3 doses; ..."
  p2016Table1_7to11_oneOrTwoBefore7: null,   // "N additional" -- depends on prior
  p2016Table1_7to11_oneAt7Plus: 3,           // 1 given + "2 additional doses"
  p2016Table1_7to11_twoAt7Plus: 3,           // 2 given + "1 additional dose"
  p2016Table1_12to23_noneBefore12: 2,        // "2 doses: 2 doses 8 weeks apart"
  p2016Table1_12to23_oneBefore12: 3,         // 1 given + "2 additional doses"
  p2016Table1_12to23_twoOrThreeBefore12: null, // 2 or 3 given + "1 additional"
  p2016Table1_12to23_oneAt12Plus: 2,         // 1 given + "1 additional dose"
};

/**
 * Two sets, deliberately, because they answer two different questions.
 *
 * `urls` is `cite()`'s own dedupe value (`page ?? key`, i.e. the document's
 * URL) -- the same key `cardSources()` matches a grey button on, so it is what
 * "is this DOCUMENT credited on this card" must be asked with.
 *
 * `keys` is the raw ref name. Every p2016 entry shares one URL, so the URL
 * cannot say WHICH Table 1 row was cited, and the row is the whole point of
 * this file. Asking the URL would have made the row assertion vacuous.
 */
function citedOn(rec, result) {
  const urls = new Set();
  const keys = new Set();
  const take = (x) => { urls.add(x.page ?? x.key); keys.add(x.key); };
  const seed = (vs) => {
    for (const v of vs ?? []) {
      for (const slice of reasonCiteSlices(v?.reasons, v?.reasonCites)) {
        for (const x of slice) take(x);
      }
    }
  };
  seed(rec.doseValidations);
  seed(result.otherHistory?.doseValidations);
  const sl = noteCiteSlices(rec.note, rec.noteCites);
  for (const x of [...sl.lead, ...sl.detail]) take(x);
  return { urls, keys };
}

const noteTextOf = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

function sweep() {
  const totalCards = [];     // infant cards printing "N doses in total", N < 4
  const routine4 = [];       // the routine 4-dose infant card
  const fiveDose = [];       // "N doses in total ... the N already on record"
  let cdcLosesItsMarker = 0;
  let p2016Uncredited = 0;
  let cards = 0;

  for (const c of buildCases()) {
    let result;
    try { result = recommend(c.input); } catch { continue; }
    if (result.excluded) continue;
    for (const rec of result.recs ?? []) {
      cards++;
      const { urls: cited, keys: citedNames } = citedOn(rec, result);
      const chipUrls = (rec.citations ?? []).map((ch) => ch.url);

      if (chipUrls.includes(P2016_URL) && !cited.has(P2016_URL)) p2016Uncredited++;
      if (chipUrls.includes(CDC_NOTES_URL) && !cited.has(CDC_NOTES_URL)) cdcLosesItsMarker++;

      const note = noteTextOf(rec);
      const m = note.match(/(\d+) doses in total for this child/);
      const row = { key: c.key, note, cited, citedNames, chipUrls, total: m ? Number(m[1]) : null };
      if (m && /already on record/.test(note)) fiveDose.push(row);
      else if (m) totalCards.push(row);
      else if (/4-dose series at 2, 4, 6, and 12–15 months/.test(note)) routine4.push(row);
    }
  }
  return { totalCards, routine4, fiveDose, cdcLosesItsMarker, p2016Uncredited, cards };
}

const S = sweep();

describe('C10-1 — the infant total is cited to the p2016 Table 1 row that states it', () => {
  it('the sweep actually reached these cards (a silent zero is not a pass)', () => {
    expect(S.cards).toBeGreaterThan(15000);
    expect(S.totalCards.length).toBe(781);
    expect(S.routine4.length).toBeGreaterThan(0);
    expect(S.fiveDose.length).toBe(132);
  });

  it('every card stating a total below 4 cites a Table 1 row, and p2016 is on it', () => {
    const bad = S.totalCards.filter((r) => {
      const key = [...r.citedNames].find((k) => String(k).startsWith('p2016Table1_'));
      return !key || !r.chipUrls.includes(P2016_URL);
    });
    expect(bad.map((r) => r.key).slice(0, 5)).toEqual([]);
    expect(bad.length).toBe(0);
  });

  it('the row cited STATES the number the card prints — not merely a row that fits', () => {
    // FINDING I's question, which the column-fit guard cannot ask.
    const mismatched = S.totalCards.filter((r) => {
      const key = [...r.citedNames].find((k) => String(k).startsWith('p2016Table1_'));
      const stated = ROW_TOTAL[key];
      return stated !== null && stated !== undefined && stated !== r.total;
    });
    expect(mismatched.map((r) => `${r.key} -> ${r.total}`).slice(0, 5)).toEqual([]);
  });

  it('CDC keeps the booster clause on those same cards — both documents, one claim each', () => {
    const missingCdc = S.totalCards.filter((r) => !r.cited.has(CDC_NOTES_URL));
    expect(missingCdc.length).toBe(0);
  });

  it('p2016 comes OFF the routine 4-dose card — CDC states that number verbatim', () => {
    const stillCarrying = S.routine4.filter((r) => r.chipUrls.includes(P2016_URL));
    expect(stillCarrying.length).toBe(0);
  });

  it('p2016 comes OFF the five-dose card — Table 1 has no row that high', () => {
    // Its prior-dose column stops at "2 or 3 before age 12 months".
    const stillCarrying = S.fiveDose.filter((r) => r.chipUrls.includes(P2016_URL));
    expect(stillCarrying.length).toBe(0);
  });

  it('no card anywhere lists p2016 with nothing pointing at it', () => {
    // 2,414 card instances over 22 statements before C10-1; the whole point.
    expect(S.p2016Uncredited).toBe(0);
  });

  it('and nothing was pushed off CDC by side effect (the 231-card near miss)', () => {
    expect(S.cdcLosesItsMarker).toBe(0);
  });
});

describe('C10-1 — the Table 1 entries themselves', () => {
  const keys = Object.keys(REFS).filter((k) => k.startsWith('p2016Table1_'));

  it('there are eight, one per branch of the engine ladder', () => {
    expect(keys.sort()).toEqual(Object.keys(ROW_TOTAL).sort());
  });

  it('each is about all three child groups — Table 1 says so in its heading (RULING B)', () => {
    for (const k of keys) {
      expect(REFS[k].population.slice().sort(), k)
        .toEqual(['child-IC', 'child-nonIC', 'child-routine']);
    }
  });

  it('each quotes a real Table 1 cell, pinned to p2016 page 1', () => {
    for (const k of keys) {
      expect(REFS[k].url, k).toBe(P2016_URL);
      expect(REFS[k].pdfPage, k).toBe(1);
      expect(REFS[k].quote, k).toMatch(/^(0|1|2|1 or 2|2 or 3|1 dose) /);
      expect(REFS[k].lastVerified, k).toBe('2026-10-23');
    }
  });
});
