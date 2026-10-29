// 2026-10-29 — OWNER DECISION. A conjugate thrown out because the patient was
// below its minimum age names NO product; the recommendation card keeps CDC's
// own PCV15-or-PCV20 choice.
//
// ── How this decision was reached, because it REVERSES one made hours earlier
//
// On 2026-10-29 the owner was asked whether a thrown-out conjugate should be
// replaced by PCV20 ("always PCV20"), and said yes. The question was put to her
// with Mia — 2, cochlear implant, PCV15 on 1 June and a second PCV15 19 days
// later — described as a patient the app tells to "repeat this dose".
//
// MIA IS NOT SUCH A PATIENT. Her dose is rejected for TIMING, and since W1
// (2026-10-11) a timing rejection reads "It is not repeated; the next dose in
// this series can be given from <date>" and names no product at all. So the
// answer was given about one family and applied to another: babies whose
// conjugate was thrown out for being given before 6 weeks of age.
//
// Shown a baby who really is affected — Ayla, PCV15 three days before she
// turned 6 weeks — the owner asked whether PCV20 is even indicated at that
// age. Fetched live from CDC on 2026-10-29:
//
//   CDC Child/Adolescent Immunization Schedule Notes, pneumococcal:
//     "(minimum age: 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23])"
//   CDC Pneumococcal Vaccine Recommendations:
//     "Administer a 4-dose PCV series (PCV15 or PCV20)"
//
// The two conjugates share one minimum age, CDC states no preference between
// them on either page, and the dose failed on AGE rather than on product. So
// nothing about Ayla's age prefers PCV20. Her decision, in her words: "only
// recommend vaccines that are approved for their age", and then "either is fine
// here". PR #95 was closed unmerged rather than landed and undone.
//
// ⚠ WHAT THIS DOES **NOT** TOUCH, and each exclusion is a separate reason:
//
//   a child's PCV21        STILL says "give a dose of PCV20 instead". PCV21 is
//                          licensed from 18 years and appears nowhere in CDC's
//                          paediatric recommendations, so repeating it would be
//                          thrown out again. This is the one case her rule
//                          genuinely selects, and it is already on `main` (#93).
//   a too-young PPSV23     STILL says "repeat this dose only". A child whose
//                          PPSV23 came at 18 months needs a PPSV23 once she is
//                          2; no conjugate substitutes for it.
//   a RECORD PROBLEM       (dated before birth, future-dated, duplicated) keeps
//                          its own wording. Those doses are not age rejections
//                          and the field is attached only at the two minimum-age
//                          call sites, never by text matching.
//
// ⚠ NO DATE IS INVENTED HERE. The chip names the minimum AGE — a fact
// `validateOnePCV` already holds — and never a date. Per the owner ruling of
// 2026-10-24, the rec card is the only surface that states a due date; a chip
// states an earliest. Ayla's card says 26 Nov (four weeks after the dose she
// got, per Ruling D), which is LATER than her 6-week birthday, and the card is
// left to say so.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-29';
const chip = (res, vax = 'pcv', i = 0) => (res.perDose[vax][i].reasons ?? []).join(' ');

// Ayla, born 24 Sep 2026. PCV15 today, at 35 days old — three days below the
// 38 days that CDC's 4-day grace allows against the 42-day minimum.
const ayla = {
  dob: '2026-09-24', ageMonths: 1, today: TODAY,
  pcvDoses: [{ product: 'PCV15', date: TODAY }],
  ppsv23Doses: [], riskIds: [],
};

describe('Ayla — a conjugate thrown out on age names no product', () => {
  it('does not tell the clinician to give PCV20', () => {
    expect(chip(recommend(ayla))).not.toMatch(/give a dose of PCV20 instead/);
  });

  it('does not tell the clinician to repeat the same vaccine either', () => {
    expect(chip(recommend(ayla))).not.toMatch(/repeat this dose only/);
  });

  it('says any PCV approved for her age may be used, and names the minimum age', () => {
    const text = chip(recommend(ayla));
    expect(text).toMatch(/does not count toward the series/);
    // ⚠ THE WHOLE CLAUSE, not just "6 weeks minimum age". The first chip line
    // already reads "below the 6 weeks minimum age for PCV15", so the loose
    // regex matched text that was there before this change and passed for the
    // wrong reason — mutating `stillTooYoung` to a constant `false` broke
    // nothing in the whole 1,684-test suite. Found by mutating, not by review.
    expect(text).toMatch(/a further dose can be given from the 6 weeks minimum age at the earliest/);
    expect(text).toMatch(/any PCV approved for that age may be used/i);
    expect(text).toMatch(/do not restart the series/);
  });

  it('states no date on the chip — the card owns the due date', () => {
    // 26 Nov is the card's date. A chip repeating it would be a second
    // reading of one number; a chip stating her 6-week birthday (5 Nov)
    // would contradict the card. It states neither.
    const text = chip(recommend(ayla));
    expect(text).not.toMatch(/Nov \d+, 2026/);
  });

  it('leaves CDC\'s PCV15-or-PCV20 choice standing on her card', () => {
    const card = recommend(ayla).recs.find((r) => r.vaccine === 'PCV');
    expect(card.brands).toContain('PCV20 (Prevnar 20)');
    expect(card.brands).toContain('PCV15 (Vaxneuvance)');
  });
});

describe('the three families this does not reach', () => {
  it('still names PCV20 for a child given PCV21', () => {
    const child = {
      dob: '2016-10-01', ageMonths: 120, today: TODAY,
      pcvDoses: [{ product: 'PCV21', date: '2026-06-01' }],
      ppsv23Doses: [], riskIds: ['asplenia'],
    };
    expect(chip(recommend(child))).toMatch(/give a dose of PCV20 instead/);
  });

  it('still says "repeat this dose only" for a too-young PPSV23', () => {
    const toddler = {
      dob: '2025-04-01', ageMonths: 18, today: TODAY,
      pcvDoses: [], ppsv23Doses: [{ date: '2026-10-01' }], riskIds: ['asplenia'],
    };
    const text = chip(recommend(toddler), 'ppsv23');
    expect(text).toMatch(/repeat this dose only/);
    expect(text).not.toMatch(/any PCV approved/i);
  });

  it('leaves a before-birth record problem alone', () => {
    const a = analyzeHistory('PCV', [{ date: '2025-01-10', product: 'PCV13' }],
      12, TODAY, '2025-10-01');
    expect(a.perDose[0].reasons.join(' ')).not.toMatch(/any PCV approved/i);
  });
});

describe('an 18-year-old whose PCV21 was given a month too early', () => {
  // She is 18 now, so PCV21 IS approved for her today — which is why the
  // PCV21 branch (keyed on CURRENT age) does not fire and she falls to the
  // generic minimum-age check. Her dose still does not count.
  const justEighteen = {
    dob: '2008-09-01', ageMonths: 218, today: TODAY,
    pcvDoses: [{ product: 'PCV21', date: '2026-08-01' }],
    ppsv23Doses: [], riskIds: ['diabetes'],
  };

  it('does not name a product, because two are approved for her now', () => {
    const text = chip(recommend(justEighteen));
    expect(text).toMatch(/does not count toward the series/);
    expect(text).not.toMatch(/repeat this dose only/);
    expect(text).toMatch(/any PCV approved/i);
  });

  it('does not show her a floor she has already cleared', () => {
    // The shortfall line still says "below the 18 years minimum age" — that is
    // why the dose failed. What she must not get is the forward-looking clause
    // telling her to WAIT for an age she reached last month.
    expect(chip(recommend(justEighteen))).not.toMatch(/minimum age at the earliest/);
  });
});

describe('the whole grid', () => {
  const tally = { conjugateRepeatOnly: 0, ppsv23RepeatOnly: 0, pcv20Remedy: 0, anyApproved: 0 };
  for (const c of buildCases()) {
    const out = recommend(c.input);
    if (out.excluded) continue;
    const doses = out.orderedDoses?.pcv ?? [];
    (out.perDose?.pcv ?? []).forEach((d, i) => {
      const text = (d.reasons ?? []).join(' ');
      if (text.includes('repeat this dose only')) tally.conjugateRepeatOnly++;
      if (text.includes('give a dose of PCV20 instead')) tally.pcv20Remedy++;
      if (/any PCV approved/i.test(text)) tally.anyApproved++;
      if (d.remedyProduct === 'PCV20' && doses[i]?.product !== 'PCV21') {
        throw new Error(`a ${doses[i]?.product} was told to give PCV20: ${c.key}`);
      }
    });
    (out.perDose?.ppsv23 ?? []).forEach((d) => {
      if ((d.reasons ?? []).join(' ').includes('repeat this dose only')) tally.ppsv23RepeatOnly++;
    });
  }

  it('leaves no conjugate chip telling the clinician to repeat the same vaccine', () => {
    expect(tally.conjugateRepeatOnly).toBe(0);
  });

  it('names PCV20 only where the product given is barred at the patient\'s age', () => {
    // PINNED EXACTLY, not floored: 264 chips, every one a child's PCV21 —
    // the figure on `main` before the closed PR #95 raised it to 924 by
    // reaching the too-young conjugates. Widening it again is exactly what she
    // reversed today, so a rise must fail here rather than pass quietly. The
    // loop above also throws outright if any non-PCV21 carries the field, so
    // this number cannot be met by a different mix of products.
    expect(tally.pcv20Remedy).toBe(264);
  });

  it('moves every age-rejected conjugate onto the product-free sentence', () => {
    // 748 conjugate chips used to say "repeat this dose only"; all of them
    // now carry the new wording. Pinned exactly for the same reason.
    expect(tally.anyApproved).toBe(748);
  });

  it('leaves the too-young PPSV23 chips exactly where they were', () => {
    expect(tally.ppsv23RepeatOnly).toBe(1848);
  });
});
