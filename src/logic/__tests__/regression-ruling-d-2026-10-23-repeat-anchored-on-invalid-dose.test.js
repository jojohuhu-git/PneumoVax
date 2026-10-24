// ─────────────────────────────────────────────────────────────────────────
// RULING D (owner, 2026-10-23) — the advised repeat dose is spaced from the
// dose the child ACTUALLY GOT, not from the last one that counted.
//
// Her words: "the repeat dose should be spaced from the invalid dose by the
// minimum interval. This should be followed."
//
// ACIP's General Best Practices, "Timing and Spacing of Immunobiologics",
// read live 2026-10-23: "The repeat dose should be spaced after the invalid
// dose by the recommended minimum interval (Table 3-2)." The page names its
// per-vaccine exceptions and hepatitis B is the only one that anchors on the
// VALID dose instead; pneumococcal appears four times on that page and not
// once about repeat or invalid doses. So the general rule governs here.
//
// ── THE FAULT, measured on `main` at 9da398d ────────────────────────────
//
// A 7-month-old, born 2026-03-23, seen 2026-10-23:
//
//   PCV20 2026-07-23  (age 4.0mo)  valid, dose 1
//   PCV20 2026-09-21  (age 6.0mo)  valid, dose 2
//   PCV20 2026-10-12  (age 6.6mo)  INVALID — 21 days after dose 2, and CDC's
//                                  minimum for dose 3 is 4 weeks
//
// The recorded-dose chip already tells the clinician the dose did not count.
// The rec card then advised the next dose for 2026-11-16 — which is dose 2
// (2026-09-21) plus 8 weeks. The dose the child actually received on 2026-10-12
// had no effect on the advice at all.
//
// The sharpest way to see it: hold the two valid doses fixed and move ONLY the
// invalid dose. On pre-fix code all three of these advise the SAME date.
//
//   invalid dose 2026-09-28  ->  advised 2026-11-16
//   invalid dose 2026-10-05  ->  advised 2026-11-16
//   invalid dose 2026-10-12  ->  advised 2026-11-16
//
// A clinician reading that is told to bring back on the same day whether the
// mistimed shot was given two weeks ago or six.
//
// ── WHAT MOVES, AND WHAT DELIBERATELY DOES NOT ──────────────────────────
//
// The anchor DATE and the series POSITION are different questions, and the
// validator already answers them separately — `DOSE_INTERVAL_RULES`'
// CHILD-PCV-AFTER-PCV takes `ageAtPrevDose` from the anchor (which may be an
// invalid dose: see `freshStreamState`'s `prev`) while taking `doseNumber`
// from the KEPT list, "because that is how CDC's catch-up table counts them:
// a PCV7, or a dose already rejected for spacing, is not a 'previous dose'
// these cells are about."
//
// The advice side now mirrors that exactly, which is the point rather than a
// detail — the P0 bug fixed earlier the same day was the two sides holding
// separate readings of one table. So:
//
//   MOVES   the anchor date, and the age at that anchor dose (they are one
//           dose and must never name two: see `summarizePcv`'s own invariant)
//   STAYS   the dose number, the series total, `anyDoseBefore12` — all counted
//           from doses that COUNTED
//   STAYS   PCV7, which never anchors: "a properly given dose of a superseded
//           product rather than a mistimed one, and no source states an
//           interval from it"
//   STAYS   every cross-stream interval (PPSV23 measured from a PCV, and the
//           5-year rows), which ANCHOR-1 keys on COUNTING doses in both
//           directions — the owner's "an unnecessary dose cannot reset a
//           clock". Ruling D is about repeating the mistimed dose, not about
//           a different vaccine that follows it.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';

const TODAY = '2026-10-23';
const DOB = '2026-03-23'; // 7 months old on TODAY

function patient(invalidDoseDate) {
  const pcvDoses = [
    { product: 'PCV20', date: '2026-07-23' },
    { product: 'PCV20', date: '2026-09-21' },
    { product: 'PCV20', date: invalidDoseDate },
  ];
  return {
    dob: DOB, ageMonths: 7, pcvDoses, ppsv23Doses: [], riskIds: [], today: TODAY,
  };
}

const pcvCard = (out) => (out.recs || []).find((r) => r.vaccine === 'PCV');

describe('RULING D — the advised repeat is measured from the invalid dose', () => {
  it('the third dose really is rejected, so the fixture tests what it claims to', () => {
    const a = analyzeBoth({
      pcvDoses: patient('2026-10-12').pcvDoses,
      ppsv23Doses: [], ageMonths: 7, today: TODAY, dob: DOB, riskIds: [],
    });
    expect(a.pcv.perDose.map((d) => d.status)).toEqual(['valid', 'valid', 'invalid']);
    // Two doses count; the series position below is built from these.
    expect(a.pcv.effective.map((d) => d.date)).toEqual(['2026-07-23', '2026-09-21']);
  });

  it('advises 8 weeks after the dose the child GOT, not after the last valid one', () => {
    const out = recommend(patient('2026-10-12'));
    const card = pcvCard(out);
    // 2026-10-12 + 8 weeks. Pre-fix this was 2026-11-16 (2026-09-21 + 8 weeks).
    expect(card.earliestNextDate).toBe('2026-12-07');
    expect(card.dueToday).toBe(false);
  });

  it('moving ONLY the invalid dose moves the advice — it did not before', () => {
    const advised = ['2026-09-28', '2026-10-05', '2026-10-12']
      .map((d) => pcvCard(recommend(patient(d))).earliestNextDate);
    // Pre-fix: ['2026-11-16', '2026-11-16', '2026-11-16'] — all three identical.
    expect(advised).toEqual(['2026-11-23', '2026-11-30', '2026-12-07']);
    expect(new Set(advised).size).toBe(3);
  });

  it('the interval KEY names the same dose as the anchor DATE, not the last valid one', () => {
    // The clause with no intention-revealing guard of its own until this test:
    // reverting `ageAtPrevDose` to `pcv.lastAgeAtDose` while leaving the date
    // moved was caught ONLY by the committed corpora, which get regenerated.
    // `summarizePcv`'s invariant is that a key and a date never name two
    // different doses, so it is asserted here directly.
    //
    // This child is built so the two candidate anchors straddle a Table 2
    // band boundary, which is the only way the key is observable at all:
    //
    //   2026-09-20  age 6.93 months  ->  "<7 months"    ->  4 weeks
    //   2026-09-27  age 7.13 months  ->  "7-11 months"  ->  8 weeks   INVALID
    //
    // Keying on the last VALID dose gives 28 days and 2026-11-15; keying on
    // the dose she actually got gives 56 and 2026-11-22.
    const out = recommend({
      dob: '2026-02-23', ageMonths: 8, today: TODAY,
      pcvDoses: [
        { product: 'PCV20', date: '2026-05-23' },
        { product: 'PCV20', date: '2026-09-20' },
        { product: 'PCV20', date: '2026-09-27' },
      ],
      ppsv23Doses: [], riskIds: [],
    });
    const card = pcvCard(out);
    expect(card.minIntervalDays).toBe(56);
    expect(card.earliestNextDate).toBe('2026-11-22');
  });

  it('a dose the patient never had does NOT anchor — record problems are excluded', () => {
    // The mirror of the rule above, and the reason it is not simply "every
    // dose on record anchors". A dose dated in the FUTURE has not been given;
    // one dated before birth never was. CDC repeats a mistimed dose from where
    // it was given, which presupposes it was given.
    //
    // Pre-fix this advised 2027-12-18 — a date read out of a dose nobody gave,
    // printed on the same screen as a chip telling the clinician the date is
    // in the future and to correct it. 813 rows of the record-problem corpus.
    const out = recommend({
      dob: '2025-10-23', ageMonths: 12, today: TODAY,
      pcvDoses: [
        { product: 'PCV13', date: '2025-10-23' }, // at birth: invalid for AGE, but GIVEN
        { product: 'PCV20', date: '2027-10-23' }, // a year in the FUTURE: never given
      ],
      ppsv23Doses: [], riskIds: [],
    });
    const future = out.perDose.pcv.find((d) => d.recordProblem === 'future');
    expect(future).toBeTruthy();
    const card = pcvCard(out);
    expect(card.earliestNextDate).not.toBe('2027-12-18');
    // The birth dose WAS given, so it still anchors — and its interval lapsed
    // a year ago, which is why this reads as due rather than as "no anchor".
    expect(card.dueToday).toBe(true);
  });

  it('PCV7 never anchors, even though it is on the record', () => {
    // PCV7 is set aside as a superseded PRODUCT, not as a mistimed dose, and
    // no source states an interval from it. It must not become an anchor by
    // way of this change.
    const withPcv7 = recommend({
      dob: DOB, ageMonths: 7, today: TODAY,
      pcvDoses: [
        { product: 'PCV20', date: '2026-07-23' },
        { product: 'PCV7', date: '2026-10-12' },
      ],
      ppsv23Doses: [], riskIds: [],
    });
    const withoutIt = recommend({
      dob: DOB, ageMonths: 7, today: TODAY,
      pcvDoses: [{ product: 'PCV20', date: '2026-07-23' }],
      ppsv23Doses: [], riskIds: [],
    });
    expect(pcvCard(withPcv7).earliestNextDate).toBe(pcvCard(withoutIt).earliestNextDate);
    expect(pcvCard(withPcv7).dueToday).toBe(pcvCard(withoutIt).dueToday);
  });

  it('a patient with NO rejected dose is untouched — the control', () => {
    // 0 of the 11,082 purpose-built patients without a rejected dose moved.
    // This is the one assertion that would catch the anchor being redefined
    // for everybody rather than for the mistimed case.
    const out = recommend({
      dob: DOB, ageMonths: 7, today: TODAY,
      pcvDoses: [
        { product: 'PCV20', date: '2026-07-23' },
        { product: 'PCV20', date: '2026-09-21' },
      ],
      ppsv23Doses: [], riskIds: [],
    });
    const card = pcvCard(out);
    // 2026-09-21 + 8 weeks, exactly as on main: the last dose counted, so the
    // anchor and the last VALID dose are the same date.
    expect(card.earliestNextDate).toBe('2026-11-16');
  });

  it('THE THIRD SURFACE: the recorded-dose chip agrees with the card', () => {
    // Found by driving the running app, not by the suite. The rec card said
    // "Not yet due — eligible Dec 7, 2026" while the chip immediately below it
    // said "the next dose in this series is due on or after 2026-10-15" — the
    // last VALID dose plus the gap. Two dates for one dose on one screen, the
    // shape of the P0 bug fixed the same morning.
    //
    // `earliestValidDate` keeps its own meaning (when THIS dose would have
    // been valid) and its corpus column; the sentence now spends the new
    // `repeatDueDate` instead.
    const a = analyzeBoth({
      pcvDoses: patient('2026-10-12').pcvDoses,
      ppsv23Doses: [], ageMonths: 7, today: TODAY, dob: DOB, riskIds: [],
    });
    const rejected = a.pcv.perDose[2];
    expect(rejected.status).toBe('invalid');
    // When this dose would have counted: 2026-09-21 + 28 - 4 days of grace.
    expect(rejected.earliestValidDate).toBe('2026-10-15');
    // When its REPEAT may be given: 2026-10-12 + 28 - 4.
    expect(rejected.repeatDueDate).toBe('2026-11-05');
    const sentence = rejected.reasons.find((r) => /next dose in this series/.test(r));
    expect(sentence).toContain('2026-11-05');
    expect(sentence).not.toContain('2026-10-15');
    // And the card's advised date is never EARLIER than the floor the chip states.
    expect(pcvCard(recommend(patient('2026-10-12'))).earliestNextDate >= '2026-11-05').toBe(true);
  });

  it('the series POSITION is still counted from doses that counted', () => {
    const card = pcvCard(recommend(patient('2026-10-12')));
    // Three doses on record, two of them counting, so the next is dose 3 —
    // the rejected dose must not advance the number.
    expect(card.doseLabel).toContain('dose 3');
  });
});
