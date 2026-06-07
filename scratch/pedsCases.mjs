// Peds comparison case matrix: PneumoVax vs CDC PneumoRecs VaxAdvisor.
// node scratch/pedsCases.mjs  — fixed `today` for determinism.
// Peds doses are built from DOB + age-at-dose so PneumoRecs (which captures the
// birthdate + dose dates) gets the same history we feed PneumoVax.
import { recommend } from '../src/logic/recommend.js';

const TODAY = '2026-06-07';
function dobForAgeMonths(am) { const d = new Date(TODAY); d.setMonth(d.getMonth() - am); return d.toISOString().slice(0, 10); }
function doseAtAge(dob, product, ageMonthsAtDose) { const d = new Date(dob); d.setMonth(d.getMonth() + ageMonthsAtDose); return { product, date: d.toISOString().slice(0, 10) }; }
const Y = (y) => y * 12;

// Build a case. `pcvAtAges` = [[product, ageMonthsAtDose], ...]; `ppsvAtAges` = [ageMonths].
function mk(id, label, ageMonths, riskIds, pcvAtAges = [], ppsvAtAges = [], predict) {
  const dob = dobForAgeMonths(ageMonths);
  return {
    id, label, ageMonths, riskIds, dob,
    pcvDoses: pcvAtAges.map(([p, a]) => doseAtAge(dob, p, a)),
    ppsv23Doses: ppsvAtAges.map((a) => ({ product: 'PPSV23', ...doseAtAge(dob, 'PPSV23', a) })),
    predict,
  };
}

export const PEDS_CASES = [
  // ── Infant routine/catch-up (pcvInfant) ──────────────────────────────
  mk('P01', '2mo, 0 prior', 2, []),
  mk('P02', '7mo, 0 prior', 7, []),
  mk('P03', '13mo, 0 prior', 13, []),
  mk('P04', '5mo, 1 prior (PCV15 at 2mo)', 5, [], [['PCV15', 2]]),
  mk('P05', '15mo, 3 prior (2/4/6mo)', 15, [], [['PCV15', 2], ['PCV15', 4], ['PCV15', 6]]),
  mk('P06', '16mo, full 4-dose series (2/4/6/12mo)', 16, [], [['PCV15', 2], ['PCV15', 4], ['PCV15', 6], ['PCV15', 12]]),

  // ── Healthy 24–59mo / 5–18y (pcvHealthyChild) ────────────────────────
  mk('P07', '36mo healthy, 0 prior', 36, []),
  mk('P08', '36mo healthy, full 4-dose series', 36, [], [['PCV15', 2], ['PCV15', 4], ['PCV15', 6], ['PCV15', 12]]),
  mk('P09', '36mo healthy, series incl. PCV20', 36, [], [['PCV20', 12]]),
  mk('P10', '10y healthy, 0 prior', Y(10), [], [], [], 'PneumoVax→not-indicated (healthy 5–18y not caught up)'),

  // ── At-risk 24mo–18y (pcvRiskChild — heuristic-heavy) ─────────────────
  mk('P11', '30mo asplenia (IC), 0 prior', 30, ['asplenia'], [], [], 'rows 1/2: 2 doses ≥8wk apart'),
  mk('P12', '30mo asplenia, 3 PCV all <12mo', 30, ['asplenia'], [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]], [], 'row 2: 1 dose'),
  mk('P13', '8y asplenia (IC), 0 prior PCV', Y(8), ['asplenia'], [], [], 'row 7: A) PCV20 / B) PCV15→PPSV23'),
  mk('P14', '8y chronic heart (nonIC), 0 prior PCV', Y(8), ['chronic_heart'], [], [], 'row 6: A) PCV20 / B) PCV15→PPSV23'),
  mk('P15', '8y asplenia (IC), 3 PCV13 before 6y, no PPSV23', Y(8), ['asplenia'], [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]], [], 'row 5: A) PCV20 / B) PPSV23 then ≥5y'),
  mk('P16', '8y chronic heart (nonIC), 3 PCV13 before 6y, no PPSV23', Y(8), ['chronic_heart'], [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]], [], 'row 4: A) PCV20 / B) PPSV23'),
  mk('P17', '8y asplenia, series incl. PCV20', Y(8), ['asplenia'], [['PCV20', 12]], [], 'row 3: complete'),
  mk('P18', '10y asplenia (IC), 1 PCV13 at age 7 (after 6y)', Y(10), ['asplenia'], [['PCV13', Y(7)]], [], 'HEURISTIC: count 1 → "PCV13 only ≥6y" rows 8/9'),
  mk('P19', '10y chronic heart, PCV13 at 7y + PPSV23 at 8y', Y(10), ['chronic_heart'], [['PCV13', Y(7)]], [Y(8)], 'HEURISTIC: PPSV23 already given — does engine still emit Option B PPSV23?'),
  mk('P20', '4y asplenia, 2 PCV13 in infancy (incomplete by 24mo)', Y(4), ['asplenia'], [['PCV13', 2], ['PCV13', 4]], [], 'rows 1/2: incomplete → 2-dose catch-up (owes 1 more)'),
];

function summarize(recs) {
  return recs.map((r) => `${r.vaccine}:${r.status} — ${r.doseLabel}`).join('  ||  ');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const c of PEDS_CASES) {
    const out = recommend({ ageMonths: c.ageMonths, riskIds: c.riskIds, pcvDoses: c.pcvDoses, ppsv23Doses: c.ppsv23Doses, today: TODAY });
    console.log(`\n${c.id}  ${c.label}   (DOB ${c.dob})`);
    console.log(`   PneumoVax: ${summarize(out.recs)}`);
    if (c.predict) console.log(`   ⚠ ${c.predict}`);
  }
}
