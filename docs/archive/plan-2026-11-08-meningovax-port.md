# Plan — bringing PneumoVax's way of working to MeningoVax (DRAFT, 2026-11-08)

**Status: draft for the owner to review. Nothing in MeningoVax has been changed.**
MeningoVax repo: `/Users/joannehuang/Downloads/MeningoVax-main`, `main` at `c1118c1` (2026-10-17).
PneumoVax has merged 81 commits since that date. This is the one real plan for the port; when
work starts, MeningoVax gets a pointer file to it, not a copy (memory `both-apps-docs-are-pointers-not-copies`).

## The goal, in the owner's words (2026-11-08)

> The goal with meningovax is the same as pneumovax. The goal apps is to use age, risk factors
> and prior vaccine history to help assess the appropriateness of prior doses given as well as
> forecast when and what subsequent doses are due. The recommendations should all be pulling
> from the rulebook. Dates or ages when next doses are due should be clearly stated under
> recommendations. Any dose that does not follow standard schedules should have some feedback as
> to if the dose is counted but unnecessary/extra or if doses are valid based on standard/catch up
> schedules, or if doses are valid based on app specific guidance. Invalid doses should also be
> flagged as to whether they should be repeated or not repeated in future doses. Explanations
> under why this or next to dose chips should be stated in simple clear clinical language and
> should not sound AI generated.

## Ground rules for every step

- **Port the rule, not the code.** The two engines are different shapes. Each step starts by
  reading MeningoVax's own `recommend.js` / `validate.js` for that behaviour (memory
  `read-the-engine-before-offering-options`).
- **Nothing pneumococcal carries over.** p2016, PCV7, the PCV15→PPSV23 pairing, the IC/non-IC
  child split, the thrown-out PPSV23 rulings: none of these exist in meningococcal vaccination.
- **Meningococcal rules are read live** from CDC/ACIP before any clinical change
  (`verify-clinical-source` skill). A PneumoVax ruling is never applied to MeningoVax as if
  it were a meningococcal one; where the same QUESTION comes up (for example "is a dose given too
  soon repeated?"), it is put to the owner with a meningococcal patient.
- **One PR per step**, `fix-queue` loop: reproduce, failing test, fix, full suite, break each new
  clause, check in the running app.
- Mirror files stay identical (`dateUtils.js`; the transplant hard stop) — already enforced by tests.

## What MeningoVax has today, against each part of the goal

Surveyed 2026-11-08 by reading the code; each line still to be measured before its step starts.

| Part of the goal | PneumoVax now | MeningoVax now |
|---|---|---|
| Every rule from the rulebook | `CLINICAL_SPEC.md` + a test comparing its rule table to the code cell by cell | `docs/agent/meningococcal-rules-summary.md` + `rule-docs-match-code.test.js` (exists — scope not yet checked) |
| One place for every interval rule | `doseIntervalRules.js`, each row marked "voids the dose" or "advice only" | No table; intervals are spread through `validate.js` (1,346 lines) and `recommend.js` |
| A changed answer cannot slip through | Two committed verdict lists (17,016 real + 18,264 impossible patients) and a prose diff | A shared test grid (`src/test-grid.js`) and three sweeps, but no committed verdict list and no prose diff |
| The app agrees with itself | Seven whole-app checks over 77,496 patients, four of them required tests | None |
| Dates clearly stated | "Next dose due <date>" (Remy, 2026-11-07); the routine date advised, the minimum stated beside it | "Next dose not yet due - eligible <date>" (`RecCard.jsx:472`) |
| Repeat dose measured from the dose given (Ruling D) | Yes | **No** — measured 2026-11-01: a 20-year-old with asplenia, Menveo 8/1 then 8/22, is advised 9/26; CDC's rule gives 10/17 |
| Every recorded dose gets one label from a closed list | Yes (§M): counted / extra / valid by catch-up / valid by app rule / not counted–repeat / not counted–do not repeat / record problem | Partly: `doseChipLabel.js` has "Extra dose", "Dose N of M", record problems — but one plain "Invalid" with no repeat / do-not-repeat split |
| Plain clinical wording | Her §M-L3 style rules, swept by test | "Why this" lead/detail split exists; no style rules applied |
| Short card with details behind "Why this" | The fold (WORD-1) — **she chose "PneumoVax only" on 2026-11-06** | Not folded |

## Proposed order (one PR each)

**Step 1 — Safety nets first.** A committed verdict list for MeningoVax's grid (real patients, and
impossible entries in a second file), the prose-diff script, and its own whole-app checks
(advice is accepted; the plan holds; complete means complete; card and chip agree; stable over
time). No clinical change. Every later step then shows exactly which patients it moved.
*Why first:* in PneumoVax, two changes each moved thousands of answers while the older checks
stayed green.

**Step 2 — One table for every interval rule.** Move MeningoVax's spacing rules into one table
like `doseIntervalRules.js`, each row saying which schedule states it and whether it voids the
dose or is advice only. Verdict list must not move (a pure move).

**Step 3 — Ruling D: measure a repeat from the dose given.** Already measured above. **Owner
decision needed** — the 2026-11-01 question was never answered. Ask with the asplenia patient.

**Step 4 — One label per recorded dose, and repeat / do not repeat.** The closed label list,
with "Not counted — repeat" and "Not counted — do not repeat" split, and "valid by catch-up" /
"valid by app rule" named. **Owner decision needed per family** where meningococcal guidance
does not say whether a dose is repeated (to be listed after reading MeningoVax's invalid paths).

**Step 5 — Dates stated plainly.** "Next dose due <date>"; the routine date advised and the
minimum stated beside it where both exist (MenB dose 3, MenACWY boosters).
**Owner decision needed:** whether MeningoVax advises a routine date at all where today it states
only the minimum.

**Step 6 — Wording.** Her §M-L3 style rules and the "Why this" rules applied to every card and
dose line, with the same sweep test. Whether to fold the result page is **her decision** — her
2026-11-06 answer was "PneumoVax only".

**Step 7 — The rulebook.** A MeningoVax `CLINICAL_SPEC.md`-style rulebook with every rule and its
source, held to the code by test, and the in-app Rulebook page if she wants it there too.

**Step 8 — Citations (C2–C8 of the 2026-10-16 citations plan).** Each card credits only the
documents that speak for it. MeningoVax has done C1 only. Last, because it is the largest and
depends on steps 4–7 having settled the wording.

## Decisions for the owner before or during the port

1. Does this order suit you, or should anything move first? (Recommended: safety nets first.)
2. Ruling D for MeningoVax (step 3).
3. Advise a routine date as well as the minimum (step 5)?
4. Fold MeningoVax's result page like PneumoVax's (step 6)? Last answer: PneumoVax only.

## Not in this plan

- PneumoVax's remaining open item, R4's "Max" family (`CLINICAL_SPEC.md` §C-P2-R4), is a
  PneumoVax decision and is asked separately.
- The 23 "Why this" paragraphs over 60 words in PneumoVax.
