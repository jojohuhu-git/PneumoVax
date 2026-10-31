// ── §C-P2-GREY (2026-10-31): the repeat of a too-young PPSV23 — a grey area ──
//
// OWNER RULING 2026-10-31, on "Sam" (2, no spleen, a full infant PCV13
// series; PPSV23 on Dec 1, 2024 at 23 months — too young — and again on Jan 5,
// 2025, just past his 2nd birthday, 5 weeks later). CDC General Best
// Practices (read live 2026-10-31): "the dose should be repeated on or after
// the date when the child reaches at least the minimum age", with a gap from
// the invalid dose stated only "If the vaccine is a live vaccine". She kept
// the app's 8 weeks from the invalid dose ("use the latter rule"), asked for
// the grey area to be highlighted on the card and the dose chip and recorded
// in the rulebook, and chose "PCV20 only": no Option B, his THIRD PPSV23.
//
// Her later answer on Rosa agrees with keeping the 8 weeks: the spacing from
// an invalid dose "applies when the repeat dose is the same as the invalid
// dose" — and Sam's Jan 5 dose is a PPSV23 repeating a PPSV23.
//
// ⚠ Hand-built: the grid holds no child with two PPSV23 doses this close.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addCalendarMonths, addDays } from '../dateUtils.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const SAM = {
  dob: '2023-01-01', ageMonths: 34, today: '2025-11-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-05']),
  ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05']),
};
const GREY = 'This app spaces the repeat 8 weeks from the invalid dose, so the Jan 5, 2025 dose is not counted. If it were counted, PCV20 would be due on or after Jan 5, 2030 and would complete the series.';

describe('Sam', () => {
  const out = recommend(SAM);

  it('the Jan 5 repeat stays thrown out — 8 weeks from the too-young dose', () => {
    expect(out.perDose.ppsv23.map((x) => x.status)).toEqual(['invalid', 'invalid']);
    expect(out.perDose.ppsv23[1].intervalRuleId).toBe('CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST');
  });

  it('his card offers PCV20 only — no Option B, which would be his third PPSV23', () => {
    expect(out.recs.map((r) => [r.vaccine, r.doseLabel])).toEqual([
      ['PCV', '1 dose PCV20 (≥8 weeks) — completes the series'],
    ]);
    expect(out.recs[0].dueToday).toBe(true);
    expect(out.recs[0].note.lead).toBe(
      '**Give 1 dose of PCV20**, ≥8 weeks after the most recent PCV [c]; that completes the series [c]. No further PPSV23: 2 PPSV23 doses have been given and neither counted.',
    );
  });

  it('"Why this" highlights the grey area, citing both CDC sentences', () => {
    expect(out.recs[0].note.detail).toBe(
      `Grey area: CDC says a dose given under the minimum age is repeated on or after that age [c], and states no gap from the invalid dose for a vaccine that is not live [c]. ACIP does not address this case. ${GREY}`,
    );
    expect(out.recs[0].noteCites.map((c) => c.key)).toEqual([
      'pedsIcPcv20orPpsv23', 'cdcPcv20Children2023CompleteWithoutPcv20',
      'cdcGbpRepeatUnderMinAge', 'cdcGbpLiveVaccine28Days',
    ]);
  });

  it('the chip under the Jan 5 dose names the grey area, and no longer promises a PPSV23 from Mar 2', () => {
    const chip = out.perDose.ppsv23[1].reasons.join(' ');
    expect(chip).toContain(`Grey area: CDC says a dose given under the minimum age is repeated on or after that age, and states no gap from the invalid dose for a vaccine that is not live. ACIP does not address this case. ${GREY}`);
    expect(chip).toContain('It is not repeated.');
    expect(chip).not.toContain('Mar 2, 2025');
  });
});

describe('limits — only the card she was shown', () => {
  it('the same history at 10 years old reads the same way, with the 6-18 row', () => {
    const at10 = { ...SAM, ageMonths: 120, today: addCalendarMonths(SAM.dob, 120) };
    const recs = recommend(at10).recs;
    expect(recs.map((r) => r.doseLabel)).toEqual(['1 dose PCV20 (≥8 weeks) — completes the series']);
    expect(recs[0].noteCites[0].key).toBe('pedsIcBefore6NoPcv20At6to18');
  });

  it('a child who is NOT immunocompromised keeps both options (not ruled)', () => {
    const recs = recommend({ ...SAM, riskIds: ['cochlear_implant'] }).recs;
    expect(recs.map((r) => r.doseLabel)).toEqual(['Option A: 1 dose PCV20 (≥8 weeks)', 'Option B: 1 dose PPSV23 (≥8 weeks)']);
  });

  it('a child still owed catch-up conjugates keeps her catch-up card', () => {
    const p = { ...SAM, pcvDoses: [], dob: '2023-01-01' };
    const recs = recommend(p).recs;
    expect(recs[0].doseLabel).toMatch(/at-risk catch-up/);
  });

  it('a first PPSV23 thrown out for SPACING (Noah\'s kind) is not a grey area', () => {
    const noah = { dob: '2021-01-01', ageMonths: 69, today: '2026-10-30', riskIds: ['asplenia'],
      pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01']), ppsv23Doses: d('PPSV23', ['2023-04-29', addDays('2023-04-29', 42)]) };
    const out = recommend(noah);
    expect(out.perDose.ppsv23[1].intervalRuleId).toBe('CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST');
    expect(JSON.stringify(out)).not.toContain('Grey area');
  });

  it('a repeat 8 weeks after the too-young dose COUNTS — no grey area at all', () => {
    const p = { ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-26']) };
    const out = recommend(p);
    expect(out.perDose.ppsv23[1].status).toBe('valid');
    expect(JSON.stringify(out)).not.toContain('Grey area');
  });
});
