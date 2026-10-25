// @vitest-environment happy-dom
// C14 (2026-10-25) — "How this was worked out": the route THIS patient took.
//
// The owner asked for a map of the rules plus a way to see which way the app
// went for the patient on screen. This is the second half, and it has two
// properties that need guarding:
//
//   1. IT IS RECORDED, NOT RE-DERIVED. The engine pushes each step at the
//      branch that takes it. If the component (or anything else) worked the
//      route out for itself, it would be a second reading of a question the
//      engine already answered — the exact shape of the catch-up-table bug
//      that told a clinician to wait until August and then accepted the dose
//      in July. So this file asserts the component contains no routing logic
//      and the engine's own branch is what produces the text.
//
//   2. THE TRANSPLANT HARD STOP SHOWS NOTHING. Owner decision 2026-10-16:
//      one banner and nothing else on the page. The engine withholds `path`
//      entirely for that patient, so no surface has to remember.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { recommend } from '../recommend.js';
import HowThisWasWorkedOut from '../../components/HowThisWasWorkedOut.jsx';
import { ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M } from '../scheduleConstants.js';

const SRC = dirname(dirname(dirname(fileURLToPath(import.meta.url))));   // src/
const componentSrc = readFileSync(join(SRC, 'components', 'HowThisWasWorkedOut.jsx'), 'utf8');
const engineSrc = readFileSync(join(SRC, 'logic', 'recommend.js'), 'utf8');

const TODAY = '2026-10-25';
const run = (i) => recommend({ pcvDoses: [], ppsv23Doses: [], today: TODAY, ...i });
const stepFor = (r, name) => (r.path ?? []).find((s) => s.step === name);

describe('C14 — the route is recorded at the branch, not worked out again', () => {
  it('the component computes nothing: it has no age, no constant and no branch of its own', () => {
    // Comments carry dates and a change id, so look at the code only.
    const code = componentSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/\b(?:ageMonths|riskIds|pcvDoses|ADULT_SCHED_MIN_M|ROUTINE_ADULT_MIN_M)\b/);
    expect(code).not.toMatch(/\b\d{2,3}\b/);          // no age typed into it
    expect(code).not.toMatch(/\brecommend\b/);        // it never calls the engine
  });

  it('the engine pushes the route inside the dispatch, beside the branch it describes', () => {
    // Each arm of the dispatch must record which arm it is. If an arm is added
    // later without a pathStep, this fails rather than showing a patient a
    // route with a step missing.
    const dispatch = engineSrc.slice(engineSrc.indexOf('// ── Standard (age/history/risk) recommendations'));
    const arms = (dispatch.match(/recs = pcv[A-Za-z]+\(/g) ?? []).length;
    const recorded = (dispatch.match(/pathStep\('Which rules apply'/g) ?? []).length;
    expect(arms).toBeGreaterThan(0);
    expect(recorded).toBe(arms);
  });
});

describe('C14 — the route names the pathway the engine really took', () => {
  const cases = [
    ['a 15-month-old', { ageMonths: 15, riskIds: ['asplenia'] }, 'Babies and toddlers under 2'],
    ['a 1-month-old', { ageMonths: 1, riskIds: [] }, 'Babies and toddlers under 2'],
    ['a 23-month-old', { ageMonths: 23, riskIds: [] }, 'Babies and toddlers under 2'],
    ['a 2-year-old at risk', { ageMonths: 24, riskIds: ['asplenia'] }, 'Children with a risk condition'],
    ['a healthy 10-year-old', { ageMonths: 120, riskIds: [] }, 'Children with no risk condition'],
    ['the day before the adult line', { ageMonths: ADULT_SCHED_MIN_M - 1, riskIds: ['hiv'] }, 'Children with a risk condition'],
    ['the day the adult line starts', { ageMonths: ADULT_SCHED_MIN_M, riskIds: ['hiv'] }, 'Adults'],
    ['a 70-year-old', { ageMonths: 840, riskIds: [] }, 'Adults'],
  ];
  it.each(cases)('%s is told it is on the "%s" pathway', (_label, input, expected) => {
    expect(stepFor(run(input), 'Which rules apply').took).toBe(expected);
  });

  it('the adult step names the routine age from the constant, not a typed number', () => {
    const young = stepFor(run({ ageMonths: ROUTINE_ADULT_MIN_M - 1, riskIds: ['hiv'] }), 'Which rules apply');
    const older = stepFor(run({ ageMonths: ROUTINE_ADULT_MIN_M, riskIds: [] }), 'Which rules apply');
    expect(young.because).toContain(`${ROUTINE_ADULT_MIN_M / 12} years`);
    expect(older.because).toContain(`${ROUTINE_ADULT_MIN_M / 12} years`);
    expect(young.because).toContain('only with a qualifying risk condition');
    expect(older.because).toContain('whatever the risk conditions');
  });

  it('says in plain words which risk group the patient is in', () => {
    expect(stepFor(run({ ageMonths: 360, riskIds: ['hiv'] }), 'Risk conditions').took)
      .toContain('an immunocompromising condition');
    expect(stepFor(run({ ageMonths: 360, riskIds: ['cochlear_implant'] }), 'Risk conditions').took)
      .toContain('a cochlear implant or CSF leak');
    expect(stepFor(run({ ageMonths: 360, riskIds: ['diabetes'] }), 'Risk conditions').took)
      .toContain('a chronic condition');
    expect(stepFor(run({ ageMonths: 360, riskIds: [] }), 'Risk conditions').took).toBe('None ticked');
  });

  it('counts the doses the way the engine counted them, and never repeats the reason', () => {
    // The owner's own patient, 2026-10-23: three PCV20 doses at 28-day gaps.
    const r = run({
      dob: '2025-07-20', ageMonths: undefined, riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-06-01' }, { product: 'PCV20', date: '2026-07-02' }, { product: 'PCV20', date: '2026-08-01' }],
    });
    const step = stepFor(r, 'Doses already given');
    expect(step.took).toContain('2 of 3 PCV doses counted');
    expect(step.took).toContain('1 set aside');
    // The REASON belongs on the dose chip; repeating it here would be a second
    // copy of a sentence that has already moved once this month.
    expect(step.took).not.toMatch(/8 weeks|30 days|minimum interval/);
  });

  it('the age is written the way a clinician says it, never as a fraction', () => {
    for (const dob of ['2025-07-20', '1956-10-20', '2026-08-25']) {
      expect(stepFor(run({ dob }), 'Age').took).not.toMatch(/\d\.\d/);
    }
    expect(stepFor(run({ dob: '2025-07-20' }), 'Age').took).toBe('15 months');
    expect(stepFor(run({ ageMonths: 120 }), 'Age').because).toBe('from the age you entered');
    expect(stepFor(run({ dob: '2016-10-20' }), 'Age').because).toContain('date of birth');
  });
});

describe('C14 — the transplant hard stop shows nothing at all', () => {
  it('the engine gives that patient no route to show, at every age', () => {
    for (const ageMonths of [2, 24, 120, ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M, 900]) {
      const r = run({ ageMonths, riskIds: ['hct_cart_bcell_exclude', 'asplenia'] });
      expect(r.excluded).toBe(true);
      expect(r.path).toBeUndefined();
    }
  });

  it('and the component renders nothing when there is no route', () => {
    const { container } = render(<HowThisWasWorkedOut path={undefined} />);
    expect(container.innerHTML).toBe('');
    const empty = render(<HowThisWasWorkedOut path={[]} />);
    expect(empty.container.innerHTML).toBe('');
  });
});

describe('C14 — what the clinician sees', () => {
  it('is shut until asked, then lists every step the engine recorded', () => {
    const r = run({ dob: '2025-07-20', riskIds: ['asplenia'] });
    render(<HowThisWasWorkedOut path={r.path} />);
    expect(screen.queryByTestId('howpath-list')).toBeNull();
    fireEvent.click(screen.getByTestId('howpath-toggle'));
    const list = screen.getByTestId('howpath-list');
    expect(list.querySelectorAll('li').length).toBe(r.path.length);
    for (const s of r.path) expect(list.textContent).toContain(s.took);
  });
});
