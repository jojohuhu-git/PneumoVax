# PneumoVax against CDC's CDSI test patients (2026-11-08)

**Status: measured, nothing in the app changed.** Owner's request: *"run pneumovax against CDSI test
patients. I doubt any of the vaccine brands or age limits have changed."*

Run: `npx vite-node scripts/cdsi/runTestCases.mjs` (how to run and update: `scripts/cdsi/README.md`).
Each patient is run with "today" set to CDC's own assessment date for that patient.

## Your question first: brands and age limits did not change

- CDSI **4.65** (August 2026) against **4.64**: every row naming which vaccine is allowed at which
  dose, and every minimum and maximum age, compared one by one — **508 rows, 0 differences**.
- 4.65's release notes say, for pneumococcal, only: *"Adjusted intervals in various Risk 19+ series
  per the updated Pneumococcal Job Aid"* — adult gaps, not products or ages.
- CDSI's products match the app's: PCV15, PCV20 and PPSV23 for children; PCV20 and PCV21 for adults;
  PCV7 and PCV13 recognised as old doses; PPSV23 from age 2. One deliberate difference, already
  recorded: CDSI starts PCV21 at **19**, the app at **18** (FDA label and ACIP mm7336a3;
  `PCV21_MIN_AGE_M`), because CDSI has no PCV21 row for an 18-year-old.

## The result

**140 pneumococcal test patients** (79 healthy, 61 with a condition; 89 children, 51 adults).

| | Agree | Differ |
|---|---|---|
| Whole patient (every dose and the next step) | **117** | 23 |
| Recorded doses (does it count?) | **267 of 287** | 20 |

All 23 sort into the families below. **0 are unexplained.**

## Where the app is deliberately different (no action)

| Family | Patients | Why the app does it |
|---|---|---|
| PCV7 never counts; CDSI counts it | 5 (14 doses) | Owner rule, confirmed 2026-10-12 |
| A repeat dose is spaced from the dose that did not count | 1 | Ruling D; ACIP General Best Practices: *"The repeat dose should be spaced after the invalid dose by the recommended minimum interval"* |
| Advised date 8 weeks for a 7–11-month-old, the 4-week minimum stated beside it | 1 | C10-2, owner rulings A and C, 2026-10-23 |
| A 3rd dose after a dose at 7–11 months needs 8 weeks (CDC Catch-up Table 2 "as final dose"); CDSI counts it at 4 weeks | 3 | Owner decision 2026-10-23. **Same end result** in all 3 (both say complete, or both give the same date) |
| Adult PCV20/21 measured 5 years from the **last** dose; these test patients measure from the PPSV23 | 3 | CDC adult notes: *"at least 5 years after the last pneumococcal vaccine dose."* **CDSI's own 4.65 data agrees with the app** — these three test patients were last edited in CDSI 4.1–4.5 and are out of date |
| Healthy adult under 50 with an old PPSV23: app says nothing due now; CDSI forecasts a dose at 50 | 1 | Same advice in different words |
| 6 months after May 31: app Nov 30, CDSI Dec 1 | 1 | Calendar convention, 1 day |
| Severe allergic reaction to a past dose | 1 | Not comparable: the app has no contraindication input |

Two more agree once read correctly, and the script now counts them as agreeing: an adult 65+ with
PCV13 and PPSV23 gets the shared-decision card; CDSI says complete. CDC's PneumoRecs tool prints
both for that patient: whether or not the dose is given, *"their pneumococcal vaccinations are
complete"* (`scripts/pneumoRecsCompare.mjs`, case A12).

## Open — new findings, nothing changed yet

**1. A baby under 6 weeks with no doses is told "Due today: PCV dose 1 of 4".** Confirmed in the
running app: a 2-week-old, no risk factors, no doses, shows *"Due today: PCV."* The engine gives the
same at 0, 7, 14, 28, 37 and 41 days old, healthy or with asplenia. The first dose cannot be given
before 6 weeks (`PCV_MIN_AGE_DAYS = 42`); CDSI gives earliest 6 weeks, recommended 2 months. A
newborn or 1-month visit is an ordinary visit, so this is the typical-patient kind of bug.
*Fix belongs in the `fix-queue` loop.* (CDSI patient 2013-0575.)

**2. The "wait for the 12-month booster" card gives no date.** It says *"This final dose is not due
until the patient reaches 12 months"* and, further down, *"due 8 weeks after the most recent one"*.
When the 8 weeks end after the first birthday, the age it leads with is too early: a catch-up baby
with doses at 8 and 10½ months is told 12 months (Nov 1) when the dose cannot be given until Nov 10.
Your goal statement asks for the date to be stated clearly. (CDSI patient 2013-0598.)

**3. CDSI gives each infant dose its own minimum age; the app checks only dose 1's.** CDSI: dose 2
not before 10 weeks, dose 3 not before 14 weeks (each with the 4-day grace). The app checks dose 1
at 6 weeks and then only the 4-week gaps, so the two 4-day graces can stack: dose 1 at 38 days and
dose 2 at 65 days both count in the app; CDSI throws dose 2 out. 3 patients (2013-0579, -0590,
-0603). **A clinical question for you, not a fix**: it needs a live read of whether CDC/ACIP's own
words set a per-dose minimum age (the place to look is ACIP General Best Practices' table of
minimum ages and intervals) before any patient is put to you.

**4. A first dose 1–4 days before age 2.** CDSI applies the 4-day grace to the 24-month line, so a
healthy child given PCV20 at 24 months minus 4 days needs nothing more. The app reads her as 23
months and asks for a second dose. You ruled the same question for the **12-month** line on
2026-10-31 ("Grace applies", §A-GRACE12); the 24-month line has not been asked. 1 patient
(2013-0589).

**5. (Rare — parked unless you want it.)** A 14-year-old with HIV who had PPSV23 at 9, PPSV23 at 14,
then PCV13: CDSI 4.65 calls this complete; the app asks for PCV20. CDC's sentence the app cites is
written for *one* PPSV23, so no CDC row names this history. (2016-UC-0171.)

> **Settled 2026-11-09 — the app stays as it is (PCV20).** This was never new: it is the history
> of the owner's **"Sofia"** ruling of 2026-10-30 (`CLINICAL_SPEC.md` §C-P2 — PPSV23 twice, *then*
> the conjugate: PCV20 only, never a third PPSV23). Shown this patient, the owner first proposed
> "complete, re-evaluate at 19", quoting CDC's *"Received 1 dose PCV13 and 1 dose PPSV23 at or
> after age 6 years: no further doses of any PCV or PPSV23 indicated."* Read live that day, that
> sentence is in the **non-immunocompromised** list; the immunocompromised list's same row reads
> *"administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV13 dose and
> at least 5 years after dose 1 PPSV23."* Shown both, she answered **"No, keep PCV20."** At 19 the
> app already gives her adult plan (review at 50, or PCV20/PCV21 ≥5 years after the last dose),
> because both PPSV23 doses count for an immunocompromised child (Leo, 2026-10-29). CDSI 4.65's own
> rules build a PPSV-PPSV-PCV series that ends at the conjugate, so this difference with CDSI is
> deliberate and now listed as such in `scripts/cdsi/runTestCases.mjs`.

## Limits of this run

- CDC's condition codes were matched to the app's boxes by hand; the choices are written in the
  script (`RISK`). Leukemia, lymphoma and myeloma went to "Immunosuppressive drugs or radiation"
  (that box's sublabel lists them), not to the transplant/B-cell hard stop.
- The comparison is per dose (counts or not) and the next step (complete, or the next date). It
  does not compare which product the card offers, or the card's wording.
- The healthy workbook is version 4.46 and the conditions workbook 4.6 — the newest on CDC's page
  when the owner downloaded them. Some patients inside are older than the 4.65 rules (see the three
  adults above).
