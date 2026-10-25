# CDC's PneumoRecs next to PneumoVax — 66 patients, 2026-10-25

**Who ran it:** agent session, at the owner's request.
**Status:** read-only. No clinical rule was changed and no verdict moved.
**Supersedes** `comparison-2026-10-17-pneumorecs-vs-pneumovax.md` (23 patients), which is
kept because its answers were hand-captured on that date and two of its conclusions are
corrected below.

**Re-run it:** `node scripts/pneumoRecsCompareAll.mjs` (all 66), or with patient ids
(`node scripts/pneumoRecsCompareAll.mjs I12 A07`), or `--group infant`.

---

## The short version

| | Patients |
|---|---|
| Both tools ask for the same thing | **51** |
| Same thing, and PneumoVax also gives the calendar date | **3** |
| They differ | **12** |
| **Total** | **66** |

Of the 12 that differ:

- **6** are patients CDC's tool *cannot be asked about at all* — they were put in on
  purpose to measure that (a transplant patient, a dose typed with next year's date, a
  dose typed before the child was born, and three patients whose doses were given too
  close together).
- **4** are the adult PCV15→PPSV23 interval the owner decided on 2026-10-16. CDC's tool
  is still printing its December 2024 sentence.
- **2 are defects in CDC's tool**, found during this run and reproducible by anyone.
  Both are described below. Neither is a PneumoVax bug.

**Nothing in this run looks like a PneumoVax clinical error.** Two PneumoVax *wording*
items are listed at the end for the owner to decide on; neither changes a dose.

---

## How the comparison was made, and why you can trust the CDC column

Driving CDC's tool by hand takes about ten clicks per patient, so 66 patients would have
been a day's work and still only covered 66 of its answers. Instead:

1. **CDC's tool was read out of its own code.** All **175** of its recommendation
   branches — the exact answers it can print, and what you must answer to reach each one —
   were extracted from the seven scripts the live site loads. They are in
   `scripts/pneumorecs/branches.json`, and in plain English in
   `scripts/pneumorecs/pneumorecs-rulebook.txt`.
2. **19 of those 175 are dead** — you cannot reach them, either because the answer button
   exists only inside an HTML comment or because the question is never asked. They are
   marked and excluded, with the measured reason recorded against each.
3. **Each of our 66 patients is resolved by answering CDC's questions from their dose
   dates**, then taking the first branch CDC's own if/else order allows.
4. **Seven patients were then driven by hand through the live site** — one per page — and
   **all seven printed exactly the string this method resolves.** The captures, with the
   answers clicked, are in `scripts/pneumorecs/live-captures-2026-10-25.json`.

Two mistakes were made and caught during the build, and both are worth remembering:

- **The pages carry superseded markup inside HTML comments.** A first pass read the
  comments and "found" a bug — that CDC had relabelled an answer without renumbering it —
  which does not exist. Read the live DOM, or strip comments first.
- **The same element id means different things on different pages.** `chk-groupC` is
  "immunocompromising" on the adult pages; the teen page uses `chk-risk-Egroup`. Matching
  on the label alone put three at-risk children on superseded branches whose footnote
  still read *"PCV includes PCV7, PCV13, and PCV15"*.

---

## Two defects in CDC's PneumoRecs, found in this run

### 1. It drops a dose for most 11-month-olds (and mis-sorts most 23-month-olds)

CDC's tool picks which rulebook to use by **rounding a part-month up**. So:

| The child | The rulebook it is handed | What it is told |
|---|---|---|
| 11 months **+ 0 days**, no prior PCV | 7–11 months (correct) | **"Give 3 doses of PCV"** |
| 11 months **+ 1 day**, no prior PCV | 12–23 months | **"Give 2 doses of PCV, 8 weeks apart"** |

Both captured live on 2026-10-25, one day of birth date apart. The second answer is the
12–23-month rulebook, while the tool's own printout on that page says
*"Age: 0 years, 11 months, 1 days"*.

That is not a rare edge: it is every day of the month except the birthday — **29 days in
30** — for every child in the last month of a band. The same happens at the top of the
12–23 month band: a child of 23 months + 1 day is handed the 2–5 year rulebook.

PneumoVax gives the same answer on both sides of both edges (3 doses at 11 months, 2 at
23 months, whatever the day).

**Patient I13 in this run is a real example**: an 11-month-old whose only doses were PCV7
(which neither tool counts). CDC's tool says 2 doses; PneumoVax says 3. The whole of the
difference is the rounding.

### 2. On the 50-and-over page it never asks about risk conditions — and says so by accident

The 50+ page has a risk-condition question built into it, and **it is never reached**.
Driven live twice:

- a 50+ patient with nothing given → the printout reads **"Risk Factors: N/A"**
- a 50+ patient with PCV13 and a PPSV23 given before 65 → the printout reads
  **"Risk Factors: Risk factors"** — the literal heading, printed where the answer should be

The consequence is that **13 of the 23 branches in that page's script can never fire**,
including the one that offers an immunocompromised patient a second PPSV23 as the
alternative to PCV20/PCV21. For the patients in this run it changes no dose, because the
branch that does fire gives the same conjugate dose — but the option ACIP offers is not
reachable, and the printed patient summary is wrong.

---

## The four adult patients where the two tools genuinely differ

All four are the **PCV15 → PPSV23 interval at ages 19–49**, and all four are the owner's
decision of 2026-10-16 (`CLAUDE.md`, §S15).

| | PneumoVax | PneumoRecs |
|---|---|---|
| A02 — 30y, HIV, nothing given | PPSV23 **≥8 weeks** after PCV15 | "recommended … **at least 1 year**. The minimum interval is 8 weeks and **can be considered** in adults with immunocompromising conditions, cochlear implants, or cerebrospinal fluid leaks" |
| A04 — 30y, cochlear implant | **≥8 weeks** | identical sentence |
| A05 — 30y, CSF leak | **≥8 weeks** | identical sentence |
| A07 — 40y, HIV, PCV15 two months ago | PPSV23 **due today** | same sentence; no date |

**The control works.** A03 (30y, diabetes) and A06 (45y, smoker) get **≥1 year** from
PneumoVax — and there the two tools agree. So the difference is exactly the risk-class
split, nothing else.

**Why PneumoVax is not wrong here.** ACIP's January 2025 table uses a different verb per
age band — "**administer** a single dose of PPSV23 **≥8 weeks** after" at 19–49 for
immunocompromising conditions, cochlear implants and CSF leaks, against "should be
administered **≥1 year** … a minimum interval of 8 weeks **can be considered**" at ≥50.
CDC's tool prints the ≥50 sentence at both ages. Its own page metadata reads
**`cdc:last_updated content="December 15, 2024"`** — older than the January 2025 ACIP
paper and the March 2025 job aid PneumoVax follows.

### A correction to the 2026-10-17 write-up

That document said the 19–49 page "asks a single yes/no question … There is **no** second
question", so the tool "cannot tell these two patients apart even if it wanted to". **Half
of that is wrong.** The first risk question is indeed a merged yes/no, but a patient who
has already had a PPSV23 **is** then asked *"Which of the following risk conditions does
your patient have?"* with chronic / CSF-leak-or-cochlear / immunocompromising as separate
answers. Verified live on 2026-10-25 with an HIV patient (capture LIVE-5).

So the tool **can** split the three groups — just not on the path where the split would
change the PCV15→PPSV23 interval. The conclusion of the older document (no PneumoVax bug)
is unchanged; its stated reason was too strong.

---

## The six patients CDC's tool cannot be asked about

These were built on purpose to measure the gap, not to catch anyone out.

| | What PneumoVax does | What PneumoRecs does |
|---|---|---|
| **X01** 40y, HIV **and** a stem-cell transplant | Stops. Names ASCO/NCCN/IDSA/CDC and gives no schedule | Has no such question; gives the ordinary adult schedule |
| **X02** 15-month-old, PCV20 typed as **2027** | Rejects the dose, says the date is in the future, explains how to fix it | Counts it as given |
| **X03** 30y HIV, PCV15 **today** | PPSV23 **from 2026-12-20** | "Give one dose of PPSV23 to complete" — no date |
| **X04** 5y asplenia, two PCV20 **14 days apart** | Rejects the second dose, still asks for dose 2 | Counts both; the schedule reads complete |
| **X05** 60y, PPSV23 **3 months** after PCV13 | Rejects the PPSV23, re-anchors the next dose to it | Counts it; says complete after one more |
| **X06** 2-year-old, PCV20 dated **before birth** | Rejects it and says why | Counts it as a dose given before 12 months |

And one patient who is not synthetic at all:

**I12 — the 15-month-old with asplenia the owner herself worked through on 2026-10-23.**
Three PCV20 doses at 28-day gaps. **CDC's tool says "Schedule complete."** PneumoVax says
the third dose does not count (30 days where CDC's minimum is 8 weeks) and one more dose
is owed today. The tool is never told the dates, so it counts three doses and stops. This
is the single clearest illustration of the difference between the two tools, and it is the
owner's own patient.

---

## What the two tools are actually for

CDC's PneumoRecs answers **"what does the schedule say for a patient like this?"**
PneumoVax answers **"what does this patient need today, given these exact dates?"**

Four things CDC's tool never asks, measured across all 175 of its branches:

1. **When any dose was given.** Not once, on any page. It asks how many doses fall inside
   an age bracket — "how many before age 12 months", "how many between 24 and 71 months" —
   and whether a PPSV23 was before or after 65. That is the whole history model. So it can
   print "at least 8 weeks after the most recent dose" as advice, but it can never tell you
   that the dose already in the record came too soon. Every interval check in PneumoVax
   (`doseIntervalRules.js`, `validate.js`, the 4-day grace, floor vs recommendation) has no
   counterpart in it and cannot be validated against it.
2. **Today's date.** Every PneumoRecs answer is written as if it were being read on the day
   the next dose is due. PneumoVax has to answer on an arbitrary Tuesday, which forces
   "due now" apart from "due, but not until 2030".
3. **More than one risk condition.** It says so itself: *"Recommendations will be based on
   the leading risk factor selected."* PneumoVax carries every ticked factor through.
4. **The patient's actual age, once they are adult.** The adult pages are entered by
   choosing a band; the age in the URL is literally the text "19 through 49 years". That is
   why it can only say "check this app when your patient turns 50" and PneumoVax can give
   the date.

A fifth, found this time: **it cannot be asked about a transplant**, which is the one
answer PneumoVax deliberately refuses to give.

---

## Three cautions if anyone repeats this

1. **The adult birth-date entry is still broken.** Re-measured 2026-10-25: entering any
   birth date for a patient aged 19+ redirects to `years19-64.asp` or `over65yr.asp`, and
   **both are 404** — they are the pre-October-2024 bands. Children 0–18 work. For adults
   use `agegroup.html`.
2. **Never hand an age to a page built for another band.** It will render and look like a
   real answer.
3. **A disagreement is not automatically a PneumoVax bug.** The tool is a December 2024
   snapshot. Check whether the governing source is newer — for every adult interval, it is.

---

## Two PneumoVax wording items for the owner — no dose changes

Neither changes what anyone is given. Both are listed because CDC's tool words them better.

1. **A healthy 5-year-old who finished the full 4-dose series** (patient H02). PneumoVax
   says *"Not indicated (healthy 5–18y)"*. CDC's tool says *"Schedule complete."* Both mean
   "give nothing", but PneumoVax's wording does not acknowledge that the child actually
   finished the series — a clinician could read "not indicated" as "we never offer this".
2. **A 25-year-old with asplenia who has had PCV20** (patient A13). PneumoVax says
   *"Complete"*. CDC's tool says no vaccine now **and** "check this app when your patient
   turns 50". Worth deciding whether PneumoVax should say anything about age 50 here.

And one item carried over from 2026-10-17 that **is now confirmed still present**: a
**PCV-naive 2-year-old** (patient H03) is told *"Give 1 dose of PCV15 or PCV20, **≥8 weeks
after the most recent PCV**"* and the recommendation carries a 56-day minimum — when there
is no most recent PCV. The 11-month and 23-month cards get this right ("There is no earlier
dated dose to measure an interval from"); the 24–59-month catch-up card was not swept up by
C12. Fix-queue item, wording only.
