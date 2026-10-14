// PARITY-1 (2026-10-12): the impossible-dose-date warning is a tinted box in
// BOTH apps, not bare red text in one of them.
//
// ── What was actually wrong, and what wasn't ─────────────────────────────
//
// The handoff this session resumed recorded the difference as a BEHAVIOUR one:
// "MeningoVax's history step disables Next on a future date; PneumoVax warns
// and lets you through." That is **wrong**, and the correction matters more
// than the fix: MeningoVax has no `disabled` prop anywhere in `src/` at all.
// Both apps warn and let the clinician continue. The owner's "warn, do not
// trap" decision (2026-10-12) was never in conflict with the sibling app, and
// nothing about it changes here.
//
// The real difference was only how the warning LOOKS. MeningoVax draws it as a
// tinted box with a red left border (`.dose-row-problem`); PneumoVax drew the
// same sentence as bare `--r` text, which sat on the dose row's own grey
// background with nothing to separate it.
//
// ── Why this is the direction of travel ──────────────────────────────────
//
// Owner decision, 2026-10-12: "PneumoVax should match MeningoVax, not the
// other way around." That is also what the standing design-parity rule says —
// design-system changes (colour tokens, spacing, radius) flow MeningoVax →
// PneumoVax, because both are the newer single-vaccine apps on one system.
//
// Every token in the copied rule (`--rlt`, `--r`, `--rads`, `--sp-8`,
// `--sp-12`, `--fs-base`) is defined identically in both apps' `App.css`, so
// this is a copy, not a redesign. Verified 2026-10-12.
//
// ── Why a CSS test and not a rendered one ────────────────────────────────
//
// happy-dom does not apply a stylesheet, so a rendered assertion could only
// confirm the class NAME is present — which it already was, while the box was
// invisible. The rule's own declarations are the only thing that can fail
// here, so the test reads them. The COPY is asserted elsewhere
// (`regression-history-step-warns-on-impossible-dates`); this file is about
// the box.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PNEUMO_CSS = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8');
const MENINGO_CSS_PATH = '/Users/joannehuang/Downloads/MeningoVax-main/src/App.css';

/** The declarations inside one class rule, as a lowercased single string. */
function ruleBody(css, selector) {
  const at = css.indexOf(`${selector} {`);
  if (at === -1) return null;
  const open = css.indexOf('{', at);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close).toLowerCase();
}

describe('PARITY-1 — the impossible-date warning is a tinted box, as in MeningoVax', () => {
  const body = ruleBody(PNEUMO_CSS, '.dose-row-date-problem');

  it('the rule exists at all', () => {
    expect(body).not.toBeNull();
  });

  it('is tinted, so it reads as a box rather than loose red text', () => {
    expect(body).toMatch(/background:\s*var\(--rlt\)/);
  });

  it('carries the red left border that marks a problem in both apps', () => {
    expect(body).toMatch(/border-left:\s*3px solid var\(--r\)/);
  });

  it('has the padding and radius a box needs to be one', () => {
    expect(body).toMatch(/padding:\s*var\(--sp-8\) var\(--sp-12\)/);
    expect(body).toMatch(/border-radius:\s*var\(--rads\)/);
  });

  it('keeps the red text colour it already had', () => {
    expect(body).toMatch(/color:\s*var\(--r\)/);
  });

  // The guard that makes this a PARITY test rather than a style preference:
  // if MeningoVax's own rule is ever restyled, this fails and the next session
  // has to decide deliberately instead of letting the two apps drift apart.
  // Skipped rather than failed when the sibling repo is not checked out
  // alongside this one, because CI clones only this repo.
  it('matches MeningoVax\'s own rule declaration for declaration', () => {
    let meningo;
    try {
      meningo = ruleBody(readFileSync(MENINGO_CSS_PATH, 'utf8'), '.dose-row-problem');
    } catch {
      return; // sibling repo not present (CI) — the assertions above still ran
    }
    if (meningo == null) return;
    const declarations = (s) =>
      s.split(';').map(d => d.trim()).filter(Boolean).sort();
    expect(declarations(body)).toEqual(declarations(meningo));
  });
});
