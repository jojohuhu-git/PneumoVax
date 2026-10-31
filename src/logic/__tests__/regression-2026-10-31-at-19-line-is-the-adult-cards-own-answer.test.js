// ── §B-AT19 (2026-10-31): the "at 19" line is the adult card's own answer ─────
//
// OWNER RULING 2026-10-31, on "Noah" (4, no spleen, catch-up PCV13 x2, PPSV23
// at 29 and 32 months): "Yes, add the line" — an immunocompromised child's
// "complete" card says what happens at 19, as C13 did for the others.
//
// WHAT RUNNING THEM FORWARD FOUND. C13's line was a SECOND reading of the adult
// rules (`atNineteen()` took the risk class and a PPSV23 count), held to the
// first by a sweep of the test grid — which cannot build a vaccinated child
// over 2. Hand-built children showed the two readings disagreeing in three
// more families, every one invisible to the grid:
//   • PCV15 infant series + PPSV23: the line said "a dose" or "re-evaluate at
//     50"; the adult card at 19 says "Complete (PCV15 + PPSV23)".
//   • cochlear implant / CSF leak with an EARLY second PPSV23 (an extra dose):
//     the line said "review again at age 50, or …"; the adult card says
//     "PCV20 or PCV21 … completes the series".
//   • "PCV series complete (PCV before age 6 + PPSV23)": no line at all, for
//     any risk class, while the adult card at 19 often gives a dose.
// So the line is no longer worked out a second time: the engine runs the
// SAME patient forward to 19 and prints the sentence for the row the adult
// card used — one of her four, never a new one — or nothing if that card says
// the series is complete. The sentences, the citations and every dose are
// unchanged.
//
// ⚠ Every child here is hand-built — the grid reaches none of them.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addCalendarMonths } from '../dateUtils.js';

const TODAY = '2026-10-31';
const LINE_FOR = {
  adultIc1949BothPcv13Ppsv: 'At 19, the adult schedule gives 1 dose of PCV20 or PCV21, at least 5 years after the last pneumococcal dose [c].',
  adultChronicOnlyReviewAt50: 'At 19, the adult schedule gives no dose now; re-evaluate at age 50 [c].',
  mmwrIc1949TwoPpsv: 'At 19, the adult schedule says to review again at age 50, or give 1 dose of PCV20 or PCV21 at least 5 years after the last pneumococcal dose [c].',
  adultPpsvOnly1949: 'At 19, because the earlier conjugate’s product is not recorded, the adult schedule gives 1 dose of PCV15, PCV20 or PCV21, at least 1 year after the PPSV23 [c].',
};
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const at19Of = (input) => recommend({
  ...input, ageMonths: 228, today: addCalendarMonths(input.today, 228 - input.ageMonths),
}).recs[0];
// "Complete for life" at 19: a complete adult card that is not the chronic
// block's "No dose now — review at age 50" (also status 'complete').
const finishedAt19 = (a) => a.status === 'complete'
  && !a.noteCites.some((c) => c.key === 'adultChronicOnlyReviewAt50');

// ── The hand-built children ────────────────────────────────────────────────
const RISKS = [['asplenia'], ['hiv'], ['immunodeficiency'], ['cochlear_implant'], ['csf_leak'],
  ['diabetes'], ['chronic_heart'], ['cochlear_implant', 'diabetes']];
const PCV = [ // [product, age in months at the dose]; '' = product not recorded
  [['PCV13', 2], ['PCV13', 4], ['PCV13', 6], ['PCV13', 13]],
  [['PCV15', 2], ['PCV15', 4], ['PCV15', 6], ['PCV15', 13]],
  [['', 2], ['', 4], ['', 6], ['', 13]],
  [['PCV13', 2], ['PCV13', 4], ['PCV13', 6], ['PCV20', 13]],
  [['PCV13', 25], ['PCV13', 27]],
  [['PCV13', 80]], [['PCV15', 80]], [['', 80]],
];
const PPSV = [[28], [28, 31], [28, 89], [84], [84, 87], [84, 146]]; // ages, floored after the last PCV
const CHILDREN = [];
for (const am of [57, 70, 90, 130, 200, 227]) {
  const dob = addCalendarMonths(TODAY, -am);
  for (const riskIds of RISKS) for (const pcv of PCV) for (const ppsv of PPSV) {
    const lastPcv = Math.max(...pcv.map(([, a]) => a));
    const shift = Math.max(0, lastPcv + 3 - ppsv[0]);
    const ppsvAges = ppsv.map((a) => a + shift);
    if (ppsvAges.at(-1) > am - 1) continue;
    CHILDREN.push({
      dob, ageMonths: am, today: TODAY, riskIds,
      pcvDoses: pcv.map(([product, a]) => ({ product, date: addCalendarMonths(dob, a) })),
      ppsv23Doses: ppsvAges.map((a) => ({ product: 'PPSV23', date: addCalendarMonths(dob, a) })),
    });
  }
}
const COMPLETE = CHILDREN.flatMap((input) => recommend(input).recs
  .filter((r) => r.status === 'complete').map((r) => ({ input, r, adult: at19Of(input) })));

describe('every at-risk child\'s "complete" card agrees with her own card at 19', () => {
  it('the sweep is big enough to mean something', () => {
    expect(COMPLETE.length).toBeGreaterThan(600);
  });

  it('a line appears exactly when the adult card at 19 is not "complete for life"', () => {
    const wrong = COMPLETE.filter(({ r, adult }) => /At 19,/.test(noteText(r)) === finishedAt19(adult));
    expect(wrong.map(({ input, r, adult }) => `${input.riskIds} ${input.ageMonths}m ${r.doseLabel} → ${adult.doseLabel}`)).toEqual([]);
  });

  it('the line is the sentence for the row the adult card cites, and cites that row', () => {
    for (const { r, adult } of COMPLETE.filter(({ adult: a }) => !finishedAt19(a))) {
      const key = r.noteCites.map((c) => c.key).find((k) => k in LINE_FOR);
      expect(Object.keys(LINE_FOR)).toContain(key);
      expect(adult.noteCites.map((c) => c.key)).toContain(key);
      expect(noteText(r)).toContain(LINE_FOR[key].replace(' [c].', ''));
      expect((noteText(r).match(/\[c\]/g) ?? []).length).toBe(r.noteCites.length);
    }
  });
});

describe('the patients behind the ruling, word for word', () => {
  const d = (product, dates) => dates.map((date) => ({ product, date }));
  it('Noah, 4, no spleen — his card now ends with the two-dose line', () => {
    const noah = {
      dob: '2022-01-01', ageMonths: 57, today: '2026-10-30', riskIds: ['asplenia'],
      pcvDoses: d('PCV13', ['2024-02-01', '2024-04-01']), ppsv23Doses: d('PPSV23', ['2024-06-01', '2024-09-01']),
    };
    const card = recommend(noah).recs[0];
    expect(card.doseLabel).toBe('PCV complete (at-risk catch-up done)');
    expect(card.note.endsWith(LINE_FOR.mmwrIc1949TwoPpsv)).toBe(true);
    expect(card.noteCites.map((c) => c.key)).toContain('mmwrIc1949TwoPpsv');
  });

  it('Lily, 18, no spleen, three PPSV23 (the third extra) — the same line', () => {
    const lily = {
      dob: '2008-01-01', ageMonths: 226, today: '2026-10-31', riskIds: ['asplenia'],
      pcvDoses: d('PCV13', ['2010-01-05', '2010-03-05']),
      ppsv23Doses: d('PPSV23', ['2010-05-10', '2015-06-01', '2020-07-01']),
    };
    const card = recommend(lily).recs[0];
    expect(card.doseLabel).toBe('PCV series complete (PCV before age 6 + PPSV23)');
    expect(noteText(card)).toContain(LINE_FOR.mmwrIc1949TwoPpsv.replace(' [c].', ''));
  });

  it('a PCV15 baby series + PPSV23 with a cochlear implant — no line: complete at 19 too', () => {
    const p = {
      dob: '2016-10-31', ageMonths: 120, today: TODAY, riskIds: ['cochlear_implant'],
      pcvDoses: d('PCV15', ['2016-12-31', '2017-02-28', '2017-04-30', '2017-11-30']),
      ppsv23Doses: d('PPSV23', ['2019-02-28']),
    };
    const card = recommend(p).recs[0];
    expect(card.status).toBe('complete');
    expect(noteText(card)).not.toContain('At 19,');
    expect(at19Of(p).doseLabel).toBe('Complete (PCV15 + PPSV23)');
  });
});
