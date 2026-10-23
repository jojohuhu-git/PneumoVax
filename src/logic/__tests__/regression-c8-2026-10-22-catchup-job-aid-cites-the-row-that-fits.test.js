// C8, documents 3 and 5 on the healthy 24–59 month cards (2026-10-22).
//
// Both the CDC PCV Catch-Up Job Aid and immunize.org p2016 were listed as grey
// source buttons on the healthy catch-up card and on the healthy "series
// complete" card, with no number pointing at either. That is the owner's
// original question — "why there are multiple source chips listed if its only
// citing one of them" — and this closes it for both cards: after this change
// neither card has an uncredited document left, and the report's total falls
// from 49 pairs to 47.
//
// WHY THE JOB AID TAKES A SPLIT AND p2016 DOES NOT. p2016 Table 2 answers the
// whole age band in two rows — complete by 24 months, or not — so one entry per
// card is enough. The job aid's p.3 answers the SAME age band differently
// depending on its "AND # of previous doses is" column and, inside that, on
// when those doses were given and whether 8 weeks has passed. One entry could
// only ever have been right for one group. This is the owner's all-columns rule
// of 2026-10-18 ("all columns need to fit patient criteria in order to use
// recommendations") applied to a second document.
//
// HOW THE PREVIOUS DOSES ARE COUNTED. The job aid's own preamble requires it:
// "previous doses must be documented and must meet minimum age requirements and
// minimum intervals between doses". That is the EFFECTIVE count — a PCV7, or a
// dose rejected for spacing, is not a previous dose this table is about. The
// 2026-10-22 handoff recorded the split as 60/72/12 cards; counted on effective
// doses it is 48/84/12, and after FINDING M it is 48/84.
//
// THE ROWS, read live 2026-10-22 from the job aid p.3 with
// `scripts/pdfLayout.py` (which keeps each cell tied to its own row — a flat
// dump of this page interleaves the four condition columns). p.3 is the only
// page covering 24–59 months; p.1 is 4–6 and 7–11 months, p.2 is 12–23.
//
//   0 previous doses                   → "Give Dose 1 today"
//   1, due now                         → "Give Dose 2 (Final Dose) today"
//   1, given after the 1st birthday
//     and less than 8 weeks ago        → "Give Dose 2 (Final Dose) at least
//                                         8 weeks after Dose 1"
//   2, dose 1 before 12 months         → "Give Dose 3 (Final Dose) today"
//   3, all before 12 months            → "Give Dose 4 (Final Dose) today"
//   1–3 with one at ≥12 months         → "No dose today" / "No additional
//                                         doses needed"  (four rows, one cell
//                                         pair — the completed card)
//
// TWO HISTORIES GET NO JOB AID NUMBER, DELIBERATELY. The table stops at three
// previous doses, and it requires them to be documented. So a child with four
// or more conjugate doses, and a child whose completing dose is undated, have
// no row here — owner case (a), "no document has a row for the history". They
// are left with the documents that DO speak for them rather than pointed at a
// row about somebody else. Both are asserted below, because the committed grid
// contains neither: every one of its 588 affected cards lands on a cited
// branch, so without these cases a regression in either would be invisible.
//
// FINDING M IS WHAT MAKES THE 2- AND 3-DOSE ROWS FIT BY CONSTRUCTION. Since a
// series begun in the second year is complete at two doses, a child still on
// the catch-up card with 2 doses must have had dose 1 before 12 months, and one
// with 3 doses must have had all three before 12 months — which is exactly what
// those two rows' prior-dose columns require. Before FINDING M neither held.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';

const TODAY = '2026-10-22';

function dobForAgeMonths(m) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - m);
  return d.toISOString().slice(0, 10);
}
function onBirthdayMonth(dob, m) {
  const d = new Date(`${dob}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + m);
  return d.toISOString().slice(0, 10);
}

// `doses` entries are either a month-age number or the string 'undated'.
function healthyChild(ageMonths, doses, product = 'PCV13') {
  const dob = dobForAgeMonths(ageMonths);
  return recommend({
    dob,
    today: TODAY,
    riskIds: [],
    ppsv23Doses: [],
    pcvDoses: doses.map((m) => (m === 'undated'
      ? { product, date: null }
      : { product, date: onBirthdayMonth(dob, m) })),
  });
}
function pcvCard(result) {
  return (result.recs ?? []).find((r) => r.vaccine === 'PCV');
}
function citeKeys(rec) {
  return (rec.noteCites ?? []).map((c) => c.key);
}
function leadOf(rec) {
  return typeof rec.note === 'string' ? rec.note : rec.note.lead;
}

describe('the job aid is credited with the row whose every column fits', () => {
  const rows = [
    ['0 previous doses', 30, [], 'jobAidPedsCatchupDose1'],
    ['1 previous dose, 8 weeks already elapsed', 30, [14], 'jobAidPedsCatchupDose2'],
    ['1 previous dose before the first birthday', 30, [8], 'jobAidPedsCatchupDose2'],
    ['1 previous dose, not yet 8 weeks ago', 24, [23], 'jobAidPedsCatchupDose2Later'],
    ['2 previous doses, dose 1 before 12 months', 30, [3, 5], 'jobAidPedsCatchupDose3'],
    ['3 previous doses, all before 12 months', 30, [2, 4, 6], 'jobAidPedsCatchupDose4'],
  ];

  it.each(rows)('%s → %s', (_label, ageMonths, doses, expectedKey) => {
    const rec = pcvCard(healthyChild(ageMonths, doses));
    expect(leadOf(rec)).toContain('Give 1 dose of PCV15 or PCV20');
    expect(citeKeys(rec)).toEqual([
      'pedsHealthyCatchup',
      'p2016HealthyCatchup24to59',
      expectedKey,
    ]);
  });

  it('the not-yet-due row is the only one quoting an interval, and it quotes the 8 weeks', () => {
    const rec = pcvCard(healthyChild(24, [23]));
    expect(rec.dueToday).toBe(false);
    expect(REFS.jobAidPedsCatchupDose2Later.quote)
      .toBe('Give Dose 2 (Final Dose) at least 8 weeks after Dose 1');
    // The three "today" cells must not claim an interval the job aid states
    // only for the patient who has not waited it out.
    for (const k of ['jobAidPedsCatchupDose1', 'jobAidPedsCatchupDose2',
      'jobAidPedsCatchupDose3', 'jobAidPedsCatchupDose4']) {
      expect(REFS[k].quote, k).not.toMatch(/8 weeks/);
    }
  });

  // Not in the committed grid — a regression here would be silent without it.
  it('four doses all before 12 months gets NO job aid number: the table stops at three', () => {
    const rec = pcvCard(healthyChild(30, [2, 4, 6, 9]));
    expect(leadOf(rec)).toContain('Give 1 dose of PCV15 or PCV20');
    expect(citeKeys(rec)).toEqual(['pedsHealthyCatchup', 'p2016HealthyCatchup24to59']);
    expect(citeKeys(rec).some((k) => k.startsWith('jobAid'))).toBe(false);
  });

  it('every catch-up card cites p2016 Table 2, whose row states the dose AND the 8 weeks', () => {
    expect(REFS.p2016HealthyCatchup24to59.quote).toContain('1 additional dose, at least 8 wks');
    for (const [, ageMonths, doses] of rows) {
      expect(citeKeys(pcvCard(healthyChild(ageMonths, doses))))
        .toContain('p2016HealthyCatchup24to59');
    }
  });
});

describe('the completed card credits the rows that end the series', () => {
  const ended = [
    ['1 dose given after the second birthday', 30, [25]],
    ['2 doses begun in the second year', 30, [13, 15]],
    ['3 doses with one at 12 months or later', 30, [5, 14, 17]],
  ];

  it.each(ended)('%s → the job aid cell that gives nothing', (_label, ageMonths, doses) => {
    const rec = pcvCard(healthyChild(ageMonths, doses));
    expect(rec.status).toBe('complete');
    expect(citeKeys(rec)).toEqual([
      'pedsNoPcv20IfComplete',
      'p2016HealthyComplete24to59',
      'jobAidPedsCatchupNoneNeeded',
    ]);
  });

  it('an undated completing dose gets NO job aid number: the table needs documented doses', () => {
    const rec = pcvCard(healthyChild(30, ['undated'], 'PCV20'));
    expect(rec.status).toBe('complete');
    expect(citeKeys(rec)).toEqual(['pedsNoPcv20IfComplete', 'p2016HealthyComplete24to59']);
  });

  it('the two p2016 rows are the two halves of Table 2 and say opposite things', () => {
    expect(REFS.p2016HealthyComplete24to59.quote).toContain('Completed any PCV schedule');
    expect(REFS.p2016HealthyComplete24to59.quote).toContain('No additional doses');
    expect(REFS.p2016HealthyCatchup24to59.quote).toContain('incomplete PCV schedule');
  });
});

describe('every marker on these cards has a citation behind it', () => {
  // `noteCiteSlices` pairs markers to cites BY POSITION, so a lead carrying
  // more [c] than the array has cites renders a number with nothing behind it.
  const patients = [
    [30, []], [30, [14]], [30, [8]], [24, [23]], [30, [3, 5]],
    [30, [2, 4, 6]], [30, [2, 4, 6, 9]], [30, [25]], [30, [13, 15]], [30, [5, 14, 17]],
  ];
  it.each(patients)('age %i months, doses %j', (ageMonths, doses) => {
    const rec = pcvCard(healthyChild(ageMonths, doses));
    const markers = (leadOf(rec).match(/\[c\]/g) ?? []).length;
    expect(markers).toBe(citeKeys(rec).length);
    for (const k of citeKeys(rec)) expect(REFS[k], `${k} missing from REFS`).toBeTruthy();
  });
});
