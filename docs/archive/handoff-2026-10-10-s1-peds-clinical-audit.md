# PneumoVax — Handoff after S1, the paediatric clinical audit (2026-10-10)

> **🛑 SUPERSEDED 2026-10-10 — do not resume from this file.**
> **S2 is now DONE too.** The current handoff is
> **`docs/archive/handoff-2026-10-10-s2-adult-clinical-audit.md`** — go there.
> This file's "Resuming" section says the next session is S2; that is no longer true (next is
> **S3**). Its findings (the peds audit's three P0s and the rest of its queue) are all still
> **open and still valid** — read them in
> `docs/archive/audit-2026-10-10-pneumovax-clinical-peds.md`, not here. Note that S2's audit
> **independently corroborated peds `P0-1`** from a second source (immunize.org p3086 Table 4)
> and confirmed the adult side correctly needs no second PPSV23.

> **STATUS: CONSUMED 2026-10-10 — and its two "owner decisions" are WITHDRAWN.**
> A later same-day session re-fetched the sources live and found that **neither open
> decision was a real decision**: p2016 Table 1's grid keys on age-at-previous-dose, so it
> **agrees** with CDC Table 2, and the app matches neither. Both items fold into P0-2.
> See the correction banner at the top of
> `docs/archive/audit-2026-10-10-pneumovax-clinical-peds.md`.
> **Do not ask the owner the questions in "Two owner decisions needed" below — they are
> answered.**
> **Also note:** the IDs `P1-3` and `P2-1` mean **different findings** in the audit and in
> the interface-parity queue file. Every ID in this handoff is an **audit** ID. The rest of this handoff (baseline, the three P0s, the remaining queue,
> sequencing advice) still stands.

Repo: `~/Downloads/PneumoVax`. Branch: **`main`**, at `821ab9c`, **in sync with origin**.
**No commits were made** — S1 is a read-only audit session; its deliverable is a document.
Baseline was 156 passing tests; still **156 passing (11 files), all green** (`npm test`
run twice, 12:27 and 12:46 PDT — engine code was never touched).

Working tree: **one untracked file** — the audit itself,
`docs/archive/audit-2026-10-10-pneumovax-clinical-peds.md`. **Nothing is committed yet; see
"Open decision" below.** All nine scratch probe scripts and the scratch UI test were deleted.

The app's core promise is honesty: a silent wrong answer is worse than a crash. Three of
this audit's findings are silent wrong answers.

## What's done

1. **S1 — clinical audit of the paediatric PCV pathways.** Scope was `pcvInfant`,
   `pcvRiskChild`, `pcvHealthyChild`, `pedsRiskRowClass`. Every branch was checked against
   its cited page **fetched live today**, then exercised by running the real engine on
   patients built to land on each rule.
   → **`docs/archive/audit-2026-10-10-pneumovax-clinical-peds.md`**
   **3 P0, 5 P1, 5 P2, 10 rules verified correct, 2 owner decisions needed.**
2. **Progress ledger updated** — S1 marked DONE in
   `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`. (That folder is
   git-ignored, so the edit is local-only by design.)
3. **The queue file's P3-9b entry was corrected in place** with a banner, because the queue
   asserted the defect was latent and it is not. A fresh session reading the queue cannot
   now build on the wrong premise.

## The three P0s, in one line each

- **P0-1 — an immunocompromised child 6–18y is told "complete" when a dose is still owed.**
  All PCV before 72 months + any PPSV23 → "No further PCV or PPSV23 is needed". CDC's child
  notes *and* immunize.org p2016 Table 4 both say an **IC** child still needs PCV20 or a 2nd
  PPSV23 ≥5 years after the first PPSV23. `recommend.js:413` never checks `isIC`. **The
  correct rule already exists at `recommend.js:424-446` and is shadowed by that early
  return.** Non-IC correctly returns complete, so the fix must branch, not delete.
- **P0-2 — `pcvInfant` over-states the series total in 5 of 14 p2016 Table 1 cells.**
  Always too high ("dose 2 of 4" where the table says 3). Three distinct causes, including
  a dead, arithmetically meaningless line (`recommend.js:215`) showing the band logic was
  left unfinished.
- **P0-3 — the adult-only risk trap is LIVE, not latent** (corrects the queue). Enter 25y,
  tick "Cigarette smoking", go Back, set 15y: the checkbox hides, the tick survives, and the
  15-year-old gets a three-option at-risk catch-up regimen. **Proven by driving the real
  components.** Reachable by mistyping an age and correcting it.

## What's NOT done — the remaining queue

**S2–S13 are all NOT STARTED.** The ledger in the queue file is the source of truth.
Next up: **S2 — clinical audit of adult + HSCT + precedence + the number census.**
S2's own scope note is in the queue file; it also owes the `lastVerified`/quote sweep for
the remaining refs and the census that P2-12/S6 depends on.

**The 13 findings above are findings only — nothing was fixed.** S1's stopping point is
explicitly "STOP after writing the file. Do not fix anything."

## ~~Two owner decisions needed~~ — WITHDRAWN 2026-10-10, both resolved

> **Do not act on this section.** Kept only so the reasoning trail is visible.
> **1. P1-3** — the claimed conflict does not exist. p2016 Table 1's grid has the sub-rows
> `1 at age 7 months or older` / `2 at age 7 months or older`; for the 10-month-old below
> it prescribes "1 additional dose at least 8 weeks later, at age 12–15 months" — the same
> answer CDC Table 2 gives. The app implements p2016's *footnote*, not its *table*, which
> is why it says `dose 3 of 4 / 28 days / due today`. **Part of P0-2.**
> **2. P2-1** — also not a source choice. 2 doses before 12 months plus a third at 18
> months **completes** p2016 Table 1's series, so Table 4's catch-up rows should never be
> reached. **Part of P0-2**; the `>= 4` "complete" test must become path-dependent.
> Vintage, verified live: p2016 is dated 2/16/2024 and CDC serves the **July 2, 2025**
> schedule (post-mid-2025 ACIP votes and the 5 Jan 2026 memo are judicially stayed), so the
> owner's "nothing from 2026" pin is satisfied. **No tripwire exists if that stay lifts.**


1. **P1-3 — CDC Table 2 vs immunize.org p2016's footnote on minimum intervals.** Both are
   tier-1 sources and they genuinely disagree. The app follows p2016 (interval keyed on the
   patient's *current* age); CDC Table 2 keys it on the age at which the *previous* dose was
   given, and is stricter. Observed consequence: a 10-month-old whose 2nd dose was at 9
   months is told "due today, 4 weeks" where CDC requires 8 weeks *and* waiting until 12
   months. **My recommendation: follow CDC Table 2** (more specific, more conservative, and
   it is not the "fewer doses" option the authority rule forbids). Yours to overrule.
2. **P2-1 — `before24 >= 3` vs p2016's "3 doses, all before 12 months".** The three pages
   word this differently and none cleanly covers a child with 2 doses before 12 months and a
   third at 18 months. Not asserted as a bug; needs a source decision, probably with P1-3.

**Do not let a later session quietly pick one of these.** If P1-3 is still unanswered when
S3 starts, S3 should do the minimum-age/grace work and leave the interval-keying alone.

## Why this is a good stopping point

S1 was scoped as a self-contained read-only unit and is complete: every branch in scope was
checked against a live quote, and no finding rests on reading code alone. Nothing is
half-changed — the engine is byte-identical to `821ab9c` and the suite is green. S2 is an
independent audit of a different half of the engine and needs nothing from S1 except the
shared sourcing discipline. The findings file is written as an executable queue, so the
fix sessions can start from it cold.

## One flagged sequencing change

The queue has S3 (the dose-spacing check) next after S2. **I recommend pulling P0-1, P0-2
and P0-3 ahead of S3.** They are wrong answers on screen today, two of the three are small,
and P0-3's fix also unblocks owner decision 2 / P3-9. Separately, **P1-1 (CDC's 4-day grace
and calendar-exact age-at-dose) sits underneath the same minimum-age check S3 will extend** —
fixing intervals on top of an age floor that is a day out bakes the error in. Either S3
takes P1-1 first, or S10 moves before S3. The audit's "Recommended fix order" section spells
this out. **This is a suggestion about the plan, not a change to it.**

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main` (already there, in sync at `821ab9c`).
2. `npm test` — confirm **156 passing / 11 files** before any new work.
3. **Say the session number and its recommended model + effort, in one line, and WAIT.**
   Next is **S2 — Opus 5 at max effort.** Nothing else first; the owner changes the setting
   herself and it cannot be changed mid-session.
4. Then read the SESSION PLAN at the top of
   `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` and confirm S1 shows DONE
   in the ledger.
5. Per-item workflow for the **code** sessions (S3 onward), not for S2: reproduce → failing
   test first → fix → full suite green → live-verify in the running app → one commit per
   finding ID → PR per the `ship` skill.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge.** Never push to
   `main` directly.

## Note on the dev server

`preview_start` was **refused** — all five dev-server slots are held by other chats. Per the
queue's rule 6 I did **not** fall back to running the server through Bash. P0-3 was instead
driven through the real React components under happy-dom (real clicks, real state
transitions), which is stronger evidence for a state-persistence claim than a screenshot.
Everything else is engine-level and was probed directly. **What remains visually unverified
is only how these cards look on screen** — close a slot and the "5 of 4" label and the
hidden-smoking case take two minutes to confirm.
