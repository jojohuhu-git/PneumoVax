// Adult comparison case matrix: PneumoVax vs CDC PneumoRecs VaxAdvisor.
// NOT part of the app build. Run: node scratch/adultCases.mjs
// Fixed `today` for determinism. Dates are expressed as "years ago" helpers.
import { recommend } from '../src/logic/recommend.js';

const TODAY = '2026-06-07';
function yearsAgo(y) { const d = new Date(TODAY); d.setFullYear(d.getFullYear() - y); return d.toISOString().slice(0, 10); }
function pcv(product, ageYearsAgo) { return { product, date: ageYearsAgo == null ? null : yearsAgo(ageYearsAgo) }; }
function ppsv(ageYearsAgo) { return { product: 'PPSV23', date: ageYearsAgo == null ? null : yearsAgo(ageYearsAgo) }; }
const Y = (y) => y * 12;

// Each case: clinically-meaningful adult scenario. `notes` flags where a
// divergence from PneumoRecs is PREDICTED (proxy/heuristic), so we triage fast.
export const ADULT_CASES = [
  { id: 'A01', label: '30y, no risk, no history', ageMonths: Y(30), riskIds: [], pcvDoses: [], ppsv23Doses: [] },
  { id: 'A02', label: '30y, diabetes (nonIC), no history', ageMonths: Y(30), riskIds: ['diabetes'], pcvDoses: [], ppsv23Doses: [] },
  { id: 'A03', label: '30y, HIV (IC), no history', ageMonths: Y(30), riskIds: ['hiv'], pcvDoses: [], ppsv23Doses: [] },
  { id: 'A04', label: '30y, cochlear implant (special→8wk), no history', ageMonths: Y(30), riskIds: ['cochlear_implant'], pcvDoses: [], ppsv23Doses: [] },
  { id: 'A05', label: '55y, no risk, no history', ageMonths: Y(55), riskIds: [], pcvDoses: [], ppsv23Doses: [] },
  { id: 'A06', label: '55y, COPD (nonIC), no history', ageMonths: Y(55), riskIds: ['chronic_lung'], pcvDoses: [], ppsv23Doses: [] },
  { id: 'A07', label: '70y, no risk, no history', ageMonths: Y(70), riskIds: [], pcvDoses: [], ppsv23Doses: [] },

  { id: 'A08', label: '60y, PCV20 in history', ageMonths: Y(60), riskIds: [], pcvDoses: [pcv('PCV20', 1)], ppsv23Doses: [] },
  { id: 'A09', label: '60y, PCV21 in history', ageMonths: Y(60), riskIds: [], pcvDoses: [pcv('PCV21', 1)], ppsv23Doses: [] },
  { id: 'A10', label: '60y, PCV15 only (no PPSV23)', ageMonths: Y(60), riskIds: [], pcvDoses: [pcv('PCV15', 1)], ppsv23Doses: [] },
  { id: 'A11', label: '40y HIV, PCV15 only (8wk interval)', ageMonths: Y(40), riskIds: ['hiv'], pcvDoses: [pcv('PCV15', 1)], ppsv23Doses: [] },
  { id: 'A12', label: '60y, PCV15 + PPSV23 (complete)', ageMonths: Y(60), riskIds: [], pcvDoses: [pcv('PCV15', 2)], ppsv23Doses: [ppsv(1)] },
  { id: 'A13', label: '60y, PPSV23 only', ageMonths: Y(60), riskIds: [], pcvDoses: [], ppsv23Doses: [ppsv(2)] },
  { id: 'A14', label: '60y, PCV13 only', ageMonths: Y(60), riskIds: [], pcvDoses: [pcv('PCV13', 3)], ppsv23Doses: [] },

  // PCV13 + PPSV23 — the current-age PROXY branch (HANDOFF #2). PneumoRecs knows
  // the PPSV23 date; PneumoVax keys off CURRENT age ≥65. Predicted divergence:
  { id: 'A15', label: '70y, PCV13 + PPSV23 given at 60 (<65)', ageMonths: Y(70), riskIds: [], pcvDoses: [pcv('PCV13', 12)], ppsv23Doses: [ppsv(10)], predict: 'PROXY: PneumoVax→shared-decision (age≥65); PneumoRecs likely→recommended ≥5y (PPSV23 was at 60)' },
  { id: 'A16', label: '67y, PCV13 + PPSV23 given at 66 (≥65)', ageMonths: Y(67), riskIds: [], pcvDoses: [pcv('PCV13', 7)], ppsv23Doses: [ppsv(1)], predict: 'Both→shared-decision (match expected)' },
  { id: 'A17', label: '55y, PCV13 + PPSV23 (both <65)', ageMonths: Y(55), riskIds: [], pcvDoses: [pcv('PCV13', 6)], ppsv23Doses: [ppsv(5)], predict: 'PneumoVax→due ≥5y; check PneumoRecs' },
  { id: 'A18', label: '45y diabetes, PCV13 + PPSV23 (chronic <50)', ageMonths: Y(45), riskIds: ['diabetes'], pcvDoses: [pcv('PCV13', 6)], ppsv23Doses: [ppsv(5)], predict: 'PneumoVax→no dose now/review at 50' },

  // Unknown-product PCV + PPSV23 (engine bug-fix branch, session 2 #2):
  { id: 'A19', label: '60y, unknown-product PCV + PPSV23', ageMonths: Y(60), riskIds: [], pcvDoses: [{ product: null, date: yearsAgo(3) }], ppsv23Doses: [ppsv(2)], predict: 'PneumoVax→PCV ≥1y after PPSV23' },
  // PCV7-only (must be treated as naive):
  { id: 'A20', label: '60y, PCV7 only (must ignore)', ageMonths: Y(60), riskIds: [], pcvDoses: [pcv('PCV7', 15)], ppsv23Doses: [], predict: 'PneumoVax→treat as naive (start PCV)' },
];

function summarize(recs) {
  return recs.map((r) => `${r.vaccine}:${r.status} — ${r.doseLabel}${r.minIntervalDays ? ` [minInt ${r.minIntervalDays}d]` : ''}`).join(' || ');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const c of ADULT_CASES) {
    const out = recommend({ ageMonths: c.ageMonths, riskIds: c.riskIds, pcvDoses: c.pcvDoses, ppsv23Doses: c.ppsv23Doses, today: TODAY });
    console.log(`\n${c.id}  ${c.label}`);
    console.log(`   PneumoVax: ${summarize(out.recs)}`);
    if (c.predict) console.log(`   ⚠ predict: ${c.predict}`);
  }
}
