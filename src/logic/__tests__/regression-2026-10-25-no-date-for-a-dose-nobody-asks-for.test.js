// OWNER DECISION 2026-10-25 — A REJECTED DOSE DOES NOT PROMISE A DOSE NOBODY
// IS ASKING FOR.
//
// ── The defect ───────────────────────────────────────────────────────────
//
// The grey note under a dose rejected for TIMING ended:
//
//   "...Not repeated; the Next dose from can be given from
//    2026-08-17 at the earliest."
//
// Swept over the grid, **647 of the 814 children** whose PPSV23 was rejected
// were shown that date on a screen where every card said they were finished or
// needed nothing:
//
//   398  at risk, series complete, PCV20 in it
//   111  PCV20 in the series, card reads "Not indicated"
//   138  no PCV20, complete or not indicated
//
// The worked patient that found it: a 5-year-old with asplenia, PCV20 on
// 2026-06-01 and a PPSV23 21 days later where 8 weeks are required. Her only
// card was about her PCV series; nothing on the screen asked for a PPSV23, and
// the note still named a date for one.
//
// ── What the owner ruled, and the document she gave ──────────────────────
//
// *"Children aged 2–18 years with any risk condition who completed a
// recommended PCV series before age 6 years: Completed series includes >=1
// dose of PCV20: No additional doses of any pneumococcal vaccine are
// indicated."*
//
// CDC/ACIP, "Use of 20-Valent Pneumococcal Conjugate Vaccine Among U.S.
// Children: Updated Recommendations of the Advisory Committee on Immunization
// Practices — United States, 2023", published 22 September 2023, **Table 1**.
// https://stacks.cdc.gov/view/cdc/133252 — verified live 2026-10-25, and the
// table read from the PDF, which is where the row lives (the stacks landing
// page carries metadata only).
//
// The recommendation CARDS already honoured this — `pcvInfant`'s complete
// branch has said "the series already includes PCV20, so no further
// pneumococcal dose is needed" since FINDING D. Only the note did not.
//
// ── THE TEST IS "IS ANYTHING OWED", NOT "IS A DOSE OF THIS VACCINE OWED" ──
//
// Deliberate, and the boundary this file mostly exists to hold. An adult whose
// PPSV23 was rejected IS owed something — a conjugate, per the 2026-10-24 and
// 2026-10-25 rulings — so her clause stays and goes on agreeing with her
// card's date. Keying on the vaccine STREAM would have stripped it from every
// one of those adults, one commit after the owner ruled that the two surfaces
// must agree. It is not an age test either: what separates these children is
// that nothing is owed, which `recs` states directly.
//
// Measured 2026-10-25 over both grids: 3,282 of 35,280 rendered lines changed
// (2,930 real patients, 352 impossible entries), 0 added, 0 removed, and every
// changed line is explained ENTIRELY by the clause being withdrawn — no line
// gained it, and nothing else in any line moved.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-24';
const run = (p) => recommend({ today: TODAY, ...p });
const chipsOf = (o) => [...o.perDose.pcv, ...o.perDose.ppsv23];
const textOf = (d) => (d.reasons ?? []).join(' ');
const FORWARD = 'Next dose from';
const ASKS_FOR_NOTHING = new Set(['complete', 'no-dose-now', 'not-indicated']);

describe('her worked child, and the sentence she should see', () => {
  it('a 5-year-old with asplenia whose PCV20 series covers her is promised nothing', () => {
    const out = run({
      ageMonths: 60,
      riskIds: ['asplenia'],
      pcvDoses: [
        { product: 'PCV20', date: '2026-06-01' },
        { product: 'PCV20', date: '2026-08-01' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-08-22' }],
    });
    // Table 1's row: the series is complete and contains PCV20.
    expect(out.recs.every((r) => ASKS_FOR_NOTHING.has(r.status))).toBe(true);
    const chip = out.perDose.ppsv23[0];
    expect(chip.status).toBe('invalid');
    // the half that is about the dose already given SURVIVES — it still does
    // not count, and it is still not repeated
    // §M-L3 (2026-11-08): the label now says "Not counted — do not repeat", so the line no longer does.
    expect(chip.disposition).toBe('no-repeat');
    // and the forward-looking half, with its date, is gone
    expect(textOf(chip)).not.toContain(FORWARD);
    expect(textOf(chip)).not.toMatch(/\d{4}-\d{2}-\d{2} at the earliest/);
  });

  it('a healthy 12-year-old whose only card reads "Not indicated" is promised nothing either', () => {
    const out = run({
      ageMonths: 144,
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2025-10-24' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-24' }],
    });
    expect(out.recs.map((r) => r.status)).toEqual(['not-indicated']);
    for (const chip of chipsOf(out).filter((d) => d.forwardLookingReason)) {
      expect(textOf(chip)).not.toContain(FORWARD);
    }
  });
});

describe('the boundary: a patient who IS owed something keeps her date', () => {
  // ── WHO USED TO HOLD THIS BOUNDARY, AND WHY THEY CANNOT ───────────────
  //
  // Two adults did, one commit earlier: a 60-year-old and an asplenic
  // 40-year-old, each with a PCV13 and then a PPSV23 too soon after it. The
  // point of keeping them here was that a PPSV23 rejected in an ADULT is
  // followed by something — a conjugate — so her clause must survive, which
  // an implementation keyed on the vaccine STREAM would have stripped.
  //
  // The owner's 2026-10-25 adult table then turned every adult floor into a
  // recommendation, so neither of them has a rejected dose at all any more.
  // They are kept below as the record of that, and the boundary itself moves
  // onto the child who follows — who holds it just as well, because her only
  // card is a PCV one while the clause she keeps is on a PPSV23.
  const A = {
    ageMonths: 720, riskIds: [],
    pcvDoses: [{ product: 'PCV13', date: '2026-07-19' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
  };
  const D4 = {
    ageMonths: 480, riskIds: ['asplenia'],
    pcvDoses: [{ product: 'PCV13', date: '2026-08-30' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
  };

  it('the adults of the PCV13 ruling have no rejected dose left to promise from', () => {
    for (const p of [A, D4]) {
      const out = run(p);
      const chip = out.perDose.ppsv23[0];
      // Counted now, with the shortfall stated — her Ruling F wording.
      expect(chip.status).toBe('valid');
      expect(chip.earlyAdvisory).toBe(true);
      expect(chip.disposition).toBe('counted-early');
      // No rejected dose, so no forward-looking clause and no second date.
      expect(chip.forwardLookingReason).toBeUndefined();
      expect(textOf(chip)).not.toContain(FORWARD);
      expect(chipsOf(out).some((d) => d.forwardLookingReason)).toBe(false);
      // Their card now counts five years from the PPSV23 that COUNTS, where
      // before it counted one year from the PCV13 and the PPSV23 was thrown
      // away. One date on the screen, and it is the later one.
      expect(out.recs[0].earliestNextDate).toBe('2031-10-11');
    }
  });

  it('the 5-year-old who held the boundary until 2026-11-08 now loses her date, by ruling', () => {
    // Same asplenic 5-year-old, but only ONE PCV20, and a PPSV23 21 days after
    // it (thrown out). She held this boundary because a dose WAS owed (a PCV)
    // while the clause sat on a PPSV23, and nothing on her screen was a PPSV23
    // card. The owner's ruling on Max (2026-11-08, CLINICAL_SPEC.md §C-P2-R4:
    // "PCV20 only") means no PPSV23 follows for her at all — PCV20 completes
    // her series — so a PPSV23 date five years on was a promise nothing keeps.
    const out = run({
      ageMonths: 60,
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-06-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-22' }],
    });
    expect(out.recs.some((r) => !ASKS_FOR_NOTHING.has(r.status))).toBe(true);
    expect(out.recs.map((r) => [r.vaccine, r.brands])).toEqual([['PCV', ['PCV20 (Prevnar 20)']]]);
    expect(textOf(out.perDose.ppsv23[0])).not.toContain(FORWARD);
  });

  it('the boundary now: a teenager still offered a PPSV23 keeps her date', () => {
    // 18, no spleen. First PPSV23 at 8 counted; the second, a day after a
    // PCV13, did not. Her cards offer PCV20 or a 2nd PPSV23, so the PPSV23
    // date under the thrown-out dose is one a card really asks for.
    const out = run({
      dob: '2008-10-24',
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2021-10-12' }, { product: 'PCV13', date: '2021-11-09' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2016-10-13' }, { product: 'PPSV23', date: '2021-10-13' }],
    });
    expect(out.recs.some((r) => r.vaccine === 'PPSV23' && !ASKS_FOR_NOTHING.has(r.status))).toBe(true);
    expect(textOf(out.perDose.ppsv23[1])).toContain(FORWARD);
  });
});

describe('swept over the grid', () => {
  it('no patient is ever promised a date while every card asks for nothing', () => {
    let withdrawn = 0; let kept = 0;
    const offenders = [];
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      if (!out?.recs?.length) continue;
      const chips = chipsOf(out).filter((d) => d.forwardLookingReason);
      if (!chips.length) continue;
      const nothingOwed = out.recs.every((r) => ASKS_FOR_NOTHING.has(r.status));
      const promises = chips.some((d) => textOf(d).includes(FORWARD));
      if (nothingOwed) {
        withdrawn++;
        if (promises) offenders.push(c.key);
      } else {
        kept++;
        // THE OTHER DIRECTION, and it is the one that matters most: a later
        // change must not quietly strip the clause from patients who need it.
        if (!promises) offenders.push(`LOST-WRONGLY ${c.key}`);
      }
    }
    expect(offenders).toEqual([]);
    // PINNED EXACTLY, both sides. A rise in `withdrawn` means the engine has
    // stopped asking for doses somewhere; a rise in `kept` means it has
    // started. Either is a clinical change and must be explained, not absorbed.
    //
    // RE-MEASURED 2026-10-25 after her adult table: was
    // `{ withdrawn: 2930, kept: 2335 }` (5,265 patients with a rejected
    // dose), then 4,422. The 843 that left were exactly the adult-rulebook
    // rejections, because no adult floor survives — the assertion below
    // pins that shape, so a drop like this cannot pass as a re-measurement
    // again without the rules it came from being named.
    //
    // RE-MEASURED AGAIN the same day, and this time it ROSE: 4,422 -> 4,521.
    // Her second ruling of 2026-10-25 ("Repeat — her table wins") made
    // `CHILD-PCV-AFTER-PPSV23` a floor, so a child's conjugate given inside 8
    // weeks of a PPSV23 is now set aside. The 99 added patients are
    // +18 withdrawn and +81 kept; the inventory below names the new rule,
    // which is what distinguishes this rise from an adult floor creeping back.
    //
    // RE-MEASURED 2026-10-31 and it FELL by 126: 2670 -> 2544 withdrawn, kept
    // unchanged. §C-P2-HEALTHY (Zoe): a HEALTHY child's mistimed PPSV23 now
    // carries no forward-looking clause at all — it is "not needed", so there
    // is no next dose in its series to withdraw. Kept is untouched, so no
    // child who is owed a further dose lost her date.
    //
    // RE-MEASURED 2026-10-31 (evening) and it FELL by 128: 2544 -> 2428
    // withdrawn, 1851 -> 1839 kept. §C-P2-LATER ("Leo"): a child's thrown-out
    // PPSV23 with a later PPSV23 on the record now points to it ("It was
    // repeated on <date> — see that dose") and carries no forward-looking
    // clause to withdraw or keep. All 128 are one grid family — 18-year-olds
    // with a PPSV23 on the day of a PCV and another five years later — 116
    // owed nothing (Leo's twin) and 12 owed a dose (Leo, whose chip promised a
    // date in 2017). No chip that still carries the clause lost it.
    //
    // RE-MEASURED 2026-10-31 (night) and it FELL by 88: 2428 -> 2350
    // withdrawn, 1839 -> 1829 kept. §C-P2-LATER widened to ADULTS ("Leo at
    // 19"): the same family one year older — 19-year-olds whose PPSV23 at 9
    // was given on the day of a PCV and again five years later. 78 owed
    // nothing, 10 owed a conjugate (Leo at 19, promised Dec 2016).
    //
    // RE-MEASURED 2026-10-31 (late) and KEPT FELL by 40: 1829 -> 1789,
    // withdrawn unchanged. §C-P2-ONE ("Leah"): an at-risk child whose ONLY
    // PPSV23 was thrown out for coming too soon after a PCV is now offered
    // PCV20 only, and that chip's "can be given from <date>" — a PPSV23 the
    // card no longer offers — becomes "Not repeated." The grid family is
    // 72 children (aged 6, 18 and 18y11m; PPSV23 on the day of, or the day
    // after, a PCV): 40 had no other dated chip and left `kept`; 32 stay,
    // because a thrown-out PCV dose on the same screen keeps its own date.
    // 54 moved across, R2 (2026-11-05, OWNER RULINGS on Tess, Rafi and Cal, CLINICAL_SPEC.md §B-AT19):
    // a child now read as Complete at 19 is promised no date.
    // KEPT FELL by 10, 2026-11-07: 1735 -> 1725. §C-P2-ONE-ADULT ("Sam", owner
    // ruling): a 19-year-old whose ONLY PPSV23 was given on the day of a PCV in
    // childhood is now offered PCV20 or PCV21 only, so that chip's "Next dose
    // from <date>" — a PPSV23 no card offers — becomes "Not repeated." The grid
    // family is the 10 a228 patients, one per qualifying risk tick.
    // KEPT FELL by 10 again, 2026-11-08: 1725 -> 1715. R4 (CLINICAL_SPEC.md
    // §C-P2-R4): a thrown-out childhood PPSV23's "Next dose from <date>" is a
    // PPSV23 date, so it goes when no card asks for a PPSV23 and none offers
    // PCV15. The grid family is 10 a228 patients, one per risk tick: PCV13 and
    // PPSV23 on the same day at 9, card "PCV20 or PCV21 … no PPSV23 needed",
    // line promising a PPSV23 "from Oct 13, 2021". Listed by key, old against
    // new, before this pin was moved. Withdrawn is untouched.
    // KEPT FELL by 16 more the same day: 1715 -> 1699. The owner's ruling on
    // Max ("PCV20 only", §C-P2-R4): the 24-71-month catch-up card no longer
    // offers PCV15 after a PPSV23 thrown out for coming too soon after a PCV,
    // so no PPSV23 follows and the line's 2030-ish PPSV23 date goes. All 16
    // are the a60 family Max belongs to. Listed by key before this pin moved.
    expect({ withdrawn, kept }).toEqual({ withdrawn: 2404, kept: 1699 });
  });

  it('the surviving lead is on every one of them — the dose still does not count', () => {
    let seen = 0;
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      for (const d of chipsOf(out).filter((x) => x.forwardLookingReason)) {
        seen++;
        expect(d.disposition).toBe('no-repeat');
      }
    }
    // anti-vacuity: the sweep above is worthless if nothing matches
    expect(seen).toBeGreaterThan(5000);
  });

  it('and every rejected dose left in the grid comes from a CHILD floor', () => {
    // Added 2026-10-25 with the re-measurement above. Her adult table left
    // four floors in the whole table and all four are child rows, so this
    // is the complete inventory of what can still carry the clause. It is
    // what explains the 843-patient drop and then the 99-patient rise, and a
    // rule appearing here that is not in this list is an adult dose being set
    // aside again.
    //
    // `CHILD-PCV-AFTER-PPSV23` joined the list later the same day, when her
    // second ruling made it a floor, and it accounts for 231 rejected doses.
    // `CHILD-PPSV23-AFTER-PPSV23` is the fourth floor and is NOT here because
    // the grid REJECTS NOTHING by it at all — measured over every case, the
    // rejected-dose tally is `CHILD-PCV-AFTER-PCV` 6,281,
    // `CHILD-PPSV23-AFTER-PCV` 814, `CHILD-PCV-AFTER-PPSV23` 231 and that row
    // 0. So its absence here says nothing about the clause; the grid simply
    // never dates two PPSV23 doses inside five years of each other.
    const rules = new Set();
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      for (const d of chipsOf(out).filter((x) => x.forwardLookingReason)) {
        rules.add(d.intervalRuleId);
      }
    }
    expect([...rules].sort())
      .toEqual(['CHILD-PCV-AFTER-PCV', 'CHILD-PCV-AFTER-PPSV23', 'CHILD-PPSV23-AFTER-PCV']);
  });
});
