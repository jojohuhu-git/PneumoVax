// FINDING J (2026-10-18) — p2016 comes off the cards whose patient does not
// match its row, and the document chip stops advertising a row at all.
//
// THE OWNER'S RULE this implements, given 2026-10-18:
//   "If using p2016 tables, all columns need to fit patient criteria in order
//    to use recommendations."
// p2016 Table 4's columns are: Child's age now | Number of previous PCV13,
// PCV15, or PCV20 doses | Option A | Option B. Matching the age band alone is
// not enough; the prior-dose column is where wrong-patient citations hide.
//
// THE CARD. "At-risk child whose PCV series includes PCV20 — no additional PCV
// or PPSV23 doses needed", 960 card instances over the committed grid. p2016's
// ONLY row whose history column mentions a prior PCV20 is:
//
//   2 through 18 years (any risk condition)
//   | "Completed PCV series before age 6 years, including one or more doses
//      of PCV20"
//   | Option A: "No additional doses"
//
// Its age column fits (2–18). Its prior-dose column requires the PCV20 to have
// been given BEFORE AGE 6. Measured: 96 of the 960 fit; 864 do not, because the
// PCV20 was given at 17 or 18. 0 are indeterminate (no undated-dose case
// reaches this card).
//
// READ THE WHOLE DOCUMENT BEFORE REMOVING IT — FINDING F's lesson, which cost
// 1,594 cards a citation when six removals were approved from a reading that had
// never opened mm7401a1's table. p2016 was re-downloaded live 2026-10-18 (HTTP
// 200, 211,252 bytes — the same edition, Item #P2016 of 2/16/2024) and laid out
// with `scripts/pdfLayout.py` so every cell keeps its row and column. All five
// tables were read:
//   Table 1 — "all children age 2 through 23 months". Age column cannot fit.
//   Table 2 — "HEALTHY children age 24 months through 18 years". Risk class
//             cannot fit; its "Completed any PCV schedule ... No additional
//             doses" row is a healthy child's row.
//   Table 3 — the risk-condition lists. States no recommendation.
//   Table 4 — nine rows, enumerated; the one above is the only one whose
//             history column mentions a previous PCV20.
//   Table 5 — post-HSCT, which this app hard-stops and never reaches.
// So for an at-risk child whose PCV20 was given at or after age 6, p2016 has no
// row. It is taken off those cards and kept on the 96 it speaks for.
//
// `scripts/uncreditedSources.mjs` cannot catch the opposite mistake — it only
// sees a document that is ON a card — so this file asserts PRESENCE as well as
// absence, exactly as FINDING F's guard does.
//
// THE SECOND HALF, and why it is in the same commit. The handoff's instruction
// was to cite CDC's risk-indications page in p2016's place. That page's chip
// could not be added as it stood: its label read
//
//   'CDC — Summary of Risk-based Pneumococcal Vaccination Recommendations
//    (incl. the row "Received PCV13 or PCV15 before age 6 years, never
//    received PCV20")'
//
// — a whole-document chip advertising one specific row, and the row it names
// says "never received PCV20". Putting that on 864 cards whose patient HAS a
// PCV20 would have replaced one wrong-patient citation with another. Measured
// before the change: the chip was on 1,351 cards; 0 belonged to a patient with a
// PCV20 (so that half was never yet contradicted) but 1,008 belonged to a
// patient with a counted dose at or after age 6, which the row it names
// excludes. The parenthetical goes, which is also what the population rule
// implies — "a quote-free entry declares no population, because a document has
// no patient, only a sentence does". The row's own wording is not lost: it is
// quoted verbatim by `pedsBefore6NoPcv20`, which declares its population and is
// cited where that row actually governs.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { addCalendarMonths, calendarMonthsBetween } from '../dateUtils.js';

const NEEDLE = 'At-risk child whose PCV series includes PCV20';

function noteOf(rec) {
  return typeof rec.note === 'string'
    ? rec.note
    : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' ');
}

/** Ages in months at each dose the engine counted; null for an undated one. */
function countedAges(res, dob) {
  return (res.orderedDoses?.pcv ?? [])
    .map((d, i) => ({ d, v: res.perDose?.pcv?.[i] }))
    .filter(({ v }) => v && v.status !== 'invalid' && v.status !== 'noncounting')
    .map(({ d }) => (d.date ? calendarMonthsBetween(dob, d.date) : null));
}

const chipShorts = (rec) => (rec.citations ?? []).map((c) => c.short);

describe('FINDING J - p2016 only where its row\'s columns all fit', () => {
  it('p2016 is on the PCV20-complete card exactly when the series was completed before age 6', () => {
    let fits = 0;        // row applies AND a PPSV23 is on record: p2016 present
    let swapped = 0;     // row applies, no PPSV23: p2016 off, 2023 report on
    let unfit = 0;       // row does not apply, p2016 absent
    const wrongly = [];  // row does not apply but p2016 is still there
    const missing = [];  // row applies but p2016 was taken off

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;

      const ages = countedAges(result, c.input.dob);
      // p2016's row: "Completed PCV series before age 6 years, including one or
      // more doses of PCV20". An undated dose cannot establish that, so it does
      // not fit either.
      const rowFits = ages.length > 0 && ages.every((a) => a !== null && a < 72);
      // ⚠️ OWNER DECISION 2026-10-25 SPLIT THE "ROW FITS" SIDE IN TWO, and
      // this flag is the split. Where the row fits AND no PPSV23 is on record,
      // CDC/ACIP's 2023 PCV20-in-children report states the whole claim
      // ("No additional doses of any pneumococcal vaccine are indicated."), so
      // under her standing "cite CDC; reach for p2016 only if you cannot" rule
      // p2016 comes OFF and the 2023 report goes on — the same disposition she
      // gave the 840 at/after-6 cards on 2026-10-23, where p2016's rows also
      // fitted. Where a PPSV23 HAS been given, p2016 STAYS: that is her
      // 2026-10-23 decision on the 40 Group-B cards, and it turns on CDC's
      // child-notes branch carrying a "but have not received PPSV23" condition
      // that p2016's row does not.
      //
      // This is NOT the FINDING F fault. p2016 is not being removed for
      // silence — its row fits and was re-read live on 2026-10-25 ("Completed
      // PCV series before age 6 years, including one or more doses of PCV20 |
      // No additional doses"). It is being ranked below CDC where both speak.
      //
      // ⚠️ COUNTING DOSES, NOT ROWS. The engine's branch keys on `ppsv.count`
      // — the EFFECTIVE count — so a PPSV23 given at 12 months, which is below
      // the minimum age and does not count, leaves the child in the no-PPSV23
      // group. Reading `c.input.ppsv23Doses.length` instead put 40 such
      // patients on the wrong side of this split and reported them as a
      // removal. "Count doses the way the document counts" — the same lesson
      // the 60/72/12 split taught.
      const hasPpsv = (result.perDose?.ppsv23 ?? [])
        .some((v) => v && v.status !== 'invalid' && v.status !== 'noncounting');

      for (const rec of result.recs ?? []) {
        if (!noteOf(rec).includes(NEEDLE)) continue;
        const hasP2016 = chipShorts(rec).includes('immunize.org p2016');
        const has2023 = chipShorts(rec).includes('ACIP 2023 PCV20 Children');
        if (rowFits && hasPpsv) {
          if (hasP2016) fits += 1; else missing.push(c.key);
        } else if (rowFits) {
          // The swapped group: p2016 must be gone and the 2023 report present.
          if (hasP2016) wrongly.push(`${c.key}: p2016 kept after the 2026-10-25 swap`);
          else if (!has2023) missing.push(`${c.key}: swapped but the 2023 report is absent`);
          else swapped += 1;
        } else if (!hasP2016) {
          unfit += 1;
        } else {
          wrongly.push(`${c.key}: doses at ${ages.map((a) => (a === null ? '?' : Math.round(a))).join(',')} mo`);
        }
      }
    }

    // Both directions, because a removal can be as wrong as a wrong citation
    // (FINDING F), and `uncreditedSources.mjs` can only ever see one of them.
    expect(wrongly.slice(0, 8)).toEqual([]);
    expect(wrongly).toHaveLength(0);
    expect(missing.slice(0, 8)).toEqual([]);
    expect(missing).toHaveLength(0);

    // The measured split, pinned. Not an anti-vacuity flourish: if either side
    // went to zero the assertions above would pass while the card had stopped
    // existing, or while p2016 had been stripped from every card including the
    // ones it speaks for.
    // ⚠️ RE-MEASURED 2026-10-25, AND THE OLD 96 SPLIT CLEANLY IN TWO:
    //   40  the row fits AND a counting PPSV23 is on record -> p2016 STAYS.
    //       Exactly the 40 `regression-finding-k-...` pins, reached here by a
    //       different route, which is the cross-check that the two guards
    //       agree about who those children are.
    //   56  the row fits and no PPSV23 counts -> p2016 OFF, 2023 report ON
    //       (owner, 2026-10-25).
    //   96  = 40 + 56, the figure this line held before the swap.
    // Pinned exactly, both of them: if the swap ever widened to the 40, or
    // narrowed, one of these fails rather than the suite going quiet.
    expect(fits).toBe(40);
    expect(swapped).toBe(56);
    expect(fits + swapped).toBe(96);
    expect(unfit).toBe(864);
  });

  it('the risk-indications chip no longer advertises a single row', () => {
    const { label, quote, population } = REFS.cdcRiskIndications;
    expect(quote).toBeUndefined();          // a whole-document chip
    expect(population).toBeUndefined();     // so it declares no patient
    expect(label).not.toContain('never received PCV20');
    expect(label).not.toContain('before age 6 years');
    // The row's wording is not lost — it is quoted where it governs.
    expect(REFS.pedsBefore6NoPcv20.quote)
      .toBe('Received PCV13 or PCV15 before age 6 years, never received PCV20');
  });

  describe('the owner\'s patient, built by hand', () => {
    // `ppsv` is a list of ages in months, added 2026-10-25 so the Group A /
    // Group B control pair below can differ in exactly one field.
    const patient = ({ ageMonths, riskIds, pcv, ppsv = [] }) => {
      const dob = addCalendarMonths(CORPUS_TODAY, -ageMonths);
      return recommend({
        ageMonths,
        dob,
        today: CORPUS_TODAY,
        riskIds,
        pcvDoses: pcv.map(([product, mo]) => ({ product, date: addCalendarMonths(dob, mo) })),
        ppsv23Doses: ppsv.map((mo) => ({ product: 'PPSV23', date: addCalendarMonths(dob, mo) })),
      });
    };

    it('18y, asplenia, PCV13 at 8 and PCV20 at 17: complete, and p2016 is off the card', () => {
      const r = patient({ ageMonths: 216, riskIds: ['asplenia'], pcv: [['PCV13', 96], ['PCV20', 204]] });
      const card = (r.recs ?? []).find((x) => noteOf(x).includes(NEEDLE));
      expect(card).toBeDefined();
      // The VERDICT is unchanged and must stay that way: CDC says a PCV20 given
      // >=8 weeks after the last PCV completes an at-risk 6-18 child's series.
      expect(card.status).toBe('complete');
      expect(chipShorts(card)).not.toContain('immunize.org p2016');
      // UPDATED BY FINDING K (2026-10-18), later the same day, and NOT loosened
      // -- the assertion is stronger than the one it replaces.
      //
      // This commit put the CDC Risk-based chip here and left the numbered
      // citation as `pedsRiskPcv20Complete`, on the stated ground that CDC's
      // sentence "carries no age condition in its own words". It does not carry
      // one, but its PARENT bullet does: CDC prints it under "Received PCV
      // before age 6 years but have not received PPSV23", and this patient's
      // only pre-PCV20 conjugate was at age 8. Nor does the Risk-based page
      // have a branch for a conjugate first given at or after age 6 -- its two
      // are "Never received PCV13, PCV15, or PCV20" and "Received PCV13 or
      // PCV15 before age 6 years, never received PCV20".
      //
      // So the chip this commit added comes off, and the citation becomes the
      // row the PCV20 SATISFIED -- CDC's "Received PCV13 only at or after age 6
      // years: administer 1 dose PCV20 ..." -- by OWNER DECISION 2026-10-18,
      // taken after she was shown this patient. Full account in
      // `regression-finding-k-2026-10-18-nested-bullet-conditions.test.js`.
      expect(chipShorts(card)).not.toContain('CDC Risk-based Pneumococcal');
      expect(chipShorts(card)).toContain('CDC Child/Adolescent Notes');
      expect((card.noteCites ?? []).map((x) => x.key)).toEqual(['pedsRiskPcv13At6']);
      // And the card must SAY the dose has been given, or a row that asks for a
      // PCV20 reads as still owing one.
      expect(noteOf(card)).toMatch(/that dose has been given/);
    });

    // ⚠️ THIS CASE REVERSED ON 2026-10-25, AND THE REVERSAL IS THE RECORD.
    // It was called "p2016's row fits, so it stays" and asserted exactly that.
    // p2016's row still fits — re-read live that day, "Completed PCV series
    // before age 6 years, including one or more doses of PCV20 | No additional
    // doses" — but CDC/ACIP's 2023 PCV20-in-children report states the whole
    // claim too, and the owner's standing rule prefers CDC where both speak.
    // So this is a RANKING, not a removal for silence, and not FINDING F.
    it('6y, asplenia, PCV20 at age 5, no PPSV23: the 2023 ACIP report replaces p2016', () => {
      const r = patient({ ageMonths: 72, riskIds: ['asplenia'], pcv: [['PCV20', 60]] });
      const card = (r.recs ?? []).find((x) => noteOf(x).includes(NEEDLE));
      expect(card).toBeDefined();
      expect(card.status).toBe('complete');
      expect(chipShorts(card)).toContain('ACIP 2023 PCV20 Children');
      expect(chipShorts(card)).not.toContain('immunize.org p2016');
      // The claim is still credited by number, to the sentence that states it.
      expect((card.noteCites ?? []).map((x) => x.key))
        .toContain('cdcPcv20Children2023CompleteWithPcv20');
    });

    // THE CONTROL, and the reason the swap is scoped rather than blanket. The
    // same child WITH a PPSV23 is in Group B, where CDC's child-notes branch
    // is headed "but have not received PPSV23" and p2016's row carries no such
    // condition. That was the owner's decision of 2026-10-23, pinned at 40
    // cards, and 2026-10-25 did not touch it.
    it('...but the same child WITH a PPSV23 keeps p2016', () => {
      const r = patient({
        ageMonths: 72, riskIds: ['asplenia'], pcv: [['PCV20', 60]], ppsv: [62],
      });
      const card = (r.recs ?? []).find((x) => noteOf(x).includes(NEEDLE));
      expect(card).toBeDefined();
      expect(chipShorts(card)).toContain('immunize.org p2016');
      expect(chipShorts(card)).not.toContain('ACIP 2023 PCV20 Children');
    });

    it('a PCV20 given <8 weeks after a prior PCV is rejected, not called complete', () => {
      // The control the handoff flagged as already-correct, kept because this
      // commit touches the card that would show it. CDC's completion sentence is
      // conditional on the 8 weeks, so an engine that ignored the interval would
      // make the citation false rather than merely misplaced.
      const dob = addCalendarMonths(CORPUS_TODAY, -216);
      const tooSoon = recommend({
        ageMonths: 216,
        dob,
        today: CORPUS_TODAY,
        riskIds: ['asplenia'],
        pcvDoses: [
          { product: 'PCV13', date: addCalendarMonths(dob, 199) },
          { product: 'PCV20', date: addCalendarMonths(dob, 200) },   // ~4-5 weeks later
        ],
        ppsv23Doses: [],
      });
      expect((tooSoon.recs ?? []).every((x) => x.status !== 'complete')).toBe(true);
    });
  });
});
