// @vitest-environment happy-dom
// 2026-11-27 — the Rulebook reorganized into MeningoVax's layout, from the
// owner's mock-up (docs/archive/mockup-2026-11-27-pneumovax-rulebook-v1.html,
// layout L1-L5, edits E1-E18). Her words for the buttons: "use the same show
// and show all buttons as meningovax."
//
// This file holds what that mock-up decided and nothing else does:
//   L1  one "How PneumoVax decides" fold of five steps, then "Reference";
//       every fold closed on arrival.
//   L2  each fold its own Show/Hide; Show all opens every fold, Decisions and
//       Sources included, then reads Hide all — MeningoVax's own components
//       and CSS, compared with its checkout when that is on this machine.
//   L3  the jump buttons, series patterns, age lines and risk lists are gone.
//   L4  "More than one condition" once per schedule; none of the children's
//       has smoking or alcohol use disorder.
//   L5  step 5 is "Time between doses".
//   E2  the stop heading is the checkbox's own label (all four conditions).
//   E9  the "doses in all" table is the engine's answer, not typed.
//   E15 the two new adult decisions quote the engine's own dose lines.
//   E17 the footer is the owner's sentence.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import Rulebook from '../Rulebook.jsx';
import {
  PATH_STEPS, HEADINGS, TRANSPLANT_STOP, DOSES_BY_AGE, CHILD_RANKING, ADULT_RANKING, DECISION,
  GRACE, WORKED_PATIENTS as P,
} from '../../data/rulebook.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { recommend } from '../../logic/recommend.js';
import { GRACE_DAYS } from '../../logic/intervals.js';
import { FOOTER_TEXT, FOOTER_EMAIL, lastUpdatedWords } from '../../data/rulebookFooter.js';

const SRC = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const componentSrc = readFileSync(join(SRC, 'components', 'Rulebook.jsx'), 'utf8');
const css = readFileSync(join(SRC, 'App.css'), 'utf8');
const MV = '/Users/joannehuang/Downloads/MeningoVax-main/src';
const sibling = (f) => { try { return readFileSync(join(MV, f), 'utf8'); } catch { return null; } };

const labels = (container, sel) => [...container.querySelectorAll(sel)].map((b) => b.querySelector('.rb-fold-label').textContent);
const showAllBtn = () => screen.getByRole('button', { name: /^(Show|Hide) all$/ });

describe('L1 — one fold of five steps, then Reference; everything closed on arrival', () => {
  it('opens with three closed folds and the five steps hidden', () => {
    const { container } = render(<Rulebook />);
    expect(labels(container, '.rb-full-btn')).toEqual(['How PneumoVax decides', 'PneumoVax decisions', 'Sources']);
    for (const b of container.querySelectorAll('.rb-full-btn')) expect(b.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.rb-steps')).toBeNull();
    expect(container.querySelector('.rb-ref-label').textContent).toBe('Reference');
  });

  it('opening "How PneumoVax decides" shows the five steps, in order, each still closed', () => {
    const { container } = render(<Rulebook />);
    fireEvent.click(container.querySelector('#rb-how-h button'));
    expect(container.textContent).toContain('Five steps, always in this order.');
    expect(labels(container, '.rb-step-btn')).toEqual(PATH_STEPS.map((s) => s.title));
    expect(PATH_STEPS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5]);
    for (const b of container.querySelectorAll('.rb-step-btn')) expect(b.getAttribute('aria-expanded')).toBe('false');
    // Each step's bar carries its one-line summary.
    expect([...container.querySelectorAll('.rb-step-sum')].map((x) => x.textContent)).toEqual(PATH_STEPS.map((s) => s.sum));
  });
});

describe('L2 / E18 — Show all opens everything, then reads Hide all', () => {
  it('opens every fold, Decisions and Sources included, and the decision items', () => {
    const { container } = render(<Rulebook />);
    expect(showAllBtn().textContent).toBe('Show all');
    fireEvent.click(showAllBtn());
    expect(showAllBtn().textContent).toBe('Hide all');
    const bars = container.querySelectorAll('[aria-controls]');
    expect(bars).toHaveLength(1 + PATH_STEPS.length + 2);
    for (const b of bars) expect(b.getAttribute('aria-expanded')).toBe('true');
    for (const li of container.querySelectorAll('.rb-declist-item')) expect(li.classList.contains('rb-open')).toBe(true);
    fireEvent.click(showAllBtn());
    expect(showAllBtn().textContent).toBe('Show all');
    for (const b of container.querySelectorAll('[aria-controls]')) expect(b.getAttribute('aria-expanded')).toBe('false');
  });

  it('reads Hide all once every fold is open by hand, too', () => {
    const { container } = render(<Rulebook />);
    fireEvent.click(container.querySelector('#rb-how-h button'));
    for (const b of container.querySelectorAll('.rb-step-btn')) fireEvent.click(b);
    fireEvent.click(container.querySelector('#rb-decisions-h button'));
    expect(showAllBtn().textContent).toBe('Show all');
    fireEvent.click(container.querySelector('#rb-sources-h button'));
    expect(showAllBtn().textContent).toBe('Hide all');
  });

  it('sits beside the "How PneumoVax decides" bar, stretched to its height', () => {
    const { container } = render(<Rulebook />);
    const head = container.querySelector('.rb-how-head');
    expect(head.contains(showAllBtn())).toBe(true);
    expect(head.querySelector('#rb-how-h')).not.toBeNull();
    expect(css).toMatch(/\.rb-show-all \{ align-self: stretch;/);
  });

  it('uses MeningoVax\'s own fold components and CSS, word for word', () => {
    const mvJsx = sibling('components/Rulebook.jsx');
    const mvCss = sibling('App.css');
    if (!mvJsx || !mvCss) return; // sibling repo not on this machine (CI): the checks above still ran
    const fn = (src, name) => src.slice(src.indexOf(`function ${name}(`), src.indexOf('\n}\n', src.indexOf(`function ${name}(`)) + 2);
    for (const name of ['FoldButton', 'Fold', 'useFold', 'FoldBar']) {
      expect(fn(componentSrc, name), name).toBe(fn(mvJsx, name));
    }
    const rule = (src, sel) => src.match(new RegExp(`(^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{[^}]*\\}`))?.[0].trim();
    const COPIED = [
      '.rb-tap', '.rb-tap:hover', '.rb-steps', '.rb-step', '.rb-step-num', '.rb-step-body', '.rb-full-btn', '.rb-full-btn:hover',
      '.rb-full-btn .rb-fold-mark', '.rb-part', '.rb-part-body', '.rb-how-head', '.rb-how-head .rb-h2', '.rb-show-all',
      '.rb-fold-words', '.rb-step-h', '.rb-step-btn', '.rb-step-btn .rb-fold-label', '.rb-step-sum', '.rb-ref-label',
      '.rb-g-name', '.rb-g-details', '.rb-g-det > td', '.rb-g-detin', '.rb-table .rb-min', '.rb-table th.rb-min',
    ];
    for (const sel of COPIED) {
      expect(rule(css, sel), sel).toBeTruthy();
      expect(rule(css, sel), sel).toBe(rule(mvCss, sel));
    }
  });
});

describe('L3 — the parts that repeated another part are gone', () => {
  it('no jump buttons, series patterns, age lines or separate risk lists', () => {
    const { container } = render(<Rulebook />);
    fireEvent.click(showAllBtn());
    expect(container.querySelector('nav')).toBeNull();
    for (const gone of ['Common series patterns', 'Age lines', 'Risk groups', 'The dose still counts when']) {
      expect(container.textContent).not.toContain(gone);
    }
    for (const cls of ['.rb-nav', '.rb-pattern', '.rb-ageline', '.rb-groups', '.rb-lanes']) {
      expect(container.querySelector(cls), cls).toBeNull();
      expect(css.includes(`${cls} `) || css.includes(`${cls}{`), cls).toBe(false);
    }
  });

  it('a group\'s conditions open from Details under its name', () => {
    const { container } = render(<Rulebook />);
    fireEvent.click(showAllBtn());
    const details = [...container.querySelectorAll('.rb-g-details')];
    expect(details.length).toBe(8);
    const ic = details.find((b) => b.parentElement.textContent.startsWith('Immunocompromising'));
    fireEvent.click(ic);
    expect(ic.textContent).toBe('Close');
    const panel = ic.closest('tr').nextElementSibling;
    expect(panel.classList.contains('rb-g-det')).toBe(true);
    expect(panel.textContent).toContain(RISK_FACTORS.find((r) => r.id === 'asplenia').label);
  });
});

describe('L4 — "More than one condition" once in each schedule', () => {
  it('appears exactly twice, under steps 3 and 4', () => {
    const { container } = render(<Rulebook />);
    fireEvent.click(showAllBtn());
    const cards = [...container.querySelectorAll('.rb-h3')].filter((h) => h.textContent === 'More than one condition');
    expect(cards).toHaveLength(2);
    expect(cards[0].closest('.rb-step-body').id).toBe('rb-kids');
    expect(cards[1].closest('.rb-step-body').id).toBe('rb-adults');
  });

  it('the children\'s list names no adult-only condition; the adults\' does', () => {
    expect(CHILD_RANKING.steps.map((s) => s.name).join(' ')).not.toMatch(/smoking|alcohol/i);
    expect(ADULT_RANKING.steps.map((s) => s.name).join(' ')).toMatch(/smoking or alcohol use disorder/);
    expect(CHILD_RANKING.note.text).toMatch(/not risk conditions under 19 years/);
  });
});

describe('L5 / E12 — step 5 is "Time between doses", and its heading counts nothing', () => {
  it('is named as the owner chose', () => {
    expect(HEADINGS.spacing).toBe('Time between doses');
    expect(PATH_STEPS[4].title).toBe('Time between doses');
    expect(componentSrc).not.toMatch(/Set the dates/);
  });
  it('the children\'s heading states the rule, with no count of exceptions', () => {
    expect(GRACE.title).toBe('Children: a dose given before the minimum interval does not count');
    expect(GRACE.text).toBe(`A dose given ${GRACE_DAYS + 1} or more days early does not count. Up to ${GRACE_DAYS} days early still counts.`);
  });
});

describe('E2 — the stop heading names all four conditions, as the checkbox does', () => {
  it('is the transplant row\'s own label, which MeningoVax\'s Rulebook also uses', () => {
    const row = RISK_FACTORS.find((r) => r.exclude);
    expect(TRANSPLANT_STOP.title).toBe(row.label);
    for (const w of ['transplant', 'CAR-T', 'B-cell malignancy', 'B-cell-depleting']) expect(TRANSPLANT_STOP.title).toContain(w);
    const mv = sibling('data/rulebookPage.js');
    if (mv) expect(mv).toMatch(/title: RISK_BY_ID\.hct_cart_bcell_exclude\.label/);
  });
});

describe('E9 — doses in all, by age at dose 1, is the engine\'s answer', () => {
  it('reads 4, 3, 2, 1, then none', () => {
    expect(DOSES_BY_AGE.rows.map((r) => [r.age, r.total])).toEqual([
      ['2–6 months', '4'], ['7–11 months', '3'], ['12–23 months', '2'],
      ['2–4 years, healthy', '1'], ['5 years and older, healthy', 'None (not indicated)'],
    ]);
  });
  it('each band is run at its first and last month, and the two agree', () => {
    for (const r of DOSES_BY_AGE.rows) {
      expect(r.ex).toHaveLength(2);
      const totals = r.ex.map((e) => {
        const c = recommend(e.input).recs.find((x) => x.vaccine === 'PCV');
        return c.status === 'not-indicated' ? 'none' : String(c.seriesTotal ?? c.doseLabel.match(/^(\d+) dose/)[1]);
      });
      expect(totals[0], r.age).toBe(totals[1]);
    }
  });
});

describe('E15 — the two new adult decisions', () => {
  it('quote the engine\'s own dose lines, never typed ones', () => {
    const line = (e, s) => recommend(e.input).perDose[s][0].reasons[0];
    expect(DECISION.adultEarlyCounts.does).toContain(`"${line(P.adultPcv20Soon, 'pcv')}"`);
    expect(DECISION.adultPpsvUnderEightWeeks.does).toContain(`"${line(P.hivSameDay, 'ppsv23')}"`);
  });
  it('split the 8 weeks by age, as ACIP does (OWNER DECISION 2026-11-27)', () => {
    // mm7401a1, read live 2026-11-27: "can be considered" is printed only in
    // its >=50 row; at 19-49 for these conditions it reads "administer ... ≥8
    // weeks after the PCV15 dose".
    const { cdc } = DECISION.adultPpsvUnderEightWeeks;
    expect(cdc).toMatch(/^8 weeks is the recommended interval at 19–49 years for an immunocompromising condition, cochlear implant or CSF leak\./);
    expect(cdc).toMatch(/From 50 years, "a minimum interval of 8 weeks can be considered", sooner than the usual 1 year\./);
    expect(cdc).toMatch(/They do not say whether a PPSV23 given before 8 weeks counts\./);
  });
});

describe('E17 — the footer, the same in both apps (owner, 2026-11-27)', () => {
  const WORDS = 'This clinical decision support tool is based on CDC and/or ACIP recommendations. It will also provide '
    + 'suggested guidance for situations not addressed by these organizations. The information contained in this tool '
    + 'should not replace clinical judgement. For questions or issues with this app, reach out to jojohuhu@gmail.com.';

  it('is the owner\'s wording, with her address as a mail link and the date of the last update', () => {
    const { container } = render(<Rulebook />);
    const foot = container.querySelector('.rb-foot');
    expect(foot.textContent.startsWith(WORDS)).toBe(true);
    expect(foot.querySelector('a').getAttribute('href')).toBe(`mailto:${FOOTER_EMAIL}`);
    expect(foot.textContent.slice(WORDS.length)).toMatch(/^Last updated [A-Z][a-z]+ \d{1,2}, \d{4}\.$/);
    expect(foot.textContent).not.toContain(';');
  });

  it('the date comes from the build, never typed, and is left out rather than guessed', () => {
    expect(lastUpdatedWords('2026-11-27')).toBe('Last updated November 27, 2026.');
    expect(lastUpdatedWords('')).toBeNull();
    expect(lastUpdatedWords(null)).toBeNull();
    expect(lastUpdatedWords('27/11/2026')).toBeNull();
    // With no argument it reads the build's date, which vitest is given too.
    expect(lastUpdatedWords()).toMatch(/^Last updated [A-Z][a-z]+ \d{1,2}, \d{4}\.$/);
    expect(readFileSync(join(SRC, '..', 'vite.config.js'), 'utf8')).toMatch(/git log -1 --format=%cs/);
  });

  it('is word for word MeningoVax\'s, when its checkout has the same file', () => {
    const mv = sibling('data/rulebookFooter.js');
    if (!mv || !mv.includes('export const FOOTER_TEXT')) return; // not on this machine, or not merged there yet
    expect(mv).toBe(readFileSync(join(SRC, 'data', 'rulebookFooter.js'), 'utf8'));
    expect(FOOTER_TEXT.endsWith('reach out to')).toBe(true);
  });
});
