// WORD-1 (OWNER DECISIONS 2026-11-06): the result page folds. Her answers are in
// docs/archive/report-2026-11-06-wordy-result-pages.md and CLINICAL_SPEC.md §WORD-1.
//
// Three things are guarded here:
//   1. what must stay in view, asked of every patient rather than of one sentence;
//   2. that the fold loses nothing: every sentence and every citation is still on
//      the card, each citation still beside its own sentence;
//   3. that visible words cannot creep back up. A fold with no ceiling drifts.
import { describe, it, expect } from 'vitest';
import { recommend, recommendBeforeFold } from '../recommend.js';
import { sentencesOf, foldCard, STAY_IN_VIEW } from '../noteFold.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';
import { populationOf } from '../../data/riskFactors.js';

const TODAY = '2026-11-06';
const CASES = buildCases();
const OPEN = (r) => !['complete', 'not-indicated', 'deferred'].includes(r.status);
const lead = (r) => (typeof r.note === 'string' ? r.note : r.note?.lead ?? '');
const detail = (r) => (typeof r.note === 'string' ? '' : r.note?.detail ?? '');
const inView = (r) => `${r.doseLabel} ${lead(r)}`;
const words = (s) => s.replace(/\[c\]/g, '').replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;

const everyone = CASES.map((c) => ({ c, out: recommend(c.input) })).filter(({ out }) => !out.excluded);
const beforeFold = (c) => recommendBeforeFold(c.input);

describe('WORD-1 — what must stay in view', () => {
  it('two options: "Choose" shows on every patient offered a choice', () => {
    let choices = 0;
    const missing = [];
    for (const { c, out } of everyone) {
      const options = out.recs.filter((r) => /^Option [AB]|alternative/.test(r.doseLabel));
      if (options.length < 1 || out.recs.length < 2) continue;
      choices += 1;
      if (!out.recs.some((r) => /^Choose\b/m.test(lead(r)) || /\bChoose\b/.test(lead(r)))) missing.push(c.key);
    }
    expect(choices).toBeGreaterThan(1000);
    expect(missing.slice(0, 5)).toEqual([]);
  });

  it('PCV15 offered to an at-risk patient: PPSV23 is named without a click', () => {
    let offered = 0;
    const hidden = [];
    for (const { c, out } of everyone) {
      const pop = populationOf(c.input.ageMonths, c.input.riskIds ?? []);
      if (pop === 'child-routine' || pop === 'adult-routine') continue;
      for (const r of out.recs) {
        if (!OPEN(r) || !(r.brands ?? []).some((b) => /PCV15/.test(b))) continue;
        if (c.input.pcvDoses?.some((d) => d.product === 'PCV20')) continue; // a series with PCV20 owes none
        offered += 1;
        if (!/PPSV23/.test(inView(r))) hidden.push(`${c.key} ${r.doseLabel}`);
      }
    }
    expect(offered).toBeGreaterThan(1500);
    expect(hidden.slice(0, 5)).toEqual([]);
  });

  it('a healthy baby offered PCV15 is not told about PPSV23', () => {
    const out = recommend({ ageMonths: 4, dob: '2026-07-06', today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [] });
    expect(inView(out.recs[0])).not.toMatch(/PPSV23/);
  });

  it('an at-risk baby with no doses reads the line, and it measures from a PCV, not from a dose already given', () => {
    const out = recommend({ ageMonths: 3, dob: '2026-08-06', today: TODAY, riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [] });
    expect(lead(out.recs[0])).toBe('If PCV15 is used, PPSV23 may follow from age 2 years, ≥8 weeks after the most recent PCV [c].');
  });

  // Written out here, not imported, so deleting a rule from noteFold.js fails.
  it.each([
    ['Option B owes more', /^Option B\b.*\bthen\b/],
    ['only PCV20 avoids a further dose', /^Only PCV20 finishes/],
    ['the second step applies to some', /^Only if PPSV23 was not previously given/],
    ['the 8-week option at 50+', /^A minimum interval of 8 weeks may be considered/],
    ['why an adult answer on a child', /^This patient turns 19\b/],
    ['why no 2nd PPSV23 at 19', /not offered at 19/],
    ['the usual PPSV23 does not apply', /^This child has already had a PPSV23\b/],
    ['PCV15 then PPSV23, adult', /followed by PPSV23/],
    ['PCV15 then PPSV23, adult choice', /^If PCV15 is chosen, follow/],
  ])('stays in view: %s', (_, re) => {
    let seen = 0;
    const hidden = [];
    for (const { c } of everyone) {
      for (const r of beforeFold(c).recs) {
        for (const s of sentencesOf(lead(r))) {
          if (!re.test(s) || !OPEN(r)) continue;
          const after = lead(foldCard(r));
          // One card reads both; the PPSV23 already given answers the Option B line.
          if (/^Option B/.test(s) && /This child has already had a PPSV23/.test(after)) continue;
          seen += 1;
          if (!after.includes(s)) hidden.push(`${c.key} ${s.slice(0, 50)}`);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(hidden.slice(0, 3)).toEqual([]);
  });

  it('every bold sentence stays in view', () => {
    let bolded = 0;
    for (const { c } of everyone) {
      for (const r of beforeFold(c).recs) {
        const before = (typeof r.note === 'string' ? r.note : r.note?.lead ?? '');
        if (!/\*\*/.test(before)) continue;
        bolded += 1;
        const after = foldCard(r);
        for (const run of before.match(/\*\*[^*]+\*\*/g)) expect(lead(after)).toContain(run);
      }
    }
    expect(bolded).toBeGreaterThan(100);
  });

  it('the final-dose line stays: that card has no date anywhere else', () => {
    const cards = everyone.flatMap(({ out }) => out.recs).filter((r) => /not due until the patient reaches 12 months/.test(`${lead(r)} ${detail(r)}`));
    expect(cards.length).toBeGreaterThan(50);
    expect(cards.every((r) => /not due until the patient reaches 12 months/.test(lead(r)))).toBe(true);
  });

  it('both numbers: the minimum beside an advised date is in view (C10-2)', () => {
    // Remy (§L-2): advised Jan 29, and the earlier date that would count.
    const out = recommend({ ageMonths: 6, dob: '2026-05-06', today: '2026-12-06', riskIds: ['hiv'],
      pcvDoses: [{ product: 'PCV20', date: '2026-11-06' }, { product: 'PCV20', date: '2026-12-04' }], ppsv23Doses: [] });
    expect(lead(out.recs[0])).toMatch(/can be given from .* if needed, which is the minimum interval of 4 weeks/);
  });

  it('a "No dose now" card is not folded: the later dose stays in view', () => {
    const cards = everyone.flatMap(({ out }) => out.recs).filter((r) => r.status === 'no-dose-now');
    expect(cards.length).toBe(225);
    expect(cards.every((r) => lead(r).length > 0)).toBe(true);
  });
});

describe('WORD-1 — the fold loses nothing', () => {
  it('every sentence is still on the card, and each citation still beside its own sentence', () => {
    let folded = 0;
    for (const { c } of everyone) {
      for (const r of beforeFold(c).recs) {
        const after = foldCard(r);
        if (after === r) continue;
        folded += 1;
        const pair = (card) => {
          const s = noteCiteSlices(card.note, card.noteCites);
          const walk = (text, cites) => {
            let at = 0;
            return sentencesOf(text ?? '').map((t) => {
              const n = (t.match(/\[c\]/g) ?? []).length;
              at += n;
              return `${t} => ${cites.slice(at - n, at).map((x) => x.key).join(',')}`;
            });
          };
          return [...walk(card.note.lead ?? card.note, s.lead), ...walk(card.note.detail, s.detail)].sort();
        };
        expect(pair(after), c.key).toEqual(pair(r));
      }
    }
    expect(folded).toBeGreaterThan(5000);
  });

  it('each keep rule is reached by a real card, so none is dead', () => {
    const seen = new Set();
    for (const { out } of everyone) {
      for (const r of out.recs) {
        for (const s of sentencesOf(lead(r))) STAY_IN_VIEW.forEach((rule, i) => { if (rule.re.test(s)) seen.add(i); });
      }
    }
    // Both numbers appear on no grid patient, because the grid's dates never fall
    // in that window. Remy, above, reaches that rule by hand.
    expect(STAY_IN_VIEW.filter((_, i) => !seen.has(i)).map((x) => x.why)).toEqual(['Both numbers go on the card (C10-2)']);
  });
});

describe('WORD-1 — under a recorded dose', () => {
  it('every invalid dose still states an action, without a click', () => {
    const ACTION = /Not repeated|Repeat this dose only|Repeated on|Give .* instead|Give a further dose|A further dose can be given|Do not repeat|check the record|Next dose from|not a dose|does not count|cannot be counted|future|before birth/i;
    let invalid = 0;
    const silent = [];
    for (const { c, out } of everyone) {
      for (const d of [...out.perDose.pcv, ...out.perDose.ppsv23]) {
        if (d.status !== 'invalid') continue;
        invalid += 1;
        if (!ACTION.test((d.reasons ?? []).join(' '))) silent.push(`${c.key}: ${(d.reasons ?? []).join(' / ')}`);
      }
    }
    expect(invalid).toBeGreaterThan(10000);
    expect(silent.slice(0, 5)).toEqual([]);
  });

  it('Max: the gap and the action, in the shape she chose', () => {
    const out = recommend({ dob: '2021-11-06', ageMonths: 60, today: TODAY, riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2025-11-06' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-11-06' }] });
    const reasons = out.perDose.ppsv23[0].reasons;
    expect(reasons[0]).toBe('Same day as PCV; minimum interval 8 weeks.');
    expect(reasons[1]).toMatch(/^Not repeated\. Next dose from .* at the earliest\.$/);
  });

  it('the shortened line never says "due": it names the earliest date (2026-10-24)', () => {
    for (const { out } of everyone) {
      for (const d of out.perDose.ppsv23) for (const x of d.reasons ?? []) expect(x).not.toMatch(/Next dose from .* due/);
    }
  });

  it('four PCV7 doses say the line once; each still reads "not counted" on its chip', () => {
    const out = recommend({ ageMonths: 240, dob: '2006-11-06', today: TODAY, riskIds: [], ppsv23Doses: [],
      pcvDoses: ['2007-01-06', '2007-03-06', '2007-05-06', '2008-01-06'].map((date) => ({ product: 'PCV7', date })) });
    const lines = out.perDose.pcv.map((d) => d.reasons.join(' '));
    expect(lines.filter((l) => /PCV-naïve/.test(l))).toHaveLength(1);
    expect(out.perDose.pcv.every((d) => d.status === 'noncounting')).toBe(true);
  });
});

describe('WORD-1 — visible words cannot creep back up', () => {
  // PINNED. A rise means a sentence came back into view: move it, or say why it
  // must show and raise the number in the same commit. Measured 2026-11-06.
  it('visible note and dose-line words, grid worst and wordiest 1 in 10', () => {
    const totals = everyone.map(({ out }) => {
      const notes = out.recs.filter(OPEN).map(lead).join(' ');
      const doses = [...out.perDose.pcv, ...out.perDose.ppsv23].flatMap((d) => d.reasons ?? []).join(' ');
      return words(`${notes} ${doses}`);
    }).sort((a, b) => a - b);
    const p90 = totals[Math.floor(totals.length * 0.9)];
    const worst = totals[totals.length - 1];
    expect({ p90, worst }).toEqual({ p90: 64, worst: 164 });
  });
});
