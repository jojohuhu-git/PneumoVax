# PneumoVax — Handoff after C8 document 2's CITEs (2026-10-17, late night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.
⚠ **Its reported port is wrong every time** — it reported 61412 and served **5177**. Read the
real port from `preview_logs`. Several stale dev servers were already up on 5173/5174/5176/5177;
confirm one serves THIS tree by fetching `/PneumoVax/src/data/refs.js` and grepping for a
string you just wrote.

Branch: **`feature/2026-10-17-c8-per-card-sources`**, pushed, working tree **clean** at
`702d041`, 7 commits ahead of `origin/main`. Suite **1,204 passing in 103 files**, all green,
**no skips** (was 1,178 in 102).

**PR [#67](https://github.com/jojohuhu-git/PneumoVax/pull/67) is OPEN and awaiting the owner's merge.** CI `test` is **green on `702d041`**
(verified, not assumed). This session could not merge it — the auto-mode classifier refuses
`gh pr merge`. Its body was extended with a full plain-English section on this work.

## What's done this session

### C8, document 2 — the 12 CITEs (`702d041`)

The handoff before this listed this as "the next thing to do, needs no owner decision". Done,
with one correction to its scope: the measurement showed **14** uncredited statements, not 12 —
the extra two are the 50+ halves of statements #1/#4 that decision 2 said to **cite** at 50+,
whose CITE half was also unwritten.

**Eleven of the fourteen are now cited. 6,805 → 3,189 uncredited (statement, card) pairs;
14 → 3 statements; 3,616 cards gained a citation. No advice moved** — not one clinical
sentence changes, only the superscript numbers.

Six new `refs.js` entries, each a verbatim job-aid sentence with `population` and `pdfPage`:
`jobAidSeriesCompleteAt50`, `jobAidSharedDecision65`, `jobAidChronic1949ReviewAt50`,
`jobAidEightWeekOptionAt50`, `jobAidPcv7CountsAsNone`, `jobAidPpsv23Unavailable`.

The 50+/19–49 split is the engine's existing `isOlderAdult`, never a second age test.

**These are the app's first quoted PDF citations.** `highlightUrl()` now emits `#page=N` for a
PDF — `#:~:text=` is an HTML text fragment no PDF viewer honours, i.e. a dead link that looks
live. A quoted PDF without `pdfPage` now fails `regression-p6-3-cite-and-highlight-url`.

⚠ **THE LIGATURE CORRECTION — read before re-verifying any job-aid quote.** The PDF's embedded
font maps the fi/fl ligature to a bare `f`, so EVERY extractor drops the next character:
*fluid*→*fuid*, *specified*→*specifed*, *deficiency*→*defciency*. The pair **"fi" occurs zero
times across all four pages** and U+FB01/U+FB02 zero times — measured with `scripts/pdfLayout.py`
AND pypdf 6.13.0. **`docs/archive/c7-2026-10-17-source-readings.md` records "fuid" as "the
document's own typo"; that is WRONG** and is corrected in `CLINICAL_SPEC.md`, in `refs.js` and
in the new test. The doubled "leak" in "fluid leak (CSF) leak" IS the document's own and stays.
Second trap: read this PDF **positionally** — a flat dump splices the row's left-hand cells into
the middle of the shared-decision sentence.

**Tests.** New `regression-c8-doc2-job-aid-cites-its-own-sentences.test.js`, 23 tests,
**13 failing / 10 passing before the fix**. Mutations against 1,204, each applied and restored
from a scratchpad copy: hand-type the age **1**; flip the boundary **9**; over-apply to every
adult age **2**; show p.1's quote to 19–49 **4**; cite the wrong page on review-at-50 **5**;
orphan cite **2**; 8-week option at 19–49 **7**; restore the ligature artefact **8**.

**Four existing tests were narrowed to their real hazard, not relaxed**, each saying why in
place: the deep-link rule splits by document type (+2 new guards); `finding-c` asserts per note
HALF via `noteCiteSlices` instead of by index; `c8-doc2`'s "advice untouched" compares words with
markers stripped AND newly asserts the credit DID move; the owner's card in `c2-c3` records that
`[3]` is still unpointed.

**Live-verified** on the running app: 70y no history reads `[1] [1] [2] [1]`, `[2]` hovering
the job aid footnote and linking `#page=1`; 55y with a PCV20 reads `[1] [2]` with **every
button on the card pointed at**.

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings `docs/archive/c7-2026-10-17-source-readings.md`.

| Item | Scope |
|---|---|
| **C8 doc 2 — the last 3 statements** | **3,189 cards. OPEN OWNER DECISION, and the next thing to raise.** `PCV13+PPSV23 → ≥5y` (1,512), `PPSV23 → a PCV ≥1y` (1,154), `PCV13 → ≥1y, no PPSV23` (523). Each rests ONLY on a table **cell** (`≥5 years`, `≥1 year`, `NO OPTION B`) that the job aid states in **no prose anywhere**. So: quote the bare cell (a hover reading "≥1 year" tells a clinician nothing), compose a sentence the document does not contain (forbidden), or **remove** the job aid from those cards. All three are pinned as uncredited by a test. **Do not pre-judge it.** |
| **C8 — documents 3, 5, 6** | Removals proposed, **not shown to the owner**. One document at a time, with quote and count. Doc 3 = p2016 (34 statements, 8,214 cards), doc 5 = child schedule, doc 6 = adult notes (25 cards, 1 statement). |
| **Doc 4 statement 1** | 1,494 cards. Open owner decision. **She asked that it not be raised again. Do not re-ask unprompted.** |
| **G1** | "a card has a grey button no raised number points at". Still cannot pass: the 3,189 above plus mm7401a1's 2,544 kept cards, which no sentence quotes yet. |
| **p2016 label** | `refs.js` says "(Tables 1–4)" and `refs.test.js` asserts it; the live 2/16/2024 PDF has **five**. Label only — do NOT re-add Table 5 (transplant is a hard stop). |
| **Document 3's two recorded defects** | 110 cards state a 5-dose infant series p2016 never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before 12 months". |
| **Dead `advisory` flag** | Owner approved removing it as its own change. Verified dead. Needs a field-level corpus diff to show 0 real verdict moves. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. Wording question. |
| **NEW — job aid footnote §, unread** | p.1 carries a footnote § giving PPSV23 **minimum intervals** after PCV13 (8 weeks IC/cochlear/CSF, 1 year otherwise, plus ≥5 years since last PPSV23). The app never recommends PPSV23-after-PCV13 so nothing rests on it, but **CLAUDE.md's "every adult floor is an OWNER determination, never cite ACIP/CDC" warning makes this worth a deliberate read** before anyone cites it. Not acted on. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

## Why this is a good stopping point

Document 2 is now complete as a unit in the only way it honestly can be: every statement the
job aid states **in words** is quoted, and the three that exist only as table cells are left
untouched and pinned as uncredited, with the decision named rather than guessed. Nothing is
half-applied silently. The PDF-citation mechanism built here is reusable for documents 3 and 5
(both PDFs) with no further plumbing.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-17-c8-per-card-sources`
2. **Merge PR #67** if still open, then confirm the Pages deploy and spot-check live.
3. Run `npm test` — confirm **1,204 passing in 103 files**, no skips, before any new work.
4. `preview_start`; read the real port from `preview_logs`, and confirm the server serves THIS tree.
5. **Ask, do not default**, on what is next. The live question is the **3 cell-only statements**
   above — bring her the three options with the card counts and a worked example of how each
   would read on hover. Do **not** re-raise doc 4 statement 1.
6. Per-item workflow: reproduce → failing test (say by how many it fails pre-fix) → fix → full
   suite green → **break the fix and quote the counts** → **drive the running app** → commit
   named by the item ID.
7. Push/merge: branch → PR → squash merge; then confirm the deploy.

## What this session learned

- **Verify the quote against the document, never against the log.** The C7 log's quote (A) was
  wrong — "fuid" for "fluid" — and copying it forward would have printed a misspelling in front
  of a clinician and attributed it to CDC. Nothing in 1,178 tests could have caught it. The tell
  was a letter pair that should be everywhere occurring zero times.
- **A measurement can be wrong in a way that still returns a plausible number.** `buildCases()`
  yields `{ input, ... }`, not the engine's argument; passing the wrapper returned 17,016 cards
  with balanced markers and **zero** of them listing the job aid. "Looks like it ran" is not ran.
- **Read the mechanism before promising the item.** The handoff said the 12 CITEs "need no owner
  decision". Eleven did not; three turned out to rest on table cells with no prose behind them,
  which is a clinical decision. The count was also 14, not 12.
- **Restore every file a mutation touched.** Mutation 7 edited `riskFactors.js`, which the
  restore loop did not cover, and the next full-suite run read 7 failures that were not real.
