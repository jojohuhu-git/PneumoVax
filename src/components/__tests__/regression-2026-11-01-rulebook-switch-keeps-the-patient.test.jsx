// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// OWNER REVIEW 2026-11-01 (second round) — the Rulebook is a view of the same
// tab, switched from the header, and the patient form never shows under it.
//
// Her words: "Change How Pneumovax decides to Rulebook. Also include a button
// to it's left to get back to patient page, similar to pedivax schedule
// builder." and "I do not want the patient info section to live below the
// rulebook. There should be a back button to go back to entering in patient
// info."
//
// The second was a real bug, not a design choice: the form carried `hidden`,
// but `.app-form { display: flex }` beat the attribute, so "Patient Age" sat
// under the whole Rulebook. jsdom applies no stylesheet, so this file checks
// the CSS rule itself as well as the attribute.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import App from '../../App.jsx';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'App.css'), 'utf8');

describe('Patient | Rulebook switch', () => {
  it('has both buttons, Patient on the left, and no separate-tab link', () => {
    const { container } = render(<App />);
    const buttons = [...container.querySelectorAll('.viewnav button')].map((b) => b.textContent.trim());
    expect(buttons).toEqual(['Patient', 'Rulebook']);
    const tabLinks = [...container.querySelectorAll('a')].filter((a) => (a.getAttribute('href') ?? '').includes('?rules'));
    expect(tabLinks).toEqual([]);
  });

  it('hides the patient form behind the Rulebook, and the stylesheet lets it', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Rulebook' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Rulebook' })).toBeTruthy();
    expect(container.querySelector('form.app-form').hidden).toBe(true);
    expect(css).toMatch(/\.app-form\[hidden\]\s*\{\s*display:\s*none;?\s*\}/);
  });

  it('switching back finds the patient exactly as entered', () => {
    const { container } = render(<App />);
    const dob = container.querySelector('#dob-input');
    fireEvent.change(dob, { target: { value: '2015-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rulebook' }));
    fireEvent.click(screen.getByRole('button', { name: 'Patient' }));
    expect(container.querySelector('form.app-form').hidden).toBe(false);
    expect(container.querySelector('#dob-input').value).toBe('2015-01-01');
    expect(screen.queryByRole('heading', { level: 1, name: 'Rulebook' })).toBeNull();
  });
});
