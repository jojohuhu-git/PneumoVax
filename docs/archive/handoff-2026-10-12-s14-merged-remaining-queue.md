# PneumoVax — Handoff after PR #22 merged (2026-10-12)

> ⛔ **SUPERSEDED 2026-10-11 by `handoff-2026-10-11-anchoring-decided-and-reordered-queue.md`.**
> Do not resume this queue. Its one open clinical question — row 1, "does a dose that doesn't
> count still start the clock for the next one?" — has been **answered by the owner**, and its
> recommended ORDER has been **reversed**: the owner asked for the anchoring rework to go
> **last**, after two smaller fixes, not first. The worked examples below are still accurate
> and the superseding file re-verifies them, but read that file for the current plan.

> **Supersedes `handoff-2026-10-11-s14-7-one-rule-table.md`.** The whole interval
> programme — `S3`, `S3-N1`, `S14-1`…`S14-7`, plus `S14-7b` and `S14-7c` — is **DONE and
> MERGED**. The one open question that handoff left you (rr7203a1's PCV13→PPSV23 minimum)
> was **answered: no exception**, and is implemented. Read `CLINICAL_SPEC.md` §K for the
> current rules; do not resume any item from the older S14 files.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, synced with origin at **`b942261`**.
**PR #22 is MERGED** (squash, 2026-10-12 03:24 UTC). Deploy to GitHub Pages **succeeded**.

Suite: **465 passing (41 files), all green.** Production build clean.

This app's core promise is honesty: a silent wrong answer is worse than a crash. Every
adult interval floor in it is **the owner's clinical determination dated 2026-10-11** —
never cite ACIP or CDC for one.

## What's done this session

1. **Baseline re-verified, and the handoff I resumed from was stale.** It named `dfa1d92`
   as the tip; two commits (`ea3dc10`, `4016ae0`) had landed after it. `4016ae0` already
   answered its open owner question. Nothing was lost — but do not trust a handoff's sha
   without checking `git log`.

2. **`S14-7c` (`8e7cb08`) — the rule table's header still credited CDC with an adult
   floor.** `S14-7b` corrected that claim in `CLINICAL_SPEC.md` §K and `CLAUDE.md` but
   missed the copy inside `doseIntervalRules.js` itself, whose "Authority" paragraph still
   read *"Every paediatric row, plus one adult row: the 8-week PCV15→PPSV23 minimum."*
   The **rows were always right**; only the prose was stale. It mattered because
   `CLAUDE.md` sends every session to read **that header first** before touching an
   interval rule, so a session trusting it would have put ACIP's name back on the owner's
   determination. Header now carries the correction and the live rr7203a1 quote.

3. **Two new guards, because nothing enforced the headline invariant.**
   `CLAUDE.md` states "EVERY adult floor is an OWNER determination" in capitals, but no
   test checked it — a new adult row could have arrived carrying `authority: 'CDC'` and
   the suite would have stayed green. Now: (a) no `rulebook: 'adult'` +
   `enforcement: 'floor'` row may carry `'CDC'`; (b) the header paragraph must carry the
   correction in words. **Both confirmed to go red with the fault introduced on purpose.**
   Suite 463 → 465.

4. **PR #22's description was rewritten before merge.** Its text was the original S3 body
   and still said *"adults are deliberately left alone"* — the exact decision that was
   reversed. The owner would have been asked to approve the opposite of what shipped.

5. **Merged and verified live.** CI `test` green → squash merge → Pages deploy green. The
   live site serves `assets/index-DjcOOZFZ.js`, the **same asset hash** as the local
   `npm run build`, which proves the deployed site is exactly the merged code.
   All three comparison harnesses (adult, peds, HSCT) **byte-identical** across the change.

## The one open clinical decision — worked examples below

**Does a dose that doesn't count still start the clock for the next one?** The app answers
this **two different ways**, and the owner asked to see the consequences before deciding.

The asymmetry is **cross-stream only** (PCV↔PPSV23). Same-stream gaps (`prevSameStream`)
already anchor on an invalid dose in **both** streams, consistently, and CDC's repeat-dose
sentence supports that — *not* in scope. The mechanism: `priorPcv` is counting-only in both
walks, but `priorPpsv23` is counting in the PPSV23 walk and **raw** in the PCV walk
(`recommend.js:1005` hands over `rawPpsv`; the PPSV23 walk gets `pcvAnalysis.effective`).

Run live against the merged engine:

**CASE A — adult 70, PPSV23 only.** PPSV23 2015-01-01 (counts) → PPSV23 2018-01-01
(**rejected**, under 5 years) → PCV20 2018-06-01.
The PCV20 is 3.4 years after the dose that *counted*, 5 months after the one that did not.
> **Today: the PCV20 is REJECTED** — "Given 5 months after the PPSV23 dose of 2018-01-01".
> **Control (same PCV20 date, no mistimed dose in between): it COUNTS.**
> So one mistimed PPSV23 drags a later PCV dose down with it — **two rejections from one
> error.** Under "count from the last valid dose", the PCV20 would count.

**CASE B — child with asplenia.** PCV13 2025-01-01 (counts) → PCV13 2025-02-20
(**rejected**, 50 days) → PPSV23 2025-03-05.
The PPSV23 is 63 days after the PCV that *counted*, 13 days after a real injection that
did not.
> **Today: the PPSV23 COUNTS.** The app says a PPSV23 given 13 days after an actual PCV13
> injection is fine, because that injection didn't count.

**⚠️ Correction to the older handoff.** It warned that aligning the two "would move
existing paediatric verdicts." That is true only of the *other* direction (making
everything raw), which changes `CHILD-PPSV23-AFTER-PCV`. **The owner's instinct — count
from the last valid dose — moves NO paediatric verdict.** No child row uses `lastPpsv23`;
it only relaxes adult Case A. It is the cheaper option.

**The push-back the owner invited.** Consistency may be the wrong goal, because the two
gaps exist for different reasons. Case B's 8-week PCV→PPSV23 gap is **CDC's own minimum**
and immunologic (interference/blunting) — that depends on the injection the immune system
saw, not on bookkeeping, so "the shot happened" is the stronger argument *there*. The adult
floors are the owner's bookkeeping determination, where "measure from the dose that
counted" is more defensible. **The honest answer may be different per direction.**

**Implementation cost, worth knowing before choosing:** making the PCV walk use *counting*
PPSV23 doses is **circular** — the PPSV23 walk needs counting PCV doses and vice versa. It
needs a two-pass design, not a one-line change.

## What's NOT done — the remaining queue, in recommended order

| # | Item | Why this order | Model | Effort |
|---|---|---|---|---|
| 1 | **The anchoring decision above** | Blocks nothing else, but it is a live inconsistency and the examples are ready. Owner decides first; implementation is small (adult-only) if she keeps her instinct. | **Opus 5** — clinical reasoning + the two-pass redesign | **High** |
| 2 | **`S3-N2` / peds audit `P0-2`** — interval *keying* | The last interval item, and the same class of bug just fixed: `recommend.js:37` still imports `pcvSeriesMinIntervalDays` from `intervals.js` while `validate.js` uses the rule table, and they key the interval off **different ages** (current age vs. the earlier dose's age). Two sources of truth for one number. | **Opus 5** — clinical, needs `verify-clinical-source` on CDC Table 2 | **High** |
| 3 | **`S8`** — `P7-1` rulebook + `P2-7` `rule-docs-match-code` tripwire | Exactly the drift found by hand in `S14-7c`, caught automatically. Much easier now: the tripwire can compare docs against `DOSE_INTERVAL_RULES` instead of prose. Low clinical risk, high protective value. | **Sonnet 5** — mechanical once the table exists | **Medium** |
| 4 | **Peds audit `P1-2`** — "PCV dose 5 of 4" | A visible counting bug a clinician would notice. Self-contained. | **Sonnet 5** | **Medium** |
| 5 | **`S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`** | Smaller/unranked leftovers. Re-read each before starting; several predate S14 and may already be moot. | **Sonnet 5** | **Low–Medium** |
| 6 | **MeningoVax's 9 inline styles** | Different repo, owner's call whether to open a small PR. Ledger: `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored). | **Sonnet 5** | **Low** |

**Deliberately deferred, not forgotten:** nothing else. The anchoring asymmetry (row 1) is
the only knowingly-inconsistent behaviour left in the interval logic.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1` (a 20-year-old's PCV21 recorded at 17 was never counted — only the *wording* was
wrong, and that is fixed). Do not re-open either looking for a counting bug.

## Why this is a good stopping point

The entire interval programme is merged, deployed, and verified against the live site by
asset hash. The rule table is the single home for every gap rule, no age test decides
whether a rule may bite, every adult floor is correctly attributed to the owner, and two
new guards stop that attribution drifting again. The only open interval question is a
clinical one that needs the owner's answer, and the examples she asked for are above.
Nothing is half-built.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`.
2. Confirm the suite: **465 passing / 41 files.** Stop and diagnose any mismatch first.
3. **Open owner decisions — ask, don't default:**
   **(a)** The anchoring question above — she leaned toward "count from the last valid
   dose" and asked for examples before committing. Show her Case A and Case B, and the
   push-back, before implementing.
   **(b)** Whether to open a small PR against MeningoVax for its inline styles.
   **Do not re-litigate:** the 2026-10-11 adult-floor determination, `A-P1-1`, the
   paediatric risk lists (`CLINICAL_SPEC.md` §C), the seven S14-RC decisions, or
   rr7203a1's PCV13→PPSV23 floor (answered: no exception).
4. Per-item workflow: reproduce → failing test first (**confirm it fails**) → fix → full
   suite green → **live-verify in the running app** → one commit per item ID. For any
   guard whose assertion is "nothing is wrong", introduce the fault on purpose and watch
   it go red — that is how `S14-7c`'s two guards were validated.
5. **Before changing any interval rule**, read the header of `src/logic/doseIntervalRules.js`
   and `CLINICAL_SPEC.md` §K. **Add a table row; never add an age test to the evaluator.**
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.** `main` is currently clean and deployed; start new work on a fresh branch.
7. **Dev server:** `preview_start` has reported a wrong port before — always read the real
   port from `preview_logs`. Another chat's server may already be running in this folder.
