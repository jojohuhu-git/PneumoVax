// ─────────────────────────────────────────────────────────────────────────
// pneumoRecsCases.mjs — the 2026-10-25 comparison case list.
//
// 66 synthetic patients, chosen so that every family the engine routes
// through is represented AND almost every patient has a control that
// differs from it by exactly one fact. A disagreement between the two
// tools then points at a rule, not at a patient.
//
// No PHI. Every birth date and dose date is synthetic and chosen to land
// on the age the comparison needs, measured from TODAY.
//
// `cdc` is filled in only after the live tool has been answered question
// by question for that patient; `null` means not yet captured, and the
// report says so rather than guessing.
// ─────────────────────────────────────────────────────────────────────────
export const TODAY = '2026-10-25';

// Birth date for a patient who is `y` years and `m` months old today, plus
// `extraDays` of slack so that a session running past midnight cannot slide
// a patient across an age band boundary.
export function dobFor(y, m = 0, extraDays = 5) {
  const d = new Date(TODAY + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() - y);
  d.setUTCMonth(d.getUTCMonth() - m);
  d.setUTCDate(d.getUTCDate() - extraDays);
  return d.toISOString().slice(0, 10);
}
// A dose given when the child was `ageMonths` old (+ `plusDays`).
export function at(dob, product, ageMonths, plusDays = 0) {
  const d = new Date(dob + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + ageMonths);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return { product, date: d.toISOString().slice(0, 10) };
}
// A dose given `y` years / `m` months before today.
export function ago(product, y, m = 0) {
  const d = new Date(TODAY + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() - y);
  d.setUTCMonth(d.getUTCMonth() - m);
  return { product, date: d.toISOString().slice(0, 10) };
}
const S = (y, m = 0) => ago('PPSV23', y, m);

function mk(id, group, label, dob, riskIds, pcvDoses = [], ppsv23Doses = [], extra = {}) {
  return { id, group, label, dob, riskIds, pcvDoses, ppsv23Doses, cdc: null, ...extra };
}

// ── INFANTS AND TODDLERS (0-23 months) ───────────────────────────────────
const d2m = dobFor(0, 2), d4m = dobFor(0, 4), d6m = dobFor(0, 6), d7m = dobFor(0, 7);
const d9m = dobFor(0, 9), d11m = dobFor(0, 11), d13m = dobFor(1, 1), d15m = dobFor(1, 3);
const d18m = dobFor(1, 6), d23m = dobFor(1, 11);
export const INFANTS = [
  mk('I01', 'infant', '2 mo, healthy, nothing given', d2m, []),
  mk('I02', 'infant', '4 mo, healthy, 1 dose at 2 mo', d4m, [], [at(d4m, 'PCV20', 2)]),
  mk('I03', 'infant', '6 mo, healthy, 2 doses at 2 and 4 mo', d6m, [], [at(d6m, 'PCV20', 2), at(d6m, 'PCV20', 4)]),
  mk('I04', 'infant', '7 mo, healthy, 3 doses at 2, 4, 6 mo', d7m, [], [at(d7m, 'PCV20', 2), at(d7m, 'PCV20', 4), at(d7m, 'PCV20', 6)]),
  mk('I05', 'infant', '13 mo, healthy, 3 doses in infancy — booster due', d13m, [], [at(d13m, 'PCV20', 2), at(d13m, 'PCV20', 4), at(d13m, 'PCV20', 6)]),
  mk('I06', 'infant', '13 mo, healthy, full 4-dose series — complete', d13m, [], [at(d13m, 'PCV20', 2), at(d13m, 'PCV20', 4), at(d13m, 'PCV20', 6), at(d13m, 'PCV20', 12)]),
  mk('I07', 'infant', '9 mo, healthy, 1 dose at 2 mo (behind)', d9m, [], [at(d9m, 'PCV20', 2)]),
  mk('I08', 'infant', '9 mo, healthy, nothing given (behind)', d9m, []),
  mk('I09', 'infant', '15 mo, healthy, nothing given', d15m, []),
  mk('I10', 'infant', '18 mo, healthy, 1 dose at 14 mo', d18m, [], [at(d18m, 'PCV20', 14)]),
  mk('I11', 'infant', '23 mo, healthy, 2 doses at 2 and 4 mo', d23m, [], [at(d23m, 'PCV20', 2), at(d23m, 'PCV20', 4)]),
  mk('I12', 'infant', '15 mo, asplenia, 3 PCV20 at 28-day gaps (OWNER PATIENT: a dose too soon)', d15m, ['asplenia'], [at(d15m, 'PCV20', 10, 12), at(d15m, 'PCV20', 11, 12), at(d15m, 'PCV20', 12, 12)]),
  mk('I13', 'infant', '11 mo, healthy, PCV7 twice at 2 and 4 mo (PCV7 never counts)', d11m, [], [at(d11m, 'PCV7', 2), at(d11m, 'PCV7', 4)]),
  mk('I14', 'infant', '7 mo, healthy, 2 doses 4 weeks apart (minimum, valid)', d7m, [], [at(d7m, 'PCV20', 2), at(d7m, 'PCV20', 2, 28)]),
];

// ── AT-RISK CHILDREN 24-71 MONTHS ────────────────────────────────────────
const d2y = dobFor(2), d3y = dobFor(3), d4y = dobFor(4), d5y = dobFor(5);
export const CHILDREN = [
  mk('C01', 'child2to5', '2 y, asplenia (immunocompromising), nothing given', d2y, ['asplenia']),
  mk('C02', 'child2to5', '2 y, chronic heart disease (CONTROL for C01), nothing given', d2y, ['chronic_heart']),
  mk('C03', 'child2to5', '4 y, asplenia, 2 PCV13 in infancy', d4y, ['asplenia'], [at(d4y, 'PCV13', 2), at(d4y, 'PCV13', 4)]),
  mk('C04', 'child2to5', '4 y, chronic heart disease (CONTROL for C03), 2 PCV13 in infancy', d4y, ['chronic_heart'], [at(d4y, 'PCV13', 2), at(d4y, 'PCV13', 4)]),
  mk('C05', 'child2to5', '3 y, asplenia, full 4-dose PCV13 series in infancy', d3y, ['asplenia'], [at(d3y, 'PCV13', 2), at(d3y, 'PCV13', 4), at(d3y, 'PCV13', 6), at(d3y, 'PCV13', 12)]),
  mk('C06', 'child2to5', '3 y, asplenia, 4 PCV13 + PPSV23 at 25 mo', d3y, ['asplenia'], [at(d3y, 'PCV13', 2), at(d3y, 'PCV13', 4), at(d3y, 'PCV13', 6), at(d3y, 'PCV13', 12)], [at(d3y, 'PPSV23', 25)]),
  mk('C07', 'child2to5', '5 y, asplenia, 1 PCV20 at 3 y', d5y, ['asplenia'], [at(d5y, 'PCV20', 36)]),
  mk('C08', 'child2to5', '5 y, chronic lung disease (CONTROL for C07), 1 PCV20 at 3 y', d5y, ['chronic_lung'], [at(d5y, 'PCV20', 36)]),
  mk('C09', 'child2to5', '2 y, HIV, nothing given', d2y, ['hiv']),
  mk('C10', 'child2to5', '4 y, CSF leak, nothing given', d4y, ['csf_leak']),
];

// ── AT-RISK CHILDREN AND TEENS 6-18 YEARS ────────────────────────────────
const d6y = dobFor(6), d8y = dobFor(8), d12y = dobFor(12), d15y = dobFor(15), d18y = dobFor(18);
export const TEENS = [
  mk('T01', 'child6to18', '8 y, asplenia, nothing given', d8y, ['asplenia']),
  mk('T02', 'child6to18', '8 y, chronic heart disease (CONTROL for T01), nothing given', d8y, ['chronic_heart']),
  mk('T03', 'child6to18', '8 y, asplenia, full PCV13 series in infancy', d8y, ['asplenia'], [at(d8y, 'PCV13', 2), at(d8y, 'PCV13', 4), at(d8y, 'PCV13', 6), at(d8y, 'PCV13', 12)]),
  mk('T04', 'child6to18', '8 y, asplenia, PCV13 series + PPSV23 one year ago', d8y, ['asplenia'], [at(d8y, 'PCV13', 2), at(d8y, 'PCV13', 4), at(d8y, 'PCV13', 6), at(d8y, 'PCV13', 12)], [S(1)]),
  mk('T05', 'child6to18', '8 y, chronic heart disease (CONTROL for T04), PCV13 series + PPSV23', d8y, ['chronic_heart'], [at(d8y, 'PCV13', 2), at(d8y, 'PCV13', 4), at(d8y, 'PCV13', 6), at(d8y, 'PCV13', 12)], [S(1)]),
  mk('T06', 'child6to18', '18 y, cochlear implant, PCV13 at 8 y + PPSV23 at 13 y (the p2016 at/after-6 patient)', d18y, ['cochlear_implant'], [at(d18y, 'PCV13', 96)], [at(d18y, 'PPSV23', 156)]),
  mk('T07', 'child6to18', '12 y, asplenia, 1 PCV20 at 10 y', d12y, ['asplenia'], [at(d12y, 'PCV20', 120)]),
  mk('T08', 'child6to18', '12 y, chronic lung disease (CONTROL for T07), 1 PCV20 at 10 y', d12y, ['chronic_lung'], [at(d12y, 'PCV20', 120)]),
  mk('T09', 'child6to18', '15 y, HIV, PPSV23 only at 13 y', d15y, ['hiv'], [], [at(d15y, 'PPSV23', 156)]),
  mk('T10', 'child6to18', '6 y, asplenia, PCV20 at 5 y + PPSV23 8 weeks later (the FINDING K exception patient)', d6y, ['asplenia'], [at(d6y, 'PCV20', 60)], [at(d6y, 'PPSV23', 60, 56)]),
];

// ── HEALTHY CHILDREN (the "nothing indicated" cards) ─────────────────────
export const HEALTHY = [
  mk('H01', 'healthyChild', '10 y, healthy, nothing given', dobFor(10), []),
  mk('H02', 'healthyChild', '5 y, healthy, full PCV13 series in infancy', d5y, [], [at(d5y, 'PCV13', 2), at(d5y, 'PCV13', 4), at(d5y, 'PCV13', 6), at(d5y, 'PCV13', 12)]),
  mk('H03', 'healthyChild', '3 y, healthy, nothing given', d3y, []),
];

// ── ADULTS 19-49 ─────────────────────────────────────────────────────────
const a25 = dobFor(25), a30 = dobFor(30), a40 = dobFor(40), a45 = dobFor(45);
export const ADULTS19 = [
  mk('A01', 'adult19to49', '30 y, no risk factors, nothing given', a30, []),
  mk('A02', 'adult19to49', '30 y, HIV (immunocompromising), nothing given', a30, ['hiv']),
  mk('A03', 'adult19to49', '30 y, diabetes (chronic only) (CONTROL for A02), nothing given', a30, ['diabetes']),
  mk('A04', 'adult19to49', '30 y, cochlear implant, nothing given', a30, ['cochlear_implant']),
  mk('A05', 'adult19to49', '30 y, CSF leak, nothing given', a30, ['csf_leak']),
  mk('A06', 'adult19to49', '45 y, current smoker (chronic only), nothing given', a45, ['smoking']),
  mk('A07', 'adult19to49', '40 y, HIV, PCV15 two months ago', a40, ['hiv'], [ago('PCV15', 0, 2)]),
  mk('A08', 'adult19to49', '40 y, HIV, PCV13 five years ago', a40, ['hiv'], [ago('PCV13', 5)]),
  mk('A09', 'adult19to49', '40 y, HIV, PPSV23 five years ago, no conjugate', a40, ['hiv'], [], [S(5)]),
  mk('A10', 'adult19to49', '40 y, HIV, PCV13 ten years ago + ONE PPSV23 six years ago', a40, ['hiv'], [ago('PCV13', 10)], [S(6)]),
  mk('A11', 'adult19to49', '40 y, HIV, PCV13 ten years ago + TWO PPSV23 (8 y and 2 y ago)', a40, ['hiv'], [ago('PCV13', 10)], [S(8), S(2)]),
  mk('A12', 'adult19to49', '45 y, chronic lung disease, PCV13 ten years ago + PPSV23 six years ago', a45, ['chronic_lung'], [ago('PCV13', 10)], [S(6)]),
  mk('A13', 'adult19to49', '25 y, asplenia, PCV20 two years ago', a25, ['asplenia'], [ago('PCV20', 2)]),
];

// ── ADULTS 50 AND OVER ───────────────────────────────────────────────────
const a55 = dobFor(55), a70 = dobFor(70);
export const ADULTS50 = [
  mk('B01', 'adult50plus', '55 y, no risk factors, nothing given', a55, []),
  mk('B02', 'adult50plus', '55 y, chronic lung disease, nothing given', a55, ['chronic_lung']),
  mk('B03', 'adult50plus', '70 y, no risk factors, nothing given', a70, []),
  mk('B04', 'adult50plus', '55 y, PCV13 five years ago only', a55, [], [ago('PCV13', 5)]),
  mk('B05', 'adult50plus', '55 y, PCV15 two months ago only', a55, [], [ago('PCV15', 0, 2)]),
  mk('B06', 'adult50plus', '55 y, PCV20 two years ago only', a55, [], [ago('PCV20', 2)]),
  mk('B07', 'adult50plus', '55 y, PCV21 one year ago only', a55, [], [ago('PCV21', 1)]),
  mk('B08', 'adult50plus', '55 y, PPSV23 five years ago only', a55, [], [], [S(5)]),
  mk('B09', 'adult50plus', '70 y, PCV13 at 60 + PPSV23 at 61 (PPSV23 BEFORE 65)', a70, [], [at(a70, 'PCV13', 720)], [at(a70, 'PPSV23', 733)]),
  mk('B10', 'adult50plus', '70 y, PCV13 at 60 + PPSV23 at 66 (PPSV23 AT/AFTER 65)', a70, [], [at(a70, 'PCV13', 720)], [at(a70, 'PPSV23', 792)]),
];

// ── PATIENTS PNEUMORECS CANNOT BE ASKED ──────────────────────────────────
// Each pairs with a `countsAs` id: the patient PneumoRecs sees when the
// same history is reduced to "how many doses", which is all it captures.
export const LIMITS = [
  mk('X01', 'limit', '40 y, HIV + stem-cell transplant ticked (PneumoVax hard stop)', a40, ['hiv', 'hct_cart_bcell_exclude'], [], [], { countsAs: 'A02' }),
  mk('X02', 'limit', '15 mo, asplenia, PCV20 dated next year (record problem)', d15m, ['asplenia'], [{ product: 'PCV20', date: '2027-03-01' }], [], { countsAs: 'C01-ish' }),
  mk('X03', 'limit', '30 y, HIV, PCV15 three weeks ago (too soon for the PPSV23)', a30, ['hiv'], [ago('PCV15', 0, 0)], [], { countsAs: 'A07' }),
  mk('X04', 'limit', '5 y, asplenia, two PCV20 given two weeks apart', d5y, ['asplenia'], [at(d5y, 'PCV20', 48), at(d5y, 'PCV20', 48, 14)], [], { countsAs: 'C07' }),
  mk('X05', 'limit', '60 y, PCV13 then PPSV23 three months later', dobFor(60), [], [ago('PCV13', 1)], [ago('PPSV23', 0, 9)], { countsAs: 'B04' }),
  mk('X06', 'limit', '2 y, healthy, PCV20 dated before the child was born', d2y, [], [{ product: 'PCV20', date: '2023-01-01' }], [], { countsAs: 'H03' }),
];

export const ALL = [...INFANTS, ...CHILDREN, ...TEENS, ...HEALTHY, ...ADULTS19, ...ADULTS50, ...LIMITS];
