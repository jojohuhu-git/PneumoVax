# PneumoVax — Handoff after S3 + S3-N1, recorded-dose intervals (2026-10-11)

> ## ⚠️ SUPERSEDED 2026-10-11 — do not resume from this file
>
> Replaced by **`handoff-2026-10-11-s14-interval-enforcement-root-cause.md`**. A later
> review the same day found the **root cause** behind S3-N1 and the owner **reversed two
> decisions this file records as settled**:
>
> 1. §Resuming item 4 below says the **adult interval-check exclusion** is settled and must
>    not be re-litigated. **It was reopened and reversed.** An adult PCV20/PCV21 given under
>    a year after PCV13 is now to be treated as **invalid and repeated** (owner clinical
>    determination — *not* ACIP; the published sources say otherwise and the new handoff
>    quotes them).
> 2. §What's done item 3 describes S3-N1's advisory as load-bearing ("a FLAG, not a status").
>    **Its chip words, the `offWindow` flag name, and its "no repeat is needed" copy are all
>    being removed.** `vaxapp` is **retired**; MeningoVax is now the sole vocabulary
>    authority, so the "mirrors vaxapp's settled pair" rationale no longer applies.
>
> The root cause: `validate.js` decides whether a timing rule may invalidate a dose from the
> patient's **age** rather than from what the rule says — five gates on one axis, with two
> further symptoms beyond the PCV20 case, one of them silent. Everything else in this file
> (the P1-0 work, the four findings, the pre-existing queue) is still accurate.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s3-recorded-dose-intervals`**, off `main` @ `9a27e5a`. **Pushed → PR #22,
CI green (`test: SUCCESS`), `OPEN / MERGEABLE` — awaiting the owner's merge decision.**

Working tree **clean** at `244e2d3`. Baseline was 353 passing (35 files); now **393 passing
(38 files), all green.** Production build clean. All three PneumoRecs comparison harnesses
(`adult`, `peds`, `hsct`) are **byte-identical before and after**, checked twice — after S3
and again after S3-N1. No clinical verdict moved on a correctly spaced record.

This app's core promise is honesty: a silent wrong answer is worse than a crash.

## 🟢 PR #21 is MERGED (`9a27e5a`); Phases 3 and 6 are closed

S13's work is on `main` and the Pages deploy succeeded. Do not re-litigate it.

## What's done this session

1. **queue `P1-0` + peds audit `P1-4`/`P1-5`** `0ae88c6` — the validator now checks the gap
   between two recorded doses, in both streams. It never did before: a PCV series recorded
   at 2, 2.5, 3 and 3.5 months was graded "On time" four times and counted as a complete
   4-dose series. Three minimums now live in `logic/intervals.js` and are read by **both**
   the validator and the scheduler (they were only ever inside `recommend.js`, which is half
   of why the validator had no rule to apply): PCV→PCV 4 weeks / 8 weeks keyed on the
   **earlier** dose; PCV→PPSV23 ≥8 weeks and never the same visit; PPSV23 dose 2 ≥5 calendar
   years. Sub-minimum → `invalid`. `analyzeHistory` gained an options argument so the PPSV23
   walk can see the PCV doses that counted (the cross-stream design P1-4 asked for).
2. **Docs** `8ca1295` — `CLINICAL_SPEC.md` §K, `docs/agent/clinical-rules.md`,
   `docs/agent/testing.md` (new invariant 10), and closure notes on the two peds-audit items.
3. **`S3-N1`** `244e2d3` — the owner approved building it, so adults are no longer told
   "On time" for a gap shorter than CDC advises. Such a dose reads **"Valid"** and carries
   a note saying it still counts and needs no repeat. Two gaps are flagged: ≥1 year between
   two adult PCV doses, and ≥1 year PCV15→PPSV23 — except where the 8-week minimum may be
   *considered* (IC / cochlear implant / CSF leak), where only a gap under 8 weeks is
   flagged. Copy mirrors vaxapp's settled "on time" / "valid" pair. **The advisory is a
   FLAG (`offWindow`) on a `status: 'valid'` result, never a status of its own** — the dose
   still gets its `effectiveDoseNum`, so nothing that counts doses can drop it.

## Three things the owner should know

1. **This item's own spec was wrong, and a test caught it.** P1-0 said to anchor each gap
   on the previous **kept** dose. CDC says otherwise — *"The repeat dose should be spaced
   after the invalid dose by the recommended minimum interval"* — so an **invalid** dose
   anchors the dose replacing it. The first draft kept two doses out of the 2/2.5/3/3.5-month
   series instead of one. PCV7 anchors nothing (a properly given dose of a superseded
   product, not a mistimed one).
2. **Adults are deliberately not interval-checked, and this created a new owner decision
   (`S3-N1`).** CDC's adult notes state gaps as recommendations for the *next* dose ("at
   least 1 year after the last PCV13 dose"), never as minimums, and never say a short adult
   gap stops a dose counting. Read live 2026-10-11 with "pneumococcal" (13 hits) as a
   positive control that the collapsed sections had loaded: the adult page has **no**
   same-visit sentence and **no** 8-week floor. Invalidating an adult dose would substitute
   a minimum for a recommendation — the mistake A-P1-1 was raised to correct. The cost: a
   70-year-old given PCV13 then PCV20 five weeks later still reads "On time".
3. **The stale pre-A-P1-1 adult rule had FOUR copies, not one.** `testing.md` (fixed by
   S13), `docs/agent/clinical-rules.md` — both its prose section *and* its summary table —
   and `docs/agent/architecture.md`, twice (the interval table and the risk-class list).
   All named `adultPpsvIntervalClass()`, deleted weeks ago. All corrected 2026-10-11; a
   grep for it now returns only correctly-framed history notes. **This is the sweep the
   owner folded into S8 — it is DONE for today's copies, but the durable fix is not.**
   `P7-1`'s `rule-docs-match-code` tripwire is what stops a fifth appearing, and that is
   still S8's to build.
4. **A unit test can pass while the wiring is missing.** The S3-N1 unit tests passed
   `riskIds` straight into `analyzeHistory` and were green while `recommend.js` never
   forwarded it — so in the real app every adult was judged against the flat 1-year advice
   and an immunocompromised patient who had legitimately used the 8-week option was told
   their dose was early. **Driving the running app is the only thing that caught it.**
   There is now a test block that goes through `recommend()`, and I removed the forwarding
   line again to watch those assertions fail before trusting them.

## What's NOT done — the remaining queue

**New, from this session (written up in the ledger):**
- ~~**`S3-N1`**~~ — **DONE 2026-10-11** (`244e2d3`), see above.
- **`S3-N2` (P2)** — CDC Table 2's stricter dose-2→3 cell (previous dose at 7–11 months
  needs 8 weeks **and** age ≥12 months) is not enforced; the validator uses p2016's gentler
  footnote, so it can never demand a repeat CDC would have accepted. It is a **keying**
  question, which peds audit `P0-2` owns — do both halves together or the app will advise a
  date it then rejects.
- **The stale-clinical-rule sweep → folded into S8, Sonnet 5 at medium effort** (owner
  direction, 2026-10-11). **Today's four copies are already fixed** (see finding 3 above),
  so what remains for S8 is the DURABLE half: `P7-1` (the plain-English rulebook) + `P2-7`
  (`rule-docs-match-code.test.js`), whose stopping point is "the 12-month staleness
  tripwire is live". S8 has to read every current rule statement anyway to build the
  rulebook. A sweep finds today's copies; only the tripwire stops the next one.

**Pre-existing:**
- **`S10-N1` (P2)** — PCV21's 18-year gate is checked against CURRENT age, not age at the
  dose (`validate.js`). A 20-year-old with PCV21 recorded at 17 has that dose counted.
- **`S10-N2` (P3)** — the generic "repeat this dose only" line is appended to every invalid
  dose, including one dated before birth.
- **peds audit `P1-2`** — "PCV dose 5 of 4". **Reproduced again this session** with four
  *legitimately* spaced doses all before 12 months (2/4/6/8 months). Still open; it is a
  label bug, not a counting one.
- **peds audit `P0-2`** — `pcvInfant` over-states the series total in 5 of 14 p2016 Table 1
  cells. Owns the interval **keying** question, so it now also owns `S3-N2`.
- **`P7-1`** — the plain-English rulebook + `rule-docs-match-code` tripwire (S8's item).
- **S4–S9, S11, S12** unchanged. Ledger:
  `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored, updated).
  **S4 is P1-2, P1-3, P1-4 only.**
- **MeningoVax's own inline styles (9 of them) are untouched** — different repo, **owner
  decision** whether to open a small PR there.

**Did NOT reproduce — do not "fix" it blind:** peds audit P1-5's side-note that the engine
offers a "2nd PPSV23 (≥5y after first)" to a patient who already has two. An IC 13-year-old
with two PPSV23 doses 5 years apart returns `PCV series complete` and offers no further
PPSV23. Re-reproduce before writing anything.

## Why this is a good stopping point

P1-0 was the most serious finding in either audit and it is closed, with the paediatric
audit's P1-4 closed alongside it because they are the same code path, and S3-N1 — the one
owner decision the work spawned — decided and built. Recorded-dose timing is now coherent
end to end: children get a real minimum and an `invalid` verdict, adults get the advice
CDC actually writes and keep their dose. The suite is green, the tree is clean, the build
is clean, and the comparison harnesses prove no verdict moved on a well-spaced record.

## Resuming

1. `cd ~/Downloads/PneumoVax`. **PR #22 is open and green — merge it first** unless the
   owner wants changes, then `git checkout main && git pull`.
2. Confirm the suite: **393 passing / 38 files** (or whatever `main` reports after the
   squash merge). Stop and diagnose any mismatch before new work.
3. **Say the session number and its recommended model + effort in one line, and WAIT**
   (queue rule 1). **Next, by the owner's direction of 2026-10-11: S8 — Sonnet 5 at medium
   effort** (Phase 2d: citation data, citation tests, coverage, plus `P7-1` + `P2-7`, the
   rulebook and its match-code tripwire). After that, likely **S4 — Sonnet 5 / medium**.
   **Owner picks the order — ask, don't default.**
4. **Open owner decisions:** (a) merge PR #22; (b) whether to open a small PR against
   MeningoVax for its inline styles. **No clinical decisions are outstanding** — do not
   re-litigate the adult PPSV23 interval (`CLAUDE.md` + `CLINICAL_SPEC.md` §K), the
   paediatric risk lists (§C), the adult interval-check exclusion (§K), or S3-N1's
   advisory design (§K — it is a flag, not a status, and that is load-bearing).
5. Per-item workflow: reproduce → failing test first (confirm it fails) → fix → full suite
   green → live-verify in the running app → one commit per finding ID. **For any guard whose
   assertion is "nothing is wrong", introduce the fault on purpose and watch it go red.**
   S3 is a live example of why: the test that caught the anchoring error was a behavioural
   one, and eight of its 18 tests exist only to prove the check does not over-reach.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.**
7. **Dev-server note:** `preview_start` reported port **5173** this session and that was
   correct, but it has been wrong before — read the real port from `preview_logs` if the
   page will not load. A `git stash`/`stash pop` churns every tracked file and floods the
   HMR log; that is not a component edit.
8. **CDC pages:** always read them with a known-present word as a positive control. The
   collapsed sections are hidden, not absent, so "the page doesn't mention X" proves nothing
   without one. This session used "pneumococcal" (13 hits on the adult page).
