> ## ⚠️ SUPERSEDED — 2026-10-25, later the same day
>
> Read **`handoff-2026-10-25-adult-interval-rules.md`** instead.
>
> The owner supplied six interval tables after this handoff was written, and they settle
> the question this file lists as "⛔ THE ONE THING BLOCKING": the adult half of her A/B
> answer. Her ruling is that **every early adult dose counts** — all six adult floors are
> now recommendations on branch `feature/2026-10-25-interval-rules-reorganised`, so the
> change described below as "built, verified and REVERTED" has effectively landed, in a
> wider form than this file anticipated.
>
> One item below is also **reversed**: this file's commit 2 made a child's conjugate after
> a PPSV23 COUNT with an optional repeat. Her updated paediatric table calls it a repeat,
> and she confirmed that choice. It is P1 in the new handoff and is NOT yet done.
>
> Its three "Open questions" and the carried-over queue are still live and are restated in
> the new handoff.

# PneumoVax — Handoff after the PPSV23→PCV rules and the rules lookup (2026-10-25, cloud session)

Branch: **`claude/amazing-brahmagupta-hq1wcd`**, off `main` at `1c3fe52` (PR #87 merged).
Pushed, working tree clean at `059ce76`. Three commits, each independent.

Baseline at the start of this session **1,606 passing in 144 files**; now
**1,630 passing in 146 files, 0 failures, 0 skips**.

⚠️ **This session ran in the cloud, where `cdc.gov` and `stacks.cdc.gov` are blocked by the
environment's network policy (403 at the proxy).** The owner supplied five PDFs instead, and
every citation below was read out of those rather than fetched live. If a future session can
reach CDC, re-verify the two new sentences; they are quoted verbatim in `CLINICAL_SPEC.md`.

---

## What shipped

### 1. `1cb7166` — an at-risk toddler's catch-up waits 8 weeks after her PPSV23 (192 patients)

CDC's at-risk "Age 2–5 years" row states **two** intervals and the card implemented only the
second: *"Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after the most recent dose and
administered at least 8 weeks apart)"*. The date came from the last **PCV**, so a 4-year-old
with asplenia whose only pneumococcal dose was a PPSV23 24 days ago was told her first
conjugate was due **today**, on a card quoting *"at least 8 weeks after the most recent
dose"* underneath it.

Found by comparing two patients who differ only in age — the 6–18 block already anchored on
the most recent pneumococcal dose, so an 8-year-old was told 26 Nov and a 4-year-old was told
today. **225 of 17,016**, all aged 2 or 5, none 6 or over.

**192 fixed; 33 deliberately left, pinned by number** (see "Open questions" below).

Spec `§C-PPSV23ANCHOR`. Guard
`regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`.

### 2. `2786c6e` — a child's early conjugate COUNTS, with the repeat offered (231 doses)

There was **no rule at all**. An 8-year-old with asplenia, PPSV23 1 Oct and PCV20 15 Oct, was
accepted in total silence.

ACIP 2023 (PCV20 in children), p. 9, states the anchor outright, which is why the row is
CDC's and not an owner determination:

> *"a single dose of PCV15 or PCV20 is recommended ≥8 weeks after the most recent dose of
> pneumococcal vaccination, **regardless of whether the child has previously received
> PPSV23**, even if PCV7 was received."*

Owner ruling: a **recommendation**, not a floor. The chip gains **no new word** (her "keep
the dose chips to a limited variety"); the alternative lives behind *"Why this"*.

Spec `§K-PPSV23THENPCV`. Guard
`regression-2026-10-25-child-conjugate-after-ppsv23-counts.test.js`.

### 3. `059ce76` — both rulebooks become a lookup; the document list stops being random

Nine columns, generated from one describer in `src/data/rulebook.js` and rendered by **both**
the in-app page and `CLINICAL_SPEC.md` §K, with `rule-docs-match-code.test.js` building its
expectation from the same functions. Rule ids gone from the clinician-facing page. Sources
grouped by who they are about, then publisher, with a "sentences quoted" count.

---

## ⛔ THE ONE THING BLOCKING: the adult half of her A/B answer

**Built, verified on both patients, and then REVERTED.** It is not in any commit. A future
session can redo it in minutes — the shape is described below and the `optionalRepeat`
machinery it needs already exists and is tested.

**What she said (2026-10-25):** *"keep child and adult the same but both should provide a
comment on an alternative plan if they choose to repeat the dose and when it should be
repeated. If I remember properly, adult would be 1 year after last pneumococcal and child
would be 8 weeks?"* — and, on the chips, *"if you have a simplified chip that can state
complete see comments or something of the sort, then yes you can update chip and give
alternative schedule in the expander."*

Both numbers are right. mm7401a1's clinical guidance table gives *"PPSV23 only → A single
dose of PCV21, PCV20, or PCV15 **≥1 year after the last PPSV23 dose**"* under **all three**
adult groups, risk-blind.

**Why it was not landed.** Reading that as "the adult dose counts too" reverses her ruling of
**the previous evening**, on this exact patient:

> *"For a healthy adult, ACIP requires a PCV15 or PCV20 given after a PPSV23 to be ≥1 year
> after the PPSV23, with no 8-week option. So the 19 Jun 2026 PCV15 … is invalid and needs to
> be repeated."*

With the change applied, that patient's PCV15 **counts**, her card reads *"Complete (PCV15 +
PPSV23)"*, and the chip offers an optional repeat from 19 Jun 2027. The change breaks **44
tests in 17 files**, one of which —
`regression-2026-10-24-families-2-3-reverted-ruling-f-kept.test.js` — exists specifically to
record her restoring this floor. Rewriting the test that says she decided the opposite is not
something to do on an inference.

It also makes this **the last adult conjugate floor**: afterwards no adult PCV dose is ever
rejected for timing. (The adult PPSV23 floors are untouched.) That is the end of an arc she
walked in three steps — Ruling F, the 2026-10-24 "relax both" ruling, and this — which is the
strongest argument that it IS what she meant.

**The change, exactly.** In `ADULT-PCV-AFTER-PPSV23`:

| Field | From | To |
|---|---|---|
| `enforcement` | `'floor'` | `'recommendation'` |
| `grace` | `true` | `false` (recommendations take no grace) |
| `authority` | `'OWNER'` | `'CDC'` (Ruling F's relabelling: as advice it asserts only ACIP's own sentence) |
| `optionalRepeat` | — | `true` |
| `message` | `{ reasons, detail }` | `{ reason, why }`, same shape as the child row |

Then `npm run sweep:update`, and rework the 17 test files — most of which fail only because
their patient no longer has an invalid dose.

**Ask her in one line:** *"Your 55-year-old with only a PPSV23 who gets a PCV20 two weeks
later — does that dose count now, like the child's, or is it still thrown out as you said on
the 24th?"*

---

## Open questions, all small, all measured

| # | Question | Count | Why it was not decided |
|---|---|---|---|
| 1 | A **healthy** child with a PPSV23 on record — does the 8 weeks apply? | 11 advice + 14 graded | CDC's healthy row states no interval, p2016 says "most recent **PCV** dose", and the Jan 2025 catch-up job aid counts PCV doses only and says *"Give Dose 1 today"*. Applying it would make the number this app's own. |
| 2 | The **3-doses-before-12-months** row — same question | 22 | ACIP 2023: *"at least 8 weeks after the last **PCV** dose"*. PCV, not dose. |
| 3 | `ADULT-PCV20-21-5Y-AFTER-PPSV23` — should it offer the optional repeat too? | — | Her "both should provide a comment" was about the early-conjugate patient. Ruling F settled this row's wording as *"Counted; no repeat indicated"* on 2026-10-24. Not extended without a word from her. |

Questions 1 and 2 are **pinned by number** in
`regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js` (33, split
11 / 22), so widening the anchor fails a test rather than passing quietly.

**One pre-existing fault noticed in passing, not fixed:** the at-risk 24–71-month card cites
`pedsRiskIncompleteCatchup` ("Less than 3 PCV doses…") for **both** of its targets, including
the 3-doses-before-12-months one, which that sentence is not about. FINDING I's shape — a
right document, a wrong row. Not touched because it moves no dose.

---

## Carried over, untouched

| Priority | Item |
|---|---|
| **P1 — OWNER** | **The 40 Group-B cards.** C13 left them on p2016; ACIP 2023 Table 1 has no PPSV23 condition either. Changing them alters a decision of 2026-10-23 and a count pinned in two guards. Ask; do not widen alone. |
| **P1 — OWNER** | **Two wording items from the 66-patient comparison.** (a) a healthy 5-year-old who finished reads "Not indicated" where CDC says "Schedule complete"; (b) a 25-year-old with asplenia and a PCV20 reads "Complete" where CDC also says "check at 50". *(The third — a PCV-naive 2-year-old told "≥8 weeks after the most recent PCV" when there is none — is partly addressed by commit 1, which now names the pneumococcal dose on the `<3 doses` card.)* |
| **P2** | Patient E's "of 3"; dead `advisory` flag; `intervalWords().adj` has no consumer; the long PCV7 sentence (1,188 cards) still fully visible. |
| **P2** | **MeningoVax design parity** — it has neither of C14's two surfaces, and now neither the lookup nor the organised source list. The *pattern* ports; the content does not. Consult `vaccine-parity`. |
| — | **MeningoVax: the same audit.** Not started. |

---

## Three traps this session paid for

- **`git checkout --` during a mutation test destroyed uncommitted work.** CLAUDE.md warns
  about this in as many words and it happened anyway: restoring a mutation in
  `Rulebook.jsx` reverted the whole rewrite of that file, not the one planted line. **Copy to
  the scratchpad before mutating; restore with `cp`.** The rewrite had to be redone.
- **A mutation that "fails to apply" reads exactly like a mutation nothing catches.** Two of
  the first four mutations silently never applied (a shell quoting fault) and printed
  "NOTHING FAILED". Make the mutation script `assert` that the text actually changed — the
  one here does now.
- **A passing mutation is a finding, and this one had a real reason.** Swapping
  `ppsv.lastDate` for the FIRST counting PPSV23 broke nothing, because a second counting
  PPSV23 is arithmetically impossible under 72 months. That unreachability is now pinned by
  its own test instead of being left to luck.

## Resuming

1. `git checkout claude/amazing-brahmagupta-hq1wcd` — or branch fresh off `main` if the PR
   has merged. Never stack on an unmerged PR.
2. `npx vitest run --reporter=json` — confirm **1,630 passing in 146 files**. Use
   `len(testResults)` for the file count; pipe to `tail`, never `head`.
3. Put the adult question above to her first — it is one line and it unblocks the only
   finished-but-unlanded work.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → **break the fix more than one way and quote the counts** → `node
   scripts/proseDiff.mjs dump <file>` (plain `node`) on both sides → **drive the running
   app** → commit per item.
5. **Branch → PR → the owner squash-merges.** A session agent cannot merge.
6. Her standing style rules: plain language for a non-coder, specific patient examples, card
   text abbreviated with an expander, worded clinically and succinctly.
