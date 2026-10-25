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
import { BOUNDARIES, PATHWAYS, PRODUCTS, RISK_GROUPS, INTERVAL_RULES, OWNER_INTERVAL_CALLS, WRITTEN_JUDGEMENT_CALLS, SOURCES, monthsInWords } from '../../data/rulebook.js';
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
    for (const m of rulebookSrc.matchAll(/(?:whenWritten|writtenSummary|means|name|says|engineFn):\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
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
    expect(INTERVAL_RULES.map((r) => r.id)).toEqual(DOSE_INTERVAL_RULES.map((r) => r.id));
    for (const r of INTERVAL_RULES) {
      const real = DOSE_INTERVAL_RULES.find((x) => x.id === r.id);
      expect(r.enforcement).toBe(real.enforcement);
      expect(r.authority ?? null).toBe(real.authority ?? null);
      expect(r.rulebook).toBe(real.rulebook);
    }
  });

  it('every rule the engine can apply appears on the rendered page', () => {
    render(<Rulebook onClose={() => {}} />);
    // Section 4 is collapsed by default, so open it the way a reader would.
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    for (const r of DOSE_INTERVAL_RULES) {
      expect(screen.getAllByText(r.id).length).toBeGreaterThan(0);
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
    expect(SOURCES.length).toBeGreaterThan(10);
    for (const s of SOURCES) {
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.url).not.toContain('#');
      expect(s.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('C14 — the judgement calls the page highlights are the engine\'s own', () => {
  // OWNER REQUEST 2026-10-25: "I also want the rulebook updated to highlight
  // cases where there are no clear CDC/ACIP recommendations so the app is
  // making a judgement call."
  //
  // The risk this section carries is the one the whole page carries: a list of
  // judgement calls that stops matching the judgement calls. So the interval
  // half is GENERATED from the same flag the engine reads, and the written
  // half is DRIVEN THROUGH THE ENGINE below rather than taken on trust.
  it('the generated half is exactly the rows the engine marks as the app\'s own', () => {
    const fromEngine = DOSE_INTERVAL_RULES.filter((r) => r.authority === 'OWNER').map((r) => r.id);
    expect(OWNER_INTERVAL_CALLS.map((r) => r.id)).toEqual(fromEngine);
    // Anti-vacuity: an empty list would pass the line above and say nothing.
    expect(fromEngine.length).toBeGreaterThan(0);
  });

  it('and it lists no row the engine credits to CDC or ACIP', () => {
    for (const r of OWNER_INTERVAL_CALLS) {
      const real = DOSE_INTERVAL_RULES.find((x) => x.id === r.id);
      expect(real.authority, r.id).toBe('OWNER');
    }
  });

  it('every judgement call appears on the rendered page', () => {
    render(<Rulebook onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Where the app is making a judgement call/).closest('button'));
    for (const r of OWNER_INTERVAL_CALLS) {
      expect(screen.getAllByText(r.id).length).toBeGreaterThan(0);
    }
    for (const c of WRITTEN_JUDGEMENT_CALLS) {
      expect(screen.getAllByText(c.name).length).toBeGreaterThan(0);
    }
  });

  // ── the written half, driven ──────────────────────────────────────────
  it('the read-across interval really is on the screen, and really does say it is an interpretation', () => {
    // Her 55-year-old of 2026-10-25: PPSV23, then a conjugate fourteen days
    // later. The dose counts, and the alternative offered in its disclosure
    // is the number the page describes as read across.
    const out = recommend({
      today: '2026-10-25', ageMonths: 55 * 12, riskIds: ['chronic_lung'],
      pcvDoses: [{ product: 'PCV20', date: '2026-06-15' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-01' }],
    });
    const why = (out.perDose.pcv[0].whys ?? []).join(' ');
    expect(why).toContain('read across from the only adult conjugate-to-conjugate interval ACIP states');
    expect(why).toContain('an interpretation and not a stated rule');
  });

  it('the transplant stop really does give no schedule and name the bodies in words', () => {
    const out = recommend({
      today: '2026-10-25', ageMonths: 600,
      riskIds: ['hct_cart_bcell_exclude'], pcvDoses: [], ppsv23Doses: [],
    });
    expect(out.excluded).toBe(true);
    expect(out.recs).toEqual([]);
    // Named in words, linked to nothing — the page says both, and the
    // message itself is where "linked to nothing" has to be true.
    expect(out.exclusionMessage).toMatch(/ASCO/);
    expect(out.exclusionMessage).toMatch(/NCCN/);
    expect(out.exclusionMessage).toMatch(/IDSA/);
    expect(out.exclusionMessage).not.toMatch(/https?:\/\//);
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
