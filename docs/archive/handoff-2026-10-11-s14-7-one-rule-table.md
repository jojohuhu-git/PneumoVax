# PneumoVax — Handoff after S14-7 (2026-10-11)

> **Supersedes `handoff-2026-10-11-s14-1-through-6-done.md`** and closes the last open item
> of `handoff-2026-10-11-s14-interval-enforcement-root-cause.md`. **`S14-1`…`S14-7` are all
> DONE.** The root-cause file's rule tables are now implemented in code
> (`src/logic/doseIntervalRules.js`) and its clinical content is restated, with the owner's
> 2026-10-11 answers folded in, in `CLINICAL_SPEC.md` §K. Read §K, not that file, for the
> current rules.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s3-recorded-dose-intervals`**, off `main`. **Committed but NOT pushed —
1 commit ahead of origin.** Held deliberately: PR #22 is `OPEN / MERGEABLE` and carries an
unresolved owner decision (below), so this session landed locally and asked rather than
pushing into a PR the owner is holding.

Baseline this session: 412 passing (40 files). Now **455 passing (41 files), all green.**
Production build clean. Working tree **clean** at `dfa1d92`.

This app's core promise is honesty: a silent wrong answer is worse than a crash.

## What's done

**`S14-7` (`dfa1d92`) — the five age gates are gone; there is one rule table.**

`validate.js` used to decide whether a timing rule may void a dose **from the patient's
age, not from what the rule says**. `checkPcvInterval`, `checkPpsvAfterPcv` and
`checkPpsvRevaccInterval` returned early at `ageAtDose >= ADULT_SCHED_MIN_M`;
`adultPcvGapAdvice` and `adultPpsvGapAdvice` returned early below it. Three adult gaps fell
in the hole between the two halves and were checked by nothing — the worst being a
70-year-old's second PPSV23 two years after the first, which read `valid`, numbered,
`reasons: []`. All three were reproduced live before any code changed.

1. **`src/logic/doseIntervalRules.js`** (new) — every gap rule as one table. Each row
   declares `rulebook` (child / adult / any — which schedule states it) and `enforcement`
   (`floor` / `recommendation` / `none`) **separately**. `validate.js` calls
   `evaluateDoseInterval()` once per dose and owns no interval logic. No age test anywhere
   decides whether a rule may bite.
2. **The clinical reversal (owner decision, 2026-10-11).** Adult gaps are now validity
   floors: a dose inside one does not count and is owed a repeat, with the 4-day grace.
   This reverses `S3-N1`. ⚠️ **Owner clinical determination — never cite ACIP or CDC.**
   Labelled as such in the table, in §K, and in the sentence the clinician reads. Evidence
   that disagrees (CDSI v4.64 `absMinInt = 0 days`; no "should be repeated" in the three
   adult MMWRs) is quoted beside it, the Fred Hutch way.
3. **One adult floor is CDC's own** and is labelled so: the 8-week PCV15→PPSV23 minimum for
   an immunocompromising condition / cochlear implant / CSF leak. Every other adult gets
   the year as their floor (owner's second answer, 2026-10-11).
4. **A-P1-1 untouched** — ≥1 year is still what the app *recommends*; the 8-week option is
   still named, never substituted. S14-7 only judges doses already given.
5. **`S10-N1` folded in — and it DID NOT REPRODUCE.** "A 20-year-old with PCV21 recorded at
   17 has that dose counted" is false: the generic minimum-age check already uses the age
   at the dose. Only the *wording* was wrong (a 10-year-old's PCV21 dated at 9 said
   "currently ~10 years"). Fixed; no counting behaviour changed. **Do not re-open it
   looking for a counting bug.**
6. **Docs:** `CLINICAL_SPEC.md` §K rewritten (enumerated rows table + the full disagreeing
   evidence), plus `CLAUDE.md` (new non-negotiable "Every Interval Rule Lives In One
   Table"), `docs/agent/{clinical-rules,testing,architecture}.md`, `MAP.md`.

**Verification:** suite 412 → 455. Build clean. All 44 PneumoRecs comparison cases
**byte-identical** to pre-S14-7 — their shortest adult gap is exactly 365 days, so none
trips a new floor. Driven in the running app for both a voided dose and the
previously-silent one; **that caught a bug the tests missed** — a gap printed as
"1.1428571428571428 months" — now fixed, with a sweep that fails on any message containing
a raw fraction. Each of the seven "nothing is wrong" guards was confirmed to go red with
its fault introduced on purpose.

## What's NOT done — the remaining queue

- **Open owner decision (asked, not answered): rr7203a1's PCV13→PPSV23 minimum.** That MMWR
  states, in so many words, "the minimum recommended interval between PCV13 and PPSV23
  administration is ≥8 weeks … and ≥1 year for adults without these conditions." That pair
  is a **candidate to be promoted** from the catch-all note
  (`ADULT-PPSV23-AFTER-PCV-CATCH-ALL`) to a CDC-authority floor. It was not among the rows
  the owner enumerated on 2026-10-11, so it was left as a note. **Ask, don't default.**
- **Known asymmetry, deliberately not changed** (documented in `runWalk`): the PPSV23 walk
  receives the **counting** PCV doses, the PCV walk receives the **raw** PPSV23 doses
  (their verdicts do not exist yet). So a voided PPSV23 can anchor a PCV dose's gap but a
  voided PCV cannot anchor a PPSV23's. CDC's repeat-dose sentence favours the raw reading;
  aligning the two would move existing paediatric verdicts, which is outside S14-7.
- **`S8` (`P7-1` rulebook + `P2-7` `rule-docs-match-code` tripwire) — do this next.** The
  argument for it is now much stronger: the rule table IS the machine-readable half of
  P7-1, and the tripwire can compare the docs against `DOSE_INTERVAL_RULES` instead of
  against prose.
- **`S3-N2` / peds audit `P0-2`** (interval *keying*: CDC Table 2's stricter dose-2→3 cell;
  `recommend.js` keys on CURRENT age where `validate.js` keys on the earlier dose's age).
  S14-7 did **not** touch this — the scheduler still reads `intervals.js` directly.
- **Unchanged and still open:** `S10-N2` (P3), peds audit `P1-2` ("PCV dose 5 of 4"),
  `S4`–`S7`, `S9`, `S11`, `S12`, MeningoVax's 9 inline styles (different repo, owner's
  call). Ledger: `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`
  (git-ignored).
- **Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note; and
  now `S10-N1` as well (see above).

## Why this is a good stopping point

S14-7 is the whole clinical half of the S14 root cause, landed as one unit: the five gates
are deleted, every rule is in one table with its source and authority attached, the three
reproduced symptoms are answered, the suite is green, the build is clean, the comparison
harnesses are unchanged, and the behaviour was confirmed in the running app. `S14-1`…`S14-7`
together close the S14-RC review completely. Nothing is half-built.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout fix/s3-recorded-dose-intervals`.
2. Confirm the suite: **455 passing / 41 files.** Stop and diagnose any mismatch first.
3. **Open owner decisions — ask, don't default:**
   **(a) The branch is 1 commit ahead of origin and NOT pushed.** PR #22 now also carries
   S3/S3-N1 and S14-1…S14-6. The owner's original reason for holding it — that S3-N1
   shipped "no repeat is needed" copy she considers clinically wrong — **is now fixed by
   S14-7**, which deletes that sentence and voids those doses instead. So the hold reason
   has lapsed; whether to push and merge is still hers.
   **(b)** rr7203a1's PCV13→PPSV23 minimum (above).
   **(c)** Whether to open a small PR against MeningoVax for its inline styles.
   **Do not re-litigate:** the 2026-10-11 adult-floor determination, A-P1-1, the paediatric
   risk lists (`CLINICAL_SPEC.md` §C), or the seven S14-RC decisions.
4. Per-item workflow: reproduce → failing test first (**confirm it fails**) → fix → full
   suite green → **live-verify in the running app** → one commit per item ID. S14-7 is a
   fresh example of why the live step is not optional: the suite was green at 453 while the
   app printed "1.1428571428571428 months" on a card. For any guard whose assertion is
   "nothing is wrong", introduce the fault on purpose and watch it go red.
5. **Before changing any interval rule**, read the header of
   `src/logic/doseIntervalRules.js` and `CLINICAL_SPEC.md` §K. Add a table row; never add
   an age test to the evaluator.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.**
7. **Dev server:** `preview_start` reported port 51176 this session; the real port was
   **5174** (`/PneumoVax/`). Always read the real port from `preview_logs`.
