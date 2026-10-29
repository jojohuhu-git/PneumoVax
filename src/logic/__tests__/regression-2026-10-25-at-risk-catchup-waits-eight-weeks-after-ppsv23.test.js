// 2026-10-25 — the at-risk 24-71 month catch-up card counts its 8 weeks from
// the most recent PNEUMOCOCCAL dose, not the most recent PCV.
//
// ── The defect ───────────────────────────────────────────────────────────
//
// CDC's at-risk "Age 2-5 years" row states TWO intervals:
//
//   "Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after the most
//    recent dose and administered at least 8 weeks apart)"
//
// The card implemented only the second. Its date came from `anchorPcv`, so a
// 4-year-old with asplenia whose only pneumococcal dose was a PPSV23 24 days
// ago was told her first PCV was due TODAY — on a card quoting "at least 8
// weeks after the most recent dose" directly underneath. The citation and the
// date on one card contradicted each other.
//
// Measured over the grid: 225 patients were advised a PCV sooner than 8 weeks
// after a counting PPSV23, every one of them aged 2 or 5. ZERO were aged 6 or
// over, because the 6-18 block already anchors on `anchorPneumo` — which is
// also why an 8-year-old and a 4-year-old with identical histories were given
// different answers, and how the defect was found.
//
// ── Scope, which is narrower than the defect ─────────────────────────────
//
// OWNER RULING 2026-10-25: "yes PPSV recs should apply at the earliest age of
// 2 years, this is the minimum approved age." That settles the AGE. It does
// not license anchoring every card on a PPSV23, and two cases are deliberately
// left alone because no document states the interval for them:
//
//   the 3-doses-before-12-months row  ACIP 2023: "one dose of either PCV15 or
//                                     PCV20 is recommended at least 8 weeks
//                                     after the last PCV dose". PCV, not dose.
//   a HEALTHY child's catch-up        CDC's healthy row gives no interval,
//                                     p2016 says "after most recent PCV dose",
//                                     and the catch-up job aid (Jan 2025) says
//                                     "Give Dose 1 today" — it counts previous
//                                     PCV doses and never mentions PPSV23.
//
// 192 of the 225 are fixed. The 33 left are pinned below BY NUMBER, so that
// widening the anchor fails this test rather than passing it quietly. They are
// an open question for the owner, not an oversight.
//
// ⚠ THE RULE IS NOT A SECOND INTERVAL. Both clocks carry the same 8 weeks, so
// the fix is the LATER ANCHOR and nothing else: `anchorPcv` keeps RULING D's
// reading (the dose the patient GOT, including one that did not count) and the
// PPSV23 side keeps ANCHOR-1's (counting doses only). A rule that re-read the
// interval per stream would be the P0 bug's own shape.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-10-25';
const pcvCards = (res) => (res.recs ?? []).filter((r) => r.vaccine === 'PCV');
/** The date the card actually advises: today when due, else the held date. */
const advised = (rec, today) => (rec.dueToday ? today : rec.earliestNextDate);

describe('an at-risk child\'s catch-up waits 8 weeks after a PPSV23', () => {
  // Noor, 4, asplenia. PPSV23 on 1 Oct and no conjugate ever — CDC's "less
  // than 3 PCV doses" row exactly.
  const noor = {
    dob: '2022-10-01', ageMonths: 48, today: TODAY,
    pcvDoses: [],
    ppsv23Doses: [{ date: '2026-10-01' }],
    riskIds: ['asplenia'],
  };
  // Maya, the same history eight years older, in the 6-18 block. She was
  // always right; she is the control that proves the fix did not reach her.
  const maya = { ...noor, dob: '2018-10-01', ageMonths: 96 };

  it('holds the dose to the PPSV23 + 8 weeks instead of advising it today', () => {
    const card = pcvCards(recommend(noor))[0];
    expect(card.dueToday).toBe(false);
    // 1 Oct + 56 days. Named as a date rather than recomputed from a constant,
    // because the arithmetic being tested is exactly that addition.
    expect(card.earliestNextDate).toBe('2026-11-26');
  });

  it('gives the 4-year-old and the 8-year-old the same date', () => {
    const young = pcvCards(recommend(noor)).map((r) => r.earliestNextDate);
    const old = pcvCards(recommend(maya)).map((r) => r.earliestNextDate);
    expect(young.every((d) => d === '2026-11-26')).toBe(true);
    expect(old.every((d) => d === '2026-11-26')).toBe(true);
  });

  it('states both of CDC\'s intervals on the card, not just the second', () => {
    const card = pcvCards(recommend(noor))[0];
    const lead = typeof card.note === 'string' ? card.note : card.note.lead;
    expect(lead).toContain('after the most recent pneumococcal dose');
    expect(lead).toContain('apart');
  });

  // ── OWNER DECISION 2026-10-29 — the two pinned exclusions are REVERSED ──
  //
  // The two cases below were deliberately left on their PCV anchor on
  // 2026-10-25, because no document states the PPSV23 clock for them. The
  // owner was shown all three children side by side on 2026-10-29 — the
  // healthy child, the 3-infant-doses child, and Noor as the control who was
  // already waiting — and ruled that BOTH should wait too. Her reason is the
  // inconsistency itself: one PPSV23, three children, two different answers.
  //
  // ⚠ SO THE PPSV23 CLOCK IS HERS ON THESE TWO CARDS, NOT CDC'S, and each
  // card says so in its own words. No document's quote was widened to cover
  // it. See CLINICAL_SPEC.md §C-PPSV23ANCHOR.
  it('holds a healthy child\'s catch-up to 8 weeks after her PPSV23', () => {
    const healthy = { ...noor, riskIds: [] };
    const card = pcvCards(recommend(healthy))[0];
    expect(card.dueToday).toBe(false);
    expect(card.earliestNextDate).toBe('2026-11-26');
  });

  it('gives the healthy child and her at-risk twin the SAME date', () => {
    // The inconsistency she ruled on, asserted directly: the only difference
    // between these two children is a risk condition, and the PPSV23 clock
    // does not depend on it.
    const healthy = pcvCards(recommend({ ...noor, riskIds: [] }))[0];
    const atRisk = pcvCards(recommend(noor))[0];
    expect(healthy.earliestNextDate).toBe(atRisk.earliestNextDate);
  });

  it('says on the healthy card that the PPSV23 is what is holding the dose', () => {
    // A date that moved with no sentence explaining it is the defect this
    // whole file exists about, pointed the other way.
    const card = pcvCards(recommend({ ...noor, riskIds: [] }))[0];
    const lead = typeof card.note === 'string' ? card.note : card.note.lead;
    expect(lead).toMatch(/Held to 8 weeks after this child's PPSV23 of Oct 1, 2026/);
    expect(card.note.detail).toMatch(/this app's own determination/);
  });

  it('holds the 3-doses-before-12-months row to its PPSV23 too', () => {
    // Three conjugate doses in infancy, then a PPSV23 three weeks ago.
    const child = {
      dob: '2022-10-01', ageMonths: 48, today: TODAY,
      pcvDoses: [
        { product: 'PCV13', date: '2022-12-01' },
        { product: 'PCV13', date: '2023-02-01' },
        { product: 'PCV13', date: '2023-04-01' },
      ],
      ppsv23Doses: [{ date: '2026-10-04' }],
      riskIds: ['asplenia'],
    };
    const card = pcvCards(recommend(child))[0];
    expect(card.dueToday).toBe(false);
    // 4 Oct + 56 days. Her last PCV was April 2023, so before this ruling the
    // clock had long since run out and the card said "due today".
    expect(card.earliestNextDate).toBe('2026-11-29');
    expect(card.note.lead).toMatch(/Held to 8 weeks after this child's PPSV23 of Oct 4, 2026/);
    expect(card.note.detail).toMatch(/this app's own determination/);
  });

  it('leaves both cards alone for a child with no PPSV23 at all', () => {
    // The control. `mostRecent` drops a null, so a child with nothing to wait
    // for is untouched — and these two cards are the ones this ruling moved,
    // so if the anchor were wired wrongly she would be held for no reason.
    //
    // ⚠ BOTH CARDS' WORDING IS ASSERTED, not just their dates, and not just
    // the at-risk one. The first draft checked the healthy card's date and
    // only the at-risk card's sentence — so forcing the healthy card's
    // `ppsvHolds` to a constant `true` broke NOTHING, and a child with no
    // PPSV23 at all would have been shown "Held to 8 weeks after this child's
    // PPSV23 of" followed by a formatted null. Found by mutating.
    const healthyNoPpsv = { ...noor, riskIds: [], ppsv23Doses: [] };
    const healthyCard = pcvCards(recommend(healthyNoPpsv))[0];
    expect(healthyCard.dueToday).toBe(true);
    expect(healthyCard.note.lead).not.toMatch(/Held to/);
    expect(healthyCard.note.detail).not.toMatch(/this app's own determination/);
    const riskyNoPpsv = {
      dob: '2022-10-01', ageMonths: 48, today: TODAY,
      pcvDoses: [
        { product: 'PCV13', date: '2022-12-01' },
        { product: 'PCV13', date: '2023-02-01' },
        { product: 'PCV13', date: '2023-04-01' },
      ],
      ppsv23Doses: [], riskIds: ['asplenia'],
    };
    const card = pcvCards(recommend(riskyNoPpsv))[0];
    expect(card.dueToday).toBe(true);
    expect(card.note.lead).not.toMatch(/Held to/);
  });
});

describe('the whole grid', () => {
  // The sweep runs once; both assertions read the same pass.
  const rows = [];
  for (const c of buildCases()) {
    const inp = c.input;
    if (inp.ageMonths >= 228) continue;
    const out = recommend(inp);
    if (out.excluded) continue;
    const ppsv = out.orderedDoses.ppsv23
      .map((d, i) => ({ ...d, ...out.perDose.ppsv23[i] }))
      .filter((d) => d.status === 'valid' && !d.recordProblem && d.date);
    if (!ppsv.length) continue;
    const floor = addDays(ppsv.map((d) => d.date).sort().at(-1), 56);
    const early = pcvCards(out).some((r) => {
      const a = advised(r, CORPUS_TODAY);
      return a != null && a < floor;
    });
    if (early) rows.push({ key: c.key, risky: (inp.riskIds ?? []).length > 0 });
  }

  it('advises NO child a PCV inside 8 weeks of a counting PPSV23', () => {
    // ZERO. This read 33 until 2026-10-29, pinned exactly so that anchoring
    // those rows could not happen quietly, because it needed the owner's
    // word. She gave it on 2026-10-29, having been shown all three children
    // together, so the exception is closed. The pin stays a pin, pointing the
    // other way: a rise here means a card has slipped off the PPSV23 clock.
    expect(rows.length).toBe(0);
  });

  it('records that the 33 were ALL the healthy catch-up card, not two rows', () => {
    // ⚠ A CORRECTION, 2026-10-29. The comment above this sweep used to split
    // the 33 as "11 healthy children and 22 on the 3-doses-before-12-months
    // row", and that split was WRONG — `rows` tags a patient `risky` with
    // `riskIds.length > 0`, and **smoking and alcoholism are adult-only risk
    // factors**, so a 24-month-old with alcoholism ticked was counted as
    // at-risk. Measured after the fix: all 33 moved verdicts are the healthy
    // catch-up card; 11 have a literally empty risk list and 22 have only an
    // adult-only id. ZERO are the 3-doses row.
    //
    // That row is reached by **0 grid patients** — asserted below — so the
    // sweep is not a guard for it and the hand-built child in the block above
    // is its only coverage. Quoting the sweep as cover for both rows is the
    // mistake this assertion exists to stop.
    let reaches = 0;
    for (const c of buildCases()) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      if ((out.recs ?? []).some((r) => r.doseLabel === '1 dose PCV (at-risk catch-up)')) reaches += 1;
    }
    expect(reaches).toBe(0);
  });

  it('cannot reach a SECOND counting PPSV23 on this card — pinned, not assumed', () => {
    // Recorded because a mutation proved it: swapping `ppsv.lastDate` for the
    // FIRST counting PPSV23 broke nothing anywhere in the suite. The reason is
    // arithmetic, not luck — a first PPSV23 cannot count before 24 months and a
    // second needs >=5 years after it, so two counting doses are impossible
    // before ~84 months, past this block's 71-month ceiling. Pinning it here
    // means that moving the ceiling fails a test instead of quietly making the
    // engine read the wrong dose.
    let reached = 0;
    for (const c of buildCases()) {
      const inp = c.input;
      if (inp.ageMonths < 24 || inp.ageMonths > 71) continue;
      const out = recommend(inp);
      if (out.excluded) continue;
      const counting = out.orderedDoses.ppsv23
        .map((d, i) => ({ ...d, ...out.perDose.ppsv23[i] }))
        .filter((d) => d.status === 'valid' && !d.recordProblem && d.date);
      if (counting.length > 1) reached += 1;
    }
    expect(reached).toBe(0);
  });

  it('never advises a child EARLIER than before — the fix only moves dates later', () => {
    // The direction check. A `mostRecent` that returned the EARLIER anchor
    // would put rows back below the floor, and `rows` is built by comparing
    // every PCV card in the grid against the PPSV23 floor it must respect.
    // With the 2026-10-29 exceptions closed there is nothing left that may sit
    // below it, so the assertion is simply that the list is empty — which the
    // test above states, and this one restates as a direction claim: no key
    // whatsoever, not merely no UNEXPECTED key.
    expect(rows.map((r) => r.key)).toEqual([]);
  });
});
