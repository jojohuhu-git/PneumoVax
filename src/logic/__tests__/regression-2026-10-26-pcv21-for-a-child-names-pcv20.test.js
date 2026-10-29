// 2026-10-26 — a PCV21 recorded for a child is told to give PCV20, not to
// repeat the PCV21.
//
// Her children's table: PCV21 under 18 is "rejected correctly; wording says
// 'repeat this dose' where it should name PCV20."
//
// ── The defect: the chip contradicted itself ─────────────────────────────
//
// A 10-year-old with a PCV21 on her record read, in two sentences on one chip:
//
//   "PCV21 (Capvaxive) is licensed for adults >=18 years only. This dose was
//    given at ~10y 1m - it does not count."
//   "This dose does not count toward the series - repeat this dose only (do
//    not restart the series)."
//
// Repeating it means giving her another PCV21, which the sentence above has
// just said is not licensed for her. Every repeat would be rejected again for
// the same reason. The verdict was right; the advice under it was unusable.
//
// ── Why it is a third sentence and not one of the two that existed ───────
//
// W1 (2026-10-11) split invalid doses in two: one rejected only for TIMING was
// never missing, so it takes "the next dose can be given from ..."; every
// other invalid dose IS missing and keeps "repeat this dose only". A PCV21 in
// a child is genuinely missing - she still needs a conjugate - but she needs a
// DIFFERENT one, so neither sentence fits.
//
// The branch keys on a FIELD the validator sets (`remedyProduct`), never on
// matching the text of a sentence built elsewhere - the coupling `walk()`'s
// own comment warns about.
//
// Scope: PCV20 is named because her row names it. PCV15 is also licensed for
// children, and the four other rows of her table that say the remedy is PCV20
// rather than another dose of the same vaccine are a separate queue item (P3)
// that this does not build.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-25';
const REPEAT = /repeat this dose only/i;
const GIVE_PCV20 = /give a dose of PCV20 instead/i;
// The sentence an age-rejected CONJUGATE carries since OWNER DECISION
// 2026-10-29 — product-free, because the product is not what was wrong.
const ANY_APPROVED = /any PCV approved/i;
const TOO_SOON = /given too soon after the dose it is measured from/i;

/** A child of `ageMonths` with one PCV21 on record. */
const child = (ageMonths, dob, date) => recommend({
  today: TODAY, dob, ageMonths, riskIds: ['asplenia'],
  pcvDoses: [date ? { product: 'PCV21', date } : { product: 'PCV21' }],
  ppsv23Doses: [],
});

const firstDose = (res) => (res.perDose?.pcv ?? [])[0];
const words = (res) => (firstDose(res).reasons ?? []).join(' ');

describe('a child given PCV21 is told to give PCV20', () => {
  // Priya, 10, asplenia, PCV21 recorded on 1 Jun 2026.
  const priya = () => child(125, '2016-05-01', '2026-06-01');

  it('still rejects the dose — the verdict is unchanged', () => {
    expect(firstDose(priya()).status).toBe('invalid');
    expect(words(priya())).toMatch(/licensed for adults ≥18 years only/);
  });

  it('names PCV20 and no longer says "repeat this dose only"', () => {
    expect(words(priya())).toMatch(GIVE_PCV20);
    expect(words(priya())).not.toMatch(REPEAT);
  });

  it('does not claim the dose was mistimed — nothing is wrong with its timing', () => {
    // The first draft reused the timing lead and produced "given too soon
    // after the dose it is measured from" on a dose with no interval problem
    // at all. Caught by driving the engine, so it is pinned here.
    expect(words(priya())).not.toMatch(TOO_SOON);
    expect(firstDose(priya()).intervalRuleId).toBeFalsy();
  });

  it('says the same for a PCV21 with no date on it', () => {
    const undated = child(125, '2016-05-01', null);
    expect(firstDose(undated).status).toBe('invalid');
    expect(words(undated)).toMatch(GIVE_PCV20);
    expect(words(undated)).not.toMatch(REPEAT);
  });

  it('holds all through childhood, from infancy to the day before 18', () => {
    const ages = [2, 12, 24, 60, 120, 180, 215];
    for (const am of ages) {
      const res = child(am, null, null);
      const d = firstDose(res);
      expect(d.status).toBe('invalid');
      expect((d.reasons ?? []).join(' ')).toMatch(GIVE_PCV20);
    }
  });
});

describe('controls — the other invalid doses keep their own sentences', () => {
  it('an 18-year-old\'s PCV21 still COUNTS and is not told to give PCV20', () => {
    // The boundary. Licensed from 18, recommended from 19: it counts, with an
    // advisory, and nothing here may turn that into a rejection.
    const res = recommend({
      today: TODAY, dob: '2008-02-01', ageMonths: 224, riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV21', date: '2026-06-01' }], ppsv23Doses: [],
    });
    const d = firstDose(res);
    expect(d.status).toBe('valid');
    expect((d.reasons ?? []).join(' ')).toMatch(/counts and does not need repeating/);
    expect((d.reasons ?? []).join(' ')).not.toMatch(GIVE_PCV20);
  });

  it('a PCV20 below the minimum age names no product at all', () => {
    // Rejected for AGE, not for product. This test used to assert "repeat this
    // dose only" here; OWNER DECISION 2026-10-29 replaced that sentence for
    // every age-rejected conjugate, because the product is not what was wrong
    // and CDC gives PCV15 and PCV20 the same 6-week minimum. The point this
    // test exists for is unchanged and still asserted: an age rejection must
    // NOT carry the PCV20 remedy sentence, which belongs to a child's PCV21.
    // See regression-2026-10-29-age-rejection-names-no-product.test.js.
    const res = recommend({
      today: TODAY, dob: '2026-09-01', ageMonths: 1, riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2026-09-20' }], ppsv23Doses: [],
    });
    const d = firstDose(res);
    expect(d.status).toBe('invalid');
    expect((d.reasons ?? []).join(' ')).toMatch(ANY_APPROVED);
    expect((d.reasons ?? []).join(' ')).not.toMatch(REPEAT);
    expect((d.reasons ?? []).join(' ')).not.toMatch(GIVE_PCV20);
  });

  it('a dose rejected for TIMING still gets the W1 "next dose" sentence', () => {
    const res = recommend({
      today: TODAY, dob: '2026-01-01', ageMonths: 9, riskIds: [],
      pcvDoses: [
        { product: 'PCV20', date: '2026-02-12' },
        { product: 'PCV20', date: '2026-02-26' },
      ],
      ppsv23Doses: [],
    });
    const second = (res.perDose?.pcv ?? [])[1];
    expect(second.status).toBe('invalid');
    expect((second.reasons ?? []).join(' ')).not.toMatch(REPEAT);
    expect((second.reasons ?? []).join(' ')).not.toMatch(GIVE_PCV20);
  });
});

describe('swept over the grid', () => {
  it('no dose anywhere carries both sentences, and PCV20 advice only ever follows a PCV21', () => {
    let pcv21Child = 0; let conjugateRepeats = 0; let ppsv23Repeats = 0;
    for (const c of buildCases()) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const [i, d] of (out.perDose?.pcv ?? []).entries()) {
        const text = (d.reasons ?? []).join(' ');
        const namesPcv20 = GIVE_PCV20.test(text);
        const saysRepeat = REPEAT.test(text);
        expect(namesPcv20 && saysRepeat).toBe(false);
        if (namesPcv20) {
          // Only ever on a PCV21 given to someone under 18.
          expect(out.orderedDoses.pcv[i].product).toBe('PCV21');
          pcv21Child += 1;
        }
        if (saysRepeat) conjugateRepeats += 1;
      }
      for (const d of out.perDose?.ppsv23 ?? []) {
        if (REPEAT.test((d.reasons ?? []).join(' '))) ppsv23Repeats += 1;
      }
    }
    // `pcv21Child` is the family this change speaks to.
    expect(pcv21Child).toBeGreaterThan(0);
    // THE CANARY MOVED, 2026-10-29, and this is why. It used to read
    // `repeats > 0` over conjugates alone, to catch the ordinary repeat advice
    // going missing. Her decision of that date deliberately took it off EVERY
    // age-rejected conjugate, so over conjugates the honest expectation is now
    // zero — asserting "> 0" there would demand wording she removed. The
    // advice itself is alive on the too-young PPSV23, where a conjugate is no
    // substitute, so the canary watches that family instead.
    expect(conjugateRepeats).toBe(0);
    expect(ppsv23Repeats).toBeGreaterThan(0);
  });
});
