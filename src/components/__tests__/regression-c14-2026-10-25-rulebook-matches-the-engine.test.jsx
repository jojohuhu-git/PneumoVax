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
import {
  BOUNDARIES, PATHWAYS, PRODUCTS, RISK_GROUPS, INTERVAL_RULES, SOURCES,
  OUTCOMES, AUTHORITIES, EVIDENCE, RULEBOOK_GROUPS, monthsInWords, ageInWords,
} from '../../data/rulebook.js';
import { ADULT_SCHED_MIN_M, PCV21_MIN_AGE_M, ROUTINE_ADULT_MIN_M } from '../../logic/scheduleConstants.js';
import {
  GRACE_DAYS,
  PCV_PPSV23_MIN_INTERVAL_DAYS,
  PPSV23_REVACC_MIN_MONTHS,
  ADULT_ADVISED_PCV_GAP_MONTHS,
  intervalPhrase,
} from '../../logic/intervals.js';
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
      // Section 4's own numbers. The prose INTERPOLATES these constants rather
      // than typing them (`${EIGHT_WEEKS}`, `${GRACE_DAYS}`), so a literal can
      // only appear here if someone typed one by hand - which is the thing
      // this test is for. They are listed so that a hand-typed digit matching
      // a current constant still reads as allowed and one that does not fails.
      String(GRACE_DAYS),
      String(PCV_PPSV23_MIN_INTERVAL_DAYS / 7),
      String(PPSV23_REVACC_MIN_MONTHS / 12),
      String(ADULT_ADVISED_PCV_GAP_MONTHS / 12),
    ]);
    const offenders = [];
    // Only the sentence-bearing fields: skip code, comments and imports.
    for (const m of rulebookSrc.matchAll(/(?:whenWritten|writtenSummary|means|name|engineFn|lead|pair|child|adult|grace|asOf|intervalVaries|intervalLabel|whyNotJudged|childLabel|adultLabel):\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
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
      expect(r.what).toBe(real.what);
    }
  });

  it('every rule the engine can apply appears on the rendered page', () => {
    // 2026-10-25: this used to look for each rule's ID on the page, because the
    // page printed it under the row. The owner asked for them to go
    // ("CHILD-PCV-AFTER-PCV and others can be removed?") - a reader has no use
    // for an internal identifier. So the rule is now found by the words a
    // clinician reads, which is the stronger assertion anyway: an id could be
    // printed beside a description of some other rule and this would have
    // passed.
    render(<Rulebook onClose={() => {}} />);
    // Section 4 is collapsed by default, so open it the way a reader would.
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    for (const r of DOSE_INTERVAL_RULES) {
      expect(screen.getAllByText(r.what).length, r.id).toBeGreaterThan(0);
    }
  });

  it('no rule id is printed on the page at all', () => {
    render(<Rulebook onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    for (const r of DOSE_INTERVAL_RULES) {
      expect(screen.queryAllByText(r.id), r.id).toEqual([]);
    }
  });

  it('every rule states its interval, in words built from its own constant', () => {
    for (const r of INTERVAL_RULES) {
      const real = DOSE_INTERVAL_RULES.find((x) => x.id === r.id);
      if (real.interval == null) {
        // The two rows that apply no interval at all.
        expect(r.interval, r.id).toBeNull();
        expect(r.intervalVaries, r.id).toBeNull();
        expect(r.intervalLabel, r.id).toBeNull();
      } else if (typeof real.interval.daysFrom === 'function') {
        // The paediatric conjugate series: CDC's Catch-up Table 2 keys the cell
        // on two ages and the dose number, so there is no single number to
        // print and the row says so instead of picking one branch to show.
        expect(r.interval, r.id).toBeNull();
        expect(r.intervalVaries, r.id).toMatch(/catch-up table/);
      } else {
        expect(r.interval, r.id).toBe(intervalPhrase(real.interval));
        expect(r.intervalVaries, r.id).toBeNull();
      }
      // A floor's number is a minimum; a recommendation's is advice. The page
      // must not print one as the other.
      if (real.interval != null) {
        expect(r.intervalLabel, r.id).toBe(real.enforcement === 'floor' ? 'Minimum' : 'Recommended');
      }
    }
  });

  it('a rule that is never flagged says why, and it is the only kind that may omit an interval', () => {
    // Without this the page printed "no interval is applied" and stopped,
    // which reads as an oversight - and on the row where a SHORTER gap is
    // still caught by the floor above it, it was misleading.
    for (const r of INTERVAL_RULES) {
      if (r.enforcement === 'none') {
        expect(r.whyNotJudged, r.id).toBeTruthy();
        expect(r.interval, r.id).toBeNull();
        expect(r.intervalLabel, r.id).toBeNull();
      } else {
        expect(r.whyNotJudged, r.id).toBeNull();
        // every judging row prints a number or says what the number depends on
        expect(r.interval ?? r.intervalVaries, r.id).toBeTruthy();
        expect(r.intervalLabel, r.id).toBeTruthy();
      }
    }
    render(<Rulebook onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    for (const r of INTERVAL_RULES.filter((x) => x.whyNotJudged)) {
      expect(screen.getAllByText(new RegExp(r.whyNotJudged.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).length, r.id)
        .toBeGreaterThan(0);
    }
  });

  it('the three outcomes are the engine\'s three enforcement values, one to one', () => {
    const mapped = OUTCOMES.filter((o) => o.enforcement).map((o) => o.enforcement);
    expect(mapped.slice().sort()).toEqual(['floor', 'none', 'recommendation']);
    // Every enforcement the table actually uses has an outcome, and every rule
    // carries the matching words.
    for (const r of INTERVAL_RULES) {
      const o = OUTCOMES.find((x) => x.enforcement === r.enforcement);
      expect(o, r.id).toBeTruthy();
      expect(r.outcome).toBe(o.name);
      expect(r.outcomeMeans).toBe(o.means);
    }
  });

  it('every rule group names its age range and says what kind of rule it holds', () => {
    // OWNER, 2026-10-25: "for the rules make it clear distinctions on child vs
    // adult rules." Naming the group ("Children") does not say what is
    // DIFFERENT about it, which is the whole point of the evidence block.
    const used = new Set(DOSE_INTERVAL_RULES.map((r) => r.rulebook));
    for (const book of used) {
      const g = RULEBOOK_GROUPS.find((x) => x.rulebook === book);
      expect(g, book).toBeTruthy();
      expect(g.means, book).toBeTruthy();
    }
    // the heading carries the boundary, from the constant the engine dispatches on
    const child = RULEBOOK_GROUPS.find((g) => g.rulebook === 'child');
    const adult = RULEBOOK_GROUPS.find((g) => g.rulebook === 'adult');
    expect(child.name).toContain(monthsInWords(ADULT_SCHED_MIN_M));
    expect(adult.name).toContain(monthsInWords(ADULT_SCHED_MIN_M));
    // and the split they describe is the one the rules actually have
    expect(/MINIMUM/.test(child.means)).toBe(true);
    expect(/RECOMMENDED/.test(adult.means)).toBe(true);
    render(<Rulebook onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    for (const book of used) {
      const g = RULEBOOK_GROUPS.find((x) => x.rulebook === book);
      expect(screen.getAllByText(g.name).length, book).toBe(1);
      expect(screen.getAllByText(g.means).length, book).toBe(1);
    }
  });

  it('the authority tags are the two values the rule table uses, explained once each', () => {
    expect(AUTHORITIES.map((a) => a.authority).sort()).toEqual(['CDC', 'OWNER']);
    const used = new Set(DOSE_INTERVAL_RULES.map((r) => r.authority));
    for (const a of used) expect(AUTHORITIES.some((x) => x.authority === a), a).toBe(true);
    // The long explanation appears ONCE, not on all 17 rows - that repetition
    // was most of what made this section long (owner, 2026-10-25).
    render(<Rulebook onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Whether a dose already given/).closest('button'));
    for (const a of AUTHORITIES) {
      expect(screen.getAllByText(a.means).length, a.authority).toBe(1);
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

describe('C14 — the page says things a clinician can read', () => {
  it('turns months into the words a clinician uses', () => {
    expect(monthsInWords(228)).toBe('19 years');
    expect(monthsInWords(600)).toBe('50 years');
    expect(monthsInWords(216)).toBe('18 years');
    expect(monthsInWords(18)).toBe('18 months');
  });

  it('states every product\'s youngest age in weeks, months or years - never in bare days', () => {
    // OWNER, 2026-10-25: "youngest age should be described in the appropriate
    // weeks months or years. 42 days is hard to comprehend." The conjugate
    // minimum is STORED in days, because that is how CDC states it and how
    // validate.js enforces it; only the words on this page changed.
    for (const p of PRODUCTS) {
      expect(p.youngestAge, p.key).toMatch(/^\d+ (weeks?|months?|years?)$/);
      const real = ALL_PRODUCTS.find((x) => x.key === p.key);
      expect(p.youngestAge, p.key).toBe(ageInWords({ months: real.minAgeM, days: real.minAgeDays }));
    }
    render(<Rulebook onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Which doses count/).closest('button'));
    const pcv = PRODUCTS.find((x) => x.key === 'PCV13');
    expect(pcv.youngestAge).toBe(intervalPhrase({ days: pcv.minAgeDays }));
    expect(screen.getAllByText(pcv.youngestAge).length).toBeGreaterThan(0);
    // and the raw day count is nowhere on the page
    const { container } = render(<Rulebook onClose={() => {}} />);
    expect(container.textContent).not.toContain(`${pcv.minAgeDays} days`);
  });

  it('turns a stored age into the unit a clinician would say it in', () => {
    expect(ageInWords({ days: 42 })).toBe('6 weeks');
    expect(ageInWords({ months: 24 })).toBe('2 years');
    expect(ageInWords({ months: 216 })).toBe('18 years');
    // days win when a product states both, because they are the exact figure
    // the validator uses
    expect(ageInWords({ months: 1.38, days: 42 })).toBe('6 weeks');
    expect(ageInWords({})).toBe('');
  });

  it('renders without a single decorative icon or emoji', () => {
    const { container } = render(<Rulebook onClose={() => {}} />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    expect(container.querySelectorAll('svg').length).toBe(0);
  });
});
