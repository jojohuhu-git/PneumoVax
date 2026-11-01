// ─────────────────────────────────────────────────────────────────────────
// pneumoRecsGreyCases.mjs — the 2026-11-01 GREY-ZONE comparison case list.
//
// The 2026-10-25 list (pneumoRecsCases.mjs) covered the families CDC states
// plainly. This one is the histories CDC/ACIP do NOT spell out: doses in the
// wrong order, a PCV15 with no follow-up, childhood doses on an adult, extra
// doses, PCV21 in a child, ages on a boundary, mixed products, adults vaccinated
// under the pre-2024 schedule, more than one risk, and doses too close together.
//
// Every family carries a CHILD and an ADULT member where the shape exists at
// both ages, so the report can ask "is the same grey history handled the same
// way?" — the owner's consistency question.
//
// No PHI. All dates are synthetic, counted from TODAY.
//   node scripts/pneumoRecsGreyCompare.mjs            all
//   node scripts/pneumoRecsGreyCompare.mjs G01 G14    named
// ─────────────────────────────────────────────────────────────────────────
export const TODAY = '2026-11-01';

export function dobFor(y, m = 0, extraDays = 5) {
  const d = new Date(TODAY + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() - y);
  d.setUTCMonth(d.getUTCMonth() - m);
  d.setUTCDate(d.getUTCDate() - extraDays);
  return d.toISOString().slice(0, 10);
}
// A dose given when the patient was `ageMonths` old (+ `plusDays`).
export function at(dob, product, ageMonths, plusDays = 0) {
  const d = new Date(dob + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + ageMonths);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return { product, date: d.toISOString().slice(0, 10) };
}
const Y = (y) => y * 12;
const infant4 = (dob, p = 'PCV13') => [at(dob, p, 2), at(dob, p, 4), at(dob, p, 6), at(dob, p, 12)];

function mk(id, family, who, label, dob, riskIds, pcvDoses = [], ppsv23Doses = []) {
  return { id, family, who, label, dob, riskIds, pcvDoses, ppsv23Doses };
}

const d = {};
for (const [k, y, m] of [['2y', 2, 0], ['3y', 3, 0], ['4y', 4, 0], ['4y11', 4, 11], ['5y', 5, 0], ['5y11', 5, 11],
  ['6y', 6, 0], ['7y', 7, 0], ['8y', 8, 0], ['10y', 10, 0], ['12y', 12, 0], ['16y', 16, 0], ['17y', 17, 0],
  ['18y5', 18, 5], ['18y11', 18, 11], ['19y', 19, 0], ['20y', 20, 0], ['22y', 22, 0], ['25y', 25, 0],
  ['30y', 30, 0], ['35y', 35, 0], ['40y', 40, 0], ['49y11', 49, 11], ['50y', 50, 0], ['52y', 52, 0],
  ['55y', 55, 0], ['60y', 60, 0], ['66y', 66, 0], ['70y', 70, 0], ['72y', 72, 0], ['80y', 80, 0]]) d[k] = dobFor(y, m, k === '18y11' || k === '49y11' || k === '4y11' || k === '5y11' ? 2 : 5);

export const ALL = [
  // ── F1  PPSV23 given BEFORE any conjugate (wrong order) ────────────────
  mk('G01', 'F1 wrong order', 'child', '4 y, asplenia: PPSV23 at 3 y, no PCV ever', d['4y'], ['asplenia'], [], [at(d['4y'], 'PPSV23', 36)]),
  mk('G02', 'F1 wrong order', 'child', '8 y, chronic heart: PPSV23 at 6 y, no PCV ever', d['8y'], ['chronic_heart'], [], [at(d['8y'], 'PPSV23', 72)]),
  mk('G03', 'F1 wrong order', 'child', '10 y, HIV: PPSV23 at 7 y, then PCV15 at 8 y', d['10y'], ['hiv'], [at(d['10y'], 'PCV15', 96)], [at(d['10y'], 'PPSV23', 84)]),
  mk('G04', 'F1 wrong order', 'adult', '30 y, diabetes: PPSV23 at 28, then PCV15 at 29', d['30y'], ['diabetes'], [at(d['30y'], 'PCV15', Y(29))], [at(d['30y'], 'PPSV23', Y(28))]),
  mk('G05', 'F1 wrong order', 'adult', '55 y, no risk: PPSV23 at 52, then PCV15 at 53', d['55y'], [], [at(d['55y'], 'PCV15', Y(53))], [at(d['55y'], 'PPSV23', Y(52))]),
  mk('G06', 'F1 wrong order', 'adult', '40 y, HIV: PPSV23 at 38, then PCV15 at 39', d['40y'], ['hiv'], [at(d['40y'], 'PCV15', Y(39))], [at(d['40y'], 'PPSV23', Y(38))]),

  // ── F2  PCV15 given, the PPSV23 follow-up never happened ───────────────
  mk('G07', 'F2 PCV15 no follow-up', 'child', '7 y, chronic lung: PCV15 at 6 y 2 mo, no PPSV23', d['7y'], ['chronic_lung'], [at(d['7y'], 'PCV15', 74)]),
  mk('G08', 'F2 PCV15 no follow-up', 'child', '12 y, asplenia: PCV15 at 7 y, no PPSV23', d['12y'], ['asplenia'], [at(d['12y'], 'PCV15', 84)]),
  mk('G09', 'F2 PCV15 no follow-up', 'child', '4 y, chronic heart: 4 PCV15 in infancy, no PPSV23', d['4y'], ['chronic_heart'], infant4(d['4y'], 'PCV15')),
  mk('G10', 'F2 PCV15 no follow-up', 'adult', '35 y, CSF leak: PCV15 3 years ago, no PPSV23', d['35y'], ['csf_leak'], [at(d['35y'], 'PCV15', Y(32))]),
  mk('G11', 'F2 PCV15 no follow-up', 'adult', '60 y, no risk: PCV15 at 52, no PPSV23', d['60y'], [], [at(d['60y'], 'PCV15', Y(52))]),
  mk('G12', 'F2 PCV15 no follow-up', 'adult', '60 y, no risk: PCV15 at 59 (1 year ago), no PPSV23', d['60y'], [], [at(d['60y'], 'PCV15', Y(59))]),

  // ── F3  Childhood doses only, now an adult ────────────────────────────
  mk('G13', 'F3 childhood doses, now adult', 'adult', '19 y, asplenia: 4 PCV13 in infancy + PPSV23 at 3 y and 8 y', d['19y'], ['asplenia'], infant4(d['19y']), [at(d['19y'], 'PPSV23', 36), at(d['19y'], 'PPSV23', 96)]),
  mk('G14', 'F3 childhood doses, now adult', 'adult', '20 y, no risk: 4 PCV20 in infancy', d['20y'], [], infant4(d['20y'], 'PCV20')),
  mk('G15', 'F3 childhood doses, now adult', 'adult', '22 y, diabetes: 4 PCV13 in infancy, nothing since', d['22y'], ['diabetes'], infant4(d['22y'])),
  mk('G16', 'F3 childhood doses, now adult', 'adult', '25 y, HIV: 4 PCV15 in infancy + PPSV23 at 2 y', d['25y'], ['hiv'], infant4(d['25y'], 'PCV15'), [at(d['25y'], 'PPSV23', 26)]),
  mk('G17', 'F3 childhood doses, now adult', 'adult', '19 y, cochlear implant: PCV20 at 10 y', d['19y'], ['cochlear_implant'], [at(d['19y'], 'PCV20', 120)]),
  mk('G18', 'F3 childhood doses, now adult', 'adult', '19 y, chronic lung: 4 PCV13 + PPSV23 at 4 y', d['19y'], ['chronic_lung'], infant4(d['19y']), [at(d['19y'], 'PPSV23', 48)]),

  // ── F4  An extra / unnecessary dose already given ─────────────────────
  mk('G19', 'F4 extra dose', 'child', '3 y, healthy: 4 PCV20 + a PPSV23 at 2 y 6 mo', d['3y'], [], infant4(d['3y'], 'PCV20'), [at(d['3y'], 'PPSV23', 30)]),
  mk('G20', 'F4 extra dose', 'adult', '30 y, no risk: a PPSV23 at 28', d['30y'], [], [], [at(d['30y'], 'PPSV23', Y(28))]),
  mk('G21', 'F4 extra dose', 'child', '8 y, chronic heart: PCV20 at 6 y, then PPSV23 at 7 y', d['8y'], ['chronic_heart'], [at(d['8y'], 'PCV20', 72)], [at(d['8y'], 'PPSV23', 84)]),
  mk('G22', 'F4 extra dose', 'adult', '55 y, no risk: PCV20 at 51, then PPSV23 at 52', d['55y'], [], [at(d['55y'], 'PCV20', Y(51))], [at(d['55y'], 'PPSV23', Y(52))]),
  mk('G23', 'F4 extra dose', 'child', '2 y, healthy: 4 PCV13 then a PCV20 at 20 mo', d['2y'], [], [...infant4(d['2y']), at(d['2y'], 'PCV20', 20)]),
  mk('G24', 'F4 extra dose', 'adult', '60 y, no risk: PCV21 at 58, then PCV20 at 59', d['60y'], [], [at(d['60y'], 'PCV21', Y(58)), at(d['60y'], 'PCV20', Y(59))]),

  // ── F5  PCV21 given to a child (licensed 18+) ─────────────────────────
  mk('G25', 'F5 PCV21 in a child', 'child', '10 y, asplenia: PCV21 at 9 y', d['10y'], ['asplenia'], [at(d['10y'], 'PCV21', 108)]),
  mk('G26', 'F5 PCV21 in a child', 'child', '17 y, chronic lung: PCV21 at 16 y 8 mo', d['17y'], ['chronic_lung'], [at(d['17y'], 'PCV21', 200)]),
  mk('G27', 'F5 PCV21 in a child', 'child', '18 y 5 mo, diabetes: PCV21 at 18 y 1 mo', d['18y5'], ['diabetes'], [at(d['18y5'], 'PCV21', 217)]),
  mk('G28', 'F5 PCV21 in a child', 'child', '18 y 5 mo, HIV: nothing given (is PCV21 offered?)', d['18y5'], ['hiv']),

  // ── F6  Ages on a boundary ────────────────────────────────────────────
  mk('G29', 'F6 boundary age', 'child', '18 y 11 mo, HIV: nothing given', d['18y11'], ['hiv']),
  mk('G30', 'F6 boundary age', 'adult', '19 y 0 mo, HIV: nothing given (CONTROL for G29)', dobFor(19, 0, 2), ['hiv']),
  mk('G31', 'F6 boundary age', 'adult', '49 y 11 mo, HIV: PCV15 3 weeks ago', d['49y11'], ['hiv'], [{ product: 'PCV15', date: '2026-10-11' }]),
  mk('G32', 'F6 boundary age', 'adult', '50 y, HIV: PCV15 at 49 y 10 mo (3 months ago)', d['50y'], ['hiv'], [at(d['50y'], 'PCV15', 598)]),
  mk('G33', 'F6 boundary age', 'child', '4 y 11 mo, healthy: 1 PCV at 2 mo', d['4y11'], [], [at(d['4y11'], 'PCV20', 2)]),
  mk('G34', 'F6 boundary age', 'child', '5 y 0 mo, healthy: 1 PCV at 2 mo (CONTROL for G33)', dobFor(5, 0, 2), [], [at(dobFor(5, 0, 2), 'PCV20', 2)]),
  mk('G35', 'F6 boundary age', 'child', '5 y 11 mo, chronic heart: 4 PCV13 in infancy', d['5y11'], ['chronic_heart'], infant4(d['5y11'])),
  mk('G36', 'F6 boundary age', 'child', '6 y 0 mo, chronic heart: 4 PCV13 in infancy (CONTROL for G35)', dobFor(6, 0, 2), ['chronic_heart'], infant4(dobFor(6, 0, 2))),

  // ── F7  Mixed products / risk found after the baby series ─────────────
  mk('G37', 'F7 mixed products', 'child', '3 y, asplenia (new): PCV13, PCV13, PCV15, PCV20 at 12 mo', d['3y'], ['asplenia'], [at(d['3y'], 'PCV13', 2), at(d['3y'], 'PCV13', 4), at(d['3y'], 'PCV15', 6), at(d['3y'], 'PCV20', 12)]),
  mk('G38', 'F7 mixed products', 'child', '4 y, chronic heart: PCV13 ×3 then PCV15 at 12 mo', d['4y'], ['chronic_heart'], [at(d['4y'], 'PCV13', 2), at(d['4y'], 'PCV13', 4), at(d['4y'], 'PCV13', 6), at(d['4y'], 'PCV15', 12)]),
  mk('G39', 'F7 mixed products', 'child', '4 y, HIV: 4 PCV15 in infancy', d['4y'], ['hiv'], infant4(d['4y'], 'PCV15')),
  mk('G40', 'F7 mixed products', 'child', '2 y, asplenia: 4 PCV20 in infancy', d['2y'], ['asplenia'], infant4(d['2y'], 'PCV20')),
  mk('G41', 'F7 mixed products', 'adult', '40 y, HIV: PCV13 at 35, then PCV15 at 38', d['40y'], ['hiv'], [at(d['40y'], 'PCV13', Y(35)), at(d['40y'], 'PCV15', Y(38))]),
  mk('G42', 'F7 mixed products', 'adult', '55 y, diabetes: PCV15 at 50, then PCV20 at 54 (no PPSV23)', d['55y'], ['diabetes'], [at(d['55y'], 'PCV15', Y(50)), at(d['55y'], 'PCV20', Y(54))]),

  // ── F8  Adults vaccinated under the pre-2024 schedule ─────────────────
  mk('G43', 'F8 old-schedule adult', 'adult', '66 y, no risk: PPSV23 at 60 only', d['66y'], [], [], [at(d['66y'], 'PPSV23', Y(60))]),
  mk('G44', 'F8 old-schedule adult', 'adult', '70 y, no risk: PCV13 at 66, PPSV23 at 67', d['70y'], [], [at(d['70y'], 'PCV13', Y(66))], [at(d['70y'], 'PPSV23', Y(67))]),
  mk('G45', 'F8 old-schedule adult', 'adult', '72 y, no risk: PPSV23 at 62 and again at 67', d['72y'], [], [], [at(d['72y'], 'PPSV23', Y(62)), at(d['72y'], 'PPSV23', Y(67))]),
  mk('G46', 'F8 old-schedule adult', 'adult', '55 y, HIV: PCV13 at 45, PPSV23 at 46 and 51', d['55y'], ['hiv'], [at(d['55y'], 'PCV13', Y(45))], [at(d['55y'], 'PPSV23', Y(46)), at(d['55y'], 'PPSV23', Y(51))]),
  mk('G47', 'F8 old-schedule adult', 'adult', '52 y, chronic lung: PCV13 at 45, PPSV23 at 46', d['52y'], ['chronic_lung'], [at(d['52y'], 'PCV13', Y(45))], [at(d['52y'], 'PPSV23', Y(46))]),
  mk('G48', 'F8 old-schedule adult', 'adult', '80 y, no risk: PCV13 at 70 only', d['80y'], [], [at(d['80y'], 'PCV13', Y(70))]),
  mk('G49', 'F8 old-schedule adult', 'adult', '66 y, no risk: PCV13 at 64, PPSV23 at 65', d['66y'], [], [at(d['66y'], 'PCV13', Y(64))], [at(d['66y'], 'PPSV23', Y(65))]),

  // ── F9  More than one risk condition ──────────────────────────────────
  mk('G50', 'F9 several risks', 'adult', '40 y, diabetes + cochlear implant: nothing given', d['40y'], ['diabetes', 'cochlear_implant']),
  mk('G51', 'F9 several risks', 'child', '10 y, chronic heart + HIV: 4 PCV13 + PPSV23 at 4 y', d['10y'], ['chronic_heart', 'hiv'], infant4(d['10y']), [at(d['10y'], 'PPSV23', 48)]),
  mk('G52', 'F9 several risks', 'adult', '30 y, smoker + HIV: PCV15 at 29 + PPSV23 at 29 y 3 mo', d['30y'], ['smoking', 'hiv'], [at(d['30y'], 'PCV15', Y(29))], [at(d['30y'], 'PPSV23', Y(29) + 3)]),

  // ── F10 Doses given too close together ────────────────────────────────
  mk('G53', 'F10 too close', 'adult', '55 y, no risk: PCV20 then PCV20 again 2 months later', d['55y'], [], [at(d['55y'], 'PCV20', Y(54)), at(d['55y'], 'PCV20', Y(54) + 2)]),
  mk('G54', 'F10 too close', 'child', '3 y, chronic lung: 4 PCV13, PCV20 at 26 mo, PPSV23 at 27 mo', d['3y'], ['chronic_lung'], [...infant4(d['3y']), at(d['3y'], 'PCV20', 26)], [at(d['3y'], 'PPSV23', 27)]),
  mk('G55', 'F10 too close', 'adult', '60 y, chronic lung: PCV15, then PPSV23 6 weeks later', d['60y'], ['chronic_lung'], [at(d['60y'], 'PCV15', Y(59))], [at(d['60y'], 'PPSV23', Y(59), 42)]),
  mk('G56', 'F10 too close', 'adult', '30 y, HIV: PCV15, then PPSV23 6 weeks later', d['30y'], ['hiv'], [at(d['30y'], 'PCV15', Y(29))], [at(d['30y'], 'PPSV23', Y(29), 42)]),
  mk('G57', 'F10 too close', 'child', '4 y, chronic lung: 4 PCV13, PCV15 at 3 y, PPSV23 4 weeks later', d['4y'], ['chronic_lung'], [...infant4(d['4y']), at(d['4y'], 'PCV15', 36)], [at(d['4y'], 'PPSV23', 36, 28)]),

  // ── F11 Adult-only risk factors in a teen ─────────────────────────────
  mk('G58', 'F11 adult-only risk in a teen', 'child', '16 y, alcoholism: nothing given', d['16y'], ['alcoholism']),
  mk('G59', 'F11 adult-only risk in a teen', 'child', '17 y, smoker: 4 PCV13 in infancy', d['17y'], ['smoking'], infant4(d['17y'])),
  mk('G60', 'F11 adult-only risk in a teen', 'adult', '25 y, smoker: nothing given (CONTROL for G59)', d['25y'], ['smoking']),

  // ── F12 Immunocompromised, has had PCV20 — what about age 50? ─────────
  mk('G61', 'F12 complete before 50', 'adult', '45 y, HIV: PCV20 at 40', dobFor(45), ['hiv'], [at(dobFor(45), 'PCV20', Y(40))]),
  mk('G62', 'F12 complete before 50', 'adult', '45 y, HIV: PCV15 at 40 + PPSV23 at 40 y 3 mo', dobFor(45), ['hiv'], [at(dobFor(45), 'PCV15', Y(40))], [at(dobFor(45), 'PPSV23', Y(40) + 3)]),
  mk('G63', 'F12 complete before 50', 'child', '12 y, asplenia: PCV20 at 10', d['12y'], ['asplenia'], [at(d['12y'], 'PCV20', 120)]),
];
