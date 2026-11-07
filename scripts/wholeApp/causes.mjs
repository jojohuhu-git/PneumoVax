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
  'R4-thrown-out-ppsv23-chip': {
    class: 'real',
    title: "A thrown-out childhood PPSV23's 5-year date is followed by one surface and not the other",
  },
  // R6 is fixed for both families: the one she was shown first (§B-OPTIONB19,
  // Cora: the dose at 19, in view) and its leftover (§B-OPTIONB50, Owen,
  // 2026-11-07: chronic conditions only, the dose at 50, under "Why this").
  // Kept so a return of the fault is sorted, not unsorted.
  'R6-option-b-later-dose-unsaid': {
    class: 'real',
    title: "Chronic conditions only: a child's Option B says it completes the series, and after PPSV23 a dose comes at 50 (left out of §B-OPTIONB19; not put to the owner)",
  },
  // R7 was fixed 2026-11-07 (§B-50BABY). What remains is babies with an ADULT-only
  // tick (smoking, alcohol use disorder): left silent on purpose, since "50" would
  // name the wrong age and the adult schedule acts at 19.
  'R7-baby-complete-silent-on-adult-schedule': {
    class: 'real',
    title: "A baby with smoking or alcohol use disorder ticked: \"series complete\" names no later age (left out of §B-50BABY on purpose)",
  },
  // The TODDLER twin of R7, ruled by the owner 2026-11-07 ("Match the baby card",
  // §B-50BABY, Ava): offered "Re-evaluate at age 19" for an adult-only tick, she
  // chose no line, as on the baby card. The baby half above was never put to her.
  'D6-toddler-adult-only-tick-silent': {
    class: 'ruling',
    title: 'A healthy 2-4-year-old with smoking or alcohol use disorder ticked: "series complete" names no later age (§B-50BABY, owner 2026-11-07)',
  },
  'D1-at-19-and-50-lines': {
    class: 'ruling',
    title: '"Complete" cards that state what happens at 19 or 50 (§B-AT19, §B-5TO18, CLAUDE.md "Adult sources on child cards")',
  },
  'D2-extra-dose-counts-at-19': {
    class: 'ruling',
    title: "A child's extra PPSV23 is counted once the patient is an adult (§C-P2-ONTIME: adult rows count every PPSV23 received)",
  },
  'D5-extra-pcv15-counts-at-19': {
    class: 'ruling',
    title: "A child's extra conjugate is counted once the patient is an adult (§C-P1-3: adult rows count every dose received)",
  },
  'D3-ppsv23-held-5-years-after-thrown-out': {
    class: 'ruling',
    title: 'Option A due now, Option B PPSV23 held 5 years after a thrown-out PPSV23 (§C-P2-FIVE)',
  },
  'D4-dose-due-before-19-stays-a-childs': {
    class: 'ruling',
    title: 'A dose already due before 19 stays on the child rules; the adult answer starts on the birthday (§B-AT19, 2026-11-05)',
  },
  'line-doing-its-job': { class: 'info', title: 'An age line changing exactly what its rule says' },
  'p2-9-routine-then-behind': { class: 'info', title: 'A baby reads Routine until the routine date passes, then Catch-up (P2-9, §L-2)' },
  unsorted: { class: 'unsorted', title: 'Not yet sorted' },
};


export function causeOf(check, kind, group) {
  if (check === 'harness') return 'unsorted';
  if (kind === 'line-changes-what-the-rule-says' || kind === 'dose-line-changes-what-the-rule-says') return 'line-doing-its-job';
  if (kind === 'status-changed-with-no-age-line' && / routine → catchup$/.test(group)) return 'p2-9-routine-then-behind';
  if (check === 1) {
    if (kind === 'warned-short' && /rule=ADULT-PPSV23-AFTER-PPSV23/.test(group)) return 'R4-thrown-out-ppsv23-chip';
  }
  if (check === 2) {
    // Only the chronic family's dose at 50 is still expected; a 19-49 one would be
    // Cora's family coming back, and lands in unsorted.
    if (kind === 'not-mentioned' && /^Option B/.test(group) && /quiet spell, age 50/.test(group)) return 'R6-option-b-later-dose-unsaid';
    // "If PCV15 is used, add PPSV23", but a thrown-out PPSV23 is already on the
    // record, so the next screen offers PCV20 alone (5 grid children).
    if (kind === 'not-mentioned' && /^PCV dose 2 of 2 \(at-risk catch-up\) ⇒ PCV20: 1 dose PCV20/.test(group)) return 'R4-thrown-out-ppsv23-chip';
  }
  if (check === 3) {
    if (/card warned of it/.test(kind)) return 'D1-at-19-and-50-lines';
    // The toddler card's label carries no dose count ("PCV series complete ⇒");
    // the baby card's does ("PCV series complete (4 doses) ⇒"). The toddler card
    // is silent only for a PCV20 series (never asked again) or an adult-only
    // tick, so any silent toddler card that is then asked is the ruled family.
    // Most are asked at 19. Two grid toddlers (smoking or alcohol use disorder,
    // PCV13 x3 and a PPSV23) are asked at 50: at 19 the adult chronic row says
    // "review at age 50", so for them the old line was right — her ruling, as
    // worded ("an adult box ticked"), still takes it off. Verified 2026-11-07.
    if (/card silent/.test(kind) && /^PCV series complete ⇒/.test(group)) return 'D6-toddler-adult-only-tick-silent';
    // Only the adult-only-tick babies (the adult card acts at 19) are expected; a
    // silent healthy baby meeting a dose at 50 would be R7 coming back: unsorted.
    if (/card silent/.test(kind) && /at age line 228m/.test(group)) return 'R7-baby-complete-silent-on-adult-schedule';
  }
  if (check === 4) {
    if (kind === 'held-by-ruling') return 'D3-ppsv23-held-5-years-after-thrown-out';
    // Option B-2 only ever carries a date through the hold after a thrown-out
    // PPSV23 (`holdPpsv23AfterThrownOut`), which reads no other clock.
    if (kind === 'second-step-dated-before-the-first-allows') return 'R4-thrown-out-ppsv23-chip';
  }
  if (check === 5) {
    if (/rule=CHILD-PPSV23-AFTER-PCV/.test(group)) return 'R4-thrown-out-ppsv23-chip';
  }
  if (check === 6) {
    if (kind === 'due-today-turns-to-complete-at-19') return 'D4-dose-due-before-19-stays-a-childs';
    if (kind === 'recorded-dose-changed-at-line' && /^228m: ppsv23 dose \d: (extraDose true → null|effectiveDoseNum null → \d)/.test(group)) return 'D2-extra-dose-counts-at-19';
  }
  if (check === 6 && kind === 'recorded-dose-changed-at-line' && /^228m: pcv dose \d: (extraDose true → null|effectiveDoseNum null → \d)/.test(group)) {
    return 'D5-extra-pcv15-counts-at-19';
  }
  if (check === 7) {
    // Narrow on purpose: only the one-way move the ruling describes, "extra" to
    // "counted". A dose going the other way would be a new fault.
    if (kind === 'recorded-dose-verdict-changed' && /^ppsv23 (extraDose: true → -|effectiveDoseNum: - → \d) \(crossing 19\)/.test(group)) return 'D2-extra-dose-counts-at-19';
    if (kind === 'recorded-dose-verdict-changed' && /^pcv (extraDose: true → -|effectiveDoseNum: - → \d) \(crossing 19\)/.test(group)) return 'D5-extra-pcv15-counts-at-19';
    if (kind === 'advised-date-moved' && /^Option B-2/.test(group)) return 'R4-thrown-out-ppsv23-chip';
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
  [24, /^cards: (PCV dose \d of 2|PCV series (complete|up to date for age) \(3 doses\)) → /, 'under-2 rules end; healthy or at-risk 2-5 rules begin'],
  [60, /→ Not indicated \(healthy 5–18y\)$/, 'CDC: no PCV for a healthy child from 5'],
  [72, /^cards: (PCV dose \d of 2 \(at-risk catch-up\)|PCV complete \(at-risk catch-up done\)) → /, 'the 2-5 at-risk rows end; the 6-18 rows begin'],
  [228, /^cards: /, 'the child rulebook ends and the adult rulebook begins at 19'],
  // R2: the day before 19 shows the adult card dated that birthday; on it, due.
  [228, /^card PCV \(PCV15, PCV20, or PCV21\) ≥1 year after PPSV23: (dueToday false → true|dated true → false)$/, 'a date set to the 19th birthday falls due on it'],
  [600, /^cards: (No dose now|Not indicated \(no risk|Review at age 50|PPSV23 \(≥8 weeks after PCV15\))/, 'routine adult vaccination begins at 50 (mm7401a1)'],
  [600, /^card 1 dose PCV \(PCV20, PCV15, or PCV21\): status risk-based → due$/, 'the same dose becomes routine rather than risk-based at 50'],
  [780, /→ PCV20 or PCV21 ≥5 years \(shared clinical decision-making\)$/, 'a PPSV23 at 65 or over makes a further PCV a shared decision (mm7401a1)'],
];

export const expectedAtAgeLine = (line, diff) => CARD_MOVES.some(([l, re]) => l === line && re.test(diff));

/** A card asking for a dose the day before 19 that reads Complete on the birthday. */
export const askTurnsToComplete = (line, diff) => line === 228
  && /^cards: .*(1 dose PCV20 \(≥5 years after first PPSV23\)|Option [AB]).* → Complete \(/.test(diff);

/**
 * Doses given around a line. CDC's 4-day grace is for a MINIMUM age, so it
 * belongs at PPSV23's 2 years and PCV21's 18 years, and at the first birthday
 * by owner ruling (§ the 2026-10-31 grace fix). The other lines are the edges of
 * a table row or a recommendation, where a dose 4 days short is simply on the
 * other side, so a change INSIDE the four days is the rule working.
 */
const GRACE_EDGE = new Set(['PCV13@12', 'PCV15@12', 'PCV20@12', 'PPSV23@24', 'PCV21@216']);
// PCV15@60 and PCV20@60 since §C-P1-3 (Ben): CDC's catch-up for a healthy child
// is "ages 2-4 years", so a dose on the 5th birthday is past it and reads extra.
const ROW_EDGE = new Set(['PCV13@7', 'PCV15@7', 'PCV20@7', 'PCV13@24', 'PCV15@24', 'PCV20@24', 'PCV15@60', 'PCV20@60', 'PCV13@72', 'PCV15@72', 'PCV21@228', 'PPSV23@780']);

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
