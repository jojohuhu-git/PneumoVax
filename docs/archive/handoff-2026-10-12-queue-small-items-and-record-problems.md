> **SUPERSEDED (2026-10-12) by `handoff-2026-10-12-impossible-entries-coverage-and-warnings.md`.**
> Do not resume the queue below. Its **remaining item 1** (the sweep blind spot) is DONE — the
> conversation the owner asked for was had, and it produced a second corpus of 18,460 impossible
> entries. Its **item 2** is DONE in full: the future-dose chip is fixed in BOTH apps, the
> duplicate-entry port was taken and then narrowed by a second owner decision, and its "a date of
> birth in the FUTURE is not rejected" finding was simply **WRONG** — the age step already rejects
> it. Its **item 3** is still open and is carried forward verbatim in the new file.

# PneumoVax — Handoff after the small-item queue and two record-entry problems (2026-10-12)

> **Supersedes `handoff-2026-10-12-p0-p1-3-merged.md`.** Its "Loose end — PR #37" is DONE
> (merged, `1462152`, with the archive chain repaired). Its remaining-queue **item 2** is
> DONE in full — all five of its sub-items. Its **item 1 (the sweep blind spot) is still
> open, and is now a bigger question than it was** — see "What's NOT done" below.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/queue-small-visible-items`**, off `main`, pushed, clean at **`86d1621`**.
Open PR: **[#40](https://github.com/jojohuhu-git/PneumoVax/pull/40)** — six commits, awaiting
the `test` check and your review. **`main` is protected: branch → PR → squash merge. Never
push to `main`.**
Baseline at session start was 655 passing / 58 files; now **693 passing (63 test files)**,
all green.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and in
UI copy.

## What's done

### 0. PR #37 merged and the archive chain repaired — `1462152`
The S14-4C handoff existed only on that branch. Merging it as-is would have left the
newest-by-file-date handoff in `docs/archive/` pointing at a finished queue, and left the
S8 handoff carrying TWO supersede banners with the stale one first. Both fixed in the merge:
the S14-4C file now opens with a banner naming the current handoff and explaining why its
file date looks newer than the file that replaced it.

### 1–6. Six queue items — PR #40 (`82e034d`…`86d1621`)
Each was reproduced first, had a test watched to FAIL before the fix, and was mutation-tested
afterwards with the failure count recorded in its commit message.

1. **`P1-2`** (`82e034d`) — a card could show "Due / Today" and then nothing, with no control
   to reveal the recommendation, after "Adjust age" changed its status. What a card shows is
   now derived from its current status every render. *Mutations: 2 / 8 / 0 → the third gap
   was closed and re-broken (2).*
2. **`P1-4`** (`c3c932f`) — the root-note guard's message is now BUILT from its allowlist, so
   it cannot drift; the allowlist is pinned to CLAUDE.md's four files. *Mutations: 1 / 2 / 1.*
3. **`P2-12`** (`8682d22`) — the PPSV23 minimum age now has one home (`PPSV23_PRODUCT.minAgeM`).
   **Clinician-visible wording verified byte-identical before/after.** *Mutations: catalogue
   moved → engine followed; validator's own `24` restored → 3 failed.*
4. **`S10-N2`** (`8397ee2`) — **owner decision: "copy what MeningoVax does".** A date before
   birth is a RECORD PROBLEM, not a missing dose: it no longer says "repeat this dose only",
   and it names the recorded date of birth. W1 is NOT reopened — two control tests hold the
   repeat sentence in place for doses really given at the wrong age/time. *Mutations: 3 / 0
   (the 0 is reported in code, not hidden).*
5. **`validateHistory()` deleted** (`38ef0af`) — **owner decision.** Exported, called by
   nothing, saw one vaccine stream and no risk factors while carrying the most obvious name
   in the file. A note in its place says to use `analyzeBoth()`.
6. **Future-dated doses** (`86d1621`) — **owner decision: "fix it now, same as before-birth".**
   NEW FINDING, not from the old queue. The engine was accepting a dose dated 2030 as valid
   and counting it. Now refused as a record problem. **A dose dated today still counts.**
   *Mutations: 7 / 16 / 16 / 0.*
   - **Structural:** both impossible-entry checks now run ONCE in the walk, ahead of every
     vaccine rule (`recordProblemFor`). Before-birth used to sit inside each validator — two
     copies — which is why a PCV21 dated before a child's birth was blamed on the product
     licence. **Add new impossible-entry rules to `recordProblemFor`, never inside a validator.**
   - **Three existing tests turned red and were right to**:
     `regression-s3-n1-adult-early-advisory.test.js` had its clock at 2026-06-01 while using
     derived dose dates out to 2027-07-05 — fixtures recording future doses as already given.
     The clock moved forward; every gap under test is unchanged.

**Parity:** PneumoVax was the repo behind on items 4 and 6. MeningoVax already carries both
rules and needs no change. `doseIdentity.js` and `recordProblem*` are NOT mirror-synced
(unlike `dateUtils.js`) — the rule was ported, not the code.

## What's NOT done — the remaining queue

### 1. The sweep's blind spot — now THREE instances, not one. **Owner wants to brainstorm — ask, don't default. Opus 5, High.**
This grew this session and should be re-framed before anyone starts it. Measured against the
live grid:
- `src/test-grid.js` has **0 of 16,250** patients with a future-dated dose.
- **0 of 16,250** with a dose dated before birth.
- (Pre-existing) no shape pairing an earlier PCV15 with a same-day PCV20 + PPSV23 — the
  S14-4C case, provable by mutation.

So "0 of 16,250 moved" was honest but uninformative for three separate changes. The grid
contains **no impossible entries at all**. Also worth knowing: the corpus records
`reasons.length`, never reason TEXT, so it cannot see a wording change either — item 3 above
needed a hand-written before/after text comparison to be sure.
Adding these shapes multiplies into every age and risk profile and **moves the 16,250 figure
that many docs and tests quote.** Deliberately not taken.

### 2. Smaller, fully re-verified this session
- **A future-dated dose's chip still reads the age at that future date** — "D1 · May 1, 2030
  · age 10 years 4 months" for a child currently 6y9m. The verdict beside it is correct and
  clear; only the descriptor is odd. Before-birth already special-cases this ("age Before
  birth"), so there is a pattern to follow. **Noticed while live-verifying item 6; NOT fixed —
  it was outside what was decided.** Cheap. **Sonnet 5, Low.**
- **A date of birth in the FUTURE is not rejected.** Noted while writing `recordProblemFor`;
  not investigated. It is the one case that would make the order of the two record-problem
  tests matter. **Sonnet 5, Low–Medium.**
- **MeningoVax has a duplicate-entry record problem (`duplicateEntryProblem`, its G7) that
  PneumoVax does not.** The owner chose the narrower option this session ("fix it now, same
  as before-birth") over the wider one that included this. **Ask before taking it.**

### 3. Larger leftovers — re-read each before starting; several predate S14
Unchanged from the previous handoff except where noted:
- **`S5` / `P2-1`** — the test clock is confirmed NOT pinned (one test uses `setSystemTime`).
  **This session raised its value: item 6 found three fixtures that were only valid because
  nothing checked the clock.** Plus `P2-13` (wire `scripts/*.mjs` into the suite) and `P2-11`.
  **Sonnet 5, Medium.**
- **`S6`** — full one-number-one-home refactor. `P2-12` is now done, so S6 is smaller than it
  was. Widest blast radius in the project. **Opus 5, High.**
- **`S9` / `P4-1`** — the dose editor is confirmed duplicated in `StepHistory.jsx` and
  `Results.jsx`. Extract one component. **Sonnet 5, Medium.**
- **`S11`** — keyboard and focus. No `<form>` element exists, so no Enter trap; the
  "Date (optional)" `<label>`s are not associated with their inputs. **Sonnet 5, Medium.**
- **`S7`** — largely overtaken by `src/test-grid.js` + the sweep corpus. **Needs re-scoping.**
- **`S12`** — looks DONE. Verify and strike off rather than starting it.
- **MeningoVax's 9 inline styles** — different repo, owner's call.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Peds audit `P1-2` ("PCV dose 5 of 4") was closed 2026-10-11.

## Why this is a good stopping point

Every item in the previous handoff's "small, visible, cheap" block is done, and the two
owner decisions it flagged are answered and shipped. The six commits are independent of each
other and of the older queue. Nothing is half-built. The one item that is genuinely open (the
sweep) is a conversation the owner asked to have, and it is now better specified than it was —
three measured instances instead of one.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. If PR #40 is merged, confirm
   `git log -1` is at or after that squash commit; if not, check out
   `fix/queue-small-visible-items` instead.
2. Confirm the suite: **693 passing / 63 files, 0 failing.** Stop and diagnose any mismatch.
3. **Do not re-litigate:** this session's six decisions (P1-2's derive-from-status; P1-4's
   derived message and pinned allowlist; P2-12's single home; S10-N2's record-problem carve-out
   and that it does NOT reopen W1; deleting `validateHistory()`; future-dated doses refused,
   with "today" still counting). Plus everything the previous handoff listed: the P0 date-order
   decision and its same-day tie-break; P1-3's tick-rather-than-silent-drop and
   `STAMPED_AT_CREATION`; S14-4C; PCV7-never-counts; P6-3c; S14-4B; the S8 rulebook decision;
   the sweep hard-gate; ANCHOR-1; the 2026-10-11 adult-floor determination; `A-P1-1`; the three
   `P0-2` decisions; `CLINICAL_SPEC.md` §C; the seven S14-RC decisions; W1's scope and wording.
   **Ask, don't default:** remaining-queue item 1, and the duplicate-entry port in item 2.
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green →
   **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the count.**
   Every guard this session was mutation-tested. Three mutations SURVIVED and are written into
   the code as "not live coverage" rather than quietly dropped — follow that pattern; do not
   claim coverage you have not measured.
6. **Anything deciding whether a dose entry is impossible belongs in `recordProblemFor`**
   (`validate.js`), never inside a validator. One rule, one place — that duplication is exactly
   what caused the PCV21 misblame.
7. **Anything pairing a verdict with a dose must read `result.orderedDoses`**, never its own
   input array (P0).
8. **Anything deciding whether a row is a dose must call `isBlankDoseRow` / `dropBlankDoseRows`**
   — do not add a second filter.
9. Changing a row of `doseIntervalRules.js` means changing `CLINICAL_SPEC.md` §K's table in the
   same commit. Add a table row, never an age test in the evaluator. Every adult floor is an
   OWNER determination — never cite ACIP or CDC.
10. **If the suite reports moved verdicts, do not run `npm run sweep:update` until you can say
    why those patients should get a different answer.** Then put the count in the PR. And say
    what the sweep could NOT have seen — see remaining item 1.
11. **Use `analyzeBoth()`, not `analyzeHistory()`**, for anything needing both streams.
    `validateHistory()` no longer exists; do not re-add a one-stream wrapper.
12. **Dev server:** `preview_start` with `.claude/launch.json`. This session found five
    listening node ports in this folder that all served a DIFFERENT project. Confirm the port
    serves YOUR tree before trusting it:
    `curl -s localhost:PORT/PneumoVax/src/components/RecCard.jsx | grep showBody`.
13. **Adding a `quote` to `refs.js`:** load the page and confirm the exact string sits in a
    SINGLE leaf element. A `textContent` search is not enough.
