// @vitest-environment happy-dom
// 2026-11-01, the owner's second Rulebook review — the page in the app's own
// order, one source sentence per claim, and numbered PneumoVax decisions.
//
// Her brief: "I want this rulebook to follow the logic of the app but also be
// instructive for a user to find the relevant rule to back up a piece of
// vaccine logic without being overwhelmed by text or figures."
//
// What this file holds the page to:
//   1. A Source shows only the sentences its row names, and each one is a
//      sentence the app's own card cites for that row's worked patient — the
//      page can never quote a document the app does not follow there.
//   2. The page shows few sentences, and the count is PINNED, so adding one is
//      a decision someone makes, not drift. (Before: 239 over 63 buttons.)
//   3. p2016 appears only where no CDC sentence on that card says the thing
//      (her rule of 2026-10-23), and each such row is named here with why.
//   4. Every PneumoVax decision is written once, named (not numbered), has the
//      same three parts as every other (Problem, CDC and ACIP, PneumoVax
//      decision — her third review, no "Why"), is used somewhere, and opens in
//      place; the grey paragraphs that explained the wrong chip are gone.
//   6. On a phone (her third review, 2026-11-01): a table too wide for the
//      screen scrolls sideways with its first column pinned; the risk groups,
//      the 2-18 rows and the decision list start closed; a step a group does
//      not get is not shown. The patient screen's age buttons wrap inside
//      their card. (Layout cannot be measured here — happy-dom draws nothing —
//      so these assert the markup and CSS the layout depends on; it was
//      checked in the running app at 375 px.)
//   5. A children's row whose last step reads "None" really gives no later
//      dose — the gap that let the 6-18 row say None for an immunocompromised
//      child for a day after P1-2 gave that child the 5-year dose.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import Rulebook from '../Rulebook.jsx';
import {
  ROUTINE_INFANT, CHILD_LANES, ADULT_BANDS, ADULT_OPTIONS, ADULT_HISTORY, RISK_COLUMNS, SERIES_PATTERNS,
  CHILD_EXCEPTIONS, PCV_AND_PPSV23, INVALID_ACTIONS, ADULT_INTERVALS, TRANSPLANT_STOP, CHIP_LEGEND,
  DECISIONS, DECISION_USES, decisionsOf, sourcesFor,
} from '../../data/rulebook.js';
import { REFS } from '../../data/refs.js';
import { recommend } from '../../logic/recommend.js';
import { intervalPhrase, PPSV23_REVACC_MIN_MONTHS } from '../../logic/intervals.js';

const SRC = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const rulebookSrc = readFileSync(join(SRC, 'data', 'rulebook.js'), 'utf8');

/** Every row on the page that can carry a Source or a decision, with a name. */
const ROWS = [
  ['routine infant series', ROUTINE_INFANT],
  ...CHILD_LANES.map((r) => [`children: ${r.group}`, r]),
  ...ADULT_BANDS.map((r) => [`adults: ${r.label}`, r]),
  ['adults: Option A / B', ADULT_OPTIONS],
  ...ADULT_HISTORY.flatMap((h) => h.splits.map((s) => [`adults: ${h.history} / ${s.risk ?? 'Any'}`, s])),
  ...RISK_COLUMNS.map((r) => [`risk group: ${r.name}`, r]),
  ...SERIES_PATTERNS.map((r) => [`pattern: ${r.name}`, r]),
  ...CHILD_EXCEPTIONS.map((r) => [`child exception: ${r.text.slice(0, 40)}`, r]),
  ...PCV_AND_PPSV23.map((r) => [`PCV and PPSV23: ${r.doses}`, r]),
  ...INVALID_ACTIONS.rows.map((r) => [`invalid: ${r.dose}`, r]),
  ...ADULT_INTERVALS.rows.map((r) => [`adult interval: ${r.doses}`, r]),
  ['transplant stop', TRANSPLANT_STOP],
  ...CHIP_LEGEND.map((r) => [`label: ${r.chip ?? r.chips.join('/')}`, r]),
];
const isP2016 = (k) => (REFS[k]?.url ?? '').includes('p2016');

describe('one source sentence per claim, and only sentences the app uses', () => {
  it('every sentence a row names is one the app\'s own card cites for that row\'s patient', () => {
    const missing = [];
    for (const [name, row] of ROWS) {
      if (!row.cite) continue;
      expect(row.ex?.length, `${name} names sources but has no patient`).toBeGreaterThan(0);
      const shown = sourcesFor(row.ex, row.cite).map((q) => q.key);
      for (const k of row.cite) if (!shown.includes(k)) missing.push(`${name}: ${k}`);
    }
    expect(missing).toEqual([]);
  });

  it('a row never names the same sentence twice', () => {
    for (const [name, row] of ROWS) {
      if (row.cite) expect(new Set(row.cite).size, name).toBe(row.cite.length);
    }
  });

  it('the page shows 42 sentences in all — pinned, so a new one is a choice, not drift (was 239)', () => {
    const total = ROWS.reduce((n, [, row]) => n + (row.cite?.length ?? 0), 0);
    expect(total).toBe(42);
  });

  it('p2016 appears only where no CDC sentence on that card states the claim', () => {
    // Each entry is the row and the reason a CDC sentence could not be used.
    const ALLOWED = {
      'PCV and PPSV23: PPSV23, then PCV': 'CDC\'s 6-18 row on this card names the products, not the gap from a PPSV23',
    };
    const found = Object.fromEntries(ROWS.filter(([, r]) => (r.cite ?? []).some(isP2016)).map(([n]) => [n, true]));
    expect(Object.keys(found).sort()).toEqual(Object.keys(ALLOWED).sort());
  });

  it('a pure PneumoVax decision, and the app\'s own dose labels, carry no Source', () => {
    expect(TRANSPLANT_STOP.cite).toBeUndefined();
    for (const r of CHIP_LEGEND) expect(r.cite).toBeUndefined();
    for (const r of SERIES_PATTERNS) expect(r.cite).toBeUndefined();
    const { container } = render(<Rulebook />);
    expect(container.querySelector('#rb-stop').closest('section').querySelector('.rb-src-btn')).toBeNull();
  });
});

describe('PneumoVax decisions: written once, named, consistent, opened in place', () => {
  it('each decision has a unique key and name, and is used somewhere on the page', () => {
    expect(new Set(DECISIONS.map((d) => d.key)).size).toBe(DECISIONS.length);
    expect(new Set(DECISIONS.map((d) => d.short)).size).toBe(DECISIONS.length);
    for (const d of DECISIONS) expect(DECISION_USES[d.key].length, `${d.key} is never used`).toBeGreaterThan(0);
  });

  it('every decision has the same three parts, in order, and no number (owner, 2026-11-01)', () => {
    // "Some have when some don't, Some clearly say what pneumovax will decide
    // and others don't. Each section ... should be consistent." Then, third
    // review: "The problem/what the issue is and why it's a problem, PneumoVax
    // decision. What CDC and ACIP provide or have lack of guidance for. Remove
    // the why at the end." She chose the gap before the answer.
    for (const d of DECISIONS) {
      for (const part of ['short', 'problem', 'cdc', 'does']) {
        expect(typeof d[part] === 'string' && d[part].trim().length > 0, `${d.key} has no ${part}`).toBe(true);
      }
      for (const gone of ['when', 'why', 'n']) expect(d[gone], `${d.key} still has ${gone}`).toBeUndefined();
    }
    const { container } = render(<Rulebook />);
    const items = container.querySelectorAll('.rb-declist-item');
    expect(items).toHaveLength(DECISIONS.length);
    for (const li of items) {
      expect([...li.querySelectorAll('.rb-dec-line strong')].map((x) => x.textContent))
        .toEqual(['Problem:', 'CDC and ACIP:', 'PneumoVax decision:']);
    }
    expect(container.textContent).not.toMatch(/PneumoVax decision \d/);
  });

  it('every decision a row names exists', () => {
    const keys = new Set(DECISIONS.map((d) => d.key));
    for (const [name, row] of ROWS) for (const k of decisionsOf(row)) expect(keys.has(k), `${name}: ${k}`).toBe(true);
  });

  it('the chip is a button that opens its own reason in place, with no instruction sentence', () => {
    const { container } = render(<Rulebook />);
    const chip = container.querySelector('#rb-stop').closest('section').querySelector('button.rb-decision');
    expect(chip.textContent).toBe(`PneumoVax decision: ${DECISIONS[0].short}`);
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(chip);
    expect(chip.getAttribute('aria-expanded')).toBe('true');
    expect(chip.parentElement.querySelector('.rb-dec-panel').textContent).toContain(DECISIONS[0].problem);
    // Owner, 2026-11-01: "I don't want an unelegant sentence below the chip like click to expand".
    expect(container.textContent).not.toMatch(/click to|tap to|to expand/i);
  });

  it('the grey decision paragraphs and the coloured risk grid are gone', () => {
    const { container } = render(<Rulebook />);
    expect(container.querySelector('.rb-def')).toBeNull();
    expect(container.querySelector('.rb-matrix')).toBeNull();
    expect(container.querySelector('[class*="rb-tone-"]')).toBeNull();
  });
});

describe('a children\'s row says None only when the app gives no later dose', () => {
  const Y5 = intervalPhrase({ months: PPSV23_REVACC_MIN_MONTHS });
  const later = new RegExp(`${Y5} (later|after)`);
  const notesOf = (e) => recommend(e.input).recs
    .map((r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`));

  it(`no worked patient on a row ending in None is given a dose ${Y5} later`, () => {
    for (const lane of CHILD_LANES.filter((l) => l.steps[2].kind === 'none')) {
      for (const e of lane.ex) expect(notesOf(e).some((n) => later.test(n)), `${lane.group}: ${e.who}`).toBe(false);
    }
  });

  it(`a row with a step ${Y5} after PPSV23 has a worked patient the app gives it to`, () => {
    for (const lane of CHILD_LANES.filter((l) => l.steps[2].kind === 'dose')) {
      expect(lane.ex.some((e) => notesOf(e).some((n) => later.test(n))), lane.group).toBe(true);
    }
  });
});

describe('the adult PCV15 to PPSV23 interval has one home', () => {
  it('is written once in rulebook.js and reused, not retyped', () => {
    expect(rulebookSrc.match(/may be considered for these conditions/g)).toHaveLength(1);
    expect(ADULT_OPTIONS.note).toContain(ADULT_INTERVALS.rows[0].text);
  });
});

describe('on a phone: pinned first column, closed parts, no blank steps (owner, 2026-11-01)', () => {
  const css = readFileSync(join(SRC, 'App.css'), 'utf8');
  const phoneBlock = (selector) => {
    const at = css.indexOf(selector);
    const media = css.lastIndexOf('@media (max-width:', at);
    // Inside that media block: no top-level closing brace between them.
    return at > -1 && media > -1 && !/\n\}/.test(css.slice(media, at));
  };

  it('a table with more than three columns, or the adult history table, pins its first column', () => {
    // "For any tables on phone that require scrolling to the right, can the
    // first column be frozen and the rest of the columns can scroll?"
    const { container } = render(<Rulebook />);
    const tables = [...container.querySelectorAll('table')];
    expect(tables.length).toBeGreaterThan(4);
    for (const t of tables) {
      const cols = t.querySelectorAll('thead th').length;
      const label = t.textContent.slice(0, 40);
      if (cols > 3 || t.classList.contains('rb-history')) {
        expect(t.classList.contains('rb-freeze'), label).toBe(true);
        expect(t.querySelector('thead th').classList.contains('rb-freeze-col'), label).toBe(true);
        // Every row's first-column cell is pinned (a spanned cell counts once).
        const pinned = t.querySelectorAll('tbody td.rb-freeze-col').length;
        const groups = t.querySelectorAll('tbody tr:not(.rb-grp):not(.rb-hist-more)').length;
        expect(pinned, label).toBe(groups);
        // It scrolls inside a box of its own, never the padded card.
        expect(t.parentElement.classList.contains('rb-scroll'), label).toBe(true);
        expect(t.parentElement.classList.contains('rb-card'), label).toBe(false);
      } else {
        expect(t.classList.contains('rb-freeze'), label).toBe(false);
      }
    }
    expect(container.querySelector('.rb-stack')).toBeNull();
  });

  it('the pin is a phone rule: sticky, at the left edge, inside the phone media block', () => {
    expect(css).toMatch(/\.rb-freeze-col \{ position: sticky; left: 0;/);
    expect(phoneBlock('.rb-freeze-col { position: sticky;')).toBe(true);
    expect(phoneBlock('.rb-freeze { min-width:')).toBe(true);
    expect(css).not.toMatch(/\.rb-stack/);
  });

  it('the risk groups, the 2-18 rows and the decision list start closed on a phone, behind a named bar', () => {
    // "Trying to decrease amount of scrolling needed ... Can these risk groups
    // be expandable rather than everything open?"
    const { container } = render(<Rulebook />);
    const folds = {
      '.rb-group': RISK_COLUMNS.length,
      '.rb-lanes-row:not(.rb-lanes-head)': CHILD_LANES.length,
      '.rb-declist-item': DECISIONS.length,
    };
    for (const [sel, n] of Object.entries(folds)) {
      const items = container.querySelectorAll(sel);
      expect(items, sel).toHaveLength(n);
      for (const it of items) {
        expect(it.classList.contains('rb-fold'), sel).toBe(true);
        expect(it.classList.contains('rb-open'), sel).toBe(false);
        const bar = [...it.children].find((c) => c.matches('button.rb-fold-btn'));
        expect(bar.getAttribute('aria-expanded'), sel).toBe('false');
        fireEvent.click(bar);
        expect(it.classList.contains('rb-open'), sel).toBe(true);
        expect(bar.getAttribute('aria-expanded'), sel).toBe('true');
      }
    }
    // Closed hides everything but the bar, on a phone only; on a computer the
    // bar is hidden and everything is open.
    expect(css).toMatch(/\.rb-fold-btn \{ display: none; \}/);
    expect(phoneBlock('.rb-fold:not(.rb-open) > :not(.rb-fold-btn) { display: none; }')).toBe(true);
    // A 2-18 row's bar says what the row gives, in order.
    const healthy = container.querySelector('.rb-lanes-row:not(.rb-lanes-head) .rb-fold-sum');
    expect(healthy.textContent).toBe('Routine PCV series → Complete');
  });

  it('a step a group does not get is not shown, and the routine series points up the page', () => {
    // "if there are blank steps should they even be there?" — "Everywhere".
    // "Routine series should specify routine PCV series so the user knows to look above."
    const { container } = render(<Rulebook />);
    const lanes = container.querySelector('.rb-lanes');
    expect(lanes.textContent).not.toMatch(/\bNone\b/);
    const blanks = CHILD_LANES.flatMap((l) => l.steps).filter((s) => s.kind === 'none').length;
    expect(blanks).toBeGreaterThan(0);
    expect(lanes.querySelectorAll('.rb-lane-blank')).toHaveLength(blanks);
    for (const b of lanes.querySelectorAll('.rb-lane-blank')) expect(b.textContent).toBe('');
    expect(phoneBlock('.rb-lane-blank { display: none; }')).toBe(true);
    expect(lanes.textContent).not.toMatch(/Routine series/);
    expect(lanes.textContent).toMatch(/Routine PCV series \(above\)/);
  });

  it('the patient screen\'s age-entry buttons wrap inside their card', () => {
    expect(css).toMatch(/\.step-toggle-row \{[^}]*flex-wrap: wrap;/);
    expect(css).toMatch(/\.step-toggle-btn \{[^}]*white-space: normal;/);
  });
});
