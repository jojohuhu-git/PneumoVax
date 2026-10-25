# PneumoRecs VaxAdvisor next to PneumoVax — 23 patients, both tools, one day

**Date:** 2026-10-17. **Who ran it:** agent session, at the owner's request.
**Status:** read-only comparison. No clinical logic was changed and nothing was committed.

**Re-run the comparison yourself:** `node scripts/pneumoRecsCompare.mjs`

## What was actually done

For 22 synthetic patients I answered CDC's PneumoRecs VaxAdvisor
(https://www2a.cdc.gov/vaccines/m/pneumo/) question by question in a browser and copied
down the recommendation it printed. Then I put the same patient through PneumoVax's
`recommend()` with `today` fixed to 2026-10-17 — the same day — and set the two answers
side by side. Every `cdc:` string in `scripts/pneumoRecsCompare.mjs` is a quote read off
the live tool on that date, not something recalled or inferred.

No PHI. Birth dates and dose dates are synthetic and chosen to land exactly on the ages
the comparison needs.

## Headline

**21 of the 23 rows agree. Both disagreements are the same rule, and it is the
rule the owner decided on 2026-10-16 (S15).**

| | Count |
|---|---|
| Rows where the two tools say the same thing | 21 |
| Rows where they differ | 2 (A2, A4) |
| Differences that look like a PneumoVax bug | 0 |

## The two disagreements

Both are adults **aged 19–49 with an immunocompromising condition** who are offered
PCV15, and both concern one number: how long until the PPSV23 that follows it.

| | PneumoVax | PneumoRecs |
|---|---|---|
| A2 — 30y, HIV, nothing given | "If PCV15 is chosen, follow with PPSV23 **≥8 weeks** later" | "The recommended interval … is **at least 1 year**. The minimum interval is 8 weeks and **can be considered** in adults with immunocompromising conditions, cochlear implants, or cerebrospinal fluid leaks." |
| A4 — 40y, HIV, PCV15 two months ago | PPSV23 **due now** (≥8 weeks, 61 days elapsed) | "Give one dose of PPSV23 … recommended interval … at least 1 year. The minimum interval is 8 weeks and can be considered…" |

### Why this is not a PneumoVax error

Three things, each checkable:

1. **The CDC tool's own disclaimer says "app last updated December 2024."** The sources
   PneumoVax's 8-week rule rests on are **mm7401a1 (ACIP, January 2025)** and CDC's
   **Adult Pneumococcal Vaccine Timing Job Aid (NCIRD, March 2025)**. Both are *newer than
   the tool*. The tool is still speaking the language of rr7203a1 — "minimum interval…
   can be considered" — which `CLAUDE.md` records as superseded.
2. **The tool prints the identical sentence at 19–49 and at ≥50.** I captured both. Apart
   from a footnote number they are character-for-character the same. mm7401a1's whole
   point is that the two bands read *differently* — "administer … ≥8 weeks after" at
   19–49 IC/CSF/cochlear, versus "should be administered ≥1 year … a minimum interval of
   8 weeks can be considered" at ≥50.
3. **The tool cannot tell the two patients apart even if it wanted to.** At 19–49 it asks
   a single yes/no question — "Does the patient have any of the following risk
   conditions?" — over one merged list that mixes alcoholism and smoking in with HIV,
   asplenia and cochlear implants. There is no second question. So a 30-year-old with
   diabetes and a 30-year-old with HIV walk the same path and get the same printout.
   That is why row **A3** exists in the comparison: same CDC answer for both, while
   PneumoVax says ≥1 year for the diabetic (**agreeing with CDC**) and ≥8 weeks for the
   HIV patient (the one disagreement).

So the shape of the difference is: PneumoVax splits a group that PneumoRecs merges, and
for the half PneumoRecs can still speak to, the two agree.

**No change recommended.** `CLAUDE.md` already says not to re-flatten this without a new
owner decision, and this comparison is evidence for the decision as it stands, not
against it.

## What PneumoRecs independently confirmed

These are PneumoVax rules that CDC's tool reproduced, in its own words, from a separate
code base. Where a rule shipped recently, the commit is named.

| PneumoVax rule | PneumoRecs, verbatim |
|---|---|
| **FINDING A** (shipped 070f333, 2026-10-17): an immunocompromised child who already had PPSV23 waits **five years**, not eight weeks | 8y, immunocompromising, PCV13 series + 1 PPSV23 → *"give either 1 dose of PCV20 or a second dose of PPSV23 **5 years after the first dose of PPSV23**"* |
| The **IC / non-IC split** — the IC half owes one more dose | Same 8-year-old with a **chronic** condition instead → *"**Schedule complete.**"* The 5-year sentence appears only on the immunocompromising branch. Both branches captured; this is the control case. |
| **PCV7 never counts** | Footnote on the 6–18y at-risk card: *"PCV15 or PCV20 should be administered **regardless of prior PCV7 receipt**."* |
| **"NO OPTION B" for a PCV13-only adult** (`CLAUDE.md` lists this as an obsolete finding not to "fix") | ≥50, PCV13 only → *"Give one dose of **PCV20 or PCV21** at least 1 year after PCV13."* PCV15 is not offered. |
| **≥50 keeps the 1-year interval with 8 weeks named as an option** (the other half of S15) | ≥50, naive → *"recommended interval … at least 1 year. The minimum interval is 8 weeks and can be considered…"* PneumoVax: "PPSV23 ≥1 year after PCV15". Match. |
| PPSV23 at/after 65 moves the extra dose to **shared clinical decision-making** | 70y, PCV13 + PPSV23 at 66 → *"**Based on shared clinical decision-making**, decide whether to administer one dose of PCV20 or PCV21 at least 5 years after…"* PneumoVax status: `shared-decision`. Match. |
| PPSV23 before 65 keeps it a **routine** recommendation | 70y, PCV13 + PPSV23 at 60 → *"**Give** one dose of PCV20 or PCV21 at least 5 years after the last pneumococcal vaccine dose."* PneumoVax status: `due`. Match. This is the case the old handoff flagged as a PROXY divergence (adultCases.mjs A15) — **it is not a divergence.** |
| A PCV15 given after PPSV23 completes the series with no second PPSV23 | ≥50, PPSV23 only → *"Give one dose of **PCV15**, PCV20, or PCV21 at least 1 year after the last dose of PPSV23. Regardless of which vaccine is used, their pneumococcal vaccinations are complete."* PneumoVax says the same, and says why: "the PPSV23 requirement is already met." |
| Healthy 5–18 year olds are not caught up | 10y healthy → *"No vaccine recommended at this time."* |

## Why PneumoVax is so much harder to make accurate

This is the part worth internalising. **PneumoRecs is not a smaller version of PneumoVax.
It is a different kind of tool**, and almost all of PneumoVax's difficulty lives in the
gap. Four questions PneumoRecs never asks:

### 1. It never asks *when* a dose was given

Not once, in any branch, for any patient. It asks:

- "Has the patient ever received PCV13?" — yes/no
- "How many doses were given before age 12 months?" — 0/1/2/3
- "How many prior doses of PPSV23?" — 0/1/2

That is the entire history model: **counts inside age brackets**. The two exceptions are
coarse age-at-dose questions — "Was PPSV23 given at or since age 65?" and "Did the patient
only receive PCV13/15/20 before age 72 months?" — and even those are yes/no.

The consequence: **PneumoRecs cannot check an interval, so it never has to.** It can print
"at least 8 weeks after the most recent dose" as advice, but it can never tell you that
the dose already in the record came too soon and does not count. PneumoVax takes dated
doses, so it must decide, for every pair of doses, whether the gap was long enough — which
is the entire reason `doseIntervalRules.js`, `validate.js`, the 4-day grace, and the
floor-versus-recommendation distinction exist. None of that machinery has any counterpart
in CDC's tool, and none of it can be validated against it.

### 2. It never has to say "not yet"

Every PneumoRecs answer is written as if the recommendation were being read on the day the
next dose is due. PneumoVax has to answer on an arbitrary Tuesday, which forces a
distinction the CDC tool does not have: **due now** versus **due, but not for another
four years**. In case A4, PneumoVax's answer turns on whether 61 days has passed; in P10 it
has to say the five-year clock started last year and ends in 2030. "At least 5 years after
the first dose of PPSV23" is a sentence; "due 2030-10-17" is a calculation.

### 3. It answers one patient per question, never two conditions at once

When more than one risk box is ticked, the tool says so out loud: *"Recommendations will be
based on the leading risk factor selected."* It picks one and discards the rest. PneumoVax
carries every ticked factor through the engine. That is more honest and much harder.

### 4. It stops at the band boundary instead of looking ahead

At 19–49 with no risk factors the tool prints *"No vaccine recommended at this time. Check
this app when your patient turns 50 years old."* It has no idea when that is — it never
learned the patient's age, only their band. PneumoVax knows the birthday, which is why it
can say *review at 50* with a date, and why FINDING E (commit 4d2a2b7 — an at-risk baby
told nothing about the dose due at age 2) was a bug here and is simply absent from
PneumoRecs: for children under 24 months the tool **never asks about risk conditions at
all**, so it cannot mention a dose that becomes due later.

### The one-line version

PneumoRecs answers *"what does the schedule say for a patient like this?"*
PneumoVax answers *"what does this patient need, today, given these exact dates?"*
The second question contains the first, plus every interval, every validity check, and
every clock.

## If you use PneumoRecs to validate PneumoVax — three cautions

1. **The adult birth-date entry is broken. Use the age-group front door.** Entering any
   birth date for a patient aged 19 or over redirects to `years19-64.asp` (ages 19–64) or
   `over65yr.asp` (65+) — and **both pages are 404**. Those are the *pre-October-2024* age
   bands; the live pages are 19–49 and ≥50. Measured today: 18y → works, 19y → 404, 49y →
   404, 50y → 404, 65y → 404. Children 0–18 by birth date work normally.
2. **Never hand an age to a page built for another band.** Jumping directly to
   `child-groupA.asp` with "8 years, 0 months" renders the **2–5 year** rulebook, prints
   "Age: 8 years" at the top, and looks like a real answer. It is not: 6–18 year olds live
   on `teen-riskfactors.asp` and get a different recommendation (1 dose, not 2). I made
   this mistake during this session and caught it only by re-entering through the calendar.
   Always enter through `calendar.asp`.
3. **A disagreement is not automatically a PneumoVax bug.** The tool is a
   December-2024 snapshot. Before changing anything, check whether the governing source is
   newer than the tool — which, for every adult interval, it now is.

## One PneumoVax observation, not diagnosed and not fixed

Two PCV-naive children get differently careful wording about an interval that has nothing
to measure:

- **15mo, no prior PCV** → *"**There is no earlier dated dose to measure an interval
  from**; the final/booster dose is given at ≥12 months."*
- **2y (24mo), no prior PCV** → *"Give 1 dose of PCV15 or PCV20, **≥8 weeks after the most
  recent PCV**"* — and carries `minIntervalDays: 56` — when there is no most recent PCV.

The recommendation itself (1 dose) matches PneumoRecs. Only the sentence is odd. Flagged
here for a fix-queue pass rather than changed, because this session was asked to compare,
not to fix.
