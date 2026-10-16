import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { TEST_TODAY } from './test-today.js';

// S5 / P2-1 (2026-10-15): freeze the calendar for every test file. Ported
// from MeningoVax's `L2-1` (`src/test-setup.js`).
//
// `App.jsx` calls `todayISO()` with no argument on every render, which reads
// the real system clock — so before this, every fixture that didn't pass its
// own `today` explicitly was silently graded against whatever day the suite
// happened to run on.
//
// Only Date is faked — setTimeout and friends stay real, so @testing-library's
// async helpers and happy-dom are unaffected. A test that wants a different
// date still passes `today` explicitly to the functions that accept it, or
// fakes its own time locally (see
// `regression-queue-p1-1-date-pickers-local-clock.test.jsx`, which sets and
// restores its own system time per test); pinning here only changes what the
// DEFAULT is. `citation-freshness.test.js` deliberately reads the REAL clock
// via `vi.getRealSystemTime()` instead, with its own guard that the real
// clock is in fact available.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  // Local noon, so todayISO() (which reads local clock components) returns
  // TEST_TODAY in every timezone the suite might run in.
  vi.setSystemTime(new Date(`${TEST_TODAY}T12:00:00`));
});

afterAll(() => {
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();
});
