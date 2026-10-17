> ## ⛔ SUPERSEDED — 2026-10-17 (evening)
>
> Replaced by **`handoff-2026-10-17-c7-read-and-a-pcv20-timing-finding.md`**. Do not resume
> this queue. Its PR #58 is **merged**, C7 is **6 of 6 documents read**, and the open
> question it lists as "whether IC-1 needs mirroring in MeningoVax" is **answered: no**,
> with reasons. The newer file also carries two findings this one does not know about, one
> of them clinical and live.

# PneumoVax — Handoff after a clinical gap found mid-citation-work (2026-10-17)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Dev server: `.claude/launch.json` ("PneumoVax dev server"), served at `/PneumoVax/`.
⚠ Its reported port is wrong — read the real one from `preview_logs` (it was **5176** today,
while `preview_start` reported 51642).

**Two branches are live, and they are deliberately separate.**

| Branch | Contents | State |
|---|---|---|
| `fix/2026-10-17-ic-children-told-complete` | the clinical fix + the new gate + all six C7 reading commits | **pushed**, [PR #58](https://github.com/jojohuhu-git/PneumoVax/pull/58) OPEN, MERGEABLE, `test` still running at hand-off |
| `feature/2026-10-17-c2-c3-numbered-sources` | C2/C3's numbered Sources row, still **held** per the owner's 2026-10-17 decision | **NOT pushed**, unchanged |

Baseline at session start was 1,046/91 (per the previous handoff), confirmed **1,067 passing
in 93 files** on the held branch. On the fix branch, off `main`, the baseline was **1,053 in
92** and is now **1,072 passing in 94 files**, all green, working tree **clean** at `63460ec`.

> The C7 reading commits exist on BOTH branches — cherry-picked onto the fix branch so the
> source readings and this finding reach `main` without dragging the held C2/C3 code with
> them. Only `12d4e0f` (C2/C3) touches `src/` on the held branch. After #58 merges, rebase
> the held branch on `main`; git will skip the duplicates, as it did for C1.

## What's done

1. **C1 merged in both apps.** PneumoVax [#57](https://github.com/jojohuhu-git/PneumoVax/pull/57) → `3dc0264`; MeningoVax [#73](https://github.com/jojohuhu-git/MeningoVax/pull/73) → `c1118c1`. PneumoVax's Pages deploy succeeded; MeningoVax's was still running — **check it**.
2. **C7 document 2 — CDC Adult Timing Job Aid** (`6e862e8`). 4 pages, NCIRD March 2025, read live. Independently confirms the S15 adult-interval rule page by page. 15 statements: **12 CITE**, 1 REMOVE, 2 held → then decided by the owner (`a28cdc3`): cite the job aid on the 2,589 cards aged 50+, remove it from the 935 aged 19–49 where the same table row says different words. Also settles all five mm7401a1 rows document 1 had left pending.
3. **C7 document 3 — immunize.org p2016** (`2c60519`). 34 statements: **30 CITE**, 4 became findings. Two corrections to what the app records about the document: it has **five** tables, not four (`refs.js` says "Tables 1–4" and its 2026-09-13 comment is wrong — Table 5 is the post-HSCT schedule, which changes **nothing** about the transplant hard stop), and it never mentions PCV21 (0 child cards currently affected).
4. **C7 document 5 — CDC Child & Adolescent Notes** (`3f96a5f`). 3 statements: 1 CITE, 2 became findings. Its "Special situations" sections are collapsed by default and hide the whole paediatric risk-based rulebook.
5. **IC-1 / IC-2 / IC-3 — the clinical fix** (`4c71b3d`). Immunocompromised children were told "complete" where CDC and p2016 still offer a dose. One named predicate, `pedsPostSeriesDoseDone`, plus a dedicated card so the citation describes the patient's own history. **111 of 16,008** verdict-corpus rows moved and **24 of 17,652** record-problem rows, every one `complete → risk-based`, 0 the other way. Live-verified in the running app.
6. **The IC/non-IC twin gate** (`63460ec`). Part A is the owner's twin comparison; part B states the asymmetry itself, because **part A alone would not have caught IC-1**. Proved by breaking the engine — the reverted fix shows 26 part-B breaches, a swapped predicate 3 part-A and 26 part-B.

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`, reading log
`docs/archive/c7-2026-10-17-source-readings.md` (**4 of 6 documents read**).

| Item | Scope |
|---|---|
| **C7 doc 4** | CDC PCV Catch-up Job Aid, 2 statements / 1,626 cards. **Blocked on one click**: cdc.gov's CDN returns 403 to every non-browser client; the browser pane raises a save dialog only the owner can accept. Open `https://www.cdc.gov/vaccines/hcp/imz-schedules/downloads/job-aids/pneumococcal.pdf` and click Save — it lands in `~/Downloads` like the adult job aid did. |
| **C7 doc 6** | CDC Adult Notes, 1 statement / 25 cards. HTML, not blocked. |
| **C8** | Apply all six documents' dispositions. **Needs sources attached per card** — `collectRefs()` cannot vary a card's source list by age band, which decision 2 above requires. Reuse `ROUTINE_ADULT_MIN_M`; never add a second age test. |
| **G1, G4, G5** | G1 can only pass once C8 is done — why it was not shipped with C2/C3. |
| **C4, C5** | MeningoVax-only, untouched, independent. |
| **p2016 label** | `refs.js` says "(Tables 1–4)"; the document has five. Label-only fix — do **not** re-add Table 5's schedule. |
| **The dead `advisory` flag** | Owner approved removing it as its own change. Not started. |
| **Interval-prose guard blind spot** | Background task `task_50100c88` filed: the guard only inspects lines where the key starts the line, so four existing `doseLabel:` lines hand-type "≥8 weeks" and slip past. |

**Findings 2 and 3 from document 3 are recorded and NOT fixed** (in the C7 log): 110 cards
state a 5-dose infant series p2016 never gives, and 32 cards describe themselves as "3 PCV
doses before 24 months" where p2016's row says "all before 12 months". Both are citation
accuracy, not wrong advice.

## Why this is a good stopping point

The clinical gap is fixed, gated, live-verified and under review as its own PR that depends
on nothing else. The four source readings are written down rather than held in a session's
head, and they reach `main` with that PR. The held C2/C3 work is untouched, so nothing
half-done is visible to a clinician.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout fix/2026-10-17-ic-children-told-complete`
2. Run `npm test` — confirm **1,072 passing in 94 files** before any new work.
3. Start the dev server with `preview_start`; read the real port from `preview_logs`.
4. **Ask the owner, do not default:**
   - merge of [PR #58](https://github.com/jojohuhu-git/PneumoVax/pull/58) — it changes what 135 patients are told, so she should see it;
   - **whether IC-1 needs mirroring in MeningoVax.** Not checked this session. The bug is pneumococcal-specific, but the `vaccine-parity` skill and memory both say to check the sibling before assuming;
   - the one click for document 4's PDF (above).
5. Per-item workflow unchanged: read the source live → write the disposition into the C7 log → failing test → fix → full suite green → **drive the running app** → commit named by the item ID. The owner's cadence for C7 is **one document at a time**: show her each document's proposed removals, with the quote, and wait.
6. Push/merge: branch → PR → `gh pr merge --squash`; after merge confirm the Pages deploy (`gh run list --limit 3`) and spot-check the live site.

## Two things this session learned the hard way

- **Driving the app caught what 1,067 green tests could not.** After the routing fix the children landed on a card whose quote described the opposite history. Both corpora record `status` and `brands`, not prose, so the wrong quote moved **zero** corpus lines.
- **Check a fixture against the date of birth.** Two drafts quietly tested a different patient — a PPSV23 dated before a five-year-old was born, and two PPSV23 doses five years apart for a six-year-old. The same mistake made the first write-up of finding 4 miscount, because it read raw input instead of what the engine accepted.
