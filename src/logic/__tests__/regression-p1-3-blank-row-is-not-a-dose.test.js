// ─────────────────────────────────────────────────────────────────────────
// P1-3 (2026-10-12) — A ROW NOBODY TYPED IN IS NOT A DOSE.
//
// "+ Add PCV dose" created `{ date: '', product: '' }` and nothing ever
// removed it. The engine graded that row as a real injection of unknown date
// and COUNTED it in the series:
//
//   measured before the fix, a 2-year-old with no vaccination history at all
//   —  recommendation `due`;
//   the same child after one click of "+ Add PCV dose" and nothing typed
//   —  recommendation `catchup`, and `meta.pcvCount` 0 → 1.
//
// The clinician had entered no clinical information whatsoever and the answer
// moved.
//
// ── Why this is not simply "ignore empty rows" ───────────────────────────
//
// An empty row meant two different things and the app could not tell them
// apart:
//   (a) "I have not typed yet."
//   (b) "This patient definitely had a dose, but I have no card, so I do not
//        know the date or the product."
//
// (b) is a real clinical entry this app supports — an undated dose still
// counts, and the engine has rules for it. Dropping every empty row without
// more would silently delete that clinician's entry, which is the worse of
// the two failures. So the row now carries `detailsUnknown` when the
// clinician ticks "A dose was given, but the date and product are unknown".
// A row with that tick IS a dose. A row without it, and with nothing typed
// in, is not.
//
// A row with only ONE of the two fields is deliberately not blank either: a
// product with no date is a real injection whose date is unavailable, and a
// date with no product is a real injection of an unrecorded product. The
// engine already grades both.
//
// Ported from MeningoVax K1 (`6b37c4a`) — the rule, not the code. PneumoVax's
// rows carry `product` where MeningoVax's carry `brand`, and PneumoVax stores
// nothing keyed to an individual dose, so MeningoVax's per-dose `id` and
// `doseAnswerKey` are deliberately NOT ported. See `doseIdentity.js`.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';
import { newDoseRow, isBlankDoseRow, dropBlankDoseRows } from '../doseIdentity.js';

const CHILD = { ageMonths: 24, dob: '2024-10-12', riskIds: [], today: '2026-10-12' };

describe('P1-3 — a blank dose row is not a dose', () => {
  describe('isBlankDoseRow', () => {
    it('an untouched new row is blank', () => {
      expect(isBlankDoseRow(newDoseRow())).toBe(true);
      expect(isBlankDoseRow({ date: '', product: '' })).toBe(true);
      expect(isBlankDoseRow({})).toBe(true);
      expect(isBlankDoseRow(null)).toBe(true);
      expect(isBlankDoseRow(undefined)).toBe(true);
    });

    it('a row with either field filled in is a dose', () => {
      expect(isBlankDoseRow({ date: '2025-01-01', product: '' })).toBe(false);
      expect(isBlankDoseRow({ date: '', product: 'PCV13' })).toBe(false);
      expect(isBlankDoseRow({ date: '2025-01-01', product: 'PCV13' })).toBe(false);
    });

    it('a row the clinician ticked as an undocumented dose is a dose', () => {
      // The whole reason this is a tick and not a silent drop.
      expect(isBlankDoseRow({ date: '', product: '', detailsUnknown: true })).toBe(false);
      // Un-ticking it makes it an untouched row again.
      expect(isBlankDoseRow({ date: '', product: '', detailsUnknown: false })).toBe(true);
    });

    it('a new PPSV23 row is blank even though the app stamped its product on', () => {
      // The PPSV23 stream has one product, so every row is born carrying it —
      // the card prints the product of each recorded dose and a row without
      // one reads "product unknown". That stamp is a label, not an answer, so
      // it must not make an untouched row into a dose. Without this, half of
      // P1-3 would be fixed and half left standing.
      expect(isBlankDoseRow({ date: '', product: 'PPSV23' })).toBe(true);
      expect(isBlankDoseRow({ date: '2020-01-01', product: 'PPSV23' })).toBe(false);
      expect(isBlankDoseRow({ date: '', product: 'PPSV23', detailsUnknown: true })).toBe(false);
      // and a PCV product is a real answer, never a stamp
      expect(isBlankDoseRow({ date: '', product: 'PCV13' })).toBe(false);
    });

    it('a field added to dose rows LATER keeps the row, without touching this file', () => {
      // Deliberately generic: "carries nothing at all", not a list of the two
      // fields we happen to know about today. Keeping an empty row is the bug
      // being fixed; discarding a row that holds real information would delete
      // a dose the clinician recorded, and those costs are not symmetrical.
      expect(isBlankDoseRow({ date: '', product: '', ageAtDoseMonths: 6 })).toBe(false);
    });
  });

  describe('dropBlankDoseRows', () => {
    it('removes every untouched row, not just a trailing one', () => {
      const kept = dropBlankDoseRows([
        { date: '', product: '' },
        { date: '2025-01-01', product: 'PCV13' },
        { date: '', product: '' },
        { date: '', product: '', detailsUnknown: true },
      ]);
      expect(kept).toEqual([
        { date: '2025-01-01', product: 'PCV13' },
        { date: '', product: '', detailsUnknown: true },
      ]);
    });

    it('survives null and undefined lists', () => {
      expect(dropBlankDoseRows(null)).toEqual([]);
      expect(dropBlankDoseRows(undefined)).toEqual([]);
    });
  });

  describe('the engine', () => {
    it('a blank row does not change the recommendation — the reported case', () => {
      const none = recommend({ ...CHILD, pcvDoses: [], ppsv23Doses: [] });
      const oneBlank = recommend({ ...CHILD, pcvDoses: [newDoseRow()], ppsv23Doses: [] });
      // Before the fix: 'due' vs 'catchup'.
      expect(oneBlank.recs.map((r) => r.status)).toEqual(none.recs.map((r) => r.status));
      expect(JSON.stringify(oneBlank.recs)).toBe(JSON.stringify(none.recs));
    });

    it('a blank row is not counted in the series', () => {
      const oneBlank = recommend({ ...CHILD, pcvDoses: [newDoseRow()], ppsv23Doses: [] });
      expect(oneBlank.meta.pcvCount).toBe(0);          // was 1
      expect(oneBlank.perDose.pcv).toEqual([]);        // and no chip to explain
      expect(oneBlank.orderedDoses.pcv).toEqual([]);
    });

    it('a blank PPSV23 row is not counted either', () => {
      const adult = { ageMonths: 840, dob: '1956-01-01', riskIds: [], today: '2026-10-12' };
      const none = recommend({ ...adult, pcvDoses: [], ppsv23Doses: [] });
      const blank = recommend({ ...adult, pcvDoses: [], ppsv23Doses: [newDoseRow()] });
      expect(blank.meta.ppsv23Count).toBe(0);
      expect(JSON.stringify(blank.recs)).toBe(JSON.stringify(none.recs));
    });

    it('a TICKED row still counts, and still says the date is unknown', () => {
      // The control that stops this fix becoming a silent drop of real input.
      const ticked = recommend({
        ...CHILD,
        pcvDoses: [{ date: '', product: '', detailsUnknown: true }],
        ppsv23Doses: [],
      });
      expect(ticked.meta.pcvCount).toBe(1);
      expect(ticked.perDose.pcv).toHaveLength(1);
      expect(ticked.perDose.pcv[0].reasons.join(' ')).toMatch(/No date recorded/);
    });

    it('a ticked row gives the same answer the old blank row used to give', () => {
      // Nothing about the UNDOCUMENTED-dose pathway changes — only who has to
      // say that is what the row means.
      const ticked = recommend({
        ...CHILD,
        pcvDoses: [{ date: '', product: '', detailsUnknown: true }],
        ppsv23Doses: [],
      });
      expect(ticked.recs.map((r) => r.status)).toEqual(['catchup']);
      expect(ticked.meta.pcvCount).toBe(1);
    });

    it('analyzeBoth drops blank rows too, so no caller has to remember', () => {
      const a = analyzeBoth({
        pcvDoses: [newDoseRow(), { date: '2025-01-01', product: 'PCV13' }],
        ppsv23Doses: [newDoseRow()],
        ageMonths: 24,
        today: '2026-10-12',
        riskIds: [],
      });
      expect(a.pcv.perDose).toHaveLength(1);
      expect(a.pcv.doses).toHaveLength(1);
      expect(a.ppsv23.perDose).toHaveLength(0);
      expect(a.ppsv23.doses).toHaveLength(0);
    });
  });
});
