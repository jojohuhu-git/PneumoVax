// ─────────────────────────────────────────────────────────────────────────
// pneumoRecsAnswer.mjs — what CDC PneumoRecs VaxAdvisor prints for one of
// our dated patients.
//
// WHERE THE ANSWERS COME FROM. `scripts/pneumorecs/branches.json` holds all
// 175 recommendation branches of the live tool, extracted 2026-10-25 from
// its own scripts (js/local.js, local_childnorisk.js, local_childgroupA.js,
// local_childgroupB.js, local_teen.js, local_adult19_49.js,
// local_over50yr.js): the answer-element ids each branch tests, and the
// recommendation string it writes. Nothing here is recalled or paraphrased.
// `pneumorecs/labels.json` holds each element's question and visible answer,
// scraped per <fieldset> from the live pages with HTML comments removed —
// those pages carry superseded markup inside comments, and reading it is how
// a first pass invented a bug that does not exist.
//
// HOW A PATIENT IS RESOLVED. Every answer option becomes a PREDICATE over
// facts the tool could actually be told (counts of conjugate doses inside
// its age brackets, ever/how-many PPSV23, one risk group, which product).
// A branch applies when every id in it is consistent with the patient. The
// branch list keeps the tool's own if / else-if ORDER, so the first
// consistent branch is the one that fires. Dose DATES are never asked for.
// PCV7 is not a product it names, so a PCV7 dose reads as "no prior dose" —
// which is what PneumoVax does with it too.
//
// VERIFIED: six patients were driven by hand through the live site on
// 2026-10-25, one per page; all six printed the string this file resolves.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BRANCHES = JSON.parse(readFileSync(join(here, 'pneumorecs/branches.json'), 'utf8'));
const META = JSON.parse(readFileSync(join(here, 'pneumorecs/labels.json'), 'utf8'));

const IC = new Set(['asplenia', 'immunodeficiency', 'immunosuppression', 'hiv', 'solid_organ_transplant', 'ckd_advanced', 'hct_cart_bcell_exclude']);
const SPECIAL = new Set(['cochlear_implant', 'csf_leak']);
const COUNTED_PCV = new Set(['PCV13', 'PCV15', 'PCV20', 'PCV21']);

function ageMonthsAt(dob, date) {
  const b = new Date(dob + 'T00:00:00Z'), d = new Date(date + 'T00:00:00Z');
  let m = (d.getUTCFullYear() - b.getUTCFullYear()) * 12 + (d.getUTCMonth() - b.getUTCMonth());
  if (d.getUTCDate() < b.getUTCDate()) m -= 1;
  return m;
}
export function riskGroup(riskIds) {
  if (riskIds.some((r) => IC.has(r))) return 'IC';
  if (riskIds.some((r) => SPECIAL.has(r))) return 'special';
  if (riskIds.length) return 'chronic';
  return 'none';
}
// The tool's own router (checkage.asp), re-measured 2026-10-25. Note its
// edge: it rounds a part-month UP, so a child of 11 months + 1 day is handed
// the 12-23 month rulebook. That is the tool's behaviour, reproduced here on
// purpose so the comparison shows what a user would really be told.
export function routedBand(dob, today) {
  const b = new Date(dob + 'T00:00:00Z'), t = new Date(today + 'T00:00:00Z');
  const m = ageMonthsAt(dob, today) + (t.getUTCDate() !== b.getUTCDate() ? 1 : 0);
  if (m < 7) return 'weeks7-6mo';
  if (m < 12) return 'weeks7mo-11mo';
  if (m < 24) return 'weeks12mo-23mo';
  if (m < 72) return 'child2to5';
  if (m < 228) return 'teen6to18';
  if (m < 600) return 'adult19-49';
  return 'adult50+';
}

function facts(c, today) {
  const pcv = c.pcvDoses.filter((d) => COUNTED_PCV.has(d.product) && d.date);
  const ageAt = (d) => ageMonthsAt(c.dob, d.date);
  const ppsvDated = c.ppsv23Doses.filter((d) => d.date);
  const lastPpsv = ppsvDated.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return {
    band: routedBand(c.dob, today),
    group: riskGroup(c.riskIds),
    nAll: pcv.length,
    n0_7: pcv.filter((d) => ageAt(d) < 7).length,
    n7up: pcv.filter((d) => ageAt(d) >= 7).length,
    n0_12: pcv.filter((d) => ageAt(d) < 12).length,
    n12_24: pcv.filter((d) => ageAt(d) >= 12 && ageAt(d) < 24).length,
    n24_72: pcv.filter((d) => ageAt(d) >= 24 && ageAt(d) < 72).length,
    n24up: pcv.filter((d) => ageAt(d) >= 24).length,
    allBefore72: pcv.length > 0 && pcv.every((d) => ageAt(d) < 72),
    ppsv: ppsvDated.length,
    pcv13: c.pcvDoses.some((d) => d.product === 'PCV13' && d.date),
    newConj: pcv.find((d) => ['PCV15', 'PCV20', 'PCV21'].includes(d.product)) || null,
    ppsvAt65plus: lastPpsv ? ageMonthsAt(c.dob, lastPpsv.date) >= 780 : false,
  };
}

// Turn an answer option into a test over those facts. Returns null when the
// option is one this comparison cannot express, so it is reported, not guessed.
function predicate(id, f) {
  const q = (META.question[id] || '').toLowerCase();
  const a = (META.label[id] || '').toLowerCase();
  const num = /^(\d+)/.test(a) ? Number(a.match(/^(\d+)/)[1]) : null;
  const orMore = /or more|1 or more/.test(a);
  const cnt = (v) => (orMore ? v >= num : num === 3 && /before age 12|before age 7/.test(q) ? v >= 3 : v === num);
  const yes = /^yes/.test(a), no = /^(no|none)/.test(a);

  if (/risk condition|risk factor/.test(q)) {
    if (/immunocompromising/.test(a)) return f.group === 'IC';
    if (/csf leak or cochlear/.test(a)) return f.group === 'special';
    if (/chronic/.test(a)) return f.group === 'chronic';
    if (/no risk|none of the below|^no$/.test(a)) return f.group === 'none';
    if (/yes/.test(a)) return f.group !== 'none';
    return null;
  }
  if (/ever received pcv15, pcv20, or pcv21/.test(q)) return yes ? !!f.newConj : !f.newConj;
  if (/did the patient receive pcv15, pcv20, or pcv21/.test(q)) return /pcv15/.test(a) ? f.newConj && f.newConj.product === 'PCV15' : f.newConj && f.newConj.product !== 'PCV15';
  if (/ever received pcv13\?/.test(q)) return yes ? f.pcv13 : !f.pcv13;
  if (/ever received pcv13, pcv15,? or pcv20/.test(q)) {
    if (num !== null || /^yes, \d/.test(a)) { const k = Number(a.match(/(\d)/)[1]); return /2 or more/.test(a) ? f.nAll >= 2 : f.nAll === k; }
    return yes ? f.nAll > 0 : f.nAll === 0;
  }
  if (/how many prior doses of ppsv23|already received 1 or 2 doses of ppsv23/.test(q)) return /2/.test(a) ? f.ppsv >= 2 : num === 0 ? f.ppsv === 0 : f.ppsv === 1;
  if (/ever received ppsv23|any prior dose/.test(q)) return yes ? f.ppsv > 0 : f.ppsv === 0;
  if (/before age 65|at or since age 65/.test(q)) return /at\/?\s?or after|at or since/.test(a) ? f.ppsvAt65plus : !f.ppsvAt65plus;
  if (/only receive pcv13, pcv15, or pcv20 before age 72/.test(q)) return yes ? f.allBefore72 : !f.allBefore72;
  if (/was the dose given before age 12 months/.test(q)) return /^yes/.test(a) ? f.n0_12 >= 1 : f.n0_12 === 0;
  if (/before age 7 months/.test(q)) return cnt(f.n0_7);
  if (/after age 7 months/.test(q)) return cnt(f.n7up);
  if (/before age 12 months/.test(q)) return cnt(f.n0_12);
  if (/between the ages of 12 and 23 months/.test(q)) return cnt(f.n12_24);
  if (/between the ages of 24 and 71 months/.test(q)) return cnt(f.n24_72);
  if (/at or since age 24 months/.test(q)) return cnt(f.n24up);
  return null;
}

// Measured on the live pages 2026-10-25: for a CHILD or TEEN the tool lists a
// cochlear implant and a CSF leak inside "Chronic medical conditions", so a
// child with either is routed to the chronic rulebook. (For an ADULT they are
// their own group.) And a no-risk teen, or a no-risk 19-49 adult, is sent to
// child-teen-Norisk.asp, whose recommendation is static text on the page
// rather than a scripted branch.
const STATIC_NORISK = 'No vaccine recommended at this time. Check this app when your patient turns 50 years old to see if any pneumococcal vaccines are recommended for them.';

const FILES_FOR = {
  'weeks7-6mo': ['child-infant'], 'weeks7mo-11mo': ['child-infant'], 'weeks12mo-23mo': ['child-infant'],
  child2to5: ['child-norisk', 'child-chronic', 'child-IC'], teen6to18: ['teen6-18'],
  'adult19-49': ['adult19-49'], 'adult50+': ['adult50+'],
};
// Within child-infant the three infant pages share one file; the id prefix says which.
const INFANT_IDS = { 'weeks7-6mo': /^rd-child-1[a-d]$/, 'weeks7mo-11mo': /^rd-child-[234][a-d]$/, 'weeks12mo-23mo': /^rd-child-[56789][a-c]$/ };

export function pneumoRecsAnswer(c, today) {
  const f = facts(c, today);
  const childish = ['child2to5', 'teen6to18'].includes(f.band);
  if (childish && f.group === 'special') f.group = 'chronic';
  if (f.group === 'none' && (f.band === 'teen6to18' || (f.band === 'adult19-49' && !f.newConj))) {
    return { band: f.band, file: 'child-teen-Norisk.asp (static page)', group: f.group, facts: f,
      answer: STATIC_NORISK, branch: ['(no risk factors)'],
      questions: ['Does the patient have any of the following risk conditions? -> No risk factors'],
      alsoFits: 0, unresolvedIds: [] };
  }
  let file = FILES_FOR[f.band][0];
  if (f.band === 'child2to5') file = f.group === 'IC' ? 'child-IC' : f.group === 'none' ? 'child-norisk' : 'child-chronic';
  // The first question on each adult page GATES everything after it: answer
  // "yes, they have had PCV15/20/21" and the tool never asks the risk or
  // PPSV23 questions at all. Without this a patient who has had PCV15 can be
  // matched to a branch that lives on the "never had a conjugate" path.
  const GATE = { 'adult19-49': ['chk-pcv-adult-yes'], 'adult50+': ['rd-pcv-adult-yes'] }[file] || [];
  const gateYes = !!f.newConj;
  const pool = BRANCHES.filter((b) => b.file === file && b.reachable !== false
    && (!GATE.length || (gateYes ? GATE.some((g) => b.ids.includes(g)) : !GATE.some((g) => b.ids.includes(g))))
    && (f.band.startsWith('weeks') ? b.ids.every((i) => INFANT_IDS[f.band].test(i)) : true));
  const unknown = new Set();
  const fits = pool.filter((b) => b.ids.every((i) => { const p = predicate(i, f); if (p === null) { unknown.add(i); return false; } return p; }));
  return {
    band: f.band, file, group: f.group, facts: f,
    answer: fits.length ? fits[0].answer : null,
    branch: fits.length ? fits[0].ids : null,
    questions: fits.length ? fits[0].ids.map((i) => `${META.question[i] || '(risk question)'} → ${META.label[i]}`) : [],
    alsoFits: fits.length - 1,
    unresolvedIds: [...unknown],
  };
}
