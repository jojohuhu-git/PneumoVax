// §DOSE-LABELS — OWNER DECISION 2026-11-08: every recorded dose starts with
// exactly one label from a closed list, so a clinician sees first whether it
// counted, whether it was needed, and whether to repeat it.
//
// Her words: "Make sure this captures all test patients and is updated in the
// rulebook." So this sweeps ALL of them — the 17,016-patient grid, the 18,264
// impossible entries and the 60,480 ordinary "typical" patients — and checks
// four things of every dose:
//   1. it has a disposition from the list (never the label "Unknown");
//   2. a counted label is on a counted dose, and a "Not counted" one on a dose
//      that is not counted — the label can never contradict the count;
//   3. "repeat" and "do not repeat" never contradict the dose's own line;
//   4. her test patient's second PPSV23 says it was not needed (L2);
//   5. the line next to the dose keeps the style rules she approved the same
//      day that a machine can check (§M-L3): no semicolon, no "~", no bold
//      "Counted", no word the label already says, and no line longer than
//      the longest one today (a rise needs a reason).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DISPOSITIONS } from '../doseDisposition.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';
import { buildCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';

const COUNTED = new Set(['counted', 'counted-early', 'counted-not-needed', 'counted-product-unknown', 'counted-date-unknown']);
const SAYS_NOT_REPEATED = /not repeated|do not repeat|no repeat|nothing needs to be repeated/i;
// §M-L3: a dose to be repeated says how — not to restart, which product, or
// that it already was. "Repeat" itself is the label's word.
const SAYS_REPEAT = /do not restart the series|instead\.|repeated on/i;
// The longest dose line in any test patient on 2026-11-08: two notes stacked
// on one adult conjugate (the under-4-weeks note and the same-day note).
const MAX_LINE_WORDS = 44;
const REPEATS_THE_LABEL = /Not counted\. Do not repeat|Not repeated\.|\*\*Counted|Repeat this dose only|^Not needed/;

function sweep(cases) {
  const problems = [];
  const seen = new Map();
  for (const c of cases) {
    const r = recommend(c.input);
    if (!r.perDose) continue;
    const totals = (r.recs ?? []).map((x) => x.seriesTotal).filter((x) => x != null);
    for (const s of ['pcv', 'ppsv23']) {
      for (const v of r.perDose[s] ?? []) {
        const d = v.disposition;
        seen.set(d, (seen.get(d) ?? 0) + 1);
        const label = doseChipLabel(v, s === 'pcv' ? totals[0] ?? null : null);
        const words = (v.reasons ?? []).join(' ');
        const say = (why) => problems.push(`${c.key ?? JSON.stringify(c.input).slice(0, 120)} ${s}: ${why} [${label}] ${words.slice(0, 120)}`);
        if (!DISPOSITIONS.includes(d)) say(`disposition ${d}`);
        if (label === 'Unknown') say('label Unknown');
        if (COUNTED.has(d) !== (v.effectiveDoseNum != null)) say(`counted label ${COUNTED.has(d)} but effectiveDoseNum ${v.effectiveDoseNum}`);
        if (d === 'repeat' && (SAYS_NOT_REPEATED.test(words) || !SAYS_REPEAT.test(words))) say('repeat label, line disagrees');
        if (d === 'no-repeat' && SAYS_REPEAT.test(words)) say('do-not-repeat label, line says repeat');
        // §M-L3 — the style rules a machine can check.
        if (/;/.test(words)) say('semicolon in the line');
        if (/~/.test(words)) say('"~" in the line');
        if (REPEATS_THE_LABEL.test(words)) say('the line repeats the label');
        if (words.split(/\s+/).filter(Boolean).length > MAX_LINE_WORDS) say('line longer than any on 2026-11-08');
      }
    }
  }
  return { problems, seen };
}

describe('§DOSE-LABELS — every dose in every test patient has one label that agrees with it', () => {
  it('the 17,016-patient grid', () => {
    const { problems, seen } = sweep(buildCases());
    expect(problems.slice(0, 10)).toEqual([]);
    // Every counted and not-counted kind the grid can build is reached.
    for (const d of ['counted', 'counted-early', 'counted-product-unknown', 'extra', 'repeat', 'no-repeat', 'pcv7']) {
      expect(seen.get(d) ?? 0, d).toBeGreaterThan(0);
    }
  });

  it('the 18,264 impossible entries: each is "Check the date" or a real verdict', () => {
    const { problems, seen } = sweep(buildRecordProblemCases());
    expect(problems.slice(0, 10)).toEqual([]);
    expect(seen.get('check-date') ?? 0).toBeGreaterThan(0);
  });

  it('the 60,480 typical patients', () => {
    const { problems } = sweep(buildTypicalCases());
    expect(problems.slice(0, 10)).toEqual([]);
  }, 300_000);

  it('the two labels no grid patient reaches, built by hand: an undated dose, and an undated extra dose', () => {
    const one = recommend({ ageMonths: 720, today: '2026-11-08', riskIds: [], pcvDoses: [{ product: 'PCV20', date: '' }], ppsv23Doses: [] });
    expect(one.perDose.pcv[0].disposition).toBe('counted-date-unknown');
    expect(doseChipLabel(one.perDose.pcv[0], null)).toBe('Counted — date not recorded');
    const two = recommend({ ageMonths: 720, today: '2026-11-08', riskIds: [], pcvDoses: [{ product: 'PCV20', date: '' }, { product: 'PCV20', date: '' }], ppsv23Doses: [] });
    expect(doseChipLabel(two.perDose.pcv[1], null)).toBe('Check the date — none recorded');
  });

  // §M-L2 — her own test patient, 2026-11-08: born 1954-10-01, healthy.
  it('her test patient: the first PPSV23 was early, the second was not needed', () => {
    const r = recommend({
      dob: '1954-10-01', today: '2026-11-08', riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2019-10-17' }, { product: 'PCV20', date: '2026-09-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2020-09-25' }, { product: 'PPSV23', date: '2020-10-23' }],
    });
    const [first, second] = r.perDose.ppsv23;
    // At 65 every adult was owed one PPSV23 (ACIP mm6846a5, 2019); it came
    // 11 months after the PCV13, inside the advised year.
    expect(doseChipLabel(first, null)).toBe('Counted — given early, accepted');
    expect(doseChipLabel(second, null)).toBe('Counted — not needed. No more PPSV23.');
    expect(second.reasons.join(' ')).toBe('Given 28 days after the PPSV23 of Sep 25, 2020. Only one PPSV23 is recommended for this patient.');
    expect(second.reasons.join(' ')).not.toMatch(/5 years|never give a third/);
    expect(second.effectiveDoseNum).toBe(2);
    // Her PCV20 is on schedule: the dose number, no line.
    expect(doseChipLabel(r.perDose.pcv[1], null)).toBe('Dose 2');
    expect(r.recs.map((c) => c.status)).toEqual(['complete']);
  });

  it('the same history with asplenia: one of ACIP\'s three groups, so "given early", not "not needed"', () => {
    const r = recommend({
      dob: '1954-10-01', today: '2026-11-08', riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2019-10-17' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2020-09-25' }, { product: 'PPSV23', date: '2020-10-23' }],
    });
    expect(doseChipLabel(r.perDose.ppsv23[1], null)).toBe('Counted — given early, accepted');
    expect(r.perDose.ppsv23[1].reasons.join(' ')).toMatch(/5 years recommended\.$/);
  });
});
