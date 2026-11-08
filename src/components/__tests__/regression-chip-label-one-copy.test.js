// S14-1 — the dose chip's wording lives in one module.
//
// MeningoVax paid for this lesson first: a second copy of the chip-label
// logic, hand-typed into a test, silently drifted from the real component —
// 20,167 of 95,928 rows disagreed before anyone noticed
// (regression-chip-label-one-copy.test.js, MeningoVax). PneumoVax's
// RecCard.jsx used to compute this wording inline; this file is the guard
// that stops a second copy from reappearing now that it has been pulled out.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { doseChipLabel } from '../doseChipLabel.js';

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');

describe('the chip label lives in one module', () => {
  // The literals no file outside doseChipLabel.js may spell out for itself.
  // §DOSE-LABELS (2026-11-08): the owner's closed list.
  const OWNED = [
    'Counted — given early, accepted',
    'Counted — not needed. No more PPSV23.',
    'Counted — product not recorded',
    'Counted — date not recorded',
    'Not counted — Extra. Do not repeat.',
    'Not counted — repeat',
    'Not counted — do not repeat',
    'Not counted — PCV7',
    'Check the date',
  ];

  const CONSUMERS = [
    ['RecCard.jsx', '../RecCard.jsx'],
    // S14-5: Results.jsx's "Color key" legend used to hand-type these same
    // words to explain the chip colors — exactly the second-copy drift this
    // file guards against (S3-N1 "hand-copied its wording into RecCard.jsx
    // and Results.jsx", per the S14-RC handoff). The legend is gone now, so
    // this consumer should stay clean for free; guarding it stops a new copy
    // from creeping back in its place.
    ['Results.jsx', '../Results.jsx'],
  ];

  for (const [name, rel] of CONSUMERS) {
    for (const literal of OWNED) {
      it(`${name} does not hand-type "${literal}"`, () => {
        // Strip comments: they may quote the old wording on purpose,
        // explaining what changed and why. That history is not a second copy.
        const code = read(rel)
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .split('\n')
          .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
          .join('\n');
        expect(code).not.toContain(literal);
      });
    }
  }
});

describe('doseChipLabel branches (§DOSE-LABELS, owner decision 2026-11-08)', () => {
  it('PCV7 outranks everything else', () => {
    expect(doseChipLabel({ status: 'noncounting', effectiveDoseNum: 1 }, 2)).toBe('Not counted — PCV7');
  });

  it('an on-time dose reads "Dose N of M", an early one that counts says so', () => {
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: 2 }, 2)).toBe('Dose 2 of 2');
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: 2, earlyAdvisory: true }, 2)).toBe('Counted — given early, accepted (dose 2 of 2)');
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: 2, earlyAdvisory: true }, null)).toBe('Counted — given early, accepted');
  });

  it('a valid dose with no tracked series total reads "Dose N"', () => {
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: 2 }, null)).toBe('Dose 2');
  });

  it('never prints a dose number greater than the total', () => {
    const label = doseChipLabel({ status: 'valid', effectiveDoseNum: 3 }, 2);
    expect(label).toBe('Booster');
    expect(label).not.toMatch(/\d/);
  });

  it('invalid: repeated unless thrown out for timing, not needed, or not repeated by the card', () => {
    expect(doseChipLabel({ status: 'invalid' })).toBe('Not counted — repeat');
    expect(doseChipLabel({ status: 'invalid', intervalRuleId: 'X' })).toBe('Not counted — do not repeat');
    expect(doseChipLabel({ status: 'invalid', notNeeded: true })).toBe('Not counted — do not repeat');
    expect(doseChipLabel({ status: 'invalid', notRepeated: true })).toBe('Not counted — do not repeat');
    expect(doseChipLabel({ status: 'invalid', intervalRuleId: 'X', repeatedOn: '2020-01-01' })).toBe('Not counted — repeat');
    expect(doseChipLabel({ status: 'invalid', recordProblem: 'future' })).toBe('Check the date');
    expect(doseChipLabel({ status: 'whatever' })).toBe('Unknown');
    expect(doseChipLabel(null)).toBeNull();
  });

  it('counted without a product, or without a date', () => {
    expect(doseChipLabel({ status: 'unknown', effectiveDoseNum: 1 }, null)).toBe('Counted — product not recorded');
    expect(doseChipLabel({ status: 'unknown', effectiveDoseNum: 1, undated: true }, null)).toBe('Counted — date not recorded');
  });

  // S14-4: a dose recorded after the series was already complete by product.
  it('an extra dose outranks the numbered-count branches', () => {
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: null, extraDose: true }, 2))
      .toBe('Not counted — Extra. Do not repeat.');
  });

  it('an undated extra dose asks rather than asserts', () => {
    expect(doseChipLabel({ status: 'unknown', effectiveDoseNum: null, extraDose: true, extraDoseUnverified: true }, 2))
      .toBe('Check the date — none recorded');
  });
});
