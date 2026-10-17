> **SUPERSEDED 2026-10-17** by `docs/archive/handoff-2026-10-17-findings-a-and-b-merged.md`.
> Its queue has moved on — do not resume from this file.

> ## ⛔ SUPERSEDED — 2026-10-17
>
> Replaced by **`handoff-2026-10-17-ic-children-clinical-gap.md`**, written later the same
> day. Do not resume this queue: three of its statements are now out of date.
>
> - Its "⛔ The one thing blocking C7" section is **wrong**. The PDF obstacle is three
>   documents, not four, and two of the three were readable all along — the adult job aid
>   was already in `~/Downloads` (the browser-pane attempt this file records as a failure
>   had in fact succeeded), and p2016 downloads by command line. Only the CDC catch-up job
>   aid still needs a click.
> - C1's two PRs are **merged** in both apps.
> - C7 is **4 of 6 documents read**, not 1, and reading them turned up a clinical gap in
>   the engine that is now fixed and under review as PR #58.
>
> Its note about the wrong test count baked into commit `628b5d7` still stands.

# PneumoVax — Handoff after C1, C2 + C3, and the start of C7 (2026-10-17)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Dev server: `.claude/launch.json` ("PneumoVax dev server"), served at `/PneumoVax/`.
⚠ Its reported port is wrong — read the real one from `preview_logs` (it was **5174** today,
while `preview_start` reported 64962).

Branch: `feature/2026-10-17-c2-c3-numbered-sources`, off `main` at `7ae6b04`, containing C1's
commit as well. **NOT pushed — owner decision 2026-10-17: hold C2/C3 until the citation work
is done**, so the first numbered Sources row she sees has every number used.
Baseline was 1,046 passing in 91 files; now **1,067 passing in 93 files**, all green, working
tree **clean** at `0b1a044`.

> ⚠ **One wrong number is baked into commit `628b5d7`'s message**: it says "1,067 passing"
> was "1,066". The verified figure is **1,067 in 93 files** (1,053 + 14 new tests), confirmed
> by running the suite after the last test was added. The commit quotes a count measured one
> test earlier and could not be amended (history rewriting is blocked in this environment).
> **Use 1,067 in the PR body.** Nothing else in that message is affected.

Current queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`
(items C1–C8, checks G1–G5). Its counts are now **re-measured and correct** — see its new
top banner. C7's reading log is `docs/archive/c7-2026-10-17-source-readings.md`.

## What's done

1. **C1 — hovering a raised number names the document.** Shipped in BOTH apps, commits
   `1316e07` here and `e5b5b65` in MeningoVax. **PRs are open and green, awaiting the owner's
   merge**: PneumoVax [#57](https://github.com/jojohuhu-git/PneumoVax/pull/57) and MeningoVax
   [#73](https://github.com/jojohuhu-git/MeningoVax/pull/73), both `test` SUCCESS, both
   MERGEABLE. MeningoVax's half had been committed as "NOT yet driven in a browser"; it was
   driven live this session (its dev server was already running on 5175) and the hover text
   reads correctly — nothing to fix, the gap was only in verification.
2. **The plan's counts, re-measured** (`0b1a044`). Every number in that document was from
   before the transplant hard stop. Three corrections came out of it, all recorded in the
   plan's new banner: C3 is **two** documents not one; C7's pile is **24** sources not the
   predicted 22; and **0 of 16,202** cards have a gap in their numbering.
3. **C2 + C3 — the buttons carry the number the text uses** (`628b5d7`). The row is headed
   "Sources"; `cardSources()` in `citations.jsx` is now the single place that works out both
   the numbering and the row, so they cannot disagree. C3 added `immPCV7Page` and
   `documentRefFor()`, closing all 2,268 cards that showed a `[N]` for a document with no
   button. 14 new tests. Prose diff **0 of 33,660 lines** — no clinician-visible wording
   moved, and note that tool *cannot see* this change at all, which is why the tests exist.
   Driven live on the owner's own card; screenshot taken.
   - **Mutation-proved**, including one that found a hole in my own first draft: numbering
     the text from a second independent counter failed **0 of 1,066**. A rendered G3 test now
     matches every marker's number to its own document's button by page URL. Recorded in the
     commit rather than quietly fixed.
4. **C7 started — 1 of 6 documents read** (`0b1a044`). mm7401a1 read live with three verified
   sentences, the heading each sits under, the patient population each was written about, and
   a cite-or-remove disposition proposed for all 13 of its statements.

## What's NOT done — the remaining queue

**C7 → C8 is the whole remaining job, and it grew this session.** The owner, seeing the
numbered row, gave a new rule: **"all sources need to be cited in the explanations if it will
be listed as a source."** Measured scope: **68 distinct (source, statement) pairs** over 6
documents (full table in the C7 log).

**The root cause, found today and recorded in neither the plan nor the audit:** these are not
68 separate oversights. `recommend.js` merges a **fixed default set into every card of a
pathway** — `recommend.js:859` gives every adult card the Adult Notes, the Timing Job Aid and
mm7401a1; children get `['cdcChildPneumo', 'p2016']`. A card lists them whether or not
anything it says rests on them. That is the literal answer to the owner's second question,
*"why there are multiple source chips listed if its only citing one of them."*

Remaining, in order:

| Item | Scope |
|---|---|
| **C7 docs 2–6** | Read live: Adult Timing Job Aid (15 statements), immunize.org p2016 (34), PCV Catch-up Job Aid (2), Child/Adolescent Notes (3), Adult Notes (1). |
| **C8** | Per pair: cite it inline with a live-read quote, or **remove it from that card** (owner decision below). |
| **G1, G4, G5** | G1 (a button nothing points at) can only pass once C8 is done — that is why it was deliberately NOT shipped with C2/C3. |
| **C4, C5** | MeningoVax-only, untouched, independent of all of the above. |
| **The dead `advisory` flag** | Owner approved removing it as its own small change (flag + unreachable pill in `RecCard.jsx:276` + the corpus column). Not started. A background task was filed for it. |

## ⛔ The one thing blocking C7, and it needs the owner

**Four of the five remaining documents are PDFs, and the browser pane cannot open them** —
tested today: `Vaccine-Timing-Adults-JobAid.pdf` returns a file download and a save dialog,
and the pane does not navigate. There are no local copies in `~/Downloads`. So the readings
cannot proceed without **downloading the four PDFs**, which needs the owner's explicit
permission. They are:

| File | Source | Approx. size |
|---|---|---|
| `Vaccine-Timing-Adults-JobAid.pdf` | cdc.gov/pneumococcal/downloads/ | ~1 MB |
| `pneumococcal.pdf` (PCV catch-up job aid) | cdc.gov/vaccines/hcp/imz-schedules/downloads/job-aids/ | ~1 MB |
| `p2016.pdf` | immunize.org/wp-content/uploads/catg.d/ | ~200 KB |
| *(p2016 covers the paediatric defaults; the Child/Adolescent and Adult Notes are HTML and need no download)* | | |

**Ask before fetching any of them.**

## Why this is a good stopping point

C1 is finished and under review in both apps. C2/C3 is complete as a unit — behaviour, copy,
styles, 14 tests, four mutation proofs, a prose diff and a live screenshot — and sits on a
branch deliberately unpushed, so nothing half-done is visible to a clinician. The clinical
half has not been started beyond one document's reading, and that reading is written down
rather than held in a session's head, which is exactly what C7 is for.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-17-c2-c3-numbered-sources`
2. Run `npm test` — confirm **1,067 passing in 93 files** before any new work.
3. Start the dev server with `preview_start`; read the real port from `preview_logs`.
4. **Ask the owner, do not default:**
   - permission to download the four source PDFs (above) — C7 cannot proceed without it;
   - merge of PRs #57 and #73, which are green and waiting;
   - whether the proposed **removals** in the C7 log may land per document, or all at the
     end. A removal is a clinical act; the owner asked to see them rather than have them
     batched invisibly.
5. Per-item workflow: read the source live → write the disposition into the C7 log → failing
   test → fix → full suite green → drive the running app → commit named by the item ID.
   **Never quote a source from memory or from the app's own stored copy.**
6. Push/merge: branch → PR → `gh pr merge --squash`; after merge confirm the Pages deploy
   (`gh run list --limit 3`) and spot-check the live site. Whatever lands in one app lands in
   the other.
