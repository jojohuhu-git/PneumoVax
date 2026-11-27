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
//      page can never quote a document the app does not follow there. One
//      named exception since 2026-11-27 (RULEBOOK_ONLY_SOURCES).
//   2. The page shows few sentences, and the count is PINNED, so adding one is
//      a decision someone makes, not drift. (Before: 239 over 63 buttons.)
//   3. p2016 appears only where no CDC sentence on that card says the thing
//      (her rule of 2026-10-23), and each such row is named here with why.
//   4. Every PneumoVax decision is written once, named (not numbered), has the
//      same three parts as every other (Problem, CDC and ACIP say, PneumoVax
//      decision — her third review, no "Why"), is used somewhere, and opens in
//      place; the grey paragraphs that explained the wrong chip are gone.
//   5. A children's row that names no dose ≥5 years later really gives none —
//      the gap that let the 6-18 row say None for an immunocompromised child
//      for a day after P1-2 gave that child the 5-year dose.
//   6. On a phone. Her third review (2026-11-01) asked for a pinned first
//      column on any table too wide for the screen, and for long lists to
//      start closed. The 2026-11-27 reorganization (L1, L3) removed every
//      table wider than three columns and put every part behind a fold, so
//      this now asserts that no table needs to scroll sideways at all, and
//      the decision list still folds on a phone. (Layout cannot be measured
//      here — happy-dom draws nothing — so it was checked in the running app
//      at 375 px.)
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import Rulebook from '../Rulebook.jsx';
import {
  ROUTINE_INFANT, CHILD_GROUPS, ADULT_GROUPS, ADULT_OPTIONS, ADULT_HISTORY, CHILD_RANKING, DOSES_BY_AGE,
  NOT_COUNTED, PCV_AFTER_PCV, PCV_AND_PPSV23, ADULT_INTERVALS, TRANSPLANT_STOP, CHIP_LEGEND, GRACE, FROM_NINETEEN,
  DECISIONS, DECISION_USES, RULEBOOK_ONLY_SOURCES, decisionsOf, sourcesFor,
} from '../../data/rulebook.js';
import { REFS } from '../../data/refs.js';
import { recommend } from '../../logic/recommend.js';
import { intervalPhrase, PPSV23_REVACC_MIN_MONTHS } from '../../logic/intervals.js';

const SRC = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const rulebookSrc = readFileSync(join(SRC, 'data', 'rulebook.js'), 'utf8');

/** Every row on the page that can carry a Source or a decision, with a name. */
const ROWS = [
  ['routine infant series', ROUTINE_INFANT],
  ['children: doses in all by age at dose 1', DOSES_BY_AGE],
  ...CHILD_GROUPS.map((r) => [`children: ${r.group}`, r]),
  ['children: from 19', FROM_NINETEEN],
  ['children: more than one condition', CHILD_RANKING.note],
  ...ADULT_GROUPS.map((r) => [`adults: ${r.group}`, r]),
  ['adults: Option A / B', ADULT_OPTIONS],
  ...ADULT_HISTORY.map((r) => [`adults: ${r.history}`, r]),
  ...NOT_COUNTED.general.map((r) => [`not counted: ${r.text.slice(0, 40)}`, r]),
  ...NOT_COUNTED.special.map((r) => [`not counted: ${r.dose}`, r]),
  ['grace', GRACE],
  ['PCV after PCV', PCV_AFTER_PCV],
  ...PCV_AND_PPSV23.rows.map((r) => [`PCV and PPSV23: ${r.doses}`, r]),
  ['adult intervals', ADULT_INTERVALS],
  ...ADULT_INTERVALS.rows.map((r) => [`adult interval: ${r.doses}`, r]),
  ['transplant stop', TRANSPLANT_STOP],
  ...CHIP_LEGEND.map((r) => [`label: ${r.chip ?? r.chips.join('/')}`, r]),
];
const isP2016 = (k) => (REFS[k]?.url ?? '').includes('p2016');
const showAll = () => fireEvent.click(screen.getByRole('button', { name: 'Show all' }));

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

  it('the one Rulebook-only sentence is still quoted by no card (OWNER DECISION 2026-11-27)', () => {
    // sourcesFor() reads refs.js directly ONLY for RULEBOOK_ONLY_SOURCES, so
    // every other key above is proved to be on a card. If a card ever quotes
    // the grace sentence, the exception is no longer needed: remove it.
    expect(RULEBOOK_ONLY_SOURCES).toEqual(['gbpFiveDaysEarlyNotCounted']);
    const onCards = ROWS.flatMap(([, r]) => (r.ex ?? []).flatMap((e) => recommend(e.input).recs.flatMap((c) => c.noteCites ?? [])))
      .map((c) => c.key);
    for (const k of RULEBOOK_ONLY_SOURCES) expect(onCards).not.toContain(k);
    expect(sourcesFor(GRACE.ex, GRACE.cite).map((q) => q.quote)).toEqual([REFS.gbpFiveDaysEarlyNotCounted.quote]);
  });

  it('a row never names the same sentence twice', () => {
    for (const [name, row] of ROWS) {
      if (row.cite) expect(new Set(row.cite).size, name).toBe(row.cite.length);
    }
  });

  it('the page shows 55 sentences in all — pinned, so a new one is a choice, not drift (was 239)', () => {
    // 42 -> 43, P2-1 (2026-11-08): the healthy row's smoking/alcohol clause
    // (cdcAdultRiskFactorList, §B-ADULTRISK19).
    // 43 -> 55, the 2026-11-27 reorganization (owner mock-up). Every sentence
    // a row carried before is still carried by the row that replaced it (none
    // removed: a removal is a clinical act). The two age-band boxes (2) gave
    // way to the four adult group rows (7): +5. New: the "doses in all" table
    // (+4), the PCV-after-PCV table's two catch-up cells (+2), and the grace
    // sentence (+1, Rulebook only).
    const total = ROWS.reduce((n, [, row]) => n + (row.cite?.length ?? 0), 0);
    expect(total).toBe(55);
  });

  it('p2016 appears only where no CDC sentence on that card states the claim', () => {
    // Each entry is the row and the reason a CDC sentence could not be used.
    const ALLOWED = {
      'PCV and PPSV23: PPSV23, then PCV': 'CDC\'s 6-18 row on this card names the products, not the gap from a PPSV23',
      'children: doses in all by age at dose 1': 'CDC\'s notes state no catch-up TOTAL for 7-23 months; p2016 Table 1 does (OWNER RULING B, 2026-10-23)',
    };
    const found = Object.fromEntries(ROWS.filter(([, r]) => (r.cite ?? []).some(isP2016)).map(([n]) => [n, true]));
    expect(Object.keys(found).sort()).toEqual(Object.keys(ALLOWED).sort());
  });

  it('a pure PneumoVax decision, and the app\'s own dose labels, carry no Source', () => {
    expect(TRANSPLANT_STOP.cite).toBeUndefined();
    for (const r of CHIP_LEGEND) expect(r.cite).toBeUndefined();
    const { container } = render(<Rulebook />);
    showAll();
    expect(container.querySelector('#rb-stop-card').closest('section').querySelector('.rb-src-btn')).toBeNull();
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
    // the why at the end." She chose the gap before the answer. The middle
    // label reads "CDC and ACIP say:" since 2026-11-27 (mock-up, as MeningoVax).
    for (const d of DECISIONS) {
      for (const part of ['short', 'problem', 'cdc', 'does']) {
        expect(typeof d[part] === 'string' && d[part].trim().length > 0, `${d.key} has no ${part}`).toBe(true);
      }
      for (const gone of ['when', 'why', 'n']) expect(d[gone], `${d.key} still has ${gone}`).toBeUndefined();
    }
    const { container } = render(<Rulebook />);
    showAll();
    const items = container.querySelectorAll('.rb-declist-item');
    expect(items).toHaveLength(DECISIONS.length);
    for (const li of items) {
      expect([...li.querySelectorAll('.rb-dec-line strong')].map((x) => x.textContent))
        .toEqual(['Problem:', 'CDC and ACIP say:', 'PneumoVax decision:']);
    }
    expect(container.textContent).not.toMatch(/PneumoVax decision \d/);
  });

  it('every decision a row names exists', () => {
    const keys = new Set(DECISIONS.map((d) => d.key));
    for (const [name, row] of ROWS) for (const k of decisionsOf(row)) expect(keys.has(k), `${name}: ${k}`).toBe(true);
  });

  it('the chip is a button that opens its own reason in place, with no instruction sentence', () => {
    const { container } = render(<Rulebook />);
    showAll();
    const chip = container.querySelector('#rb-stop-card').closest('section').querySelector('button.rb-decision');
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
    showAll();
    expect(container.querySelector('.rb-def')).toBeNull();
    expect(container.querySelector('.rb-matrix')).toBeNull();
    expect(container.querySelector('[class*="rb-tone-"]')).toBeNull();
  });
});

describe('a children\'s row names a later dose only when the app gives one', () => {
  const Y5 = intervalPhrase({ months: PPSV23_REVACC_MIN_MONTHS });
  const later = new RegExp(`${Y5} (later|after)`);
  // A sentence about what the ADULT schedule gives at 19 is not this row's: the
  // row's answer is the child schedule, and the Adults table answers for 19.
  // Cora (owner, 2026-11-07) put one on Option B, worded "If PPSV23 is chosen,
  // at 19 …".
  const atNineteen = /(^|\. )(If PPSV23 is chosen, at 19|At 19,)[^[]*\[c\]\.?/g;
  const notesOf = (e) => recommend(e.input).recs
    .map((r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`))
    .map((n) => n.replace(atNineteen, '$1'));
  const saysLater = (g) => new RegExp(`≥${Y5} later`).test(g.after);

  it(`no worked patient on a row naming no dose ${Y5} later is given one`, () => {
    for (const g of CHILD_GROUPS.filter((x) => !saysLater(x))) {
      for (const e of g.ex) expect(notesOf(e).some((n) => later.test(n)), `${g.group}: ${e.who}`).toBe(false);
    }
  });

  it(`a row naming a dose ${Y5} later has a worked patient the app gives it to`, () => {
    const rows = CHILD_GROUPS.filter(saysLater);
    expect(rows.length).toBeGreaterThan(0);
    for (const g of rows) expect(g.ex.some((e) => notesOf(e).some((n) => later.test(n))), g.group).toBe(true);
  });
});

describe('the adult PCV to PPSV23 interval has one home', () => {
  it('is written once in rulebook.js and reused, not retyped', () => {
    expect(rulebookSrc.match(/an option from \$\{ROUTINE_AT\}/g)).toHaveLength(1);
    expect(rulebookSrc.match(/may be considered for \$\{IC_SPECIAL\}/g)).toHaveLength(1);
  });
});

describe('on a phone: nothing scrolls sideways, and the decisions fold', () => {
  const css = readFileSync(join(SRC, 'App.css'), 'utf8');
  const phoneBlock = (selector) => {
    const at = css.indexOf(selector);
    const media = css.lastIndexOf('@media (max-width:', at);
    // Inside that media block: no top-level closing brace between them.
    return at > -1 && media > -1 && !/\n\}/.test(css.slice(media, at));
  };

  it('no table is wider than three columns, so none needs a pinned column', () => {
    // 2026-11-27: the five-column vaccines table became three (E3) and the
    // adult history table lost its "Any" column (E11). The pinned-column CSS
    // went with them; this keeps a wide table from coming back unpinned.
    const { container } = render(<Rulebook />);
    showAll();
    const tables = [...container.querySelectorAll('table')];
    expect(tables.length).toBeGreaterThan(8);
    for (const t of tables) {
      const cols = t.querySelectorAll('thead th').length;
      expect(cols, t.getAttribute('aria-label')).toBeLessThanOrEqual(3);
      expect(t.classList.contains('rb-fixed'), t.getAttribute('aria-label')).toBe(true);
    }
    expect(css).not.toMatch(/\.rb-freeze/);
  });

  it('the decision list starts closed on a phone, behind a named bar, and Show all opens it', () => {
    // "Trying to decrease amount of scrolling needed ... Can these risk groups
    // be expandable rather than everything open?"
    const { container } = render(<Rulebook />);
    fireEvent.click(container.querySelector('#rb-decisions-h button'));
    const items = container.querySelectorAll('.rb-declist-item');
    expect(items).toHaveLength(DECISIONS.length);
    for (const it of items) {
      expect(it.classList.contains('rb-fold')).toBe(true);
      expect(it.classList.contains('rb-open')).toBe(false);
      const bar = [...it.children].find((c) => c.matches('button.rb-fold-btn'));
      expect(bar.getAttribute('aria-expanded')).toBe('false');
      fireEvent.click(bar);
      expect(it.classList.contains('rb-open')).toBe(true);
    }
    // Closed hides everything but the bar, on a phone only; on a computer the
    // bar is hidden and everything is open.
    expect(css).toMatch(/\.rb-fold-btn \{ display: none; \}/);
    expect(phoneBlock('.rb-fold:not(.rb-open) > :not(.rb-fold-btn) { display: none; }')).toBe(true);
  });

  it('the patient screen\'s age-entry buttons wrap inside their card', () => {
    expect(css).toMatch(/\.step-toggle-row \{[^}]*flex-wrap: wrap;/);
    expect(css).toMatch(/\.step-toggle-btn \{[^}]*white-space: normal;/);
  });
});
