// ── Whole-app rule checks: the parts that pass today (2026-11-05) ─────────
//
// `scripts/wholeApp/` holds seven checks over every patient. Most of them still
// fail on known faults, listed in docs/archive/report-2026-11-05-whole-app-rule-
// checks.md, and they stay OUT of this suite until those fixes land. This file
// holds only what is at zero today, so a red here is always a new fault:
//
//   • the typical-patient list is what it says, and `buildCases()` did not move;
//   • every card can be read: the harness error that produced 924 false flags
//     (a card with no date read as "due today") cannot quietly return;
//   • check 6: at every age line, ON the line matches just inside it, nothing
//     changes that the line's rule does not cover, and every line still acts.
//
// The one known part of check 6 left out is `ask-turns-to-complete-at-19`
// (report, R2). It is filtered by name, so anything new still fails here.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases, buildTypicalCases, GRID_TYPICAL_CHILD_AGES_MONTHS } from '../../test-grid.js';
import { addCalendarMonths } from '../dateUtils.js';
import { allPatients, readCard } from '../../../scripts/wholeApp/replay.mjs';
import {
  ageLineCheck, doseLineCases, doseLineCheck, newTally,
} from '../../../scripts/wholeApp/checks.mjs';
import {
  deadLines, expectedAtAgeLine, expectedAtDoseLine,
} from '../../../scripts/wholeApp/causes.mjs';
import { GRID_RISK_PROFILES } from '../../test-grid.js';

describe('the typical-patient list', () => {
  const typical = buildTypicalCases();

  it('is the size it is pinned to, with no key used twice', () => {
    expect(typical.length).toBe(60480);
    expect(new Set(typical.map((c) => c.key)).size).toBe(60480);
  });

  it('leaves buildCases alone: 17,016 patients, none shared with this list', () => {
    const grid = buildCases();
    expect(grid.length).toBe(17016);
    const keys = new Set(grid.map((c) => c.key));
    expect(typical.some((c) => keys.has(c.key))).toBe(false);
  });

  it('no dose before birth or after today', () => {
    const bad = typical.filter((c) => [...c.input.pcvDoses, ...c.input.ppsv23Doses]
      .some((d) => d.date < c.input.dob || d.date > c.input.today));
    expect(bad.map((c) => c.key)).toEqual([]);
  });

  it('reaches what the first grid cannot: a 10-year-old with an on-time infant series', () => {
    expect(GRID_TYPICAL_CHILD_AGES_MONTHS).toContain(120);
    const child = typical.find((c) => c.key === 'tc120|r:asplenia|P:PCV13@2m,PCV13@4m,PCV13@6m,PCV13@12m|S:');
    expect(child.input.pcvDoses.map((d) => d.date)).toEqual(
      [2, 4, 6, 12].map((m) => addCalendarMonths(child.input.dob, m)),
    );
  });
});

describe('every card can be read', () => {
  it('no card on any patient\'s first screen falls outside the closed list', () => {
    // The whole grid and every tenth typical patient: the same cards, in a
    // fraction of the time. `run.mjs` reads every card on every screen.
    const unread = [];
    allPatients().forEach((p, i) => {
      if (p.group === 'typical' && i % 10) return;
      for (const r of recommend(p.input).recs ?? []) {
        if (readCard(r, p.input.dob, p.input.today).kind === 'unreadable') unread.push(`${p.key}: ${r.doseLabel}`);
      }
    });
    expect(unread).toEqual([]);
  });

  it('"not due until 12 months" is read as the first birthday, never as today', () => {
    const dob = '2026-04-11';
    const today = '2026-10-11';
    const card = { status: 'catchup', dueToday: false, earliestNextDate: null, note: 'This final dose is not due until the patient reaches 12 months.' };
    expect(readCard(card, dob, today)).toEqual({ kind: 'age-gated', date: '2027-04-11' });
  });
});

describe('check 6: age lines', () => {
  const tally = newTally();
  for (const p of allPatients()) {
    tally.setPatient(p);
    ageLineCheck(tally, p, expectedAtAgeLine);
  }
  doseLineCases(GRID_RISK_PROFILES).forEach((c) => {
    tally.setPatient({ key: `dose-line|${c.product}@${c.L}m|${c.prior.name}|r:${c.riskIds.join('+')}`, group: 'typical', input: c });
    doseLineCheck(tally, c, expectedAtDoseLine);
  });
  const rows = tally.rows();
  const allowedKinds = new Set([
    'line-changes-what-the-rule-says',
    'dose-line-changes-what-the-rule-says',
    'ask-turns-to-complete-at-19',         // report R2: out until its fix lands
  ]);
  const sortedAsRuling = (r) => r.cause === 'D2-extra-dose-counts-at-19';

  it('nothing changes at a line that the line\'s rule does not cover', () => {
    const left = rows.filter((r) => !allowedKinds.has(r.kind) && !sortedAsRuling(r));
    expect(left.map((r) => `${r.kind} — ${r.group}`)).toEqual([]);
  });

  it('every line still does its job', () => {
    expect(deadLines(rows)).toEqual([]);
  });
});
