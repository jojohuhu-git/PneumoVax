// 2026-11-17 — the engine's undated-PCV code is gone, because nothing can reach it.
//
// Until §A-UNDATED (OWNER DECISION 2026-11-15) an undated PCV COUNTED, and
// `recommend.js` carried a policy for it in about twenty places: an undated dose
// was assumed to be an infant dose (`band.undated`, `undatedAsInfant`), an
// undated PCV20 completed a healthy toddler (`hasUndatedCompleting`), and the
// FINDING G/I gate kept a `pcv.count >= 3` half alive only for undated
// histories. Since §A-UNDATED the validator stops every undated PCV at the date
// check, so the list the engine counts — the doses that COUNTED — never holds
// one, and all of that code read a zero. It was deleted on 2026-11-17.
//
// This file is what makes the deletion safe, in two halves:
//   1. No undated PCV is ever counted, for any product, age or risk class, on
//      its own or mixed with dated doses. `summarizePcv()` now throws if one
//      arrives, so a regression is loud here instead of a silent wrong answer.
//   2. A patient whose undated PCV is old enough to have been valid plans
//      EXACTLY as the same patient without it — the rule her ruling states —
//      so no card can depend on the deleted code either.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addCalendarMonths } from '../dateUtils.js';

const TODAY = '2026-11-17';
const AGES_M = [1, 2, 3, 5, 7, 9, 12, 14, 18, 23, 26, 40, 59, 66, 75, 100, 150, 210, 220, 300, 610, 700, 800];
const PRODUCTS = ['PCV7', 'PCV13', 'PCV15', 'PCV20', 'PCV21', ''];
const RISKS = [[], ['asplenia'], ['cochlear_implant'], ['chronic_heart'], ['diabetes', 'smoking']];
// A dated dose given at 2 months, one at 4 months, one at 13 months — whichever
// the patient is old enough to have had.
const datedHistory = (dob, am) => [2, 4, 13]
  .filter((m) => m < am)
  .map((m) => ({ product: 'PCV13', date: addCalendarMonths(dob, m) }));

const strip = (r) => JSON.stringify({
  excluded: r.excluded,
  recs: (r.recs ?? []).map((c) => ({ s: c.status, d: c.doseLabel, n: c.note, due: c.dueDate })),
});

function* patients() {
  for (const am of AGES_M) {
    const dob = addCalendarMonths(TODAY, -am);
    for (const riskIds of RISKS) {
      for (const product of PRODUCTS) {
        for (const withHistory of [false, true]) {
          const dated = withHistory ? datedHistory(dob, am) : [];
          for (const where of ['first', 'last']) {
            const undated = { product, date: '' };
            const pcvDoses = where === 'first' ? [undated, ...dated] : [...dated, undated];
            yield { am, dob, riskIds, product, dated, pcvDoses };
          }
        }
      }
    }
  }
}

describe('no undated PCV reaches the engine (dead-code removal, 2026-11-17)', () => {
  it('never counts an undated PCV, and the engine never throws', () => {
    let n = 0;
    for (const p of patients()) {
      const r = recommend({ today: TODAY, dob: p.dob, riskIds: p.riskIds, pcvDoses: p.pcvDoses, ppsv23Doses: [] });
      const verdicts = r.perDose?.pcv ?? [];
      // Only the dated doses can be counted…
      expect(verdicts.filter((v) => v.effectiveDoseNum != null).length).toBeLessThanOrEqual(p.dated.length);
      // …and every "no date" verdict is a dose that did not count.
      for (const v of verdicts.filter((x) => x.noDate)) expect(v.effectiveDoseNum).toBeNull();
      // Past the age and product checks, the undated dose is the one "no date"
      // verdict. A row with no product AND no date is a blank row, not a dose
      // (regression-p1-3-blank-row-is-not-a-dose), so it gets no verdict at all.
      const datable = p.am >= 2 && p.product !== 'PCV7' && p.product !== ''
        && !(p.product === 'PCV21' && p.am < 216);
      if (datable && !r.excluded) expect(verdicts.filter((x) => x.noDate)).toHaveLength(1);
      n += 1;
    }
    expect(n).toBe(AGES_M.length * RISKS.length * PRODUCTS.length * 2 * 2);
  });

  it('an undated PCV old enough to be valid plans exactly as the patient without it', () => {
    let compared = 0;
    for (const p of patients()) {
      // Below 6 weeks the undated dose is "too young" and asks for a repeat —
      // a different, older rule (§A), not the one being proved here. PCV7 is
      // folded under its own rule too. Both are left to their own guards.
      if (p.am < 2 || p.product === 'PCV7') continue;
      if (p.product === 'PCV21' && p.am < 216) continue;
      const base = { today: TODAY, dob: p.dob, riskIds: p.riskIds, ppsv23Doses: [] };
      const withIt = recommend({ ...base, pcvDoses: p.pcvDoses });
      const without = recommend({ ...base, pcvDoses: p.dated });
      expect(strip(withIt), `${p.am} mo, ${p.riskIds.join('+') || 'healthy'}, undated ${p.product || 'unknown'}`)
        .toBe(strip(without));
      compared += 1;
    }
    expect(compared).toBeGreaterThan(1000);
  });
});
