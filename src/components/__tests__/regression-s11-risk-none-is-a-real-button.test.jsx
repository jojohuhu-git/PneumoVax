// @vitest-environment happy-dom
//
// S11 / P5-6 (2026-10-12): "No risk factors apply" is a real button.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// It was a `<label>` wearing `role="button"` and `tabIndex={0}`, with a
// hand-written `onKeyDown` that handled Enter. Three things follow from that:
//
//   1. **Space did nothing.** A real button is activated by BOTH Enter and
//      Space; this one only listened for Enter. A keyboard user who pressed
//      Space — the key most people reach for on a button — got nothing, with no
//      hint that the other key would have worked.
//   2. **A screen reader could not tell whether it was on.** The control is a
//      toggle: tick it and every risk factor is cleared, and `.selected` tints
//      it. That state was carried in a CSS class and nothing else, so it was
//      announced identically whether it was chosen or not.
//   3. A `<label>` is the element for naming a form control. Using one as a
//      button means re-implementing, by hand and incompletely, what `<button>`
//      already does.
//
// ── Ported, not invented ─────────────────────────────────────────────────
//
// MeningoVax's StepRisks.jsx already uses `<button type="button">` with
// `aria-pressed` for the identical control, and its `.risk-none` rule already
// carries the four resets a <button> needs (width, background, font-family,
// text-align). Copied, including the resets.
//
// The wording stays PneumoVax's own ("No risk factors apply"). Copy is not what
// the design-parity rule covers, and nobody asked for it to change.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import StepRisks from '../StepRisks.jsx';

function renderStep(riskIds = [], onChange = () => {}) {
  return render(
    <StepRisks ageMonths={141} riskIds={riskIds} onChange={onChange} />
  );
}

describe('S11 / P5-6 — "No risk factors apply" is a real button', () => {
  it('is a button, not a label pretending to be one', () => {
    const { container } = renderStep();
    const el = container.querySelector('.risk-none');
    expect(el.tagName).toBe('BUTTON');
  });

  it('is type="button", so it cannot submit the form it now sits in', () => {
    // S11 / P5-1 put the whole wizard inside a <form>; a typeless button there
    // is a submit button.
    const { container } = renderStep();
    expect(container.querySelector('.risk-none').getAttribute('type')).toBe('button');
  });

  it('reads as pressed when no risk factors are selected', () => {
    // `noneSelected` is `riskIds.length === 0`, so an empty list IS the chosen
    // state for this control — it means "none of these apply".
    const { container } = renderStep([]);
    expect(container.querySelector('.risk-none').getAttribute('aria-pressed')).toBe('true');
  });

  it('reads as NOT pressed once a risk factor is selected', () => {
    const { container } = renderStep(['asplenia']);
    expect(container.querySelector('.risk-none').getAttribute('aria-pressed')).toBe('false');
  });

  it('clears the selected risk factors when activated', () => {
    const calls = [];
    renderStep(['asplenia'], ids => calls.push(ids));
    fireEvent.click(screen.getByRole('button', { name: /No risk factors apply/i }));
    expect(calls).toEqual([[]]);
  });

  it('no longer carries a hand-written key handler', () => {
    // The point of using a real <button>: the browser handles Enter AND Space.
    // A remaining onKeyDown would mean someone re-added the half-implementation.
    const raw = readFileSync(
      resolve(process.cwd(), 'src/components/StepRisks.jsx'), 'utf8'
    );
    // Strip comments first. The comment explaining WHY the key handler is gone
    // contains the word `onKeyDown`, and matching the raw file made this test
    // fail on correct code.
    const code = raw
      .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/onKeyDown/);
    expect(code).not.toMatch(/role=["']button["']/);
  });
});

describe('S11 / P5-6 — the CSS resets a <button> needs', () => {
  const CSS = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8');
  const body = (() => {
    const at = CSS.indexOf('.risk-none {');
    const open = CSS.indexOf('{', at);
    return CSS.slice(open + 1, CSS.indexOf('}', open)).toLowerCase();
  })();

  it('spans the full width, as the label did', () => {
    expect(body).toMatch(/width:\s*100%/);
  });

  it('keeps the app\'s own font and left alignment, not the button default', () => {
    expect(body).toMatch(/font-family:\s*inherit/);
    expect(body).toMatch(/text-align:\s*left/);
  });

  it('has no button chrome behind it', () => {
    expect(body).toMatch(/background:\s*none/);
  });
});
