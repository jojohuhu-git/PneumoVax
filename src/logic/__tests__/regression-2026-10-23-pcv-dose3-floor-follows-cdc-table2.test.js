// THE APP HAD TWO DIFFERENT NUMBERS FOR ONE DOSE (owner decision, 2026-10-23).
//
// Shown a 15-month-old with asplenia whose three PCV20 doses came at 10.4, 11.3
// and 12.2 months — every gap 28 days — the owner answered:
//
//   "This child started PCV in the 7-11 month window (dose at 10 mo), so an
//    age-appropriate series requires a dose at >=12 months given >=8 weeks
//    after the preceding dose. Her 12-month dose was given only ~4 weeks after
//    the 11-month dose, so it does not satisfy the required interval and does
//    not count. She needs 1 additional dose of PCV20 at >=12 months of age ...
//    she is 15 months now, so it can be given today."
//
// The app accepted all three, called the series complete, and said nothing.
// Worse, it had already told the clinician the opposite: asked about that same
// child at 12 months holding only the first two doses, it answers "the next
// dose is due 8 weeks after the most recent one" and sets the earliest date at
// 2026-08-15 — then accepted the dose given on 2026-07-18.
//
// WHY the two disagreed. `pcvSeriesMinIntervalDays(ageAtPrevDose)` graded the
// gap (4 weeks whenever the earlier dose was under 12 months), while
// `pcvNextDoseMinIntervalDays` — which IS CDC's Catch-up Table 2, cell by cell
// — advised the next one. `intervals.js` named the divergence in writing and
// left it standing, because owner decision 2 of 2026-10-11 had kept the floor
// permissive so that "nothing a clinician already did is retroactively
// invalidated". CDSI v4.64 supported that reading: its absolute minimum for
// this dose is "4 weeks - 4 days" = 24 days, so 28 days clears it.
//
// Shown the contradiction and the counts — 220 recorded doses accepted that CDC
// Table 2 would not, 88 of those children told "complete" — she chose the
// strict floor, with a proviso:
//
//   "1 - but I want to make sure that if a later dose given helps correct the
//    mistake in giving a vaccine early, this should be noted and marked as
//    complete if appropriate."
//
// So this file asserts BOTH halves: the early dose stops counting, AND a later
// dose that repairs the series is recognised rather than leaving the child
// permanently short.
//
// THE SOURCE, fetched live 2026-10-23 — CDC Catch-up Immunization Schedule,
// pneumococcal conjugate row, column "Minimum Interval Between Doses":
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html
//   Dose 2 to Dose 3: "4 weeks if current age is younger than 12 months and
//     previous dose was administered at <7 months old" / "8 weeks (as final
//     dose for healthy children) if previous dose was administered between
//     7-11 months (wait until at least 12 months old); OR if current age is 12
//     months or older and at least 1 dose was administered before age 12
//     months"
//
// ONE HOME. The fix is not a second reading of that cell: the floor now calls
// the same `pcvNextDoseMinIntervalDays` the scheduler calls, so the number the
// app advises and the number it grades by cannot drift apart again. That is
// what makes the contradiction above unrepeatable rather than merely fixed.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { daysBetween } from '../dateUtils.js';
import { GRACE_DAYS } from '../intervals.js';

/** The owner's patient, exactly as she described her. */
const OWNERS_CHILD = {
  ageMonths: 15,
  dob: '2025-07-11',
  today: '2026-10-11',
  riskIds: ['asplenia'],
  pcvDoses: [
    { product: 'PCV20', date: '2026-05-23' },   // age 10.4 mo
    { product: 'PCV20', date: '2026-06-20' },   // age 11.3 mo, 28 days later
    { product: 'PCV20', date: '2026-07-18' },   // age 12.2 mo, 28 days later
  ],
  ppsv23Doses: [],
};

const verdicts = (res) => (res.orderedDoses?.pcv ?? [])
  .map((d, i) => ({ date: d.date, status: res.perDose?.pcv?.[i]?.status,
    reasons: res.perDose?.pcv?.[i]?.reasons ?? [],
    earliestValidDate: res.perDose?.pcv?.[i]?.earliestValidDate }));

const noteOf = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

describe('a 3rd PCV dose after a dose given at 7-11 months needs 8 weeks', () => {
  it("rejects the owner's child's 12-month dose, which came 4 weeks after an 11-month dose", () => {
    const res = recommend(OWNERS_CHILD);
    const v = verdicts(res);
    expect(v.map((x) => x.status)).toEqual(['valid', 'valid', 'invalid']);
    // The first two are untouched: dose 1 -> dose 2 is 4 weeks when the first
    // dose was before the first birthday, which is what CDC's cell says and
    // what this child had.
    expect(v[2].reasons.join(' ')).toMatch(/8 weeks/);
    // Named as a timing rejection, so the dose is not "repeated" — the next
    // dose in the series is simply due once the interval has run.
    expect(v[2].reasons.join(' ')).toMatch(/does not count toward the series/);
    expect(v[2].reasons.join(' ')).not.toMatch(/repeat this dose/i);
    // 8 weeks after the dose it is measured from (2026-06-20), less CDC's
    // 4-day grace — which is what `earliestValidDate` has always meant: the
    // earliest date this dose COULD have validly been given. 2026-06-20 + 56
    // days = 2026-08-15; minus 4 = 2026-08-11.
    expect(v[2].earliestValidDate).toBe('2026-08-11');
  });

  it('then offers her the one further dose, today, as the owner said', () => {
    const res = recommend(OWNERS_CHILD);
    // Two counting doses of a 3-dose series begun at 7-11 months, so one is
    // still owed; she is 15 months old, past both the >=12-month floor and the
    // 8 weeks from 2026-06-20, so it is due now.
    const due = (res.recs ?? []).filter((r) => r.vaccine === 'PCV' && r.status !== 'complete');
    expect(due.length).toBeGreaterThan(0);
    expect(due[0].doseLabel).toBe('PCV dose 3 of 3');
    expect(due[0].dueToday).toBe(true);
    // And it must NOT say the series is complete.
    expect((res.recs ?? []).some((r) => r.status === 'complete')).toBe(false);
  });

  it("recognises the repair: a later, properly spaced dose completes the series", () => {
    // THE OWNER'S PROVISO. Same child, who then receives the dose the card
    // asked for. The rejected dose stays rejected and stays visible, but the
    // series is complete — she is not left permanently short because of it.
    const repaired = recommend({
      ...OWNERS_CHILD,
      pcvDoses: [...OWNERS_CHILD.pcvDoses, { product: 'PCV20', date: '2026-10-11' }],
    });
    const v = verdicts(repaired);
    expect(v.map((x) => x.status)).toEqual(['valid', 'valid', 'invalid', 'valid']);
    const complete = (repaired.recs ?? []).filter((r) => r.status === 'complete');
    expect(complete.length).toBeGreaterThan(0);
    // The rejected dose is still on the record with its explanation — "noted",
    // as she asked — rather than quietly dropped once the series is finished.
    expect(v[2].reasons.join(' ')).toMatch(/does not count toward the series/);
  });

  it('leaves the dose-1-to-dose-2 cell alone, where 4 weeks is what CDC states', () => {
    // Anti-overreach. CDC's Dose 1 to Dose 2 cell is "4 weeks if first dose was
    // administered before the 1st birthday", and this child's second dose is 28
    // days after a first dose at 10.4 months. Making the third dose stricter
    // must not make the second one stricter too.
    const twoDoses = recommend({
      ...OWNERS_CHILD,
      ageMonths: 12,
      today: '2026-07-01',
      pcvDoses: OWNERS_CHILD.pcvDoses.slice(0, 2),
    });
    expect(verdicts(twoDoses).map((x) => x.status)).toEqual(['valid', 'valid']);
  });

  it('still accepts 4 weeks for a dose 3 whose previous dose was before 7 months', () => {
    // The other clause of the same cell: "4 weeks if current age is younger
    // than 12 months and previous dose was administered at <7 months old".
    // A routine infant at 2, 3 and 4 months is inside it.
    const infant = recommend({
      ageMonths: 5, dob: '2026-05-11', today: '2026-10-11', riskIds: [],
      pcvDoses: [
        { product: 'PCV20', date: '2026-07-18' },   // 2.2 mo
        { product: 'PCV20', date: '2026-08-15' },   // 3.1 mo, 28 days
        { product: 'PCV20', date: '2026-09-12' },   // 4.0 mo, 28 days
      ],
      ppsv23Doses: [],
    });
    expect(verdicts(infant).map((x) => x.status)).toEqual(['valid', 'valid', 'valid']);
  });

  it("counts an EXTRA infant dose, which is not the booster — the owner's 6-month-old", () => {
    // OWNER RULING 2026-10-23. A first pass at this fix made the floor CDC
    // Table 2 wholesale, including its flat "8 weeks (as final dose)" for dose
    // 4 — and rejected 132 valid doses, 132 patients beyond the 220 the owner
    // had priced. Shown this child she ruled the other way, and said why:
    //
    //   "The 5.1-month dose does not count as the 4th (booster) dose. Treat it
    //    as an extra infant dose. ... No interval can turn a 5-month dose into
    //    the 4th dose, because the booster is defined by age, not by how many
    //    doses came before it. ... Record the 5.1-month dose as extra. It isn't
    //    harmful and it isn't counted toward completion. Nothing needs to be
    //    repeated or restarted."
    //
    // So the dose is VALID (4 weeks is the infant minimum) and the child still
    // owes the booster. Both halves are asserted, because enforcing only the
    // first is what the rejected first pass did.
    const extraInfantDose = recommend({
      ageMonths: 6, dob: '2026-03-11', today: '2026-09-11', riskIds: [],
      pcvDoses: [
        { product: 'PCV20', date: '2026-05-23' },   // 2.4 mo
        { product: 'PCV20', date: '2026-06-20' },   // 3.3 mo, 28 days
        { product: 'PCV20', date: '2026-07-18' },   // 4.2 mo, 28 days
        { product: 'PCV20', date: '2026-08-15' },   // 5.1 mo, 28 days — the extra
      ],
      ppsv23Doses: [],
    });
    expect(verdicts(extraInfantDose).map((x) => x.status))
      .toEqual(['valid', 'valid', 'valid', 'valid']);
    // Not complete: the booster is still owed, and not until 12 months.
    const rec = (extraInfantDose.recs ?? []).find((r) => r.vaccine === 'PCV');
    expect(rec.status).not.toBe('complete');
    expect(rec.dueToday).toBe(false);
    expect(noteOf(rec)).toMatch(/booster/);
    // And the dose it is holding back owes EIGHT weeks, not four — the booster
    // will be given at >=12 months, whatever the child's age today. This is the
    // assertion that fails if `ageAtThisDose` is fed the patient's current age.
    expect(rec.minIntervalDays).toBe(56);
  });

  it('the app advises and grades by the same interval, differing only by the grace', () => {
    // THE CONTRADICTION ITSELF, asserted directly. Before the fix the app
    // advised 2026-08-15 for this dose and then accepted it on 2026-07-18 —
    // 28 days short — in silence.
    //
    // The two dates are not identical and should not be: the advised date is
    // the full 8 weeks, and the graded one allows CDC's 4 days of grace ("doses
    // up to 4 days early still count"). What must hold is that they rest on the
    // SAME interval, which is now the same function. Asserting the gap IS the
    // grace catches a future drift in either direction; asserting equality
    // would have failed on correct behaviour.
    const beforeTheDose = recommend({
      ...OWNERS_CHILD,
      ageMonths: 12,
      today: '2026-07-20',
      pcvDoses: OWNERS_CHILD.pcvDoses.slice(0, 2),
    });
    const advised = (beforeTheDose.recs ?? []).find((r) => r.vaccine === 'PCV');
    expect(advised.earliestNextDate).toBe('2026-08-15');
    expect(advised.minIntervalDays).toBe(56);
    expect(noteOf(advised)).toMatch(/8 weeks/);

    const graded = recommend(OWNERS_CHILD);
    const earliest = verdicts(graded)[2].earliestValidDate;
    expect(earliest).toBe('2026-08-11');
    expect(daysBetween(earliest, advised.earliestNextDate)).toBe(GRACE_DAYS);
  });
});
