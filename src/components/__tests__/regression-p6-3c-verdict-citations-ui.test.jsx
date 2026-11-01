// @vitest-environment happy-dom
// P6-3c (2026-10-12) — the UI half: the marker has to become a link.
//
// The engine test proves the verdict carries a `[c]` and a citation. That is
// not the thing a clinician benefits from. What matters is that the marker is
// replaced by a numbered superscript pointing at the source — and in
// particular that the raw text "[c]" NEVER reaches the screen, which is
// citations.jsx's stated rule (an unpaired marker is dropped rather than shown,
// so a clinician never reads "[c]" as if it meant something).
//
// Verdicts come from the real engine, never hand-written fixtures.
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

const TODAY = '2026-10-12';

// RecCard collapses the neutral statuses, and every patient here has one, so
// the per-dose explanation sits behind a click — same as S14-4B's and S14-4C's
// UI tests. A first draft of this file assumed the dose list rendered above the
// fold; the assertion that was supposed to confirm that failed instead, which
// is why it is an assertion and not a comment.
function openTheCard() {
  for (const btn of screen.getAllByRole('button', { expanded: false })) {
    if (/rec-card-head-toggle/.test(btn.className)) fireEvent.click(btn);
  }
}

// A 20-year-old with a PCV7 dose from 2008 — a record the app sets aside.
const PCV7_PATIENT = {
  ageMonths: 20 * 12,
  dob: '2006-01-01',
  riskIds: [],
  pcvDoses: [{ product: 'PCV7', date: '2008-05-02' }],
  ppsv23Doses: [],
};

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      onReset={() => {}}
      today={TODAY}
    />
  );
}

describe('P6-3c UI — a verdict citation renders as a working superscript', () => {
  it('the PCV7 explanation is on screen', () => {
    const { container } = render(<Harness initial={PCV7_PATIENT} />);
    openTheCard();
    // Matched against the container's whole text, not one element: the
    // citation link SPLITS the sentence into three nodes, which is the
    // mechanism working rather than a problem.
    expect(container.textContent)
      .toMatch(/PCV7 doses are ignored when determining current pneumococcal needs/);
  });

  it('the marker became a link to immunize.org, not literal "[c]"', () => {
    const { container } = render(<Harness initial={PCV7_PATIENT} />);
    openTheCard();
    expect(container.textContent, 'a raw marker must never reach a clinician')
      .not.toMatch(/\[c\]/);

    const links = [...container.querySelectorAll('a.note-cite')]
      .filter((a) => /immunize\.org/.test(a.getAttribute('href') ?? ''));
    expect(links.length, 'the PCV7 verdict renders no citation link').toBeGreaterThan(0);

    const a = links[0];
    expect(a.textContent).toMatch(/^\[\d+\]$/);          // a number, assigned at render
    expect(a.getAttribute('href')).toMatch(/#:~:text=/); // deep-linked to the sentence
    expect(a.getAttribute('target')).toBe('_blank');
    // The hover text is CDC's/immunize.org's own sentence, not our paraphrase.
    expect(a.getAttribute('data-title')).toMatch(/doses of PCV7 should be ignored/);
  });

  it('a minimum-age verdict renders its own citation, to the CDC schedule notes', () => {
    const { container } = render(<Harness initial={{
      ageMonths: 9,
      dob: '2026-01-01',
      riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-01-22' }],  // 3 weeks old
      ppsv23Doses: [],
    }} />);
    openTheCard();

    expect(container.textContent).not.toMatch(/\[c\]/);
    const a = [...container.querySelectorAll('a.note-cite')]
      .find((x) => /child-adolescent-notes/.test(x.getAttribute('href') ?? ''));
    expect(a, 'the minimum-age verdict renders no citation link').toBeTruthy();
    expect(a.getAttribute('data-title')).toMatch(/minimum age: 6 weeks/);
  });
});
