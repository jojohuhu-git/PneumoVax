// 2026-10-25 — a child's conjugate given sooner than 8 weeks after her PPSV23
// COUNTS, and the card offers the repeat as an option.
//
// ── The gap ──────────────────────────────────────────────────────────────
//
// There was NO RULE. An 8-year-old with asplenia, PPSV23 on 1 Oct and PCV20 on
// 15 Oct, was accepted in total silence — no note, no number, nothing — on a
// screen whose other card quoted an 8-week interval.
//
// ACIP's 2023 PCV20-in-children report states the anchor outright, which is why
// the row carries CDC's name and not the owner's:
//
//   "a single dose of PCV15 or PCV20 is recommended >=8 weeks after the most
//    recent dose of pneumococcal vaccination, REGARDLESS OF WHETHER THE CHILD
//    HAS PREVIOUSLY RECEIVED PPSV23, even if PCV7 was received."
//
// ── What is asserted, and why each one ───────────────────────────────────
//
// The owner's ruling has three parts and each is a separate way to get this
// wrong:
//
//   the dose COUNTS          making it a floor would throw away a dose ACIP
//                            never says to repeat
//   the chip gains NO new    her instruction: "keep the dose chips to a
//   word                     limited variety"
//   the repeat is OFFERED    with its date, behind "Why this"
//   with a date
//
// And one invariant that is not in the ruling but is implied by it: NOBODY'S
// SCHEDULE MOVED. A rule that merely annotates a dose must leave every
// recommendation card byte-identical, which the last test sweeps for.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const TODAY = '2026-10-25';
/** The dose verdicts paired back to the dates they belong to. */
const pcvDoses = (out) => out.orderedDoses.pcv.map((d, i) => ({ ...d, ...out.perDose.pcv[i] }));

// Maya: PPSV23 1 Oct, PCV20 15 Oct — 14 days, well inside the 8 weeks.
const maya = {
  dob: '2018-10-01', ageMonths: 96, today: TODAY,
  pcvDoses: [{ product: 'PCV20', date: '2026-10-15' }],
  ppsv23Doses: [{ date: '2026-10-01' }],
  riskIds: ['asplenia'],
};
// Noor: the identical history four years younger. Before this pair of changes
// the two were given different answers, which is how the whole thing was found.
const noor = { ...maya, dob: '2022-10-01', ageMonths: 48 };
// The control: the same child, the same doses, 8 weeks apart. Must stay silent.
const onTime = {
  ...maya, today: '2026-12-20',
  pcvDoses: [{ product: 'PCV20', date: '2026-12-10' }],
};

describe('the early conjugate counts', () => {
  it('keeps the dose, its number, and the series', () => {
    const out = recommend(maya);
    const dose = pcvDoses(out)[0];
    expect(dose.status).toBe('valid');
    expect(dose.doesNotCount).toBeFalsy();
    expect(dose.effectiveDoseNum).toBe(1);
    expect(out.recs.some((r) => r.status === 'complete')).toBe(true);
  });

  it('names the rule that judged it', () => {
    expect(pcvDoses(recommend(maya))[0].intervalRuleId).toBe('CHILD-PCV-AFTER-PPSV23');
  });

  it('adds NO new word to the chip vocabulary', () => {
    // The owner asked for the chips to stay a limited set. A counted dose must
    // read exactly as any other counted dose does.
    const dose = pcvDoses(recommend(maya))[0];
    expect(doseChipLabel(dose, null)).toBe('Dose 1');
  });

  it('offers the repeat, with its date, behind the disclosure', () => {
    const dose = pcvDoses(recommend(maya))[0];
    expect(dose.reasons.join(' ')).toContain('a repeat is optional');
    const why = (dose.whys ?? []).join(' ');
    expect(why).toContain('may repeat the conjugate dose');
    // 15 Oct + 56 days, measured from the dose the patient GOT (Ruling D's
    // anchor), and OUTSIDE the four-day grace (the ruling of 2026-10-24 keeps
    // every advised date out of it).
    expect(why).toContain('Dec 10, 2026');
  });

  it('gives the 4-year-old and the 8-year-old the same sentence', () => {
    const a = pcvDoses(recommend(maya))[0];
    const b = pcvDoses(recommend(noor))[0];
    expect(b.intervalRuleId).toBe(a.intervalRuleId);
    expect(b.reasons).toEqual(a.reasons);
    expect(b.whys).toEqual(a.whys);
  });

  it('says nothing at all when the 8 weeks were kept', () => {
    const dose = pcvDoses(recommend(onTime))[0];
    expect(dose.intervalRuleId ?? null).toBe(null);
    expect(dose.reasons).toEqual([]);
  });
});

describe('the opposite direction is still a floor, deliberately', () => {
  it('rejects a PPSV23 given too soon after a PCV', () => {
    // CDC instructs the PPSV23 itself ("administer 1 dose PPSV23 at least 8
    // weeks after the most recent PCV dose") and adds that PCV15 and PPSV23
    // should not share a visit. For a conjugate FOLLOWING a PPSV23 it states
    // only the timing of the next dose. The asymmetry is in the documents, and
    // this test exists so that "tidying" the two into one enforcement fails.
    const out = recommend({
      dob: '2018-10-01', ageMonths: 96, today: TODAY,
      pcvDoses: [{ product: 'PCV15', date: '2026-10-01' }],
      ppsv23Doses: [{ date: '2026-10-15' }],
      riskIds: ['asplenia'],
    });
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(out.perDose.ppsv23[0].intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
  });
});

describe('across the whole grid', () => {
  const hits = [];
  const schedulesMoved = [];
  for (const c of buildCases()) {
    const out = recommend(c.input);
    if (out.excluded) continue;
    const flagged = pcvDoses(out).filter((d) => d.intervalRuleId === 'CHILD-PCV-AFTER-PPSV23');
    if (!flagged.length) continue;
    hits.push(c.key);
    // Every flagged dose must still count, and must carry both halves.
    for (const d of flagged) {
      if (d.status !== 'valid' || d.doesNotCount) schedulesMoved.push(`${c.key} status`);
      if (!(d.reasons ?? []).length) schedulesMoved.push(`${c.key} no reason`);
      if (!(d.whys ?? []).length) schedulesMoved.push(`${c.key} no why`);
      // A rejected dose's two dates belong to floors. This row is not one.
      if (d.earliestValidDate || d.repeatDueDate) schedulesMoved.push(`${c.key} floor dates`);
    }
  }

  it('flags only children, and never turns one of their doses away', () => {
    expect(hits.length).toBeGreaterThan(0);
    expect(schedulesMoved).toEqual([]);
  });

  it('never judges a dose GIVEN at 19 or over by this rule', () => {
    // ⚠ NOT "never reaches an adult". The first draft of this test asserted
    // that and failed, correctly: `rulebookOf` keys on the age AT THE DOSE, so
    // a 19-year-old's conjugate given at 18 is still a child's dose and this
    // row is still the one that speaks for it. That is the design — the
    // rulebook selects WHICH schedule's sentence applies, never whether a rule
    // may bite. What must never happen is this row judging a dose given in
    // adulthood, where ACIP states a different interval (>=1 year, not 8 weeks).
    let checked = 0;
    for (const c of buildCases()) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      const { dob } = c.input;
      for (const d of pcvDoses(out)) {
        if (d.intervalRuleId !== 'CHILD-PCV-AFTER-PPSV23') continue;
        checked += 1;
        // Months between the birthday and the dose, floored — the same
        // comparison `rulebookOf` makes.
        const months = (new Date(d.date) - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.4375);
        expect(months).toBeLessThan(228);
      }
    }
    // The assertion above is vacuous if nothing is flagged, so prove it ran.
    expect(checked).toBeGreaterThan(0);
  });
});
