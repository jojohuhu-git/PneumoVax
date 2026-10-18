> **SUPERSEDED 2026-10-17 (late evening)** by
> `docs/archive/handoff-2026-10-17-population-field-done.md`. The patient-population field
> this file lists as the next item is **done** and open as PR #65, and PR #64 (findings C,
> D and E) is **merged**. Do not resume from this file.

# PneumoVax — Handoff after three citation findings (2026-10-17, evening)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`
("PneumoVax dev server") — ⚠ this session could **not** start one (five already running
from other chats, the per-folder cap). They all serve this same folder, so the live
verification below was driven against an existing one on **port 5178**, confirmed to be
serving this working tree by fetching `/PneumoVax/src/data/refs.js` through it and finding
the edit. That is a legitimate fallback; `preview_start` is still the first thing to try.

Branch: **`fix/2026-10-17-finding-c-adult-review-at-50-citation`**, off `main` at `af0103f`,
pushed, two commits. Working tree clean at `4d2a2b7`.
Baseline at session start was 1,083 passing in 95 files; now **1,107 passing in 97 files**,
all green, verified on this branch.

**PR [#64](https://github.com/jojohuhu-git/PneumoVax/pull/64) is open, CI green (`test` passed in 56s on `4d2a2b7`), mergeable,
and NOT merged** — the merge was refused by this session's permission mode, not by the
repo. **First action next session: merge it** (`gh pr merge 64 --squash --delete-branch`),
then confirm the Pages deploy (`gh run list --limit 3`) and spot-check the live site.

**PR #61 was closed** (owner decision 2026-10-17): it carried only last session's handoff
document, which the newer handoff on `main` already replaced, and a "superseded" banner
that `main` already had in its own wording.

## What's done

### FINDING C — merged into the branch. A card saying "no dose now" quoted the sentence that says give one

A 19–49 adult with chronic conditions only, PCV13 and one PPSV23 on record, is correctly
told **"No dose now — review at age 50"**. The citation beside that sentence was CDC's
**50+** row — *"1 dose PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal
vaccine dose"* — which instructs a dose on a card that says not to give one. CDC's own
19–49 block states this patient's rule and the app was not quoting it.

- New ref `adultChronicOnlyReviewAt50`; the 50+ sentence is **kept**, moved to the detail
  half, which is the claim it supports. No verdict, date or brand changed.
- **175 of 16,008** patients when measured; **210 of 17,016** after FINDING D/E widened the
  grid later the same session. Both numbers are real; the test pins 210 and says why.
- Test: `regression-2026-10-17-finding-c-review-at-50-citation.test.js` (12 tests, 7 fail
  pre-fix, confirmed).

### FINDING D + E — same branch. An at-risk baby, a quote that excluded them, and a silent age 2

- **D**: a 15-month-old with asplenia whose series is finished was cited to *"For children
  **without risk conditions**, PCV20 is not indicated…"*. Root cause: `pcvInfant()` never
  received `riskIds` at all. It now takes `pedsRiskIds(riskIds)`.
- **E**: CDC's at-risk rows start at "Age 2-5 years", so that baby is complete **today**
  and owes a dose on their second birthday. The card said nothing; it now says
  *"one further dose falls due at age 2 years… Re-check at the 2-year visit."* A child
  whose series already includes PCV20 is told the opposite, and why.
- Test: `regression-2026-10-17-finding-d-at-risk-infant-complete.test.js` (12 tests, 9 fail
  pre-fix, confirmed).

⚠ **A correction this session had to make to its own measurement.** The quote stored under
`pedsRiskPcv20orPpsv23` was first attributed to the **IC** block by a sweep that searched
for a string typed from the page's structure rather than the string actually stored in
`refs.js`. Re-measured with the quotes read straight out of `refs.js`, it is the **non-IC**
sentence — so the IC sentence had **no key at all** and immunocompromised children were
quoted the sentence that omits the five-year follow-on their own row owes them. New key
`pedsIcPcv20orPpsv23`. **Rule for the next session: drive every quote check from `refs.js`,
never from a string you typed while reading the page.**

### The grid grew, and nothing moved

`GRID_PCV_HISTORIES`' only completed infant series was four doses of **PCV20** — a child
who needs nothing further at any age — so the grid could not express FINDING E at all, and
deleting the age-2 sentence left every sweep green. A four-dose **PCV13** history is added.
Corpora regenerated with owner approval and checked **key by key**, not by the update
script's "moved" count:

| corpus | before | after | rows added | existing answers changed |
|---|---|---|---|---|
| real patients | 16,008 | 17,016 | +1,008 | **0** |
| impossible entries | 17,652 | 18,264 | +612 | **0** |

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
reading log `docs/archive/c7-2026-10-17-source-readings.md`.

### Next item: the patient-population field — OWNER DECISION ALREADY TAKEN

**Owner decided 2026-10-17: the field records WHO THE SENTENCE IS ABOUT, not which block
it was printed in.** Usually the two are the same, but a sentence can be wider than its
block (*"Adults aged 19 years and older…"* is printed under Special situations and covers
everyone). A test fails if a card shows a quote to a patient outside that scope. The three
deliberate cross-references get a **marked exception at the one place each is used, with
the reason written there** — the data stays honest and the exception stays visible.

Measured over the new 17,016-patient grid, driving every quote from `refs.js`:
**8 of 28 quoted refs**, **5,711** (quote, patient) showings. Not one list — three kinds:

| | count | what it is |
|---|---|---|
| `adultPcv20or21Complete` → 50+ | 2,079 | **false alarm**: text says "19 years and older" |
| `cdcChildSpecialSituations` → healthy child | 1,584 | **deliberate**: cited to say what the patient *isn't* |
| `pedsRoutine4Dose` → at-risk child | 976 | **false alarm**: at-risk rows start at age 2, so the routine series is theirs too |
| `adultBothNotAt65` → 19–49 | 440 | wrong instance, advice agrees |
| `adultPpsvOnly` → 19–49 | 230 | wrong instance, twin differs only in punctuation |
| `pedsRisk6to18NoPcv` → IC child | 198 | wrong instance, IC twin exists |
| `adultRoutine50` → 19–49 | 180 | **deliberate**: explains the 50-year boundary |
| `pedsRiskPcv20orPpsv23` → IC child | 24 | wrong instance; the IC twin carries the five-year tail |

The four "wrong instance" rows are the work. The three marked **false alarm/deliberate**
are what the chosen design must NOT flag — 4,639 of the 5,711.

### Everything else, unchanged from the previous handoff

| Item | Scope |
|---|---|
| **Doc 4 statement 1** | **1,494 cards.** Open owner decision, three readings in the C7 log. **She was shown this twice and asked that it not be pushed again. Do not re-ask unprompted.** |
| **C2/C3** | Branch `feature/2026-10-17-c2-c3-numbered-sources`, held and unpushed, 2 commits of real code (`RecCard.jsx`, `citations.jsx`, `refs.js`, 420 lines of tests). Rebased before Finding A landed — **re-check it against the new `main`**, which now also carries C/D/E's `refs.js` changes. C8 depends on it. Backup at `backup/2026-10-17-c2-c3-pre-rebase`. |
| **C8** | Apply all six documents' dispositions. Needs per-card sources; reuse `ROUTINE_ADULT_MIN_M`, never a second age test. |
| **G1, G4, G5** | G1 can only pass once C8 is done. |
| **p2016 label** | `refs.js` says "(Tables 1–4)"; the live 2/16/2024 PDF has **five**. Label only — do **not** re-add Table 5's schedule (transplant is a hard stop). |
| **Dead `advisory` flag** | Owner approved removing it as its own change. Not started. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so `doseLabel:` lines can hand-type "≥8 weeks". **It earned its keep this session** — it caught a hand-typed "at least 8 weeks" in FINDING E's new `detail:` text before that text ever ran. |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. Wording question. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

Still recorded and unfixed from document 3: 110 cards state a 5-dose infant series p2016
never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before 12
months". Citation accuracy, not wrong advice.

## Why this is a good stopping point

Two complete findings are committed, green, live-verified and open as one reviewed PR, and
the third (E) was found and closed in the same pass rather than written down for later. The
measurement that the next item depends on has been redone against the stored quotes and is
in the table above, so the population field starts from data rather than from the earlier
count that turned out to have one row backwards. Nothing is in a partial state a clinician
could see.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. **Merge PR #64** (`gh pr merge 64 --squash --delete-branch`), confirm the Pages deploy,
   spot-check the live site. It is green and was only blocked by a permission mode.
3. Run `npm test` — confirm **1,107 passing in 97 files**.
4. `preview_start` the dev server; if the per-folder cap refuses, find a running one and
   confirm it serves this tree before trusting what you see.
5. Next item is the **patient-population field**, with its shape already decided (above).
   **Ask, do not default**, only on: whether the four "wrong instance" rows get twin refs
   or a widened scope. Do **not** re-raise doc 4 statement 1.
6. Per-item workflow: reproduce → failing test (confirm it fails pre-fix) → fix → full
   suite green → **drive the running app** → commit named by the item ID.
7. Push/merge: branch → PR → `gh pr merge --squash`; then confirm the deploy.

## What this session learned

- **A quote can be verbatim, on the right page, and still contradict the card it sits on.**
  Finding B proved all 25 quotes were word-perfect. Three findings later, one of them was
  telling a clinician to give a dose on a card that said not to.
- **Check quotes by reading them out of the code, not by typing what you saw on the page.**
  One hand-typed string inverted an IC/non-IC attribution, and the error survived a sweep,
  a summary and a report before the code itself contradicted it.
- **The grid's blind spots are findable by asking what it cannot express.** "Every completed
  infant series in the grid contains PCV20" was a one-line check that explained why a real
  gap had never failed anything.
