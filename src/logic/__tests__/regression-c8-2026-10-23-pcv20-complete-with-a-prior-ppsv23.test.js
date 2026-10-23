/**
 * C8 — the last uncredited statement in CDC's child notes, and the OWNER
 * DECISION of 2026-10-23 that reversed half of FINDING K to settle it.
 *
 * ── THE PATIENT ───────────────────────────────────────────────────────────
 *
 * A 6-year-old with asplenia: PCV20 at age 5, then PPSV23 eight weeks later.
 * Nothing since. The app says no additional PCV or PPSV23 doses are needed, and
 * every document agrees — the dose was never in question. What was in question
 * is why CDC's Child/Adolescent Notes appeared under the card at all, with no
 * number pointing at anything. 40 cards: 25 with chronic conditions, 15
 * immunocompromising.
 *
 * ── THE ARGUMENT ON 2026-10-18, AND WHY IT WAS PUT TO HER ─────────────────
 *
 * FINDING K took this page off these 40 cards on the reasoning that CDC's
 * sub-bullet "Previously received at least 1 dose of PCV20: no further PCV or
 * PPSV23 doses needed" is nested under the parent "Received PCV before age 6
 * years BUT HAVE NOT RECEIVED PPSV23", and this child has had one. Unlike the
 * row that settled the 145 "series complete" cards on 2026-10-23, this
 * sub-bullet ORDERS NO DOSE — so the child cannot have followed it, and the
 * usual "cite the row that was satisfied" answer does not reach it.
 *
 * ── HER RULING ────────────────────────────────────────────────────────────
 *
 * Shown that patient, she answered with a deep link to that very branch, parent
 * and sub-bullet together:
 *
 *   .../child-adolescent-notes.html#:~:text=Received%20PCV%20before,
 *   PPSV23%20doses%20needed
 *
 * So the parent's PPSV23 clause describes the history that led to the dose, not
 * a patient the row refuses to cover. The chip stays and takes a number.
 *
 * ── WHAT IS **NOT** REVERSED ──────────────────────────────────────────────
 *
 * FINDING K's other 864 cards, where no conjugate was given before age 6 (the
 * PCV20 came at 17 or 18). The parent's AGE condition still bars them, and
 * `regression-finding-k-...` still fails if they come back. That file now pins
 * this exception at exactly 40 so it cannot grow unnoticed.
 *
 * ── THE BRANCH THE GRID CANNOT REACH ──────────────────────────────────────
 *
 * CDC prints this sub-bullet under "Age 2-5 years" as well, so the engine picks
 * by age band. Deleting that split broke NO test — because no grid patient
 * reaches this card below 72 months. It is live code all the same: a 4-year-old
 * with chronic heart disease who had the at-risk catch-up as two PCV20 doses at
 * age 2 and a PPSV23 eight weeks later gets here, and the fourth test below is
 * that patient, asserted directly because the grid cannot express her.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const TODAY = '2026-10-11';
const NOTES_URL = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo';
const CARD = 'PCV complete (includes PCV20)';

const shown = (rec) => {
  const s = noteCiteSlices(rec.note, rec.noteCites);
  return [...s.lead, ...s.detail];
};
const uncredited = (rec) => {
  const pointedAt = new Set(shown(rec).map((c) => c.page ?? c.key));
  return (rec.citations ?? []).filter((chip) => !pointedAt.has(chip.url)).map((chip) => chip.short);
};
const cardOf = (r) => (r.recs ?? []).find((x) => x.doseLabel === CARD);

/** The owner's patient: PCV20 at age 5, PPSV23 eight weeks later. */
const pcv20ThenPpsv23 = (riskIds) => recommend({
  ageMonths: 72,
  dob: '2020-10-11',
  today: TODAY,
  riskIds,
  pcvDoses: [{ product: 'PCV20', date: '2025-10-11' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2025-12-11' }], // 8 weeks + 2 days
});

describe('C8 — a prior PCV20 completes the series, and CDC is credited for saying so', () => {
  it('the 6-year-old with asplenia has a number for both documents', () => {
    const card = cardOf(pcv20ThenPpsv23(['asplenia']));
    expect(card, 'no complete card for this patient').toBeTruthy();
    expect(shown(card).map((c) => c.key)).toEqual([
      'pedsIcPcv20Complete',
      'p2016CompletedBefore6WithPcv20',
    ]);
    expect(uncredited(card)).toEqual([]);
  });

  it('the quote behind the number is the branch she linked', () => {
    const card = cardOf(pcv20ThenPpsv23(['asplenia']));
    const cdc = shown(card).find((c) => c.page === NOTES_URL);
    expect(cdc.quote).toBe('Previously received at least 1 dose of PCV20: no additional dose of PCV or PPSV23');
    // And the link carries a text fragment, so clicking the number lands on
    // the sentence rather than the top of a long page.
    expect(cdc.url).toContain('#:~:text=');
  });

  it('the card says in its own words why the row still covers him', () => {
    const card = cardOf(pcv20ThenPpsv23(['asplenia']));
    expect(card.note.detail).toMatch(/written for one who has not yet had PPSV23; this child has had one, which does not change the answer/);
  });

  it('a chronic-condition child gets the NON-immunocompromising wording', () => {
    // CDC words the two lists differently — "no further PCV or PPSV23 doses
    // needed" against "no additional dose of PCV or PPSV23" — and the quote a
    // card shows must come from its own patient's list.
    const card = cardOf(pcv20ThenPpsv23(['chronic_heart']));
    expect(card).toBeTruthy();
    expect(shown(card).map((c) => c.key)).toContain('pedsRiskPcv20Complete');
    expect(shown(card).find((c) => c.page === NOTES_URL).quote)
      .toBe('Previously received at least 1 dose of PCV20: no further PCV or PPSV23 doses needed');
  });

  it('a 4-year-old on this card is quoted the Age 2-5 instance instead', () => {
    // The branch the grid cannot express: deleting the age split below breaks
    // no sweep, so this patient is the guard. At-risk catch-up given as two
    // PCV20 doses eight weeks apart at age 2, then PPSV23 eight weeks later.
    const r = recommend({
      ageMonths: 48,
      dob: '2022-10-11',
      today: TODAY,
      riskIds: ['chronic_heart'],
      pcvDoses: [
        { product: 'PCV20', date: '2024-10-11' },
        { product: 'PCV20', date: '2024-12-11' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-02-11' }],
    });
    const card = cardOf(r);
    expect(card, 'no complete card for the 4-year-old').toBeTruthy();
    expect(shown(card).map((c) => c.key)).toEqual([
      'pedsRiskPcv20CompleteAt2',
      'p2016CompletedBefore6WithPcv20',
    ]);
    // Not the Age 6-18 entries, which are about an older child.
    expect(shown(card).map((c) => c.key)).not.toContain('pedsRiskPcv20Complete');
    expect(shown(card).map((c) => c.key)).not.toContain('pedsIcPcv20Complete');
  });

  it('all 40 cards in the grid are credited, and nothing else moved', () => {
    let affected = 0;
    const strays = new Map();
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        if (rec.doseLabel !== CARD) continue;
        // Only the group that has a PPSV23 on record is this item's.
        const ppsv = (res.orderedDoses?.ppsv23 ?? [])
          .filter((_, i) => {
            const v = res.perDose?.ppsv23?.[i];
            return v && v.status !== 'invalid' && v.status !== 'noncounting';
          }).length;
        if (ppsv === 0) continue;
        if (!/which does not change the answer/.test(rec.note?.detail ?? '')) continue;
        affected += 1;
        for (const short of uncredited(rec)) strays.set(short, (strays.get(short) ?? 0) + 1);
      }
    }
    expect(affected).toBe(40);
    expect([...strays.entries()]).toEqual([]);
  });

  it('CDC\'s Child/Adolescent Notes now have no uncredited statement anywhere', () => {
    // The point of the whole item: this document started the session as 8
    // statements over 1,107 cards and ends it at zero. Swept over every card
    // the grid produces, so it cannot be true of one card and false of another.
    const strays = new Map();
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        const pointedAt = new Set(shown(rec).map((x) => x.page ?? x.key));
        for (const chip of rec.citations ?? []) {
          if (chip.url !== NOTES_URL || pointedAt.has(chip.url)) continue;
          strays.set(`${rec.doseLabel} — ${c.key}`, (strays.get(`${rec.doseLabel} — ${c.key}`) ?? 0) + 1);
        }
      }
    }
    expect([...strays.keys()].slice(0, 5)).toEqual([]);
  });
});
