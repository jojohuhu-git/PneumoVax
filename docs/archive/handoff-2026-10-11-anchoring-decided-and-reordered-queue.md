# PneumoVax — Handoff after the anchoring decision (2026-10-11)

> ⛔ **SUPERSEDED 2026-10-11 by `handoff-2026-10-11-w1-done-next-is-s3-n2.md`.** This
> file's item 1 (`W1`) is **DONE and MERGED** (PR #24). Resume from that file's item 2
> (`S3-N2`), not from this file's queue.

> **Supersedes `handoff-2026-10-12-s14-merged-remaining-queue.md`.** That file's open
> clinical question (row 1, "does a dose that doesn't count still start the clock?") is
> **ANSWERED by the owner — see §Owner decisions below.** Its recommended ORDER is also
> superseded: the owner asked for the big engine rework **last**, not first. Do not resume
> its queue order.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, synced with origin at **`03dfada`**.
Suite: **465 passing (41 files), all green** — re-run and confirmed this session.

**No code changed this session.** It was a decision session: the owner was shown live engine
runs, chose the anchoring rule, and reordered the queue. Nothing is half-built.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner is
a clinician, not a coder — explain every what and why in plain English, in chat and in UI copy.

## Owner decisions made this session — apply, do not re-litigate

**(1) ANCHORING — decided.** *A dose that was rejected does not become a new starting point.
Every gap is measured from the dose that **counted**.*

The owner's reasoning, in her words, is sharper than the "consistency" framing the old
handoff used: the rejected dose in the adult case *"is rejected not because it is too soon
but because it was unnecessary"*, and an unnecessary dose cannot reset a clock. Likewise the
child's second PCV13 *"is a duplicate so should count PPSV23 8 weeks from Jan 1."*

She also confirmed the date reading that was ambiguous: for the 70-year-old with PPSV23 in
Jan 2015, the clock runs **1 year from Jan 2015 → earliest PCV20 Jan 2016**, so the Jun 2018
PCV20 **counts**. (Not the 5-year/2020 reading.)

**(2) KEEP the adult floors.** She was shown, on real engine runs, that downgrading the two
adult conjugate-after-PPSV23 rules from `floor` to `recommendation` would fix the same two
cases far more cheaply — but would *also* let through a genuine 2-month PPSV23→PCV20 gap with
no error in it (case **H** below). She chose the narrow fix instead: rescue only doses caught
behind someone else's mistake; keep rejecting doses that were simply given too early.
**Do not downgrade `ADULT-PCV20-21-5Y-AFTER-PPSV23` or `ADULT-PCV-AFTER-PPSV23`.**

**(3) ORDER — the big rework goes last.** Small, independently verifiable fixes first, so a
wrong step is visible on its own and nothing is built on top of it.

## Verified engine evidence behind decision (1) — reproduce before changing anything

Run against `03dfada`, `today = 2026-10-11`. Keep these as the acceptance cases.

| Case | History | Today | Must become |
|---|---|---|---|
| **A** | adult 70 — PPSV23 2015-01-01 ✓, PPSV23 2018-01-01 ✗(5-yr), PCV20 2018-06-01 | PCV20 **rejected**; rec flips from "Complete" to "PCV due ≥1 yr after PPSV23" | PCV20 **counts**, rec **"Complete"** |
| **D** | adult 70 — PCV13 2010 ✓, PPSV23 2012 ✓, PPSV23 2014 ✗(5-yr), PCV20 2018 | PCV20 **rejected**; rec "PCV20/21 ≥5 yrs" | PCV20 **counts**, rec **"Complete"** |
| **H** | adult 70 — PPSV23 2018-01-01 ✓, PCV20 2018-03-01 (**no error, real 2-month gap**) | PCV20 rejected | **unchanged — still rejected** |
| **B** | child asplenia — PCV13 Jan 1 ✓, PCV13 Feb 20 ✗(50 d), PPSV23 Mar 5 | PPSV23 **counts** (63 d from Jan 1) | **unchanged — counts** |
| **G** | adult 70 HIV — PCV13 Jan 2024 ✓, PCV20 Jun 2024 ✗(1-yr), PPSV23 2024-06-15 | PPSV23 **counts** | **unchanged — counts** |

**Scope is smaller than the old handoff claimed.** Three of five cases already behave the way
the owner decided. The entire job is: **two adult rules must stop anchoring on a PPSV23 dose
that did not count** — `ADULT-PCV20-21-5Y-AFTER-PPSV23` and `ADULT-PCV-AFTER-PPSV23`, both
`from: 'lastPpsv23'`, both `authority: 'OWNER'`. No CDC-stated interval is loosened.

Mechanism, verified in code: `recommend.js:1005` hands the PCV walk `ppsv23Doses: rawPpsv`
(**raw**, includes rejected doses), while the PPSV23 walk gets `pcvDoses: pcvAnalysis.effective`
(**counting only**). Fixing it is circular — PCV validity would depend on PPSV23 validity and
vice versa — so it needs a two-pass design, not a one-line change. Verified: **no paediatric
rule measures a gap from a PPSV23 dose at all** (the three child rows use `prevSameStream`
or `lastPcv`), so no child verdict can move.

**Out of scope, deliberately:** same-stream gaps (`prevSameStream`) anchor on a rejected dose
in both streams, and CDC's own repeat-dose sentence supports that. Do not change it.

## What's NOT done — the queue, in the owner's chosen order

### 1. `W1` — the "unnecessary dose" wording. **Sonnet 5, Medium effort.**
`validate.js:367` appends **one blanket sentence to every rejected dose**:
*"This dose does not count toward the series — repeat this dose only (do not restart the
series)."* For the 70-year-old's early second PPSV23 that is **actively wrong advice** — you
do not repeat it, you give it when it comes due. The owner raised this; it is a real finding,
not polish.

Precedent already exists in both apps, so nothing needs inventing:
* MeningoVax `validate.js:760` / `notAdolescentCount`: *"Safe, but does not count toward the
  routine series — the routine booster is still due at 16."* No repeat advice. Its code
  comment: *"it is NOT invalid and does NOT need to be repeated."*
* PneumoVax's own `extraDose` branch (`validate.js:419`): *"Given after the series was
  already complete …: this dose does not extend the series."* No repeat advice.

**Recommended design, needs owner sign-off before coding:** rather than a second hard-coded
category, replace the blanket sentence with **the earliest date the dose could validly be
given** — the rule table already holds the anchor, the interval and the grace, so it can
compute it. One honest sentence that is right for every row and never says "repeat" wrongly.
Ask the owner to approve the exact wording before writing it.

### 2. `S3-N2` / peds audit `P0-2` — two sources for one number. **Opus 5, High effort.**
`recommend.js:37` still imports `pcvSeriesMinIntervalDays` from `intervals.js` while
`validate.js` uses the rule table — and they key the interval off **different ages** (the
patient's age now vs. the age at the earlier dose). Same class of silent bug as S14-RC.
Needs `verify-clinical-source` on CDC child schedule Table 2. Doing this **before** item 3
means the anchoring rework lands on one source of truth instead of two.

### 3. `ANCHOR-1` — implement decision (1). **Opus 5, High effort.**
The two-pass rework described above. Largest change in the engine; hardest to verify. Must
reproduce cases A/D/H/B/G first, write the failing tests, then build. Confirm the three
comparison harnesses (`scripts/{adult,peds,hsct}Cases.mjs`) for unintended movement.

### 4. Peds audit `P1-2` — "PCV dose 5 of 4". **Sonnet 5, Medium effort.**
A visible counting bug a clinician notices immediately. Self-contained, any time.

### 5. `S8` (`P7-1` rulebook + `P2-7` docs-match-code tripwire). **Sonnet 5, Medium.**
Easier now the table exists — compare docs against `DOSE_INTERVAL_RULES`, not prose.

### 6. `S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`. **Sonnet 5, Low–Medium.**
Unranked leftovers; several predate S14 and may be moot. Re-read each before starting.

### 7. MeningoVax's 9 inline styles — **owner decision still open**, Sonnet 5, Low.
Different repo. Ledger: `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both were investigated and closed.

## Model and effort for the next session

Start with item 1 only → **Sonnet 5, Medium effort** is enough: the clinical call is the
wording, which the owner approves up front, and the code is mechanical.
Going straight to item 2 or 3 → **Opus 5, High effort**: both need live source verification
and both can silently change clinical verdicts.
Do not attempt items 2 and 3 in one session.

## Why this is a good stopping point

The interval programme is merged, deployed and verified. The one open clinical question is
now answered by the owner, with the engine evidence behind it recorded above, and the queue
is ordered so every step before the big rework is independently verifiable. Nothing is
half-built and no file is mid-edit.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`.
2. Confirm the suite: **465 passing / 41 files.** Stop and diagnose any mismatch first.
3. **Ask, don't default:** (a) the exact wording for item 1 (propose the earliest-valid-date
   sentence and get approval); (b) whether to open the MeningoVax inline-styles PR.
   **Do not re-litigate:** the three owner decisions at the top of this file, the 2026-10-11
   adult-floor determination, `A-P1-1`, the paediatric risk lists (`CLINICAL_SPEC.md` §C),
   the seven S14-RC decisions, or rr7203a1's PCV13→PPSV23 floor (answered: no exception).
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green →
   **live-verify in the running app** → one commit per item ID. For a guard whose assertion
   is "nothing is wrong", introduce the fault on purpose and watch it go red.
5. **Before changing any interval rule**, read the header of `src/logic/doseIntervalRules.js`
   and `CLINICAL_SPEC.md` §K. **Add a table row; never add an age test to the evaluator.**
   Every adult floor is an OWNER determination dated 2026-10-11 — never cite ACIP or CDC.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to `main`.**
7. **Dev server:** `preview_start` has reported a wrong port before — read the real port from
   `preview_logs`. Another chat's server may already be running in this folder.
