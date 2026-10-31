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
//   Noah — no spleen; his first PPSV23 thrown out for SPACING (4 weeks after a
//          PCV), the repeat 6 weeks later thrown out too: "PCV20 only". No
//          grey-area note — CDC spaces a repeat from the invalid dose, plainly.
//   Kai  — 8, no spleen, NEVER a PCV; Sam's two PPSV23 shots. His card was
//          Option A PCV20 / B-1 PCV15 / B-2 PPSV23 (a third shot), and a
//          2-year-old like him was offered "2 doses of PCV20 or PCV15", with a
//          PPSV23 after PCV15. "PCV20 only + note", both cards.
//
// Noah's twin who is NOT immunocompromised is not a patient she saw. Both of
// her rulings that reach him (Max: not IC; Noah: spacing) point the same way,
// so he gets PCV20 only too — a judgement within them, listed in the PR.
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

describe('Noah — first PPSV23 thrown out for spacing, the repeat thrown out too', () => {
  const NOAH = {
    dob: '2021-01-01', ageMonths: 69, today: '2026-10-30', riskIds: ['asplenia'],
    pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01']),
    ppsv23Doses: d('PPSV23', ['2023-04-29', '2023-06-10']),
  };
  const out = recommend(NOAH);

  it('both PPSV23 shots stay thrown out (Ruling D, unchanged)', () => {
    expect(out.perDose.ppsv23.map((x) => x.intervalRuleId)).toEqual([
      'CHILD-PPSV23-AFTER-PCV', 'CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST',
    ]);
  });

  it('his card offers PCV20 only, and says why the PPSV23 is not offered', () => {
    expect(out.recs.map((r) => [r.vaccine, r.doseLabel])).toEqual([['PCV', ONE_PCV20]]);
    expect(out.recs[0].note.lead).toBe(SAM_LEAD);
    expect(out.recs[0].note.detail).toBe('A PPSV23 is not offered: it would be a third PPSV23 shot.');
    expect(out.recs[0].noteCites.map((c) => c.key)).toEqual([
      'pedsIcPcv20orPpsv23', 'cdcPcv20Children2023CompleteWithoutPcv20',
    ]);
  });

  it('no grey-area note anywhere — the rule is clear for him', () => {
    expect(JSON.stringify(out)).not.toContain('Grey area');
  });

  it('the chip under his repeat no longer promises a PPSV23 from Aug 5, 2023', () => {
    const chip = out.perDose.ppsv23[1].reasons.join(' ');
    expect(chip).toContain('It is not repeated.');
    expect(chip).not.toContain('Aug 5, 2023');
  });

  it('his twin who is NOT immunocompromised gets PCV20 only too (a judgement)', () => {
    const twin = recommend({ ...NOAH, riskIds: ['cochlear_implant'] });
    expect(twin.recs.map((r) => r.doseLabel)).toEqual([ONE_PCV20]);
    expect(twin.recs[0].noteCites[0].key).toBe('pedsRiskPcv20orPpsv23');
  });

  it('ONE thrown-out PPSV23 is untouched — the repeat is still offered', () => {
    const one = recommend({ ...NOAH, ppsv23Doses: d('PPSV23', ['2023-04-29']) });
    expect(one.recs.map((r) => r.doseLabel)).toEqual([
      'Option A: 1 dose PCV20 (≥8 weeks)', 'Option B: 1 dose PPSV23 (≥8 weeks)',
    ]);
  });
});

const greyHead = (date) => `Grey area: CDC says a dose given under the minimum age is repeated on or after that age, and states no gap from the invalid dose for a vaccine that is not live. ACIP does not address this case. This app spaces the repeat 8 weeks from the invalid dose, so the ${date} dose is not counted.`;

describe('Kai — 8, no spleen, never a PCV: the 6-18 three-option card', () => {
  const KAI = {
    dob: '2017-01-01', ageMonths: 106, today: '2025-11-01', riskIds: ['asplenia'],
    pcvDoses: [], ppsv23Doses: d('PPSV23', ['2018-12-01', '2019-01-05']),
  };
  const out = recommend(KAI);
  const TAIL = ' If it were counted, PCV15 could be offered too, with no PPSV23 after it.';

  it('one card: PCV20 only — no PCV15, no PPSV23', () => {
    expect(out.recs.map((r) => [r.vaccine, r.doseLabel, r.brands])).toEqual([
      ['PCV', '1 dose PCV20 (≥8 weeks)', ['PCV20 (Prevnar 20)']],
    ]);
    expect(out.recs[0].dueToday).toBe(true);
  });

  it('the card says why, then the grey area, ending in what is true for him', () => {
    expect(out.recs[0].note.lead).toBe('**Give 1 dose of PCV20**, ≥8 weeks after the most recent pneumococcal vaccine [c] [c]. No further PPSV23: 2 PPSV23 doses have been given and neither counted.');
    expect(out.recs[0].note.detail).toBe(`PCV15 is not offered: after it a PPSV23 would be owed — a third PPSV23 shot. ${withCites(greyHead('Jan 5, 2019'))}${TAIL}`);
    expect(out.recs[0].noteCites.map((c) => c.key)).toEqual([
      'pedsIc6to18NoPcv', 'p2016NoPriorPcv6to18OptionA',
      'cdcGbpRepeatUnderMinAge', 'cdcGbpLiveVaccine28Days',
    ]);
  });

  it('the chip under his repeat names the grey area and promises no PPSV23', () => {
    const chip = out.perDose.ppsv23[1].reasons.join(' ');
    expect(chip).toContain(greyHead('Jan 5, 2019') + TAIL);
    expect(chip).not.toContain('Mar 2, 2019');
  });

  it('his twin who is NOT immunocompromised reads the same, with the non-IC row (a judgement)', () => {
    const twin = recommend({ ...KAI, riskIds: ['cochlear_implant'] });
    expect(twin.recs.map((r) => r.doseLabel)).toEqual(['1 dose PCV20 (≥8 weeks)']);
    expect(twin.recs[0].noteCites[0].key).toBe('pedsRisk6to18NoPcv');
  });
});

describe('Kai at 2 — the at-risk catch-up card', () => {
  const KAI2 = { ...SAM, pcvDoses: [] };
  const out = recommend(KAI2);

  it('2 doses of PCV20 — PCV15 no longer offered', () => {
    expect(out.recs.map((r) => [r.doseLabel, r.brands])).toEqual([
      ['PCV dose 1 of 2 (at-risk catch-up)', ['PCV20 (Prevnar 20)']],
    ]);
    expect(out.recs[0].note.lead).toBe('Give 2 doses of PCV20, ≥8 weeks after the most recent pneumococcal dose and ≥8 weeks apart [c] [c].');
  });

  it('"Why this" swaps the PCV15 sentence for why it is not offered, then the grey area', () => {
    expect(out.recs[0].note.detail).toBe(`This is the at-risk catch-up for a child 24–71 months with fewer than 3 PCV doses by 24 months. These doses are additional to any infant doses. PCV15 is not offered: it would need a PPSV23 after it [c] — a third PPSV23 shot. ${withCites(greyHead('Jan 5, 2025'))}`);
    expect(out.recs[0].noteCites.map((c) => c.key)).toEqual([
      'pedsRiskIncompleteCatchup', 'p2016AtRiskCatchup24to71Incomplete', 'p2016Pcv15NeedsFurtherDoses',
      'cdcGbpRepeatUnderMinAge', 'cdcGbpLiveVaccine28Days',
    ]);
  });

  it('the chip names the grey area, with no "if it were counted" sentence (none is true for every child here)', () => {
    const chip = out.perDose.ppsv23[1].reasons.join(' ');
    expect(chip).toContain(greyHead('Jan 5, 2025'));
    expect(chip).not.toContain('If it were counted');
    expect(chip).not.toContain('Mar 2, 2025');
  });

  it('the 3-doses-before-12-months row reads the same way', () => {
    const r = recommend({ ...SAM, pcvDoses: d('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01']) }).recs;
    expect(r.map((x) => [x.doseLabel, x.brands])).toEqual([['1 dose PCV (at-risk catch-up)', ['PCV20 (Prevnar 20)']]]);
    expect(r[0].note.lead).toBe('Give 1 dose of PCV20, ≥8 weeks after the most recent PCV [c] [c].');
    expect(r[0].note.detail).toBe(`This is the at-risk catch-up for a child 24–71 months who had 3 PCV doses, all before 12 months. PCV15 is not offered: it would need a PPSV23 after it [c] — a third PPSV23 shot. ${withCites(greyHead('Jan 5, 2025'))}`);
  });

  it('a repeat thrown out for SPACING on this card: PCV20 only, no grey area (a judgement)', () => {
    const r = recommend({ ...SAM, pcvDoses: d('PCV13', ['2023-03-01', '2023-05-01', '2025-02-01']),
      ppsv23Doses: d('PPSV23', ['2025-02-15', '2025-04-05']) });
    expect(r.perDose.ppsv23[1].intervalRuleId).toBe('CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST');
    expect(r.recs.map((x) => x.brands)).toEqual([['PCV20 (Prevnar 20)']]);
    expect(r.recs[0].note.detail).toContain('PCV15 is not offered: it would need a PPSV23 after it [c] — a third PPSV23 shot.');
    expect(JSON.stringify(r)).not.toContain('Grey area');
  });
});
