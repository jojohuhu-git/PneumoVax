## The last two PneumoVax items from MeningoVax's Phase 9 handoff

Both items come from `MeningoVax-main/docs/archive/handoff-2026-11-27-meningovax-phase9-close.md`.

### PNEUMO-AGEENTRY-GUARD: a test keeps `ageEntry.js` the same in both apps

`ageEntry.js` decides which ages the Age step refuses (a birth date in the future, a patient
over 120, Months above 11) and words the message. You asked for both apps to read the same
(E2, 2026-11-26, "Both apps"), but nothing checked it. The new test compares the two files
with comments removed, the same way the `dateUtils.js` test does. It is **skipped** when the
MeningoVax folder is not on the computer, because the online check copies only this repo.

Checked by breaking it on purpose, then restoring from a copy:

| Change | Result |
|---|---|
| One message reworded | fails 2 of 2 |
| Age limit 120 → 125 years | fails 1 of 2 |
| A comment changed only | passes 2 of 2 |
| MeningoVax folder missing | 1 passes, 1 skipped |

### PNEUMO-EM-DASH: no em dash in a sentence a clinician reads

**Measured first.** 65 different sentences of the app's own had an em dash, seen by
**14,078 of 17,016** real test patients (13,688 of them without opening anything).

**Your three answers (2026-11-27):**
1. Sentences: **"Yes, like MeningoVax."** Each dash became a period, colon or comma.
2. Card headers: **"Yes, use brackets."**
3. Dose labels: **"Keep, like MeningoVax."** "Not counted — repeat" and the rest are unchanged.

Examples:

| Patient | Before | After |
|---|---|---|
| Healthy 10-year-old | No PCV is indicated — healthy children 5–18 years are not routinely caught up. | No PCV is indicated. Healthy children 5–18 years are not routinely caught up. |
| 65-year-old, PCV13 and PPSV23 | PCV20 or PCV21 ≥5 years after last pneumococcal dose — completes the series | PCV20 or PCV21 ≥5 years after last pneumococcal dose (completes the series) |
| 30-year-old with diabetes, PCV13 and PPSV23 | No dose now — review at age 50 | No dose now. Review at age 50 |
| 8-year-old with asplenia, no PCV | … with no prior PCV: Option A — 1 dose of PCV20 … | … with no prior PCV. Option A: 1 dose of PCV20 … |
| Baby with a PPSV23 at birth (dose line) | Given at birth — below the 2-year minimum age for PPSV23. | Given at birth: below the 2-year minimum age for PPSV23. |

**Measured after the change:**
- Prose diff (`node scripts/proseDiff.mjs`): 21,125 of 35,280 lines changed (14,078 real
  patients, 7,047 impossible entries). In **every one** the words are the same and only the
  punctuation differs. **No sentence moved** between what shows and "Why this".
- Both answer records (17,016 real, 18,264 impossible): **0 answers moved.**
- The visible-word limit fell from 154 to 151 for the wordiest card, because a bare "—" had been
  counted as a word. It is a fall, so the pin was lowered.

### Judgement calls, for you to check

- **Colon or comma instead of a period** where a period would have split one sentence in two and
  could have moved the second half behind "Why this". Examples: "…is complete: no PPSV23 and no
  further PCV needed", "…no additional PPSV23 doses are recommended, so the series is complete".
  A period was used where you saw one in the question ("No PCV is indicated. Healthy children…",
  "No dose now. Review at age 50"), and before "Option A:" when a colon came just before it.
- **Two headers already had brackets**, so the tail went inside them with a semicolon:
  "1 dose PCV20 (≥8 weeks; completes the series)", "PPSV23 (≥8 weeks after PCV15; completes
  the series)".
- **"How this was worked out"** is covered too: it is on the results screen. "Diabetes mellitus
  — a chronic condition" became "Diabetes mellitus (a chronic condition)"; "1 of 2 PPSV23 doses
  counted — 1 set aside…" became "1 of 2 PPSV23 doses counted (1 set aside, …)".
- **Kept as they are:** quoted source words, source titles and hover text, the dose labels, the
  transplant row and message (word for word the same as MeningoVax), and "—" in an empty table
  cell. The Rulebook needed no change: its only dashes are dose labels and source titles.
- Two tests searched for the child's age-50 sentence by "Re-evaluate at age 50", which the adult
  card now also starts with a capital. They were narrowed to the child's sentence itself.

### Tests

- New: `regression-2026-11-27-ageentry-mirrors-meningovax.test.js` (2) and
  `regression-2026-11-27-no-em-dash-in-sentences.test.jsx` (8). Putting a dash back fails the
  second: in the healthy 5–18 card 3 of 8, in the decision trail 3 of 8, in a risk-step note 1 of 8.
- 33 existing test files were updated from the old punctuation to the new. None was loosened.
- Checked live in the app: the healthy 10-year-old and the 30-year-old with diabetes read as
  above, the risk step note reads "interval: ≥8 weeks…", and there were no console errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
