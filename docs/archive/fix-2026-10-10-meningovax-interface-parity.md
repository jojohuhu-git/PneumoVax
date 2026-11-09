> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# PneumoVax ← MeningoVax interface parity queue

**Written:** 2026-10-10
**Source of truth:** MeningoVax `main` @ `eed4082` (135 test files / 1,635 tests green)
**Target:** PneumoVax `main` @ `821ab9c` (11 test files / 156 tests green)
**Last parity port:** 2026-09-15 (PneumoVax #15, dose group headings). MeningoVax has had ~45 commits since.

---

# ═══ SESSION PLAN — read this part first ═══

> **⚠️ ID COLLISION — this file's `P1-3`/`P2-1` are NOT the clinical audit's `P1-3`/`P2-1`.**
> Here: P1-3 = "a row nobody typed in is counted as a dose"; P2-1 = "the test suite is
> graded against the real clock". In `docs/archive/audit-2026-10-10-pneumovax-clinical-peds.md`
> they are PCV interval keying and the "3 doses before 12 months" count. **Qualify every ID
> as "queue P1-3" or "peds audit P1-3".**
>
> **Three ID spaces now exist. Use these names:**
> | Write it as | Means | Lives in |
> |---|---|---|
> | `queue P1-3` | this file | `.claude/prompts/fix-2026-10-10-…-parity.md` |
> | `peds audit P0-1` | S1's paediatric audit | `docs/archive/audit-2026-10-10-…-peds.md` |
> | `A-P0-1` | S2's adult/HSCT audit — **always `A-`prefixed, never collides** | `docs/archive/audit-2026-10-10-…-adult.md` |
>
> **⚠️ The audit's two "owner decisions" are WITHDRAWN (2026-10-10).** Sources were
> re-fetched live: p2016 Table 1's grid keys on age-at-previous-dose and therefore **agrees**
> with CDC Table 2; the app matches neither. Both items fold into audit P0-2. **Do not ask
> the owner about them.** Rule 5 below still applies to everything else.

This project runs across **13 sessions**. Each one is a stopping point: it ends with a
merged PR (or, for the audit sessions, a written findings file) and a handoff, so the next
conversation can start cold.

## Rules for every session

**1. BEFORE DOING ANY WORK, tell the owner the recommended model and effort for this
session, and wait.** She changes the setting herself and it cannot be changed mid-session
without losing the thread. Say it in one line, e.g.
"This is S4 — recommend Sonnet 5 at medium effort. Say go when you've set it."
Do not start reading files, do not start planning, do not be helpful first. Just say it.

**2. Then run the `resume` skill** to pick up the previous handoff, and confirm the session
number against the Progress ledger below.

**3. One session = one session.** Do not roll into the next one because there is context
left. Stop at the stopping point, run the `handoff` skill, and say which session is next
and what model it needs. A session that quietly becomes two is how a stopping point stops
being one.

**4. Every code session:** `fix-queue` skill — reproduce, failing test first, fix, full
suite, live-verify in the running app, one commit per item, PR per the `ship` skill.

**5. Every clinical session:** `verify-clinical-source` skill first. Fetch the page live
and quote it. Never port a number from MeningoVax — those are meningococcal.

**6. Start the dev server at the start of every code session** (`preview_start`, name
`"PneumoVax dev server"`). If the preview tool reports all dev-server slots taken by other
chats, say so to the owner and ask her to close one — do NOT fall back to running the
server through Bash, and do NOT claim a fix is verified without driving it.

## Why the model recommendations differ

These are cost/risk judgment calls, not facts. The reasoning:
- **Opus 5** where a wrong answer is a patient-safety problem (clinical rules, dose
  counting), or where a refactor touches many files at once.
- **Sonnet 5** where MeningoVax's own commit is the reference, the diff shape is known, and
  the work is a careful port rather than a decision.
- **Haiku is not recommended for any session in this project.** It is a clinical app and
  every session either changes clinical logic or changes what a clinician reads.
- Effort `max`/`xhigh` is for the audit sessions, which are pure reasoning over source
  documents. `high` for structural change. `medium` for specified ports. `low` only for
  documentation.

## Progress ledger — UPDATE THIS AT THE END OF EVERY SESSION

| # | Session | Model / effort | Status |
|---|---------|----------------|--------|
| S1 | Clinical audit — paediatric pathways | Opus 5 / max | **DONE 2026-10-10** → `docs/archive/audit-2026-10-10-pneumovax-clinical-peds.md` (3 P0, 5 P1, 5 P2; P3-9b is LIVE not latent). **CORRECTED same day: audit P1-3 + audit P2-1 are NOT owner decisions — both fold into audit P0-2. 0 open decisions.** |
| S2 | Clinical audit — adult, HSCT, precedence, number census | Opus 5 / max | **DONE 2026-10-10** → `docs/archive/audit-2026-10-10-pneumovax-clinical-adult.md` + `docs/archive/census-2026-10-10-pneumovax-numbers.md` (1 P0, 3 P1, 11 P2; 17 rules verified correct; all 18 refs swept). **IDs are `A-`prefixed** (A-P0-1 …) so they cannot collide with the peds audit or this queue. **0 open clinical decisions**; **A-P1-1 DECIDED AND SHIPPED 2026-10-10** (with S10, PR #19): the `CLAUDE.md` rule is amended — PCV15→PPSV23 is ≥1 year for every adult 19+, 8 weeks named as a considerable minimum for IC/cochlear/CSF. **No open clinical decisions remain in this queue.** |
| S3 | P1-0 — the dose-spacing check (+ `S3-N1`) | Opus 5 / high | **DONE 2026-10-11 → PR #22.** Also closed **`S3-N1`**, approved by the owner mid-session: adults no longer read "On time" for a gap shorter than CDC advises — the dose reads "Valid", counts, and says no repeat is needed. Suite 353 → 393 (38 files).<br> Closed queue `P1-0` and peds audit `P1-4` (+ `P1-5`, which was the same defect reconfirmed). Three minimums now in `logic/intervals.js`, read by both the validator and the scheduler: PCV→PCV 4/8 weeks keyed on the **earlier** dose, PCV→PPSV23 ≥8 weeks + no same visit, PPSV23 dose 2 ≥5 calendar years. Sub-minimum → `invalid` (CDC states the consequence); an invalid dose **anchors** the next one; PCV7 anchors nothing. **Rules 2–3 are paediatric only** — the adult notes state no such minimums (verified live with a positive control), so doses at ≥`ADULT_SCHED_MIN_M` get no interval verdict. Suite 353 → 371 (36 files); all 44 comparison cases byte-identical. **Deferred, with new IDs: `S3-N1`, `S3-N2` below.** |
| S4 | Phase 1 remainder — 3 bugs + guard message | Sonnet 5 / medium | NOT STARTED — **queue `P1-1` is already DONE (S10, PR #19)**, so S4 is now P1-2, P1-3 and P1-4 only. |
| S5 | Phase 2a — pinned clock, PneumoRecs cases into CI | Sonnet 5 / medium | NOT STARTED |
| S6 | Phase 2b — one-number-one-home refactor (P2-12) | Opus 5 / high | NOT STARTED |
| S7 | Phase 2c — patient grid + the four sweeps + guards | Opus 5 / high | NOT STARTED |
| S8 | Phase 2d — citation data, citation tests, coverage | Sonnet 5 / medium | NOT STARTED — **NEXT, by owner direction 2026-10-11.** Also carries `P7-1` + `P2-7` (the rulebook and its `rule-docs-match-code` tripwire) and therefore the **durable** half of the stale-clinical-rule problem. S3 already fixed today's FOUR copies of the pre-A-P1-1 adult interval rule (`testing.md`, `clinical-rules.md` prose + table, `architecture.md` ×2); only the tripwire stops a fifth. |
| S9 | P4-1 + Phase 4 — shared dose editor and its three riders | Sonnet 5 / medium | NOT STARTED |
| S10 | Phase 3 — dates and ages | Opus 5 / high | **PART 1 DONE 2026-10-10 → PR #19, MERGED (`1eac734`).** Closed `A-P0-1` (P0), peds `P1-1`, `A-P2-11`, plus `P3-1`, `P3-2`, `P3-3`, `P3-4`, `P3-6`, `P3-7` and **queue `P1-1`**. Suite 156 → 244. **S10b DONE 2026-10-10 → PR #20, **MERGED 2026-10-11** (`6e9dbe5`). The hold was released by the owner once `P3-9`'s `RiskAgeNote` landed in it; Phase 3 is closed. Branch `fix/s10b-rest-of-phase-3`: `P3-5` (exact weeks, + the `am<0.25` "Birth" cut), `P3-8` (`ageEntry.js` impossible-age guard), and `P3-9b`'s LOGIC half (= peds `P0-3`, the adult-only risk trap). Suite 244 → 298 (26 files). Phase 3 is now closed except `P3-9`'s UI half (`RiskAgeNote`), blocked on `P6-3` — which now ALSO gates PR #20, so S13/`P6-3` may be worth pulling forward. `main` does NOT contain S10b; ask the owner which base the next session branches from.** |
| S11 | Phase 5 — keyboard and focus | Sonnet 5 / medium | NOT STARTED |
| S12 | Phase 6a — status labels, then delete the Color key | Sonnet 5 / medium | NOT STARTED |
| S13 | Phase 6b — citations, note split, disclaimer, Phase 7 | Opus 5 / high | **DONE 2026-10-10 → PR #21 (open, awaiting owner merge).** `P6-3` (cite()/highlightUrl + numbered inline citations; ALL 35 engine notes wired to live-fetched CDC sentences; engine-wide marker/cite parity sweep), `P6-4` (note → `{lead, detail}` + "Why this"; median note 188→129 chars, longest 459→225), `P6-5` (Results reads the engine's `perDose`; **engine fix: `perDose` was `{}` not `[]` on the hard-stop path**), `P6-6` (toggles keep their label), `P6-7` (current-risk-status caveat + the PPSV23 2–5y case), `P7-2` (PneumoVax is AHEAD — tripwire added, nothing ported). Suite 327 → 353 (35 files). Harnesses byte-identical. **Also: `P3-9`'s UI half (`RiskAgeNote`) shipped in PR #20, which is now MERGED — the hold is cleared and Phase 3 is closed.** |

---

## S1 — Clinical audit, paediatric pathways
**Recommend: Opus 5, max effort.** Pure reasoning over source documents; a missed rule here
is a missed rule in every session after it. Read-only — no code changes, so the cost is
reasoning, not risk.

**Scope:** `pcvInfant`, `pcvRiskChild`, `pcvHealthyChild`, and `pedsRiskRowClass`.
For each branch: fetch the cited CDC page live, quote the sentence the branch rests on, and
record whether the code matches. Check AAP where it speaks (AAP governs on disagreement).
**Must specifically answer:**
- P3-9b — are smoking and alcohol use disorder absent from CDC's paediatric risk table?
- Is it right that `pcvInfant` receives no risk factors at all?
- Does `pedsRiskRowClass` returning a result for ANY risk tick match CDC Table 4?
- Are there paediatric interval rules the validator should enforce but doesn't (feeds S3)?
**Output:** `docs/archive/audit-2026-XX-pneumovax-clinical-peds.md` — a P0/P1/P2 findings
queue, plus a `lastVerified` date and verbatim quote for every reference touched.
**STOP after writing the file.** Do not fix anything. Use the `app-audit` skill.

## S2 — Clinical audit, adult + HSCT + precedence + number census
**Recommend: Opus 5, max effort.** Same reasoning as S1.

**Scope:** `pcvAdult`, `adultPpsvIntervalClass`, `hsctAdvisory`, `pcv21GeoNote`, and the
precedence choices (hard stop over HSCT; age-outer/risk-inner).
**Must also produce the number census** — for every age threshold, interval and series
total in the app: where does it live, and how many copies exist? **This is S6's input.**
**Also:** finish the `lastVerified` + verbatim quote sweep for all 18 refs — S8's input.
**Output:** `docs/archive/audit-2026-XX-pneumovax-clinical-adult.md` + the census.
**STOP after writing the files.**

## S3 — P1-0, the dose-spacing check
**Recommend: Opus 5, high effort.** Changes dose counting in both directions; the clinical
numbers come from S1/S2's quotes, not from MeningoVax.

**Do not start before S1 and S2 are both merged.** The intervals must be sourced first.
Carry the previous kept dose through `runWalk`; add the interval check; include CDC's 4-day
grace. Decide `invalid` versus an "off-window — repeat" middle verdict. Cover PPSV23's own
interval rules if S1/S2 found any.
**Stopping point:** PR merged, suite green, live-verified on a 2/2.5/3/3.5-month series.

## S4 — Phase 1 remainder
**Recommend: Sonnet 5, medium effort.** Four well-specified fixes, MeningoVax commits as
reference, no clinical judgment.

P1-1 (five UTC date pickers → `todayISO()`), P1-2 (the blank recommendation card — ⚠
reproduce it live first), P1-3 (blank dose rows), P1-4 (the guard script's message).
**Stopping point:** PR merged. Four commits.

## S5 — Phase 2a, the clock and the PneumoRecs cases
**Recommend: Sonnet 5, medium effort.**

P2-1 (pin the test clock — do this first, it changes what every other test means), P2-13
(wire `scripts/*.mjs` into the suite as real tests), P2-11 (the CI comment).
**Watch for:** pinning the clock may turn existing tests red. That is the tripwire working
— those fixtures were reading the real calendar. Fix the fixtures, do not unpin the clock.
**Stopping point:** PR merged, and `npm test` now runs the CDC PneumoRecs cases.

## S6 — Phase 2b, one number one home
**Recommend: Opus 5, high effort.** Touches both `recommend.js` and `validate.js` at once
and moves every threshold in the app. Widest blast radius in the project.

**Needs S2's census.** Extend `scheduleConstants.js` into MeningoVax's three-sibling shape
(ages / intervals / series totals), imported by BOTH engine and validator. Kill
`validate.js:130`'s private copy of the 2-year floor and the local `M` table.
Add the tests that assert one-home holds (MeningoVax has 42).
**Stopping point:** PR merged, suite green, no threshold written twice anywhere.

## S7 — Phase 2c, the grid and the sweeps
**Recommend: Opus 5, high effort.** Deciding what counts as a never-event is judgment, and
getting it wrong gives a sweep that passes while proving nothing.

P2-2 (grid, seeded from the PneumoRecs cases — not a second source), P2-3 (never-events),
P2-4 (two-run relations), P2-5 (dose counter), P2-6 (the two guards-on-guards).
**Port MeningoVax's no-vacuous-assertions guard in the same PR**, or a sweep can pass
because it swept nothing.
**Stopping point:** PR merged. Expect the test count to jump by several hundred.

## S8 — Phase 2d, citations and coverage
**Recommend: Sonnet 5, medium effort.** Mechanical once S1/S2 produced the dates and quotes.

P2-8 (add `lastVerified` + `quote` to all 18 refs from the audit output, then port the
three citation tests — **including the guard that the pinned clock has not frozen the
12-month tripwire**), P2-9 (coverage tooling, then report what `recommend.js` and
`validate.js` never execute), P2-7 + P7-1 (the rulebook and its match-code test).
**Stopping point:** PR merged. The 12-month staleness tripwire is live.

## S9 — Shared dose editor and its riders
**Recommend: Sonnet 5, medium effort.**

P4-1 (extract `DoseEditor.jsx` from the two drifted copies), then P4-2 (typed future date),
P4-3 (focus and Enter in rows), P4-4 (the one yes/no question — Option B, per the owner's
decision; replaces the current clear-all link).
**Stopping point:** PR merged. Both surfaces render from one component.

## S10 — Phase 3, dates and ages
**Recommend: Opus 5, high effort.** Changes age arithmetic and therefore dose counts.
**Do not start before S7 is merged** — the sweeps are what will catch a regression here.

P3-1 (keep the date of birth), P3-2 (calendar-exact months — ⚠ clinical), P3-3 (exact age
at dose — ⚠ clinical), P3-4 (floor, never round up), P3-5 (exact weeks), P3-6 ("Before
birth"), P3-7 (one clock read), P3-8 (`ageEntry.js`), then P3-9 **with P3-9b's guard in the
same PR** — option (b) wording, sourced not invented.
**This is the largest clinical session. Split it if context runs short** — P3-1/P3-2/P3-3
are one unit, the rest can be a second PR.
**Stopping point:** PR(s) merged, suite green, live-verified on a 31-January baby.

## S11 — Phase 5, keyboard and focus
**Recommend: Sonnet 5, medium effort.** MeningoVax's K1–K7 commits are the reference and
the diffs are small.

P5-2 and P5-1 **together** (`type="button"` must land with or before the `<form>`, or every
button becomes an Enter trap), then P5-3 (focus lands), P5-4 (focus ring), P5-5 (Escape),
P5-6 (the fake button).
**Stopping point:** PR merged. Tab and Enter through the whole wizard with no mouse.

## S12 — Phase 6a, labels then the key
**Recommend: Sonnet 5, medium effort.**

P6-1 (self-describing status labels, pneumococcal wording) **then** P6-2 (delete the Color
key). **Hard constraint: if this session cannot finish both, ship P6-1 and leave the key
in place.** Make sure the `noncounting` chip reads self-evidently before the key goes.
**Stopping point:** PR merged. No legend, and no label that needs one.

## S13 — Phase 6b, citations, notes, and the docs tail
**Recommend: Opus 5, high effort.** P6-4 rewrites every note in the engine.

P6-3 (numbered inline citations), P6-4 (lead/detail split + "Why this"), P6-7 (the
current-risk-status disclaimer sentence), P6-5 (one history walk, not two), P6-6 (toggle
labels), P7-2 (note the MeningoVax inline-style regression — consider a small PR there).
**Split if needed:** P6-3 is a prerequisite for P6-4; P6-5/P6-6/P6-7 are independent and
small enough to defer to a short follow-up.
**Stopping point:** PR merged. Project complete — write a closing handoff.

---


## How this queue was built

Read both codebases file by file; ran both test suites. **Not** verified by driving the
live apps — the preview tool refused (5 dev server slots held by other chats) and nothing
was listening on 5173–5181. Items marked **⚠ confirm live** should be reproduced on screen
before fixing.

## Scope rule

"Interface parity" only. Deliberately excluded as meningococcal-specific:
pentavalent dual-credit notes, `pentavalentCredit.js`, the MenB antigen family lock, the
"Option 1 / Option 2" two-ways-to-give layout, and the per-dose "Needs input"
risk-at-dose prompt. The last one *may* transfer (whether a child was at-risk on a past
PCV date can change the dose count) but that is a clinical question — raise it separately,
do not fold it in here.

---

# Phase 1 — Wrong answers today (do first)

## P1-0. The validator NEVER checks the gap between two recorded doses (⚠ P0, CLINICAL) — ✅ DONE 2026-10-11 (S3, PR #22)

> **CLOSED.** Implemented as described below, with two deliberate narrowings and one
> correction to this item's own spec, all recorded in `CLINICAL_SPEC.md` §K:
>
> 1. **This item said to anchor on the previous KEPT dose. That is wrong**, and the first
>    draft that did it kept two doses out of a 2/2.5/3/3.5-month series instead of one. CDC:
>    *"The repeat dose should be spaced after the invalid dose by the recommended minimum
>    interval"* — so an **invalid** dose anchors the dose that replaces it. Only PCV7 anchors
>    nothing. A test caught this; see `regression-p1-0-*`.
> 2. **The adult streams are deliberately NOT interval-checked** (new IDs `S3-N1`). The
>    adult notes were read live with a positive control: no same-visit sentence, no 8-week
>    floor, no stated minimum of any kind. Adult gaps are recommendations for the *next*
>    dose. Invalidating one would substitute a minimum for a recommendation — the exact
>    mistake A-P1-1 was raised to correct.
> 3. **CDC Table 2's stricter dose-2→3 cell is not implemented** (new ID `S3-N2`): previous
>    dose at 7–11 months needs 8 weeks *and* age ≥12 months. The validator uses the more
>    permissive p2016-footnote reading, so it can never tell a clinician to repeat a dose
>    Table 2 would have accepted. That cell is a **keying** question and keying belongs to
>    peds audit `P0-2`.
>
> Also from this item's "scope check": **PPSV23 does have its own recorded-dose rules** —
> the 5-year dose-2 gap, now enforced for paediatric doses. The `<65 → ≥65` rule is about
> which CDC *row* a patient is on, not about dose validity, and was left alone.

**Found 2026-10-10. This is the most serious finding in the audit and it is NOT an
interface parity item — it is a clinical defect present since the app was first built.**

`runWalk` (`validate.js:156-183`) calls `validateOnePCV` / `validateOnePPSV23` on each dose
**in isolation**. There is no `prev` dose, no interval argument, and no interval logic
anywhere in the file. A dose is graded on three things only: age at the dose, the product,
and whether a date exists. Verified: `grep -E "interval|spacing|tooSoon"` over
`validate.js` returns only `daysBetween` (used for age) and two message strings.

`recommend.js` does not cover for it. `dueState(anchorDate, intervalDays, today)`
(`recommend.js:139`) is purely FORWARD-looking — it anchors on the most recent dose and
says whether the NEXT one is due. Nothing ever looks backwards at the gap between two
doses already on the record.

**Concrete failure.** The app's own rule, at `recommend.js:185`, is
`const minInterval = am < M.m12 ? WK4 : WK8` — 4 weeks under 12 months, 8 weeks at or
after. A PCV series recorded at 2, 2.5, 3 and 3.5 months is **four doses given at ~2-week
intervals**. Every one is graded "On time", all four count, `pcv.count` reaches 4, and the
child is reported as having a complete 4-dose series. At least two of those doses do not
count and should be repeated. The app applies its own interval rule when scheduling
forward and ignores it when reading the record.

**MeningoVax does check this.** Its chip vocabulary lists "a spacing violation" as one of
the three true-error cases (`RecCard.jsx`, `doseChipLabel.js`), and its validator is 1,343
lines against PneumoVax's 225.

**Why nobody caught it:** it has been there since the first commit, through 156 green
tests, the 5 PneumoRecs alignment fixes, and three design-parity sessions. Every existing
test asks "does this patient get the right answer"; none asks "is every rule in CDC's table
actually implemented". See [[project_why_rules_keep_drifting]].

**Fix:** carry the previous KEPT dose through `runWalk` and add an interval check, reading
the minimum from ONE shared home (see P2-12 — do not hand-type it a third time; it is
already written in `recommend.js` and would then be in two places). MeningoVax's
`intervals.js` is the model. Reuse MeningoVax's CDC 4-day grace rule
(`regression-p1-1-four-day-grace.test.js`) — a dose 4 days short of the minimum counts.

**⚠ Run `verify-clinical-source` first.** This changes dose counting in both directions and
needs the live CDC child/adolescent and adult pneumococcal notes quoted for every interval,
plus AAP. Do NOT port MeningoVax's numbers — they are meningococcal. Also decide whether an
interval violation makes a dose `invalid` (repeat it) or needs PneumoVax's own
"off-window — repeat" middle verdict.

**Scope check before writing the fix:** confirm whether PPSV23 has recorded-dose interval
rules of its own (the 5-year second-dose gap for at-risk patients, and the <65 → ≥65 rule)
and whether those are validated anywhere. Likely the same gap.


## S3-N1. An adult's too-close doses are accepted and read "On time", with no caveat — ✅ DONE 2026-10-11 (S3, PR #22)

> **APPROVED AND BUILT.** The owner approved the third dose state on 2026-10-11. Built as
> the **flag** `offWindow` on a `status: 'valid'` result — NOT a status of its own, so the
> dose keeps its `effectiveDoseNum` and nothing downstream that counts doses can drop it.
> Chip reads **"Valid"** (vaxapp's settled vocabulary) instead of "On time"; the note says
> the dose counts and no repeat is needed. Flags ≥1 year between adult PCV doses and ≥1
> year PCV15→PPSV23, except where the 8-week minimum may be considered (IC / cochlear /
> CSF), where only a gap under 8 weeks is flagged — the app must not second-guess an option
> it offers on its own card.
>
> **Live-verification earned its keep here.** The unit tests passed `riskIds` straight into
> `analyzeHistory` and were green while `recommend.js` never forwarded it, so in the real
> app every adult got the flat 1-year advice and IC patients were wrongly flagged. There is
> now a `recommend()`-level test block; it was confirmed to fail without the forwarding.

**Found 2026-10-11 (S3), while deciding how far P1-0's check should reach.**

A 70-year-old recorded with PCV13 in January and PCV20 five weeks later gets **"On time"**
on both, and both count. CDC's adult notes say *"1 dose PCV20 or 1 dose PCV21 at least 1
year after the last PCV13 dose"* — so five weeks is well short of the advice.

**Why S3 did not invalidate it, and should not have.** CDC states adult gaps as
recommendations for the *next* dose. It never calls them minimum intervals and never says a
short adult gap stops a dose counting — unlike the paediatric catch-up table, whose column
is literally headed "Minimum Interval Between Doses". Verified live 2026-10-11 with
"pneumococcal" (13 hits) as a positive control that the whole page, collapsed sections
included, had been read: the adult page has **no** same-visit sentence, **no** "8 weeks
after the most recent PCV", **no** "8 weeks after the PCV15 dose". Marking such a dose
invalid would substitute a minimum for a recommendation — precisely the error A-P1-1 was
raised to correct.

**But "On time" is too generous.** The honest output is neither "invalid" nor "On time": it
is *"this dose counts, and it was given sooner than CDC advises"*. That is the **"off-window
— repeat" middle verdict** P1-0 asked about, and it turns out to be the right answer for
adults and the wrong answer for children (children have a real minimum, so children get
`invalid`).

**This is an owner decision, not an agent one**, because it adds a **third dose status** to
a UI that today has valid / invalid / noncounting, and that status has to render on every
surface that shows a dose chip. Ask before building it. Scope if approved: a non-invalidating
advisory status; the dose still counts; copy must not read as an error.

## S3-N2. CDC Table 2's stricter dose-2→3 cell is not enforced (P2 — belongs with peds audit P0-2)

The validator uses p2016's footnote reading (earlier dose <12 months → 4 weeks). CDC Table 2
is stricter for one cell: dose 2→3 where the previous dose fell at **7–11 months** needs
**8 weeks AND age ≥12 months** ("wait until at least 12 months old").

Deliberately deferred: this is the same **keying** question peds audit `P0-2` owns, and the
footnote reading is the more permissive of the two, so today's validator can never tell a
clinician to repeat a dose Table 2 would have accepted. Implement both together, for the
scheduler and the validator at once, or the app will advise a date it then rejects.

## P1-1. Date pickers run on UTC's clock, not the clinician's
**Files:** `StepAge.jsx:83`, `StepHistory.jsx:54`, `StepHistory.jsx:81`,
`Results.jsx:228`, `Results.jsx:256`
**Now:** `max={new Date().toISOString().slice(0, 10)}` — 5 copies.
**Problem:** after ~17:00 Pacific, UTC is already tomorrow, so the picker offers a date
`validate.js` then correctly rejects as "in the future."
**Fix:** use `todayISO()` — already in this repo's `src/logic/dateUtils.js`, just unused here.
**MeningoVax:** PR #48 (`3d49f89`), plus `regression-dob-max-local-not-utc-ui.test.jsx`.
**Tests owed:** 1 UI test asserting the `max` attribute equals local date, with the clock
faked to an evening hour in a UTC-behind zone.

## P1-2. A card can end up with no body and no way to open it ⚠ confirm live
**File:** `RecCard.jsx:145`
**Now:** `const [expanded, setExpanded] = useState(!isNeutral)` — seeded once at mount.
`isNeutral` ALSO decides whether the expand button renders (`RecCard.jsx:155`).
**Problem:** press "Adjust age" so a complete card becomes a due card → `expanded` is
stale `false` while the toggle has disappeared. Body gone, no control to bring it back.
**Fix:** derive what is SHOWN from current props each render, as MeningoVax does:
`const showBody = !collapsible || expanded;` Keep `expanded` as the clinician's own choice,
consulted only while the toggle exists.
**MeningoVax:** U5 (`9c04ae5`), `regression-u5-card-body-follows-collapsible-ui.test.jsx`.
**Tests owed:** logic + UI pair.

## P1-3. A row nobody typed in is counted as a dose
**Files:** `StepHistory.jsx:15` (`addPcv`), `StepHistory.jsx:19` (`addPpsv`),
`Results.jsx:135` / `Results.jsx:139` (same two again, in the Results panel)
**Now:** `+ Add PCV dose` creates `{date:'', product:''}` and nothing ever removes it.
**Problem:** click Add, type nothing, continue — the engine grades a dose of unknown date
and the recommendation moves.
**Fix:** port `logic/doseIdentity.js` whole (`newDoseRow`, `isBlankDoseRow`,
`dropBlankDoseRows`), sweep blank rows when LEAVING a history step (never while in it),
and add the "A dose was given, but the date and brand are unknown" tick so a genuine
undocumented dose can still be recorded. Count doses, not rows, in the
"Recorded doses (N)" button label.
**MeningoVax:** K1 (`6b37c4a`) + `regression-k1-blank-row-is-not-a-dose{,-ui}.test.{js,jsx}`.
**Owner decision 2026-10-10:** vaxapp is being RETIRED (pieces kept for future builds),
so there is no cross-repo port owed. Fix PneumoVax only. Do not open a vaxapp PR.

## P1-4. `check-root-notes.sh` message contradicts its own allowlist
**File:** `scripts/check-root-notes.sh` — `allowed=` includes `CLINICAL_SPEC.md`, but the
printed STOP message says "Only CLAUDE.md, MAP.md, and README.md belong at the top level."
**Fix:** one-line message edit. Trivial, but it is the guardrail telling the next session
something untrue. (The `CLINICAL_SPEC.md` allowlisting itself appears deliberate — do NOT
"fix" that without asking.)

---

# Phase 2 — The safety net (do before Phases 3–6)

Phases 3–6 change age arithmetic and dose counting. PneumoVax's current suite cannot
catch a regression in either: 156 tests, 11 files, 4 of them UI, no sweeps, no pinned
clock. Build the net first or the later phases are unverifiable.

## P2-1. The test suite is graded against the real clock
**Now:** no `TEST_TODAY`, no `test-today.js`; `test-setup.js` is 165 bytes and pins nothing.
**Problem:** every dated fixture rots silently. A dose that computes to 2.0 months
(valid) today computes to 1.97 (invalid) tomorrow and the suite goes red with nobody
having touched the code. This is the failure mode already recorded in memory
(`feedback_utc_date_fixtures`).
**Fix:** port `src/test-today.js` and the clock-pinning in `src/test-setup.js`.
**MeningoVax:** L2-1, plus `date-pinning.test.js`.
**Do this one first in the phase** — it changes what every other test means.

## P2-2. No shared patient grid
**Now:** nothing. **MeningoVax:** `src/test-grid.js` (14.3K), derived from `riskFactors.js`
and `brands.js`, so adding a risk factor widens every sweep with no test edit.
**Fix:** port the pattern, built from PneumoVax's own 20 risk factors and 6 products.
Include B2's realism lessons: fractional ages, real dates of birth (not raw `ageMonths`),
and at least one invalid-dose profile.
**Note:** PneumoVax already has `scripts/adultCases.mjs`, `pedsCases.mjs`, `hsctCases.mjs`
(the PneumoRecs comparison harness). Check whether the grid should be built from those
rather than alongside them — do not create a second source of cases.

## P2-3. No never-events sweep
**Fix:** port `sweep-never-events.test.js` — runs every (age × risk × history) cell in the
grid and asserts things that must never happen (e.g. a dose recommended below its
licensed floor, a series closed early, a negative age printed).
**Widen to every risk id singly AND paired** (MeningoVax C1, `8df3f27`): 20 risks = 20
singles + 190 pairs. Use a coarser age step for the pair sweep to keep runtime sane.

## P2-4. No two-run relational sweep
**Fix:** port `sweep-two-run-relations.test.js` — runs the engine twice with one thing
changed and asserts the relationship (e.g. adding a risk factor never reduces the doses
owed; one more valid dose never increases them).

## P2-5. No dose-counter sweep
**Fix:** port `sweep-dose-counter.test.js` — the guard that a chip never claims
"Dose N of M" with N > M.

## P2-6. No guard that the grid stays current
**Fix:** port `regression-*-the-grid-covers-the-app.test.js` (every risk id and product in
the data files appears in the grid) and `regression-*-no-vacuous-negative-assertions.test.js`
(a sweep that asserts "never X" fails if it never actually produced a case where X could
have happened — stops a sweep passing because it swept nothing).

## P2-7. No "docs match code" test
**Fix:** port `rule-docs-match-code.test.js`. Needs P7-1 (the plain-English rulebook) to
exist first, so order these together.

## P2-8. Citation tests are thinner — and the DATA they need does not exist yet
**Now:** `refs.test.js`, 2 tests, both one-off content checks (does this URL point at the
right PDF) — not drift tripwires.
**MeningoVax:** `citation-integrity.test.js` (6), `citation-freshness.test.js` (4),
`citation-highlight-url.test.js` (2).

**The blocker is data, not tests.** MeningoVax's freshness tripwire reads a `lastVerified`
date off every citation: **40 of 40 refs carry one, and 23 carry a verbatim `quote`.**
PneumoVax has **1 of 18** with `lastVerified` and **1 of 18** with a quote — the ASCO entry
(`refs.js:118-122`, dated 2026-09-14), added during the HCT parity work. So the pattern is
already known in this repo; it just never spread past the one ref that needed it that day.
**Fix order:** (1) re-read all 18 sources live and record `lastVerified` + the verbatim
`quote` for each — this is work the clinical audit is already doing, so take its output
rather than doing it twice; (2) then port the three tests.
**Port MeningoVax's guard-on-the-guard too:** its freshness test first asserts that the
pinned test clock has not frozen the staleness check (`citation-freshness.test.js:35`).
Without it the 12-month tripwire silently stops measuring the moment the clock is pinned in
P2-1 — and P2-1 lands before this.

## P2-13. The PneumoRecs comparison cases are manual-only — nothing runs them
`scripts/adultCases.mjs`, `pedsCases.mjs`, `hsctCases.mjs` are referenced by **no test, no
npm script and no CI job** (verified: grep over `src/`, `.github/`, `package.json` returns
nothing). So "PneumoVax was validated against CDC PneumoRecs" is a one-time historical
event, not a standing guard — the alignment can break and nothing will say so.
**Fix:** wire them into the suite as real tests, and make them the seed for the P2-2 grid.
This is the single highest-value anti-decay item PneumoVax can get, because the expected
answers were already derived from CDC's own tool.

## P2-9. No coverage tooling
**Now:** no `test:coverage` script, no `@vitest/coverage-v8` dependency.
**Fix:** add both, then do MeningoVax's plan-item-A exercise: report what `recommend.js`
and `validate.js` never execute, and write that list down as the input to Phase 3.

## P2-10. The "both layers" rule is not being met
**Project rule (CLAUDE.md):** logic test (node) + UI rendering test (happy-dom) for any
visible bug. **Now:** 4 UI test files out of 11; MeningoVax pairs `.test.js` with
`.test.jsx` throughout.
**Fix:** this is a standing rule for every item in this queue, not a separate task —
listed here so it is not forgotten.

## P2-12. Thresholds have no single home — the drift mechanism is already in place
**This is the structural half of the anti-decay answer. Without it, every rule fixed in
this queue can grow a second copy later.**

**Now:** the `M` age table (`recommend.js:37`) is a **local const, not exported**, so
`validate.js` cannot see it. Consequence, already present: `validate.js:130` hardcodes
`const minAgeM = 24; // >=2 years` — its own second copy of PPSV23's 2-year floor, which
`recommend.js` knows as `M.m24`/`M.y2`. The interval constants `WK8`/`WK4`/`Y1`/`Y5`
(`recommend.js:42-45`) are local too, which is part of why P1-0 exists: the validator had
no interval constant to reach for.
`scheduleConstants.js` is 29 lines and holds exactly two values — it was created for the
H1 boundary-drift bug and the pattern was never extended.

**MeningoVax, by contrast,** has ~1,000 lines whose only job is one-number-one-home:
`ages.js` (206), `intervals.js` (437), `seriesTotals.js` (391). Each file's header records
the specific bug that forced it — P0-1 was an infant interval hand-typed as 4 weeks in four
places when the rule says 8, AND written a fifth time as English prose inside the card
sentence.

**Fix:** extend `scheduleConstants.js` into the three-sibling pattern — every age threshold,
every interval, and every series total in exactly one place, imported by BOTH
`recommend.js` and `validate.js`. Then a rule cannot be fixed in one surface and left wrong
in the other, which is the failure mode in
[[feedback_parity_audits_cover_validators]].
**Ordering:** P1-0's interval check should read from the new home, so do the intervals half
of this BEFORE P1-0, or accept writing it twice and consolidating immediately after.

## P2-11. CI does not say lint is deliberately ungated
**File:** `.github/workflows/test.yml` (314B vs MeningoVax's 870B)
**Fix:** cosmetic — add the comment block so the next session does not "helpfully" add a
lint gate. CI itself works (lockfile present, `npm ci` fine).

---

# Phase 3 — Date and age foundation

These are coupled. Do them as one queue; piecemeal they fight each other.

## P3-1. The date of birth is thrown away
**Now:** `StepAge.jsx` converts DOB to a number of months and discards the date.
`App.jsx` has no `dob` in state.
**Problem (two):** (a) the 65th-birthday PPSV23 date and the 19th-birthday adult-schedule
date have to be reconstructed by multiplying months by 30.4375 — MeningoVax measured
that as exact only 37% of the time, 1 day out 51%, 2 days out 11%; (b) age is computed
once, at typing time, while dose validity and "due today" read the clock live — a tab left
open overnight holds a patient who does not age while the calendar does.
**Fix:** keep `dob` in state; port `logic/patientAge.js` (`patientAgeMonths`,
`ageAtDoseMonths`); derive age at render. A patient entered as years/months keeps the old
behaviour deliberately — the app does not know their birthday and must not print exact dates.
**MeningoVax:** calendar P1-3 (`ebf54de`), `regression-cal-p1-3-keep-the-date-of-birth.test.js`.

## P3-2. No calendar-exact month arithmetic
**Now:** `dateUtils.js` has no `calendarMonthsBetween`, `addCalendarMonths`,
`addCalendarYears`, `calendarIntervalElapsed`, `daysInMonthOf`.
**Problem:** a baby born 31 January reads as a NEGATIVE age on 1 February — StepAge drops
the negative and the app answers a correct date of birth with "Please enter a valid age
before continuing." Also: age is non-monotonic across month ends, and a dose given exactly
on its anniversary is voided as "too soon" because `DAYS.months(6)` is 183 while a real
six-month span is 181–184.
**Fix:** port all five helpers. Note the mirror comment already in PneumoVax's
`dateUtils.js` ("should stay in sync with MeningoVax") — honour it, and update it.
**MeningoVax:** calendar P1-1/P1-2 (`28ef2f3`), P0-4/P0-5, plus
`regression-cal-p1-1-month-end-ages.test.js`,
`regression-p0-4-calendar-month-intervals{,-ui}`,
`regression-p0-5-menacwy-booster-anniversary{,-ui}` (adapt the last to a PCV/PPSV interval).
**⚠ Clinical:** changes dose counts. Run `verify-clinical-source` and five-surface-style
verification. Do NOT port as a mechanical code move.

## P3-3. Age at a recorded dose is computed by subtraction
**File:** `validate.js:44` — `ageMonths - daysBetween(dose.date, today) / 30.4375`
**Problem:** mixes two different rulers. MeningoVax measured >1 day of error in 2.9% of
50,845 sampled combinations — enough to move a child between PCV dose-count bands in both
directions (asked for 4 doses instead of 2; closed a series a dose early).
**Fix:** replace with `ageAtDoseMonths()` from P3-1.
**MeningoVax:** calendar P2-2 (`9e11f11`), `regression-cal-p2-2-exact-age-at-dose{,-ui}`.
**⚠ Clinical:** same caveat as P3-2.

## P3-4. Ages round up instead of down
**File:** `format.js` — `fmtAgeMonths` uses `Math.round(am % 12)`.
**Problem:** a dose given two weeks before a birthday displays as if given ON it. Nobody
is 65 until their 65th birthday, and PneumoVax prints that age immediately before a
threshold claim about it.
**Fix:** port MeningoVax's floor-with-epsilon (`FLOOR_EPS = 1e-6`, `floorAge`) — the
epsilon matters: an age that IS exactly 5 years can arrive as 59.9999999.
**MeningoVax:** U4 (`eed35a6`), `regression-u4-age-never-rounds-up.test.js`,
`regression-fmtAgeMonths-carry.test.js`.

## P3-5. No exact weeks for young infants
**Now:** `fmtAgeMonths` converts months→weeks with a second averaged constant (`× 4.348`).
**Problem:** double-averaging. A dose at exactly 42 days (6.0 completed weeks) can print
"5 weeks" — and the 6-week PCV floor is stated in weeks.
**Fix:** port the `exactDays` parameter (`Math.floor(exactDays / 7)` when the caller has
both a DOB and a real date) and pass it from `StepAge`, `Results` and `RecCard`.
**MeningoVax:** `75ad6b0`, `regression-fmtAgeMonths-weeks-exact-days.test.js`.

## P3-6. A negative age prints as "Birth"
**Now:** `fmtAgeMonths` has no negative branch, so `-52` months and `0` months print the
same word; `validate.js:49` has the same hole (`if (m < 0.5) return 'birth'`).
**Problem:** a dose dated before the patient was born reads "Given at ~birth" — an
ordinary-looking newborn dose. This is also what kept P3-2's month-end negative age
invisible.
**Fix:** return `'Before birth'`. A value that cannot exist must not be mistakable for a
patient.
**MeningoVax:** imp P1-3 (`527dca6`), `regression-imp-p1-3-negative-age-visible.test.js`,
`regression-imp-p1-1-dose-before-birth.test.js`.

## P3-7. Three separate clock reads per render
**Files:** `RecCard.jsx:116` calls `todayISO()` inside render; `recommend()` reads it
again; the five pickers read it a third time.
**Problem:** they agree only because they run in the same millisecond, not because
anything makes them agree.
**Fix:** read the clock once in `App.jsx`, thread `today` down as a prop; have
`recommend()` be the one place that resolves "no today passed" and expose it as
`meta.today` for the view layer to read back.
**MeningoVax:** calendar P2-1 (`8aff5b4` + `ebf54de`), `regression-calp2-1-today-in-one-place-ui.test.jsx`.

## P3-8. No guard against an impossible age
**Now:** no equivalent of `logic/ageEntry.js`; `StepAge` has no `entryError` state.
**Problem:** typing `0026` instead of `2026` — one keystroke short in a four-digit year
box — is accepted silently and produces a complete, ordinary-looking ADULT pneumococcal
recommendation for the infant in the room. The Years box carries `max="120"` but the app
reads the typed value directly, so the attribute never bites and 999 years is accepted.
**Fix:** port `ageEntry.js` (`ageEntryProblem`, `MAX_PLAUSIBLE_AGE_YEARS = 120`), wire it
to BOTH entry modes so the two doors cannot drift, show the problem as it is typed, and
clear the age when there is one so Next stays shut. Keep MeningoVax's message style —
name the field and say what is probably wrong ("a two-digit year such as 26 is read as the
year 26, not 2026").
**MeningoVax:** imp P0-1 (`b8a9335`), `regression-imp-p0-1-impossible-age-refused{,-ui}`.

## P3-9. Show adult-only risks, with a doubt note (DECIDED)
**Now:** `StepRisks.jsx:35` HIDES adult-only risks (smoking, alcohol) below 19y.
**MeningoVax:** SHOWS everything and adds a quiet `RiskAgeNote` under the risk chips
asking whether an adult risk factor really belongs on a baby — no banner, nothing withheld.
## >>> WARNING: this item has a clinical trap. Read P3-9b BEFORE touching P3-9. <<<

**Owner decision 2026-10-10: mirror MeningoVax.** Stop hiding adult-only risks below 19y;
show every risk factor and add the quiet `RiskAgeNote` under the risk chips instead.
Nothing is withheld; the note raises the doubt and lets the clinician decide.
**Depends on P6-3** (the `[c]` citation machinery) — `RiskAgeNote` renders cited copy.
Remove the `adultOnly` age gate at `StepRisks.jsx:35` and the `ADULT_SCHED_MIN_M` import
it exists for, but keep `adultOnly` in `riskFactors.js` — the note needs to know which
risks are adult ones.
**MeningoVax:** imp P1-2 (`748458f`), `regression-imp-p1-2-implausible-risk-age{,-ui}`.

## P3-9b. An adultOnly risk must not change the PAEDIATRIC pathway (⚠ CLINICAL, blocks P3-9)

> **CORRECTED BY S1 (2026-10-10) — READ THIS FIRST.** The paragraph below says this defect
> is latent until P3-9 activates it. **That is wrong. It is live in today's build.** The
> `adultOnly` gate at `StepRisks.jsx:33` filters which checkboxes *render*; it never clears
> a risk id already in state, and `App.jsx:79-83` does not prune `riskIds` when the age
> changes. Proven by driving the real components: enter 25y, tick "Cigarette smoking", go
> Back, change the age to 15y — the checkbox disappears, the tick survives, and the
> 15-year-old is given a three-option at-risk catch-up regimen. Reclassified **P0-3** in
> `docs/archive/audit-2026-10-10-pneumovax-clinical-peds.md`, and **recommended for the
> first fix slot** rather than waiting for P3-9, because it is reachable today by
> mistyping an age and correcting it. The fix itself is unchanged and still correct: filter
> `adultOnly` inside `pedsRiskRowClass`. S1 also confirmed live, from CDC's child notes and
> p2016 Table 3, that smoking and alcohol use disorder are absent from the paediatric risk
> lists, so the `verify-clinical-source` step below is already satisfied (quotes Q6/Q7 in
> the audit).

**Found 2026-10-10 while tracing the rule order. ~~This is a latent defect that P3-9 would
ACTIVATE, not a pre-existing visible bug.~~ (Superseded — see the correction above.)**

`smoking` and `alcoholism` are both `class: 'nonIC'` in `riskFactors.js:139-154`, and both
cite the ADULT pages only (`cdcAdultPneumo`, `mmwr7203a1`). But `pedsRiskRowClass`
(`riskFactors.js:206`) returns `'nonIC'` for ANY `nonIC` tick, and `recommend.js:838`
routes a 2-18y patient to `pcvRiskChild` whenever that is non-null.

So the moment those two boxes become tickable on a child, a 15-year-old smoker is routed
to the at-risk paediatric path and told they need at-risk catch-up PCV doses at >=24 months
plus a PPSV23 follow-up. **CDC's paediatric risk table does not list smoking.** The
`adultOnly` age gate at `StepRisks.jsx:35` is currently the ONLY thing preventing this.

**Why MeningoVax's design does not transfer here.** None of MeningoVax's risk factors are
adult-only in this sense — asplenia, complement deficiency, travel, military, college dorm
all apply at any age — so "show everything, note the doubt" is safe there. PneumoVax has
two genuinely adult-only indications, so the UI change needs a logic guard that MeningoVax
has no counterpart for.

**Split P3-9 in two:**
 - **UI half (safe):** show the risks at every age, add `RiskAgeNote`. This is what the
   owner approved.
 - **Logic half (new, required, must land in the SAME PR):** an `adultOnly` risk must not
   contribute to `pedsRiskRowClass`. Decide where the guard lives — filtering inside
   `pedsRiskRowClass` is the single-source-of-truth option and is preferred over a check at
   the `recommend.js` call site. Check `hasAnyRisk`, `hasNonIC` and
   `adultPpsvIntervalClass` for the same hole while in there.

**Do NOT treat this as a mechanical port.** Run `verify-clinical-source`: fetch CDC's child
and adolescent pneumococcal notes live and confirm that smoking and alcohol use disorder
are absent from the paediatric risk table, and check AAP (which governs on disagreement).
Needs its own failing test first: a 15-year-old with `smoking` ticked must NOT receive an
at-risk catch-up recommendation.

**Owner decision 2026-10-10: option (b).** Show the adult-only risk at every age, and have
the doubt note say plainly that it does not change a child's schedule. The engine ignores
it for the paediatric pathway (the guard above), and the note is what tells the clinician
the tick was seen and why it did not act — rather than the app silently discarding it.
Exact wording still to be written; it must come from the cited source, not invented
(`feedback_no_guessing_cite_source`).

---

# Phase 4 — Dose entry

## P4-1. The two dose editors are separate copies, and have already drifted
**Files:** `StepHistory.jsx` (wizard) and `Results.jsx:200-270` (Results panel)
**Already different:** the wizard puts Date first, the Results panel puts Product first;
only the Results panel has an "empty" message.
**Problem:** MeningoVax extracted `DoseEditor.jsx` for exactly this reason — its two
copies had drifted so that only one showed the MenB family lock.
**Fix:** extract a shared `components/DoseEditor.jsx`. **Do this before P1-1, P1-3, P4-2
and P4-3** if the ordering allows — each of those then lands once instead of twice.
**MeningoVax:** Item 5 (2026-07-23).

## P4-2. No future-date warning where the date is typed
**Now:** `max` on the picker stops the PICKER offering a future day, but a typed or pasted
date walks straight past it. The warning (if any) appears only on the results card.
**Fix:** port the `dose-row-problem` row-level message: "This date is in the future, so
this dose is not counted. Check the date — if the patient has not had this dose yet, leave
it out." Say it where the date was entered.
**MeningoVax:** G3, `g3-future-dated-dose{,-ui}.test.{js,jsx}`.
**CSS owed:** `.dose-row-problem`.

## P4-3. No auto-focus on a new dose row, and Enter does not finish a row
**Fix:** port `DoseEditor`'s two behaviours — focus the new row's date box when a row was
just ADDED (not on mount, not on remove), and Enter on a date/brand field moves to the
next row or adds one. Deliberately excludes the remove "×" and the details-unknown tick.
**MeningoVax:** Item 1 + K6 (`d608c14`).

## P4-4. The history step never asks the yes/no question
**Now:** both lists shown empty; a "No previous doses (clear all)" link appears only AFTER
something has been entered.
**Problem:** an untouched PneumoVax history step is ambiguous — no doses, or not asked?
**MeningoVax:** explicit "No previous doses" / "Yes, record doses" buttons, and
"Select yes or no above" until one is picked.
**Owner decision 2026-10-10: Option B — ONE question covering both streams.**
Reviewed as a visual mockup against a per-stream variant. Wording: "Has the patient
received any pneumococcal vaccine?" with **No previous doses** / **Yes, record doses**.
 - "No" → both lists stay hidden and empty, and both dose arrays are cleared.
 - "Yes" → both lists appear (PCV first, then PPSV23), as they are laid out today.
 - Unanswered → "Select yes or no above", and Next is refused.
Rejected a question per stream: the common case is no pneumococcal vaccine at all (one
click vs two), it invites a half-answered state, and the two streams are not clinically
independent — PPSV23 only reads against the PCV history. "PCV yes, PPSV23 no" is still
recorded under Option B, because once Yes is picked the empty PPSV23 list is visible.
**Replaces** the current `.history-clear-link` ("No previous doses (clear all)"), which
only appears AFTER something has been entered.

---

# Phase 5 — Keyboard and focus (MeningoVax K1–K7)

Nothing from this queue has been ported. K1 is P1-3 above (it is a wrong-answer bug, so it
was promoted into Phase 1).

## P5-1. Enter does nothing
**File:** `App.jsx:111` — Next is a bare `onClick`; there is no `<form>`.
**Fix:** wrap the wizard in a real `<form>` whose `onSubmit` is the ONLY caller of
`goNext()`, with Next as the single `type="submit"` button. No key listeners — native
browser behaviour is the whole point. Add the "or press Enter" hint
(`.shortcut-hint`, `.app-nav-next`, `.app-form` CSS).
**MeningoVax:** K2 (`49d9753`).

## P5-2. Most buttons lack `type="button"` (5 of 19)
**Fix:** add it everywhere. **This must land with or before P5-1** — the moment a `<form>`
exists, every unmarked button becomes an Enter trap that skips the step. That was
MeningoVax's K2 bug: tab onto "No previous doses," press Enter, and the step was skipped
instead of answered.

## P5-3. The cursor never lands anywhere
**Fix:** port `App.jsx`'s focus effect — after Next/Back, focus the step's first real field
(`#dob-input` on Age, first checkbox on Risks, the history toggle on History). Skip the
Results step; it is read, not filled in.
**Owner decision already recorded in MeningoVax:** focus on phones too, even though it
opens the on-screen keyboard. Apply the same unless told otherwise.
**MeningoVax:** K4 (`d608c14`).

## P5-4. No visible focus ring
**Now:** `:focus-visible` appears 0× in PneumoVax's CSS, 3× in MeningoVax's.
**Problem:** tabbing falls back to whatever ring Chrome / Safari / Firefox each draw —
different per browser, easy to lose.
**Fix:** port the `:focus-visible { outline: 2px solid var(--c); outline-offset: 2px;
border-radius: var(--rads); }` rule. `:focus-visible`, not `:focus` — mouse clicks stay
exactly as they are.
**MeningoVax:** K5.

## P5-5. Escape does not close the Results panels
**Now:** no `Escape` handler anywhere in PneumoVax.
**Fix:** port K7 — Escape closes the dose panel first (more nested), otherwise the age
panel. Depend on the dose lists in the effect so the listener never closes over a stale list.
**MeningoVax:** K7 (`c8985cb`).

## P5-6. "No risk factors apply" is a fake button
**File:** `StepRisks.jsx:57` — a `<label role="button" tabIndex={0}>` with a hand-rolled
Enter handler (and no Space handler, which a real button gets free).
**Fix:** make it a real `<button type="button" aria-pressed={noneSelected}>` with a
`.risk-none-check` indicator span, as MeningoVax does.

---

# Phase 6 — Card copy and citations

Largest phase, lowest urgency. Needs engine changes, not just card changes.

## P6-1. Status words are terse and need a legend to decode
**File:** `RecCard.jsx:8` — `STATUS_LABELS` = "Due", "Catch-up", "Complete",
"Not indicated", "Deferred", plus a separate `due-pill` reading "Today"
(`RecCard.jsx:172`).
**MeningoVax:** replaced all of it with self-describing pills — "Dose due today, future
boosters needed" / "Dose due today" / "Catch-up dose due today" / "Booster due today" /
"Future booster needed" / "Optional today - shared decision" / "Up to date" / "Not needed"
/ "Deferred in pregnancy" — derived from fields already on the rec object, no new engine
field. Then DELETED the legend, because a label that explains itself does not need one.
**Fix:** port the vocabulary, adapted to pneumococcal wording. Then P6-2.
**MeningoVax:** C3/C1.

## P6-2. Delete the "Color key" panel (DECIDED)
**Files:** `Results.jsx:15`, `:183`, `:270` — a third toggle, two swatch blocks.
**This is the one item where matching MeningoVax means DELETING something you have.**
MeningoVax removed its legend once the labels explained themselves.
**Owner decision 2026-10-10: delete it.**
**Hard ordering constraint: P6-1 MUST land first.** Removing the key before the status
labels explain themselves makes the page worse, not better. If the queue is interrupted
between the two, leave the key in place.
Remove: `showLegend` state, the third `age-edit-btn`, the `legend-panel` block, and the
`.legend-swatch-*` CSS. Note that PneumoVax has a 4th dose status MeningoVax lacks
("Recorded — does not count", for PCV7) — make sure THAT chip reads self-evidently before
the key goes, not just the card-level ones.

## P6-3. No numbered inline citations
> **✅ DONE 2026-10-10 (S13, PR #21).**
**Now:** `note` renders as a plain string; citations appear only as chips at the card foot.
**MeningoVax:** `[c]` markers in note text become clickable NUMBERED superscripts that
deep-link to the exact MMWR sentence, with the quote on hover. Numbers are assigned by
order of first mention (not hardcoded), deduped by source PAGE so two sentences on one page
share a number while keeping their own href, and numbered once per CARD so the note and the
dose verdicts never both show a different `[1]`.
**Ranked highest in this phase** given the standing rule that every printed decision cites
its source (`feedback_no_guessing_cite_source`).
**Fix:** port `makeCiteNumberer`, `renderNoteWithCites`, `cardCiteNumberer`, and the
`reasonCites` plumbing in `validate.js`. Then wire the notes — that is the bulk of the work.
**MeningoVax:** C5/Change 4 + G4, `c5-note-citations.test.{js,jsx}`,
`g4-discounting-verdicts-cite-source.test.js`, `g4-record-panel-citation-ui.test.jsx`.
**CSS owed:** `.note-cite`.

## P6-4. No "Why this" disclosure — notes are one long paragraph
> **✅ DONE 2026-10-10 (S13, PR #21).**
**Now:** `{note && <div className="rec-note">{note}</div>}`
**MeningoVax:** split every note into a one-line `lead` (what to do for THIS patient) and a
`detail` behind a "Why this" toggle, after measuring notes at a median of 128 and a longest
of 530 characters — a whole ACIP schedule recited to a reader who needed one line.
**Largest single item in the queue.** Requires restructuring every note in
`recommend.js` into `{lead, detail}`, with ONE ordered `noteCites` list across both halves
(lead's `[c]` markers consume the first entries, detail takes the rest) so a source keeps
the same number whether the disclosure is open or shut.
**MeningoVax:** U1 (`91d7136`), `regression-u1-note-lead-and-detail.test.js`.
**CSS owed:** `.rec-note-toggle`, `.rec-note-detail`.

## P6-5. Results runs its own second walk of the dose history
> **✅ DONE 2026-10-10 (S13, PR #21).**
**File:** `Results.jsx:93-94` — calls `analyzeHistory()` for PCV and PPSV23, in addition
to the calls already inside `recommend()` (`recommend.js:824-825`). Neither Results call
passes `today`.
**Problem:** the panel and the recommendation above it each decide for themselves what the
record says. MeningoVax deliberately removed its second walk (G1) because the two had
started disagreeing outright.
**Fix:** have `recommend()` return its history analysis (as MeningoVax's `result.history`
does) and read it back in `Results` — one walk, read twice.
**Relevant to the standing parity-audit rule:** validators drift from their own engines
(`feedback_parity_audits_cover_validators`).

## P6-6. Toggle buttons label themselves differently
> **✅ DONE 2026-10-10 (S13, PR #21).**
**File:** `Results.jsx:180`, `:186` — PneumoVax swaps the label to "Done" when open;
MeningoVax keeps the label and rotates the chevron. Trivial, but visible either way. Pick one.

---

# Phase 7 — Documentation

## P7-1. No plain-English rulebook
**MeningoVax:** `docs/agent/meningococcal-rules-summary.md` + a published clinician
rulebook artifact (v7), with a `rule-docs-match-code.test.js` tripwire.
**PneumoVax:** `CLINICAL_SPEC.md` (13.4K, at root, deliberately allowlisted) and
`docs/agent/clinical-rules.md`.
**Fix:** decide whether `CLINICAL_SPEC.md` IS the rulebook (and should move to
`docs/agent/`), or whether a separate plain-English clinician-facing version is wanted.
Pairs with P2-7.

## P7-2. Inline styles — PneumoVax is AHEAD, do not port backwards
> **✅ DONE 2026-10-10 (S13, PR #21).**
**PneumoVax** uses real classes (`step-toggle-row`, `age-badge-row`).
**MeningoVax REGRESSED** to inline `style={{ display: 'flex', gap: 8, ... }}` in
`StepAge.jsx` and `StepHistory.jsx`, which breaks the project's CSS-custom-properties-only
rule. **Port the direction of travel, not the inline styles.** Consider fixing MeningoVax
instead — that is a separate, small PR against the other repo.

---

# Where PneumoVax is ahead — do NOT "fix" these

1. **`noncounting` dose status** — "Recorded (does not count)" for PCV7: validly given,
   never counts, must not read as "Invalid." No MeningoVax equivalent. Keep.
2. **`otherHistory` orphan attachment** (`Results.jsx:97-112`) — keeps a vaccine's record
   visible when the engine emits no card for it. Genuinely good, no counterpart. Keep.
3. **`scripts/*.mjs` comparison harness** (adult/peds/HSCT cases vs CDC PneumoRecs) — no
   MeningoVax counterpart. Feed P2-2 from these rather than duplicating them.
4. **Class-based CSS in the step components** — see P7-2.

---

# Risk-at-dose prompt — investigated, NOT owed (2026-10-10)

Asked whether PneumoVax should port MeningoVax's per-dose "was this patient at risk when
this dose was given?" prompt. **It should not.** Recorded here so it is not re-raised.

**What PneumoVax does today:** `analyzeHistory` never receives `riskIds` at all (zero
references in `validate.js`). A dose is judged on age at the dose, product, and spacing
only. Risk ticks enter one level up, in `recommend.js`, to select the pathway
(`pcvRiskChild` / `pcvAdult` / routine) and the PPSV23 interval class. So current risk
decides what is still owed, and all past doses count toward it on age alone.

**Why MeningoVax needs the prompt and PneumoVax does not.** MeningoVax's prompt fires on
one condition (`validate.js:558`, `:861`): high-risk NOW, and a dated dose given below the
minimum age that applies to HEALTHY patients. That condition exists only because
meningococcal minimum ages FORK on risk — MenACWY 10y healthy vs 2 months high-risk; MenB
16y healthy vs 10y high-risk. A MenACWY dose at age 8 therefore counts only if the patient
was already high-risk then, which the data model cannot know (permanence is not
always-been-present: asplenia acquired at 13 does not cover an age-8 dose).

Pneumococcal has no such fork. Verified in `brands.js`: every PCV product is 6 weeks for
everyone; PPSV23 is 24 months for everyone; PCV21's 18y is an FDA product age, not a risk
rule. No risk-dependent floor → the trigger condition cannot arise → nothing to ask.

## P6-7. Say that the app only knows TODAY's risk status (the real gap here)
> **✅ DONE 2026-10-10 (S13, PR #21).**
**This IS owed** — it is the copy half of the finding above.
**Now:** PneumoVax's `Disclaimer.jsx` is silent on it while making the assumption.
**MeningoVax:** its disclaimer states outright that the app tracks the patient's CURRENT
risk status only and does not record when a risk factor started or ended.
**Fix:** add the equivalent sentence to PneumoVax's disclaimer. Also name the one case
where a clinician might expect to be asked: PPSV23 at ages 2-5 is only INDICATED for
at-risk children, so a dose given to a then-healthy 3-year-old is still counted as a valid
PPSV23 if that child later becomes at-risk. That is correct (real vaccine, valid age, and
MeningoVax would count it too since the 24-month floor does not vary) — but it should be
stated rather than assumed.
**Do NOT** turn this into a per-dose prompt.

# Open questions for the owner
All five original questions are now answered — see P1-3, P3-9, P4-4, P6-2 above, and the
risk-at-dose finding below. Nothing in this queue is blocked on the owner.

# Suggested order (REVISED 2026-10-10)

**0. Clinical audit — commissioned by the owner 2026-10-10, not yet run.** Read-only,
per app. Must cover: every branch's cited source fetched live and quoted; the precedence
choices (IC over non-IC, hard stop over HSCT, age-over-risk under 2 in PneumoVax,
risk-over-age above 2 in MeningoVax); the pathway gates, `pedsRiskRowClass` hardest; and
**for each rule, where its number currently lives and how many copies exist** — that last
output is the input to P2-12.

Then: P1-0 → rest of Phase 1 → Phase 2 (P2-12 and P2-1 first) → P4-1 → Phase 3 →
Phase 5 → Phase 6 → Phase 7.

Phase 4's P4-1 jumps the queue because extracting the shared editor makes P1-1, P1-3,
P4-2 and P4-3 one change each instead of two. Phase 3 needs Phase 2's net under it.
Phase 6 last: largest, least urgent, and P6-2 is blocked on an owner decision.
