// The single date the whole test suite pretends it is.
//
// S5 / P2-1 (2026-10-15). Ported from MeningoVax's `L2-1` (`src/test-today.js`):
// almost every fixture in this repo is a patient built from real dates, and the
// engine defaults to the real clock (`todayISO()` with no argument) when no
// `today` is passed — App.jsx itself calls it bare on every render. Before this,
// nothing pinned the clock, so a fixture's meaning could drift as the calendar
// moved, exactly the way MeningoVax's suite went red overnight once: a dose
// computed to 2.0 months old (valid) on one day and 1.97 months (invalid) the
// next, with nobody having touched the code.
//
// Pinning happens in test-setup.js, which applies to every test file. Tests that
// need to name the date (to write a fixture a known number of months back, say)
// import it from here rather than re-typing it.
//
// Changing this date is a deliberate act: fixtures across the suite are written
// relative to it, so moving it will move ages and intervals in every dated test.
export const TEST_TODAY = '2026-10-15';
