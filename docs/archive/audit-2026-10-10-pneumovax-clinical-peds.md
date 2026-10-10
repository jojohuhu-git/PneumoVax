# PneumoVax clinical audit — paediatric PCV pathways (S1)

**Written:** 2026-10-10
**Session:** S1 of the 13-session queue in
`.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`
**Model/effort:** Opus 5, max
**Baseline:** `main` @ `821ab9c`, clean tree, **11 test files / 156 tests green**
(verified by running `npm test` at 12:27 PDT, not recalled)
**Scope:** `pcvInfant`, `pcvRiskChild`, `pcvHealthyChild`, `pedsRiskRowClass` — read-only.
**No code was changed.** Nine scratch probe scripts and one scratch UI test were written,
run, and deleted; the tree is clean.

---

## ⚠️ CORRECTED 2026-10-10 (later same-day session) — the two "owner decisions" were not decisions

A later session **re-fetched the sources live and disproved both open decisions in this
file.** Read these corrections before acting on P1-3 or P2-1.

- **P1-3 is NOT a tier-1 source conflict — it is part of P0-2.** This audit compared the
  code against p2016's one-line *footnote* (Q13) and against CDC Table 2, and missed that
  **p2016 Table 1's own grid already keys on the age at which the previous doses were
  given** — it has sub-rows `1 at age 7 months or older` and `2 at age 7 months or older`.
  For the 10-month-old with doses at 7mo and 9mo, p2016 Table 1 and CDC Table 2 **agree**:
  1 additional dose, ≥8 weeks later, at age 12–15 months — series total **3**. The real
  engine returns `PCV dose 3 of 4`, `minIntervalDays: 28`, `dueToday: true`. **The app
  matches neither source.** There is nothing for the owner to arbitrate.
- **P2-1 is NOT a source choice either — it is downstream of P0-2.** The child with 2
  doses before 12 months and a third at 18 months **completed p2016 Table 1's series**:
  row `12 through 23 months` / `2 or 3 before age 12 months` → "1 additional dose, at
  least 8 weeks after most recent dose", under the column heading "Number PCV15 or PCV20
  doses to complete series by age 24 mos". They were never a catch-up case. The app's dose
  *count* (1 more) is defensible; the *route* it takes is not, and its 4-dose "complete"
  test is wrong for a path whose correct total is 3.

**Owner decisions needed: 0.** Both resolve once P0-2 rebuilds `pcvInfant`'s targets from
p2016 Table 1 rather than from the footnote plus a formula.

### ⚠️ Finding-ID collision — read before quoting any ID from this file

This audit's IDs are **not** the interface-parity queue's IDs. Two different documents
independently use `P1-3` and `P2-1`:

| ID | In **this audit** (clinical) | In `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (interface parity) |
|---|---|---|
| `P1-3` | PCV minimum interval keyed on current age | "A row nobody typed in is counted as a dose" |
| `P2-1` | `before24 >= 3` vs "3 doses, all before 12 months" | "The test suite is graded against the real clock" |

**Always qualify the ID with its document** — e.g. "audit P1-3" vs "queue P1-3" — in
commits, PR bodies and handoffs. The queue file is git-ignored, so only this note travels
with the repo.

### Source vintage — verified live, satisfies the owner's pin

Re-fetched 2026-10-10, not recalled:
- **p2016**: Item #P2016, dated **2/16/2024**.
- **CDC catch-up page**: serves the **July 2, 2025** schedule. Its banner records that the
  preliminary order of **16 March 2026** in *American Academy of Pediatrics et al. v.
  Kennedy et al.*, No. 1:25-cv-11916 (D. Mass.) **stayed every ACIP vote from the June,
  September and December 2025 meetings** and **stayed the Acting CDC Director's 5 January
  2026 decision memo**.

So no rule in this audit derives from anything after mid-2025, and the owner's
"nothing from the 2026 administration" condition is met by the live pages themselves.

**⚠ Unqueued risk — no tripwire exists.** That stay is temporary. If it is lifted, CDC's
page content can change **without its URL changing**, and nothing in the app would notice.
Storing the verified schedule date ("July 2, 2025") and flagging any change is not yet
queued work.

---

## Plain-English summary for the owner

I checked the app's four paediatric decision paths against the CDC and immunize.org pages
they cite, fetched live today, and then ran the real engine on patients built to land on
each rule.

**Eight things are wrong. Three of them are serious.**

The worst one: **an immunocompromised child aged 6–18 is told their pneumococcal series is
"complete" when both of the app's own cited sources say another dose is still owed.** A
child with no spleen, or with sickle cell disease, or on chemotherapy, who had their PCV
shots before age 6 and one PPSV23, still needs a PCV20 (or a second PPSV23) five years
after that PPSV23. The app says "No further PCV or PPSV23 is needed." The clinician has no
way to know it is wrong. The correct rule is *already written* eleven lines further down in
the same file — an earlier `return` statement runs first and hides it.

Second: **the app gets the infant series total wrong in 5 of the 14 cases** in the
immunize.org table it cites. It always says the child needs *more* doses than they do —
"dose 2 of 4" where the table says 3. Nobody is harmed by an extra PCV dose, but the number
on the screen is wrong and nothing flags it.

Third: **the adult-only risk trap (P3-9b) is live right now** — not waiting to be switched
on by a future design change, as the queue document assumed. I proved this by driving the
real app: enter age 25, tick "Cigarette smoking", go back, change the age to 15. The
checkbox disappears, but the tick stays, and the 15-year-old is handed a full at-risk
catch-up PCV regimen. Changing the age never clears the risk list.

There is also some genuinely good news: **nine rules I expected to be shaky are exactly
right**, including the two the queue asked me to question. They are listed in
§"Verified correct" so no future session re-audits them.

---

## Authority note — the live CDC pages agree with the owner's pinned vintage

The owner's standing rule is to use the CDC 2025 schedule plus AAP, and not ACIP/CDC
changes after mid-2025. The live CDC child schedule page carries this banner today:

> "Pursuant to the preliminary order issued on March 16, 2026, in American Academy of
> Pediatrics et al. v. Kennedy et al., No. 1:25-cv-11916 (D. Mass.), which stayed all votes
> taken by the ACIP during its June, September and December 2025 meetings, and further
> stayed the Acting CDC Director's January 5, 2026 Decision Memo revising the CDC's
> childhood immunization schedule, the July 2, 2025 immunization schedule posted here is
> the current CDC Child and Adolescent Immunization Schedule by Age for Healthcare
> Professionals."

So the page CDC serves today **is** the July 2, 2025 schedule, and the post-mid-2025 ACIP
votes are judicially stayed. The owner's pin and the live page do not conflict, and nothing
in this audit depends on a post-mid-2025 change. Every quote below is from that schedule.

AAP: no AAP paediatric pneumococcal position was found that disagrees with the CDC text
quoted here, so under the tiebreak rule CDC/immunize.org stands. (AAP is a plaintiff in the
order above, which stayed the revisions *toward* fewer doses — consistent with the owner's
"never adopt a revision recommending fewer doses than AAP" rule.)

---

## Sources fetched live 2026-10-10 (for the S8 `lastVerified` + `quote` sweep)

| Ref key | URL | lastVerified | Status |
|---|---|---|---|
| `cdcChildPneumo` | https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo | 2026-10-10 | Fetched, full text read. Schedule date **July 2, 2025** |
| `p2016` | https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf | 2026-10-10 | Fetched, text extracted. **Item #P2016 (2/16/2024)**, 2 pages, Tables 1–4 |
| CDC Table 2 (catch-up) | https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html | 2026-10-10 | Fetched. "Addendum updated July 2, 2025" |
| `cdcAdultPneumo` | https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo | — | **Not fetched — S2's scope** |

Note for S8: `cdcChildPneumo`'s URL is correct but the **page's own content is behind an
accordion**; `curl` returns an Akamai "Access Denied" (403). It must be read with the
browser pane, expanding "Expand All" first. Record that in the citation tooling or the
freshness test will not be automatable by `curl`.

### Verbatim quotes this audit rests on

**Q1 — CDC child notes, minimum ages:**
> "(minimum age: 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23])"

**Q2 — CDC child notes, routine series:**
> "4-dose series at 2, 4, 6, 12–15 months"

**Q3 — CDC child notes, healthy catch-up:**
> "Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV"

**Q4 — CDC child notes, the 4-day grace (load-bearing for S3):**
> "Vaccine doses administered ≤4 days before the minimum age or interval are considered
> valid. Doses of any vaccine administered ≥5 days earlier than the minimum age or minimum
> interval should not be counted as valid and should be repeated as age appropriate. The
> repeat dose should be spaced after the invalid dose by the recommended minimum interval."

**Q5 — CDC child notes, interval arithmetic:**
> "For calculating intervals between doses, 4 weeks = 28 days. Intervals of ≥4 months are
> determined by calendar months."

**Q6 — CDC child notes, the non-IC (chronic) paediatric risk list, complete:**
> "Children and adolescents with cerebrospinal fluid leak; chronic heart disease; chronic
> kidney disease (excluding maintenance dialysis and nephrotic syndrome); chronic liver
> disease; chronic lung disease (including moderate persistent or severe persistent
> asthma); cochlear implant; or diabetes mellitus"

**Q7 — CDC child notes, the IC paediatric risk list, complete:**
> "Children and adolescents on maintenance dialysis, or with immunocompromising conditions
> such as nephrotic syndrome; congenital or acquired asplenia or splenic dysfunction;
> congenital or acquired immunodeficiencies; diseases and conditions treated with
> immunosuppressive drugs or radiation therapy, including malignant neoplasms, leukemias,
> lymphomas, Hodgkin disease, and solid organ transplant; HIV infection; or sickle cell
> disease or other hemoglobinopathies"

**Q8 — CDC child notes, IC age 6–18y, the branch P0-1 gets wrong:**
> "Received PCV before age 6 years but have not received PPSV23 … Not previously received
> PCV20: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent
> PCV dose. **If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years
> after dose 1 PPSV23.**"

**Q9 — CDC child notes, non-IC age 6–18y, the same branch (no 5-year rider):**
> "Received PCV before age 6 years but have not received PPSV23 … Not previously received
> PCV20: 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks after the most recent
> PCV dose."

**Q10 — immunize.org p2016 Table 4, the same rule from a second source:**
> "**2 through 18 years (IC only)** | Completed PCV series before age 6 years with PCV13
> and/or PCV15 (no PCV20, no PPSV23) | Option A: 1 dose of PCV20 at least 8 weeks after most
> recent PCV dose | **Option B: 1 dose of PPSV23 at least 8 weeks after most recent PCV
> dose; at least 5 years later, give 1 dose of PCV20 or a second dose of PPSV23**"

and immediately above it:

> "**2 through 18 years (non-IC only)** | Completed PCV series before age 6 years with PCV13
> and/or PCV15 (no PCV20, no PPSV23) | Option A: 1 dose of PCV20 at least 8 weeks after most
> recent PCV dose | Option B: 1 dose of PPSV23 at least 8 weeks after most recent PCV dose"

**Q11 — immunize.org p2016 Table 1 title (answers must-answer question 2):**
> "Table 1. Recommended schedule for administering pneumococcal conjugate vaccine (PCV) to
> **all children (healthy and those with risk conditions)** age 2 through 23 months"

**Q12 — immunize.org p2016 Table 1, the dose-total grid (load-bearing for P0-2):**
> "2 through 6 months | 0 | 4 doses: 3 doses 8 weeks apart; last dose at age 12–15 months
> | 1 | 3 additional doses: 2 doses, 8 weeks apart; last dose at age 12–15 months
> | 2 | 2 additional doses: 1 dose 8 weeks after most recent dose; last dose at least 8 weeks later at age 12–15 months
> | 3 | 1 additional dose at age 12–15 months
> 7 through 11 months | 0 before age 7 months | 3 doses; 2 doses 8 weeks apart; last dose at age 12–15 months
> | 1 or 2 before age 7 months | 2 additional doses: 1 dose 8 weeks after most recent dose; last dose at least 8 weeks later, at age 12–15 months
> | 3 before age 7 months | 1 additional dose at age 12–15 months
> | 1 at age 7 months or older | 2 additional doses; 1 dose 8 weeks after most recent doses; last dose at least 8 weeks later, at age 12–15 months
> | 2 at age 7 months or older | 1 additional dose at least 8 weeks later, at age 12–15 months
> 12 through 23 months | 0 before age 12 months | 2 doses: 2 doses 8 weeks apart
> | 1 before age 12 months | 2 additional doses: 1 dose at least 8 weeks after most recent dose; last dose at least 8 weeks later
> | 2 or 3 before age 12 months | 1 additional dose, at least 8 weeks after most recent dose
> | 1 dose at age 12 months or older | 1 additional dose, at least 8 weeks after the most recent dose"

**Q13 — immunize.org p2016 Table 1 footnote (the interval rule the app implements):**
> "†Minimum interval between doses: for children younger than age 12 months = 4 weeks; for
> children age 12 months or older = 8 weeks"

**Q14 — CDC Table 2 (catch-up), pneumococcal conjugate row, the stricter interval rule:**
> "Pneumococcal conjugate | 6 weeks | **Dose 1 to Dose 2:** No further doses needed for
> healthy children if first dose was administered at age 24 months or older / 4 weeks if
> first dose was administered before the 1st birthday / 8 weeks (as final dose for healthy
> children) if first dose was administered at the 1st birthday or after | **Dose 2 to Dose
> 3:** No further doses needed for healthy children if previous dose was administered at age
> 24 months or older / 4 weeks if current age is younger than 12 months **and previous dose
> was administered at <7 months old** / 8 weeks (as final dose for healthy children) **if
> previous dose was administered between 7–11 months (wait until at least 12 months old)**;
> OR if current age is 12 months or older and at least 1 dose was administered before age 12
> months | **Dose 3 to Dose 4:** 8 weeks (as final dose) This dose is only necessary for
> children age 12 through 59 months regardless of risk, or age 60 through 71 months with any
> risk, who received 3 doses before age 12 months."

**Q15 — CDC child notes, PCV15/PPSV23 co-administration:**
> "**When both PCV15 and PPSV23 are indicated, administer all doses of PCV15 first. PCV15
> and PPSV23 should not be administered during the same visit.**"

**Q16 — immunize.org p2016 Table 2 (healthy 24mo–18y):**
> "24 through 59 months | Completed any PCV schedule, including an all-PCV13 schedule by 24
> mos | No additional doses / No previous doses, or any incomplete PCV schedule by age 24
> months | 1 additional dose, at least 8 wks after most recent PCV dose
> 5 through 18 years | No previous doses or any incomplete PCV schedule by 24 months | No
> additional doses"

---

## The four must-answer questions

**1. P3-9b — are smoking and alcohol use disorder absent from CDC's paediatric risk table?**
**Yes, absent — confirmed from two sources.** Neither appears in Q6 (non-IC) or Q7 (IC),
which together are CDC's complete paediatric risk enumeration, nor in p2016 Table 3. Both
are adult-only conditions. `riskFactors.js:140-154` marks them `adultOnly: true` and cites
only adult sources (`cdcAdultPneumo`, `mmwr7203a1`), so the data file already knows.
**But the queue's framing is wrong and must be corrected — see P0-3.** The defect is not
latent and is not gated by the P3-9 design decision; it is reachable in today's build.

**2. Is it right that `pcvInfant` receives no risk factors at all?**
**Yes — correct, and provably so.** p2016 Table 1 is titled "…to **all children (healthy
and those with risk conditions)** age 2 through 23 months" (Q11). CDC's risk-specific
"Special situations" bullets all begin at "Age 2–5 years", and PPSV23's minimum age is 2
years (Q1), so there is nothing risk-dependent to do below 24 months. The dispatch at
`recommend.js:835` passing no `riskIds` into `pcvInfant` is right, and the code comment
"Healthy and at-risk infants follow Table 1 alike" is accurate. **No change needed. Do not
re-audit.**

**3. Does `pedsRiskRowClass` returning a result for ANY risk tick match CDC Table 4?**
**Correct for every risk except the two `adultOnly` ones.** Checked each mapping against
Q6/Q7 and p2016 Table 3:
- `asplenia`, `immunodeficiency`, `immunosuppression`, `hiv`, `solid_organ_transplant`,
  `ckd_advanced` → `'IC'` ✓ all six are in CDC's IC list verbatim.
- `chronic_heart`, `chronic_lung`, `chronic_liver`, `diabetes`, `ckd_chronic` → `'nonIC'` ✓
  all five are in CDC's chronic list verbatim.
- `cochlear_implant`, `csf_leak` → `'special'` → `'nonIC'` for the peds row ✓ **correct** —
  CDC lists both under the *chronic* heading (Q6), and p2016 Table 3 puts them in the non-IC
  column, while CDC's adult notes use the IC interval. The app's split of "non-IC peds row,
  IC adult interval" is exactly right and is a subtle thing to have got right.
- The `ckd_advanced` / `ckd_chronic` split matches CDC's wording precisely: "chronic kidney
  disease (excluding maintenance dialysis and nephrotic syndrome)" is chronic, while
  "maintenance dialysis … nephrotic syndrome" is IC.
- `smoking`, `alcoholism` → `'nonIC'` ✗ **wrong for paediatrics** → P0-3.
- IC precedence (`hasIC` first) ✓ matches the app's own documented rule and does not
  conflict with any source read here.

**4. Are there paediatric interval rules the validator should enforce but doesn't?**
**Yes — seven, and the validator currently enforces none of them.** `runWalk`
(`validate.js:151-186`) grades each dose in isolation: it takes no `prev` argument and the
file contains no interval arithmetic at all. This is the queue's P1-0, independently
reconfirmed here by probe (P1-5). The full list S3 needs, each with its source:

| # | Rule | Source |
|---|---|---|
| i | Min interval 4 weeks (28 days) under 12 months | Q13 / Q14 |
| ii | Min interval 8 weeks at 12 months or older | Q13 / Q14 |
| iii | Dose 2→3 needs **8 weeks AND age ≥12 months** when the previous dose was given at 7–11 months | Q14 |
| iv | The final/booster dose must be at age ≥12 months ("last dose at age 12–15 months") | Q12 |
| v | At-risk catch-up doses ≥8 weeks apart, and ≥8 weeks after the most recent PCV | Q8/Q10, CDC 2–5y rows |
| vi | PPSV23 after PCV15: **≥8 weeks**, and **never at the same visit** | Q15 |
| vii | PPSV23 dose 2: **≥5 years** after dose 1 | Q8/Q10 |
| viii | The **4-day grace** applies to every minimum age *and* every minimum interval | Q4 |

Also note Q5 for S3's arithmetic: "4 weeks = 28 days", and intervals of ≥4 months are
**calendar** months — so the 5-year PPSV23 gap (vii) is a calendar comparison, not
`days >= 1826`. The engine currently uses `Y5 = DAYS.years(1) * 5 → 1826` days.

---

# FINDINGS

Severity per the `app-audit` skill: **P0** = silent wrong answer / clinical-safety error;
**P1** = visibly wrong output or major gap; **P2** = polish, copy, edge case.
P0-2 is graded P0 rather than P1 because the wrong number is presented with no warning —
it is silent, not visible-as-wrong. Re-grade if you disagree; the evidence is below either way.

---

## P0-1 — An immunocompromised child aged 6–18 is told "complete" when a dose is still owed

**Severity rationale:** under-vaccination of an immunocompromised child, stated as a
positive reassurance ("No further PCV or PPSV23 is needed"), with no hedge the clinician
could notice. This is the worst shape of defect for this app.

**File:** `src/logic/recommend.js:412-422` (the `allCountingPcvBefore72mo` early return).

**Reproduction (run against `main` @ `821ab9c`):**
```js
recommend({
  today: '2026-06-06',
  ageMonths: 96,                      // 8 years old
  riskIds: ['asplenia'],              // immunocompromising
  pcvDoses: [                         // 4 × PCV13, all dated before 72 months
    { product: 'PCV13', date: '2018-08-09' },  // ~2mo
    { product: 'PCV13', date: '2018-10-08' },  // ~4mo
    { product: 'PCV13', date: '2018-12-07' },  // ~6mo
    { product: 'PCV13', date: '2019-06-07' },  // ~12mo
  ],
  ppsv23Doses: [{ product: 'PPSV23', date: '2021-06-07' }],  // given at ~3y
});
```

**Actual:** one rec —
`status: 'complete'`, `doseLabel: 'PCV series complete (PCV before age 6 + PPSV23)'`,
note: *"…the pediatric high-risk pneumococcal series is complete. No further PCV or PPSV23
is needed."*

**Expected (Q8 and Q10 agree):** a PCV20 **or** a second PPSV23, due ≥5 years after the
first PPSV23 — i.e. due since 2026-06-07, so due now.

**Why it happens:** the early return at `:413` gates on
`am >= M.m72 && allCountingPcvBefore72mo && ppsvGiven && !pcv.includesCompleting` and
**never checks `isIC`**. Its code comment asserts the rule covers IC and non-IC alike:
*"A high-risk patient (IC or non-IC) … has COMPLETED the pediatric PCV + PPSV23 series."*
Both cited sources contradict that: the 5-year step is in the **IC only** row and absent
from the **non-IC only** row.

**The correct rule is already implemented and is unreachable.** `recommend.js:424-446`
(`if (pcv.count >= 3)` → `if (ppsvGiven)` → `if (!isIC) … else`) emits exactly the right
pair — "1 dose PCV20 (immunocompromising)" ≥8 weeks, **or** "2nd PPSV23 (alternative, ≥5y
after first)". It is shadowed by the `:413` return. Proof: add one dose at ≥72 months so
`allCountingPcvBefore72mo` is false, and the same patient correctly produces both options.

**Confirmed non-IC is fine:** the identical history with `riskIds: ['diabetes']` also
returns "complete", which **is** correct per Q9/Q10. So the fix must branch, not delete.

**Blast radius:** fires for any IC patient 6–18y whose counting PCV doses are all dated
before 72 months, with ≥1 PPSV23 and no PCV20/PCV21. Probed with 1 PPSV23 and with 2; both
return "complete". (With 2 PPSV23 doses ≥5y apart the answer happens to be right, for the
wrong reason.)

**Suggested regression fixtures:**
1. The case above → expect a PCV20-or-2nd-PPSV23 pair, **not** `complete`.
2. Same with `riskIds: ['diabetes']` → expect `complete` (guards against over-correcting).
3. IC child with PPSV23 **less** than 5 years ago → expect the option present but not yet
   due (`dueToday: false`, `earliestNextDate` = PPSV23 date + 5 calendar years).
4. IC child who already has PCV20 → expect `complete` (the `includesCompleting` path).

---

## P0-2 — `pcvInfant` over-states the series total in 5 of 14 p2016 Table 1 cells

**Severity rationale:** a wrong dose count rendered as fact, with no warning. The error
direction is over-vaccination (one extra PCV dose), so it is not dangerous, but "dose 2 of
4" when the source says 3 is a silent wrong answer, which this app exists not to produce.

**File:** `src/logic/recommend.js:206-230` (the `target` ladder in `pcvInfant`).

**Reproduction:** every row below was run against `main` @ `821ab9c`, patient healthy, dose
dates synthesised to land at the stated ages. "p2016" = the total implied by Q12.

| Patient now | Prior doses (age given) | App total | p2016 total | |
|---|---|---|---|---|
| 4 mo | none | 4 | 4 | ok |
| 4 mo | 1 @ 2mo | 4 | 4 | ok |
| 4 mo | 2 @ 2,3mo | 4 | 4 | ok |
| 9 mo | none | 3 | 3 | ok |
| **9 mo** | **1 @ 3mo** | **4** | **3** | **MISS** |
| 9 mo | 2 @ 3,5mo | 4 | 4 | ok |
| **9 mo** | **1 @ 8mo** | **4** | **3** | **MISS** |
| **10 mo** | **2 @ 8,9.5mo** | **4** | **3** | **MISS** |
| 9 mo | 3 @ 2,4,6mo | 4 | 4 | ok |
| 15 mo | none | 2 | 2 | ok |
| 15 mo | 1 @ 3mo | 3 | 3 | ok |
| **15 mo** | **2 @ 3,5mo** | **4** | **3** | **MISS** |
| 15 mo | 3 @ 2,4,6mo | 4 | 4 | ok |
| **15 mo** | **1 @ 13mo** | **3** | **2** | **MISS** |

All five misses over-state. Worked example of the first: a 9-month-old with one dose at 3
months shows **"PCV dose 2 of 4"**; p2016's row "7 through 11 months | 1 or 2 before age 7
months | **2 additional doses**" means 1 + 2 = **3**.

**Why it happens — three separate causes:**

1. **7–11 months is collapsed to `prior < 1 ? 3 : 4`** (`:214`). p2016 splits this band five
   ways on *when* the prior doses were given (before 7 months vs at/after 7 months), and
   never yields 4 for a single prior dose.
2. **The author started to implement that split and stopped.** `:215` computes
   `const before7 = pcv.band.before12 - (pcv.band.m12to23);` and **never uses it**. The
   expression is also wrong on its own terms — `m12to23` is not a subset of `before12`, so
   subtracting it is meaningless. This dead line is the clearest evidence the band logic is
   unfinished rather than deliberate.
3. **`≥12 months` uses `Math.min(4, prior + 2)`** (`:228`), a formula with no counterpart in
   the source. It produces 4 where p2016 says 3 (2 doses before 12mo), and 3 where p2016
   says 2 (1 dose at ≥12mo — p2016's distinct "1 dose at age 12 months or older" row, which
   the code cannot express because it branches on `prior` and `band.before12 >= 3` only).

**Note:** `summarizePcv` already computes the bands this needs (`before12`, `m12to23`), but
there is no `before7` band. S3/S10 will need one — and `band.undated` must be decided
explicitly, since an undated dose cannot be placed in a before-7-months band.

**Suggested regression fixture:** a table-driven test asserting the series total for all 14
rows above, sourced to Q12. This is the single highest-value test in the paediatric engine —
it is the kind of "is every row of the table implemented at all?" assertion that the
existing 156 tests never make (see `project_why_rules_keep_drifting`).

---

## P0-3 — The adult-only risk trap (P3-9b) is LIVE today, not latent

**This contradicts the queue document and the premise of owner decision 2.** The queue says
*"The `adultOnly` hide at `StepRisks.jsx:35` is currently the only thing stopping it"* and
treats the defect as latent until the P3-9 "show risks at every age" change ships. **The
hide does not stop it.** It filters which checkboxes *render*; it never clears a value
already in state, and nothing else does either.

**File:** `src/App.jsx:79-83` (the age `onChange` updates only `ageMonths`/`ageGroup`) plus
`src/components/StepRisks.jsx:33` (display-only filter) plus
`src/data/riskFactors.js:206-210` (`pedsRiskRowClass` ignores `adultOnly`).

**Reproduction — driven through the real React components, not reasoned:**
1. Enter age **25 years** → Next.
2. "Cigarette smoking" **is** offered (observed: `true`) → tick it.
3. **Back** → change age to **15 years** → Next.
4. "Cigarette smoking" checkbox is now **hidden** (observed: `false`) — the gate works, for
   display only.
5. Next → View Results.

**Actual, for a 15-year-old with no vaccine history whose only risk is an invisible tick:**
- "Option A: 1 dose PCV20 (≥8 weeks)" — *"At-risk non-immunocompromising child 6–18 years
  with no prior PCV…"*
- "Option B-1: 1 dose PCV15 (≥8 weeks)"
- "Option B-2: PPSV23 (≥8 weeks after PCV15)"
- Does **not** show "Not indicated (healthy 5–18y)".

**Expected:** "Not indicated (healthy 5–18y)" — cigarette smoking is not a paediatric
pneumococcal indication (Q6, Q7).

So a healthy 15-year-old is handed a three-option at-risk catch-up regimen plus a PPSV23,
and the clinician cannot see which risk caused it because the box is hidden. `alcoholism`
behaves identically.

**How a clinician reaches this without trying:** mistyping the age and correcting it. There
is no exotic step — just Back.

**Fix (as the queue already specifies, and it remains right):** filter `adultOnly` *inside*
`pedsRiskRowClass`, not at the call site, so there is one source of truth. Check `hasAnyRisk`
(`riskFactors.js:187`) for the same hole — it also counts `nonIC` without an `adultOnly`
test; it is currently only called from `pcvAdult`, so it is not yet reachable with a child,
but it is the same latent shape. `adultPpsvIntervalClass` is **not** affected (it tests only
`hasIC`/`hasSpecial`).

**Additional consequence:** pruning risk IDs when the age changes is worth doing *as well*,
since a hidden-but-active tick is confusing even once the engine ignores it. That is a UI
decision for the owner, not a clinical one.

**Suggested regression fixtures:**
1. Engine: `{ ageMonths: 180, riskIds: ['smoking'] }` → expect `not-indicated`.
2. Engine: `{ ageMonths: 180, riskIds: ['smoking', 'diabetes'] }` → expect at-risk
   (`diabetes` is a real paediatric indication; `smoking` must neither add nor subtract).
3. Engine: `{ ageMonths: 300, riskIds: ['smoking'] }` → expect the adult at-risk pathway
   (guards against filtering `adultOnly` out of the adult rulebook too).
4. UI: the five-step sequence above → expect "Not indicated (healthy 5–18y)".

---

## P1-1 — Minimum-age floors reject a 5-day window that CDC accepts

**Two defects compound:** there is no 4-day grace anywhere in `src/` (verified by grep: no
match for `grace`, `4 days`, `4-day`), and age-at-dose is computed by subtracting one
average-month approximation from another.

**Files:** `src/logic/validate.js:117-123` (PCV), `:140-146` (PPSV23),
`src/logic/validate.js:ageAtDoseFromDate`, `src/logic/format.js:51-58` (`dobToAgeMonths`).
Both divide by `30.4375`.

**Reproduction A — PCV's 6-week floor.** DOB 2026-01-01, so 6 weeks = day 42 = 2026-02-12.
Per Q4, CDC accepts from day 38.

| Dose at age | App | CDC |
|---|---|---|
| 37 days | invalid | invalid |
| **38–42 days** | **invalid** | **valid** |
| 43 days | valid | valid |

The app's accept threshold is **day 43**; CDC's is **day 38**. Five days of valid doses are
rejected — the 4 days of grace, plus one day of rounding error.

**Reproduction B — PPSV23's 2-year floor, via the app's own DOB entry path.** DOB
2024-05-06; PPSV23 given **on the child's 2nd birthday**, 2026-05-06:
- `dobToAgeMonths('2024-05-06', '2026-06-06')` → `25.00205…`
- `ageAtDoseFromDate` → **23.9836** months
- verdict: **`invalid` — "Given at ~24 months — below the 2-year minimum age for PPSV23."**

The message states that 24 months is below 24 months. A dose one day later is valid. Tested
at 0, 7, 14, 30, 60, 120, 240, 365 and 730 days after the dose: **always invalid** — a
deterministic off-by-one at the birthday, not a drift that washes out.

**Consequence:** an invalid verdict **drops the dose from the effective series**
(`validate.js:162-173`), so this silently changes dose counts and can change the
recommendation — not just a cosmetic age display.

**Relationship to the queue:** this is the concrete, reproducible instance of P3-2
(calendar-exact months) and P3-3 (exact age at dose), which are queued for S10. It is also
the 4-day grace that S3 needs. **Flagging for sequencing:** the grace and the arithmetic
both belong to the minimum-age check that S3 is about to extend with intervals. Fixing
intervals on top of an age floor that is a day out will bake the error into the interval
check too. S3 should fix the grace and the arithmetic, or S10 should move before S3.

**Suggested regression fixtures:** the two tables above, driven from a DOB (not a bare
`ageMonths`), asserting the exact accept/reject boundary day by day.

---

## P1-2 — "PCV dose 5 of 4": an impossible dose number

**File:** `src/logic/recommend.js:252-256` (`remaining = Math.max(1, target - prior)`,
`doseNum = prior + 1`).

**Reproduction:** healthy 6-month-old, four PCV20 doses all correctly ≥28 days apart and all
before 12 months (2026-01-20, 02-20, 03-23, 04-23).

**Actual:** `doseLabel: "PCV dose 5 of 4"`, `status: 'catchup'`, `seriesTotal: 4`, all four
doses graded `valid`.

**Expected:** the child has had 4 doses but none at ≥12 months, so the ≥12-month final dose
is genuinely still owed (Q12: "last dose at age 12–15 months"). The honest output is a 5th
dose with a total of 5 — or better, "1 more dose, at ≥12 months" with no fraction at all.
Either way "5 of 4" cannot be right.

**Why:** `boosterGiven` requires a dose at ≥12 months, so the `complete` branch is skipped;
then `Math.max(1, …)` floors `remaining` at 1 while `target` stays 4, and `doseNum` becomes
`prior + 1 = 5`. The `Math.max` is papering over a `target` that is wrong for this history —
the same root cause as P0-2.

**Independent of spacing:** reproduced with legal 28+ day spacing, so it is not a side
effect of P1-0.

**Suggested regression fixture:** the case above → assert the label contains no "N of M"
with N > M. Better still, a never-event sweep assertion for S7: **no rec label may ever
state a dose number greater than its series total.**

---

## P1-3 — Interval keyed on current age, not on age at the previous dose (~~tier-1 source conflict — needs an owner decision~~ **CORRECTED: not a conflict; part of P0-2**)

> **⚠️ CORRECTION (2026-10-10, later session).** The premise below — that p2016 and CDC
> Table 2 "genuinely disagree" — is **wrong**, and so is the request for an owner decision.
> p2016 Table 1's grid keys on age-at-previous-dose too (`2 at age 7 months or older` →
> "1 additional dose at least 8 weeks later, at age 12–15 months"). For the reproduction
> patient below, **p2016 Table 1 and CDC Table 2 give the same answer**: total 3 doses, next
> one at 12–15 months. The app's `4 weeks / due today / dose 3 of 4` matches neither,
> because `recommend.js:185` implements p2016's *footnote* instead of p2016's *table*.
> **Fold this into P0-2. No owner decision is required.** The text below is kept for the
> reproduction and the quotes only.

**File:** `src/logic/recommend.js:185` — `const minInterval = am < M.m12 ? WK4 : WK8;`

The app's rule matches **p2016's footnote exactly** (Q13: under 12 months = 4 weeks; 12
months or older = 8 weeks), keyed on the patient's current age. **CDC Table 2 (Q14) is more
granular and stricter**, keying on the age at which the *previous* dose was given.

**Reproduction:** healthy 10-month-old, 2 doses, the second given at 9 months.
- **App:** "PCV dose 3 of 4", `minIntervalDays: 28`, `dueToday: true`.
- **CDC Table 2, dose 2→3:** "8 weeks (as final dose for healthy children) **if previous
  dose was administered between 7–11 months (wait until at least 12 months old)**" — so ≥56
  days **and** not before the first birthday, and it would be the **final** dose (total 3,
  not 4).

The app therefore says "due today" for a dose that CDC would not count, roughly two months
early, with a total one too high (the total error is P0-2).

**This is a genuine conflict between two tier-1 sources**, not a code bug: immunize.org
p2016 and CDC Table 2 are both in the top authority tier, and the app follows p2016. Per
`verify-clinical-source` ("When genuinely unsure which source governs a specific rule, ask
the owner before locking it in") this is **an owner decision, not an agent decision.**

**Recommendation to the owner (yours to overrule):** follow **CDC Table 2**, because (a) it
is the more specific statement and p2016's footnote reads as a simplification of it, (b) it
is the more conservative of the two — it never recommends a dose earlier than p2016 would,
so it cannot cause an invalid dose, and (c) the authority rule's one-way ratchet forbids
adopting the option with *fewer* doses or *narrower* eligibility, and CDC Table 2 is not
that option here.

**Do not let S3 silently pick one.** If this is still unanswered when S3 starts, S3 should
implement the minimum-age/grace work and leave this rule alone.

---

## P1-4 — PCV15 and PPSV23 on the same day are accepted, counted, and called "Complete"

**File:** `src/logic/validate.js` (no co-administration or interval check);
`src/logic/recommend.js` (the 6–18y "PCV13 + PPSV23 at/after age 6" complete branch).

**Reproduction:** at-risk 10-year-old (`riskIds: ['diabetes']`), PCV15 on 2026-03-02 and
PPSV23 on **2026-03-02** (same day).

**Actual:** both doses `valid`, single rec `status: 'complete'`,
`doseLabel: "Complete (PCV13 + PPSV23 at/after age 6)"`. No warning of any kind.

**Expected:** CDC is explicit on both counts (Q15): *"PCV15 and PPSV23 should not be
administered during the same visit"*, and the PPSV23 must be *"at least 8 weeks after the
PCV15 dose"*. A same-visit PPSV23 is 0 weeks after. It should be flagged and repeated, not
counted toward a "complete" verdict.

This is interval rule (vi) from must-answer question 4 and belongs to S3 with P1-0. Note it
needs a **cross-stream** comparison — PCV and PPSV23 are validated by separate
`analyzeHistory` calls (`recommend.js:824-825`) that never see each other, so S3's design
must pass both histories into the interval check, not just the within-stream previous dose.

**Secondary (P2):** the label says "PCV13" when the recorded product was PCV15. See P2-2.

**Suggested regression fixtures:** same-day PCV15+PPSV23 → PPSV23 flagged, not `complete`;
PCV15 then PPSV23 at exactly 56 days → valid; at 55 days → invalid (and at 52 days, valid
under the 4-day grace).

---

## P1-5 — Reconfirms P1-0: the validator checks no intervals at all, in either stream

The queue's P1-0 is real and was reproduced independently here, in both vaccine streams.

**PCV.** Healthy 6-month-old, four PCV20 doses **14 days apart** (2026-02-06, 02-20, 03-06,
03-20) — minimum interval is 28 days:
- per-dose verdicts: `valid, valid, valid, valid`
- effective dose numbers: `1, 2, 3, 4` — **all four counted**
- rec: "PCV dose 5 of 4" (P1-2 riding along)

**PPSV23.** IC 12-year-old, two PPSV23 doses **1 year apart** (2020-07-06, 2021-07-06) —
CDC's floor is 5 years (Q8, Q10):
- both `valid`, `effectiveDoseNum: 1, 2` — **both counted**

**Root cause, as the queue states:** `runWalk` (`validate.js:151-186`) takes `(vaccine,
rawDoses, ageMonths, today)` and calls `validateOnePCV(dose, ageMonths, today)` — no
previous-dose argument exists, and the file contains no interval arithmetic. `recommend.js`
does not compensate: `dueState` (`:139`) is purely forward-looking.

**Also observed while probing (worth S3's attention):** with two PPSV23 doses already
recorded 1 year apart, the engine *still* recommends "2nd PPSV23 (alternative, ≥5y after
first)" — it branches on `ppsv.count > 0`, never on `ppsv.count >= 2`, so it can recommend a
dose the patient has already received. Fixture: IC child with 2 PPSV23 doses ≥5 years apart
→ expect no further PPSV23 offer.

**Adds to the queue's P1-0 spec:** `validate.js:130` hardcodes `const minAgeM = 24` — the
second, private copy of PPSV23's 2-year floor, confirming the P2-12 / S6 census problem.
The validator has no interval constant to reach for because `M` (`recommend.js:37`) is a
module-local `const` and is not exported.

---

## P2 items

**P2-1 — `before24 >= 3` vs p2016's "3 doses, all before 12 months".**
> **⚠️ CORRECTION (2026-10-10, later session).** Not an owner/source decision — it is
> downstream of P0-2. A child with 2 doses before 12 months and a third at 18 months
> **completed p2016 Table 1's series** (row `12 through 23 months` / `2 or 3 before age 12
> months` → "1 additional dose, at least 8 weeks after most recent dose"). They are a
> completed-series child, not a catch-up child, so Table 4 rows 1/2 should never have been
> reached. Confirmed on the real engine: at-risk 30-month-old with doses at 2/4/18 months
> returns `1 dose PCV (at-risk catch-up)` — right number, wrong route. Fix alongside P0-2
> and make the "series complete" test path-dependent instead of a flat `>= 4`.
`recommend.js:383` splits the at-risk 24–71mo catch-up with
`pcv.band.before24 >= 3 ? 1 : 2`. The three sources word this differently: p2016 Table 4
says "3 doses of PCV, **all before 12 months**"; CDC Table 2's dose-3→4 row says "who
received 3 doses **before age 12 months**"; CDC's child note says only "3 PCV doses". A child
with 2 doses before 12 months and a third at 18 months is "3 by 24 months" but not "3 before
12 months", and no row cleanly covers them. **Not asserted as a bug** — the sources are
genuinely ambiguous for that history. Needs an owner/source decision, probably alongside
P1-3. The code's inline comment quotes a "<3 prior PCV by 24mo" phrasing that appears in
none of the three pages; that comment should be corrected to quote a real source either way.

**P2-2 — A PCV15 dose is labelled "PCV13".**
The 6–18y complete branch renders `doseLabel: "Complete (PCV13 + PPSV23 at/after age 6)"`
even when the recorded product was PCV15. The branch itself is defensible (CDC's row is
"Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years"), but the label should name
the product the patient actually received, or say "PCV" generically. Clinician-visible copy.

**P2-3 — Dead and incorrect line in `pcvInfant`.**
`recommend.js:215`: `const before7 = pcv.band.before12 - (pcv.band.m12to23);` — never read,
and the arithmetic is wrong regardless (`m12to23` is not a subset of `before12`). Delete it
as part of P0-2, or implement the `before7` band it was reaching for.

**P2-4 — Adult-only citations can appear on a child's card.**
`pcvRiskChild` builds refs via `collectRefs(riskIds, [...])`, so ticking `smoking` puts
`cdcAdultPneumo` and `mmwr7203a1` — both adult-only sources — on a paediatric
recommendation. Resolved for free by P0-3's filter, but worth an explicit assertion so it
cannot come back: no rec for a patient under 19 may cite an adult-only ref.

**P2-5 — Healthy child with 4 doses all before 12 months.**
`pcvHealthyChild`'s `completedInfantSeries` requires `prior >= 4 && (m12to23 >= 1 ||
undated >= 1)`, so 4 doses all before 12 months → "1 dose PCV (catch-up)". p2016 Table 2
(Q16) says "Completed **any** PCV schedule, including an all-PCV13 schedule by 24 mos → No
additional doses", while Table 1 (Q12) insists the last dose be at 12–15 months. The app's
answer (give one more) is the safer reading and is probably right; recording it so the
ambiguity is known rather than rediscovered. Same family as P2-1.

---

## Verified correct — do not re-audit these

Each was checked against a live quote and, where behaviour was in doubt, probed:

1. **`pcvInfant` ignoring risk factors** — correct; p2016 Table 1 covers "all children
   (healthy and those with risk conditions) age 2 through 23 months" (Q11).
2. **The 2–6 month dose targets** — all four prior-dose cells match p2016 exactly.
3. **`pcvHealthyChild` 24–59 months** — 1 catch-up dose, ≥8 weeks; matches Q3 and Q16.
4. **`pcvHealthyChild` 5–18 years → not indicated** — matches Q16's "5 through 18 years …
   No additional doses" and CDC's catch-up being limited to "ages 2–4 years".
5. **The two different age bands are both right** — healthy catch-up ends at 60 months
   (CDC "2–4 years"), at-risk catch-up ends at 72 months (CDC "Age 2–5 years"). The app
   uses `M.m60` and `M.m72` respectively. Easy to get wrong; it is right.
6. **Cochlear implant and CSF leak → non-IC for the peds row, IC for the adult interval** —
   correct and subtle; CDC lists both under "chronic" (Q6) while the adult notes use the IC
   interval.
7. **The `ckd_advanced` / `ckd_chronic` split** — matches CDC's exact parenthetical wording.
8. **Table 2's dose-3→4 risk gate** — probed both sides: a healthy 65-month-old with 3 doses
   before 12 months → "Not indicated"; the same child *with* a risk condition → "1 dose PCV
   (at-risk catch-up)". Exactly Q14's "age 12 through 59 months regardless of risk, or age
   60 through 71 months with any risk".
9. **Healthy child whose first dose was at ≥24 months** → "PCV series complete"; matches
   Q14's "No further doses needed for healthy children if first dose was administered at age
   24 months or older".
10. **non-IC child, PCV before 6y + PPSV23 → complete** — correct per Q9/Q10. Only the IC
    variant is wrong (P0-1).

---

## Recommended fix order

P0-3 is listed first because it is live, user-reachable today, and the fix is small and
well-specified. P0-1 is the most serious but needs care to branch rather than delete.

1. **P0-3** — the `adultOnly` filter inside `pedsRiskRowClass` (+ `hasAnyRisk`). Small,
   contained, already specified, and stops a healthy teenager being given an at-risk
   regimen today. **This also unblocks owner decision 2 / P3-9**, whose premise was that the
   trap was latent.
2. **P0-1** — the `isIC` branch at `recommend.js:413`. Highest severity; the correct code
   already exists below, so the fix is to stop shadowing it.
3. **P0-2 + P1-2 + P2-3** — one job: rebuild `pcvInfant`'s `target` from p2016 Table 1
   (Q12), with the 14-row table test. P1-2's impossible label and P2-3's dead line both fall
   out of it.
4. **P1-1** — the 4-day grace and calendar-exact age-at-dose. **Do this before, or as part
   of, S3's interval work**, not after.
5. **P1-5 / P1-4 / P1-0** — S3's interval check, using the eight sourced rules in
   must-answer question 4. Needs cross-stream history for rule (vi).
6. **P1-3 and P2-1** — hold for the owner's decision on CDC Table 2 vs p2016's footnote.
7. **P2-2, P2-4, P2-5** — copy and assertion tidying, any time.

**Sequencing consequence for the queue:** S3 was scheduled to add the dose-spacing check
using "the clinical numbers from S1/S2's quotes". Those numbers are in must-answer question
4 above and are ready. But P1-1 (grace + age arithmetic) sits underneath the same
minimum-age check S3 will extend, and P1-3 needs an owner answer first. **Suggest S3 take
P1-1 + P1-5 + P1-4, and that P0-1/P0-2/P0-3 be pulled forward ahead of it** — they are
wrong answers on screen today, and two of the three are small.

---

## What this audit did NOT cover

- **`pcvAdult`, `adultPpsvIntervalClass`, `hsctAdvisory`, `pcv21GeoNote`, the precedence
  choices, and the number census** — all S2's scope, deliberately untouched.
- **`cdcAdultPneumo` was not fetched.** S2 must fetch it; P0-3's conclusion rests only on
  the *paediatric* lists (Q6, Q7), which is the correct basis for a paediatric claim.
- **The live app in a browser.** All five dev-server preview slots were held by other chats,
  so `preview_start` was refused. Per the queue's rule 6 I did **not** fall back to running
  the server through Bash. Instead, P0-3 was driven through the real React components under
  happy-dom — the actual `App.jsx`, `StepAge`, `StepRisks` and `Results`, with real clicks
  and real state transitions — which is stronger evidence for a state-persistence claim than
  a screenshot would be. Every other finding is engine-level and was probed directly. **No
  finding here rests on reading code alone.** What is genuinely unverified: how these cards
  *look* on screen. If you want the "5 of 4" label and the hidden-smoking case confirmed
  visually, close a dev-server slot and it takes two minutes.
- **AAP's paediatric pneumococcal text was not fetched in full** — I found nothing
  contradicting the CDC text, so under the tiebreak rule CDC stands, but this is an absence
  of evidence rather than a positive AAP confirmation. S2 could close it while doing the
  `aapBaseline` work.

---

## Counts

| | |
|---|---|
| P0 | 3 |
| P1 | 5 |
| P2 | 5 |
| Verified correct | 10 |
| Owner decisions needed | **0** — both withdrawn 2026-10-10; see the correction banner at the top |
| Queue claims corrected | 2 (P3-9b is live, not latent; P1-3/P2-1 are not source conflicts) |

**Baseline at audit time:** `main` @ `821ab9c`, 11 test files / 156 tests green.
**Next session:** S2 — clinical audit of the adult, HSCT, precedence and number census.
**Recommend Opus 5 at max effort.**
