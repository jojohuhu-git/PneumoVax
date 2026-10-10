# PneumoVax — Handoff after S10 (part 1), dates and ages (2026-10-10)

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s10-dates-and-ages`**, off `main` @ `b158dab`. **Pushed → PR #19, CI green,
`mergeStateStatus: CLEAN` — but NOT MERGED.** The merge was blocked by this environment's
review guardrail, so **the owner merges it** (`gh pr merge 19 --squash --delete-branch`).

Baseline was 156 passing; now **226 passing (20 files)**, all green, working tree clean at
`241cf74`. Production build clean.

This app's core promise is honesty: a silent wrong answer is worse than a crash. S10's P0
was a silent wrong answer.

## The one root cause

The Age step collected a real **date of birth**, said in its own subtitle that it did so to
check dose dates precisely, then converted it to a number of months and threw the date away.
Nine findings from three separate documents were all that one decision.

## What's done — by ID, one commit each

1. **`P3-2`** `29726e6` — ported the five calendar helpers into `dateUtils.js`
   (`calendarMonthsBetween`, `addCalendarMonths`, `addCalendarYears`,
   `calendarIntervalElapsed`, `daysInMonthOf`).
2. **`P3-1` + `P3-3`** `957e2bd` — the date of birth is kept in `App` state, derived at
   render (so a tab open overnight ages the patient), and reaches the engine. New
   `src/logic/patientAge.js`. Age-at-dose measured from the birthday, in one shared place.
3. **peds audit `P1-1`** `0af1a30` — CDC's **4-day grace** on minimum ages. New
   `src/logic/intervals.js` (`GRACE_DAYS = 4`). PCV's 6-week floor now has one home,
   `PCV_MIN_AGE_DAYS = 42`.
4. **`A-P0-1` (the P0)** `ed43e6d` — the 65th-birthday test compares the dose date against
   the real birthday. The audit's own sweep, re-run: **2,782 of 29,565 misclassified → 0**.
5. **`P3-4`** `8aec54d` — displayed ages floor, never round up. Found live: a card read
   "age 64 years 12 months" beside the 65-year rule.
6. **`A-P2-11`** `24a393b` — the 1-year and 5-year gaps are calendar months, not 365/1826
   days. A rec now reports `minIntervalDays` **or** `minIntervalMonths`, exactly one non-null.
7. **`P3-6`** `99563d0` — a dose dated before birth says so, instead of "Given at ~birth".
8. **queue `P1-1` + `P3-7`** `2b19593` — **all five** date pickers use the clinician's local
   date; the clock is read once in `App` and threaded down. The only `new Date()` left in
   `src/` is inside `todayISO()`.
9. **Docs** `241cf74` — `CLINICAL_SPEC.md` §K gains the three new rules with verbatim live
   quotes; §H's prose had A-P0-1's error too (it called the under-65 row "shared clinical
   decision-making") and its implementation note was stale — both corrected.

**Every item was live-verified on the running app with a clean console**, including the
31-January baby that was S10's stated stopping point (accepted, "8 months · Infant (<2y)",
and over 800 consecutive days: no negative age, strictly increasing, anniversaries exact).

**Regression evidence:** the three PneumoRecs harnesses were run on `main` and on this
branch and diffed. `pedsCases` and `hsctCases` byte-identical; `adultCases` differs only in
a unit label. **No clinical verdict moved in any of the 44 comparison cases.**

## What's NOT done

**S10b — the rest of Phase 3.** A natural second PR, as the session plan anticipated:
- **`P3-5`** — exact weeks for young infants (`fmtAgeMonths` still converts months→weeks
  with a second averaged constant, `× 4.348`). Pass `exactDays` from the callers that have
  a DOB and a real date.
- **`P3-8`** — `ageEntry.js`, the impossible-age guard. Typing `0026` for `2026` is still
  accepted silently and produces an adult recommendation for an infant.
- **`P3-9` + `P3-9b`** — adult-only risks. **Still blocked on `P6-3`** (S13's citation
  machinery) for the UI half. **But `P3-9b`'s logic half is live peds `P0-3` today** and
  does NOT depend on P6-3 — a 15-year-old with "Cigarette smoking" ticked still gets an
  at-risk catch-up regimen. Consider pulling that guard forward on its own.

**S3–S9, S11–S13** unchanged; see the ledger in
`.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored, updated).
**S3's gate is now satisfied** once #19 merges, and S3 must reuse `intervals.js`'s
`GRACE_DAYS` / `intervalMeetsMinimum` rather than hand-typing the grace a third time.
**S4 shrank** — queue `P1-1` is done, so S4 is now P1-2, P1-3, P1-4 only.

## Two NEW findings this session (not in any audit)

- **`S10-N1` (P2) — PCV21's 18-year gate is checked against the patient's CURRENT age, not
  the age at the dose** (`validate.js`, the `PCV21 && ageMonths < Y18_MONTHS` branch). A
  20-year-old with PCV21 recorded at 17 has that dose counted. Left alone deliberately:
  fixing it changes dose counts and belongs in a sourced item, not a drive-by.
- **`S10-N2` (P3) — the generic "repeat this dose only" line is appended to every invalid
  dose, including one dated before birth**, where it is odd advice (you cannot repeat a dose
  that was never given). Visible on screen. Cosmetic; fold into S12's label pass.

## Open owner decisions

1. **Merge PR #19.** CI is green and the branch is clean; this environment blocked the merge
   for review. Nothing else in the queue should start until it lands.
2. **`A-P1-1` is STILL OPEN and untouched** (carried over from S2). Adults ≥50 who are
   immunocompromised are shown an 8-week PPSV23 interval where CDC says ≥1 year. The
   clinical reading is settled by four tier-1 sources; what needs your sign-off is
   **amending a `CLAUDE.md` non-negotiable rule** ("Adult PPSV23 Interval Is
   Risk-Class-Keyed" has no age term). The 19–49 behaviour is correct and must not change.
   **Ask; do not default.**

## Why this is a good stopping point

The P0 is closed and measured with the audit's own instrument. The seven items that shipped
are one coherent unit — they share a root cause and would have fought each other if split.
The suite is green, the tree is clean, the comparison harnesses prove nothing else moved,
and the three deferred items (`P3-5`, `P3-8`, `P3-9`/`P3-9b`) are independent of everything
landed here.

## Resuming

1. `cd ~/Downloads/PneumoVax` — **first check whether PR #19 merged.** If yes,
   `git checkout main && git pull`. If not, it is still the blocker.
2. `npm test` — confirm **226 passing / 20 files** before any new work.
3. **Say the session number and its recommended model + effort in one line, and WAIT**
   (queue rule 1). Likely next is **S10b — Opus 5 at high effort**, or **S3 — Opus 5 at
   high effort** now its gate is satisfied. **Owner picks the order.**
4. Answer open decision (2) above before any session touches `A-P1-1`.
5. Per-item workflow: reproduce → failing test first → fix → full suite green →
   live-verify in the running app → one commit per finding ID.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.** The dev server now has `"autoPort": true` in `.claude/launch.json`, so
   `preview_start` no longer fights other chats for port 5173.
