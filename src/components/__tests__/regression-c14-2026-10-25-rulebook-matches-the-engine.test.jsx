// @vitest-environment happy-dom
// C14 (2026-10-25), rebuilt 2026-11-01 for the redesigned page — "How
// PneumoVax decides" cannot quietly stop describing the app.
//
// WHY THIS GUARD EXISTS. The owner asked for a map of the rules a clinician
// could follow, like PediVax's Rulebook screen. PediVax generates its rulebook
// from data files, so it cannot drift. PneumoVax's rules are mostly branching
// code, so part of this page is sentences somebody typed — and a typed
// sentence about a rule is exactly the failure this repo has been bitten by
// before: the post-transplant schedule disagreed with its own documentation
// for 32 days and nothing in the suite could see it.
//
// The 2026-11-01 redesign (her design canvas) has far more sentences than the
// first page, so it is held by two rules instead of one:
//
//   1. NO NUMBER IS TYPED in rulebook.js's page text. Every age and interval
//      is interpolated from a constant the engine reads. The guard below reads
//      the SOURCE and fails on a typed one — "update" a sentence to 65 while
//      the engine says 50 and this goes red.
//   2. EVERY CLAIM CARRIES A WORKED PATIENT, and every worked patient is run
//      through recommend() here. A sentence that stops being true of the app
//      fails its patient.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import Rulebook from '../Rulebook.jsx';
import RecCard from '../RecCard.jsx';
import { doseChipLabel } from '../doseChipLabel.js';
import {
  BOUNDARIES, PRODUCTS, RISK_GROUPS, SOURCE_GROUPS, monthsInWords, WORKED_PATIENTS,
  CHILD_LANES, CHILD_EXCEPTIONS, INVALID_EXAMPLE, ADULT_HISTORY, ADULT_OPTIONS, RISK_RANKING, RISK_COLUMNS, DECISIONS,
  SERIES_PATTERNS, CHIP_LEGEND, PCV_AND_PPSV23, INVALID_ACTIONS, SPACING_RULE_IDS, ROUTINE_INFANT,
  PCV_AFTER_PCV, TRANSPLANT_STOP, VACCINE_ROWS, sourcesFor,
} from '../../data/rulebook.js';
import { ADULT_SCHED_MIN_M, PCV21_MIN_AGE_M, ROUTINE_ADULT_MIN_M } from '../../logic/scheduleConstants.js';
import { DOSE_INTERVAL_RULES } from '../../logic/doseIntervalRules.js';
import { ALL_PRODUCTS } from '../../data/brands.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { REFS } from '../../data/refs.js';
import { recommend } from '../../logic/recommend.js';

const SRC = dirname(dirname(dirname(fileURLToPath(import.meta.url))));   // src/
const rulebookSrc = readFileSync(join(SRC, 'data', 'rulebook.js'), 'utf8');
const componentSrc = readFileSync(join(SRC, 'components', 'Rulebook.jsx'), 'utf8');
const engineSrc = readFileSync(join(SRC, 'logic', 'recommend.js'), 'utf8');

/** What the app says for a worked patient, in the shape `expect` describes. */
function check(key, e) {
  const out = recommend(e.input);
  const x = e.expect;
  const recs = out.recs ?? [];
  const labels = recs.map((r) => r.doseLabel ?? '');
  const notes = recs.map((r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`));
  const fails = [];
  for (const re of x.cards ?? []) if (!labels.some((l) => re.test(l))) fails.push(`no card ${re}`);
  for (const re of x.noCards ?? []) if (labels.some((l) => re.test(l))) fails.push(`unexpected card ${re}`);
  for (const re of x.note ?? []) if (!notes.some((l) => re.test(l))) fails.push(`no note ${re}`);
  for (const re of x.noNote ?? []) if (notes.some((l) => re.test(l))) fails.push(`unexpected note ${re}`);
  if (x.status && !recs.some((r) => r.status === x.status)) fails.push(`no ${x.status} card`);
  if (x.due) {
    const d = recs[0]?.dueToday ? 'today' : recs[0]?.earliestNextDate;
    if (d !== x.due) fails.push(`due ${d}, page says ${x.due}`);
  }
  if (x.excluded && !out.excluded) fails.push('not stopped');
  if (x.chip) {
    const [stream, i, want] = x.chip;
    const total = recs.find((r) => r.vaccine === (stream === 'pcv' ? 'PCV' : 'PPSV23'))?.seriesTotal ?? null;
    const got = doseChipLabel(out.perDose?.[stream]?.[i], total);
    if (got !== want) fails.push(`chip reads "${got}", page says "${want}"`);
  }
  return fails.map((f) => `${key} (${e.who}): ${f}`);
}

describe('C14 — every claim on the page is true of the app, patient by patient', () => {
  it('every worked patient gets the answer the page describes', () => {
    const fails = Object.entries(WORKED_PATIENTS).flatMap(([k, e]) => check(k, e));
    expect(fails).toEqual([]);
    expect(Object.keys(WORKED_PATIENTS).length).toBeGreaterThan(40);
  });

  it('every written row carries at least one worked patient', () => {
    const rows = [
      ...CHILD_LANES, ...CHILD_EXCEPTIONS, ...ADULT_HISTORY.flatMap((h) => h.splits), ADULT_OPTIONS, TRANSPLANT_STOP,
      ...RISK_RANKING.steps, ...SERIES_PATTERNS, ...CHIP_LEGEND, ...PCV_AND_PPSV23, ...INVALID_ACTIONS.rows, ...DECISIONS,
    ];
    const bare = rows.filter((r) => !r.ex?.length).map((r) => r.text ?? r.next ?? r.history ?? r.name ?? r.doses ?? r.dose ?? r.title);
    expect(bare).toEqual([]);
  });

  it('each dose label in the key is the label its worked patient\'s dose really shows', () => {
    for (const c of CHIP_LEGEND) {
      // An entry may show two labels (owner, 2026-11-01): each pairs, in
      // order, with a worked patient whose dose really reads that way.
      (c.chips ?? [c.chip]).forEach((chip, i) => {
        expect(c.ex[i].expect.chip?.[2], `"${chip}" has no chip check`).toBe(chip);
      });
    }
  });

  it('the invalid-dose example shows the labels its infant really gets', () => {
    const e = INVALID_EXAMPLE.ex[0];
    const out = recommend(e.input);
    const total = out.recs.find((r) => r.vaccine === 'PCV').seriesTotal;
    const [given, invalid, next] = INVALID_EXAMPLE.steps;
    expect(doseChipLabel(out.perDose.pcv[0], total)).toBe(given.chip);
    expect(doseChipLabel(out.perDose.pcv[1], total)).toBe(invalid.chip);
    // The third box is the dose the card advises: it takes dose 2's number.
    expect(out.recs.find((r) => r.vaccine === 'PCV').doseLabel).toMatch(new RegExp(next.chip, 'i'));
  });
});

describe('C14 — no age or interval on the page is typed by hand', () => {
  it('rulebook.js\'s page text holds no typed number', () => {
    // The page block only, without the worked patients (patient FACTS — dates,
    // ages at a dose — checked by running them, not by this scan).
    const page = rulebookSrc.slice(rulebookSrc.indexOf('THE PAGE'))
      .replace(/const P = \{[\s\S]*?\nexport const WORKED_PATIENTS/, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const offenders = [];
    // `field: '...'` inside a row, AND `const NAME = '...'` — a sentence shared
    // by several rows is a constant, and was invisible to the first form
    // until 2026-11-01.
    for (const m of page.matchAll(/(\w+)(?::|\s*=)\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/g)) {
      const [, field, , raw] = m;
      // A chip's words are asserted equal to doseChipLabel() above; an
      // `example` is a patient's facts, run as a patient.
      // EX_TODAY is the worked patients' "today" — a patient fact, like `example`.
      if (field === 'chip' || field === 'example' || field === 'EX_TODAY') continue;
      const text = raw
        .replace(/\$\{[^}]*\}/g, ' ')                              // interpolated: from a constant
        .replace(/\bP?[CP]C?S?V-?\d+\b/g, 'the vaccine')           // product names: PCV13, PPSV23
        .replace(/\b[Dd]ose \d+( → \d+| of \d+)?/g, 'a dose')      // dose numbers, not ages
        .replace(/\b[Ss]tep \d\b/g, 'a step')
        .replace(/\b\d+(st|nd|rd|th)\b/g, 'nth')
        .replace(/\b\d+( or \d+)? (catch-up )?(the vaccine )?(PCV )?doses?\b/g, 'some doses')
        .replace(/\b1 the vaccine or the vaccine dose\b/g, 'one dose');
      for (const n of text.matchAll(/\d+/g)) offenders.push(`${field}: "${raw.slice(0, 70)}" contains ${n[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('the ages it prints are the engine\'s own table, not a copy', () => {
    expect(rulebookSrc).toContain("ENGINE_AGE_LINES as AGE } from '../logic/recommend.js'");
    expect(engineSrc).toMatch(/export const ENGINE_AGE_LINES = Object\.freeze\(\{ \.\.\.M \}\)/);
  });

  it('the routine infant series is read out of CDC\'s own sentence', () => {
    expect(ROUTINE_INFANT.quote).toBe(REFS.pedsRoutine4Dose.quote);
    expect(ROUTINE_INFANT.ages).toHaveLength(ROUTINE_INFANT.total);
  });

  it('the component itself hardcodes no ages — it only renders what the data gives it', () => {
    const jsxText = componentSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const numbers = [...jsxText.matchAll(/>[^<>{}]*?\b(\d{2,3})\b[^<>{}]*?</g)].map((m) => m[1]);
    expect(numbers).toEqual([]);
  });

  it('keeps exactly the three schedule constants, imported rather than typed', () => {
    expect(BOUNDARIES.map((b) => b.months).sort((a, b) => a - b))
      .toEqual([PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M].sort((a, b) => a - b));
    expect(rulebookSrc).toContain("from '../logic/scheduleConstants.js'");
  });
});

describe('C14 — every list on the page is the engine\'s own list', () => {
  it('every spacing rule the engine applies is on exactly one row of section 5', () => {
    expect(SPACING_RULE_IDS.slice().sort()).toEqual(DOSE_INTERVAL_RULES.map((r) => r.id).sort());
    expect(new Set(SPACING_RULE_IDS).size).toBe(SPACING_RULE_IDS.length);
  });

  it('the catch-up grid is probed out of the engine\'s own function', () => {
    expect(PCV_AFTER_PCV.rows.map((r) => r.gap)).toEqual(['4 weeks', '8 weeks', '4 weeks', '8 weeks', '8 weeks', '4 weeks']);
    expect(rulebookSrc).toContain('pcvRule.interval.daysFrom(anchor, ctx)');
  });

  it('the vaccines table is ALL_PRODUCTS, and says which ones do not count', () => {
    const keys = VACCINE_ROWS.flatMap((g) => g.rows.map((r) => r.key));
    expect(keys.slice().sort()).toEqual(ALL_PRODUCTS.map((p) => p.key).sort());
    for (const r of VACCINE_ROWS.flatMap((g) => g.rows)) {
      expect(r.valid).toBe(ALL_PRODUCTS.find((p) => p.key === r.key).counts);
    }
    expect(PRODUCTS.map((p) => p.key)).toEqual(ALL_PRODUCTS.map((p) => p.key));
  });

  it('every risk condition is listed exactly once, and the transplant row is not', () => {
    const listed = RISK_COLUMNS.flatMap((c) => c.conditions);
    const expected = RISK_FACTORS.filter((r) => !r.exclude).map((r) => r.label);
    expect(listed.slice().sort()).toEqual(expected.slice().sort());
    expect(new Set(listed).size).toBe(listed.length);
    expect(RISK_GROUPS.find((g) => g.group === 'exclude').conditions.map((c) => c.id)).toEqual(['hct_cart_bcell_exclude']);
  });

  it('the transplant tick really does override everything, at every age', () => {
    for (const ageMonths of [2, 24, 120, ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M, 900]) {
      const r = recommend({ ageMonths, riskIds: ['hct_cart_bcell_exclude', 'asplenia'], pcvDoses: [], ppsv23Doses: [], today: '2026-10-25' });
      expect(r.excluded).toBe(true);
      expect(r.recs).toEqual([]);
    }
  });

  it('every source listed has a real URL and a date it was read', () => {
    const all = SOURCE_GROUPS.flatMap((g) => g.docs);
    expect(all.length).toBeGreaterThan(10);
    for (const s of all) {
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.url).not.toContain('#');
      expect(s.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('files every document under one heading, CDC first, and "children and adults" holds only documents about both', () => {
    const names = SOURCE_GROUPS.flatMap((g) => g.docs.map((d) => d.name));
    expect(new Set(names).size).toBe(names.length);
    expect(SOURCE_GROUPS.map((g) => g.book)).toEqual(['child', 'adult', 'any']);
    for (const g of SOURCE_GROUPS) {
      const rank = g.docs.map((d) => (d.publisher === 'CDC / ACIP' ? 0 : 1));
      expect(rank).toEqual(rank.slice().sort());
    }
    // Owner, 2026-10-31: the PCV21 report is about adults.
    const any = SOURCE_GROUPS.find((g) => g.book === 'any').docs.map((d) => d.name);
    expect(any).not.toContain('PCV21 MMWR');
  });

  it('a row\'s Source is the sentences the app\'s own cards cite for its patient', () => {
    const quotes = sourcesFor(ADULT_HISTORY[0].splits[0].ex).map((q) => q.quote);
    expect(quotes.length).toBeGreaterThan(0);
    const out = recommend(ADULT_HISTORY[0].splits[0].ex[0].input);
    const cited = out.recs.flatMap((r) => r.noteCites ?? []).map((c) => c.quote).filter(Boolean);
    expect(quotes.slice().sort()).toEqual([...new Set(cited)].sort());
  });
});

describe('C14 — the page renders, and reads as a clinician page', () => {
  it('renders the seven parts in the order the app decides (owner, 2026-11-01)', () => {
    render(<Rulebook />);
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(heads).toEqual([
      '1. The vaccines', '2. Age and risk group', '3. Children, birth to 18 years',
      '4. Adults, 19 years and over', '5. Doses on the record', '6. PneumoVax decisions', '7. Sources',
    ]);
  });

  it('opens a Source on request: quotes with their documents linked, and no test patients', () => {
    const { container } = render(<Rulebook />);
    const btn = container.querySelector('.rb-src-btn');
    fireEvent.click(btn);
    const panel = container.querySelector('.rb-src-panel');
    expect(panel.querySelector('a.rb-src-doc').getAttribute('href')).toMatch(/^https:\/\//);
    // Owner, 2026-11-01: "I only want to include references hyperlinked."
    expect(panel.textContent).not.toMatch(/Checked on/);
  });

  it('is titled Rulebook, with no exception box above section 1 (owner, 2026-11-01)', () => {
    const { container } = render(<Rulebook />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Rulebook');
    expect(container.querySelector('.rb-top').textContent).not.toMatch(/Exception|more than one option/);
  });

  it('shows no internal rule id to a clinician', () => {
    const { container } = render(<Rulebook />);
    for (const r of DOSE_INTERVAL_RULES) expect(container.textContent).not.toContain(r.id);
  });

  it('never uses the words the owner retired', () => {
    // Her rounds of 2026-10-31: "baby series", "ticked", "shot", "shortest
    // gap", and the engineering-log phrasing of the first page.
    const { container } = render(<Rulebook />);
    const text = container.textContent;
    for (const w of [/baby series/i, /\bticked\b/i, /\bshots?\b/i, /shortest gap/i, /PneumoRecs/, /Does not count \/ Counts with a note/i, /app's judgement/i]) {
      expect(text).not.toMatch(w);
    }
  });

  it('renders without a single decorative icon or emoji', () => {
    const { container } = render(<Rulebook />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u);
    expect(container.querySelectorAll('svg').length).toBe(0);
  });

  it('turns months into the words a clinician uses', () => {
    expect(monthsInWords(228)).toBe('19 years');
    expect(monthsInWords(600)).toBe('50 years');
    expect(monthsInWords(18)).toBe('18 months');
  });
});

describe('the citation pop-up on a result card (2026-11-01)', () => {
  const rec = {
    vaccine: 'PCV', status: 'due', doseLabel: 'Dose 1', dueToday: true,
    note: 'Give 1 dose [c].',
    noteCites: [{ key: 'k', page: 'https://example.test/p', url: 'https://example.test/p#x', doc: 'CDC Adult Notes', quote: 'the quoted sentence' }],
  };
  const markerOf = (c) => c.querySelector('a.note-cite');

  it('opens at once on hover, naming the document and the sentence, with the link', () => {
    const { container } = render(<RecCard rec={rec} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.mouseEnter(markerOf(container).parentElement);
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toContain('CDC Adult Notes');
    expect(tip.textContent).toContain('the quoted sentence');
    expect(within(tip).getByText('Open the document').getAttribute('href')).toBe('https://example.test/p#x');
  });

  it('closes on moving away, on Escape, and on a tap elsewhere', () => {
    const { container } = render(<RecCard rec={rec} />);
    const wrap = markerOf(container).parentElement;
    fireEvent.mouseEnter(wrap);
    fireEvent.mouseLeave(wrap);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(markerOf(container));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(markerOf(container));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('no longer carries the native tooltip that lagged', () => {
    const { container } = render(<RecCard rec={rec} />);
    expect(markerOf(container).hasAttribute('title')).toBe(false);
    expect(markerOf(container).getAttribute('data-title')).toBe('CDC Adult Notes\n“the quoted sentence”');
  });
});
