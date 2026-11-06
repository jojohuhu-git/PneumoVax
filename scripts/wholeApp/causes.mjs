// ─────────────────────────────────────────────────────────────────────────
// causes.mjs — sorting what the checks flag into root causes, and writing down
// what each age line is meant to change.
//
// A check is only useful if a red result means something, so every flag falls
// into exactly one of three classes:
//
//   real        the app disagrees with itself. Stays red until fixed.
//   ruling      the app looks inconsistent, but CLAUDE.md or CLINICAL_SPEC.md
//               records the owner choosing exactly this. Named with its section,
//               so it can be re-read rather than re-litigated.
//   unsorted    none of the above yet. A NEW kind of failure lands here, and
//               that is what makes this a gate: nothing is ever silently waved
//               through by being unlike what came before.
//
// Harness errors do not appear here. They were fixed in replay.mjs / checks.mjs
// and are listed in the report; a fixed harness error produces no flag at all.
// ─────────────────────────────────────────────────────────────────────────

export const CAUSES = {
  'R1-same-day-ppsv23': {
    class: 'real',
    title: "An immunocompromised child's 2nd-PPSV23 card ignores the 8 weeks after a recent PCV",
  },
  'R2-date-past-19': {
    class: 'real',
    title: "A child's card gives a date after the 19th birthday, and the adult rules answer differently on the day",
  },
  'R3-date-crosses-7-months': {
    class: 'real',
    title: "An infant's date is worked out by today's age band, not the age at the dose",
  },
  'R4-thrown-out-ppsv23-chip': {
    class: 'real',
    title: "A thrown-out childhood PPSV23's 5-year date is followed by one surface and not the other",
  },
  'R5-complete-with-a-dose-at-2': {
    class: 'real',
    title: 'An at-risk baby\'s card reads "Complete" while saying a dose falls due at age 2',
  },
  'R6-option-b-later-dose-unsaid': {
    class: 'real',
    title: "A child's Option B says it completes the series; at 19 the adult schedule can still ask for a dose",
  },
  'R7-baby-complete-silent-on-adult-schedule': {
    class: 'real',
    title: "A baby's \"series complete\" card says nothing of the adult schedule that its own PCV15 will meet",
  },
  'D1-at-19-and-50-lines': {
    class: 'ruling',
    title: '"Complete" cards that state what happens at 19 or 50 (§B-AT19, §B-5TO18, CLAUDE.md "Adult sources on child cards")',
  },
  'D2-extra-dose-counts-at-19': {
    class: 'ruling',
    title: "A child's extra PPSV23 is counted once the patient is an adult (§C-P2-ONTIME: adult rows count every PPSV23 received)",
  },
  'D3-ppsv23-held-5-years-after-thrown-out': {
    class: 'ruling',
    title: 'Option A due now, Option B PPSV23 held 5 years after a thrown-out PPSV23 (§C-P2-FIVE)',
  },
  'line-doing-its-job': { class: 'info', title: 'An age line changing exactly what its rule says' },
  unsorted: { class: 'unsorted', title: 'Not yet sorted' },
};

const CHILD_CARD = /^(1 dose PCV20 \(immunocompromising\)|2nd PPSV23|Option [AB]|PCV dose)/;

export function causeOf(check, kind, group) {
  if (check === 'harness') return 'unsorted';
  if (kind === 'line-changes-what-the-rule-says' || kind === 'dose-line-changes-what-the-rule-says') return 'line-doing-its-job';
  if (check === 1) {
    if (kind === 'rejected' && /^2nd PPSV23/.test(group)) return 'R1-same-day-ppsv23';
    if (kind === 'warned-short' && /rule=ADULT-PPSV23-AFTER-PPSV23/.test(group)) return 'R4-thrown-out-ppsv23-chip';
    if (kind === 'warned-short' && /rule=ADULT-/.test(group) && CHILD_CARD.test(group)) return 'R2-date-past-19';
  }
  if (check === 2) {
    if (kind === 'not-mentioned' && /^Option B/.test(group) && /quiet spell/.test(group)) return 'R6-option-b-later-dose-unsaid';
    // "If PCV15 is used, add PPSV23", but a thrown-out PPSV23 is already on the
    // record, so the next screen offers PCV20 alone (5 grid children).
    if (kind === 'not-mentioned' && /^PCV dose 2 of 2 \(at-risk catch-up\) ⇒ PCV20: 1 dose PCV20/.test(group)) return 'R4-thrown-out-ppsv23-chip';
  }
  if (check === 3) {
    if (/says complete, and that a dose falls due at 2/.test(kind)) return 'R5-complete-with-a-dose-at-2';
    if (/card warned of it/.test(kind)) return 'D1-at-19-and-50-lines';
    if (/card silent/.test(kind)) return 'R7-baby-complete-silent-on-adult-schedule';
  }
  if (check === 4) {
    if (kind === 'held-by-ruling') return 'D3-ppsv23-held-5-years-after-thrown-out';
    // Option B-2 only ever carries a date through the hold after a thrown-out
    // PPSV23 (`holdPpsv23AfterThrownOut`), which reads no other clock.
    if (kind === 'second-step-dated-before-the-first-allows') return 'R4-thrown-out-ppsv23-chip';
    if (/2nd PPSV23/.test(group)) return 'R1-same-day-ppsv23';
  }
  if (check === 5) {
    if (/rule=CHILD-PPSV23-AFTER-PCV/.test(group)) return 'R4-thrown-out-ppsv23-chip';
  }
  if (check === 6) {
    if (kind === 'ask-turns-to-complete-at-19') return 'R2-date-past-19';
    if (kind === 'recorded-dose-changed-at-line' && /^228m: ppsv23 dose \d: (extraDose true → null|effectiveDoseNum null → \d)/.test(group)) return 'D2-extra-dose-counts-at-19';
  }
  if (check === 7) {
    // Narrow on purpose: only the one-way move the ruling describes, "extra" to
    // "counted". A dose going the other way would be a new fault.
    if (kind === 'recorded-dose-verdict-changed' && /^ppsv23 (extraDose: true → -|effectiveDoseNum: - → \d) \(crossing 19\)/.test(group)) return 'D2-extra-dose-counts-at-19';
    if (kind === 'advised-date-moved' && /^Option B-2/.test(group)) return 'R4-thrown-out-ppsv23-chip';
    if (/crossed 228m/.test(group)) return 'R2-date-past-19';
    if (/crossed 7m/.test(group)) return 'R3-date-crosses-7-months';
  }
  return 'unsorted';
}

// ── What each line is meant to change ────────────────────────────────────
//
// One rule per line, in plain words, with the shape of change it permits. A
// change that fits nothing here is reported, so a line moved by accident (or a
// rule leaking across one) has nowhere to hide.
const CARD_MOVES = [
  [7, /^cards: PCV dose \d of 4 → PCV dose \d of 3$/, 'p2016 Table 1: from 7 months a series is 3 doses, not 4'],
  [12, /^cards: PCV dose \d of 3 → PCV dose \d of 2$/, 'p2016 Table 1: from 12 months a series is 2 doses'],
  [12, /^card PCV dose (\d) of \1: dueToday false → true$/, 'the final dose stops being held to the first birthday'],
  [24, /^cards: (PCV dose \d of 2|PCV series complete \(3 doses\)) → /, 'under-2 rules end; healthy or at-risk 2-5 rules begin'],
  [60, /→ Not indicated \(healthy 5–18y\)$/, 'CDC: no PCV for a healthy child from 5'],
  [72, /^cards: (PCV dose \d of 2 \(at-risk catch-up\)|PCV complete \(at-risk catch-up done\)) → /, 'the 2-5 at-risk rows end; the 6-18 rows begin'],
  [228, /^cards: /, 'the child rulebook ends and the adult rulebook begins at 19'],
  [600, /^cards: (No dose now|Not indicated \(no risk|Review at age 50|PPSV23 \(≥8 weeks after PCV15\))/, 'routine adult vaccination begins at 50 (mm7401a1)'],
  [600, /^card 1 dose PCV \(PCV20, PCV15, or PCV21\): status risk-based → due$/, 'the same dose becomes routine rather than risk-based at 50'],
  [780, /→ PCV20 or PCV21 ≥5 years \(shared clinical decision-making\)$/, 'a PPSV23 at 65 or over makes a further PCV a shared decision (mm7401a1)'],
];

export const expectedAtAgeLine = (line, diff) => CARD_MOVES.some(([l, re]) => l === line && re.test(diff));

/** A card asking for a dose the day before 19 that reads Complete on the birthday. */
export const askTurnsToComplete = (line, diff) => line === 228
  && /^cards: .*(1 dose PCV20 \(immunocompromising\)|Option [AB]).* → Complete \(/.test(diff);

/**
 * Doses given around a line. CDC's 4-day grace is for a MINIMUM age, so it
 * belongs at PPSV23's 2 years and PCV21's 18 years, and at the first birthday
 * by owner ruling (§ the 2026-10-31 grace fix). The other lines are the edges of
 * a table row or a recommendation, where a dose 4 days short is simply on the
 * other side, so a change INSIDE the four days is the rule working.
 */
const GRACE_EDGE = new Set(['PCV13@12', 'PCV15@12', 'PCV20@12', 'PPSV23@24', 'PCV21@216']);
const ROW_EDGE = new Set(['PCV13@7', 'PCV15@7', 'PCV20@7', 'PCV13@24', 'PCV15@24', 'PCV20@24', 'PCV13@72', 'PCV15@72', 'PCV21@228', 'PPSV23@780']);

export const expectedAtDoseLine = (line, diff, { product }) => {
  const k = `${product}@${line}`;
  return /^edge of grace/.test(diff) ? GRACE_EDGE.has(k) : ROW_EDGE.has(k);
};

/** The lines that must change something for somebody, or the rule has gone. */
export const LINES_THAT_MUST_ACT = [7, 12, 24, 60, 72, 228, 600, 780];

/**
 * The same demand of `rows`, the merged failure groups. It exists because a
 * deliberate break went unnoticed without it: moving PCV21's minimum age a month
 * changes nothing on the line it left, and the new line is one nobody tests, so
 * the line simply stopped acting. A line that stops acting is the finding.
 */
export function deadLines(rows) {
  const dead = LINES_THAT_MUST_ACT
    .filter((l) => !rows.some((r) => r.kind === 'line-changes-what-the-rule-says' && r.group.startsWith(`${l}m:`)))
    .map((l) => `age ${l}m`);
  for (const k of [...GRACE_EDGE, ...ROW_EDGE]) {
    const [product, line] = k.split('@');
    if (!rows.some((r) => r.kind === 'dose-line-changes-what-the-rule-says' && r.group.startsWith(`${product} at ${line}m:`))) {
      dead.push(`${product} dose at ${line}m`);
    }
  }
  return dead;
}
