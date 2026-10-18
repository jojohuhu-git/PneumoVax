// FINDING I (2026-10-18) — three conjugate doses given at 16 are not "completed
// before age 6", however many of them there are.
//
// THE PATIENT. 18 years old, asplenia, three PCV13 doses at 16y0m, 16y3m and
// 16y6m, all valid, no PPSV23. The card read:
//
//   "At-risk immunocompromising child who completed PCV13/15 before age 6 (no
//    PCV20, no PPSV23): Option A — 1 dose of PCV20 ≥8 weeks after the most
//    recent PCV (completes the series)."
//
// Every dose was at 16.
//
// THE ROOT CAUSE IS ONE LINE, and it is a leftover from FINDING G's own fix.
// FINDING G replaced a count test with an age test but wrote the gate as
//
//     if (pcv.count >= 3 || allCountingPcvBefore72mo)
//
// keeping the `>= 3` half DELIBERATELY, so that a three-dose history containing
// an UNDATED dose — which `allCountingPcvBefore72mo` excludes, because an
// undated dose cannot be confirmed pre-72mo — would land exactly where it did
// before. That much is right and is preserved here. What the `>= 3` also caught
// was a fully DATED three-dose history given at or after age 6, which is
// precisely the history rows 8/9 exist for. The fix adds the one condition the
// kept half was missing: no dated dose at or after 72 months.
//
// A 1-2 DOSE UNDATED HISTORY DOES NOT MOVE, and that is why the fix is written
// as `(pcv.count >= 3 && pcv.band.ge72 === 0) || allCountingPcvBefore72mo`
// rather than the shorter `pcv.count >= 1 && pcv.band.ge72 === 0`. The short
// form reads better and is wrong: it would sweep a child with one or two
// undated doses out of rows 8/9 and into rows 4/5, asserting "completed before
// age 6" about doses whose dates nobody knows. Neither row is supportable for
// that child; the fix does not pretend to settle it, and leaves them where they
// were. The control below pins that.
//
// WHAT IT MOVES, measured over the committed grid before the fix: 64 cards
// claim a before-6 history to a child with a dated dose at or after 6 — 16 with
// no PPSV23 ("completed PCV13/15 before age 6") and 48 with one ("who completed
// PCV13/15 and has already received PPSV23").
//
// (!) THE HANDOFF SAID 96. The difference is what is being counted, not a
// disagreement about the engine: 96 counts every card on the mis-routed branch,
// 64 counts the cards whose PROSE makes a false claim. The other 32 are the
// non-IC "completed the PCV series and has received PPSV23 — complete" card,
// which is routed through rows 4/5 but says nothing about age at all. They are
// re-routed by this fix too; they just never lied.
//
// THE DOSE DOES NOT MOVE EITHER WAY, which had to be checked rather than
// assumed, because rows 4/5 and rows 8/9 anchor their 8 weeks differently —
// `anchorPneumo` (latest of PCV or PPSV23) against `anchorPcv` (latest PCV).
// For every patient this fix re-routes, both verdict corpora are unchanged; see
// the commit for the counts.
//
// SOURCES, read live 2026-10-18 (p2016 downloaded this session: HTTP 200,
// 211,252 bytes, "Item #P2016 (2/16/2024)"):
//   p2016 Table 4 rows 8/9 — "PCV13 only, given at or after age 6 years"
//   p2016 Table 4 rows 4/5 — "Completed PCV series before age 6 years with
//                             PCV13 and/or PCV15 (no PCV20, no PPSV23)"
// The owner's ruling on which document goes on the card (2026-10-18): BOTH —
// p2016 rows 8/9 because it is the only row whose columns all fit, and CDC's
// 6-18 guidance for currency. Both are already on these cards; no citation
// change was needed, only the routing.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { addCalendarMonths, calendarMonthsBetween } from '../dateUtils.js';

function proseOf(rec) {
  const note = typeof rec.note === 'string'
    ? rec.note
    : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' ');
  return `${note} ${rec.doseLabel ?? ''}`;
}

/** The doses the engine counted, with the age in months at each dated one. */
function countedDoses(res, dob) {
  return (res.orderedDoses?.pcv ?? [])
    .map((d, i) => ({ d, v: res.perDose?.pcv?.[i] }))
    .filter(({ v }) => v && v.status !== 'invalid' && v.status !== 'noncounting')
    .map(({ d }) => (d.date ? calendarMonthsBetween(dob, d.date) : null));
}

/** Claims that only a child vaccinated entirely before age 6 may be shown. */
const BEFORE_SIX_CLAIMS = [
  'completed PCV13/15 before age 6',
  'completed the PCV series before age 6',
  'who completed PCV13/15 and has already received PPSV23',
  'who completed the PCV series and has already received PPSV23',
  'All conjugate doses on record were given before age 6',
];

describe('FINDING I - a dated dose at or after age 6 is never called a before-6 series', () => {
  it('no card claims a before-6 series to a child with a dated dose at or after 72 months', () => {
    const breaches = [];
    let sawTheClaim = 0;

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;

      const ages = countedDoses(result, c.input.dob);
      const dated = ages.filter((a) => a !== null);

      for (const rec of result.recs ?? []) {
        const prose = proseOf(rec);
        if (!BEFORE_SIX_CLAIMS.some((n) => prose.includes(n))) continue;
        sawTheClaim += 1;
        if (dated.some((a) => a >= 72)) {
          breaches.push(`${c.key}: doses at ${dated.map((a) => Math.round(a)).join(',')} mo`);
        }
      }
    }

    // Anti-vacuity: the before-6 rows are real rows that real children reach,
    // so the claim must still be made somewhere. Without this the assertion
    // below passes on an engine that says nothing.
    expect(sawTheClaim).toBeGreaterThan(0);
    expect(breaches.slice(0, 8)).toEqual([]);
    expect(breaches).toHaveLength(0);
  });

  describe('the patients, built by hand', () => {
    const patient = ({ ageMonths, riskIds, pcv, ppsv = [] }) => {
      const dob = addCalendarMonths(CORPUS_TODAY, -ageMonths);
      return recommend({
        ageMonths,
        dob,
        today: CORPUS_TODAY,
        riskIds,
        pcvDoses: pcv.map(([product, mo]) => (mo === null
          ? { product }
          : { product, date: addCalendarMonths(dob, mo) })),
        ppsv23Doses: ppsv.map((mo) => ({ product: 'PPSV23', date: addCalendarMonths(dob, mo) })),
      });
    };
    const proseAll = (r) => (r.recs ?? []).map(proseOf).join('\n');

    it('18y, asplenia, three PCV13 at 16y0m/3m/6m: rows 8/9, not "before age 6"', () => {
      const r = patient({
        ageMonths: 216,
        riskIds: ['asplenia'],
        pcv: [['PCV13', 192], ['PCV13', 195], ['PCV13', 198]],
      });
      const prose = proseAll(r);
      expect(prose).not.toContain('before age 6');
      expect(prose).toContain('with PCV13 only (at/after age 6)');
      // The dose is the same as it was on the wrong row: PCV20 at >=8 weeks, or
      // PPSV23 at >=8 weeks with the IC five-year follow-on.
      const a = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option A'));
      const b = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option B'));
      expect(a?.brands).toEqual(['PCV20 (Prevnar 20)']);
      expect(b?.brands).toEqual(['PPSV23 (Pneumovax 23)']);
      expect(a?.minIntervalDays).toBe(56);
      expect(proseOf(b)).toContain('5 years');
    });

    it('the same child WITH a PPSV23 is not told the series was completed before age 6', () => {
      const r = patient({
        ageMonths: 216,
        riskIds: ['asplenia'],
        pcv: [['PCV13', 192], ['PCV13', 195], ['PCV13', 198]],
        ppsv: [204],
      });
      expect(proseAll(r)).not.toContain('before age 6');
      expect(proseAll(r)).not.toContain('completed PCV13/15');
    });

    it('a genuine before-6 three-dose series keeps rows 4/5 — the fix does not over-reach', () => {
      const r = patient({
        ageMonths: 216,
        riskIds: ['asplenia'],
        pcv: [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]],
      });
      expect(proseAll(r)).toContain('completed PCV13/15 before age 6');
    });

    it('a MIXED history - doses before 6 AND one after - is not called a before-6 series', () => {
      // Neither p2016 row fits this child exactly: rows 4/5 want every dose
      // before 6, rows 8/9 want the conjugate history to be at/after 6. The fix
      // sends them to rows 8/9, because the one thing that is certainly false is
      // "completed before age 6" -- there is a dose at 17 on the record. Same
      // products, same 8 weeks, same five-year IC tail either way.
      const r = patient({
        ageMonths: 216,
        riskIds: ['asplenia'],
        pcv: [['PCV13', 2], ['PCV13', 4], ['PCV13', 204]],
      });
      expect(proseAll(r)).not.toContain('before age 6');
    });

    it('an UNDATED three-dose history still lands on rows 4/5, as FINDING G intended', () => {
      // The `>= 3` half of the gate exists for exactly this patient and is kept.
      const r = patient({
        ageMonths: 216,
        riskIds: ['asplenia'],
        pcv: [['PCV13', null], ['PCV13', null], ['PCV13', null]],
      });
      expect(proseAll(r)).toContain('completed PCV13/15 before age 6');
    });

    it('a 1-2 dose UNDATED history does not move: it stays on rows 8/9', () => {
      // The control for the short-form fix that would have been wrong. These
      // children are not described by either row; this change does not claim to
      // settle them, and must not silently reclassify them.
      const r = patient({ ageMonths: 216, riskIds: ['asplenia'], pcv: [['PCV13', null]] });
      expect(proseAll(r)).toContain('(at/after age 6)');
      expect(proseAll(r)).not.toContain('before age 6');
    });
  });
});
