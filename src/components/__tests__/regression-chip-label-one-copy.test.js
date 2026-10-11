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
    'On time',
    'Invalid',
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
    expect(doseChipLabel({ status: 'noncounting', offWindow: true })).toBe('Recorded (does not count)');
  });

  it('an off-window valid dose reads "Valid"', () => {
    expect(doseChipLabel({ status: 'valid', offWindow: true })).toBe('Valid');
  });

  it('a plain valid dose reads "On time"', () => {
    expect(doseChipLabel({ status: 'valid' })).toBe('On time');
  });

  it('invalid and unknown', () => {
    expect(doseChipLabel({ status: 'invalid' })).toBe('Invalid');
    expect(doseChipLabel({ status: 'whatever' })).toBe('Unknown');
    expect(doseChipLabel(null)).toBeNull();
  });
});
