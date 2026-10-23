// C9 (2026-10-23) — p2016's 6-18 YEAR rows for a child with no prior conjugate,
// credited on the three cards built from their two option cells.
//
// 1,152 cards listed immunize.org p2016 and credited it with nothing: the
// Option A card (528 + 198 by risk class... measured below), the Option B PCV15
// card, and the PPSV23 step that follows it.
//
// THE ROWS, transcribed cell by cell from `scripts/pdfLayout.py`'s layout of a
// live download (sha1 d69cf77055182b27cf6774b087138c3617068737, "Item #P2016
// (2/16/2024)", Table 4 on page 2). Row 6 sits at y=514.9, row 7 at y=455.9:
//
//   Child's age now   | 6 through 18 years (non-IC)   [row 6]
//                     | 6 through 18 years (IC)       [row 7]
//   Previous doses    | No previous dose of PCV13, PCV15, or PCV20
//   Option A          | 1 dose of PCV20 at least 8 weeks after most recent
//                     |   pneumococcal vaccination
//   Option B          | 1 dose of PCV15 at least 8 weeks after most recent
//                     |   pneumococcal vaccination. At least 8 weeks later,
//                     |   give 1 dose of PPSV23, if PPSV23 not previously
//                     |   given. If PPSV23 previously given, do not give
//                     |   another dose of PPSV23.
//
// ONE KEY PER OPTION, NOT TWO. The two rows' option cells are
// character-for-character identical — same strings, same x positions, different
// y. So a single entry claiming both risk classes is the honest record. This is
// deliberately NOT the FINDING N treatment: that exists for the opposite case,
// where CDC's notes print their twin rows in DIFFERENT words and a card must
// quote its own. Where the words differ, split the key; where the document
// repeats itself exactly, splitting would invent a distinction the page does
// not make. The two readings are distinguished by reading the page, which is
// why the layout coordinates are recorded above.
//
// ONE CELL, TWO CARDS. The app shows Option B as two cards — the PCV15 now, the
// PPSV23 at least 8 weeks later — and both come from the same cell. The real
// assertion is therefore not "each card cites something" but "for one patient
// the two cards quote the SAME entry", which is what the five-year-step guard
// of 2026-10-23 established as the shape for a recommendation shown twice.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices, markerCount } from '../../components/citations.jsx';

const noteOf = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

const citesOf = (rec) => {
  const sl = noteCiteSlices(rec.note, rec.noteCites);
  return [...(sl.lead ?? []), ...(sl.detail ?? [])];
};

/** A 10-year-old who has never had a conjugate, in each risk class. */
const teen = (riskIds) => ({
  ageMonths: 120,
  dob: '2016-10-23',
  today: '2026-10-23',
  riskIds,
  pcvDoses: [],
  ppsv23Doses: [],
});

describe('p2016 Table 4 rows 6 and 7 — Option A', () => {
  for (const [name, riskIds] of [['non-IC (chronic lung disease)', ['chronic_lung']], ['IC (asplenia)', ['asplenia']]]) {
    it(`credits the Option A cell for a ${name} 10-year-old`, () => {
      const res = recommend(teen(riskIds));
      const card = (res.recs ?? []).find((r) => /with no prior PCV: Option A/.test(noteOf(r)));
      expect(card, 'no Option A card for this child').toBeTruthy();
      const cites = citesOf(card);
      expect(cites).toHaveLength(2);
      // CDC's notes word the two risk classes differently, so each class keeps
      // its own CDC key — that is FINDING D, and it is not disturbed here.
      expect(cites[0].key).toBe(riskIds[0] === 'asplenia' ? 'pedsIc6to18NoPcv' : 'pedsRisk6to18NoPcv');
      // p2016 repeats its cell verbatim, so BOTH classes share one key.
      expect(cites[1].key).toBe('p2016NoPriorPcv6to18OptionA');
      expect(cites[1].quote).toContain('No previous dose of PCV13, PCV15, or PCV20');
      expect(cites[1].quote).toContain('1 dose of PCV20 at least 8 weeks after most recent pneumococcal vaccination');
    });
  }
});

describe('p2016 Table 4 rows 6 and 7 — Option B, one cell across two cards', () => {
  it('the PCV15 card and the PPSV23 step quote the same cell, for one patient', () => {
    const res = recommend(teen(['asplenia']));
    const pcv15 = (res.recs ?? []).find((r) => /Option B — 1 dose of PCV15/.test(noteOf(r)));
    const ppsv = (res.recs ?? []).find((r) => /Second step of Option B/.test(noteOf(r)));
    expect(pcv15, 'no Option B PCV15 card').toBeTruthy();
    expect(ppsv, 'no Option B PPSV23 step card').toBeTruthy();
    const p2016On = (rec) => citesOf(rec).filter((c) => c.doc === 'immunize.org p2016');
    expect(p2016On(pcv15)).toHaveLength(1);
    expect(p2016On(ppsv)).toHaveLength(1);
    // THE ASSERTION THAT MATTERS: the same cell, not merely a cell each.
    expect(p2016On(pcv15)[0].key).toBe(p2016On(ppsv)[0].key);
    expect(p2016On(pcv15)[0].key).toBe('p2016NoPriorPcv6to18OptionB');
  });

  it('the quote keeps all three of the cell\'s sentences', () => {
    // The "if PPSV23 previously given, do not give another" clause is a real
    // instruction. Quoting only the first sentence would leave it sourced by
    // nothing while appearing to be covered.
    const res = recommend(teen(['chronic_lung']));
    const pcv15 = (res.recs ?? []).find((r) => /Option B — 1 dose of PCV15/.test(noteOf(r)));
    const q = citesOf(pcv15).find((c) => c.doc === 'immunize.org p2016').quote;
    expect(q).toContain('1 dose of PCV15 at least 8 weeks after most recent pneumococcal vaccination.');
    expect(q).toContain('At least 8 weeks later, give 1 dose of PPSV23, if PPSV23 not previously given.');
    expect(q).toContain('If PPSV23 previously given, do not give another dose of PPSV23.');
  });
});

describe('every no-prior-PCV 6-18 card in the grid is balanced and credited', () => {
  it('sweeps all three card shapes', () => {
    const counts = { optionA: 0, optionB: 0, ppsvStep: 0 };
    const unbalanced = [];
    const uncredited = [];
    const wrongCell = [];
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        const t = noteOf(rec);
        const which = /with no prior PCV: Option A/.test(t) ? 'optionA'
          : /Option B — 1 dose of PCV15/.test(t) ? 'optionB'
            : /Second step of Option B/.test(t) ? 'ppsvStep' : null;
        if (!which) continue;
        counts[which] += 1;
        const cites = citesOf(rec);
        if (markerCount(rec.note?.lead ?? rec.note) + markerCount(rec.note?.detail) !== cites.length) {
          unbalanced.push(c.key);
        }
        const mine = cites.filter((x) => x.doc === 'immunize.org p2016');
        if (mine.length !== 1) uncredited.push(`${c.key} (${which}, ${mine.length})`);
        // The card's own option must match the cell it quotes: an Option A card
        // quoting the Option B cell would be a true sentence about the other
        // half of the row.
        const want = which === 'optionA'
          ? 'p2016NoPriorPcv6to18OptionA'
          : 'p2016NoPriorPcv6to18OptionB';
        if (mine[0] && mine[0].key !== want) wrongCell.push(`${c.key} (${which})`);
      }
    }
    // Anti-vacuity, with the real shape of the block: Option A appears once per
    // patient, Option B's PCV15 card likewise, and the PPSV23 step only while
    // no PPSV23 is on record — so its count is legitimately lower.
    expect(counts.optionA).toBe(528);
    expect(counts.optionB).toBe(528);
    expect(counts.ppsvStep).toBe(96);
    expect(unbalanced.slice(0, 5)).toEqual([]);
    expect(uncredited.slice(0, 5)).toEqual([]);
    expect(wrongCell.slice(0, 5)).toEqual([]);
  });
});
