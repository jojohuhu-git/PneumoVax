// ── C13 (2026-10-30): the at-risk "complete" cards say what happens at 19 ────
//
// OWNER RULING 2026-10-30, on Maya — "One line per group".
//
// GROUP B of C12: an at-risk child (not immunocompromised) whose card says
// "complete", and who is not complete for life. Maya — 18, cochlear implant,
// PCV13 at 7y11m, PPSV23 at 12y11m — read "no further doses of any PCV or
// PPSV23 are indicated", and one year later the app says "Due today: PCV20 or
// PCV21". The card named no age.
//
// All 540 of these cards were run forward to 19 before she was asked. They
// split four ways, so she chose one line per group, each saying what the app
// itself will say at 19 (the handoff's "640" was its own four counts added
// wrong: 450 + 70 + 15 + 5 = 540).
//
// ⚠ THE LINE IS A SECOND READING OF THE ADULT RULES. This file is what holds
// it to the first: every card carrying a line is run forward to 19 and the
// adult card must agree with it.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { addCalendarMonths } from '../dateUtils.js';

const LINES = {
  dose: 'At 19, the adult schedule gives 1 dose of PCV20 or PCV21, at least 5 years after the last pneumococcal dose [c].',
  none: 'At 19, the adult schedule gives no dose now; re-evaluate at age 50 [c].',
  twoPpsv: 'At 19, the adult schedule says to review again at age 50, or give 1 dose of PCV20 or PCV21 at least 5 years after the last pneumococcal dose [c].',
  unrecorded: 'At 19, because the earlier conjugate’s product is not recorded, the adult schedule gives 1 dose of PCV15, PCV20 or PCV21, at least 1 year after the PPSV23 [c].',
};
// What the ADULT card says at 19 for each line — its dose label and its source.
const AT_19 = {
  dose: ['PCV20 or PCV21 ≥5 years after last pneumococcal dose — completes the series', 'adultIc1949BothPcv13Ppsv'],
  none: ['No dose now — review at age 50', 'adultChronicOnlyReviewAt50'],
  twoPpsv: ['Review at age 50 — or PCV20 or PCV21 ≥5 years after the last pneumococcal dose', 'mmwrIc1949TwoPpsv'],
  unrecorded: ['PCV (PCV15, PCV20, or PCV21) ≥1 year after PPSV23', 'adultPpsvOnly1949'],
};
const GROUP_B = new Set([
  'Complete (PCV13 + PPSV23 at/after age 6)',
  'Complete (a PCV of unrecorded product + PPSV23 at/after age 6)',
  'PCV complete (at-risk catch-up done)',
  'Complete (PCV series + PPSV23)',
  // 2026-10-31 (§B-AT19): a Group B card C13 missed. The grid reaches it 145
  // times and it carried no line, because this list was the sweep's filter and
  // it was not on it. The line now comes from the adult card at 19 for every
  // "complete" card: 85 of the 145 gain one (30 "dose", 45 "none", 10
  // "unrecorded"), and the 60 with a PCV15 series are complete at 19 and get
  // none. The 540 cards she was shown on 2026-10-30 are unchanged.
  'PCV series complete (PCV before age 6 + PPSV23)',
]);
const FINISHED_COUNT = 60; // the before-6 card with a PCV15 series, 2026-10-31
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const lineOf = (r) => Object.keys(LINES).filter((k) => noteText(r).includes(LINES[k].replace(' [c].', '')));

// One pass over the grid, shared by every test below.
const FINISHED = [];
const SWEEP = (() => {
  const rows = [];
  for (const c of buildCases()) {
    let out;
    try { out = recommend(c.input); } catch { continue; }
    if (out.excluded) continue;
    for (const r of out.recs ?? []) {
      const lines = lineOf(r);
      if (!lines.length && !GROUP_B.has(r.doseLabel)) continue;
      // 2026-10-31: a Group B LABEL can be complete for life — the before-6
      // card with a PCV15 series reads "Complete (PCV15 + PPSV23)" at 19 — and
      // then carries no line. Set aside, and checked below.
      if (!lines.length) { FINISHED.push({ c, r }); continue; }
      rows.push({ c, r, lines });
    }
  }
  return rows;
})();

describe('C13 — every at-risk "complete" card says what happens at 19', () => {
  it('every Group B card carries exactly one line, and no other card carries any', () => {
    for (const { r, lines } of SWEEP) {
      expect(GROUP_B.has(r.doseLabel), r.doseLabel).toBe(true);
      expect(lines, r.doseLabel).toHaveLength(1);
    }
  });

  it('a Group B label with no line is one whose adult card at 19 says the series is complete', () => {
    for (const { c, r } of FINISHED) {
      const at19 = recommend({
        ...c.input, ageMonths: 228,
        today: addCalendarMonths(c.input.today, 228 - c.input.ageMonths),
      }).recs[0];
      expect(at19.status, `${c.key}: ${r.doseLabel}`).toBe('complete');
      expect(at19.doseLabel).not.toBe(AT_19.none[0]);
    }
    expect(FINISHED.length).toBe(FINISHED_COUNT);
  });

  it('the counts she was shown, pinned exactly', () => {
    const n = {};
    for (const { lines } of SWEEP) n[lines[0]] = (n[lines[0]] ?? 0) + 1;
    // 2026-10-30: 156 / 282 / 32 / 70 = 540. +30 / +45 / +10 on 2026-10-31 —
    // the before-6 card above.
    expect(n).toEqual({ dose: 186, none: 327, twoPpsv: 32, unrecorded: 80 });
  });

  it('run forward to 19, the adult card says what the line said — every one of the 625', () => {
    let checked = 0;
    for (const { c, r, lines } of SWEEP) {
      const k = lines[0];
      const at19 = recommend({
        ...c.input, ageMonths: 228,
        today: addCalendarMonths(c.input.today, 228 - c.input.ageMonths),
      }).recs[0];
      expect(at19.doseLabel, `${c.key}: ${r.doseLabel}`).toBe(AT_19[k][0]);
      // The line cites the row the adult card itself cites. (Not always the
      // LAST cite since 2026-10-31: on a lead + "Why this" card the line ends
      // the lead, so its cite sits before the detail's.)
      expect(r.noteCites.map((x) => x.key)).toContain(AT_19[k][1]);
      expect(at19.noteCites.map((x) => x.key)).toContain(AT_19[k][1]);
      checked++;
    }
    expect(checked).toBe(625);
  });

  it('every marker still has its citation', () => {
    for (const { r } of SWEEP) {
      expect((noteText(r).match(/\[c\]/g) ?? []).length).toBe(r.noteCites.length);
    }
  });
});

describe('Maya, word for word', () => {
  it('her card ends with the line for a cochlear implant, cited to CDC\'s adult notes', () => {
    const card = recommend({
      ageMonths: 216, dob: '2008-10-30', today: '2026-10-30', riskIds: ['cochlear_implant'],
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-11' }],
    }).recs[0];
    expect(card.note).toBe(
      'Non-immunocompromising at-risk child with PCV13 at/after age 6 who has received PPSV23 — no further doses of any PCV or PPSV23 are indicated [c]. ' + LINES.dose,
    );
    expect(card.noteCites.map((x) => x.key)).toEqual(['pedsRiskDone', 'adultIc1949BothPcv13Ppsv']);
  });
});
