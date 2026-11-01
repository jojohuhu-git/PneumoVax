// §C-P2-ONE (OWNER RULING 2026-10-31, on "Leah"). A child's only PPSV23,
// thrown out for coming too soon after a PCV: PCV20 only, with a note.
//
// Leah, 7, diabetes, never vaccinated: PCV15 Aug 31, PPSV23 Oct 21 — 51 days,
// 5 short of the 8 weeks CDC requires after a PCV, so it does not count. Her
// card offered "Option A PCV20 today / Option B PPSV23 today", and a PPSV23
// recorded today was then thrown out by the repeat rule (8 weeks from the
// invalid dose, the Sam/Noah ruling) — while the chip under the Oct 21 dose
// said the next dose could be given "from Dec 16, 2026 at the earliest".
// Two dates for one dose on one screen.
//
// Asked, she first asked whether a PPSV23 that did not count holds off a
// PCV20 (no — her own Eli ruling, "Count it"; no document says either way),
// then chose "PCV20 only + note": a second polysaccharide shot is avoided and
// PCV20 completes the series (CDC/ACIP 2023). The same shape as the Sam, Max
// and Noah "PCV20 only" ruling, which covers two shots, now for one.
//
// SCOPED to the patients she worked: an at-risk child 2-18 whose ONLY PPSV23
// was thrown out by `CHILD-PPSV23-AFTER-PCV`, on the Option A PCV20 / Option
// B PPSV23 card. A single PPSV23 thrown out for being given under age 2, and
// the 24-71-month catch-up card, are NOT covered — both are pinned unchanged
// below so a widening fails here.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addDays, addCalendarMonths } from '../dateUtils.js';

const TODAY = '2026-10-31';

function leah(overrides = {}) {
  return recommend({
    dob: '2019-08-15', ageMonths: 86, today: TODAY, riskIds: ['diabetes'],
    pcvDoses: [{ product: 'PCV15', date: '2026-08-31' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-21' }],
    ...overrides,
  });
}
const live = (out) => out.recs.filter((r) => !['complete', 'not-indicated'].includes(r.status));

describe('§C-P2-ONE — Leah', () => {
  const out = leah();

  it('her PPSV23 still does not count', () => {
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(out.perDose.ppsv23[0].intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
  });

  it('one card: PCV20, due today, and nothing else', () => {
    const cards = live(out);
    expect(cards).toHaveLength(1);
    expect(cards[0].vaccine).toBe('PCV');
    expect(cards[0].doseLabel).toBe('1 dose PCV20 (≥8 weeks) — completes the series');
    expect(cards[0].dueToday).toBe(true);
    expect(out.recs.some((r) => r.vaccine === 'PPSV23')).toBe(false);
  });

  it('the note says her PPSV23 did not count and why none is offered', () => {
    const { lead, detail } = live(out)[0].note;
    expect(lead).toContain('**Give 1 dose of PCV20**');
    expect(lead).toContain('that completes the series');
    expect(lead).toContain('No further PPSV23: 1 PPSV23 dose has been given and it did not count.');
    expect(detail).toBe('A PPSV23 is not offered: it would be a second PPSV23 shot.'
      + ' The row for this history is worded for PCV13. PCV13 and PCV15 can be used interchangeably'
      + ' for all recommendations, so it governs this child too [c].');
  });

  it('cites, in marker order: her CDC row, ACIP 2023, and the PCV13/PCV15 bridge', () => {
    const card = live(out)[0];
    expect(card.noteCites.map((c) => c.key)).toEqual(
      ['pedsRiskPcv13At6', 'cdcPcv20Children2023CompleteWithoutPcv20', 'pedsPcv13Pcv15Interchangeable'],
    );
    const markers = `${card.note.lead} ${card.note.detail}`.split('[c]').length - 1;
    expect(markers).toBe(card.noteCites.length);
  });

  it('the chip under the Oct 21 dose no longer promises a date the card does not offer', () => {
    const chip = out.perDose.ppsv23[0].reasons.join(' ');
    expect(chip).not.toContain('Dec 16, 2026');
    expect(chip).not.toContain('can be given from');
    expect(chip).toContain('It is not repeated.');
  });

  it('a PCV20 given today counts and finishes her', () => {
    const after = leah({ pcvDoses: [{ product: 'PCV15', date: '2026-08-31' }, { product: 'PCV20', date: TODAY }] });
    expect(after.perDose.pcv[1].status).toBe('valid');
    expect(live(after)).toHaveLength(0);
  });
});

describe('§C-P2-ONE — the same family at other ages and risk classes', () => {
  // A 3-year-old with no spleen: full baby series, an extra PCV15 at 2, then
  // PPSV23 too soon after it. Immunocompromised, and under 6.
  const dob = '2023-07-15';
  const baby = [2, 4, 6, 12].map((m) => ({ product: 'PCV13', date: addCalendarMonths(dob, m) }));
  const pcv15 = addDays(TODAY, -61);
  for (const riskIds of [['asplenia'], ['cochlear_implant']]) {
    it(`3 years, ${riskIds[0]}: PCV20 only`, () => {
      const out = recommend({
        dob, ageMonths: 39, today: TODAY, riskIds,
        pcvDoses: [...baby, { product: 'PCV15', date: pcv15 }],
        ppsv23Doses: [{ product: 'PPSV23', date: addDays(pcv15, 51) }],
      });
      expect(out.perDose.ppsv23[0].intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
      const cards = live(out);
      expect(cards.map((c) => c.doseLabel)).toEqual(['1 dose PCV20 (≥8 weeks) — completes the series']);
      // PCV13 baby series: the before-6 row names no product, so no bridge.
      expect(cards[0].note.detail).toBe('A PPSV23 is not offered: it would be a second PPSV23 shot.');
    });
  }
});

describe('§C-P2-ONE — what it does NOT touch', () => {
  it('a PPSV23 that counted: the ordinary card, unchanged', () => {
    const out = leah({ ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-26' }] }); // 56 days
    expect(out.perDose.ppsv23[0].status).toBe('valid');
    expect(live(out).some((c) => c.doseLabel === '1 dose PCV20 (≥8 weeks) — completes the series')).toBe(false);
  });

  it('no PPSV23 yet: the Option A / Option B pair, unchanged', () => {
    const out = leah({ ppsv23Doses: [] });
    expect(live(out).map((c) => c.doseLabel.slice(0, 9))).toEqual(['Option A:', 'Option B:']);
  });

  it('the 24-71-month catch-up card: PCV20 or PCV15, unchanged (not her card)', () => {
    // At-risk 3-year-old, 2 baby doses, a catch-up PCV15, then PPSV23 too soon.
    const d = '2023-07-15';
    const c1 = addDays(TODAY, -61);
    const out = recommend({
      dob: d, ageMonths: 39, today: TODAY, riskIds: ['diabetes'],
      pcvDoses: [{ product: 'PCV13', date: addCalendarMonths(d, 2) }, { product: 'PCV13', date: addCalendarMonths(d, 4) },
        { product: 'PCV15', date: c1 }],
      ppsv23Doses: [{ product: 'PPSV23', date: addDays(c1, 51) }],
    });
    expect(out.perDose.ppsv23[0].intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
    const card = live(out)[0];
    expect(card.noteCites[0].key).toBe('pedsRiskIncompleteCatchup');
    expect(card.brands).toEqual(['PCV20 (Prevnar 20)', 'PCV15 (Vaxneuvance)']);
  });

  it('an adult whose childhood PPSV23 came too soon: the adult card, unchanged', () => {
    const out = recommend({
      dob: '2007-05-15', ageMonths: 233, today: TODAY, riskIds: ['diabetes'],
      pcvDoses: [{ product: 'PCV13', date: '2016-01-10' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2016-02-20' }],
    });
    expect(out.perDose.ppsv23[0].intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
    expect(live(out).map((c) => c.doseLabel)).toEqual(['PCV20 or PCV21 ≥1 year after PCV13 — completes the series']);
  });

  it('TWO thrown-out shots on the at/after-6 card: parked, unchanged', () => {
    // Her ruling is for one shot. The two-shot version of HER card was never
    // in the Sam/Max/Noah ruling either (it covered the before-6 rows), and
    // today it still offers a third PPSV23 as Option B. Parked for the owner,
    // not widened here — this pins it so a widening has to be decided.
    const out = leah({ ppsv23Doses: [{ product: 'PPSV23', date: '2026-09-20' }, { product: 'PPSV23', date: '2026-10-21' }] });
    expect(out.perDose.ppsv23.map((d) => d.status)).toEqual(['invalid', 'invalid']);
    expect(live(out).map((c) => c.doseLabel.slice(0, 9))).toEqual(['Option A:', 'Option B:']);
  });

  it('a single PPSV23 thrown out for being given before age 2: parked, unchanged', () => {
    // At-risk 2-year-old, full baby series, PPSV23 at 23 months (too young).
    const d = '2024-07-15';
    const out = recommend({
      dob: d, ageMonths: 27, today: TODAY, riskIds: ['diabetes'],
      pcvDoses: [2, 4, 6, 12].map((m) => ({ product: 'PCV13', date: addCalendarMonths(d, m) })),
      ppsv23Doses: [{ product: 'PPSV23', date: addCalendarMonths(d, 23) }],
    });
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(out.perDose.ppsv23[0].intervalRuleId).not.toBe('CHILD-PPSV23-AFTER-PCV');
    expect(live(out).some((c) => c.vaccine === 'PPSV23')).toBe(true);
  });
});
