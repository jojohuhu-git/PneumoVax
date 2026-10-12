// P6-3c (2026-10-12) — the first per-dose verdict citations.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// P6-3 (S13) built the whole mechanism — a "[c]" marker in verdict text, a
// `reasonCites` list beside it, numbered superscripts assigned at render time,
// the quoted sentence on hover — and then wired it to NOTHING. Every
// `reasonCites` in `src/` was absent; the only one in the repo lived in a
// RecCard test fixture. Two sources sat in `refs.js` reaching no clinician:
//
//   • `immPCV7` — the source for a CLAUDE.md NON-NEGOTIABLE ("PCV7 never
//     counts"). The app sets aside a real vaccine a real patient received, told
//     the clinician "Per ACIP/immunize.org", and gave them no way to reach it.
//   • `pedsMinAge` — CDC's quoted sentence for the minimum ages, referenced by
//     nothing, while the minimum-age rules themselves ran and voided doses.
//
// `citation-orphans.test.js` held both in `KNOWN_UNCITED` with the reason
// recorded, so they could not be forgotten. Both entries are now gone, and
// that test fails if either key stops appearing in `src/`.
//
// ── The decision this was waiting on ─────────────────────────────────────
//
// Which sentence a verdict cites is a clinical-copy call, and the rule taken
// (owner, 2026-10-12) is: **a marker goes only on a claim the quoted sentence
// actually supports.** `pedsMinAge` quotes "(minimum age: 6 weeks [PCV15],
// [PCV 20]; 2 years [PPSV23])" — two numbers. The 6-week floor is one constant
// shared by every PCV in brands.js, so a PCV13 or PCV7 verdict cites it too;
// PCV21's 18 years is a different number from a different source and cites
// nothing. That control is the half of this test that matters most: attaching
// a source to a claim it does not support is, in citations.jsx's own words,
// the one failure mode worse than no citation at all.
//
// ── Proven by mutation (2026-10-12), all against the real engine ─────────
//   A. The PCV7 citation unwired (exactly how it shipped before today):
//      2/13 fail here, 1/3 in the UI test, and 1/4 in citation-orphans —
//      which re-detects `immPCV7` as an orphan now that its KNOWN_UNCITED
//      excuse is gone. The gate works in both directions.
//   B. `pedsMinAge`'s quote put back to the heading-plus-parenthetical form
//      whose `#:~:text=` fragment matches nothing on CDC's page: 1/13 fails.
//   C. `minAgeCites` made unconditional, so PCV21's 18 years would cite a
//      sentence that does not mention it: 1/13 fails — the control below.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';
import { REFS } from '../../data/refs.js';

const TODAY = '2026-10-12';

function run({ pcvDoses = [], ppsv23Doses = [], ageMonths, dob }) {
  return analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today: TODAY, dob, riskIds: [] });
}

const markers = (v) => (v.reasons ?? []).reduce((n, r) => n + (String(r).split('[c]').length - 1), 0);
const cites = (v) => v.reasonCites ?? [];

// Every verdict in this file must satisfy the P6-3b contract locally as well
// as in the global sweep, because a mismatch here is what shifts a citation
// onto the wrong sentence.
function expectPaired(v) {
  expect(markers(v), 'one "[c]" per citation, in order').toBe(cites(v).length);
}

describe('P6-3c — the PCV7 verdict shows the source it rests on', () => {
  // A 20-year-old whose PCV7 was given in 2008, i.e. a real record: PCV7 was
  // used in the US 2000-2010.
  const r = () => run({
    pcvDoses: [{ product: 'PCV7', date: '2008-05-02' }],
    ageMonths: 20 * 12, dob: '2006-01-01',
  });

  it('carries exactly one citation, and it is immunize.org Ask the Experts', () => {
    const v = r().pcv.perDose[0];
    expect(v.status).toBe('noncounting');
    expectPaired(v);
    expect(cites(v)).toHaveLength(1);
    expect(cites(v)[0].key).toBe('immPCV7');
  });

  it('the marker sits on the clause naming the source, not at the end', () => {
    const v = r().pcv.perDose[0];
    // "Per ACIP/immunize.org[c], PCV7 doses are ignored..." — the citation
    // backs the attribution, which is the claim a clinician would click.
    expect(v.reasons[0]).toMatch(/Per ACIP\/immunize\.org\[c\],/);
  });

  it('the link deep-links to the quoted sentence, not just the page', () => {
    const c = cites(r().pcv.perDose[0])[0];
    expect(c.url).toMatch(/#:~:text=/);
    expect(c.page, 'the dedupe identity is the plain page URL').not.toMatch(/#:~:text=/);
    // The hover text IS the quote — so the clinician reads the sentence
    // itself, including its scope, rather than our paraphrase of it.
    expect(c.label).toBe(REFS.immPCV7.quote);
    expect(c.label).toMatch(/doses of PCV7 should be ignored/);
  });
});

describe('P6-3c — minimum-age verdicts show CDC\'s minimum-age sentence', () => {
  // Below the 6-week PCV floor: a dose dated 3 weeks after birth.
  const earlyPcv = (product) => run({
    pcvDoses: [{ product, date: '2026-01-22' }],
    ageMonths: 9, dob: '2026-01-01',
  }).pcv.perDose[0];

  for (const product of ['PCV15', 'PCV20', 'PCV13', '']) {
    it(`a ${product || 'product-not-recorded'} dose below 6 weeks cites pedsMinAge`, () => {
      const v = earlyPcv(product);
      expect(v.status).toBe('invalid');
      expectPaired(v);
      expect(cites(v).map((c) => c.key)).toEqual(['pedsMinAge']);
    });
  }

  it('a PPSV23 below 2 years cites it too — the same sentence states both numbers', () => {
    const v = run({
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-01-01' }],
      ageMonths: 36, dob: '2024-01-01',
    }).ppsv23.perDose[0];
    expect(v.status).toBe('invalid');
    expectPaired(v);
    expect(cites(v).map((c) => c.key)).toEqual(['pedsMinAge']);
  });

  it('the UNDATED minimum-age verdicts cite it as well', () => {
    // These two branches (`validate.js`, the dateless arms) were the real
    // uncovered clinical branches the P2-9 coverage report named. Both state a
    // minimum age, so both owe the reader its source.
    const pcv = run({ pcvDoses: [{ product: 'PCV15', date: '' }], ageMonths: 0.5, dob: '2026-09-28' })
      .pcv.perDose[0];
    expect(pcv.status).toBe('invalid');
    expect(cites(pcv).map((c) => c.key)).toEqual(['pedsMinAge']);
    expectPaired(pcv);

    // P1-3 (2026-10-12): an undated dose declares itself; an untouched row
    // is no longer a dose. Case unchanged.
    const ppsv = run({ ppsv23Doses: [{ product: 'PPSV23', date: '', detailsUnknown: true }], ageMonths: 12, dob: '2025-10-12' })
      .ppsv23.perDose[0];
    expect(ppsv.status).toBe('invalid');
    expect(cites(ppsv).map((c) => c.key)).toEqual(['pedsMinAge']);
    expectPaired(ppsv);
  });

  it('an undated dose that is OLD ENOUGH still cites the minimum it names', () => {
    // "must have been given at >=6 weeks to be valid" is a claim about the
    // minimum age just as much as a verdict that voids a dose is.
    const v = run({ pcvDoses: [{ product: 'PCV15', date: '' }], ageMonths: 60, dob: '2021-10-12' })
      .pcv.perDose[0];
    expect(v.status).toBe('unknown');
    expectPaired(v);
    expect(cites(v).map((c) => c.key)).toEqual(['pedsMinAge']);
  });

  it('the pedsMinAge link deep-links to a sentence that exists on the page', () => {
    const c = cites(earlyPcv('PCV15'))[0];
    expect(c.url).toMatch(/#:~:text=/);
    // The quote was TRIMMED to the parenthetical for exactly this reason:
    // checked live 2026-10-12, CDC renders the heading and the parenthetical
    // as two separate elements, so the old heading-plus-parenthetical quote
    // matched nothing and the deep link died silently. A quote that still
    // carried the heading would be that bug again.
    expect(c.label).toBe(REFS.pedsMinAge.quote);
    expect(c.label, 'a text fragment cannot span two block elements')
      .not.toMatch(/Pneumococcal vaccination/);
    expect(c.label).toMatch(/minimum age: 6 weeks/);
  });
});

describe('P6-3c — the control: a claim this sentence does NOT support', () => {
  it('PCV21 below 18 years cites nothing — a different number, a different source', () => {
    // CDC's quoted sentence names 6 weeks and 2 years. It says nothing about
    // PCV21's 18 years (mm7336a3 / the FDA label), so this verdict carries no
    // marker and no citation rather than borrowing one that does not fit.
    const v = run({
      pcvDoses: [{ product: 'PCV21', date: '2020-01-01' }],
      ageMonths: 30 * 12, dob: '2010-01-01',
    }).pcv.perDose[0];

    expect(v.status).toBe('invalid');
    expect(v.reasons.join(' ')).toMatch(/18 years/);
    expect(markers(v), 'no marker without a citation').toBe(0);
    expect(v.reasonCites, 'no citation attached to a claim the sentence does not make')
      .toBeUndefined();
  });

  it('a dose that is simply fine carries no citation at all', () => {
    const v = run({
      pcvDoses: [{ product: 'PCV20', date: '2025-01-01' }],
      ageMonths: 70 * 12, dob: '1956-01-01',
    }).pcv.perDose[0];
    expect(v.status).toBe('valid');
    expect(v.reasonCites).toBeUndefined();
  });
});
