// HSCT comparison cases. node scratch/hsctCases.mjs
// PneumoVax HSCT = advisory (peds <19y: p2016 Table 5; adult ≥19y: Fred Hutch LTFU).
// These intentionally diverge from ACIP/PneumoRecs — this prints PneumoVax's advisory
// + any standard recs so we can diff against whatever PneumoRecs returns.
import { recommend } from '../src/logic/recommend.js';
const TODAY = '2026-06-07';
const Y = (y) => y * 12;

const CASES = [
  { id: 'H1', label: '5y child, HSCT, no prior pneumo', ageMonths: Y(5), riskIds: ['hsct'], pcvDoses: [], ppsv23Doses: [] },
  { id: 'H2', label: '40y adult, HSCT, no prior pneumo', ageMonths: Y(40), riskIds: ['hsct'], pcvDoses: [], ppsv23Doses: [] },
  { id: 'H3', label: '40y adult, HSCT, WITH prior PCV20 (history should be nullified)', ageMonths: Y(40), riskIds: ['hsct'], pcvDoses: [{ product: 'PCV20', date: '2020-01-01' }], ppsv23Doses: [] },
  { id: 'H4', label: '12y child, HSCT + asplenia (IC co-condition)', ageMonths: Y(12), riskIds: ['hsct', 'asplenia'], pcvDoses: [], ppsv23Doses: [] },
];

for (const c of CASES) {
  const out = recommend({ ageMonths: c.ageMonths, riskIds: c.riskIds, pcvDoses: c.pcvDoses, ppsv23Doses: c.ppsv23Doses, today: TODAY });
  console.log(`\n${c.id}  ${c.label}`);
  if (out.hsct) {
    console.log(`   HSCT advisory: ${out.hsct.title}`);
    for (const r of out.hsct.recs) console.log(`     • ${r.doseLabel}`);
    console.log(`     coordinate: ${out.hsct.coordinateFlag.slice(0, 80)}...`);
  } else {
    console.log('   (no HSCT advisory block)');
  }
  console.log(`   standard recs: ${out.recs.map((r) => `${r.vaccine}:${r.status}`).join(', ')}`);
}
