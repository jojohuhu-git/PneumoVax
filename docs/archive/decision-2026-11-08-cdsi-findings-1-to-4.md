# CDSI test-patient findings 1–4: owner rulings and fix plan (2026-11-08)

Findings: `report-2026-11-08-cdsi-test-patients.md` §"Open". Branch `fix/2026-11-08-cdsi-findings`
off `main` at `5ee7e03`. Baseline 2,481 passing, 0 failed (vitest JSON reporter, `.claude/**` excluded).
**Status (2026-11-09): 1, 2, 3 and 4 DONE, committed locally on this branch, not pushed, no PR.
5 parked.** Tests 2,495 → **2,521 passing, 0 failed**. CDSI 118 → **122 of 140** agree.

| # | State | Detail |
|---|---|---|
| 1 | Done | `CLINICAL_SPEC.md` §L-FIRSTDOSE. 0 grid patients (youngest is 2 months). Label "Routine", not "Due", for a baby too young for dose 1 — narrows §L-2's "a first dose keeps Due"; tell her. Ben's line adds "as the minimum age of 6 weeks has passed" (what the [c] stands on); tell her. |
| 2 | Done | `CLINICAL_SPEC.md` §L-BOOSTERDATE. Moved 132 / 264 saved answers, every one ONLY the next date blank → date (field diff). "her 1st birthday" became "the 1st birthday" (app can't know sex); tell her. `proveChecks.mjs` H1 now mutates a branch no card reaches — re-aim it at a dated card. |
| 4 | Done | `CLINICAL_SPEC.md` §A-GRACE24. **Second ruling, 2026-11-09 ("Rosa"): "Only when it helps"** — built first as "read as the birthday", it took Rosa (asplenia, PCV13 ×2, PCV20 2 days before age 2) from complete to owing a PCV. Now the dose stays "before 24" and ALSO counts toward "at 24+". 0 grid / 0 record-problem verdicts; 636 of 1,575 hand-built moved, 0 lost "complete", 0 chip texts. The whole-app age-lines check now lists PCV@24 as a grace edge. §A-GRACE12 (12 months) still moves the dose outright — not checked for the same harm; ask her. |
| 3 | Done (owner approved the movers 2026-11-09, "Yes, commit it") | `CLINICAL_SPEC.md` §A-DOSEAGE. Dose 2 ≥70 days (66 with grace), dose 3 ≥98 (94); repeat 4 weeks after (Ruling D, from the rule table); card never offers a date under the next dose's age. REVERSES the 2026-10-26 "grace per interval" test (38/62/86 → 38/66/94). 0 grid / 0 record-problem / 0 of 77,496 whole-app patients moved; 502 of 2,736 hand-built baby views (23 histories, all a dose 1–4 days early followed by another early dose). CDSI 119 → 122. Tests 2,521. |

**Resume:** `git checkout fix/2026-11-08-cdsi-findings`. Push and open a PR for 1-4 when she says (ship skill); she merges.

All five reproduced on 2026-11-08 with `npx vite-node scripts/cdsi/runTestCases.mjs`, plus hand probes.

## Rulings (owner, 2026-11-08, from worked patients)

| # | Patient put to her | Ruling |
|---|---|---|
| 1 | Ava, 2 wk, no doses, reads "Due today: PCV dose 1 of 4"; Ben, 7 wk, same | **Every baby under 2 months with no doses:** "Due at 2 months, on DATE. It can be given from DATE (age 6 weeks) if needed" — or "…can be given today if needed" once past 6 weeks. (Her 2026-10-24 rule: the routine date plus the earliest.) |
| 2 | Nora, born 2025-11-01, PCV20 2026-07-01 and 2026-09-15, seen 2026-09-20: "not due until 12 months" — a dose on 2026-11-01 is **thrown out by the app's own checker** (probe: `invalid`) | **"Date plus reason."** Nora: *"This final dose is due on Nov 10, 2026: 8 weeks after the most recent dose, which is after her 1st birthday."* Control (last dose at 9 months): *"This final dose is due at 12 months, on Nov 1, 2026."* The card's date line shows the same date. |
| 3 | Leo, born 2026-06-01, PCV15 at 38 days, PCV20 at 65 days (27-day gap) — both count in the app | **Use ACIP's per-dose minimum ages** (6 wk, 10 wk, 14 wk, 12 mo; 4-day grace on each). Leo's dose 2 does not count; repeat ≥4 weeks after it (Ruling D). **Moves verdicts: count every mover and show her before it lands.** |
| 4 | Mila, born 2024-08-09, first PCV20 2026-08-05 (4 days before 24 months): app asks for dose 2 | **"Grace applies; she's done."** Mirror §A-GRACE12 at the 2nd birthday. |
| 4b (2026-11-09) | Rosa, born 2024-08-09, asplenia, PCV13 at 2 and 4 months, PCV20 on 2026-08-07 (2 days before age 2), seen 2026-09-15. Today "complete"; read as a birthday dose she would owe one more PCV. Control: same PCV20 5 days early → complete | **"Only when it helps"** — use the grace only where it means fewer doses owed. |
| 5 | Teen with HIV, 2×PPSV23 then PCV13 | Not asked — parked (rare; her 2026-10-31 "skip unlikely scenarios"). |
| 4c (2026-11-09) | Ivy, asplenia, first-ever PCV20 2 days before age 1, then +4 wk, +8 wk. Read as a 12-month dose (§A-GRACE12), dose 2 was thrown out and at 2 she owed 2 more PCVs; at its real age, complete. Controls: 6 days early → complete; on the birthday → 2 more | **"Only when it helps"** at 12 months too: judge the history both ways, keep the reading that owes fewer doses, on a tie keep today's. `CLINICAL_SPEC.md` §A-GRACE12-HELPS. 2,496 of 214,200 hand-built views moved, 0 lost complete, 0 owe more; 0 grid / 0 record-problem / 0 of 35,280 prose lines; CDSI 122 of 140 unchanged; tests 2,534. |

## Sources read live 2026-11-08

- **ACIP General Best Practices, Timing and Spacing, Table 3-2** "Recommended and minimum ages and intervals
  between vaccine doses" (https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html,
  page updated July 24, 2024). Column "Minimum age for this dose": PCV13-1 **6 weeks**, PCV13-2 **10 weeks**,
  PCV13-3 **14 weeks**, PCV13-4 **12 months**. Footnote (x): *"Infants and children can optionally receive
  PCV15 instead of PCV13."* (PCV20 row says only "See footnote x", and (x) does not mention PCV20 for
  infants — the table predates PCV20 for children.) Grace: *"vaccine doses administered ≤4 days before the
  minimum interval or age are considered valid"*.
- **CDC Child Schedule Notes** (child-adolescent-notes.html): *"(minimum age: 6 weeks [PCV15], [PCV 20]…)"*;
  *"Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV"*. No per-dose ages for doses 2–3.
- **CDC Catch-up Table 2** (child-adolescent-catch-up.html, addendum updated July 2, 2025): PCV minimum age
  for dose 1 *"6 weeks"*; dose 1→2 *"No further doses needed for healthy children if first dose was
  administered at age 24 months or older"*.

## Where each fix goes (found 2026-11-08)

- **1:** `src/logic/recommend.js`, infant block (~line 990): `advisedDueToday = anchor ? … : true` — with no
  anchor the card is always due today. `routineAgeDate` for dose 1 is already computed (2 months). Earliest =
  dob + `PCV_MIN_AGE_DAYS` (42, `brands.js`). Card fields: `dueToday`, `earliestNextDate`, `note.lead`.
- **2:** same block: `needs12moFloor` sets `earliestNextDate: null` and the lead adds *"This final dose is not
  due until the patient reaches 12 months."* `minInterval` already uses `ageAtThisDose: M.m12` (so 56 days).
  Date = later of the 12-month birthday (exact, no grace — ruling 2026-10-24) and anchor + `minInterval`.
  `noteFold.js:31` keeps that sentence in view "because this card has no date anywhere else" — update the
  pattern and its reason, and the WORD-1 guard's written-out list.
- **3:** `validate.js:771` checks only dose 1's minimum age. Needs per-dose ages 10 wk / 14 wk (12 mo is
  already the booster floor). Cite `cdcGbpTimingSpacing` (`refs.js:2223`) — needs a quoted entry with
  `population`. Guard both corpora; group movers by family before `sweep:update`.
- **4:** `pcvAgeAtTwelveMonthLine()` in `intervals.js` is the 12-month helper; the 24-month line needs the
  same treatment wherever "first dose at ≥24 months" is decided. §A-GRACE12 lists the places it reached.

Each: failing test first, full suite, live-verify, one commit per finding, `CLINICAL_SPEC.md` updated.
