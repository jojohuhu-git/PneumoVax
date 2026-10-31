// 2026-10-25 — a child's conjugate given sooner than 8 weeks after her PPSV23
// DOES NOT COUNT, and the repeat is owed rather than offered.
//
// ── THIS FILE IS THE RECORD OF A REVERSAL, AND WAS CALLED THE OPPOSITE ───
//
// It shipped this morning (`a66219a`) as
// `...-child-conjugate-after-ppsv23-counts.test.js`, asserting that the dose
// KEEPS its number and the series, that the chip gains no new word, and — in
// the grid sweep — that the dose never carries `earliestValidDate` or
// `repeatDueDate`, "because a rejected dose's two dates belong to floors and
// this row is not one". Every one of those is now asserted the other way.
//
// The reversal is the owner's, and she was asked in exactly these terms:
// "Child's PCV <52 days after a PPSV23 — count (this morning's ruling) or
// repeat?" Her answer: **"Repeat — her table wins."** Her interval table gives
// the row the basis "ACIP rule" plus the 2014 *Vaccine* report on a blunted
// conjugate response after PPSV23, i.e. hyporesponsiveness is her reason for
// turning ACIP's timing sentence into a bar.
//
// ⚠ SO THE ROW IS HERS, NOT CDC'S — `authority: 'OWNER'`, and the first
// paediatric floor that is. ACIP's sentence states the INTERVAL and nothing
// more:
//
//   "a single dose of PCV15 or PCV20 is recommended >=8 weeks after the most
//    recent dose of pneumococcal vaccination, REGARDLESS OF WHETHER THE CHILD
//    HAS PREVIOUSLY RECEIVED PPSV23, even if PCV7 was received."
//
// Saying a dose given inside it STOPS COUNTING is a further claim no document
// makes — the distinction this repo's rule header draws between ACIP's
// "minimum recommended interval" and the General Best Practices "minimum
// interval" that carries the repeat-the-dose consequence. That is why the
// card must disclose the bar as hers, and why this file asserts that it does:
// the phrase "owner clinical determination" was removed from the whole app
// hours earlier (every adult floor became a recommendation), and this row
// brings it back for one row only.
//
// ── What is asserted, and why each one ───────────────────────────────────
//
//   the dose is SET ASIDE     the reversal itself
//   both dates are printed    a floor owes the reader when this dose would
//                             have counted AND when the repeat may be given
//                             (Ruling D: the repeat is measured from the dose
//                             the patient GOT)
//   the bar is disclosed      as hers, in words, on the dose
//   the opposite direction    CHILD-PPSV23-AFTER-PCV was always a floor; the
//   is unchanged              two rows now agree, and that is NOT licence to
//                             merge them
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

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
// Noor: the identical history four years younger. Before `a66219a` the two
// were given different answers, which is how the whole thing was found; they
// must still agree, whichever way the row is enforced.
const noor = { ...maya, dob: '2022-10-01', ageMonths: 48 };
// The control: the same child, the same doses, 8 weeks apart. Must stay silent.
const onTime = {
  ...maya, today: '2026-12-20',
  pcvDoses: [{ product: 'PCV20', date: '2026-12-10' }],
};

describe('the early conjugate is set aside', () => {
  it('rejects the dose and does not count it toward the series', () => {
    const out = recommend(maya);
    const dose = pcvDoses(out)[0];
    expect(dose.status).toBe('invalid');
    expect(dose.effectiveDoseNum == null || dose.effectiveDoseNum === 0).toBe(true);
  });

  it('names the rule that judged it', () => {
    expect(pcvDoses(recommend(maya))[0].intervalRuleId).toBe('CHILD-PCV-AFTER-PPSV23');
  });

  it('prints BOTH clocks, and each answers its own question', () => {
    const dose = pcvDoses(recommend(maya))[0];
    // When THIS dose would have counted: 1 Oct + 56 days, less CDC's 4-day
    // grace, because the grace exists exactly for a dose already given.
    expect(dose.earliestValidDate).toBe('2026-11-22');
    // When the REPEAT may be given: Ruling D measures it from the dose the
    // patient GOT (15 Oct + 56 days), and the ruling of 2026-10-24 keeps every
    // ADVISED date outside the grace, so no 4 days come off this one.
    expect(dose.repeatDueDate).toBe('2026-12-10');
  });

  it('discloses that the bar is the owner\'s and not ACIP\'s', () => {
    const dose = pcvDoses(recommend(maya))[0];
    const said = [...(dose.reasons ?? []), dose.detail ?? ''].join(' ');
    expect(said).toMatch(/owner clinical determination/i);
    // and it still states the shortfall the clinician has to act on
    expect(said).toContain('8 weeks');
  });

  it('marks the chip as a dose that did not count', () => {
    // The reversal's visible half. `a66219a`'s version of this test asserted
    // "Dose 1" here, under her instruction to keep the chip vocabulary small;
    // a rejected dose has its own established chip and adds no new word either.
    const dose = pcvDoses(recommend(maya))[0];
    expect(doseChipLabel(dose, null)).not.toBe('Dose 1');
  });

  it('gives the 4-year-old and the 8-year-old the same sentence', () => {
    const a = pcvDoses(recommend(maya))[0];
    const b = pcvDoses(recommend(noor))[0];
    expect(b.intervalRuleId).toBe(a.intervalRuleId);
    expect(b.status).toBe(a.status);
    expect(b.reasons).toEqual(a.reasons);
  });

  it('says nothing at all when the 8 weeks were kept', () => {
    const dose = pcvDoses(recommend(onTime))[0];
    expect(dose.intervalRuleId ?? null).toBe(null);
    expect(dose.status).toBe('valid');
    expect(dose.reasons).toEqual([]);
  });
});

describe('the row is a floor on the owner\'s authority', () => {
  const row = DOSE_INTERVAL_RULES.find((r) => r.id === 'CHILD-PCV-AFTER-PPSV23');

  it('is a graced floor carrying her name', () => {
    expect(row.enforcement).toBe('floor');
    // Every floor gets CDC's 4-day grace — `rule-docs-match-code` holds the
    // whole table to that, and the grace is about whether a dose COUNTS, which
    // is a question only a floor asks.
    expect(row.grace).toBe(true);
    expect(row.authority).toBe('OWNER');
  });

  it('no longer offers the repeat as optional', () => {
    // `optionalRepeat` fed the 4th message argument so a recommendation could
    // name a date for a repeat nobody owed. A floor owes the repeat outright
    // and `repeatDueDate` already carries its date, so leaving the flag on
    // would be a second clock for one dose — the P0 bug's own shape.
    expect(row.optionalRepeat ?? false).toBe(false);
  });

  it('and it is the ONE paediatric floor that is not CDC\'s', () => {
    // Pinned by name so that relabelling it CDC — which would make the table
    // look tidy and the app misstate its source — fails here. The other three
    // really are CDC's: their sources state the gap as a minimum in words.
    expect(DOSE_INTERVAL_RULES
      .filter((r) => r.rulebook === 'child' && r.enforcement === 'floor')
      .map((r) => `${r.id}/${r.authority}`))
      .toEqual([
        'CHILD-PCV-AFTER-PCV/CDC',
        'CHILD-PPSV23-AFTER-PCV/CDC',
        // P2 (2026-10-30): the second-PPSV23 floor survives only for a repeat of
        // a REJECTED PPSV23 (Ruling D); after a counted one it is advice now.
        'CHILD-PPSV23-AFTER-INVALID-PPSV23/CDC',
        'CHILD-PCV-AFTER-PPSV23/OWNER',
      ]);
  });
});

describe('the opposite direction was always a floor, and the two still differ', () => {
  it('rejects a PPSV23 given too soon after a PCV', () => {
    const out = recommend({
      dob: '2018-10-01', ageMonths: 96, today: TODAY,
      pcvDoses: [{ product: 'PCV15', date: '2026-10-01' }],
      ppsv23Doses: [{ date: '2026-10-15' }],
      riskIds: ['asplenia'],
    });
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(out.perDose.ppsv23[0].intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
  });

  it('but they are NOT the same rule — the authorities differ', () => {
    // The asymmetry moved from `enforcement` to `authority` and did not go
    // away. CDC instructs the PPSV23 itself ("administer 1 dose PPSV23 at
    // least 8 weeks after the most recent PCV dose", nine times); for a
    // conjugate FOLLOWING a PPSV23 it states only the timing of the next dose,
    // so that bar is the owner's. Two rows, two authorities, same number —
    // never "tidied" into one row.
    const byId = (id) => DOSE_INTERVAL_RULES.find((r) => r.id === id);
    expect(byId('CHILD-PPSV23-AFTER-PCV').authority).toBe('CDC');
    expect(byId('CHILD-PCV-AFTER-PPSV23').authority).toBe('OWNER');
  });
});

describe('across the whole grid', () => {
  const hits = [];
  const wrong = [];
  for (const c of buildCases()) {
    const out = recommend(c.input);
    if (out.excluded) continue;
    const flagged = pcvDoses(out).filter((d) => d.intervalRuleId === 'CHILD-PCV-AFTER-PPSV23');
    if (!flagged.length) continue;
    hits.push(c.key);
    for (const d of flagged) {
      // Every flagged dose is now SET ASIDE, and carries both dates. This is
      // the exact inversion of `a66219a`'s sweep, which failed a case for
      // having either date at all.
      if (d.status !== 'invalid') wrong.push(`${c.key} status ${d.status}`);
      if (!(d.reasons ?? []).length) wrong.push(`${c.key} no reason`);
      if (!d.earliestValidDate) wrong.push(`${c.key} no earliestValidDate`);
      if (!d.repeatDueDate) wrong.push(`${c.key} no repeatDueDate`);
      // The repeat is measured from the dose the patient GOT, so it can never
      // fall on or before the date this dose would have been valid — that
      // would be two dates in the wrong order on one screen.
      if (d.repeatDueDate <= d.earliestValidDate) wrong.push(`${c.key} clocks crossed`);
    }
  }

  it('flags only children, and now turns every one of those doses away', () => {
    expect(hits.length).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  });

  it('never judges a dose GIVEN at 19 or over by this rule', () => {
    // ⚠ NOT "never reaches an adult". `rulebookOf` keys on the age AT THE
    // DOSE, so a 19-year-old's conjugate given at 18 is still a child's dose
    // and this row still speaks for it. That is the design — the rulebook
    // selects WHICH schedule's sentence applies, never whether a rule may
    // bite. What must never happen is this row judging a dose given in
    // adulthood, where ACIP states a different interval (>=1 year, not 8
    // weeks).
    let checked = 0;
    for (const c of buildCases()) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      const { dob } = c.input;
      for (const d of pcvDoses(out)) {
        if (d.intervalRuleId !== 'CHILD-PCV-AFTER-PPSV23') continue;
        checked += 1;
        const months = (new Date(d.date) - new Date(dob)) / (1000 * 60 * 60 * 24 * 30.4375);
        expect(months).toBeLessThan(228);
      }
    }
    // The assertion above is vacuous if nothing is flagged, so prove it ran.
    expect(checked).toBeGreaterThan(0);
  });
});
