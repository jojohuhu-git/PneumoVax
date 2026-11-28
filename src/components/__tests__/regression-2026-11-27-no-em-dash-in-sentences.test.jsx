// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// PNEUMO-EM-DASH (OWNER DECISIONS, 2026-11-27). MeningoVax took the em dash
// out of every sentence a clinician reads on 2026-11-26 (its Tier 3, "Sentences
// only"), restating the owner's July rule D7. PneumoVax had not been measured.
// Measured here on 2026-11-27: 65 distinct sentences of the app's own, seen by
// 14,078 of 17,016 real test patients. Her three answers:
//
//   1. Sentences: "Yes, like MeningoVax" — a period, colon or comma instead.
//      "Option A — 1 dose of PCV20" reads "Option A: 1 dose of PCV20".
//   2. Card headers: "Yes, use brackets" — "… — completes the series" reads
//      "… (completes the series)"; "No dose now — review at age 50" reads
//      "No dose now. Review at age 50".
//   3. Dose labels: "Keep, like MeningoVax" — "Not counted — repeat" and the
//      rest of the closed list in doseChipLabel.js keep their dash.
//
// What stays, on purpose:
//   - a source's own words, quoted exactly (inside “ ”), and every source
//     button's name and hover text (a document's title is the document's);
//   - the dose labels (answer 3);
//   - the transplant row and its message, frozen byte-for-byte with
//     MeningoVax (regression-2026-10-16-transplant-stop-mirrors-meningovax);
//   - "—" alone in a Rulebook table cell, which means "nothing here".
//
// The engine half sweeps every test patient and reads every sentence the
// results screen can show: card header, lead, "Why this", the dose lines and
// their "Why this", the PCV21 geography note, and "How this was worked out".
// The screen half renders the Rulebook with Show all, the risk step and the
// "About risk history" text.
// ─────────────────────────────────────────────────────────────────────────
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { recommend } from '../../logic/recommend.js';
import { buildCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import Rulebook from '../Rulebook.jsx';
import Disclaimer from '../Disclaimer.jsx';

// The closed dose-label list (doseChipLabel.js), kept by answer 3.
const DOSE_LABELS = [
  /Counted — (?:given early, accepted|not needed\. No more PPSV23\.|product not recorded|date not recorded)/g,
  /Not counted — (?:Extra\. Do not repeat\.|repeat|do not repeat|PCV7|no date)/g,
];

/** The words a clinician reads, minus quotes and dose labels; each em dash left, with context. */
export function dashesIn(text) {
  let t = String(text ?? '').replace(/“[^”]*”/g, ' ');
  for (const re of DOSE_LABELS) t = t.replace(re, ' ');
  return [...t.matchAll(/.{0,70}—.{0,50}/g)].map((m) => m[0]);
}

function engineSentences(r) {
  const out = [];
  for (const rec of r.recs ?? []) {
    out.push(rec.doseLabel);
    if (typeof rec.note === 'string') out.push(rec.note);
    else if (rec.note) out.push(rec.note.lead, rec.note.detail);
  }
  for (const d of [...(r.perDose?.pcv ?? []), ...(r.perDose?.ppsv23 ?? [])]) {
    out.push(d.detail, ...(d.reasons ?? []), ...(d.whys ?? []));
  }
  if (r.pcv21Geo) out.push(r.pcv21Geo.note);
  for (const s of r.path ?? []) out.push(s.step, s.took, s.because);
  return out.filter(Boolean);
}

function sweep(cases) {
  const found = new Map();
  for (const c of cases) {
    const r = recommend(c.input);
    if (r.excluded) continue; // the transplant stop: frozen with MeningoVax
    for (const s of engineSentences(r)) {
      for (const d of dashesIn(s)) {
        const key = d.replace(/\d+/g, 'N');
        if (!found.has(key)) found.set(key, `${c.key}: ${d}`);
      }
    }
  }
  return [...found.values()];
}

describe('PNEUMO-EM-DASH: no em dash in a sentence on the results screen', () => {
  it('the real-patient grid', () => {
    const cases = buildCases();
    expect(cases.length).toBeGreaterThan(17_000);
    expect(sweep(cases)).toEqual([]);
  }, 600_000);

  it('the impossible entries', () => {
    expect(sweep(buildRecordProblemCases())).toEqual([]);
  }, 600_000);

  it('the typical patients', () => {
    expect(sweep(buildTypicalCases())).toEqual([]);
  }, 600_000);

  it('the helper keeps a dose label and a quote, and catches a sentence', () => {
    expect(dashesIn('Not counted — repeat. Given at birth. “a — b”')).toEqual([]);
    expect(dashesIn('Counted — given early, accepted (dose 2 of 4)')).toEqual([]);
    expect(dashesIn('No PCV is indicated — healthy children')).toHaveLength(1);
  });
});

/** Text of an element, skipping source buttons/lists and "nothing here" cells. */
// A plain recursive walk: happy-dom's TreeWalker returned no text nodes here,
// which made the first draft of this check pass on text that has dashes.
// Kept: the Sources fold (document titles), a rule's quoted source panel, and
// the dose labels. React splits “{quote}” into three text nodes, so a quote is
// skipped by its container rather than by its curly quotes.
const KEPT = '#rb-sources, .rb-src-panel, .dose-val-chip';
function screenDashes(el, found = []) {
  if (el.nodeType === 3) {
    const t = el.nodeValue.trim();
    if (t.includes('—') && t !== '—') found.push(...dashesIn(t));
  } else if (el.nodeType === 1 && !el.matches(KEPT)) {
    for (const c of el.childNodes) screenDashes(c, found);
  }
  return found;
}

describe('PNEUMO-EM-DASH: no em dash in a sentence on the other screens', () => {
  it('the screen walk finds a dash in a sentence, and skips a kept one', () => {
    const div = document.createElement('div');
    div.innerHTML = '<p>One <em>two</em> three — four</p><td>—</td>'
      + '<span class="dose-val-chip">Odd — label</span><ul id="rb-sources"><li>CDC — Notes</li></ul>';
    expect(screenDashes(div)).toHaveLength(1);
  });

  it('the Rulebook, every fold open', () => {
    const { container } = render(<Rulebook />);
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(screenDashes(container)).toEqual([]);
  });

  it('the risk step notes (the transplant row aside)', () => {
    const notes = RISK_FACTORS.filter((r) => !r.exclude).flatMap((r) => [r.label, r.sublabel]);
    expect(notes.flatMap(dashesIn)).toEqual([]);
  });

  it('"About risk history"', () => {
    const { container } = render(<Disclaimer />);
    fireEvent.click(screen.getByTestId('disclaimer-toggle'));
    expect(screenDashes(container)).toEqual([]);
  });
});
