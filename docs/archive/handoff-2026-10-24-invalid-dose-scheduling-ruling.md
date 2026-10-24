# PneumoVax — Handoff: the owner's invalid-dose scheduling ruling, and why PR #84 must not merge yet (2026-10-24)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
**read the real port from `preview_logs`**.

Branch: **`fix/2026-10-24-adult-early-dose-families`**, off `main` at `97277a7`, pushed, in sync
with origin. Working tree **clean** at `34ab3bc`. Suite **1,482 passing in 135 files, 0
failures, 0 skips** (`npx vitest run --reporter=json`, run 2026-10-24).

**NO CODE WAS WRITTEN THIS SESSION.** It was a clinical-decision session. Everything below is
measurement and the owner's words. The two throwaway worktrees used to preview options were
removed; `git status` is clean.

Supersedes `handoff-2026-10-24-three-adult-families-shipped.md` (banner added in place).

---

## ⚠️ P0 BLOCKER — do not merge PR #84, and do not build on it, until the owner answers Q1

[PR #84](https://github.com/jojohuhu-git/PneumoVax/pull/84) is open, green, and holds three
commits that make an adult dose given earlier than ACIP advises **COUNT**:

| Commit | Family | Verdicts moved |
|---|---|---|
| `868d01f` | Ruling F — PCV20/21 under 5 years after PPSV23 counts | 363 |
| `1bd5a9c` | Family 2 — conjugate under 1 year after PPSV23 counts | 132 |
| `4b65df1` | Family 3 — PPSV23 under 1 year after PCV15 counts, series reads **Complete** | 78 |

**The owner's ruling of 2026-10-24 (later the same day) appears to reverse families 2 and 3.**
Her step 1, verbatim:

> "Decide what is being repeated. Base this on the valid history. For example, **PCV15 followed
> by a PPSV23 that was too early means the valid history is PCV15 only, so PPSV23 is still
> owed.**"

That sentence describes family 3's exact patient (60y, no risk, PCV15 then PPSV23 at 12 weeks)
and gives the **opposite** answer to what shipped: dose invalid, PPSV23 still owed, series
incomplete — where `4b65df1` prints **Complete (PCV15 + PPSV23)**.

She also wrote, in the same exchange: *"Any dose given before its minimum interval, after
allowing the 4-day grace period, is invalid under CDC's General Best Practice Guidelines"*, and
*"The minimum interval from a PPSV23 to a conjugate is also ≥1 year"* — which is the premise
families 2 and 3 were built to deny.

### Q1 IS ANSWERED — THE REVERSAL IS INTENDED. SHE STATED IT TWICE, WITH THE SAME PATIENT.

Asked to check the logic, she volunteered family 3's exact patient and treated the dose as
invalid, verbatim:

> "(60 y, no risk factors: PCV15 7/19/26, then PPSV23 10/11/26, **which is invalid**)
> • From the valid PCV15: ≥1 year, so on or after 7/19/27.
> • From the invalid PPSV23: CDC's rule applies, but ACIP gives no PPSV23 → PPSV23 interval for
> this.
> • **On or after 10/11/27 meets both rules.** That keeps the ≥1-year spacing used after any
> PPSV23 and still satisfies the PCV15 → PPSV23 interval."

So for family 3's patient the answer is: **PPSV23 invalid, PPSV23 still owed, due 2027-10-11,
series INCOMPLETE.** Commit `4b65df1` prints **Complete (PCV15 + PPSV23)**. That is a straight
reversal, and she has now said it twice without hedging.

**Therefore:**
- **Family 3 (`4b65df1`) reverts** — 78 verdicts back. `ADULT-PPSV23-AFTER-PCV15` returns to
  `enforcement: 'floor'`.
- **Family 2 (`1bd5a9c`) reverts** — 132 verdicts back. Her rule makes PPSV23 → any PCV a ≥1
  year **minimum** ("The minimum interval from a PPSV23 to a conjugate is also ≥1 year"), so an
  early conjugate after a PPSV23 is invalid too. She has not been shown family 2's patient by
  name; **confirm with one worked patient before reverting**, do not infer it from family 3.
- **Ruling F (`868d01f`) does NOT simply revert — it SPLITS.** Her rule gives PPSV23 → PCV as
  ≥1 year for every risk group, not 5 years. So a conjugate at ≥1 year after a PPSV23 is valid
  (Ruling F's outcome, different reasoning) and one under 1 year is invalid (Ruling F's outcome
  reversed). `ADULT-PCV20-21-5Y-AFTER-PPSV23`'s 5 years is then wrong as a floor in both
  directions. **Measure the split at 1 year and put the two counts to her.**

Because PR #84 is being unwound rather than extended, **this handoff is landed on its own
branch off `main`**, not on #84's branch.

---

## The owner's ruling, verbatim — this is the rulebook entry to be written

> "The two rules work together. The invalid dose sets the start date, and the vaccine-specific
> rule sets how long to wait. CDC's general rule says a dose given ≥5 days before the minimum
> interval is invalid and must be repeated, and 'the repeat dose should be spaced after the
> invalid dose by the recommended minimum interval.' ACIP's pneumococcal tables tell you what
> that minimum interval is, based on what kind of vaccine came right before."
>
> **1.** "Decide what is being repeated. Base this on the valid history. For example, PCV15
> followed by a PPSV23 that was too early means the valid history is PCV15 only, so PPSV23 is
> still owed."
> **2.** "Start the clock at the invalid dose. Under CDC's rule, every interval runs from the
> most recent dose given, valid or not."
> **3.** "Use the interval for the prior vaccine type, counted from that invalid dose:
> • Invalid dose was PPSV23 → next PCV: **≥1 year** after it, **for every risk group. There is
> no 8-week option.** ACIP says this directly: a PPSV23 given before PCV15 'should be followed
> by a single dose of PCV15 or PCV20 ≥1 year after the PPSV23 dose.'
> • Invalid dose was PPSV23 → repeat PPSV23: **ACIP gives no current PPSV23 → PPSV23 interval
> for fixing an error.** The only one on record is the older ≥5-year interval for planned
> repeat doses.
> • Invalid dose was a PCV → next dose: PPSV23 ≥1 year after it (≥8 weeks only for IC, cochlear
> implant, or CSF leak). PCV13 → PCV20/21 is also ≥1 year."
> **4.** "Check the earlier valid doses too. The repeat also has to meet the minimum interval
> from the valid dose before it. In practice, **use whichever date comes later**."

Her earlier framing of the same rule, worth keeping: *"An invalid dose sets the start date for
the next dose. It doesn't move the patient into a history category that requires the invalid
dose to have counted."* And: *"ACIP's pneumococcal MMWRs don't say which history row applies
after an early PPSV23"* — so steps 1–4 are an **OWNER CLINICAL DETERMINATION**, dated
2026-10-24. Never cite ACIP or CDC for the combination.

Her interval table, also to be recorded: PCV15 → PPSV23 ≥1 year (8 weeks only IC/cochlear/CSF);
PPSV23 → any PCV ≥1 year regardless of risk; PCV13 only → PCV20/21 ≥1 year; PCV13 + PPSV23 →
PCV20/21 ≥5 years, and *"that history only applies if the PPSV23 is counted as valid"* and only
for doses *"given under prior recommendations."* The 8-week option is **one-directional**:
conjugate → PPSV23 only.

---

## Q2 IS ANSWERED — and both readings I put to her were wrong

Step 3's second bullet says no PPSV23 → PPSV23 error-repair interval exists. I offered her two
readings (8 weeks from the valid PCV15, or 8 weeks from the invalid dose). **She chose
neither.** She fills the gap with the general spacing that follows *any* PPSV23:

> "That keeps the **≥1-year spacing used after any PPSV23** and still satisfies the PCV15 →
> PPSV23 interval."

**The rule: after any PPSV23, valid or invalid, the next pneumococcal dose waits ≥1 year.** Then
step 4's "whichever date comes later" applies. Worked, with her own patient and the IC twin:

| Patient | From the valid PCV15 | From the invalid PPSV23 | Answer (later) |
|---|---|---|---|
| 60y, no risk. PCV15 7/19/26, PPSV23 10/11/26 | +1 year → 2027-07-19 | +1 year → **2027-10-11** | **2027-10-11** (hers) |
| 40y, asplenia (IC). PCV15 8/30/26, PPSV23 10/11/26 | +8 weeks → 2026-10-25 | +1 year → **2027-10-11** | **2027-10-11** |

**The IC case is the one to notice:** the ≥1 year from the invalid PPSV23 swallows the 8-week
IC interval entirely, so an immunocompromised adult whose PPSV23 came two weeks early waits a
full year rather than two more weeks. That follows from her rule as stated and it is the
opposite of what the 8-week rows were written to do. **It was derived, not ruled on — show her
this patient and confirm before building.**

### Still open: children
Her ruling is adult-shaped, and she has said separately that *"pediatric intervals don't follow
the adult 1-year rule"* — children's PPSV23 → PPSV23 is 5 years and only for IC or asplenia. So
for C1 (5y asplenia, PCV20 2026-06-01, invalid PPSV23 2026-06-22) the "≥1 year after any
PPSV23" fill has **no paediatric warrant**. Candidates: 2026-07-27 (8 weeks from the valid
PCV20) or something else. **Ask; do not carry the adult number into the child schedule.**

## What her rule gives, against what the app prints (measured, `today = 2026-10-24`)

| Case | Her rule | Chip now | Card now |
|---|---|---|---|
| **S0** 60y no risk; PCV15 7/19, PPSV23 10/11 | **PPSV23** owed from **2027-10-11**, incomplete | n/a — dose counts | **Complete** ✗ (PR #84) |
| **A1** 60y no risk; PCV13 7/19, PPSV23 10/11 | PCV20/21 from **2027-10-11** | 2027-10-11 ✓ | 2027-07-19 ✗ |
| **A2** same, both 7/19 | PCV20/21 from **2027-07-19** | 2027-07-19 ✓ | 2027-07-19 ✓ |
| **B1** 40y HIV; PCV13 9/20, PPSV23 10/11 | PCV20/21 from **2027-10-11** | 2026-12-06 ✗ | 2027-09-20 ✗ |
| **B2** 40y HIV; PCV15 + PPSV23 both 10/11 | PPSV23 from **2026-12-06** | 2026-12-06 ✓ | 2026-12-06 ✓ |
| **B3** 40y asplenia; PCV15 8/30, PPSV23 10/11 | PPSV23 from **2027-10-11** | 2026-12-06 ✗ | 2026-10-25 ✗ |
| **C1** 5y asplenia; PCV20 6/1, PPSV23 6/22 | **OPEN — children** | 2026-08-17 | n/a |

**B1 is the clearest defect.** The chip repeats the PPSV23 in 8 weeks — it reused the interval
of the rule that *rejected* the dose. Once that dose is set aside the valid history is PCV13
alone, which owes a **conjugate at ≥1 year**, not a PPSV23. Confirmed structural over the grid:

| Row | Patients | Next recommended dose is a conjugate | is a PPSV23 |
|---|---|---|---|
| `ADULT-PPSV23-AFTER-PCV13` | 402 | 258 | **0** |
| `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` | 210 | 90 | **0** |
| `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` | 45 | 0 | 30 |

And across the 402, **the card and chip dates never agree once** — 164 cards earlier, 36 later,
202 with no date. Re-measure with the scripts below; never quote these from here.

---

## The build, once Q1 and Q2 are answered

1. The three adult rows **stay `enforcement: 'floor'`** (unless Q1 reverses families 2/3, which
   also restores `ADULT-PPSV23-AFTER-PCV15` to a floor).
2. **Start date** = the most recent dose given, valid or not. The chips already do this
   (`repeatDueDate`, Ruling D); the **cards do not**. This extends Ruling D across vaccine
   streams, which ANCHOR-1 deliberately excluded — reconcilable only if *unnecessary* (adds
   nothing) and *invalid* (too soon) stay distinct concepts. **Record that distinction.**
3. **Interval length** = from the valid history, per step 3's three bullets — NOT the interval
   of the row that rejected the dose. One shared function, called by both the card and the chip.
   ⚠️ Two readings of one number is the P0 bug's own shape; do not give the card and chip
   separate implementations.
4. **Rules updated in step with the logic — the owner asked for this explicitly.** Every commit
   that moves this logic also updates `CLINICAL_SPEC.md` §K (her verbatim steps 1–4, the
   interval table, `authority: 'OWNER'` dated 2026-10-24) and the row's `source` field.
   `rule-docs-match-code.test.js` compares §K's row table to `DOSE_INTERVAL_RULES` cell by cell.
5. Children: C1 shows the same machinery serves them. Decide deliberately and write the
   boundary down rather than leaving it an accident.

## Remaining queue — otherwise unchanged from the previous handoff

| Priority | Item |
|---|---|
| **P0** | Revert families 2 and 3; unwind or close PR #84 (Q1 ANSWERED — see above) |
| **P0** | Split Ruling F at 1 year, with both counts measured and put to her |
| **P0** | Confirm the IC consequence (B3: a 2-week-early PPSV23 now costs a full year) |
| **P1** | Children — the "≥1 year after any PPSV23" fill has no paediatric warrant; ask |
| **P1** | The card/chip start-date and interval-length fix (402 + 210 + 45 patients) |
| **P1** | Ruling F / `ADULT-PCV20-21-5Y-AFTER-PPSV23` — her new rule says ≥1 year, not 5 |
| **P2** | Patient E's "of 3"; overdue children read oddly; chips print ISO dates while cards print `Dec 7, 2026`; dead `advisory` flag; `intervalWords().adj` has no consumer |
| — | **MeningoVax: the owner wants the same audit there** — *"I will eventually need to go to meningovax to do the same audit."* Not started. Consult the `vaccine-parity` skill first; `dateUtils.js` is mirror-synced and the transplant hard stop is byte-identical by test. |

**Closed, do not reopen:** Ruling D, C11, case H, PR #83's questions. The Job Aid's last
uncredited statement (1,584 cards) is the decision she asked **not** to be re-raised.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout fix/2026-10-24-adult-early-dose-families`
   — **do not branch off this until Q1 is answered**; if she reverts families 2/3 the base moves.
2. `npx vitest run` — confirm **1,482 passing in 135 files** before any new work.
3. **Q1 and Q2 are ANSWERED (above).** Three things still go to her before any commit:
   family 2's patient by name, Ruling F's split at 1 year with counts, and the IC consequence
   in Q2's second table. **Ask, do not default.**
4. Re-measure before quoting any count:
   `npx vite-node scripts/…` — the ad-hoc scripts used this session were scratch-only; the
   durable ones are `scripts/proseDiff.mjs` (plain `node`, NOT `vite-node`),
   `scripts/uncreditedSources.mjs`, `scripts/citationMapping.mjs`.
5. Per item: reproduce → failing test (quote the pre-fix failure count) → fix →
   `CLINICAL_SPEC.md` §K in the same commit → full suite → **break the fix more than one way
   and quote the counts** → `node scripts/proseDiff.mjs dump` both sides, field by field →
   **drive the running app** → commit per item.
6. Push/merge: **branch → PR → the owner squash-merges.** A session agent cannot merge.
