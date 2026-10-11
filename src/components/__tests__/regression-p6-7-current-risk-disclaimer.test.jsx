// @vitest-environment happy-dom
// P6-7 (S13, 2026-10-10): the app asks for the patient's risk factors as they
// are TODAY, and then grades doses recorded years ago against them. It never
// asks when a risk factor started or ended. That assumption is reasonable and
// is not changing — but the disclaimer was silent about it while the engine
// relied on it.
//
// The one case a clinician might expect to be asked about, and which this
// therefore names outright: PPSV23 between ages 2 and 5 is only *indicated*
// for a child with a risk condition. A dose given to a then-healthy
// three-year-old is still counted as a valid PPSV23 if that child later
// becomes at-risk.
//
// Verified against the engine before writing the copy (2026-06-07 clock):
// PPSV23 dated 2019-07-01 for a child born 2016-06-07 — age 3 — who is now 10
// with asplenia comes back `status: 'valid'`, counting, effective dose 1, and
// the recommendation reads "PCV series complete (PCV before age 6 + PPSV23)".
// That is correct: it is a real vaccine given at a valid age (PPSV23's
// minimum is 2 years), so it counts. The disclaimer states it rather than
// leaving the clinician to infer it.
//
// Deliberately NOT a per-dose prompt — the queue rules that out explicitly.
// PneumoVax also has no "Needs input" machinery, so unlike MeningoVax's
// version of this sentence, this one must not promise that the app will ask.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Disclaimer from '../Disclaimer.jsx';
import { recommend } from '../../logic/recommend.js';

describe('P6-7 — the disclaimer says the app knows only TODAY\'s risk status', () => {
  it('states that only current risk status is tracked', () => {
    render(<Disclaimer />);
    const text = screen.getByRole('note').textContent;
    expect(text).toMatch(/current/i);
    expect(text).toMatch(/risk/i);
    expect(text.toLowerCase()).toMatch(/does not record when|started or ended/);
  });

  it('names the PPSV23 2–5 year case specifically', () => {
    render(<Disclaimer />);
    const text = screen.getByRole('note').textContent;
    expect(text).toMatch(/PPSV23/);
    expect(text).toMatch(/counted|counts/i);
  });

  it('does NOT promise a prompt this app does not have', () => {
    // MeningoVax's sentence ends by saying a "Needs input" prompt will ask
    // for the risk status on a specific date. PneumoVax has no such prompt,
    // so copying that half would be a promise the app cannot keep.
    render(<Disclaimer />);
    const text = screen.getByRole('note').textContent;
    expect(text).not.toMatch(/Needs input/i);
    expect(text).not.toMatch(/will ask|asks for it directly/i);
  });

  it('the behaviour the sentence describes is what the engine actually does', () => {
    // If this ever stops being true, the disclaimer becomes a false statement
    // — so it is pinned here, beside the copy that describes it.
    const r = recommend({
      ageMonths: 120,
      dob: '2016-06-07',
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2017-01-10' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2019-07-01' }], // given at age 3
      today: '2026-06-07',
    });
    const ppsv = r.perDose.ppsv23[0];
    expect(ppsv.status).toBe('valid');
    expect(ppsv.doesNotCount).toBeFalsy();
    expect(ppsv.effectiveDoseNum).toBe(1);
  });
});
