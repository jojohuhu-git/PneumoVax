// S6-3 — every number in the engine's age-band table is actually used.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// `recommend.js`'s `M` table is the engine's list of age thresholds. It held
// thirteen entries, and FIVE of them were referenced nowhere in the app:
//
//     m2:  2   (the 2-month routine PCV visit)
//     m16: 16
//     y2:  24  — the same number as m24
//     y5:  60  — the same number as m60
//     y6:  72  — the same number as m72
//
// Three of those five were ALIASES: a second name for a threshold the table
// already had. That is worse than ordinary dead code in a clinical engine.
// A reader cannot tell whether `y2` and `m24` are the same rule written twice
// or two different rules that happen to share a number today, so the next
// person to change "the 2-year threshold" has to guess which name the rule
// they care about travels under — and if they update one and not the other,
// the engine quietly holds two opinions about the same age.
//
// The number census (docs/archive/census-2026-10-10-pneumovax-numbers.md)
// queued this as "de-alias the M table and delete the dead m16". Measured
// here, there was nothing to de-alias: all three aliases were already unused,
// along with `m2` as well as `m16`. So the fix is a deletion, with no call
// site to rewrite and no behaviour to preserve.
//
// ── What this test holds ─────────────────────────────────────────────────
//
// Not the specific five — a test naming them would pass forever once they are
// gone and guard nothing. Instead: NO entry in the table may be unused, and no
// two entries may hold the same number. A dead threshold or a fresh alias
// fails this the moment it is added.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('../recommend.js', import.meta.url), 'utf8');

const TABLE_START = SRC.indexOf('const M = {');
const TABLE_END = SRC.indexOf('};', TABLE_START);

/** The table's text, and the rest of the file with the table cut out of it. */
const table = SRC.slice(TABLE_START, TABLE_END);
const elsewhere = SRC.slice(0, TABLE_START) + SRC.slice(TABLE_END);

/** Every `key: value` pair declared in the table. */
function entries() {
  return [...table.matchAll(/(\w+)\s*:\s*([A-Za-z_0-9]+)/g)]
    .map(([, key, value]) => ({ key, value }));
}

describe('S6-3 — the engine has no dead or duplicated age bands', () => {
  // Guards the guard: if the table ever moves or is renamed, the parsing above
  // silently matches nothing and every assertion below passes vacuously.
  it('finds the age-band table and reads a plausible number of entries', () => {
    expect(TABLE_START).toBeGreaterThan(-1);
    expect(TABLE_END).toBeGreaterThan(TABLE_START);
    expect(entries().length).toBeGreaterThanOrEqual(5);
  });

  it('every threshold in the table is used somewhere in the engine', () => {
    const unused = entries()
      .filter(({ key }) => !new RegExp(`M\\.${key}\\b`).test(elsewhere))
      .map(({ key, value }) => `${key} (= ${value})`);

    expect(unused, `unused age bands in recommend.js's M table: ${unused.join(', ')}`)
      .toEqual([]);
  });

  it('no two thresholds in the table hold the same number', () => {
    const byValue = new Map();
    for (const { key, value } of entries()) {
      byValue.set(value, [...(byValue.get(value) ?? []), key]);
    }
    const aliased = [...byValue.entries()]
      .filter(([, keys]) => keys.length > 1)
      .map(([value, keys]) => `${keys.join(' and ')} both = ${value}`);

    expect(aliased, `aliased age bands: ${aliased.join('; ')}`).toEqual([]);
  });
});
