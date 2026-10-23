/**
 * C8 — the five-year step is now credited on BOTH of its cards, not just one.
 *
 * ── WHAT A CLINICIAN SAW ──────────────────────────────────────────────────
 *
 * An immunocompromised child who has already had a PPSV23 is shown two cards:
 * "1 dose PCV20 (immunocompromising)" and, beside it, "2nd PPSV23 (alternative,
 * ≥5y after first)" — one dose, two products to choose between. CDC's schedule
 * notes were listed under both and numbered on neither except the PCV20 one,
 * and then only on the branch where a conjugate was given at or after age 6.
 *
 * MEASURED BEFORE THE FIX — 702 cards in this family carried CDC's notes as a
 * grey button nothing pointed at:
 *
 *   603  the alternative 2nd PPSV23 card, all four branches
 *    78  the PCV20 card, conjugates all before age 6, one PPSV23
 *    12  the PCV20 card, rows 4/5
 *     9  the PCV20 card, at-risk catch-up done at 24-71 months
 *
 * ── WHY THE DOCUMENT DOES SPEAK ───────────────────────────────────────────
 *
 * CDC states both options in ONE sentence — "administer either PCV20 or dose 2
 * PPSV23 at least 5 years after dose 1 PPSV23" — so the row that speaks for the
 * PCV20 card speaks for the alternative card too. There are FOUR such rows in
 * the immunocompromising list, one per history, and a card must quote the branch
 * its own patient is in (FINDING K) at its own age band (FINDING N):
 *
 *   Age 2-5, series complete, no PCV20        pedsIcPcv20orPpsv23
 *   Age 6-18, PCV before age 6, no PCV20      pedsIcBefore6NoPcv20At6to18
 *   Age 6-18, PCV13 and PPSV23 at/after 6     pedsIcPcv13AndPpsvAt6
 *   (the rows-4/5 branch picks by age between the first two)
 *
 * ── WHAT THIS FILE HOLDS ──────────────────────────────────────────────────
 *
 * Two rules. First, no card in this family leaves CDC's notes uncredited.
 * Second — and this is the one that would catch a careless later edit — the two
 * sibling cards must quote the SAME row as each other for the same patient. A
 * clinician choosing between them is reading one recommendation presented twice;
 * if the two cards cited different rows, one of them would be wrong.
 *
 * No dose, date, product or verdict moves on any of the 702.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const PCV20_CARD = '1 dose PCV20 (immunocompromising)';
const ALTERNATIVE_CARD = '2nd PPSV23 (alternative, ≥5y after first)';
const NOTES_URL = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo';

/** The four rows of CDC's immunocompromising list that state this step. */
const FIVE_YEAR_ROWS = [
  'pedsIcPcv20orPpsv23',
  'pedsIcBefore6NoPcv20At6to18',
  'pedsIcPcv13AndPpsvAt6',
];

const shown = (rec) => {
  const s = noteCiteSlices(rec.note, rec.noteCites);
  return [...s.lead, ...s.detail];
};
const uncredited = (rec) => {
  const pointedAt = new Set(shown(rec).map((c) => c.page ?? c.key));
  return (rec.citations ?? []).filter((chip) => !pointedAt.has(chip.url)).map((chip) => chip.short);
};
const rowOf = (rec) => shown(rec).map((c) => c.key).find((k) => FIVE_YEAR_ROWS.includes(k));

/** Walk the grid, handing back both cards of every patient that has them. */
function sweep() {
  const out = [];
  for (const c of buildCases()) {
    let res;
    try { res = recommend(c.input); } catch { continue; }
    if (res.excluded) continue;
    const pcv20 = (res.recs ?? []).find((x) => x.doseLabel === PCV20_CARD);
    const alt = (res.recs ?? []).find((x) => x.doseLabel === ALTERNATIVE_CARD);
    if (pcv20 || alt) out.push({ c, pcv20, alt });
  }
  return out;
}

describe('C8 — the five-year step cites its row on both cards', () => {
  const pairs = sweep();

  it('every card in this family has CDC\'s notes numbered, not just listed', () => {
    const strays = new Map();
    let cards = 0;
    for (const { pcv20, alt } of pairs) {
      for (const rec of [pcv20, alt].filter(Boolean)) {
        cards += 1;
        for (const short of uncredited(rec)) strays.set(short, (strays.get(short) ?? 0) + 1);
      }
    }
    // Anti-vacuity, and the measured size of the family.
    expect(cards).toBe(1206);
    expect([...strays.entries()]).toEqual([]);
  });

  it('the two sibling cards always quote the SAME row as each other', () => {
    const mismatched = [];
    let compared = 0;
    for (const { c, pcv20, alt } of pairs) {
      if (!pcv20 || !alt) continue;
      compared += 1;
      if (rowOf(pcv20) !== rowOf(alt)) {
        mismatched.push(`${c.key}: PCV20 cites ${rowOf(pcv20)}, alternative cites ${rowOf(alt)}`);
      }
    }
    expect(compared).toBeGreaterThan(500);
    expect(mismatched.slice(0, 5)).toEqual([]);
  });

  it('each of CDC\'s three rows is used, in the measured numbers', () => {
    const tally = new Map();
    for (const { pcv20, alt } of pairs) {
      for (const rec of [pcv20, alt].filter(Boolean)) {
        const row = rowOf(rec);
        expect(row, `${rec.doseLabel} quotes no CDC row at all`).toBeTruthy();
        tally.set(`${rec.doseLabel}|${row}`, (tally.get(`${rec.doseLabel}|${row}`) ?? 0) + 1);
      }
    }
    // Identical on both cards, which is the symmetry the previous test checks
    // case by case; these are the measured totals behind it.
    for (const label of [PCV20_CARD, ALTERNATIVE_CARD]) {
      expect(tally.get(`${label}|pedsIcPcv13AndPpsvAt6`), label).toBe(504);
      expect(tally.get(`${label}|pedsIcBefore6NoPcv20At6to18`), label).toBe(87);
      expect(tally.get(`${label}|pedsIcPcv20orPpsv23`), label).toBe(12);
    }
  });

  it('the row quoted matches the child\'s age band and history', () => {
    for (const { c, pcv20, alt } of pairs) {
      for (const rec of [pcv20, alt].filter(Boolean)) {
        const row = rowOf(rec);
        if (row === 'pedsIcPcv20orPpsv23') {
          // CDC prints this one under "Age 2-5 years".
          expect(c.input.ageMonths, c.key).toBeLessThan(72);
        }
        if (row === 'pedsIcBefore6NoPcv20At6to18' || row === 'pedsIcPcv13AndPpsvAt6') {
          // Both are printed under "Age 6-18 years".
          expect(c.input.ageMonths, c.key).toBeGreaterThanOrEqual(72);
        }
      }
    }
  });

  it('CDC\'s notes take exactly one number on each card', () => {
    // Citing a document twice on one card is not wrong in general, but a
    // redundant second marker for the same claim is — it is what adding these
    // citations unconditionally would have produced on the at/after-6 branch,
    // where the PCV20 card already credited the row.
    for (const { c, pcv20, alt } of pairs) {
      for (const rec of [pcv20, alt].filter(Boolean)) {
        const onNotes = shown(rec).filter((x) => x.page === NOTES_URL);
        expect(onNotes.length, `${c.key} — ${rec.doseLabel}`).toBe(1);
      }
    }
  });

  it('the alternative card says why CDC\'s row covers the second PPSV23', () => {
    const { alt } = pairs.find((p) => p.alt);
    expect(alt.note.lead).toMatch(/Alternative to the PCV20 above/);
    expect(alt.note.detail).toBe("CDC's own row for this history names both options in one sentence and puts the second PPSV23 at that same five years [c].");
  });
});
