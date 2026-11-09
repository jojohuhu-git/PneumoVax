// R4 of the 2026-11-05 whole-app checks — a thrown-out childhood PPSV23: two
// surfaces read its 5-year date differently. Two of its three shapes are fixed
// here; neither needs a new owner ruling, because in each the app's own card
// already says what happens and only the second surface disagreed.
//
// 1. THE LINE UNDER THE DOSE PROMISED A PPSV23 THE CARD SAYS IS NOT GIVEN.
//    Ana, 19, heart disease: PCV15 at 14, PPSV23 the next day (thrown out,
//    CHILD-PPSV23-AFTER-PCV). Her card, by the owner's ruling of 2026-11-01
//    (§K-THROWNOUTTIMING), reads "Give 1 dose of PCV20 or PCV21 … No PPSV23 is
//    needed after it", and the label on the old dose already says it is not
//    repeated. The line beside that label still read "Next dose from Oct 13,
//    2026 at the earliest" — a date for a PPSV23 nothing will ask for. The same
//    for a CSF leak (the 5-year PCV20/PCV21 card) and HIV (the 1-year card).
//    The date now goes whenever no card asks for a PPSV23 and none offers
//    PCV15, the one vaccine that always needs a PPSV23 after it (CLAUDE.md,
//    "PCV15 Always Requires PPSV23"). Where a card does offer PCV15, the date
//    stays: that is the third R4 shape, which is put to the owner.
//
// 2. OPTION B's PPSV23 STEP WAS DATED BEFORE ITS OWN FIRST STEP ALLOWED.
//    Ben, 6, no spleen, no conjugate that counted, a PPSV23 at 12 months (too
//    young, thrown out). Option B is PCV15 today, then PPSV23 ≥8 weeks later.
//    The 5-year hold after the thrown-out PPSV23 (§C-P2-FIVE) ends Oct 13,
//    2026, so it stamped the PPSV23 step "Oct 13, 2026" — two days away, when
//    8 weeks after a PCV15 given today is Dec 6. Both waits apply; the hold now
//    dates that step only when it ends later than the 8 weeks could.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-11';
const run = (p) => recommend({ ...p, today: TODAY });
const lineOf = (d) => d.reasons.join(' ');
const text = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);

const ANA = { dob: '2007-10-11', riskIds: ['chronic_heart'],
  pcvDoses: [{ product: 'PCV15', date: '2021-10-12' }], ppsv23Doses: [{ date: '2021-10-13' }] };
const CSF = { dob: '2007-10-11', riskIds: ['csf_leak'],
  pcvDoses: [{ product: 'PCV13', date: '2021-10-12' }], ppsv23Doses: [{ date: '2016-10-13' }, { date: '2021-10-13' }] };
const HIV = { dob: '2007-10-11', riskIds: ['hiv'],
  pcvDoses: [{ product: 'PCV13', date: '2021-10-12' }], ppsv23Doses: [{ date: '2021-10-13' }] };
// The third R4 shape, not changed here: a card that offers PCV15.
const MAX = { dob: '2021-10-11', riskIds: ['asplenia'],
  pcvDoses: [{ product: '', date: '2025-10-11' }], ppsv23Doses: [{ date: '2025-10-11' }] };
const BEN = { dob: '2020-10-11', riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [{ date: '2021-10-13' }] };
const BEN_LATER = { ...BEN, ppsv23Doses: [{ date: '2022-09-11' }] };

describe('R4 shape 1: the line under a thrown-out PPSV23 names no date the cards do not follow', () => {
  for (const [name, p, last] of [
    ['Ana (heart disease, PCV15 then PPSV23 the next day)', ANA, ANA.ppsv23Doses.length - 1],
    ['a CSF leak (first PPSV23 counted, second thrown out)', CSF, 1],
    ['HIV (PCV13 then PPSV23 the next day)', HIV, 0],
  ]) {
    it(name, () => {
      const out = run(p);
      expect(out.recs.every((r) => r.vaccine === 'PCV')).toBe(true);
      expect(out.recs.some((r) => (r.brands ?? []).some((b) => String(b).startsWith('PCV15')))).toBe(false);
      const d = out.perDose.ppsv23[last];
      expect(d.status).toBe('invalid');
      expect(d.disposition).toBe('no-repeat');
      expect(lineOf(d)).toBe('Given 1 day after the last PCV. Minimum interval 8 weeks.');
      expect(lineOf(d)).not.toMatch(/Next dose from/);
    });
  }

  it("Ana's card itself is unchanged: PCV20 or PCV21 today, no PPSV23 after it", () => {
    const [card] = run(ANA).recs;
    expect(card.doseLabel).toBe('1 dose PCV (PCV20 or PCV21) ≥1 year after the PPSV23 — completes the series');
    expect(card.dueToday).toBe(true);
    expect(text(card)).toContain('No PPSV23 is needed after it.');
  });

  it('the control: a card that offers PCV15 keeps the date (the shape put to the owner)', () => {
    const out = run(MAX);
    expect(out.recs.some((r) => (r.brands ?? []).some((b) => String(b).startsWith('PCV15')))).toBe(true);
    expect(lineOf(out.perDose.ppsv23[0])).toContain('Next dose from Oct 11, 2030 at the earliest.');
  });
});

describe('R4 shape 2: Option B\'s PPSV23 step is never dated before 8 weeks after its PCV15', () => {
  it('Ben: the hold ends before the 8 weeks could, so the step carries no date of its own', () => {
    const out = run(BEN);
    const b1 = out.recs.find((r) => r.doseLabel.startsWith('Option B-1'));
    const b2 = out.recs.find((r) => r.doseLabel.startsWith('Option B-2'));
    expect(b1.dueToday).toBe(true);
    expect(b2.dueToday).toBe(false);
    expect(b2.earliestNextDate).toBe(null);
    expect(text(b2)).not.toContain('Held to');
    expect(text(b2)).toContain('PPSV23 ≥8 weeks after the PCV15 dose');
  });

  it('the control: a hold that ends after the 8 weeks still dates the step, and says why', () => {
    const out = run(BEN_LATER);
    const b2 = out.recs.find((r) => r.doseLabel.startsWith('Option B-2'));
    expect(b2.earliestNextDate).toBe('2027-09-11');
    expect(text(b2)).toContain('Held to 5 years after this child\'s PPSV23 of Sep 11, 2022, which did not count');
  });
});
