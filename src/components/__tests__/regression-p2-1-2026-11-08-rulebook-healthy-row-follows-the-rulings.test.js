// P2-1 (wording audit, 2026-11-08) — the Rulebook's healthy-child row was
// behind three owner rulings.
//
// The page said: "From 5 years: no catch-up; not indicated. Re-evaluate at 50
// years, unless a PCV20 has been given." The cards, rightly, say more:
//   • Kai (2026-11-07, §B-5TO18): PCV15 and PPSV23 on record — no age-50 line,
//     because at 50 the adult card reads Complete.
//   • §B-ADULTRISK19 (2026-11-01): a 5–18-year-old with smoking or alcohol use
//     disorder selected is told to re-evaluate at 19, not 50.
//   • §B-50BABY (2026-11-07): a healthy child under 5 whose series is complete
//     is told to re-evaluate at 50 too — the page only described "From 5 years".
//
// A Rulebook sentence is WRITTEN, not generated, so it is held to the cards by
// worked patients — one per clause — whose `expect.note` / `noNote` asserts the
// sentence the card carries. This file checks both halves: the page's words
// name every clause, and each clause's patient really gets that card.
import { describe, it, expect } from 'vitest';
import { CHILD_LANES, WORKED_PATIENTS, sourcesFor } from '../../data/rulebook.js';
import { recommend } from '../../logic/recommend.js';

const healthy = CHILD_LANES.find((l) => l.group === 'Healthy');
const note = healthy.result.note;
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const run = (key) => recommend(WORKED_PATIENTS[key].input).recs.map(noteText).join(' \n ');

describe('P2-1: the Rulebook healthy row says what the cards say', () => {
  it('names every clause the cards follow', () => {
    expect(note).toMatch(/Re-evaluate at 50 years/);
    expect(note).toMatch(/under 5 years, once the series is complete/);
    expect(note).toMatch(/smoking or alcohol use disorder selected: at 19 years instead/);
    expect(note).toMatch(/Neither, if the series includes PCV20, or PCV15 and PPSV23/);
    // The old wording, which a PCV15 + PPSV23 child contradicted.
    expect(note).not.toMatch(/unless a PCV20 has been given/);
  });

  it('each clause has a worked patient on the row', () => {
    // The row's own "Source" buttons run these, so a reader can open each one.
    // smoker10 is listed too, though it already sits on the smoking column.
    for (const k of ['healthy6', 'healthy4done', 'healthy10pcv20', 'healthy10pcv15ppsv', 'smoker10']) {
      expect(WORKED_PATIENTS[k], k).toBeDefined();
      expect(healthy.ex.includes(WORKED_PATIENTS[k]), k).toBe(true);
    }
  });

  it('the row\'s Source panel carries a sentence for each age it names', () => {
    const keys = sourcesFor(healthy.ex, healthy.cite).map((q) => q.key);
    expect(keys).toEqual(['pedsHealthyCatchup', 'adultRoutine50', 'cdcAdultRiskFactorList']);
  });

  it('a healthy unvaccinated 6-year-old: re-evaluate at 50', () => {
    expect(run('healthy6')).toMatch(/Re-evaluate at age 50/);
  });
  it('a healthy 4-year-old with a complete series: re-evaluate at 50', () => {
    expect(run('healthy4done')).toMatch(/Re-evaluate at age 50/);
  });
  it('a healthy 10-year-old whose series is PCV20: no re-evaluation line', () => {
    expect(run('healthy10pcv20')).not.toMatch(/Re-evaluate/);
  });
  it('a healthy 10-year-old with PCV15 and PPSV23 (Kai): no re-evaluation line', () => {
    expect(run('healthy10pcv15ppsv')).not.toMatch(/Re-evaluate/);
  });
  it('a 10-year-old who smokes: re-evaluate at 19, not 50', () => {
    const t = run('smoker10');
    expect(t).toMatch(/Re-evaluate at age 19/);
    expect(t).not.toMatch(/Re-evaluate at age 50/);
  });
});
