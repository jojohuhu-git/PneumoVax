// P7-2 (S13, 2026-10-10): PneumoVax is AHEAD of MeningoVax here — this test
// exists to keep it that way, not to fix anything.
//
// The project rule is CSS custom properties only, never inline hex or spacing
// literals in JSX (design-review, owner-decided). PneumoVax follows it with
// real classes (`step-toggle-row`, `age-badge-row`); MeningoVax REGRESSED to
// inline `style={{ display: 'flex', gap: 8, ... }}` in StepAge.jsx and
// StepHistory.jsx. The queue's instruction is explicit: port the direction of
// travel, not the inline styles.
//
// Measured 2026-10-10: PneumoVax has 1 inline style, MeningoVax has 9.
//
// The one allowed exception is `icons.jsx`'s Chevron, whose transform is
// driven by a prop (`open`) and genuinely cannot be a static rule without
// adding a class toggle for one rotation. It carries no color or font
// literal, and MeningoVax has the identical one — it is a shared pattern,
// not drift.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SRC = resolve(process.cwd(), 'src');
const ALLOWED = new Set(['components/icons.jsx']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      walk(full, out);
    } else if (/\.jsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('P7-2 — no inline styles creep into PneumoVax', () => {
  it('only the Chevron icon uses an inline style', () => {
    const offenders = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      if (ALLOWED.has(rel)) continue;
      const src = readFileSync(file, 'utf8');
      const hits = src.match(/style=\{\{/g);
      if (hits) offenders.push(`${rel} (${hits.length})`);
    }
    expect(
      offenders,
      'Use a CSS class and custom properties instead of an inline style. '
      + 'This is the regression MeningoVax has and PneumoVax does not — '
      + 'see P7-2.',
    ).toEqual([]);
  });

  it('no raw hex color appears in any component', () => {
    // The colors live in App.css as custom properties. A hex literal in JSX
    // is how a palette starts to fork.
    const offenders = [];
    for (const file of walk(SRC)) {
      const src = readFileSync(file, 'utf8');
      // Skip the stylesheet-free check for any line that is a comment.
      const hits = src
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .filter((l) => /#[0-9a-fA-F]{3,8}\b/.test(l));
      if (hits.length) offenders.push(`${file.slice(SRC.length + 1)}: ${hits[0].trim().slice(0, 60)}`);
    }
    expect(offenders).toEqual([]);
  });
});
