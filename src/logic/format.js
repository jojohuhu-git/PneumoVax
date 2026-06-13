// format.js — UI display helpers (not clinical logic)

/**
 * Format ageMonths using clinical immunization units.
 *   0 → "Birth", weeks for ≤2 months, months for 2–23 months,
 *   years (+months) for ≥24 months. Never "72 months" → "6 years".
 */
export function fmtAgeMonths(am) {
  if (am == null) return '';
  if (am < 0.25) return 'Birth';
  if (am <= 2) {
    const wks = Math.round(am * 4.348);
    if (wks < 1) return 'Birth';
    return `${wks} week${wks === 1 ? '' : 's'}`;
  }
  if (am < 24) {
    const mo = Math.round(am);
    return `${mo} month${mo === 1 ? '' : 's'}`;
  }
  const years = Math.floor(am / 12);
  const months = Math.round(am % 12);
  if (months === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
}

/** Format ISO date (YYYY-MM-DD) → "Jul 3, 2026". */
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

/** Derive age group label from ageMonths.
 *
 * FIX L1: the old boundary `am < 120` for "Child" excluded ages 120–131mo
 * (the 10th year) which should still be "Child". A 10-year-old is 120–131.9mo.
 * Fixed to `am < 132` so "Child (2–10y)" covers the full 2–10y range inclusive.
 * StepAge chips are aligned to the same boundary (see AGE_GROUP_CHIPS).
 */
export function ageGroup(am) {
  if (am == null) return null;
  if (am < 24) return 'Infant (<2y)';
  if (am < 132) return 'Child (2–10y)';
  if (am < 228) return 'Adolescent (11–18y)';
  if (am < 600) return 'Adult (19–49y)';
  return 'Older adult (≥50y)';
}

/** Compute ageMonths from a DOB ISO string and a reference date (defaults today). */
export function dobToAgeMonths(dobISO, refISO) {
  if (!dobISO) return null;
  const ref = refISO ? new Date(refISO + 'T00:00:00') : new Date();
  const dob = new Date(dobISO + 'T00:00:00');
  const diffMs = ref - dob;
  if (diffMs < 0) return null;
  return diffMs / (1000 * 60 * 60 * 24 * 30.4375);
}
