# PneumoVax — Handoff after the conjugate gaps, the card wording, and the 2023 children's citations (2026-10-25)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.
⚠️ **Read the real port from `preview_logs`** — `preview_start` reported 51126 this session
and the server was on **5177**. Fourth session running where this has been true.

Branch: **`fix/2026-10-25-invalid-dose-adults-and-children`**, off `main` at `1b36184`.
Pushed and in sync. Working tree **clean** at `0b5122e`.

Baseline at the start of this session was 1,521 passing in 138 files; now
**1,576 passing in 142 files, 0 failures, 0 skips** (`npx vitest run --reporter=json`).

[PR #86](https://github.com/jojohuhu-git/PneumoVax/pull/86) **open, NOT merged** — the owner
squash-merges; a session agent cannot. Its `test` check was green on the previous head
(`c5cc90b`); **re-check it for `0b5122e` before anything else.** The PR body carries a
second section, "Added 2026-10-24", describing items 1–2 in plain English.

**PR #85 is CLOSED** (the owner closed it 2026-10-25 01:19). The previous handoff listed it
as the one blocking P0; it is resolved and needs nothing.

## What's done

Three items, each asked of the owner with worked patients first, then built, measured,
mutation-tested, live-verified in the running app, and committed on its own.

1. **§K-CONJUGATE** (`8b8d5a9`) — the last two adult rows that rejected a conjugate given
   sooner than a year after another conjugate became **recommendations**.
   `ADULT-PCV20-21-AFTER-PCV13` (authority → CDC, whose sentence states the year) and
   `ADULT-PCV20-21-1Y-AFTER-PCV` (authority stays **OWNER**, because no source states its
   interval at all, and its message says so to the clinician — **do not relabel it to make
   the pair symmetrical**). `evaluateDoseInterval` now **collects** unmet recommendations
   instead of returning at the first, per her *"mention both gaps"*; an unmet floor still
   returns at once and discards them. **0 of 35,280 prose lines moved** — neither grid can
   build these patients, so the guard holds three by name.
2. **C12** (`c5cc90b`) — four wording changes, no date/verdict/corpus movement.
   (a) no card names a routine age the child has passed (198 patients);
   (b) one date format on screen, `fmtDate` everywhere a clinician READS, **data fields stay
   ISO** (5,620 sentences); (c) the dose chip gained MeningoVax's **"Why this"** disclosure —
   `message` may return `{ reason, why }`, and `detail` moved behind it for *every* dose;
   (d) each chip now states the **shortfall**, not just the interval, after she asked *"the
   5 years isn't being met right?"*. 8,087 lines changed, **0 unexplained by substitution**.
   `scripts/proseDiff.mjs` was extended to sweep `whys` the day the channel was created.
3. **C13** (`0b5122e`) — ACIP's 2023 PCV20-in-children report, **Table 1**, on the at-risk
   child cards: half A **replaces** immunize.org p2016 (56 cards), half B is **added**
   beside CDC's child notes (432 cards). p2016's footprint 3,459 → **3,403**.

### Three things from this session a future session will want to get wrong

- **The 2023 paper is NOT `mm7239a5.htm`.** That page is a one-paragraph notice with no
  table (read live). Table 1 is page 10 of the Supplementary Report PDF at
  `https://stacks.cdc.gov/view/cdc/133252/cdc_133252_DS1.pdf`. Both entries exist; the
  notice must never carry a Table 1 row.
- **C13's swap is scoped to 56 of 96 cards.** The other 40 — where a PPSV23 has been given —
  keep p2016 by her decision of 2026-10-23, and that 40 is the same number FINDING K pins.
  Widening the swap breaks 7 tests in 5 files; that is correct, not an obstacle.
- **p2016 was not removed for silence.** Its row fits and was re-read live. This is a
  ranking under her "cite CDC" rule, not FINDING F.

## What's NOT done — the remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P1 — OWNER DECISION** | **The 40 Group-B cards** | C13 left them on p2016. ACIP's 2023 Table 1 has **no PPSV23 condition either**, so it would cover them better than p2016 does — but changing them alters a decision she made on 2026-10-23 and a count pinned in two guards. **Ask; do not widen it alone.** |
| **P1** | `ADULT-PPSV23-AFTER-PPSV23` (settled: keep, 5 years) | The last adult floors. The two conjugate rows are now done; this one she has already ruled on. Nothing to do unless she reopens it. |
| **P2** | Patient E's "of 3"; dead `advisory` flag; `intervalWords().adj` has no consumer; the long PCV7 non-counting sentence (1,188 cards) is still fully visible while everything else shortened | All wording/cosmetic, none clinical. |
| — | **MeningoVax: she wants the same audit there** — *"I will eventually need to go to meningovax to do the same audit."* Not started. Consult `vaccine-parity` first. ⚠️ C12 added a UI control (`.dose-val-toggle`, `.dose-val-why`) and the design-review skill makes MeningoVax↔PneumoVax design parity a standing rule — check whether MeningoVax's dose chips want the same disclosure. | |

**Closed, do not reopen:** Ruling D, C11, case H, Ruling F (do NOT split it at 1 year),
families 2 and 3, the flat-8-week second clock, the Job Aid's last uncredited statement
(1,584 cards — she asked for it not to be re-raised), the PCV13 hold-out, and now the two
conjugate-to-conjugate floors.

## Why this is a good stopping point

Every decision she gave this session is implemented, measured, guarded, live-verified and
written into `CLINICAL_SPEC.md` (§K-CONJUGATE, §K-READING, §K-PCV20CHILD2023). The branch is
a clean descendant of a merged `main` and all three commits are independent of each other.
The one P1 that is a question for her blocks nothing.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout fix/2026-10-25-invalid-dose-adults-and-children`
   — or branch fresh off `main` if PR #86 has merged. Never stack on an unmerged PR.
2. `npx vitest run --reporter=json` — confirm **1,576 passing in 142 files** before any new
   work. For the file count use `len(testResults)`; pipe to `tail`, never `head`.
3. **Check PR #86's `test` check for `0b5122e`**, then put the Group-B question to her.
   Ask with a named patient and a control, run through the real engine — never a rule id
   and a count.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → **break the fix more than one way and quote the counts** →
   `node scripts/proseDiff.mjs dump <file>` (plain `node`, NOT `vite-node`) on both sides,
   compared by **substitution** → **drive the running app** → commit per item.
5. Push/merge: **branch → PR → the owner squash-merges.** A session agent cannot merge.
6. Her standing style rules, both reaffirmed this session: *"Keep questions and explanations
   in plain simple language for a noncoder... Use specific patient examples, visuals if
   needed"*, and — new on 2026-10-25 — card text should be **abbreviated with an expander**,
   MeningoVax-style, and worded **clinically and succinctly**.

## Four traps this session paid for

- **A passing mutation is a finding.** Two of C13's five mutations broke nothing: moving a
  citation marker onto a sentence that states a different claim, and joining a quote to its
  heading. Neither had any sweep. Both are guarded now — but the lesson is that "the suite
  is green" said nothing about either.
- **A guard can count the wrong thing.** FINDING J's split read `input.ppsv23Doses.length`
  while the engine keys on the **effective** count, so a PPSV23 given below the minimum age
  put 40 patients on the wrong side and reported them as a removal.
- **Measure before quoting a count to her.** "96 cards" was right for the claim and wrong
  for the change: 56 moved, 40 did not.
- **Restore mutations from a scratchpad copy, never `git checkout --`** while the tree holds
  uncommitted work. Three mutation harnesses this session; all used `cp` from a backup.
