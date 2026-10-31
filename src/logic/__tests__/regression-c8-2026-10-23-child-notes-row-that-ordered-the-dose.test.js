/**
 * C8 — the "high-risk series is complete" card now credits every document it
 * lists, and the OWNER DECISION of 2026-10-23 that settled how.
 *
 * ── THE CARD ──────────────────────────────────────────────────────────────
 *
 * A 6-year-old girl with a cochlear implant: PCV15 at age 4, PPSV23 at age 5
 * (twelve months later, so the 8-week minimum was comfortably met), no PCV20
 * ever. The app tells the clinician the series is complete, and listed three
 * documents under it while numbering only one — CDC's Risk-based page, and that
 * one only to a row HEADING. 145 cards in the grid, and on each of them BOTH
 * CDC's Child/Adolescent Notes and immunize.org p2016 were grey buttons that
 * nothing on the card pointed at.
 *
 * ── WHY BOTH DOCUMENTS LOOKED SILENT ──────────────────────────────────────
 *
 * Each states the rule for her history on a line that appears to exclude her:
 *
 *   CDC's notes  the Age 6-18 row is nested under the parent "Received PCV
 *                before age 6 years BUT HAVE NOT RECEIVED PPSV23" — and she has
 *                had one.
 *   p2016        Table 4's row is headed "(no PCV20, no PPSV23§)" — the same
 *                apparent exclusion, with a footnote mark on it.
 *
 * ── WHAT SETTLED IT ───────────────────────────────────────────────────────
 *
 * OWNER DECISION 2026-10-23, in her words: *"her series is complete based on the
 * following recommendation"*, linking CDC's Age 6-18 sentence "Not previously
 * received PCV20: 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks
 * after the most recent PCV dose". That row is what ORDERED her PPSV23. She has
 * had it, so the card credits the row it followed and says the dose has been
 * given — the same treatment she chose on 2026-10-18 for the 17-year-old whose
 * PCV20 satisfied a row.
 *
 * And p2016's footnote § turns out to say it outright: "If PPSV23 previously
 * given, then child is complete." Read from a live download today (HTTP 200,
 * 211,252 bytes, sha1 d69cf770…, Item #P2016 of 2/16/2024) laid out with
 * `scripts/pdfLayout.py`. The IC row's footnote ǁ is a different sentence — it
 * gives two options rather than a completion — which is why the two risk
 * classes cite different footnotes and must not be allowed to swap.
 *
 * ── THE LINE THIS DOES NOT CROSS ──────────────────────────────────────────
 *
 * FINDING K's rule is untouched, and the last test here holds it. CDC's OTHER
 * sub-bullet under the same parent — "Previously received at least 1 dose of
 * PCV20: no further PCV or PPSV23 doses needed" — ORDERS NOTHING, so a child
 * who also has a PPSV23 cannot have followed it, and it stays off their card.
 * "Cite the row that was satisfied" is about an instruction carried out, not a
 * licence to quote any nested line whose parent the patient contradicts.
 *
 * No dose, date, product or verdict moves on any of the 145.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const TODAY = '2026-10-11';
const NOTES_URL = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo';
const P2016_URL = 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf';
const COMPLETE_LABEL = 'PCV series complete (PCV before age 6 + PPSV23)';

const shown = (rec) => {
  const s = noteCiteSlices(rec.note, rec.noteCites);
  return [...s.lead, ...s.detail];
};
const shownKeys = (rec) => shown(rec).map((c) => c.key);
const markerCount = (rec) => {
  const n = rec.note;
  const text = typeof n === 'string' ? n : `${n?.lead ?? ''} ${n?.detail ?? ''}`;
  return text.split('[c]').length - 1;
};
/** The grey buttons no number on this card points at. */
const uncredited = (rec) => {
  const pointedAt = new Set(shown(rec).map((c) => c.page ?? c.key));
  return (rec.citations ?? []).filter((chip) => !pointedAt.has(chip.url)).map((chip) => chip.short);
};

/** The 6-year-old with a cochlear implant, as the owner described her. */
const cochlearSixYearOld = () => recommend({
  ageMonths: 72,
  dob: '2020-10-11',
  today: TODAY,
  riskIds: ['cochlear_implant'],
  pcvDoses: [{ product: 'PCV15', date: '2024-10-11' }],   // age 4
  ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }], // age 5, 12 months later
});

const cardOf = (r) => (r.recs ?? []).find((x) => x.doseLabel === COMPLETE_LABEL);

describe('C8 — the complete card credits the row that ordered the dose', () => {
  it("p2016's two footnotes are recorded verbatim, one per risk class", () => {
    const nonIc = REFS.p2016Before6PpsvGivenComplete;
    const ic = REFS.p2016Before6PpsvGivenIcOptions;
    for (const [key, ref] of [['p2016Before6PpsvGivenComplete', nonIc], ['p2016Before6PpsvGivenIcOptions', ic]]) {
      expect(ref, `REFS.${key} is missing`).toBeTruthy();
      expect(ref.url).toBe(P2016_URL);
      expect(ref.short).toBe('immunize.org p2016');
      expect(ref.rulebook).toBe('child');
      expect(ref.pdfPage).toBe(2);
      expect(ref.lastVerified).toBe('2026-10-23');
    }
    expect(nonIc.population).toEqual(['child-nonIC']);
    expect(ic.population).toEqual(['child-IC']);
    expect(nonIc.quote).toBe('If PPSV23 previously given, then child is complete.');
    // The IC footnote does NOT say complete, and that difference is the whole
    // reason the two risk classes are cited separately.
    expect(ic.quote).toContain('give a second dose of PPSV23 five years after the first dose of PPSV23.');
    expect(ic.quote).not.toMatch(/complete/);
  });

  it("the owner's 6-year-old now has a number for every document on her card", () => {
    const card = cardOf(cochlearSixYearOld());
    expect(card, 'no complete card for this patient').toBeTruthy();

    // What she asked for: CDC's Age 6-18 row, and p2016's footnote.
    expect(shownKeys(card)).toEqual([
      'pedsBefore6NoPcv20',
      'pedsRiskBefore6NoPcv20At6to18',
      'p2016Before6PpsvGivenComplete',
    ]);
    // Every marker has a citation and every citation a marker.
    expect(markerCount(card)).toBe((card.noteCites ?? []).length);
    // And nothing is left as a grey button with no number — the whole point.
    expect(uncredited(card)).toEqual([]);
  });

  it('the card says the dose that row asked for has been given', () => {
    const card = cardOf(cochlearSixYearOld());
    expect(card.note.detail).toMatch(/asks for one dose of PCV20 or PPSV23, and that dose has been given \[c\]/);
    // The mobile-app justification is gone: CDC's own row and p2016's footnote
    // say it, and under CLAUDE.md's authority rule the published schedule
    // governs, not PneumoRecs VaxAdvisor.
    expect(card.note.detail).not.toMatch(/VaxAdvisor/);
  });

  it('an immunocompromised child with both PPSV23 doses cites the IC row and the IC footnote', () => {
    // Asplenia, PCV13 at age 2, PPSV23 at age 3 and a second at age 8 —
    // exactly five years later, which is what CDC's IC row asks for. This
    // patient shape does not exist in the grid (a 10-year-old needs a dose
    // 3,650 days ago, which falls before birth), so it is asserted directly.
    const r = recommend({
      ageMonths: 96,
      dob: '2018-10-11',
      today: TODAY,
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2020-10-11' }],
      ppsv23Doses: [
        { product: 'PPSV23', date: '2021-10-11' },
        { product: 'PPSV23', date: '2026-10-11' },
      ],
    });
    const card = cardOf(r);
    expect(card, 'no complete card for the IC patient').toBeTruthy();
    expect(shownKeys(card)).toEqual([
      'pedsBefore6NoPcv20',
      'pedsIcBefore6NoPcv20At6to18',
      'p2016Before6PpsvGivenIcOptions',
    ]);
    expect(card.note.detail).toMatch(/both doses have been given \[c\]/);
    expect(uncredited(card)).toEqual([]);
  });

  // ⚠️ REVERSED BY P2 (2026-10-30), kept as the record. This test was named
  // "a second PPSV23 given too early is not a second dose, so the card does
  // not appear" and asserted exactly that, on `CHILD-PPSV23-AFTER-PPSV23` as a
  // floor. The owner ruled on 2026-10-29 that an immunocompromised child's
  // early second PPSV23 COUNTS and no third is given, so the card now appears
  // either side of the line. What still differs is what the card SAYS — and
  // the line is still CDC's 4-day grace, which she chose to keep (2026-10-30).
  it('a second PPSV23 given too early still completes her, and the card says it came early', () => {
    const withSecondDoseOn = (date) => recommend({
      ageMonths: 96,
      dob: '2018-10-11',
      today: TODAY,
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2020-10-11' }],
      ppsv23Doses: [
        { product: 'PPSV23', date: '2021-10-11' },
        { product: 'PPSV23', date },
      ],
    });
    const EARLY = 'The second PPSV23 came less than 5 years after the first; it is counted, and no third PPSV23 is given.';
    // Four days early: inside CDC's grace, so it is ON TIME — no sentence.
    const onTime = cardOf(withSecondDoseOn('2026-10-07'));
    expect(onTime).toBeTruthy();
    expect(onTime.note.detail).not.toContain(EARLY);
    // Five days early: outside the grace — counted all the same, and said so.
    const early = cardOf(withSecondDoseOn('2026-10-06'));
    expect(early).toBeTruthy();
    expect(early.note.detail).toContain(EARLY);
    expect(uncredited(early)).toEqual([]);
  });

  it('every one of these cards in the grid is fully credited, and there are 145', () => {
    let cards = 0;
    const strays = new Map();
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        if (rec.doseLabel !== COMPLETE_LABEL) continue;
        cards += 1;
        for (const short of uncredited(rec)) {
          strays.set(short, (strays.get(short) ?? 0) + 1);
        }
      }
    }
    expect(cards).toBe(145);
    expect([...strays.entries()]).toEqual([]);
  });

  it('FINDING K still holds: the PCV20 sub-bullet stays off a card with a PPSV23', () => {
    // The sibling sub-bullet under the same parent orders nothing, so no
    // patient can have "followed" it. A child whose series includes a PCV20
    // never reaches this card at all (the includesCompleting block returns
    // first), and these quotes must not appear on it by any other route.
    const card = cardOf(cochlearSixYearOld());
    const quotes = shown(card).map((c) => c.quote ?? '');
    for (const q of quotes) {
      expect(q).not.toContain('Previously received at least 1 dose of PCV20');
    }
    // And the credited notes sentence is the one that asks for a dose.
    expect(quotes.some((q) => q.includes('1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks'))).toBe(true);
  });

  it('the notes sentence and the p2016 footnote cannot swap risk classes', () => {
    const nonIc = cardOf(cochlearSixYearOld());
    expect(shownKeys(nonIc)).not.toContain('pedsIcBefore6NoPcv20At6to18');
    expect(shownKeys(nonIc)).not.toContain('p2016Before6PpsvGivenIcOptions');
    // Both documents are on the card, each exactly once.
    const pages = shown(nonIc).map((c) => c.page);
    expect(pages.filter((p) => p === NOTES_URL)).toHaveLength(1);
    expect(pages.filter((p) => p === P2016_URL)).toHaveLength(1);
  });
});
