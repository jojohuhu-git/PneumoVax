// P3-8 (S10b, 2026-10-10) — an age no living person can have must be refused,
// not turned into a confident recommendation.
//
// REPRODUCED live on the running app before the fix, both doors:
//
//   Date of Birth box, "0026-10-10" — one keystroke short in a four-digit year
//   box — was accepted silently. The badge read
//     "2000 years · Older adult (≥50y)"
//   Next stayed enabled, and the Results step produced a complete,
//   ordinary-looking routine adult recommendation:
//     "Due today: PCV." / "1 dose PCV (PCV20, PCV15, or PCV21)" /
//     "Routine pneumococcal vaccination for adults ≥50 with no (or unknown, or
//      PCV7-only) history: 1 dose …"
//   For the infant actually in the room, that is the wrong schedule entirely —
//   and nothing on the card looks wrong, so nothing tells the clinician.
//
//   Years box, "999" — accepted too, reading "999 years · Older adult (≥50y)".
//   The box carries max="120", but the app read the typed value directly, so
//   the attribute never bit.
//
// This is a PLAUSIBILITY bound, not a clinical rule — no ACIP/CDC guidance
// turns on it, so no source fetch gates it. 120 years is simply the bound the
// Years box already claimed. It is deliberately generous: refusing a real
// patient is the worse error, so the only ages refused are ones no living
// person can have. (For scale, the oldest verified human lived to 122.)
//
// Ported from MeningoVax's impossible-entries P0-1 (`b8a9335`), so the two
// apps refuse the same entries with the same wording.
import { describe, it, expect } from 'vitest';
import {
  ageEntryProblem,
  MAX_PLAUSIBLE_AGE_YEARS,
  MAX_PLAUSIBLE_AGE_MONTHS,
} from '../ageEntry.js';

const TODAY = '2026-10-10';
const dob = (d) => ageEntryProblem({ mode: 'dob', dob: d, today: TODAY });
const ym = (years, months) =>
  ageEntryProblem({ mode: 'precise', years, months, today: TODAY });

describe('P3-8 — the bound itself', () => {
  it('is 120 whole years, with the first refused age 121', () => {
    expect(MAX_PLAUSIBLE_AGE_YEARS).toBe(120);
    expect(MAX_PLAUSIBLE_AGE_MONTHS).toBe(121 * 12);
  });

  it('allows the whole of the 120th year', () => {
    // Someone aged 120 years 11 months still answers "120". Refusing them
    // would be refusing a real patient, the worse of the two errors.
    expect(ym('120', '11')).toBeNull();
    expect(ym('120', '0')).toBeNull();
  });

  it('refuses 121 years exactly', () => {
    expect(ym('121', '')).toContain('120');
  });
});

describe('P3-8 — the Date of Birth door', () => {
  it('refuses the 0026-for-2026 typo that produced an adult recommendation', () => {
    const msg = dob('0026-10-10');
    expect(msg).toBeTruthy();
    // The message must name the likely cause, not just say "invalid" — the
    // clinician needs to know where to look.
    expect(msg).toMatch(/year/i);
    expect(msg).toContain('26');
    expect(msg).toContain('2026');
  });

  it('refuses a date of birth in the future', () => {
    const msg = dob('2027-01-01');
    expect(msg).toBeTruthy();
    expect(msg).toMatch(/future/i);
  });

  it('accepts ordinary dates of birth, including today (a newborn)', () => {
    expect(dob('2026-10-10')).toBeNull(); // born today
    expect(dob('2026-02-10')).toBeNull(); // 8 months
    expect(dob('2011-10-10')).toBeNull(); // 15 years
    expect(dob('1958-01-10')).toBeNull(); // 68 years
    expect(dob('1920-01-01')).toBeNull(); // 106 years — old, but real
  });

  it('treats an empty box as unanswered, not wrong', () => {
    expect(dob('')).toBeNull();
    expect(dob(undefined)).toBeNull();
  });

  it('refuses a date of birth just past the bound, and allows just inside it', () => {
    // Measured against TODAY = 2026-10-10 (dobToAgeMonths, months):
    expect(dob('1905-10-09')).toBeTruthy(); // 1452.03 → 121y, the first refused
    expect(dob('1905-10-11')).toBeNull();   // 1451.97 → still inside the bound
    expect(dob('1906-10-09')).toBeNull();   // 1440.03 → 120y exactly, allowed
  });
});

describe('P3-8 — the Years / Months door', () => {
  it('refuses 999 years, which max="120" did not stop', () => {
    expect(ym('999', '')).toBeTruthy();
  });

  it('refuses negative numbers in either box', () => {
    expect(ym('-1', '')).toMatch(/negative/i);
    expect(ym('', '-3')).toMatch(/negative/i);
  });

  it('refuses a months value of 12 or more, which is a year spelled wrong', () => {
    const msg = ym('', '12');
    expect(msg).toBeTruthy();
    expect(msg).toMatch(/Years box/);
  });

  it('accepts ordinary ages', () => {
    expect(ym('0', '2')).toBeNull();   // 2-month-old
    expect(ym('15', '')).toBeNull();
    expect(ym('', '7')).toBeNull();    // months only
    expect(ym('68', '4')).toBeNull();
  });

  it('treats both boxes empty as unanswered, not wrong', () => {
    expect(ym('', '')).toBeNull();
    expect(ym(undefined, undefined)).toBeNull();
  });
});
