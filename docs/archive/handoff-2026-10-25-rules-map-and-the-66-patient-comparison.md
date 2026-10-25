> **SUPERSEDED 2026-10-25** by
> `handoff-2026-10-25-ppsv23-then-pcv-and-the-rules-lookup.md`. PR #87, which this
> document lists as open, **was merged**. Its remaining queue is carried forward there.
> Do not resume from this file.

# PneumoVax — Handoff after the rules map and the 66-patient PneumoRecs comparison (2026-10-25)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.
⚠️ **Read the real port from `preview_logs`** — `preview_start` reported 51415 this session
and the server was on **5178**. Fifth session running where this has been true.

Branch: **`docs/2026-10-25-pneumorecs-comparison-and-rules-map`**, off `main` at `758f929`.
Pushed, working tree **clean** at `31c1796`.

Baseline at the start of this session was 1,576 passing in 142 files; now
**1,606 passing in 144 files, 0 failures, 0 skips** (`npx vitest run --reporter=json`).

[PR #87](https://github.com/jojohuhu-git/PneumoVax/pull/87) **open, NOT merged** — the owner
squash-merges; a session agent cannot. Its body is written for her in plain English and
carries the three wording decisions listed below.

**PR #86 was merged by the owner during this session** (2026-10-25T14:40:11Z). This branch
is a clean descendant of that merge.

## What's done

Three commits, each independent of the others.

1. **The 2026-10-17 comparison is on `main` at last** (`5049587`). It had been committed to
   `docs/2026-10-17-pneumorecs-comparison`, which was never merged — a re-downloaded copy of
   the folder would have lost a day's work. Merged rather than retyped, so its history
   survives, and marked superseded.
2. **C-COMPARE** (`112ca33`) — 66 patients through CDC's PneumoRecs and through PneumoVax.
   **54 agree, 12 differ.** Six of the twelve are patients CDC's tool cannot be asked about;
   four are the adult interval the owner decided on 2026-10-16; **two are defects in CDC's
   tool.** Write-up:
   `docs/archive/comparison-2026-10-25-pneumorecs-vs-pneumovax-66-patients.md`.
3. **C14** (`31c1796`) — the rules map, both halves: a "How recommendations are made" page
   reachable from the header, and a "How this was worked out" disclosure on the result.

### How the CDC column was produced, and why it can be trusted

All **175** of PneumoRecs' recommendation branches were read out of the seven scripts its
live pages load, with the answers needed to reach each; **19 are unreachable** and are
excluded with the measured reason recorded. Patients are resolved by answering CDC's own
questions from their dose dates, taking the first branch its own if/else order allows.
**Seven patients, one per page, were driven by hand through the live site — all seven
printed exactly the string the resolver returns.** Everything is in `scripts/pneumorecs/`;
re-run with `node scripts/pneumoRecsCompareAll.mjs`.

### Four things a future session will want to get wrong

- **The CDC pages carry superseded markup inside HTML comments.** A first pass read it and
  "found" a bug that does not exist (that CDC had relabelled an answer without renumbering
  it). Strip comments, or read the live DOM.
- **The same element id means different things on different pages.** `chk-groupC` is
  immunocompromising on the adult pages; the teen page uses `chk-risk-Egroup`. Matching on
  the label alone put three at-risk children on superseded branches whose footnote still
  read *"PCV includes PCV7, PCV13, and PCV15"*.
- **`M.y18` in `recommend.js` is `ADULT_SCHED_MIN_M` (228 = 19 years), not 18.** The name is
  misleading and the value is right. C14's guard pins the two together.
- **The transplant hard stop gets no `path` from the engine at all.** That is deliberate —
  owner decision 2026-10-16 says one banner and nothing else on the page, so the route is
  withheld at the engine rather than left for a surface to remember. Do not "fix" it.

## What's NOT done — the remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P1 — OWNER DECISION** | **The 40 Group-B cards** | Carried over untouched from the previous handoff. C13 left them on immunize.org p2016; ACIP's 2023 Table 1 has no PPSV23 condition either, so it would cover them better — but changing them alters a decision of 2026-10-23 and a count pinned in two guards. **Ask; do not widen it alone.** |
| **P1 — OWNER DECISION** | **Three wording items from the comparison** | All in PR #87's body. (a) a healthy 5-year-old who finished the series is told "Not indicated" where CDC says "Schedule complete"; (b) a 25-year-old with asplenia and a PCV20 is told "Complete" where CDC also says "check at 50"; (c) **a PCV-naive 2-year-old is told "≥8 weeks after the most recent PCV" when there is no most recent PCV** — flagged 2026-10-17, still unfixed, the 24–59-month catch-up card was not swept up by C12. None changes a dose. |
| **P2** | Patient E's "of 3"; dead `advisory` flag; `intervalWords().adj` has no consumer; the long PCV7 non-counting sentence (1,188 cards) still fully visible | Unchanged from the previous handoff. Wording/cosmetic, none clinical. |
| **P2 — DESIGN PARITY** | **MeningoVax has neither of C14's two surfaces** | The `design-review` skill makes MeningoVax↔PneumoVax design parity a standing rule, and this session added two UI patterns. Too large to apply in-session, so recorded here rather than dropped. MeningoVax's rules are not PneumoVax's, so `src/data/rulebook.js` would have to be rebuilt from its own files — the *pattern* ports, the content does not. Consult `vaccine-parity` first. |
| — | **MeningoVax: she wants the same audit there** — *"I will eventually need to go to meningovax to do the same audit."* Not started. | |

**Closed, do not reopen:** Ruling D, C11, case H, Ruling F, families 2 and 3, the flat-8-week
second clock, the Job Aid's last uncredited statement, the PCV13 hold-out, the two
conjugate-to-conjugate floors, and — new today — the claim that CDC's 19–49 page asks only
one merged risk question (it asks a three-way one on the "has had PPSV23" path; verified
live).

## Why this is a good stopping point

Both things the owner asked for on 2026-10-25 are built, measured, guarded,
mutation-tested and live-verified, and they are independent of each other and of the
queue above. No clinical rule changed and no verdict moved — both sweep corpora are
byte-identical, which is also what proves the engine's new `path` field disturbs nothing.
Everything still open is a question for her, not work in progress.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout docs/2026-10-25-pneumorecs-comparison-and-rules-map`
   — or branch fresh off `main` if PR #87 has merged. Never stack on an unmerged PR.
2. `npx vitest run --reporter=json` — confirm **1,606 passing in 144 files** before any new
   work. For the file count use `len(testResults)`; pipe to `tail`, never `head`.
3. **Check PR #87's `test` check**, then put the four open decisions to her — the Group-B
   cards and the three wording items. Ask with a named patient and a control, run through
   the real engine, in plain words — never a rule id and a count.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit →
   full suite → **break the fix more than one way and quote the counts** →
   `node scripts/proseDiff.mjs dump <file>` (plain `node`, NOT `vite-node`) on both sides →
   **drive the running app** → commit per item.
5. Push/merge: **branch → PR → the owner squash-merges.** A session agent cannot merge.
6. Her standing style rules: plain language for a non-coder, specific patient examples,
   card text abbreviated with an expander, worded clinically and succinctly.

## Two traps this session paid for

- **A guard can match the wrong thing by its label.** The resolver matched CDC branches by
  the words on the button, and the same words sit on different buttons on different pages.
  Scope an identifier to the page it lives on before trusting it.
- **Verify a "finding" before it reaches a commit message.** Two candidate CDC defects were
  written up in draft and then disproved — an off-by-one from relabelled options (leftover
  commented markup) and a live branch printing pre-2024 advice (unreachable). The two that
  survived were each confirmed by driving the live site twice.
