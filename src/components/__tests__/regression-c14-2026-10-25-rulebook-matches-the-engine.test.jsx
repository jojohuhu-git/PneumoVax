// @vitest-environment happy-dom
// C14 (2026-10-25) — the "How recommendations are made" page cannot quietly
// stop describing the app.
//
// WHY THIS GUARD EXISTS. The owner asked for a map of the rules a clinician
// could follow, like PediVax's Rulebook screen. PediVax generates its rulebook
// from data files, so it cannot drift. PneumoVax's rules are mostly branching
// code, so part of this page is sentences somebody typed — and a typed
// sentence about a rule is exactly the failure this repo has been bitten by
// before: the post-transplant schedule disagreed with its own documentation
// for 32 days and nothing in the suite could see it, because no test compared
// a document's prose to the code.
//
// So the page is built under one rule, and this file enforces it:
//
//   EVERY NUMBER ON THE PAGE COMES FROM A CONSTANT THE ENGINE READS, and
//   every list on it is the engine's own list, entry for entry.
//
// The strongest assertion here is the one that reads rulebook.js's source and
// fails if any WRITTEN sentence contains a number that is not one of the three
// schedule constants. Without it, someone could "update" a sentence to say 65
// while ROUTINE_ADULT_MIN_M still says 50 and every other test would pass.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import Rulebook from '../Rulebook.jsx';
import { BOUNDARIES, PATHWAYS, PRODUCTS, RISK_GROUPS, INTERVAL_TABLE, INTERVAL_GROUPS, SOURCE_GROUPS, monthsInWords } from '../../data/rulebook.js';
import { ADULT_SCHED_MIN_M, PCV21_MIN_AGE_M, ROUTINE_ADULT_MIN_M } from '../../logic/scheduleConstants.js';
import { DOSE_INTERVAL_RULES } from '../../logic/doseIntervalRules.js';
import { ALL_PRODUCTS } from '../../data/brands.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { recommend } from '../../logic/recommend.js';

const SRC = dirname(dirname(dirname(fileURLToPath(import.meta.url))));   // src/
const rulebookSrc = readFileSync(join(SRC, 'data', 'rulebook.js'), 'utf8');
const componentSrc = readFileSync(join(SRC, 'components', 'Rulebook.jsx'), 'utf8');
const engineSrc = readFileSync(join(SRC, 'logic', 'recommend.js'), 'utf8');

describe('C14 — the rulebook page states the engine\'s own numbers', () => {
  it('shows exactly the three schedule constants, and gets them from the constants file', () => {
    expect(BOUNDARIES.map((b) => b.months).sort((a, b) => a - b))
      .toEqual([PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M].sort((a, b) => a - b));
    // and the source imports them rather than typing them
    expect(rulebookSrc).toContain("from '../logic/scheduleConstants.js'");
  });

  it('no written sentence in rulebook.js contains a number that is not one of those constants', () => {
    // Pull every string literal out of the data file and look for digits in it.
    // Allowed: the three constants, and the words built from them by
    // monthsInWords (which this test computes rather than trusting).
    const allowed = new Set([
      ...[PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M].map(String),
      ...[PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M].map((m) => String(m / 12)),
      '24',   // the infant/child line, asserted against the engine below
      '2', '5',   // "Children 2 up to...", "caught up to age 5" - both asserted below
      '19',   // ADULT_SCHED_MIN_M in years, spelled out in a pathway name
    ]);
    const offenders = [];
    // Only the sentence-bearing fields: skip code, comments and imports.
    for (const m of rulebookSrc.matchAll(/(?:whenWritten|writtenSummary|means|name|engineFn):\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
      // A product's name carries digits that are not an age: PCV7, PCV13,
      // PCV15, PCV20, PCV21, PPSV23. Take the names out before looking.
      const text = m[2].replace(/\bP?[CP]C?S?V-?\d+\b/g, 'the vaccine');
      for (const n of text.matchAll(/\d+/g)) {
        if (!allowed.has(n[0])) offenders.push(`"${text.slice(0, 70)}..." contains ${n[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the component itself hardcodes no ages — it only renders what the data gives it', () => {
    // Any bare 2-3 digit number in the JSX would be an age typed by hand.
    const jsxText = componentSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const numbers = [...jsxText.matchAll(/>[^<>{}]*?\b(\d{2,3})\b[^<>{}]*?</g)].map((m) => m[1]);
    expect(numbers).toEqual([]);
  });
});

describe('C14 — the boundaries the page claims are the ones the engine actually uses', () => {
  it('the engine dispatches on the SAME constant the page prints for the adult line', () => {
    // M.y18 is ADULT_SCHED_MIN_M despite its name; if someone renames or
    // re-points it, this fails rather than the page quietly lying.
    expect(engineSrc).toMatch(/y18:\s*ADULT_SCHED_MIN_M/);
    expect(engineSrc).toMatch(/am\s*<\s*M\.y18/);
    expect(engineSrc).toMatch(/am\s*<\s*M\.m24/);
    expect(PATHWAYS.find((p) => p.id === 'adult').fromMonths).toBe(ADULT_SCHED_MIN_M);
    expect(PATHWAYS.find((p) => p.id === 'child').toMonths).toBe(ADULT_SCHED_MIN_M);
    expect(PATHWAYS.find((p) => p.id === 'infant').toMonths).toBe(24);
  });

  it('a patient one month either side of the adult line really does change rulebook', () => {
    const base = { riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [], today: '2026-10-25' };
    const child = recommend({ ...base, ageMonths: ADULT_SCHED_MIN_M - 1 });
    const adult = recommend({ ...base, ageMonths: ADULT_SCHED_MIN_M });
    const books = (r) => new Set((r.recs ?? []).flatMap((x) => (x.citations ?? []).map((c) => c.rulebook)));
    expect(books(child).has('adult')).toBe(false);
    expect(books(adult).has('child')).toBe(false);
  });

  it('the transplant tick really does override everything, at every age the page claims', () => {
    for (const ageMonths of [2, 24, 120, ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M, 900]) {
      const r = recommend({ ageMonths, riskIds: ['hct_cart_bcell_exclude', 'asplenia'], pcvDoses: [], ppsv23Doses: [], today: '2026-10-25' });
      expect(r.excluded).toBe(true);
      expect(r.recs).toEqual([]);
    }
  });
});

describe('C14 — every list on the page is the engine\'s own list', () => {
  it('the dose-spacing table is DOSE_INTERVAL_RULES, entry for entry', () => {
    expect(INTERVAL_TABLE.map((r) => r.id)).toEqual(DOSE_INTERVAL_RULES.map((r) => r.id));
    for (const r of INTERVAL_TABLE) {
      const real = DOSE_INTERVAL_RULES.find((x) => x.id === r.id);
      expect(r.enforcement).toBe(real.enforcement);
      expect(r.authority ?? null).toBe(real.authority ?? null);
    }
  });

  it('regrouping the table loses no rule and duplicates none', () => {
    // 2026-10-25: the flat list became a lookup grouped by patient. A regroup
    // is exactly the kind of change that can silently drop a row, so the
    // grouped view is checked back against the engine's own list as a SET.
    const grouped = INTERVAL_GROUPS.flatMap((g) => g.rows.map((r) => r.id));
    expect(grouped.slice().sort()).toEqual(DOSE_INTERVAL_RULES.map((r) => r.id).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it('every rule the engine can apply appears on the rendered page', () => {
    render(<Rulebook onClose={() => {}} />);
    // Section 4 is collapsed by default, so open it the way a reader would.
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    // ⚠ NOT by rule id any more. The ids used to print under every row and
    // were removed on 2026-10-25 — the owner asked for a table to look a
    // patient up in, and `CHILD-PCV-AFTER-PCV` is the most list-like thing
    // that was on it. A row is now identified the way a reader identifies it:
    // by the gap it states and what happens when it is missed.
    for (const r of INTERVAL_TABLE) {
      expect(screen.getAllByText(r.gap).length).toBeGreaterThan(0);
      expect(screen.getAllByText(`${r.ifShorter}.`).length).toBeGreaterThan(0);
    }
  });

  it('shows no internal rule id to a clinician', () => {
    render(<Rulebook onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    for (const r of DOSE_INTERVAL_RULES) {
      expect(screen.queryAllByText(r.id).length).toBe(0);
    }
  });

  it('carries each rule\'s own source sentence, so a reader need not open the document', () => {
    // The owner's stated reason for the reorganisation: "It's confusing for me
    // to go back to each reference document on my own." A row with no source
    // sends her back to the document, so every row that HAS one in the engine
    // must carry it here.
    for (const real of DOSE_INTERVAL_RULES) {
      const row = INTERVAL_TABLE.find((r) => r.id === real.id);
      if (typeof real.source === 'string') expect(row.source).toBe(real.source);
    }
  });

  it('the products table is ALL_PRODUCTS, and says which ones do not count', () => {
    expect(PRODUCTS.map((p) => p.key)).toEqual(ALL_PRODUCTS.map((p) => p.key));
    const pcv7 = PRODUCTS.find((p) => p.key === 'PCV7');
    expect(pcv7.counts).toBe(false);
    for (const p of PRODUCTS) {
      expect(p.counts).toBe(ALL_PRODUCTS.find((x) => x.key === p.key).counts);
    }
  });

  it('every risk condition is listed exactly once, and the transplant row is not filed under immunocompromising', () => {
    const listed = RISK_GROUPS.flatMap((g) => g.conditions.map((c) => c.id));
    expect(listed.slice().sort()).toEqual(RISK_FACTORS.map((r) => r.id).sort());
    expect(new Set(listed).size).toBe(listed.length);
    const ic = RISK_GROUPS.find((g) => g.group === 'IC').conditions.map((c) => c.id);
    expect(ic).not.toContain('hct_cart_bcell_exclude');
    expect(RISK_GROUPS.find((g) => g.group === 'exclude').conditions.map((c) => c.id)).toEqual(['hct_cart_bcell_exclude']);
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

  it('files every document under exactly one heading, and CDC before the rest', () => {
    // 2026-10-25: the list was alphabetical by an internal key, which the
    // owner read as random. Grouping can lose a document or file it twice, so
    // both are checked, and the publisher order is asserted because the
    // authority rule in CLAUDE.md is what it encodes.
    const names = SOURCE_GROUPS.flatMap((g) => g.docs.map((d) => d.name));
    expect(new Set(names).size).toBe(names.length);
    expect(SOURCE_GROUPS.map((g) => g.book)).toEqual(['child', 'adult', 'any']);
    for (const g of SOURCE_GROUPS) {
      const rank = g.docs.map((d) => (d.publisher === 'CDC / ACIP' ? 0 : 1));
      expect(rank).toEqual(rank.slice().sort());
    }
  });

  it('says how heavily each document is leaned on', () => {
    // "Sentences quoted" is the column that tells the owner which documents
    // are load-bearing. If every count were zero the column would be a lie.
    const all = SOURCE_GROUPS.flatMap((g) => g.docs);
    expect(all.filter((d) => d.quotes > 0).length).toBeGreaterThan(5);
    expect(Math.max(...all.map((d) => d.quotes))).toBeGreaterThan(10);
  });
});

describe('C14 — the page says things a clinician can read', () => {
  it('turns months into the words a clinician uses', () => {
    expect(monthsInWords(228)).toBe('19 years');
    expect(monthsInWords(600)).toBe('50 years');
    expect(monthsInWords(216)).toBe('18 years');
    expect(monthsInWords(18)).toBe('18 months');
  });

  it('renders without a single decorative icon or emoji', () => {
    const { container } = render(<Rulebook onClose={() => {}} />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    expect(container.querySelectorAll('svg').length).toBe(0);
  });
});
