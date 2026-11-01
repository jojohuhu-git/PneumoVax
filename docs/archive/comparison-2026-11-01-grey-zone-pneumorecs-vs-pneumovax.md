# Grey-zone audit: CDC's PneumoRecs next to PneumoVax, 63 patients (2026-11-01)

**Who ran it:** an agent session, at the owner's request.
**Status:** read-only. No app code, clinical rule or verdict was changed. Only new scripts and
documents were added. The test suite was **2,024 passing and 0 failing** at the start
(branch `fix/2026-11-01-rules-page-cdc-recheck`, `9bb68a2`).
**Follows on from:** `comparison-2026-10-25-pneumorecs-vs-pneumovax-66-patients.md`, which
covered the histories CDC states plainly. This one covers histories that **no CDC or ACIP
sentence spells out.**
**Fix queue:** `.claude/prompts/fix-2026-11-01-grey-zone-audit.md`

**To re-run it:**
- `node scripts/pneumoRecsGreyCompare.mjs` puts both tools' answers side by side.
- `node scripts/pneumoVaxFollowAdvice.mjs` follows PneumoVax's own advice forward in time.

---

## The short version

| | Patients |
|---|---|
| Both tools give the same dose | **52** |
| They give a different dose, or one tool can't answer | **11** |
| **Total** | **63** (29 children, 34 adults) |

Of the 11 that differ:

- **PneumoRecs is wrong, or can't be asked, and PneumoVax is right: 6.**
- **PneumoRecs's known rounding defect at an age boundary: 2.**
- **PneumoVax's card leaves out a dose that CDC states: 1.**
- **An open question for you (the two CDC rows disagree): 1.**
- **Both answers are acceptable: 1.** PneumoVax offers PCV20 as well as PPSV23.

**Your three questions, answered:**

1. **Is PneumoVax catching PneumoRecs mistakes?** Yes, in 6 patients. See the first section.
2. **Is PneumoVax pulling from the rulebook correctly?** It gives the **right dose** in every
   grey case except the two marked below. But **3 kinds of card say something in words that
   doesn't match the patient's record.** They reach about 1,100 cards in the test grid.
3. **Are grey cases handled the same way for children and adults, with and without risk?**
   Mostly yes. **One real gap:** an immunocompromised child's card sometimes forgets to say
   that a dose is owed 5 years later. The app then asks for that dose at the next visit, so
   the plan the clinician was shown turns out to be one dose short.

**Nothing found is a P0.** No patient would get a dangerous dose or miss a dose because of
PneumoVax. The worst case is an extra PPSV23 given too early.

---

## How it was done, in one paragraph

63 made-up patients, no real records, in 12 families of "grey" histories:

- doses in the wrong order;
- a PCV15 with no follow-up;
- childhood doses on an adult;
- extra doses;
- PCV21 in a child;
- ages right on a boundary;
- mixed brands;
- adults vaccinated under the pre-2024 schedule;
- more than one risk condition;
- doses too close together;
- an adult-only risk (smoking, alcoholism) in a teenager;
- "complete before 50".

Most families have a child and an adult version. PneumoRecs' answers come from its own code
(all 175 of its answer branches). That method matched the live site 7 out of 7 times on
2026-10-25. **This time no patient was hand-driven on the live CDC site,** because it loaded
blank in the built-in browser. Then a second test, new this time: **"follow the app's own
advice."** For every patient, give the dose the card asks for on the date it gives, re-open
the app on that date, and repeat until the app says "complete". This found the most
important problems. Each card was correct on its own day, but the next visit said something
the first card never mentioned.

---

## 1. Where PneumoRecs gets it wrong and PneumoVax gets it right

| Patient | PneumoRecs says | PneumoVax says | Who's right |
|---|---|---|---|
| **G34**: healthy **5-year-old** (5y 0m), one PCV dose at 2 months | "Give 1 more dose of PCV" | Not indicated | **PneumoVax.** CDC's notes: *"Healthy children ages 2–4 years with any incomplete PCV series: 1 dose PCV."* CDC's catch-up table says the extra dose is only for ages 12–59 months, or 60–71 months **with a risk condition**. PneumoRecs uses one page for all children aged 2 through 5, so it keeps catching up healthy 5-year-olds. |
| **G57**: 4-year-old, chronic lung disease, PCV15 at 3, then PPSV23 **4 weeks** later | "Schedule complete" | The PPSV23 came too soon and doesn't count; give one PCV20 | **PneumoVax** (your ruling of 2026-10-31). PneumoRecs never asks for dates, so it can't see that the PPSV23 came too early. |
| **G42**: 55-year-old with diabetes, PCV15 at 50, then **PCV20** at 54 | Give PPSV23. It asks only "which conjugate: PCV15, or PCV20/21?" and has one answer box. | Complete | **PneumoVax.** The PCV20 already completes the series, so PneumoRecs would add a PPSV23 nobody needs. |
| **G25**: 10-year-old, asplenia, **PCV21 at 9** | Can't be asked: there is no PCV21 answer for a child | That PCV21 doesn't count; give PCV20 | **PneumoVax** |
| **G26**: 17-year-old, chronic lung disease, PCV21 at 16y 8m | Same: can't be asked | Same as G25 | **PneumoVax** |
| **G27**: 18-year-old with diabetes, PCV21 at 18y 1m | Can't be asked | Complete (the dose counts, and the card notes ACIP's age of 19). **But the card's title says "includes PCV20".** See item P2-2. | PneumoVax has the right dose, with wrong wording |

**PneumoRecs' rounding defect, seen again on two adults on the edge of a band.** It rounds a
part-month up:
- **G29**, 18 years 11 months, is shown the adult page.
- **G31**, 49 years 11 months, is shown the 50+ page. For this immunocompromised patient
  that means "PPSV23 1 year after PCV15" where ACIP says 8 weeks at 19–49.

---

## 2. Where PneumoVax needs fixing

Each item has one example patient, what the screen says, what it should say, and how many
of the 17,016 test-grid patients see it.

### P1-1 — An immunocompromised toddler's card leaves out the 5-year dose, and one of its sentences leads to an early second PPSV23

**Patient G01.** She is 4, has asplenia, had a PPSV23 at age 3, and has never had a PCV.

**What the screen says** (checked in the running app):

> Give 2 doses of PCV20 or PCV15, ≥8 weeks after the most recent pneumococcal dose and ≥8
> weeks apart. … If PCV15 is used to complete, add PPSV23 ≥8 weeks after the last PCV.

**What's wrong.**
- **She already has her first PPSV23.** CDC's notes for an immunocompromised child say the
  next PPSV23 comes **≥5 years after the first**. p2016 says the same for this exact
  history: *"(b) give a second dose of PPSV23 five years after the first dose of PPSV23."*
- If the clinician follows the card, she gets a second PPSV23 **15 months** after her first.
  PneumoVax itself then says that dose was *"shorter than the 5 years advised … never give a
  third."*
- **The card never mentions the 5-year dose at all.** CDC's tool does: *"give 1 dose of
  either PCV20 or a second dose of PPSV23 5 years after the first dose of PPSV23."*
- When she comes back after the two PCV15 doses, the app asks for that 5-year dose. So the
  app knows about it; only the first card leaves it out.

**How many:** **366** immunocompromised 2–5-year-old cards carry this sentence, and **none**
mention the 5-year dose. **144** of those children already have a PPSV23 that counts. For
them the "add PPSV23 ≥8 weeks" sentence is wrong.

**Fix:**
- Child with a PPSV23 that counted → replace the sentence with CDC's 5-year wording.
- Child with no PPSV23 yet → keep the 8-week sentence and add *"then PCV20 or a second
  PPSV23 ≥5 years after the first PPSV23"*.

No dose changes, so the verdict corpus should not move.

### P1-2 — Immunocompromised child aged 6–18: is PCV15 plus PPSV23 the end, or does a 5-year dose follow? (YOUR DECISION)

**Patient.** An 8-year-old with asplenia who has never been vaccinated.

**Today's card offers two choices:**
- **Option A:** one PCV20.
- **Option B:** PCV15, then PPSV23 8 weeks later. **It says nothing after that.**

**If the clinician picks Option B,** the app at the next visit says:

> Give ONE further pneumococcal dose — either 1 dose of PCV20 or a 2nd PPSV23 — ≥5 years
> after the first PPSV23 … The row for this history is worded for PCV13. PCV13 and PCV15 can
> be used interchangeably for all recommendations, so it governs this child too.

**Why the two cards disagree.** Two CDC sentences fit this child, and they give different
answers:

- **The row for a child with no earlier PCV.** It stops after the PPSV23:
  *"Not previously received any dose of PCV13, PCV15, or PCV20: administer 1 dose of PCV15
  or 1 dose of PCV20. If PCV15 is used and no previous receipt of PPSV23, administer 1 dose
  of PPSV23 at least 8 weeks after the PCV15 dose."*
- **The row for a child who already has a PCV13 and a PPSV23 given at or after age 6.** It
  adds a third dose: *"Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years:
  administer 1 dose PCV20 or 1 dose PPSV23 … at least 5 years after dose 1 PPSV23."*
  PneumoVax reads PCV15 into this row because of your ruling that PCV13 and PCV15 are
  interchangeable.

**What CDC's tool says.** Patients G28 and G03 both get "Schedule complete": *"If at least 1
dose of either PCV15 or PCV20 was given at any age, schedule is complete."*

**How many:** **222** "Option B" cards for immunocompromised 6–18-year-olds. **216** of them
don't mention the later dose.

**The question for you.** After an immunocompromised child aged 6–18 has had PCV15 and then
PPSV23, is one more dose (PCV20, or a second PPSV23) owed 5 years after the PPSV23?
- **If yes:** the Option B card should say so up front, as the card for a child whose PCV15
  was already on record (G08) does today.
- **If no:** the later card (G03, G08 path B, G25, G28) stops asking for it, and PneumoVax
  agrees with CDC's tool.

At 19 the question disappears: the adult rules call PCV15 + PPSV23 complete.

### P1-3 — An adult who had PPSV23 FIRST and PCV15 later is told "PCV15 followed by PPSV23"

**Patient G04.** 30 years old, diabetes, PPSV23 in Oct 2024, PCV15 in Oct 2025.

**What the screen says** (checked in the running app): the record lists the PCV15 dated
2025, and directly below that it lists the PPSV23 dated 2024. Under both it says:

> PCV15 followed by PPSV23 is a complete pneumococcal series — no further doses needed [1].

**The verdict (complete) is right. The sentence and its citation are not.** The card cites
CDC's "if PCV15 is used, give PPSV23 1 year later" sentence. The row this patient actually
followed is CDC's *"Previously received only PPSV23: 1 dose PCV15 or 1 dose PCV20 or PCV21,
at least 1 year after the last PPSV23 dose. **If PCV15 is used, no additional PPSV23 doses
are recommended.**"* That sentence is already in the app as a source; this card just doesn't
use it.

This breaks your 2026-10-23 rule: cite the row the patient followed.

**How many: 675** test-grid patients.

**Fix:** when the PPSV23 came first, say *"PPSV23, then PCV15 ≥1 year later — complete; no
further PPSV23 is recommended"* and cite that row.
- For a 50+ patient, first read CDC's 50+ "only PPSV23" text and the adult job aid for an
  equivalent sentence, tables included.
- If neither says "no further PPSV23", that is a "no document has a row" question, and it
  comes to you.

### P2-1 — A 49-year-old's date jumps 10 months on the day it falls due (rare; recommend parking)

**Patient G31.** 49 years 11 months, HIV, PCV15 on 2026-10-11.
- **Today's card:** PPSV23 from **2026-12-06** (8 weeks).
- **On 2026-12-06 she has turned 50.** The same app then says **from 2027-10-11** (1 year),
  and adds that 8 weeks "may be considered".

Neither card is wrong by ACIP's wording, but the date she was given moves. This only happens
when PCV15 is given in the 8 weeks before the 50th birthday.

**Smallest fix:** one sentence on the 19–49 card when the 8-week date falls after the 50th
birthday.

### P2-2 — A PCV21 given at 18 is called "PCV20" on the card (rare)

**Patient G27.** 18 years 5 months, diabetes, PCV21 given at 18 years 1 month.
- **The card's title:** "PCV complete **(includes PCV20)**".
- **The card's note** says the history is the one *"CDC's row for an at-risk 6–18 year old
  describes"*, but that row is about PCV20.

This is the same kind of error as FINDING H: never print a product the record doesn't show.
The dose decision (complete) stands. Hand-built patients only; the test grid contains none.

### P2-3 — Immunocompromised child cards say a PPSV23 "completes" the series, next to "then a dose 5 years later"

**Patient G39.** 4 years old, HIV, four PCV15 doses as a baby. The Option B card says:
- *"Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV; **then ≥5 years later
  give 1 dose of PCV20 or a 2nd PPSV23**."*
- and in the same note: *"Either a single dose of PCV20 or **a PPSV23 completes the
  recommended series**."*

For an immunocompromised child, the second sentence contradicts the first. It comes from
ACIP 2023's phrase "using previously recommended dosing and schedules", and the card leaves
that phrase out.

**How many:** **198** immunocompromised cards. **99** of them carry both sentences.

**Fix:** keep ACIP's words *"using previously recommended dosing and schedules"*, or leave
the sentence off the immunocompromised cards.

### P2-4 — Small wording slip on an at-risk 8-year-old

**Patient G21.** Chronic heart disease, PCV20 at 6, then PPSV23 at 7. The card says *"CDC
gives that dose whether or not a PPSV23 was given **earlier**"*, but her PPSV23 was given
**later**.

Correct in substance (the PCV20 completes her series, and the later PPSV23 was an extra
dose), wrong in detail.

### P2-5 — A teenager who smokes or has alcoholism is told "re-evaluate at age 50"

**Patients G58 and G59.** A 16-year-old with alcoholism and a 17-year-old who smokes.
- **The card says:** "Not indicated (healthy 5–18y)", and "Re-evaluate at age 50".
- **The note under it** (`riskAgeNote`) correctly says these are adult risk factors that
  don't change a child's schedule.
- **But at 19 they qualify** under the adult 19–49 risk rules, so "50" is the wrong next
  look.

**Fix:** say "at 19" on the healthy card when an adult-only risk is ticked.

---

## 3. Consistency check: the same grey history in a child and in an adult

| Grey history | Child | Adult | Same treatment? |
|---|---|---|---|
| PPSV23 given before any PCV | PCV ≥8 weeks after the PPSV23 (G02) | PCV ≥1 year after the PPSV23 (G43, G45) | **Yes.** The interval differs because the child and adult rules differ, as CDC writes them. |
| PCV15 given, PPSV23 never followed | PPSV23, or PCV20 at 6–18 (G07, G08, G09) | PPSV23, and PCV20/21 if PPSV23 is unavailable (G10–G12) | **Yes** |
| An unneeded PPSV23 already given | Chip: "not needed … isn't counted, nothing to repeat" (G19) | No chip; the dose silently counts (G20) | **Different, and rightly so.** For an adult that PPSV23 counts at 50 ("PPSV23 only → PCV ≥1 year after"); for a healthy child it never counts. The adult card could mention it; optional. |
| PCV20 then an extra PPSV23 | Complete (G21) | Complete (G22) | **Yes** |
| Two conjugates, one too soon after the other | n/a | Complete, with advice only (G53, your ruling of 2026-10-24) | — |
| PPSV23 too soon after PCV15 | **Doesn't count**; give PCV20 (G57) | **Counts**, with a note "shorter than advised" (G55, G56) | **Different, and by design.** CDC's child catch-up table has a true minimum; adult intervals have none (CDSI sets 0 days). Your decision of 2026-10-24. |
| Several risk conditions | The strongest one wins (G51) | The strongest one wins: a cochlear implant beats diabetes, giving 8 weeks not 1 year (G50 vs G60) | **Yes** |
| Childhood doses, now an adult | — | Adult rules read the childhood doses (G13–G18) | **Yes.** Matches CDC's tool in all 6. |
| Immunocompromised, "what comes after PPSV23" | **Card omits the 5-year dose** at 2–5 (P1-1) and at 6–18 Option B (P1-2) | Adult cards always say it (G13, G46) | **No.** This is the main consistency gap. |
| Pre-2024 adults (PCV13 / PPSV23) | — | All 7 match CDC's tool, including shared decision-making at 65+ (G44, G49) | **Yes** |

---

## 4. Not findings: checked, and fine

- **PCV15 then PCV20 in a child** (G37) and **four baby PCV20 doses** (G40): both complete.
  This agrees with CDC's tool and ACIP 2023.
- **Healthy 4 years 11 months vs 5 years 0 months** (G33, G34): one dose at 4y 11m and none
  at 5y. That is the CDC line.
- **5 years 11 months vs 6 years 0 months**, at risk, with a baby series (G35, G36): the
  same answer on both sides of the 6th birthday.
- **The adult 8 weeks vs 1 year** (G10, G30, G50, G60): your 2026-10-16 decision.
  PneumoRecs still prints its December 2024 sentence.
- **The PneumoRecs comparison for G58 and G59 was not a real difference.** The script
  matched the teenagers' alcoholism and smoking to PneumoRecs' "chronic conditions" page,
  but PneumoRecs offers no alcoholism or smoking answer for children. A real clinician would
  land on its "no risk" page, which gives the same "check at 50" answer.

## 5. Limits of this audit

- **The CDC column was worked out from PneumoRecs' own code, not clicked through live.** The
  live site came up blank in the built-in browser today. That method matched the live site
  7 out of 7 times on 2026-10-25.
- **63 patients is a sample.** The grid counts in each item (675, 366, 222, 198) are
  measured across all 17,016 test-grid patients. **G27 and G31 are hand-built only;** the
  grid can't express those histories.
- **No CDC page was re-read live today.** The CDC quotes above come from the app's own source
  list, which was last re-read live on 2026-11-01, the date of PR #115. Before fixing P1-2 or
  P1-3, re-read the CDC child notes (immunocompromised list) and the adult notes live,
  tables included, as the `verify-clinical-source` skill requires.
