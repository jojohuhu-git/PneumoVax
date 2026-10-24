// ─────────────────────────────────────────────────────────────────────────
// C10-2 (2026-10-23) — the app RECOMMENDS the routine date and COMMENTS the
// shortest interval, instead of advising the bare minimum as if it were the
// plan.
//
// THE FAULT. `pcvInfant` had exactly one number for the next dose: CDC
// Catch-up Table 2's minimum interval. It then printed that number as the
// advice — "The next dose is due 4 weeks after the most recent one" — and set
// `dueToday` from it. A minimum interval is the earliest a dose may be given
// and still count; it is not when a clinician should bring the child back. The
// two coincide only for a child who is behind.
//
// Measured on the owner's own worked patient F (healthy, 4 months old, PCV20
// at 2.0 and 3.0 months) on `main` at 59d40d2:
//
//   doseLabel        : PCV dose 3 of 4
//   dueToday         : true          <- advises the third dose TODAY, at 4 months
//   minIntervalDays  : 28
//   detail           : "The next dose is due 4 weeks after the most recent one"
//
// CDC's routine series is "2, 4, 6, and 12–15 months" — the page the very same
// card quotes. Dose 3 belongs at 6 months. The 4-week minimum is why a dose
// given today would still COUNT, which is a different question.
//
// ── THE TWO OWNER RULINGS THIS IMPLEMENTS (2026-10-23) ──────────────────
//
// RULING A ranks the paediatric documents: CDC/ACIP schedule Notes →
// immunize.org p2016 → CDC catch-up table. The catch-up table is an adjunct,
// and CDC's own notes say so ("Always use this table in conjunction with Table
// 1 and the Notes that follow"). So where p2016 states a spacing, p2016's
// number is the ADVICE and the catch-up table's is the floor.
//
// RULING C is the limit on that: "the validity floor does NOT change. A dose
// already given is graded by the rule that applied to that dose. Only the
// *recommended* number moves." So `pcvNextDoseMinIntervalDays` is untouched
// and patient E keeps her second dose. Asserted below, because getting this
// wrong would silently re-grade doses a clinician already gave.
//
// ⚠ WHY BOTH NUMBERS GO ON THE CARD. Today's P0 fix removed a state where the
// app told a clinician to wait until one date and then silently accepted a
// dose given earlier — "the app had two numbers for one dose". Rulings A and C
// together deliberately re-create two numbers (advise 8 weeks, accept 4), so
// the card must STATE the minimum rather than hide it. A recommendation the
// reader can see is not the P0 bug; an invisible one is. That is the whole
// point of the "can be given from" clause asserted here.
//
// Every Table 1 catch-up row states EIGHT weeks — all eight of them, read off
// the quotes C10-1 transcribed from the PDF on 2026-10-23. So the recommended
// spacing needs no per-row table: it is 8 weeks for every child a Table 1
// catch-up row governs, which is ages 7-23 months.
//
// ⚠ AND NOT IN THE 2-6-MONTH BAND, which is the one band with no Table 1 row
// because CDC's routine sentence covers it. p2016 does not state a spacing
// there — its 2-6-month rows read "4 doses ... last dose at age 12-15 months",
// and C7's reading of the PDF recorded that p2016 "never prints the 2/4/6
// months". So that band is advised by CDC's routine AGES, and once those have
// passed by the minimum, which CDC's catch-up table does state. The first draft
// applied 8 weeks everywhere and `regression-p1-0-recorded-dose-intervals`
// caught it — a number no document on the card said.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import {
  pcvNextDoseMinIntervalDays,
  PCV_MIN_INTERVAL_DAYS_UNDER_12M,
  PCV_MIN_INTERVAL_DAYS_FROM_12M,
} from '../intervals.js';

const TODAY = '2026-06-07';

function dobForAgeMonths(am) {
  const d = new Date(TODAY);
  d.setMonth(d.getMonth() - Math.floor(am));
  if (am % 1) d.setDate(d.getDate() - Math.round((am % 1) * 30));
  return d.toISOString().slice(0, 10);
}
function doseAtAge(dob, am) {
  const d = new Date(dob);
  d.setMonth(d.getMonth() + Math.floor(am));
  if (am % 1) d.setDate(d.getDate() + Math.round((am % 1) * 30));
  return { product: 'PCV20', date: d.toISOString().slice(0, 10) };
}
/** The whole engine result plus its PCV card, for a healthy child. */
function run(ageNow, doseAges, riskIds = []) {
  const dob = dobForAgeMonths(ageNow);
  const out = recommend({
    ageMonths: ageNow,
    dob,
    riskIds,
    pcvDoses: doseAges.map((a) => doseAtAge(dob, a)),
    ppsv23Doses: [],
    today: TODAY,
  });
  const card = (out.recs ?? []).find((r) => r.vaccine === 'PCV') ?? (out.recs ?? [])[0];
  return { out, card, dob };
}
/** Everything a clinician reads on the card, as one string. */
function noteTextOf(card) {
  const n = card?.note ?? {};
  return [n.lead, ...(n.bullets ?? []), n.detail].filter(Boolean).join(' ');
}

describe('C10-2 — the recommended date is the routine one, the minimum is commented', () => {
  // ── The owner's worked patient F: the case the rulings were decided on ──
  it('patient F: a 4-month-old with doses at 2 and 3 months is due at 6 months, not today', () => {
    const { card } = run(4, [2.0, 3.0]);
    expect(card.doseLabel).toBe('PCV dose 3 of 4');
    // The fault: the app advised the third dose TODAY, at 4 months old.
    expect(card.dueToday).toBe(false);
    // CDC's routine series puts dose 3 at 6 months; the child is 4 months now.
    expect(card.earliestNextDate).not.toBeNull();
    const dueAgeMonths = Math.round(
      (new Date(card.earliestNextDate) - new Date(dobForAgeMonths(4))) / (1000 * 60 * 60 * 24 * 30.4375),
    );
    expect(dueAgeMonths).toBe(6);
  });

  it('patient F: the card still TELLS the clinician the 4-week minimum', () => {
    const { card } = run(4, [2.0, 3.0]);
    const note = noteTextOf(card);
    // Ruling C leaves the floor at 4 weeks, so the card must say so -- an
    // unstated second number is the P0 bug this must not re-create.
    expect(card.minIntervalDays).toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M);
    expect(note).toMatch(/minimum interval of 4 weeks/);
    // Her 4-week minimum fell four days before the visit, so the useful
    // sentence is "today" rather than a date already in the past. Either
    // phrasing is accepted here; what must hold is that the earlier option is
    // OFFERED, which is the half that keeps this from being the P0 bug.
    expect(note).toMatch(/it can be given (today|from \d{4}-\d{2}-\d{2}) if needed/);
  });

  // ── Patient D: the interval p2016 states, not the catch-up table's ──────
  it('patient D: a 15-month-old whose only dose was at 3 months is advised 8 weeks, not 4', () => {
    const { card } = run(15, [3]);
    expect(card.doseLabel).toBe('PCV dose 2 of 3');
    const note = noteTextOf(card);
    // p2016 Table 1, "1 before age 12 months": "1 dose at least 8 weeks after
    // most recent dose". CDC Catch-up Table 2's dose 1->2 cell says 4 weeks,
    // because it keys on the age at the FIRST dose and never looks at how old
    // the child is now. Ruling A puts p2016 above the catch-up table.
    expect(note).toMatch(/8 weeks after the most recent/);
    expect(note).not.toMatch(/due 4 weeks after the most recent/);
    // She is a year overdue either way, so the DATE does not move -- only the
    // number a clinician reads. Recorded so a later change cannot quietly turn
    // this into a date change.
    expect(card.dueToday).toBe(true);
  });

  // ── RULING C: the floor does not move. Three ways of asserting it. ──────
  it('patient E keeps both doses — the validity floor is untouched (ruling C)', () => {
    // 15 months, PCV20 at 11 and 12.5 months: a 6-week gap. Valid under CDC
    // Table 2 (previous dose at 11 months, under 12, so 4 weeks). Under
    // p2016's footnote, keyed on the child's age NOW, it would need 8 weeks
    // and would be REJECTED. Ruling C says she keeps it.
    const { out, card } = run(15, [11, 12.5]);
    expect(out.perDose.pcv.map((d) => d.status)).toEqual(['valid', 'valid']);
    expect(card.doseLabel).toBe('PCV dose 3 of 3');
    expect(card.dueToday).toBe(true);
  });

  it('the minimum-interval function still returns CDC Catch-up Table 2, cell for cell', () => {
    // Ruling C in its purest form: this is the floor's own number, and C10-2
    // must not have touched it. Three cells, one per branch.
    expect(pcvNextDoseMinIntervalDays({
      doseNumber: 2, ageAtPrevDose: 3, currentAgeMonths: 15, anyDoseBefore12: true,
    })).toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M);          // patient D's cell: 4 weeks
    expect(pcvNextDoseMinIntervalDays({
      doseNumber: 3, ageAtPrevDose: 3, currentAgeMonths: 4, anyDoseBefore12: true,
    })).toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M);          // patient F's cell: 4 weeks
    expect(pcvNextDoseMinIntervalDays({
      doseNumber: 3, ageAtPrevDose: 9, currentAgeMonths: 11, anyDoseBefore12: true,
    })).toBe(PCV_MIN_INTERVAL_DAYS_FROM_12M);           // patient G's cell: 8 weeks
  });

  // ── The two patients the owner marked "already correct" must not move ───
  it('patient F+ is unchanged — four infant doses, booster held to 12 months', () => {
    const { card } = run(6, [2.0, 3.0, 4.0]);
    expect(card.doseLabel).toBe('PCV dose 4 of 4');
    expect(card.dueToday).toBe(false);
    expect(card.minIntervalDays).toBe(PCV_MIN_INTERVAL_DAYS_FROM_12M);
    expect(noteTextOf(card)).toMatch(/not due until the patient reaches 12 months/);
  });

  it('patient G is unchanged — 11 months, doses at 2 and 9, held to 12 months', () => {
    const { card } = run(11, [2, 9]);
    expect(card.doseLabel).toBe('PCV dose 3 of 3');
    expect(card.dueToday).toBe(false);
    expect(card.minIntervalDays).toBe(PCV_MIN_INTERVAL_DAYS_FROM_12M);
  });

  // ── The shape of the "genuinely behind" fallback (the owner's open point) ──
  it('a child genuinely behind falls back to the minimum — no routine date is left', () => {
    // First dose at 9 months, now 10 months. Her routine ages (2, 4, 6) are
    // all in the past, so there is no routine date to recommend and the
    // honest answer is the minimum interval. This is the fallback shape the
    // handoff asked to be decided: recommend the LATER of the routine date and
    // the minimum date, which collapses to the minimum once the routine date
    // has passed.
    const { card } = run(10, [9]);
    // Her FLOOR is 4 weeks, not 8: CDC Catch-up Table 2's dose 1→2 cell keys on
    // the age at the first dose ("before the 1st birthday"), and hers was at 9
    // months. The first draft of this test asserted 8 weeks here and the engine
    // was right — recorded because the two numbers are easy to swap.
    expect(card.minIntervalDays).toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M);
    // But the ADVICE is p2016's 8 weeks (Table 1, "1 at age 7 months or older:
    // 1 dose 8 weeks after most recent doses"), so the two differ for her and
    // the card must carry both.
    const note = noteTextOf(card);
    expect(note).toMatch(/8 weeks after the most recent/);
    expect(note).toMatch(/minimum interval of 4 weeks/);
    // Nothing is advised EARLIER than the minimum allows, at any age.
    if (card.earliestNextDate) {
      expect(card.earliestNextDate >= TODAY).toBe(true);
    }
  });

  it('no card ever advises a date earlier than its own stated minimum', () => {
    // The invariant behind the whole item, swept over the infant range rather
    // than asserted on one patient: the recommendation may be LATER than the
    // minimum, never earlier. A fix that moved the floor instead of the advice
    // would pass every test above and fail this one.
    const ages = [2, 3, 4, 5, 6, 7, 9, 11, 12, 15, 18, 23];
    const histories = [[], [2], [2, 3], [2, 4], [2, 4, 6], [3], [9], [11, 12.5]];
    let checked = 0;
    for (const age of ages) {
      for (const hist of histories) {
        if (hist.some((h) => h >= age)) continue;       // a dose cannot predate the visit
        const { card } = run(age, hist);
        if (!card || card.vaccine !== 'PCV') continue;
        if (!card.earliestNextDate || !card.minIntervalDays) continue;
        const anchorAge = hist.length ? Math.max(...hist) : null;
        if (anchorAge == null) continue;
        const minDate = new Date(doseAtAge(dobForAgeMonths(age), anchorAge).date);
        minDate.setDate(minDate.getDate() + card.minIntervalDays);
        expect(new Date(card.earliestNextDate) >= minDate).toBe(true);
        checked++;
      }
    }
    // Pinned at the measured number, not a guess. Before the fix this was
    // ZERO — no infant card advised a future date at all, because every one of
    // them read its floor out as the plan — so the count is itself the
    // evidence the change took effect. It is small because most of these
    // histories leave the child overdue, where advice and floor coincide.
    expect(checked).toBe(4);
  });
});
