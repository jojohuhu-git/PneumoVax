// C9 (2026-10-23) — the "this at-risk child is COMPLETE because PPSV23 has been
// given" cards, and the two OWNER DECISIONS that settled which document says so.
//
// Three card families make that claim. All three listed immunize.org p2016 as a
// grey button no number pointed at, and the owner was asked why. Her answers
// split the three apart, because the histories are not the same:
//
//   ── CASE 1, 840 cards — "p2016 comes off." ───────────────────────────────
//   An 18-year-old with a cochlear implant, PCV13 at age 8, PPSV23 at 13.
//   p2016's rows 8/9 DO fit her ("PCV13 only, given at or after age 6 years"),
//   but their Option B only ORDERS the PPSV23 she has had and says nothing
//   about what follows. The sentence that does — footnote § ("If PPSV23
//   previously given, then child is complete") — is the mark on rows 4/5's
//   history cell, "Completed PCV series BEFORE age 6 years". Her only conjugate
//   dose was at 8, so she fails that row's prior-dose column, and OWNER RULE
//   2026-10-18 requires every column to fit. Meanwhile CDC's Child/Adolescent
//   Notes state the WHOLE claim verbatim about exactly this patient. Nothing on
//   the card rested on p2016, so p2016 is not listed.
//
//   ── CASE 2, 20 cards — "p2016 doesn't cite this case. ────────────────────
//   ──             The MMWR pediatric PCV15 paper should." ─────────────────
//   A 24-month-old with a cochlear implant, three PCV13 doses at 17/19/21
//   months, PPSV23 given. Her card said "complete [1]" and [1] was CDC's
//   "administer 1 dose PCV20 or 1 dose PPSV23 ..." — an INSTRUCTION TO GIVE A
//   DOSE, hung on the word "complete". A clinician clicking [1] on a card
//   saying she needs nothing was shown an order for a dose.
//
//   Offered p2016's footnote § for that word, the owner declined it and quoted
//   ACIP mm7137a3 instead. Her reason is the one p2016 cannot match: § ASSERTS
//   completeness, while ACIP's pair EXPLAINS it —
//     "Children aged >=2 years with any risk conditions should receive PPSV23
//      after completing all recommended PCV doses (either PCV13 or PCV15).
//      These children should receive a single dose of PPSV23 at age >=2 years
//      and >=8 weeks after the most recent PCV dose."
//   and, in its own later subsection, a SECOND dose only for an
//   immunocompromising condition. One dose, and no second dose unless
//   immunocompromised, is exactly why this non-IC child is finished.
//
// TWO CARDS, NOT ONE — and this is the part the owner was not shown. The same
// claim is printed on a SECOND card for a 24-71-month-old whose at-risk
// catch-up is done (15 cards), worded differently. Fixing only the card she saw
// would have left two cards disagreeing about one clinical situation, so both
// are fixed; her spot-check is a sample (and has been before: one wrong chip she
// named turned out to be 13 of 17).
//
// WHAT MUST NOT MOVE. No dose, date, status or verdict changes on any of the
// three families. Measured over both grids with `scripts/proseDiff.mjs`: 860 of
// 35,280 rows differ, 0 added, 0 removed, 0 impossible entries — and field by
// field, 840 differ ONLY by the dropped p2016 chip (clinical sentence
// byte-identical) and 20 by the Case 2 rewording. Card counts before and after:
// 840 / 15 / 5.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { REFS } from '../../data/refs.js';
import { noteCiteSlices, markerCount } from '../../components/citations.jsx';
import { addCalendarMonths } from '../dateUtils.js';

const noteOf = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

const citesOf = (rec) => {
  const sl = noteCiteSlices(rec.note, rec.noteCites);
  return [...(sl.lead ?? []), ...(sl.detail ?? [])];
};

const chipShorts = (rec) => (rec.citations ?? []).map((c) => c.short || c.label);

/** The three families, by the words only each of them uses. */
const FAMILIES = {
  case1: /at\/after age 6 who has received PPSV23 — no further doses/,
  case2catchup: /24–71 months who has received the age-appropriate at-risk PCV catch-up/,
  case2series: /child who completed the PCV series and has received PPSV23 — complete/,
};

/** Every (case, rec) pair the real-patient grid produces, bucketed by family. */
const sweep = () => {
  const found = { case1: [], case2catchup: [], case2series: [] };
  for (const c of buildCases()) {
    let r;
    try { r = recommend(c.input); } catch { continue; }
    if (r.excluded) continue;
    for (const rec of r.recs ?? []) {
      const note = noteOf(rec);
      for (const [name, re] of Object.entries(FAMILIES)) {
        if (re.test(note)) found[name].push({ c, rec, note });
      }
    }
  }
  return found;
};

const FOUND = sweep();

/** CASE 1's patient, as the owner was shown her. */
const teenPcv13At8 = {
  ageMonths: 216,
  dob: '2008-10-11',
  today: '2026-10-11',
  riskIds: ['cochlear_implant'],
  pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-11' }],
};

/** CASE 2's patient, as the owner was shown her. */
const toddlerSeriesDonePlusPpsv = {
  ageMonths: 24,
  dob: '2024-10-11',
  today: '2026-10-11',
  riskIds: ['cochlear_implant'],
  pcvDoses: [
    { product: 'PCV13', date: '2026-03-01' },
    { product: 'PCV13', date: '2026-04-26' },
    { product: 'PCV13', date: '2026-06-21' },
  ],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
};

const cardFor = (input, family) => {
  const r = recommend(input);
  const hit = (r.recs ?? []).find((rec) => FAMILIES[family].test(noteOf(rec)));
  expect(hit, `no ${family} card for this patient`).toBeTruthy();
  return hit;
};

describe('C9 — the "complete because PPSV23 has been given" cards', () => {
  it('the ACIP sentence is recorded verbatim, contiguous, and about both at-risk groups', () => {
    const e = REFS.pedsRiskSinglePpsv23AfterPcv;
    // Read live 2026-10-23 under its own heading, "Administration of PPSV23
    // After PCV13 or PCV15 Among Persons Aged 2-18 Years with Risk Conditions".
    // The two sentences are CONSECUTIVE on the page and quoted as printed — a
    // joined non-contiguous string exists nowhere, which is what made
    // `pedsMinAge`'s deep link match nothing.
    expect(e.quote).toBe(
      'Children aged ≥2 years with any risk conditions should receive PPSV23 '
      + 'after completing all recommended PCV doses (either PCV13 or PCV15). '
      + 'These children should receive a single dose of PPSV23 at age ≥2 years '
      + 'and ≥8 weeks after the most recent PCV dose.',
    );
    expect(e.url).toBe('https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm');
    expect(e.rulebook).toBe('child');
    // Its own words are "any risk conditions" — both at-risk groups, and NOT
    // child-routine: a healthy child is never offered PPSV23 at all.
    expect([...e.population].sort()).toEqual(['child-IC', 'child-nonIC']);
    expect(e.population).not.toContain('child-routine');
  });

  // ── CASE 1 ─────────────────────────────────────────────────────────────
  it("CASE 1: the owner's 18-year-old keeps CDC's verbatim sentence and loses p2016", () => {
    const card = cardFor(teenPcv13At8, 'case1');
    expect(card.status).toBe('complete');
    expect(chipShorts(card)).not.toContain('immunize.org p2016');
    expect(chipShorts(card)).toContain('CDC Child/Adolescent Notes');
    // The claim is still cited — removing a document must not orphan a claim.
    const cites = citesOf(card);
    expect(cites.length).toBeGreaterThan(0);
    expect(cites[0].quote).toBe(
      'Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years: '
      + 'no further doses of any PCV or PPSV23 indicated.',
    );
  });

  it('CASE 1: no card in the grid shows that sentence with a p2016 button (840 cards)', () => {
    // was 840; -30, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
    // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
    // counting conjugate and her card family changes with it. The invariant
    // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
    expect(FOUND.case1.length).toBe(810);
    const withP2016 = FOUND.case1.filter(({ rec }) => chipShorts(rec).includes('immunize.org p2016'));
    expect(withP2016.length).toBe(0);
    // Anti-overreach: CDC must still be there on every one of them.
    const withoutCdc = FOUND.case1.filter(({ rec }) => !chipShorts(rec).includes('CDC Child/Adolescent Notes'));
    expect(withoutCdc.length).toBe(0);
  });

  // ── CASE 2 ─────────────────────────────────────────────────────────────
  it("CASE 2: the owner's 2-year-old cites ACIP for 'complete' and CDC for the choice", () => {
    const card = cardFor(toddlerSeriesDonePlusPpsv, 'case2series');
    expect(card.status).toBe('complete');
    const cites = citesOf(card);
    // ORDER MATTERS, because the marker's position is what it claims. The first
    // [c] sits on "complete" and must be ACIP's single-dose sentence; the
    // second sits on the sentence about the row she FOLLOWED.
    expect(cites[0].quote).toBe(REFS.pedsRiskSinglePpsv23AfterPcv.quote);
    expect(cites[1].doc).toBe('CDC Child/Adolescent Notes');
    // The card now says the dose on record IS the one that row called for —
    // the owner's 2026-10-23 rule. Without this the CDC number reads as an
    // order for a dose on a card that says none is needed.
    expect(noteOf(card)).toContain('the dose on record is that dose');
    expect(chipShorts(card)).not.toContain('immunize.org p2016');
    expect(chipShorts(card)).toContain('PCV15 Children MMWR');
  });

  it('CASE 2: the sibling 24–71-month card makes the same claim from the same source', () => {
    // THE WHOLE SURFACE. One clinical situation, two differently-worded cards.
    // A fix to only the card the owner saw would leave these 15 reading
    // differently from those 5.
    const fiveYearOld = {
      ageMonths: 60,
      dob: '2021-10-11',
      today: '2026-10-11',
      riskIds: ['cochlear_implant'],
      pcvDoses: [
        { product: 'PCV13', date: '2026-03-01' },
        { product: 'PCV13', date: '2026-04-26' },
        { product: 'PCV13', date: '2026-06-21' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    };
    const card = cardFor(fiveYearOld, 'case2catchup');
    expect(card.status).toBe('complete');
    const quotes = citesOf(card).map((c) => c.quote);
    expect(quotes).toContain(REFS.pedsRiskSinglePpsv23AfterPcv.quote);
    expect(chipShorts(card)).not.toContain('immunize.org p2016');
  });

  it('CASE 2: an immunocompromised child CAN now reach the 24\u201371-month card, and is worded as one', () => {
    // ⚠️ P2 (2026-10-30) MADE THIS REACHABLE — the event this guard existed to
    // catch. An immunocompromised child's early second PPSV23 now COUNTS
    // (owner ruling 2026-10-29), so the arithmetic below no longer holds and
    // 43 of the combinations searched land on this card. The card was given an
    // IC wording in the same change (recommend.js, "Noah"), so this test now
    // asserts the opposite of its old claim and pins the count, and the
    // wording every one of them gets. The old reasoning is kept below, because
    // it is why the wording did not exist until today.
    //
    // THE CORRECTION. An earlier draft of this change added an `isIC` wording
    // branch to that card, on the premise that its gate
    // (`isIC ? ppsv.count >= 2 : ppsv.count >= 1`) let an IC child through to a
    // note hard-coded "(non-immunocompromising)". That premise was FALSE, and
    // the honest resolution is this test rather than a branch nothing can
    // execute.
    //
    // It is unreachable by arithmetic, not by luck of the grid: a first PPSV23
    // does not count before age 24 months, and a second needs >=5 years after
    // it (`CHILD-PPSV23-AFTER-PPSV23`, 4-day grace), so two counting PPSV23
    // doses are impossible before about age 84 months — past this block's
    // 71-month ceiling.
    //
    // Exhaustive, not sampled: every age 24-71 crossed with every ordered pair
    // of PPSV23 dates from birth to today.
    const today = '2026-10-11';
    let reachable = 0;
    for (let age = 24; age <= 71; age++) {
      const dob = addCalendarMonths(today, -age);
      const pcv = [7, 5, 3].map((back) => ({
        product: 'PCV13', date: addCalendarMonths(dob, Math.max(0, age - back)),
      }));
      for (let a1 = 0; a1 <= age; a1++) {
        for (let a2 = a1 + 1; a2 <= age; a2++) {
          const r = recommend({
            ageMonths: age, dob, today, riskIds: ['asplenia'], pcvDoses: pcv,
            ppsv23Doses: [
              { product: 'PPSV23', date: addCalendarMonths(dob, a1) },
              { product: 'PPSV23', date: addCalendarMonths(dob, a2) },
            ],
          });
          const hit = (r.recs ?? []).find((rec) => FAMILIES.case2catchup.test(noteOf(rec)));
          if (hit) {
            reachable++;
            expect(noteOf(hit)).toMatch(/^At-risk immunocompromised child 24–71 months/);
            expect(noteOf(hit)).not.toMatch(/non-immunocompromising/);
            expect(hit.noteCites.map((c) => c.key)).toEqual(['pedsIcPcv20orPpsv23']);
          }
        }
      }
    }
    expect(reachable).toBe(43);
    // And in the GRID every card of this family is still a non-IC patient: the
    // grid dates no two PPSV23 doses inside five years, so it cannot build the
    // 43 above. That is why they are asserted here by exhaustive search.
    const IC = new Set(['asplenia', 'hiv']);
    const icCards = FOUND.case2catchup.filter(({ c }) => c.input.riskIds.some((x) => IC.has(x)));
    expect(icCards.length).toBe(0);
  });

  // ── the invariant that catches a silent drop ────────────────────────────
  it('every family balances its [c] markers against its citations', () => {
    // CLAUDE.md's lesson: the renderer drops an orphan citation SILENTLY, so a
    // card with three markers and two cites loses one with nothing on screen to
    // show it. Both Case 2 cards gained a marker in this change.
    const bad = [];
    for (const [name, hits] of Object.entries(FOUND)) {
      for (const { c, rec } of hits) {
        const markers = markerCount(typeof rec.note === 'string' ? rec.note : rec.note?.lead)
          + markerCount(typeof rec.note === 'string' ? null : rec.note?.detail);
        if (markers !== (rec.noteCites ?? []).length) {
          bad.push(`${name} ${c.key}: ${markers} markers vs ${(rec.noteCites ?? []).length} cites`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('the three families still produce the same number of cards as before', () => {
    // No verdict moved: this change is citations and wording only.
    // was 840; -30, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
    // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
    // counting conjugate and her card family changes with it. The invariant
    // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
    expect(FOUND.case1.length).toBe(810);
    expect(FOUND.case2catchup.length).toBe(15);
    expect(FOUND.case2series.length).toBe(5);
  });
});
