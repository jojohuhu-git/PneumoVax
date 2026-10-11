// @vitest-environment happy-dom
// P3-9, UI half (S13, 2026-10-10). The logic half (P3-9b / peds audit P0-3)
// shipped in S10b: `pedsRiskIds()` strips `adultOnly` risks so a 15-year-old
// whose only tick is "Cigarette smoking" is no longer handed an at-risk
// catch-up regimen. That fix is correct but SILENT — the engine disregards the
// tick and nothing on screen says so, while the Results summary still lists
// the risk as a chip beside a recommendation that ignored it.
//
// The owner HELD PR #20 on that basis (2026-10-10): "don't ship a silent
// ignore." This is the note that clears the hold.
//
// Owner decision 2026-10-10, option (b): show the adult-only risk at EVERY
// age, and have a quiet note say plainly that it does not change a child's
// schedule. Nothing is withheld; the note raises the doubt and the clinician
// decides. The age gate that used to HIDE the checkbox below 19y goes away —
// it was never a real guard anyway (it only controlled rendering and never
// cleared a tick already in state, which is how the bug was reachable).
//
// ── Wording is sourced, not invented ────────────────────────────────────
// Both halves of the note's claim were fetched live 2026-10-10 (browser pane;
// WebFetch truncates these pages, and `innerText` silently omits the
// collapsed accordion bodies — `textContent` is required, with "cochlear" and
// "diabetes" as positive controls to prove the content actually loaded).
//
// CDC Adult Immunization Schedule Notes, pneumococcal, the "**" footnote to
// "Age 19-49 years with certain underlying medical conditions or other risk
// factors**" — smoking and alcoholism ARE adult risk factors, verbatim:
//
//   "**Note: Underlying medical conditions or other risk factors include
//    alcoholism, chronic heart/liver/lung disease, chronic renal failure,
//    cigarette smoking, cochlear implant, congenital or acquired asplenia,
//    CSF leak, diabetes mellitus, generalized malignancy, HIV infection,
//    Hodgkin disease, immunodeficiencies, iatrogenic immunosuppression,
//    leukemia, lymphoma, multiple myeloma, nephrotic syndrome, solid organ
//    transplant, or sickle cell disease or other hemoglobinopathies."
//
// CDC Child & Adolescent Schedule Notes, pneumococcal "Special situations" —
// two risk groups, CDC's complete paediatric enumeration, and neither names
// smoking or alcohol: 0 matches for /smok|alcohol|cigarette/i across the
// 75,723-character page while "cochlear" and "diabetes" both match.
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StepRisks from '../StepRisks.jsx';
import Results from '../Results.jsx';
import { ADULT_SCHED_MIN_M } from '../../logic/scheduleConstants.js';

const CHILD = 15 * 12;              // 180 months — on the paediatric rulebook
const ADULT = ADULT_SCHED_MIN_M;    // 228 months — 19y, the adult boundary

function StepHarness({ ageMonths, initialRiskIds = [] }) {
  const [riskIds, setRiskIds] = useState(initialRiskIds);
  return <StepRisks ageMonths={ageMonths} riskIds={riskIds} onChange={setRiskIds} />;
}

function ResultsHarness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={patch => setState(s => ({ ...s, ...patch }))}
      onReset={() => {}}
    />
  );
}

describe('P3-9 — the age gate is gone; adult-only risks show at every age', () => {
  it('offers "Cigarette smoking" to a 15-year-old instead of hiding it', () => {
    render(<StepHarness ageMonths={CHILD} />);
    expect(screen.getByText('Cigarette smoking')).toBeTruthy();
    expect(screen.getByText('Alcohol use disorder')).toBeTruthy();
  });

  it('still offers it to an adult', () => {
    render(<StepHarness ageMonths={ADULT} />);
    expect(screen.getByText('Cigarette smoking')).toBeTruthy();
  });
});

describe('P3-9 — RiskAgeNote explains the tick the engine disregards', () => {
  it('appears on the risk step when a child has an adult-only risk ticked', () => {
    render(<StepHarness ageMonths={CHILD} initialRiskIds={['smoking']} />);
    const note = screen.getByTestId('risk-age-note');
    expect(note).toBeTruthy();
    // It names the specific tick, so the clinician knows which one is meant.
    expect(note.textContent).toContain('Cigarette smoking');
    // And it says plainly that the recommendation does not change.
    expect(note.textContent.toLowerCase()).toMatch(/does not change/);
  });

  it('does NOT appear when a child has only paediatric risks ticked', () => {
    render(<StepHarness ageMonths={CHILD} initialRiskIds={['diabetes']} />);
    expect(screen.queryByTestId('risk-age-note')).toBeNull();
  });

  it('does NOT appear when no risk is ticked', () => {
    render(<StepHarness ageMonths={CHILD} />);
    expect(screen.queryByTestId('risk-age-note')).toBeNull();
  });

  it('does NOT appear for an adult, where the risk genuinely acts', () => {
    render(<StepHarness ageMonths={ADULT} initialRiskIds={['smoking']} />);
    expect(screen.queryByTestId('risk-age-note')).toBeNull();
  });

  it('is keyed to the engine boundary: 19y exactly gets no note, one month under does', () => {
    // The note must switch at ADULT_SCHED_MIN_M (228 = 19y), the schedule
    // routing boundary the engine uses — NOT at PCV21_MIN_AGE_M (216 = 18y),
    // which is a product min-age and a different clinical concept entirely.
    const { unmount } = render(<StepHarness ageMonths={ADULT} initialRiskIds={['smoking']} />);
    expect(screen.queryByTestId('risk-age-note')).toBeNull();
    unmount();
    render(<StepHarness ageMonths={ADULT - 1} initialRiskIds={['smoking']} />);
    expect(screen.getByTestId('risk-age-note')).toBeTruthy();
  });

  it('names both ticks, in plural, when both adult-only risks are selected', () => {
    render(<StepHarness ageMonths={CHILD} initialRiskIds={['smoking', 'alcoholism']} />);
    const note = screen.getByTestId('risk-age-note');
    expect(note.textContent).toContain('Cigarette smoking');
    expect(note.textContent).toContain('Alcohol use disorder');
    expect(note.textContent).toMatch(/are adult pneumococcal risk factors/);
  });

  it('uses singular wording for a single tick', () => {
    render(<StepHarness ageMonths={CHILD} initialRiskIds={['smoking']} />);
    expect(screen.getByTestId('risk-age-note').textContent)
      .toMatch(/is an adult pneumococcal risk factor/);
  });

  it('carries two numbered citations that deep-link to the quoted CDC sentences', () => {
    render(<StepHarness ageMonths={CHILD} initialRiskIds={['smoking']} />);
    const cites = [...screen.getByTestId('risk-age-note').querySelectorAll('a.note-cite')];
    expect(cites).toHaveLength(2);
    expect(cites.map(a => a.textContent)).toEqual(['[1]', '[2]']);
    // [1] — the adult notes sentence that lists smoking as an adult factor.
    expect(cites[0].getAttribute('href')).toContain('adult-notes.html');
    expect(cites[0].getAttribute('href')).toContain('#:~:text=');
    expect(cites[0].getAttribute('title')).toMatch(/cigarette smoking/i);
    // [2] — the child notes "Special situations" list, which omits it.
    expect(cites[1].getAttribute('href')).toContain('child-adolescent-notes.html');
    expect(cites[1].getAttribute('href')).toContain('#:~:text=');
    // The two-fragment bug: a quote link must carry exactly one "#".
    for (const a of cites) {
      expect((a.getAttribute('href').match(/#/g) || []).length).toBe(1);
    }
  });
});

describe('P3-9 — the note reaches the Results surface too', () => {
  // The hold's actual complaint: Results lists the risk as a chip beside a
  // recommendation that ignored it. The note has to be on THIS surface, not
  // only on the step where the box was ticked.
  const childSmokerState = () => ({
    ageMonths: CHILD,
    riskIds: ['smoking'],
    pcvDoses: [],
    ppsv23Doses: [],
  });

  it('shows the note beside the risk chips', () => {
    render(<ResultsHarness initial={childSmokerState()} />);
    expect(screen.getByTestId('risk-age-note')).toBeTruthy();
  });

  it('the chip is still shown — nothing is withheld, it is explained', () => {
    render(<ResultsHarness initial={childSmokerState()} />);
    expect(screen.getByText('Cigarette smoking')).toBeTruthy();
  });

  it('the note agrees with what the engine actually did', () => {
    // The sentence claims the recommendation does not change. Pin that against
    // the real engine output: this child must be on the healthy 5-18y path,
    // NOT given an at-risk catch-up regimen. If the engine ever starts acting
    // on the tick, this fails and the note becomes a lie.
    render(<ResultsHarness initial={childSmokerState()} />);
    expect(screen.getByTestId('risk-age-note')).toBeTruthy();
    const body = document.body.textContent;
    expect(body).toMatch(/Not indicated/i);
    expect(body).not.toMatch(/at-risk catch-up/i);
  });

  it('no note for a child with a genuine paediatric risk', () => {
    render(<ResultsHarness initial={{ ...childSmokerState(), riskIds: ['diabetes'] }} />);
    expect(screen.queryByTestId('risk-age-note')).toBeNull();
  });
});
