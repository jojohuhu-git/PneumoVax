# PneumoVax — Handoff after four owner decisions (2026-10-18)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.

⚠ **The dev server's reported port is wrong every time** — read the real one from
`preview_logs`, or scan `curl -s -o /dev/null -w "%{http_code}" http://localhost:51xx/PneumoVax/`.
This session's was **5178**. If `preview_start` refuses with "Maximum 5 dev servers per
folder", other chats hold them; one of those is almost certainly already serving this tree
— confirm by fetching `/PneumoVax/src/logic/recommend.js` and grepping for a string you
just wrote.
⚠ `scripts/proseDiff.mjs` needs plain **`node`**; `scripts/uncreditedSources.mjs` needs
**`vite-node`**. There is no `timeout` command on this machine.

Branch: **`feature/2026-10-18-c8-doc1-last-45`**, off `origin/main`, pushed and in sync,
working tree **clean** at `fde2402`, 4 commits ahead.
Suite **1,248 passing in 107 files**, all green, no skips (baseline was 1,221 in 104).
Both verdict corpora green and **unmodified on disk** — no patient's answer moved this session.

**PR [#68](https://github.com/jojohuhu-git/PneumoVax/pull/68) is OPEN, `test` green, `mergeStateStatus` CLEAN** (read from `gh`, not assumed).
This session could not merge it — the auto-mode classifier refuses `gh pr merge`.

⚠ **PR #67 merged mid-session**, after the first commit had been written onto its branch.
That commit was moved here. `feature/2026-10-17-c8-per-card-sources` still carries an orphan
copy and **can be deleted**.

## What's done

### 1 · C8 doc 1, the last 45 cards (`42b5d52`) — OWNER DECISION
19–49, chronic condition only, PCV13 + **two** PPSV23. ACIP's chronic block has one row for
that history ("PCV13 and 1 dose of PPSV23"); the owner ruled it speaks for the two-dose
patient too, because the chronic block never *offers* a second PPSV23 and so has no rival
disposition. `mmwrBothPcv13PpsvKey()`'s chronic branch is now unconditional; **the IC branch
still splits on `ppsv.count` and must keep splitting.** 45 of 35,280 prose lines differ,
marker + quote only.

### 2 · FINDING F (`9f16650`) — a correction nobody asked for
**The 2026-10-17 reading of mm7401a1 never read its clinical guidance table.** Six removals
were approved on the stated ground that the document "states none of these"; five of the six
are in that table in full sentences. The owner restored the two whose **row heading is the
patient's exact history** — PPSV23-only (1,154) and shared-decision ≥65 (440) — and left the
238 PCV15-pending cards removed (*"use job aid since PCV15 isn't listed in the MMWR table"*).
Full evidence: `docs/archive/c7-2026-10-17-source-readings.md` §FINDING F.

### 3 · C8 doc 2, the 3 cell-only statements (`2604527`) — OWNER DECISION
*"use MMWR table"*. The job aid states those three only as table **cells** (two text runs at
two x positions), so it comes off those 3,189 cards and mm7401a1's sentences are cited.
New: `mmwrPcv13OnlyThenPcv` / `mmwrPcv13OnlyThenPcv1949Ic` — the same row one word apart.

### 4 · The IC two-dose card's emphasis (`fde2402`) — OWNER DECISION
*"use MMWR"*. 45 cards now lead with "Review the pneumococcal recommendations again at age
50" and offer the dose as the alternative, matching ACIP's two-dose row. **The dose did not
change** — same products, five years, status and due date — and the one-dose card is
untouched. `doseLabel` changed with the note, so header and body agree.

### Where the citation work stands
**Two of six documents are FINISHED** — mm7401a1 and the CDC Adult Timing Job Aid both carry
**zero** uncredited (statement, card) pairs. Total across all documents **46 → 42**.
Measure with `npx vite-node scripts/uncreditedSources.mjs` — never quote a count from a log.

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings and dispositions: `docs/archive/c7-2026-10-17-source-readings.md`.

| Item | Scope |
|---|---|
| **Re-check docs 3, 5, 6 against FINDING F first** | Before proposing any removal, **read the whole document, tables included**. The 2026-10-17 readings are the same vintage that missed mm7401a1's table. p2016 is a PDF with five tables. |
| **C8 doc 3 — p2016** | 34 statements, 8,214 cards. Removals proposed, **not shown to the owner**. One document at a time, with quote and count. **Bring it as PATIENTS** — see Resuming §3. |
| **C8 doc 5 — Catch-up Job Aid** | 2 statements, 1,728 cards. Same. |
| **C8 doc 6 — CDC Adult Notes** | 1 statement, 25 cards (19–49 IC, PCV15 given, PPSV23 pending). Same. |
| **Doc 4 statement 1** | 1,494 cards. Open owner decision. **She asked that it not be raised again. Do not re-ask unprompted.** |
| **G1** | "a card has a grey button no raised number points at". Two documents down; p2016's 8,214 is now the bulk of what remains. |
| **p2016 label** | `refs.js` says "(Tables 1–4)", `refs.test.js` asserts it; the live 2/16/2024 PDF has **five**. Label only — do NOT re-add Table 5 (transplant is a hard stop). |
| **Doc 3's two recorded defects** | 110 cards state a 5-dose infant series p2016 never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before 12 months". |
| **Dead `advisory` flag** | Owner approved removing it as its own change. Verified dead. Needs a field-level corpus diff to show 0 real verdict moves. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. Wording question. |
| **Job aid footnote §, unread** | p.1 carries PPSV23 **minimum intervals** after PCV13. Nothing rests on it, but CLAUDE.md's "every adult floor is an OWNER determination, never cite ACIP/CDC" makes a deliberate read worthwhile. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

## Why this is a good stopping point

All four decisions the owner made today are implemented, tested, measured and live-verified,
and two documents are complete as units. The remaining documents are independent of each
other and each starts with a reading, not a build. Nothing is half-applied.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-18-c8-doc1-last-45`
2. **Merge PR #68** if still open, then confirm the Pages deploy and spot-check live.
3. Run `npm test` — confirm **1,248 passing in 107 files**, no skips, before any new work.
4. `preview_start`; read the real port from `preview_logs`; confirm the server serves THIS tree.
5. **Ask, do not default — and ask with PATIENTS.** The owner's instruction, 2026-10-18:
   *"If you need other citation decisions, I need the age, risk factors and vaccine history
   to find them for you."* A decision framed as a statement or a card count will be bounced.
   Pull real examples out of the engine rather than inventing them. Do **not** re-raise doc 4
   statement 1.
6. Per-item workflow: reproduce → failing test (say by how many it fails pre-fix) → fix →
   full suite green → **break the fix and quote the counts** → **prove no advice moved with
   `node scripts/proseDiff.mjs`** → **drive the running app** → commit named by the item ID.
7. Push/merge: branch → PR → squash merge; then confirm the deploy.

## What this session learned

- **A reading that misses a table is indistinguishable from a reading that found nothing.**
  FINDING F cost 1,594 cards a source they were entitled to, and the removals were approved
  by the owner on that false premise. `scripts/uncreditedSources.mjs` cannot catch it: it
  only sees a document that is ON a card, so one wrongly removed is invisible to it. The
  mirror guard — assert the document is PRESENT where it speaks — is
  `regression-c8-2026-10-18-mmwr-table-rows-restored.test.js`.
- **An assertion that can never fail reads as coverage.** A new test's `JOB_AID` constant was
  the document's `label`, but a card exposes `short`; `not.toContain(JOB_AID)` therefore
  passed on every card in the app, and three of five "failing" tests were passing vacuously.
  Same hazard as `not.toContain('deletedName')` in the stale-identifier guard. Always check
  the pre-fix failure count is the number you expected, not merely non-zero.
- **A guard that selects by a copy string will misfire when the copy spreads.** FINDING C
  matched "review at age 50" in a dose label; a second, unrelated card acquired that phrase
  and the guard fired on the opposite of its own hazard. It was narrowed to what the card IS
  (offers no product) and given an anti-vacuity count.
- **The owner answers better when the question names a patient.** Four decisions were
  bounced when framed as statements and card counts, and answered immediately when re-put as
  age + risk factors + vaccine history.
