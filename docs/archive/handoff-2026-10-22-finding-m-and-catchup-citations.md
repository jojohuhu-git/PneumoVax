> ## ⚠ SUPERSEDED — 2026-10-23
>
> **This queue has been consumed.** Continue from
> [`handoff-2026-10-23-cdc-child-notes-finished.md`](handoff-2026-10-23-cdc-child-notes-finished.md).
>
> Also out of date here: the PR section. PR #74 was MERGED on 2026-10-23 and PR #73 was
> CLOSED as redundant (its commits were already inside #74), so nothing from those sessions
> is pending. And CDC's Child/Adolescent Notes — listed below as 8 statements over 1,107
> cards — are now FINISHED, with zero uncredited pairs.

# PneumoVax — Handoff after FINDING M and the healthy 24–59 month citations (2026-10-22)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.
⚠ **It reports a port it is not using** — read the real one from `preview_logs` (this session
it said 58900 and served on 5174).
What the app is: a client-side React SPA giving pneumococcal vaccine advice across the
lifespan. No backend; **every clinical claim on a card must be traceable to a document that
speaks for *that patient***.

Branch: **`feature/2026-10-22-finding-l-closed-and-chip-names`**, off
`feature/2026-10-18-finding-k-nested-bullet` (PR #73's head). Pushed.
Baseline was 1,296 passing in 115 files (verified at session start); now **1,339 passing in
117 files**, all green, no skips. Working tree clean at `67e6e56`.

Consumed and superseded: `handoff-2026-10-22-finding-l-closed-and-chip-names.md`.

## ⚠ FIRST: the PR situation is unchanged and still needs the owner

**PR #73** — https://github.com/jojohuhu-git/PneumoVax/pull/73 — is still **OPEN, MERGEABLE,
CLEAN**. It carries FINDING K. **It is not merged, so the live site still shows FINDING K's
904 wrong-patient quotes, and now also the FINDING M dose this session removed.**

This branch's PR targets **`main`**, not #73's branch — deliberately, because aiming a PR at
a parent branch is exactly what lost PR #72. It therefore carries #73's commits as well, so
merging it alone lands everything and #73 can simply be closed. If the owner merges #73
first instead, this PR's diff shrinks to this session's two commits on its own; both orders
work. **A session agent cannot merge** (the classifier blocks `gh pr merge`) — hand the owner
a green PR and stop.

## What's done (by ID)

1. **FINDING M — a series finished in the second year is finished** — `fee6c3c`.
   A healthy 2-year-old with three PCV13 doses at 16, 18 and 20 months was told to come back
   for another. All three documents on that card say the series is done. `pcvHealthyChild`
   credited a 12–23 month dose as the final dose only when 4+ doses were on record.
   - **OWNER RULING 2026-10-22**, in her words: *"Healthy children, PCV initiated at 12–23
     months → 2 doses, ≥8 weeks apart is the full series… This applies to the child who had
     only a single 12–23 month dose. Interval validity matters."*
   - Sources, all read live: CDC catch-up Table 2's "Dose 3 to Dose 4" cell (*"only
     necessary for children… who received 3 doses before age 12 months"*), the job aid p.3
     ("1 or more doses were given at 12 months of age or older" → "No dose today"), p2016
     Table 2's "Completed … by 24 mos" row.
   - **"Interval validity" needed no code and that was checked, not assumed**:
     `CHILD-PCV-AFTER-PCV` already voids a too-close dose (measured: 51 days out, 52 in), so
     counting EFFECTIVE doses enforces it. **Do not add a second interval test there.**
   - **A WRONG VERSION PASSED ALL 1,313 TESTS.** The first attempt handled only a series
     begun at 12–23 months and still offered a fourth dose to a child dosed at 5/14/17
     months. Caught by deleting the guards and finding nothing failed. The rule has **two**
     lines: started at 12–23mo → 2 doses; started before 12mo → 3 doses, one at ≥12 months.
   - Moved: **12 of 17,016** real patients, **15 of 18,264** impossible entries, 0 added/
     removed. All 27 are one patient shape × 3 risk sets, and every one differs **only** in
     the recommendation field.
   - `CLINICAL_SPEC.md` §B gains "What 'completed by 24 months' means" with the row table.
     Two stale lines in `docs/agent/clinical-rules.md` corrected.

2. **C8 — both healthy 24–59 month cards now credit every document they list** — `67e6e56`.
   588 cards. The catch-up card and the "series complete" card each listed three documents
   and numbered one. Now none is uncredited on either. **Uncredited pairs 49 → 47.**
   - The job aid needed a **five-way split** (its p.3 answers one age band differently per
     prior-dose column); p2016 needed one row per card.
   - **The previous handoff's split was wrong and the owner ruled to re-derive it.** It said
     60/72/12; on EFFECTIVE doses it is 48/84/12, and after FINDING M 48/84. Two of its
     three named cells do not fit — it put the "8 weeks" cell on patients whose 8 weeks had
     passed, and "Give Dose 4" on children whose doses were not all before 12 months.
   - **Two histories deliberately get no job aid number** (owner case (a)): 4+ conjugate
     doses (its table stops at 3) and an undated completing dose (it requires documented
     doses). **Neither exists in the grid**, so both are asserted directly in the test.

Both commits: mutations run against the full suite to prove the guards bite (4 for FINDING M,
3 for C8), prose-diffed field by field, and driven in the running app with a control.

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`. **Re-measure, never quote a count
from a log or a handoff** — this session found the last handoff's counts wrong twice.

| Priority | Item | Scope |
|---|---|---|
| **P1** | **C8 doc 3 — p2016's remaining CITEs** | **38** statements, 7,131 cards. The biggest block left. |
| **P1** | **C8 — CDC Child/Adolescent Notes** | **8** statements, 1,107 cards. Includes FINDING K's group B; decide whether a risk-condition chip needs its own number, uniformly. |
| **P2** | **The wrong-ROW gap the all-columns guard cannot close** | It asks whether *some* p2016 row fits, not whether the row the card *used* fits. Needs the engine to record which row it used. |
| **P2** | **Grid gap, recorded not fixed** | `buildCases()` cannot express p2016 row 2's patient — nor, as this session found, **any** 2-dose healthy 24–59mo child. Moves both corpora; needs the owner. |
| **P2** | **Dead `advisory` flag** | Owner approved removal as its own change; needs a field-level corpus diff to show 0 real moves. |
| **P2** | **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **P2** | **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. |
| **P2** | **Job aid footnote §, unread** | p.1 carries PPSV23 minimum intervals after PCV13. Nothing rests on it. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** FINDING L (wrong premise); the p2016/576 question (owner said NO,
2026-10-18); "add a number-has-a-chip guard" (G2 already does it); **the Catch-up Job Aid's
144-card statement (done above)**. Its OTHER statement — 1,584 cards, healthy 5–18s not
caught up — is the decision the owner asked **not** to be re-raised.

## Why this is a good stopping point

Two independent units, each committed with its own proof, tree clean and suite green. They
had to be done in this order: FINDING M is what makes the job aid's 2- and 3-dose rows fit
by construction, so doing the citations first would have written entries for patients who
then stopped existing.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-22-finding-l-closed-and-chip-names`
2. Check PR state (`gh pr view 73`, and this branch's PR). **Do not leave this branch
   without a PR.**
3. `npx vitest run` — confirm **1,339 passing in 117 files**, no skips. Pipe to `tail`,
   never `head` (`head` closing the pipe wedges the run). For a reliable count use
   `--reporter=json --outputFile=…` and read the JSON; the terminal tail can show a stale
   RTK log.
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **47** pairs.
5. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix in more than one way
   and quote the counts** → **proseDiff `dump` then `diff`, classified field by field** →
   **drive the running app, with a control** → commit named by the item ID.
6. Push/merge: branch → PR → squash merge by the owner.

## Lessons this session paid for

- **A mutation that passes is a finding, not a formality.** Deleting this fix's two guards
  broke nothing — and the reason was that the fix itself was half right. Mutate every clause
  separately, not just the whole line.
- **"Healthy" is not `riskIds.length === 0`.** `smoking` and `alcoholism` are adult-only
  indications, so a child carrying one is still `child-routine` and still on the healthy
  path. Filtering on an empty risk list found 4 of the 12 cards. Ask `populationOf()`.
- **Count doses the way the document counts them.** The job aid requires documented doses
  meeting minimum ages and intervals — the EFFECTIVE count. Counting raw rows is what
  produced the previous handoff's wrong 60/72/12.
- **MeningoVax had this exact bug class and fixed it five weeks earlier** (M5, 2026-09-15:
  "a series STARTED at 7–23 months is a 2-dose primary series … the app asked for a third
  primary dose that CDC does not want"). The sibling repo is a checklist; read it first.
- `WebFetch` saves a PDF to disk even when it refuses to transcribe it, and the saved path
  is in its result — `shasum` it against the local copy to prove you read the live document.
