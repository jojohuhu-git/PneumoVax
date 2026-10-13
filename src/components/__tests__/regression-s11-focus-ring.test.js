// S11 / P5-4 (2026-10-12): a visible focus ring wherever Tab lands.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// `App.css` had no `:focus-visible` rule at all — measured in the running app,
// zero matching rules in any stylesheet. Buttons, checkboxes, selects and
// citation links therefore fell back to whatever ring each browser happens to
// draw, which differs between Chrome, Safari and Firefox and is easy to lose
// track of while tabbing through a four-step wizard.
//
// Worse, two rules actively REMOVED the ring: `.age-field input:focus` and
// `.dose-field input:focus` both set `outline: none`. The age field replaced it
// with a 3px halo, so it still read as focused; the dose fields replaced it with
// a border-colour change only, so the same app had two different ideas of what
// focus looks like.
//
// ── Why `:focus-visible` and not `:focus` ────────────────────────────────
//
// `:focus-visible` is the browser's own judgement about whether focus arrived by
// keyboard. Using it means a keyboard user gets the ring and a mouse user's
// click is left exactly as it was — which is why the ring can be made obvious
// without anyone complaining that clicking a button outlines it.
//
// ── Ported, not invented ─────────────────────────────────────────────────
//
// This is MeningoVax's K5 (`60aa8d1`), the same rule with the same tokens.
// PneumoVax's token names and values are identical, so it is a copy.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CSS = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8');

/** The declarations inside one rule, lowercased. */
function ruleBody(selector) {
  const at = CSS.indexOf(`${selector} {`);
  if (at === -1) return null;
  const open = CSS.indexOf('{', at);
  return CSS.slice(open + 1, CSS.indexOf('}', open)).toLowerCase();
}

describe('S11 / P5-4 — Tab always lands somewhere you can see', () => {
  it('a :focus-visible rule exists at all', () => {
    expect(ruleBody(':focus-visible')).not.toBeNull();
  });

  it('it draws a real outline, offset so it is not swallowed by the control', () => {
    const body = ruleBody(':focus-visible');
    expect(body).toMatch(/outline:\s*2px solid var\(--c\)/);
    expect(body).toMatch(/outline-offset:\s*2px/);
  });

  it('it uses colour tokens, never a hex literal', () => {
    const body = ruleBody(':focus-visible');
    expect(body).not.toMatch(/#[0-9a-f]{3,8}/);
  });

  it('the dose fields get the same halo the age field already had', () => {
    // Before: the age field had `box-shadow: 0 0 0 3px var(--clt)` on focus and
    // the dose fields had only a border-colour change, which read as two
    // different apps.
    const age = ruleBody('.age-field input:focus');
    const dose = ruleBody('.dose-field input:focus, .dose-field select:focus');
    expect(age).toMatch(/box-shadow:\s*0 0 0 3px var\(--clt\)/);
    expect(dose).toMatch(/box-shadow:\s*0 0 0 3px var\(--clt\)/);
  });

  // The rule that keeps a future session from "tidying up" the ring away: any
  // rule that kills the outline must put something visible back.
  it('no rule removes the outline without replacing it', () => {
    const offenders = [];
    const re = /([^{}]+)\{([^}]*outline:\s*none[^}]*)\}/g;
    let m;
    while ((m = re.exec(CSS)) !== null) {
      const selector = m[1].trim().split('\n').pop().trim();
      const body = m[2];
      const replaces = /box-shadow:|border-color:/.test(body);
      if (!replaces) offenders.push(selector);
    }
    expect(offenders).toEqual([]);
  });
});
