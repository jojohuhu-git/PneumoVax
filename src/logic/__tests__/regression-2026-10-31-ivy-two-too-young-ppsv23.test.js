// ── §C-P2-NOTHIRD (OWNER RULING 2026-10-31, on "Ivy") ─────────────────────
//
// Ivy, 2y10m, no spleen, a full infant PCV13 series; PPSV23 at 13 months and
// again at 20 months — BOTH below the 2-year minimum age, so neither counts.
// Her second shot is not a "repeat after an invalid first" (it came 7 months
// later, so the repeat rule passed; it failed on age), so the no-third-shot
// rule built on Sam, Max, Kai and Noah did not fire and her card still
// offered Option B — a third PPSV23 shot. Asked, with the trade-off that a
// PPSV23 today would be her first one that counts: "PCV20 only".
//
// So the trigger is now "two or more PPSV23 shots given, none counted",
// whatever threw them out. A row that is not a shot — a duplicate entry, or
// one dated in the future or before birth — is not counted as one.
//
// ⚠ Hand-built: the grid holds no child with two PPSV23 doses under age 2.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const IVY = {
  dob: '2023-01-01', ageMonths: 34, today: '2025-11-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-05']),
  ppsv23Doses: d('PPSV23', ['2024-02-01', '2024-09-01']),
};
const labels = (p) => recommend(p).recs.map((r) => r.doseLabel);
const PCV20_ONLY = ['1 dose PCV20 (≥8 weeks) — completes the series'];
const PAIR = ['Option A: 1 dose PCV20 (≥8 weeks)', 'Option B: 1 dose PPSV23 (≥8 weeks)'];

describe('Ivy', () => {
  const out = recommend(IVY);

  it('both PPSV23 shots are thrown out for age — neither by the repeat rule', () => {
    expect(out.perDose.ppsv23.map((x) => x.status)).toEqual(['invalid', 'invalid']);
    expect(out.perDose.ppsv23.map((x) => x.intervalRuleId ?? null)).toEqual([null, null]);
  });

  it('her card offers PCV20 only — no Option B, which would be her third PPSV23 shot', () => {
    expect(out.recs.map((r) => [r.vaccine, r.doseLabel])).toEqual([['PCV', PCV20_ONLY[0]]]);
    expect(out.recs[0].note.lead).toBe(
      '**Give 1 dose of PCV20**, ≥8 weeks after the most recent PCV [c]; that completes the series [c]. No further PPSV23: 2 PPSV23 doses have been given and neither counted.',
    );
    expect(out.recs[0].note.detail).toBe('A PPSV23 is not offered: it would be a third PPSV23 shot.');
  });

  // Found by driving the app: the card said no further PPSV23 while the chip
  // under her second shot still read "repeat this dose only". Her Noah ruling
  // — the chip under the repeat drops its promise of a further PPSV23.
  it('the chip under her second shot says it is not repeated — no "repeat this dose only"', () => {
    expect(out.perDose.ppsv23[1].reasons).toEqual([
      'Given at ~20 months — below the 2-year minimum age for PPSV23[c].',
      'This dose does not count toward the series. It is not repeated.',
    ]);
  });

  it('no grey-area note: both shots were plainly too young', () => {
    expect(JSON.stringify(out)).not.toContain('Grey area');
  });
});

describe('limits — a row that is not a shot is not counted as one', () => {
  it('ONE too-young PPSV23 keeps the Option A / Option B pair', () => {
    expect(labels({ ...IVY, ppsv23Doses: d('PPSV23', ['2024-02-01']) })).toEqual(PAIR);
  });

  it('a too-young PPSV23 entered twice on the same day is one shot — the pair stays', () => {
    expect(labels({ ...IVY, ppsv23Doses: d('PPSV23', ['2024-02-01', '2024-02-01']) })).toEqual(PAIR);
  });

  it('a too-young PPSV23 plus one dated in the future is one shot — the pair stays', () => {
    expect(labels({ ...IVY, ppsv23Doses: d('PPSV23', ['2024-02-01', '2026-03-01']) })).toEqual(PAIR);
  });

  it('Sam\'s two shots plus a duplicate entry still say "2 PPSV23 doses", not 3', () => {
    const sam = { ...IVY, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05', '2025-01-05']) };
    expect(recommend(sam).recs[0].note.lead).toContain('2 PPSV23 doses have been given and neither counted');
  });

  it('Sam plus a third shot two weeks later: the grey note still names his Jan 5 repeat', () => {
    const sam = { ...IVY, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05', '2025-01-19']) };
    const out = recommend(sam);
    expect(out.recs[0].note.lead).toContain('3 PPSV23 doses have been given and none counted');
    expect(out.recs[0].note.detail).toContain('so the Jan 5, 2025 dose is not counted');
  });

  it('Sam\'s repeat, thrown out for timing, keeps its timing reason in front of "It is not repeated"', () => {
    const sam = { ...IVY, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05']) };
    expect(recommend(sam).perDose.ppsv23[1].reasons[1]).toMatch(
      /^This dose does not count toward the series — given too soon after the dose it is measured from\. It is not repeated\. Grey area:/,
    );
  });
});

describe('within her earlier rulings — listed in the PR, not asked', () => {
  it('Ivy\'s twin with a cochlear implant (not immunocompromised): PCV20 only too (Max)', () => {
    expect(labels({ ...IVY, riskIds: ['cochlear_implant'] })).toEqual(PCV20_ONLY);
  });

  it('Ivy with no conjugate on record: the catch-up card offers PCV20 only and says why (Kai)', () => {
    const [card] = recommend({ ...IVY, pcvDoses: [] }).recs;
    expect(card.brands).toEqual(['PCV20 (Prevnar 20)']);
    expect(card.note.detail).toContain('PCV15 is not offered: it would need a PPSV23 after it [c] — a third PPSV23 shot.');
  });
});
