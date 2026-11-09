// §WHY-THIS (OWNER DECISION 2026-11-08): the "Why this" paragraph on every
// recommendation card follows the same style rules she approved that day for
// the line beside a recorded dose (CLINICAL_SPEC.md §M-L3). She was shown five
// before-and-after paragraphs and the PCV15 sentence, and answered
// "Yes, rewrite all".
//
// This sweeps every test patient — the 17,016-patient grid, the 18,264
// impossible entries and the 60,480 typical patients — and checks every
// sentence behind "Why this" for the parts of those rules a machine can see:
//   rule 3  talk about the patient, not the document: no "row", "worded",
//           "footnote", "prints"
//   rule 4  one idea per sentence: no semicolon, at most one dash
//   rule 5  no arguing: no "either way", no "does not change"
//   rule 8  plain terms, US spelling: no "~", "paediatric", "neighbour"
//   and     capitals are not used for emphasis ("ONE further", "INCOMPLETE",
//           "NOT routine")
// and holds the longest paragraph to its length on 2026-11-08, so a rise needs
// a reason. Rules 2, 6, 7, 9 and 10 need a reader.
//
// "Choose ONE option, not both." keeps its capitals: it stays in view (WORD-1),
// so it is never behind "Why this", and it stops two doses being given.
//
// §WORD-TIDY (2026-11-08, the same evening): the same checks now cover the
// sentences that show WITHOUT a click (note.lead, on every card) and the whole
// note of a card that is shut by default ("Complete", "Not indicated"). That
// pass left "Choose ONE option" as the one exception, by name, and the
// paragraph length applies to "Why this" only.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { sentencesOf } from '../noteFold.js';
import { buildCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';

// The longest "Why this" in any test patient on 2026-11-08, after the rewrite
// (it was 118 before): a PCV of unrecorded product, two PPSV23 doses, and the
// sentence saying why a PCV13 recommendation still applies.
//
// 92 → 100, 2026-11-08 (§WORD-TIDY), on 2 of the 60,480 typical patients (an
// immunocompromised child, a PCV of unrecorded product, a PPSV23 that did not
// count). By rule 1, the reason "A PPSV23 that did not count has no effect on
// when a PCV counts" left the line in view and joined this paragraph. The grid
// and the impossible entries still top out at 92 and 84.
const MAX_PARAGRAPH_WORDS = 100;

const RULES = [
  ['rule 3: talks about the document', /\brows?\b|\bworded\b|\bfootnote\b|\bprints?\b/i],
  ['rule 4: semicolon', /;/],
  ['rule 5: arguing', /either way|does not change/i],
  ['rule 8: "~"', /~/],
  ['rule 8: UK spelling', /paediatric|neighbour/i],
  ['capitals for emphasis', /\bONE further\b|\bINCOMPLETE\b|\bNOT routine\b/],
  ['rule 3: names the document', /\bCDC's row\b|\bACIP's own row\b|\bACIP puts\b/],
];
// Kept by her ruling, and only in view: it stops two doses being given.
const KEPT_IN_VIEW = /^Choose ONE option\b/;

const words = (s) => s.replace(/\[c\]/g, '').replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;

export function whyThisProblems(cases) {
  const problems = [];
  let paragraphs = 0;
  for (const c of cases) {
    for (const rec of recommend(c.input).recs ?? []) {
      const note = rec.note && typeof rec.note === 'object' ? rec.note : { lead: rec.note, detail: null };
      const say = (why, text) => problems.push(`${c.key}: ${rec.doseLabel}: ${why} — ${text.slice(0, 160)}`);
      const check = (s) => {
        for (const [why, re] of RULES) if (re.test(s)) say(why, s);
        if ((s.match(/—/g) ?? []).length > 1) say('rule 4: more than one dash', s);
      };
      for (const s of sentencesOf(note.lead ?? '')) if (!KEPT_IN_VIEW.test(s)) check(s);
      const detail = note.detail;
      if (!detail) continue;
      paragraphs += 1;
      for (const s of sentencesOf(detail)) check(s);
      if (words(detail) > MAX_PARAGRAPH_WORDS) say(`longer than ${MAX_PARAGRAPH_WORDS} words`, detail);
    }
  }
  return { problems, paragraphs };
}

describe('§WHY-THIS + §WORD-TIDY — every sentence on a card follows the style rules a machine can check', () => {
  it('the 17,016-patient grid', () => {
    const { problems, paragraphs } = whyThisProblems(buildCases());
    expect(problems.slice(0, 10)).toEqual([]);
    expect(paragraphs).toBeGreaterThan(10_000);
  }, 300_000);

  it('the 18,264 impossible entries', () => {
    const { problems } = whyThisProblems(buildRecordProblemCases());
    expect(problems.slice(0, 10)).toEqual([]);
  }, 300_000);

  it('the 60,480 typical patients', () => {
    const { problems, paragraphs } = whyThisProblems(buildTypicalCases());
    expect(problems.slice(0, 10)).toEqual([]);
    expect(paragraphs).toBeGreaterThan(10_000);
  }, 300_000);

  // The second sample she was shown, on a patient built by hand, so its words
  // are read here and not only swept above. (The other samples are pinned
  // word for word by their own regression tests, updated in the same commit.)
  it('the healthy 10-year-old says what CDC recommends, not what its row covers', () => {
    const r = recommend({ ageMonths: 120, today: '2026-11-08', riskIds: [], pcvDoses: [], ppsv23Doses: [] });
    const card = r.recs.find((x) => x.status === 'not-indicated');
    expect(card.note.detail).toMatch(/^CDC recommends PCV catch-up for healthy children only through age 4\. After that, PCV is recommended only for a child with a risk condition \[c\]\./);
  });
});
