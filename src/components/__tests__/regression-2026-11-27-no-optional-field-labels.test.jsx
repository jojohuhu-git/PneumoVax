// @vitest-environment happy-dom
//
// OWNER DECISION 2026-11-27, both apps: no entry field is labelled "(optional)".
// Her words: "remove optional from both pneumovax and meningovax - since users
// can add whatever they want and there are rules already in place for how to
// assess unknown brands and doses I don't think this comment adds much to
// either app."
//
// The last one in PneumoVax was the age step's "Months (optional)"; the dose
// date lost its "(optional)" on 2026-11-17. A blank Months box still means 0
// months, so nothing is made required, and this test does not assert that.
//
// Twin: MeningoVax's regression-2026-11-27-no-optional-field-labels test (its
// "Months" and "Brand" labels). Change the rule in both repos or neither.
//
// NOT covered, on purpose: "Optional today" / "Optional (shared decision)" on
// a result card. Those are a clinical status (a shared clinical decision), not
// a field label.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import StepAge from '../StepAge.jsx';

const DIR = join(process.cwd(), 'src/components');

describe('no entry field says "(optional)" (owner 2026-11-27)', () => {
  it('the age step labels its second box "Months"', () => {
    render(<StepAge ageMonths={null} today="2026-11-27" onChange={() => {}} />);
    fireEvent.click(screen.getByText(/Years \/ Months/));
    expect(screen.getByLabelText('Months').id).toBe('age-months');
    expect(screen.queryAllByLabelText(/\(optional\)/i)).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/\(optional\)/i);
  });

  it('a blank Months box still works: 5 years and no months is 60 months', () => {
    const seen = [];
    render(<StepAge ageMonths={null} today="2026-11-27" onChange={(p) => seen.push(p)} />);
    fireEvent.click(screen.getByText(/Years \/ Months/));
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '5' } });
    expect(seen.at(-1).ageMonths).toBe(60);
  });

  it('no <label> in any component source ends with "(optional)"', () => {
    const hits = [];
    for (const f of readdirSync(DIR).filter((n) => n.endsWith('.jsx'))) {
      const src = readFileSync(join(DIR, f), 'utf8');
      for (const m of src.matchAll(/<label\b[^>]*>([^<]*)<\/label>/g)) {
        if (/\(optional\)/i.test(m[1])) hits.push(`${f}: ${m[1].trim()}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
