import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';

const TODAY = '2026-06-06';

describe('PCV7 never counts', () => {
  it('PCV7 dose → status noncounting, dropped from effective', () => {
    const { perDose, effective } = analyzeHistory('PCV',
      [{ product: 'PCV7', date: '2005-01-01' }], 660, TODAY);
    expect(perDose[0].status).toBe('noncounting');
    expect(perDose[0].doesNotCount).toBe(true);
    expect(effective.length).toBe(0);
  });

  it('PCV7 + PCV20 → only PCV20 counts', () => {
    const { effective } = analyzeHistory('PCV',
      [{ product: 'PCV7', date: '2005-01-01' }, { product: 'PCV20', date: '2024-01-01' }], 660, TODAY);
    expect(effective.length).toBe(1);
    expect(effective[0].product).toBe('PCV20');
  });
});

describe('PCV21 children invalid', () => {
  it('child recorded with PCV21 → invalid, dropped', () => {
    const { perDose, effective } = analyzeHistory('PCV',
      [{ product: 'PCV21', date: '2024-01-01' }], 120, TODAY);
    expect(perDose[0].status).toBe('invalid');
    expect(effective.length).toBe(0);
  });

  it('adult recorded with PCV21 → valid, counts', () => {
    const { perDose, effective } = analyzeHistory('PCV',
      [{ product: 'PCV21', date: '2024-01-01' }], 480, TODAY);
    expect(perDose[0].status).toBe('valid');
    expect(effective.length).toBe(1);
  });
});

describe('Min-age validation', () => {
  it('PCV given before 6 weeks → invalid', () => {
    // dose given ~10 days ago; patient is ~1 month → below 2-month min
    const { perDose } = analyzeHistory('PCV',
      [{ product: 'PCV15', date: '2026-05-27' }], 1, TODAY);
    expect(perDose[0].status).toBe('invalid');
  });

  it('PPSV23 below 2 years → invalid', () => {
    const { perDose } = analyzeHistory('PPSV23',
      [{ product: 'PPSV23', date: '2025-06-06' }], 18, TODAY);
    expect(perDose[0].status).toBe('invalid');
  });

  it('dateless PCV21 for a child (current age upper bound <19y) → invalid', () => {
    const { perDose } = analyzeHistory('PCV',
      [{ product: 'PCV21' }], 120, TODAY);
    expect(perDose[0].status).toBe('invalid');
  });
});

describe('Unknown / dateless doses', () => {
  it('dateless PCV15 for an adult → unknown, counts', () => {
    const { perDose, effective } = analyzeHistory('PCV',
      [{ product: 'PCV15' }], 660, TODAY);
    expect(perDose[0].status).toBe('unknown');
    expect(effective.length).toBe(1);
  });

  it('unknown product, dated, plausible age → counts', () => {
    const { effective } = analyzeHistory('PCV',
      [{ product: '', date: '2024-01-01' }], 660, TODAY);
    expect(effective.length).toBe(1);
  });

  it('empty history → empty result', () => {
    const { perDose, effective } = analyzeHistory('PCV', [], 660, TODAY);
    expect(perDose.length).toBe(0);
    expect(effective.length).toBe(0);
  });
});

describe('effective dose numbering', () => {
  it('two valid PCV doses → effectiveDoseNum 1,2', () => {
    const { perDose } = analyzeHistory('PCV',
      [{ product: 'PCV13', date: '2024-01-01' }, { product: 'PCV15', date: '2024-04-01' }], 660, TODAY);
    expect(perDose[0].effectiveDoseNum).toBe(1);
    expect(perDose[1].effectiveDoseNum).toBe(2);
  });

  it('PCV7 between valid doses does not advance the count', () => {
    const { perDose } = analyzeHistory('PCV',
      [{ product: 'PCV13', date: '2024-01-01' }, { product: 'PCV7', date: '2024-02-01' }, { product: 'PCV20', date: '2024-04-01' }],
      660, TODAY);
    expect(perDose[0].effectiveDoseNum).toBe(1);
    expect(perDose[1].effectiveDoseNum).toBeNull(); // PCV7
    expect(perDose[2].effectiveDoseNum).toBe(2);
  });
});
