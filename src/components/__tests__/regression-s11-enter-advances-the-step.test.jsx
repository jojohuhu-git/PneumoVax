// @vitest-environment happy-dom
//
// S11 / P5-1 + P5-2 (2026-10-12): Enter continues the wizard, and every button
// says what it is.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// Measured in the running app: `document.forms.length` was 0. The wizard had no
// `<form>` anywhere, so typing a date of birth and pressing Enter did nothing at
// all — the step title stayed on "Patient Age". A keyboard user had to Tab past
// every control on the step to reach Next. Enter is what people press.
//
// ── Why the two halves are ONE commit ────────────────────────────────────
//
// Inside a `<form>`, a `<button>` with no `type` is a SUBMIT button. That is the
// HTML default and it is the trap: add the form on its own and every "+ Add PCV
// dose", every "×" remove button and every "Start Over" silently becomes a
// submit, so clicking "+ Add PCV dose" would add a row AND advance the step.
// Tabbing onto one and pressing Enter would do the same. So the explicit
// `type="button"` on all 14 of them has to land with or before the form — which
// is exactly what the queue said, and why these are not two commits.
//
// ── What Enter should do ─────────────────────────────────────────────────
//
// Exactly what it does on any other web page: the browser presses the form's
// submit button, which is Next. Nothing else calls goNext(). This is deliberately
// NOT a document-level keydown listener — MeningoVax had one of those (its B7)
// and removed it in K2, because a global listener fires no matter what has focus,
// which turns every button in the wizard into an Enter trap.
//
// ── What this file can and cannot prove ──────────────────────────────────
//
// happy-dom does not implement implicit form submission (the native "Enter in a
// text field presses the submit button" behaviour), so these tests assert the
// STRUCTURE that makes it work: one form, Next is its submit button, submitting
// advances the step, and no button is left to default to submit. The real Enter
// keypress was driven in a real browser and recorded in the commit message.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import React from 'react';
import App from '../../App.jsx';

describe('S11 / P5-1 — Enter continues the wizard', () => {
  it('the wizard is a real form', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('form')).toHaveLength(1);
  });

  it('Next is the form\'s submit button, so Enter presses it', () => {
    const { container } = render(<App />);
    const next = screen.getByRole('button', { name: 'Next' });
    // getAttribute, NOT `.type`: a <button> with no type at all already reports
    // `.type === "submit"`, because that is the HTML default. Asserting `.type`
    // would have passed on the broken code — it did, while this file's other
    // six assertions were red. The attribute has to be written down.
    expect(next.getAttribute('type')).toBe('submit');
    expect(next.closest('form')).not.toBeNull();
  });

  it('submitting the form advances the step, once an age is entered', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.step-title').textContent).toBe('Patient Age');

    const dob = container.querySelector('input[type="date"]');
    fireEvent.change(dob, { target: { value: '2015-01-01' } });
    fireEvent.submit(container.querySelector('form'));

    expect(container.querySelector('.step-title').textContent).not.toBe('Patient Age');
  });

  it('submitting with no age entered is refused, not silently ignored', () => {
    const { container } = render(<App />);
    fireEvent.submit(container.querySelector('form'));
    // Still on the age step, and the clinician is told why.
    expect(container.querySelector('.step-title').textContent).toBe('Patient Age');
    expect(container.textContent).toMatch(/valid age before continuing/i);
  });

  it('the Back button is not a submit, so Enter on it does not skip forward', () => {
    const { container } = render(<App />);
    const dob = container.querySelector('input[type="date"]');
    fireEvent.change(dob, { target: { value: '2015-01-01' } });
    fireEvent.submit(container.querySelector('form'));
    expect(screen.getByRole('button', { name: 'Back' }).type).toBe('button');
  });
});

// ── P5-2, as a source guard ──────────────────────────────────────────────
//
// A rendered test can only check the buttons that happen to be on screen in the
// state the test set up. The trap this is guarding against is a button someone
// adds LATER, in a branch no test renders, which then defaults to submit. So
// this reads the source instead and allows no exceptions.
const SRC = resolve(process.cwd(), 'src');

function jsxFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      jsxFiles(full, out);
    } else if (/\.jsx$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('S11 / P5-2 — no button is left to default to submit', () => {
  it('every <button> in src/ declares its type', () => {
    const offenders = [];
    for (const file of jsxFiles(SRC)) {
      const src = readFileSync(file, 'utf8');
      // Each `<button` up to the matching `>` of the opening tag.
      const re = /<button\b([\s\S]*?)>/g;
      let m;
      while ((m = re.exec(src)) !== null) {
        if (!/\btype\s*=/.test(m[1])) {
          const line = src.slice(0, m.index).split('\n').length;
          offenders.push(`${file.replace(SRC, 'src')}:${line}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('exactly one button in the app is a submit — the one Enter should press', () => {
    const submits = [];
    for (const file of jsxFiles(SRC)) {
      const src = readFileSync(file, 'utf8');
      const re = /<button\b([\s\S]*?)>/g;
      let m;
      while ((m = re.exec(src)) !== null) {
        if (/type\s*=\s*["{]?\s*["']?submit/.test(m[1])) {
          submits.push(file.replace(SRC, 'src'));
        }
      }
    }
    expect(submits).toHaveLength(1);
  });
});
