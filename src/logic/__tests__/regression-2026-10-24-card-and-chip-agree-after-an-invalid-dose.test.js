// ⚠️ ITS ADULT SUBJECT WAS REMOVED BY OWNER RULING 2026-10-25, AND THIS FILE
// IS KEPT AS THE RECORD PLUS THE GUARD THAT IS STILL LIVE.
//
// What it used to hold: the card that follows an INVALID ADULT DOSE had to say
// what the dose chip said, name the right vaccine, and mark which of its
// numbers was evidence. Her adult table of 2026-10-25 removed every adult
// floor, so no adult dose is invalid any more and that card can never build.
//
// THREE THINGS SURVIVE, and they are what this file now asserts:
//
//   1. HER FOUR PATIENTS. The ones the whole question was argued over. They
//      are now complete and owed nothing, and that is pinned here so a
//      restored floor fails loudly.
//   2. THE CONTRACT ITSELF — "one date, on the card and on the chip" — which
//      is not an adult idea at all. Children keep real floors, so a child with
//      a rejected dose is where the two surfaces can still disagree, and that
//      is now where it is tested.
//   3. UNREACHABILITY, SAID OUT LOUD. `adultInvalidDoseCard` in recommend.js
//      is left in place, because it implements a ruling she may restore, but a
//      future session must not read it as live behaviour. The sweep below
//      proves it builds for nobody.
//
// ── the original finding, kept because it explains the contract ──────────
//
// Driving the app on her asplenic patient showed one screen with two answers:
// a card reading "PPSV23 (>=8 weeks after PCV15) — Not yet due, eligible Oct
// 25, 2026" directly above a chip reading "can be given from 2027-10-11". Two
// dates, two different vaccines, one patient.
//
// Her instruction for the wording, verbatim: "make it clear that the 8 week
// interval is pediatric data with nothing clarifying adults. Cite the
// reference. State using 1 year is an interpretation from ACIP minimum
// interval for adults between PCV13 and the next conjugate. Cite this too."
//
// ⚠️ THE FIRST DRAFT WAS FAR TOO BROAD and most of the original file was about
// the boundary. Fired for every adult whose last dose was invalid, it moved
// 667 of 17,016 verdicts and broke eleven citation guards, because it overrode
// cards that reason from a RICHER history with a blunter rule. Narrowed to the
// three families she actually worked through: 188 verdicts. That whole
// boundary argument is now moot — there is no adult invalid dose to narrow
// around — but it is the reason the sweep below asserts "nobody" rather than
// "the five approved rules".
//
// docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;
const run = (p) => recommend({ today: TODAY, ...p });
const invalidOf = (o) => [...o.perDose.pcv, ...o.perDose.ppsv23].filter((d) => d.status === 'invalid');

// Her four, unchanged. The dates in the comments are what each was told on
// 2026-10-24, kept so the reversal is legible.
const PATIENTS = {
  // family 2 — a conjugate after a PPSV23-only history (was: repeat 2027-06-19)
  p1: { ageMonths: Y(70), riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
  // (was: repeat 2027-09-26)
  p2: { ageMonths: Y(70), riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-09-26' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
  // family 3 — a PPSV23 after a PCV15 (was: repeat 2027-10-11)
  p3: { ageMonths: Y(60), riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
  // her asplenic patient, the 8-week row (was: repeat 2027-10-11)
  p4: { ageMonths: Y(40), riskIds: ['asplenia'], pcvDoses: [{ product: 'PCV15', date: '2026-08-30' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
};

describe('her four patients have no invalid dose left', () => {
  for (const name of Object.keys(PATIENTS)) {
    it(`${name}: nothing is set aside, so there is no second date to agree with`, () => {
      expect(invalidOf(run(PATIENTS[name]))).toHaveLength(0);
    });
  }

  it('and all four read complete', () => {
    for (const name of Object.keys(PATIENTS)) {
      expect(run(PATIENTS[name]).recs.some((r) => r.status === 'complete'), name).toBe(true);
    }
  });
});

describe('the contract itself, on the population that still has floors', () => {
  // A 5-year-old with asplenia: PCV20 on 1 Jun, PPSV23 21 days later. The
  // PPSV23 is rejected by CHILD-PPSV23-AFTER-PCV, an 8-week floor CDC states
  // in words, so this child is where the two surfaces can still disagree.
  const CHILD = {
    ageMonths: 60, riskIds: ['asplenia'],
    pcvDoses: [{ product: 'PCV20', date: '2026-06-01' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-22' }],
  };

  it('one date: the chip\'s repeat date is the card\'s eligible date', () => {
    const out = run(CHILD);
    const chip = invalidOf(out)[0];
    expect(chip).toBeDefined();
    expect(chip.repeatDueDate).toBe('2026-08-17');   // 8 weeks after the dose given

    // Whichever card is offering the next PPSV23 must not name an earlier day
    // than the chip does. That is the whole finding: two dates on one screen.
    const dates = out.recs.map((r) => r.earliestNextDate).filter(Boolean);
    for (const d of dates) expect(d >= '2026-06-22').toBe(true);
  });

  it('the chip names its date as the earliest, never as the due date', () => {
    // The 2026-10-24 ruling: the rec card is the only surface that knows the
    // routine date, so it is the only one that may state one.
    const chip = invalidOf(run(CHILD))[0];
    const text = [...(chip.reasons ?? []), chip.detail ?? ''].join(' ');
    expect(text).toMatch(/earliest|can be given from/i);
  });
});

describe('THE ADULT INVALID-DOSE CARD BUILDS FOR NOBODY', () => {
  // The sweep the original file used to run over the grid, with its assertion
  // inverted. It used to expect the card on exactly 400 patients across five
  // approved rules; it now expects it on none, because none of those rules can
  // produce an invalid dose.
  //
  // ⚠️ THE GRID CANNOT SEE THE CHANGE THAT CAUSED THIS. There are zero
  // `invalid:ADULT-` verdicts in the committed corpus — the grid's fixed
  // day-offsets never build a short adult gap — so removing every adult floor
  // moved 0 of 17,016 lines. This sweep is therefore an anti-vacuity check on
  // the OTHER side: it confirms the adult card is absent, while her four
  // patients above are the only thing pinning that it SHOULD be absent.
  it('no adult patient on the grid is shown a repeat-after-invalid-dose card', () => {
    const offenders = [];
    for (const { key, input } of buildCases()) {
      if ((input.ageMonths ?? 0) < 228) continue;
      const out = recommend(input);
      const bad = [...out.perDose.pcv, ...out.perDose.ppsv23]
        .filter((d) => d.status === 'invalid' && d.intervalRuleId?.startsWith('ADULT-'));
      if (bad.length) offenders.push(`${key} ${bad[0].intervalRuleId}`);
    }
    expect(offenders).toEqual([]);
  });
});
