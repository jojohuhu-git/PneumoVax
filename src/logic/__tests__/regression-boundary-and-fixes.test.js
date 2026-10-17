// regression-boundary-and-fixes.test.js
//
// Regression tests for the H1–H5, M1–M3, L1 fixes.
// Each test maps to a required scenario from REVIEW_FINDINGS.md.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { ageGroup } from '../format.js';
import { ADULT_SCHED_MIN_M, PCV21_MIN_AGE_M } from '../scheduleConstants.js';

const TODAY = '2026-06-12';
function run(input) { return recommend({ today: TODAY, ...input }); }
const pcv = (r) => r.recs.find((x) => x.vaccine === 'PCV') || null;
const ppsv = (r) => r.recs.find((x) => x.vaccine === 'PPSV23') || null;

// ════════════════════════════════════════════════════════════════════════════
// H1/H2 — Schedule boundary constants
// ════════════════════════════════════════════════════════════════════════════
describe('H1/H2 – ADULT_SCHED_MIN_M and PCV21_MIN_AGE_M constants', () => {
  it('ADULT_SCHED_MIN_M is 228 (19y)', () => {
    expect(ADULT_SCHED_MIN_M).toBe(228);
  });

  it('PCV21_MIN_AGE_M is 216 (18y) — distinct from schedule boundary', () => {
    expect(PCV21_MIN_AGE_M).toBe(216);
    expect(PCV21_MIN_AGE_M).not.toBe(ADULT_SCHED_MIN_M);
  });

  // 18y6m = 222mo → PEDS path (< 228)
  it('Required scenario 1: 18y6m + asplenia → peds Table 4 path, NOT adult matrix', () => {
    const r = run({ ageMonths: 222, riskIds: ['asplenia'], pcvDoses: [] });
    // peds Table 4: Option A (PCV20) + Option B (PCV15 then PPSV23)
    const recs = r.recs;
    const labels = recs.map((x) => x.doseLabel);
    // Must NOT be adult "Not indicated" or adult "PCV complete" without steps
    expect(labels.some((l) => /option a|option b/i.test(l))).toBe(true);
    // No adult "Not indicated (<50y)" label
    expect(labels.some((l) => /not indicated.*50y/i.test(l))).toBe(false);
  });

  // Required scenario 2 USED to check that an 18y6m transplant patient got the
  // paediatric post-transplant row (4 doses of PCV20, immunize.org Table 5)
  // rather than the adult one. Since 2026-10-16 the transplant tick is a hard
  // stop with no age branch at all, which is what the 2a/2b pair below now
  // asserts — so this scenario's whole question, "which side of 19 is this
  // patient on", no longer has an answer to get wrong.

  it('Required scenario 3: 19y0m + asplenia → adult path', () => {
    const r = run({ ageMonths: 228, riskIds: ['asplenia'], pcvDoses: [] });
    // Adult path for a risk patient with no PCV history gives PCV15/20/21
    const labels = r.recs.map((x) => x.doseLabel);
    // Should NOT be peds "Option A/B" style
    expect(labels.some((l) => /option a.*pcv20/i.test(l))).toBe(false);
    // Adult PCV recommendation (PCV15/20/21 with 19-49 risk note)
    expect(pcv(r).brands.some((b) => /PCV21/.test(b))).toBe(true);
  });

  // 2a/2b were the two halves of an age branch inside the post-transplant
  // advisory: at 18y6m its title had to read "child <19y" and at 19y0m
  // "adult". The branch is gone, and these now guard the opposite property —
  // that the stop is identical on both sides of ADULT_SCHED_MIN_M. Kept as a
  // pair rather than merged into one test because the 228-month boundary is
  // where this app has historically gone wrong, and a future age branch would
  // most likely reappear exactly here.
  it('Required scenario 2a: 18y6m transplant → the hard stop, no peds branch', () => {
    const r = run({ ageMonths: 222, riskIds: ['hct_cart_bcell_exclude'], pcvDoses: [] });
    expect(r.excluded).toBe(true);
    expect(r.recs).toEqual([]);
  });

  it('Required scenario 2b: 19y0m transplant → the same stop, word for word', () => {
    const younger = run({ ageMonths: 222, riskIds: ['hct_cart_bcell_exclude'], pcvDoses: [] });
    const older = run({ ageMonths: 228, riskIds: ['hct_cart_bcell_exclude'], pcvDoses: [] });
    expect(older.excluded).toBe(true);
    expect(older.recs).toEqual([]);
    expect(older.exclusionMessage).toBe(younger.exclusionMessage);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// H4 — PCV21 offered at 18y but adult MATRIX not until 19y
// ════════════════════════════════════════════════════════════════════════════
describe('H4 – PCV21 product gate (216mo) vs adult schedule boundary (228mo)', () => {
  it('Required scenario 5: PCV21 NOT offered to 18y on peds path (product gate)', () => {
    // 18y6m (222mo) = peds. PCV21 minAgeM=216 is met, but adult pcvRecBrands
    // (which includes PCV21) is not used in the peds path — only adult path.
    const r = run({ ageMonths: 222, riskIds: ['asplenia'], pcvDoses: [] });
    const allBrands = r.recs.flatMap((x) => x.brands || []);
    // Peds recs should NOT offer PCV21 (peds uses pcvRecBrands({ adult: false }))
    expect(allBrands.some((b) => /PCV21/.test(b))).toBe(false);
  });

  it('Required scenario 5b: PCV21 IS offered at 19y on adult path', () => {
    const r = run({ ageMonths: 228, riskIds: ['asplenia'], pcvDoses: [] });
    const allBrands = r.recs.flatMap((x) => x.brands || []);
    expect(allBrands.some((b) => /PCV21/.test(b))).toBe(true);
  });

  it('PCV21_MIN_AGE_M (216) is the product gate — distinct from ADULT_SCHED_MIN_M (228)', () => {
    expect(PCV21_MIN_AGE_M).toBe(216);
    expect(ADULT_SCHED_MIN_M).toBe(228);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// H5 — infant series NOT complete without a ≥12mo dose
// ════════════════════════════════════════════════════════════════════════════
describe('H5 – boosterGiven requires a dose given AT ≥12mo', () => {
  it('Required scenario 6: 13mo, 4 PCV20 all <12mo → NOT complete (booster still needed)', () => {
    // All 4 doses were before 12 months; the patient is now 13mo.
    // At 13mo the patient's CURRENT age ≥ 12mo, but no dose was given AT ≥12mo.
    const doses = [
      { product: 'PCV20', date: '2025-06-12' },  // 0mo
      { product: 'PCV20', date: '2025-08-12' },  // ~2mo
      { product: 'PCV20', date: '2025-10-12' },  // ~4mo
      { product: 'PCV20', date: '2025-12-12' },  // ~6mo
    ];
    // Patient born ~2025-05-12 (13mo on TODAY=2026-06-12)
    const r = run({ ageMonths: 13, riskIds: [], pcvDoses: doses });
    expect(pcv(r).status).not.toBe('complete');
    expect(pcv(r).doseLabel).toMatch(/dose/i);
  });

  it('15mo, 4 PCV20 with last one clearly at ≥12mo → series complete', () => {
    // Patient is 15mo today (2026-06-12). 3 infant doses, 1 booster at ≥12mo.
    // date '2026-03-13' = 91 days before 2026-06-12 → ageAtDose ≈ 12.01mo (≥12mo band).
    // date '2026-03-12' would be 92 days → 11.98mo (fails due to float; use 03-13 instead).
    const doses = [
      { product: 'PCV20', date: '2025-06-01' },   // ~infant
      { product: 'PCV20', date: '2025-08-01' },   // ~infant
      { product: 'PCV20', date: '2025-10-01' },   // ~infant
      { product: 'PCV20', date: '2026-03-13' },   // ≈12.01mo ← booster (91 days before today)
    ];
    const r = run({ ageMonths: 15, riskIds: [], pcvDoses: doses });
    expect(pcv(r).status).toBe('complete');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// M1 — catch-up target uses band.before12
// ════════════════════════════════════════════════════════════════════════════
describe('M1 – catch-up target accounts for age-at-prior-dose', () => {
  it('Required scenario 7: 13mo, 1 PCV20 at 2mo → "2 more doses" (target 3 or 4, not 2)', () => {
    // 1 dose given at ~2mo (before 12mo). Child now 13mo.
    // Should still need ≥2 more doses (remaining primary + booster).
    const r = run({
      ageMonths: 13,
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2026-04-12' }], // ~2mo ago
    });
    // The single dose was given before 12mo; child still needs primaries + booster.
    // target should be ≥3 (not just 2), so remaining ≥2.
    expect(pcv(r).status).toBe('catchup');
    // Label should say "of 3" or "of 4" — NOT "of 2" (that was the bug).
    expect(pcv(r).doseLabel).not.toMatch(/of 2/i);
  });

  it('13mo, 0 prior doses → dose 1 of 2 (standard 0-prior catch-up at ≥12mo)', () => {
    const r = run({ ageMonths: 13, riskIds: [], pcvDoses: [] });
    expect(pcv(r).doseLabel).toMatch(/of 2/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// M2 — at-risk 24–71mo child with one PCV20 is NOT complete
// ════════════════════════════════════════════════════════════════════════════
describe('M2 – at-risk child with lone PCV20 not complete', () => {
  it('Required scenario 8: 30mo asplenia, one PCV20 → dose 2 of 2, not complete', () => {
    const r = run({
      ageMonths: 30,
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-04-01' }],
    });
    // The lone PCV20 at ≥24mo counts as 1 at-risk catch-up dose.
    // At-risk 24–71mo with <3 before 24mo → need 2 doses at ≥24mo.
    // With 1 done, 1 remaining → "dose 2 of 2" (not complete).
    expect(pcv(r).status).not.toBe('complete');
    expect(pcv(r).doseLabel).toMatch(/dose 2 of 2/i);
  });

  it('30mo asplenia, two PCV20 at ≥24mo → complete', () => {
    const r = run({
      ageMonths: 30,
      riskIds: ['asplenia'],
      pcvDoses: [
        { product: 'PCV20', date: '2026-02-01' },
        { product: 'PCV20', date: '2026-04-01' },
      ],
    });
    expect(pcv(r).status).toBe('complete');
  });

  it('30mo asplenia, 3+ infant PCV doses then one PCV20 at ≥24mo → complete', () => {
    // 3 doses before 24mo → Row 2 (only 1 at-risk catch-up needed). With PCV20
    // at ≥24mo already given, should be complete.
    const r = run({
      ageMonths: 30,
      riskIds: ['asplenia'],
      pcvDoses: [
        { product: 'PCV20', date: '2024-06-01' },  // ~infant
        { product: 'PCV20', date: '2024-08-01' },  // ~infant
        { product: 'PCV20', date: '2024-10-01' },  // ~infant
        { product: 'PCV20', date: '2026-04-01' },  // at ≥24mo catch-up
      ],
    });
    expect(pcv(r).status).toBe('complete');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// L1 — age-group label covers 10y (120mo)
// ════════════════════════════════════════════════════════════════════════════
describe('L1 – ageGroup label gap at 10y closed', () => {
  it('Required scenario 9: 10y0m (120mo) → "Child (2–10y)", not Adolescent', () => {
    expect(ageGroup(120)).toBe('Child (2–10y)');
  });

  it('10y11m (131mo) → still "Child (2–10y)"', () => {
    expect(ageGroup(131)).toBe('Child (2–10y)');
  });

  it('11y0m (132mo) → "Adolescent (11–18y)"', () => {
    expect(ageGroup(132)).toBe('Adolescent (11–18y)');
  });

  it('9y11m (119mo) → "Child (2–10y)"', () => {
    expect(ageGroup(119)).toBe('Child (2–10y)');
  });

  it('18y11m (227mo) → "Adolescent (11–18y)"', () => {
    expect(ageGroup(227)).toBe('Adolescent (11–18y)');
  });

  it('19y0m (228mo) → "Adult (19–49y)"', () => {
    expect(ageGroup(228)).toBe('Adult (19–49y)');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Scenario 4 — 18y6m smoker: the peds rulebook governs, and an adult-only risk
// does not act on it.
//
// CORRECTED 2026-10-10 (S10b, P3-9b / peds audit P0-3). This block previously
// asserted the OPPOSITE — that a smoking tick routed an 18y6m patient to the
// at-risk peds catch-up path — and froze that in place deliberately, "so a
// future change doesn't unknowingly alter the routing". It rested on a claim
// about the source that is not true:
//
//   "'smoking' has class:'nonIC' in riskFactors.js (it appears in p2016 Table 3
//    as a peds nonIC condition …)"
//
// p2016 Table 3 does NOT list smoking. Verified live 2026-10-10 by extracting
// the whole 2-page PDF: 0 matches for /smok|alcohol|cigarette/i, while
// "cochlear" and "diabetes" both match. CDC's child & adolescent schedule notes
// agree — 0 matches across the fully-expanded page. Smoking carries
// class:'nonIC' because that is what it is for ADULTS (CDC's adult notes:
// "Alcoholism, chronic heart/liver/lung disease, cigarette smoking, or diabetes
// mellitus…"), and the adult pathway needs it; it is not a paediatric
// indication. See pedsRiskIds() in riskFactors.js.
//
// The block's real subject — that 222mo is on the PEDS rulebook, not the adult
// one — is unchanged and still asserted below.
// ════════════════════════════════════════════════════════════════════════════
describe('Scenario 4 – 18y6m smoker: peds rulebook governs', () => {
  // The two protections, and the order they apply in:
  //   • UI: the smoking checkbox is hidden below 228mo (StepRisks).
  //   • Engine: even if a smoking id arrives anyway — and it can, by entering
  //     an adult age, ticking it, going Back and lowering the age — the
  //     paediatric pathway strips it. The engine is the protection that holds.
  it('18y6m + smoking riskId → peds path, and the tick does not act', () => {
    // 222mo < 228mo → peds dispatch.
    const r = run({ ageMonths: 222, riskIds: ['smoking'], pcvDoses: [] });
    // Pre-fix this was 'risk-based' with a three-option catch-up regimen.
    expect(pcv(r).status).toBe('not-indicated');
    expect(pcv(r).doseLabel).toBe('Not indicated (healthy 5–18y)');
    // Identical to the same patient with nothing ticked.
    const healthy = run({ ageMonths: 222, riskIds: [], pcvDoses: [] });
    expect(r.recs.map((x) => x.doseLabel)).toEqual(healthy.recs.map((x) => x.doseLabel));
    // Must NOT use adult matrix (adult gives PCV21 in brands)
    const allBrands = r.recs.flatMap((x) => x.brands || []);
    expect(allBrands.some((b) => /PCV21/.test(b))).toBe(false);
  });

  it('18y6m + a GENUINE paediatric risk still routes to the at-risk peds path', () => {
    // The guard must strip the adult-only tick, not disable the at-risk path.
    const r = run({ ageMonths: 222, riskIds: ['diabetes'], pcvDoses: [] });
    expect(pcv(r).status).toBe('risk-based');
    const allBrands = r.recs.flatMap((x) => x.brands || []);
    expect(allBrands.some((b) => /PCV21/.test(b))).toBe(false);
  });

  it('StepRisks isAdult gate: 18y6m (222mo) → isAdult = false (smoking hidden)', () => {
    // Verify the constant used by StepRisks is 228, not 216.
    expect(ADULT_SCHED_MIN_M).toBe(228);
    expect(222 >= ADULT_SCHED_MIN_M).toBe(false);  // isAdult = false → checkbox hidden
  });

  it('StepRisks isAdult gate: 19y0m (228mo) → isAdult = true (smoking visible)', () => {
    expect(228 >= ADULT_SCHED_MIN_M).toBe(true);   // isAdult = true → checkbox visible
  });
});
