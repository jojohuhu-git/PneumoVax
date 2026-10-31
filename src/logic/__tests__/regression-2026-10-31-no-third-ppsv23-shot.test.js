// ── §C-P2-NOTHIRD (2026-10-31): two PPSV23 shots, neither counted — no third ──
//
// Sam's ruling (§C-P2-GREY) was scoped to the card she was shown: an
// immunocompromised child whose card was "Option A PCV20 / Option B PPSV23".
// The same afternoon she was shown the children it left out, one each, and
// ruled every one the same way — offer PCV20 only, because the other path is
// a THIRD PPSV23 shot:
//
//   Max  — Sam's twin with a cochlear implant (NOT immunocompromised):
//          "PCV20 only + note". If his repeat counted he would already be
//          finished, so the note's last sentence says that instead.
//
// ⚠ Hand-built: the grid holds no child with two PPSV23 doses this close.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addCalendarMonths } from '../dateUtils.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const SAM = {
  dob: '2023-01-01', ageMonths: 34, today: '2025-11-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-05']),
  ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05']),
};
const GREY_HEAD = 'Grey area: CDC says a dose given under the minimum age is repeated on or after that age, and states no gap from the invalid dose for a vaccine that is not live. ACIP does not address this case. This app spaces the repeat 8 weeks from the invalid dose, so the Jan 5, 2025 dose is not counted.';
const withCites = (s) => s
  .replace('on or after that age,', 'on or after that age [c],')
  .replace('not live.', 'not live [c].');
const ONE_PCV20 = '1 dose PCV20 (≥8 weeks) — completes the series';
const SAM_LEAD = '**Give 1 dose of PCV20**, ≥8 weeks after the most recent PCV [c]; that completes the series [c]. No further PPSV23: 2 PPSV23 doses have been given and neither counted.';

describe('Max — Sam\'s twin, cochlear implant, not immunocompromised', () => {
  const MAX = { ...SAM, riskIds: ['cochlear_implant'] };
  const out = recommend(MAX);
  const MAX_TAIL = ' If it were counted, the series would already be complete.';

  it('both PPSV23 shots stay thrown out (the 8 weeks is unchanged)', () => {
    expect(out.perDose.ppsv23.map((x) => x.status)).toEqual(['invalid', 'invalid']);
  });

  it('his card offers PCV20 only — no Option B, his third PPSV23 shot', () => {
    expect(out.recs.map((r) => [r.vaccine, r.doseLabel])).toEqual([['PCV', ONE_PCV20]]);
    expect(out.recs[0].dueToday).toBe(true);
    expect(out.recs[0].note.lead).toBe(SAM_LEAD);
  });

  it('"Why this" carries the grey-area note, ending in the sentence true for HIM', () => {
    expect(out.recs[0].note.detail).toBe(withCites(GREY_HEAD) + MAX_TAIL);
    expect(out.recs[0].noteCites.map((c) => c.key)).toEqual([
      'pedsRiskPcv20orPpsv23', 'cdcPcv20Children2023CompleteWithoutPcv20',
      'cdcGbpRepeatUnderMinAge', 'cdcGbpLiveVaccine28Days',
    ]);
    // Sam's tail — a PCV20 five years on — is the immunocompromised row's
    // follow-on dose and must not reach a child who is not owed one.
    expect(JSON.stringify(out)).not.toContain('would be due on or after');
  });

  it('the chip under his Jan 5 dose names the grey area and promises no PPSV23', () => {
    const chip = out.perDose.ppsv23[1].reasons.join(' ');
    expect(chip).toContain(GREY_HEAD + MAX_TAIL);
    expect(chip).toContain('It is not repeated.');
    expect(chip).not.toContain('Mar 2, 2025');
  });

  it('at 10 years old the same history reads the same way, with the 6-18 row', () => {
    const at10 = recommend({ ...MAX, ageMonths: 120, today: addCalendarMonths(MAX.dob, 120) });
    expect(at10.recs.map((r) => r.doseLabel)).toEqual([ONE_PCV20]);
    expect(at10.recs[0].noteCites[0].key).toBe('pedsRiskBefore6NoPcv20At6to18');
    expect(at10.recs[0].note.detail).toContain(MAX_TAIL.trim());
  });

  it('Sam himself is unchanged — his tail still names the five-year PCV20', () => {
    expect(recommend(SAM).recs[0].note.detail).toContain('If it were counted, PCV20 would be due on or after Jan 5, 2030 and would complete the series.');
  });
});
