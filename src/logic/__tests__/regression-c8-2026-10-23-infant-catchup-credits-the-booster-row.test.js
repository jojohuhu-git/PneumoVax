/**
 * C8 — the infant catch-up card now credits CDC's notes for the half of the
 * sentence they actually state.
 *
 * ── THE CARD ──────────────────────────────────────────────────────────────
 *
 * A 6-month-old with FOUR PCV doses already on record, given four weeks apart
 * from age six weeks. None of them is the dose that closes the series, because
 * that one belongs at 12 months or later — so the app says: "Catch-up infant
 * PCV (PCV15 or PCV20): 5 doses in total for this child — the 4 already on
 * record, and the booster still owed at age 12-15 months."
 *
 * 220 cards (132 at ages 6-7 months, 88 at 12 months — now 132, see the
 * grid count below) listed CDC's
 * Child/Adolescent Notes with nothing pointing at it.
 *
 * ── WHY IT WAS UNCREDITED, AND WHY IT IS NOT A REMOVAL ────────────────────
 *
 * FINDING 2 (owner decision, 2026-10-18) moved this card's citation to MMWR
 * mm7137a3's Table 2, because a total of FIVE is stated by no document — p2016's
 * Table 1 and the MMWR table both stop at four — and crediting either for the
 * number 5 was the "card states a figure its quote never says" fault. That was
 * right, and it left CDC's notes on the card with no number.
 *
 * But the page does state the other half: "Routine vaccination with PCV 4-dose
 * series at 2, 4, 6, 12-15 months" — WHERE the last dose goes. So the new marker
 * sits on the booster clause and never on the total, which is FINDING 2's own
 * rule applied to the second document rather than a new rule. Counted live
 * 2026-10-23: that sentence occurs exactly once on the page.
 *
 * ── THE CONDITION THAT MATTERS ────────────────────────────────────────────
 *
 * The citation is added ONLY where the total exceeds four. At a total of four or
 * fewer the card's lead already cites this page, and one document must not take
 * two numbers on one card for one claim — the rule `mmwrNoneRowCites` and the
 * adult 8-week card already follow. The last test here is that condition.
 *
 * No dose, date or verdict moves: the only change is one [c] and one citation.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const TODAY = '2026-10-11';
const NOTES_URL = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo';

const shown = (rec) => {
  const s = noteCiteSlices(rec.note, rec.noteCites);
  return { lead: s.lead, detail: s.detail, all: [...s.lead, ...s.detail] };
};
const notesNumbers = (rec) => shown(rec).all.filter((c) => c.page === NOTES_URL);

/** A baby of `ageMonths` with four PCV13 doses four weeks apart from 6 weeks. */
function fourDoseInfant(ageMonths, dob) {
  return recommend({
    ageMonths,
    dob,
    today: TODAY,
    riskIds: [],
    pcvDoses: [
      { product: 'PCV13', date: '2026-05-23' },
      { product: 'PCV13', date: '2026-06-20' },
      { product: 'PCV13', date: '2026-07-18' },
      { product: 'PCV13', date: '2026-08-15' },
    ],
    ppsv23Doses: [],
  });
}

const catchupCard = (r) => (r.recs ?? []).find((x) => /doses in total for this child/.test(
  typeof x.note === 'string' ? x.note : x.note?.lead ?? '',
));

describe('C8 — the five-dose catch-up card credits the booster row', () => {
  it('a 6-month-old with four doses already given is owed a fifth, and both documents are numbered', () => {
    // Born 2026-04-11, so the first dose was at 6 weeks and the fourth at
    // about 4 months — four valid doses, none of them at 12 months or later.
    const card = catchupCard(fourDoseInfant(6, '2026-04-11'));
    expect(card, 'no catch-up card for this baby').toBeTruthy();
    expect(card.note.lead).toMatch(/5 doses in total for this child/);

    const s = shown(card);
    // The lead's number stays with MMWR, per FINDING 2.
    expect(s.lead.map((c) => c.key)).toEqual(['pedsInfantLastDose1215mo']);
    // The detail's new number is CDC's notes.
    expect(s.detail.map((c) => c.key)).toEqual(['pedsRoutine4Dose']);
    expect(notesNumbers(card)).toHaveLength(1);
  });

  it('the number sits on the booster clause, never on the total', () => {
    const card = catchupCard(fourDoseInfant(6, '2026-04-11'));
    // The clause the marker is attached to is the one CDC's sentence supports.
    expect(card.note.detail).toMatch(/the final\/booster dose is given at ≥12 months \[c\]/);
    // And the total carries no marker of its own beyond the lead's MMWR one.
    expect((card.note.lead.match(/\[c\]/g) ?? [])).toHaveLength(1);
    expect(shown(card).detail[0].quote).toBe('Routine vaccination with PCV 4-dose series at 2, 4, 6, 12–15 months');
  });

  it('a routine 4-dose baby does NOT get a second number for the same page', () => {
    // One dose at 2 months: the total is four, the lead already cites CDC's
    // notes, and the detail must not cite them again.
    const r = recommend({
      ageMonths: 4,
      dob: '2026-06-11',
      today: TODAY,
      riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2026-08-11' }],
      ppsv23Doses: [],
    });
    const card = (r.recs ?? []).find((x) => /4-dose series at 2, 4, 6, and 12–15 months/.test(
      typeof x.note === 'string' ? x.note : x.note?.lead ?? '',
    ));
    expect(card, 'no routine infant card for this baby').toBeTruthy();
    expect(notesNumbers(card)).toHaveLength(1);
    expect(card.note.detail).not.toMatch(/\[c\]/);
  });

  it('every five-dose catch-up card in the grid credits the notes, and there are 132', () => {
    // WAS 220 UNTIL 2026-10-23, and the 88 that went are not a regression here.
    // The owner made CDC Catch-up Table 2 the validity floor that day, so a
    // third dose given 4 weeks after a dose at 7-11 months stopped counting —
    // and the 88 twelve-month-olds in this class were exactly such patients.
    // With three counting doses instead of four they are no longer five-dose
    // children at all; they now hold a 4-dose target. Nothing about the
    // citation changed, only who reaches the card.
    //
    // The 132 that remain are the 6-7-month-olds, whose four doses were all
    // given before 7 months at 4-week gaps — valid infant doses under the same
    // ruling ("treat it as an extra infant dose", owner, 2026-10-23).
    let cards = 0;
    const missing = [];
    const doubled = [];
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        const lead = typeof rec.note === 'string' ? rec.note : rec.note?.lead ?? '';
        if (!/5 doses in total for this child/.test(lead)) continue;
        cards += 1;
        const n = notesNumbers(rec).length;
        if (n === 0) missing.push(c.key);
        if (n > 1) doubled.push(c.key);
      }
    }
    expect(cards).toBe(132);
    expect(missing.slice(0, 5)).toEqual([]);
    expect(doubled.slice(0, 5)).toEqual([]);
  });

  it('no card anywhere gives the SAME sentence two numbers', () => {
    // The right invariant, and it took a failed sweep to find it. Citing CDC's
    // notes TWICE on one card is correct when the two markers are two different
    // sentences, each carrying its own claim — 1,584 "not indicated" cards cite
    // the healthy catch-up row and the risk-condition list, and 64 "series
    // complete" cards cite the routine series and the at-age-2 follow-on. What
    // is never right is one SENTENCE numbered twice on a card, which is what
    // adding this citation unconditionally would have done to the routine
    // 4-dose card. That is the invariant swept here.
    const offenders = new Map();
    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        const keys = shown(rec).all.map((x) => x.key);
        for (const k of new Set(keys)) {
          const n = keys.filter((x) => x === k).length;
          if (n > 1) offenders.set(`${c.key} — ${rec.doseLabel} — ${k} x${n}`, n);
        }
      }
    }
    expect([...offenders.entries()].slice(0, 5)).toEqual([]);
  });
});
