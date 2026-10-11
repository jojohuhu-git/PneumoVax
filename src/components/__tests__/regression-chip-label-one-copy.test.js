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
  const OWNED = [
    'Recorded (does not count)',
    'Invalid',
    'Extra dose — more than this series needs',
    'Extra dose? — no date recorded',
  ];

  const CONSUMERS = [
    ['RecCard.jsx', '../RecCard.jsx'],
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

describe('doseChipLabel branches', () => {
  it('noncounting (PCV7) outranks everything else', () => {
    expect(doseChipLabel({ status: 'noncounting', effectiveDoseNum: 1 }, 2)).toBe('Recorded (does not count)');
  });

  // S14-2 (owner decision 2026-10-11): the chip no longer distinguishes an
  // on-time dose from one given sooner than CDC advises — that word pair is
  // gone, win or lose the `earlyAdvisory` flag. A valid dose always reads its
  // count; timing lives in the reasons text (see validate.js, RecCard.jsx).
  it('a valid dose within the total reads "Dose N of M", with or without earlyAdvisory', () => {
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: 2 }, 2)).toBe('Dose 2 of 2');
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: 2, earlyAdvisory: true }, 2)).toBe('Dose 2 of 2');
  });

  it('a valid dose with no tracked series total reads "Dose N"', () => {
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: 2 }, null)).toBe('Dose 2');
  });

  it('never prints a dose number greater than the total', () => {
    const label = doseChipLabel({ status: 'valid', effectiveDoseNum: 3 }, 2);
    expect(label).toBe('Booster');
    expect(label).not.toMatch(/\d/);
  });

  it('invalid and unknown', () => {
    expect(doseChipLabel({ status: 'invalid' })).toBe('Invalid');
    expect(doseChipLabel({ status: 'whatever' })).toBe('Unknown');
    expect(doseChipLabel(null)).toBeNull();
  });

  // S14-4: a dose recorded after the series was already complete by product.
  it('an extra dose outranks the numbered-count branches', () => {
    expect(doseChipLabel({ status: 'valid', effectiveDoseNum: null, extraDose: true }, 2))
      .toBe('Extra dose — more than this series needs');
  });

  it('an undated extra dose asks rather than asserts', () => {
    expect(doseChipLabel({ status: 'unknown', effectiveDoseNum: null, extraDose: true, extraDoseUnverified: true }, 2))
      .toBe('Extra dose? — no date recorded');
  });
});
