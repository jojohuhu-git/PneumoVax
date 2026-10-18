> ## ⚠️ SUPERSEDED — 2026-10-18
>
> The queue below was resumed and four of its open items were decided and implemented.
> **Do not work from this file.** The current handoff is
> [`handoff-2026-10-18-four-owner-decisions.md`](handoff-2026-10-18-four-owner-decisions.md).
> In particular: the 45 chronic cards and the job aid's 3 cell-only statements are DONE,
> and FINDING F reversed two of the six mm7401a1 removals this file treats as settled.

# PneumoVax — Handoff after C8 document 1's CITEs (2026-10-17, late night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.
⚠ **Its reported port is wrong every time** — this session it reported **52424** and served
**5178**. Read the real port from `preview_logs`, then confirm the server serves THIS tree by
fetching `/PneumoVax/src/data/refs.js` and grepping for a string you just wrote.
⚠ `scripts/proseDiff.mjs` must be run with **plain `node`**, not `vite-node` — its
`import.meta.url === process.argv[1]` guard never fires under vite-node, so it exits 0 and
writes nothing. `scripts/uncreditedSources.mjs` DOES need `vite-node`.

Branch: **`feature/2026-10-17-c8-per-card-sources`**, pushed and in sync, working tree
**clean** at `1a4d968`, **9 commits ahead of `origin/main`**. Suite **1,221 passing in 104
files**, all green, **no skips** (was 1,204 in 103).

**PR [#67](https://github.com/jojohuhu-git/PneumoVax/pull/67) is OPEN and awaiting the owner's merge.** CI `test` is **green on `1a4d968`**
and `mergeStateStatus` is CLEAN (both read from `gh`, not assumed). This session could not
merge it — the auto-mode classifier refuses `gh pr merge`. Its body now carries a full
plain-English section on this work.

## What's done this session

### C8, document 1 — the 7 CITEs (`1a4d968`)

The previous handoff listed this nowhere; it listed the job aid's 3 cell-only statements as
"the next thing to raise". **Reading mm7401a1 live changed the order of the queue**: its
clinical-guidance table states all seven of its uncredited statements in **full sentences**,
so document 1's CITEs needed no owner decision and were worth doing first.

**2,544 → 45 uncredited (statement, card) pairs; 7 → 1 statements; 2,499 cards gained a
citation. Uncredited pairs over all documents 52 → 46. No advice moved.**

Seven new `refs.js` entries, each a verbatim mm7401a1 sentence with `population`:
`mmwrBothPcv13Ppsv50plus`, `mmwrIc1949OnePpsv`, `mmwrIc1949TwoPpsv`,
`mmwrPcv13NoPpsv23ToComplete`, `mmwrChronic1949ReviewAt50`, `mmwrRiskBased1949Unchanged`,
`mmwrNoneOrPcv7Only`.

⚠ **THE TRAP IN THIS DOCUMENT — read before citing it again.** mm7401a1's table has THREE
blocks (≥50; 19–49 immunocompromising / CSF leak / cochlear implant; 19–49 chronic) and each
carries a row for the SAME history, worded differently. "None or PCV7 only" is ≥1 year in two
blocks and ≥8 weeks in the IC one. "PCV13 only" differs between blocks by the single word
"administered". And **"PCV13 + PPSV23" splits again in the IC block on the NUMBER of PPSV23
doses** — one dose "the series is complete", two doses "reviewed again … Alternatively …".
`population` cannot see that split; it records an age band. The engine reads `ppsv.count`
(the **effective** count — a rejected dose is not a dose ACIP's row is about) in exactly one
place, `mmwrBothPcv13PpsvKey()` in `recommend.js`. **Never collapse those rows.**

**No advice moved, proved not assumed.** `scripts/proseDiff.mjs` dumped every rendered
sentence over both corpora before and after — **35,280 lines**. Stripping the new `[c]`
markers and the seven new citation labels, **0 lines differ**.

**Tests.** New `regression-c8-doc1-mmwr7401a1-cites-its-own-sentences.test.js`, 17 tests,
**12 failing / 5 passing before the fix**. Nine mutations against 1,221, each applied and
restored from a backup copy: flip the 50+ boundary **11**; over-apply the ≥50 row **10**;
drop the dose-count split **2**; credit the silent 45 from the IC block **3**; widen the
chronic row's population **3**; show the year row to the 19–49 IC patient **1**; a
one-character typo in a quote **1**; a marker with no cite **2**; swap the 1-/2-dose rows **2**.

**Four existing tests updated, each narrowed to its real hazard rather than relaxed.** Most
notably `finding-c` required a lead quote to contain "no additional"/"no vaccines" — a proxy
for "does not instruct a dose" that could not express ACIP's row, which **defers** without
saying "no". It now allows both shapes, forbids dose-instruction by name, and additionally
asserts every marker has a cite behind it. `c1` no longer matches the literal "CDC Adult
Notes"; it asserts C1's actual promise (a marker's hover names the same document as the
button wearing that number) and that the card exercises more than one document.

**Live-verified** on the running app (port 5178): the owner's 70y no-history card reads
`[1] [2] [1] [3] [1]` against buttons `[1] CDC Adult Notes / [2] MMWR ≥50 expansion /
[3] CDC Adult Timing Job Aid` — **every grey button on her own card is now pointed at**.
19y with asplenia + PCV13 + **two** PPSV23 hovers the two-dose row; the same patient with
**one** hovers the one-dose row.

`CLAUDE.md` corrected: it still claimed document 2's CITEs were unwritten (they landed in
`702d041`). Both documents are now recorded as done, and the dose-count split is written
down as a rule shape that must not be collapsed.

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings `docs/archive/c7-2026-10-17-source-readings.md`.

| Item | Scope |
|---|---|
| **NEW — mm7401a1's last statement** | **45 cards. OPEN OWNER DECISION.** A 19–49 adult with chronic conditions only, PCV13 and **two effective** PPSV23 doses. ACIP's chronic block stops at one dose and states nothing about a second, so there is no sentence to quote — the choice is remove the document from those cards, or leave it. Pinned as uncredited by a test. |
| **C8 doc 2 — the last 3 statements** | **3,189 cards. OPEN OWNER DECISION** (unchanged from the previous handoff). `PCV13+PPSV23 → ≥5y` (1,512), `PPSV23 → a PCV ≥1y` (1,154), `PCV13 → ≥1y, no PPSV23` (523). Each rests ONLY on a job-aid table **cell** stated in no prose. **Note the asymmetry now: mm7401a1 states all three in sentences and is cited on those same cards**, so removing the job aid there costs the clinician nothing — that is new information since the decision was last framed. |
| **RAISED, NOT CHANGED — an emphasis gap** | For a 19–49 **immunocompromised** adult with PCV13 + **two** PPSV23, mm7401a1 leads with "reviewed again … at age 50" and offers the ≥5-year dose as the **alternative**; the app states the dose flatly. Not a contradiction (the "Alternatively" sentence is verbatim permission) but a clinical judgement for the owner. 45 cards. |
| **C8 — documents 3, 5, 6** | Removals proposed, **not shown to the owner**. One document at a time, with quote and count. Doc 3 = p2016 (34 statements, 8,214 cards), doc 5 = child schedule (2 statements, 1,728 cards), doc 6 = adult notes (1 statement, 25 cards). |
| **Doc 4 statement 1** | 1,494 cards. Open owner decision. **She asked that it not be raised again. Do not re-ask unprompted.** |
| **G1** | "a card has a grey button no raised number points at". Closer than it was — mm7401a1's 2,544 are done and the owner's own card now passes — but the job aid's 3,189 and the 45 above still block it. |
| **p2016 label** | `refs.js` says "(Tables 1–4)" and `refs.test.js` asserts it; the live 2/16/2024 PDF has **five**. Label only — do NOT re-add Table 5 (transplant is a hard stop). |
| **Document 3's two recorded defects** | 110 cards state a 5-dose infant series p2016 never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before 12 months". |
| **Dead `advisory` flag** | Owner approved removing it as its own change. Verified dead. Needs a field-level corpus diff to show 0 real verdict moves. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. Wording question. |
| **Job aid footnote §, unread** | p.1 carries a footnote § giving PPSV23 **minimum intervals** after PCV13. The app never recommends PPSV23-after-PCV13 so nothing rests on it, but CLAUDE.md's "every adult floor is an OWNER determination, never cite ACIP/CDC" warning makes this worth a deliberate read first. Not acted on. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

## Why this is a good stopping point

Documents 1 and 2 are both complete as units: every statement either carries the document's
own sentence or is pinned as uncredited with the decision named rather than guessed. The
owner's own card — the one her report came from — now has a number against every button.
Nothing is half-applied silently, and the next item is a decision rather than a build.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-17-c8-per-card-sources`
2. **Merge PR #67** if still open, then confirm the Pages deploy and spot-check live.
3. Run `npm test` — confirm **1,221 passing in 104 files**, no skips, before any new work.
4. `preview_start`; read the real port from `preview_logs`, and confirm the server serves THIS tree.
5. **Ask, do not default.** Two live decisions, and they are now related: the job aid's
   3 cell-only statements (3,189 cards) and mm7401a1's chronic 2-dose one (45). Bring both
   with counts and a worked hover example. Do **not** re-raise doc 4 statement 1.
6. Per-item workflow: reproduce → failing test (say by how many it fails pre-fix) → fix →
   full suite green → **break the fix and quote the counts** → **drive the running app** →
   commit named by the item ID.
7. Push/merge: branch → PR → squash merge; then confirm the deploy.

## What this session learned

- **Read the document before accepting the queue's framing.** The previous handoff said the
  next thing was an owner decision on three cell-only statements. Fetching mm7401a1 live
  showed a whole adjacent document whose seven statements needed no decision at all — and
  reframed the cell-only decision, because those cards now carry a readable ACIP sentence.
- **Three measurements in a row were wrong in plausible ways.** `c.input.doses` (the field is
  `ppsv23Doses`) gave one bucket of 1,512; recorded dose counts (not effective) invented a
  PPSV23 on a card whose branch guard forbids one; and `vite-node proseDiff.mjs` exited 0
  having written nothing. Each looked like a result. Check the shape before trusting a number.
- **A phrase-match assertion is a proxy, and proxies expire.** `finding-c` demanded the words
  "no additional" or "no vaccines" beside "no dose now". The real rule is "must not instruct a
  dose", and the correct new citation defers instead of negating. Widening it to the real rule
  made it stronger, not weaker.
