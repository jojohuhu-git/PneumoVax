> **SUPERSEDED 2026-10-17 (late night) by
> [`handoff-2026-10-17-c8-doc2-cites.md`](handoff-2026-10-17-c8-doc2-cites.md).**
> Document 2's 12 CITEs — the item this file names as "the next thing to do" — are done and
> pushed to PR #67 (which is still open). The count was **14** statements, not 12, and **11**
> are now cited: 6,805 uncredited pairs fell to **3,189**. The remaining 3 rest only on table
> cells and are an OPEN OWNER DECISION. Resume from the newer file.

# PneumoVax — Handoff after C2/C3 shipped and C8's first two documents (2026-10-17, night)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`
("PneumoVax dev server") — it reported port 56931 and **actually served 5176**; read the real
port from `preview_logs`, never from the tool's own report.

Branch: **`feature/2026-10-17-c8-per-card-sources`**, rebased onto `main` at `cb7726e`
(i.e. **after** PR #66 merged), pushed, 5 commits, working tree clean at `9a705ba`'s rebased
tip. Suite **1,178 passing in 102 files**, all green, no skips.

**PR [#67](https://github.com/jojohuhu-git/PneumoVax/pull/67) is open and awaiting the owner's merge.** This session could not merge it
(the auto-mode classifier refuses `gh pr merge` — permission mode, not the repo).

**Merged during this session: PR [#66](https://github.com/jojohuhu-git/PneumoVax/pull/66)** — C2/C3, the numbered source buttons.

## What's done

### C2/C3 — re-checked, PR'd, merged (#66)

The handoff before this one said to re-check the held branch against `main` "before anything
else", because it predated several merges into `refs.js`. Done:

- **Rebase onto `main`: clean.** Only `refs.js` overlapped; `RecCard.jsx` and `citations.jsx`
  were untouched by the five intervening merges.
- **Its four quoted counts were taken nine minutes before PR #65 merged**, so they were
  re-run against a plain `main` checkout. **All four unchanged** — 44,461 buttons, 26,651
  unpointed, 1,380 cards citing a document with no button (1,188 PCV7 + 192 risk page). #65
  changed *which* source four cards quote, not any card's source list. Commit `db4f1a5`
  records that.
- **Live-verified**: a 3-year-old with a recorded PCV7 dose reads "Per ACIP/immunize.org`[1]`"
  with button `[1]` now *immunize.org PCV7 rule* — **the 1,188-card case**, where that number
  previously had nothing to click.

### C8, document 2 — the two OWNER DECISIONS of 2026-10-17 (`56e6467`, `991f526`)

The root cause of *"I forget why there are multiple source chips listed if its only citing one
of them"*: one `collectRefs(...)` call was computed per pathway and spread onto all ten adult
cards. **The adult pathway now asks per card** (`ADULT_DEFAULT_REFS` + `adultRefs()` /
`adultRefsExcept()`), which is the structural fix and is what documents 3/5/6 will reuse —
**they need no further plumbing, only the owner's sign-off**.

- **Decision 1**: job aid off "Routine pneumococcal vaccination begins at age 50" — **180
  cards** (the C7 log says 171; it predates the IC-children fix).
- **Decision 2**: the two "the series is complete" statements keep it at 50+ (**2,589**) and
  lose it at 19–49 (**935**), because page 1 answers (D) "schedule is complete" while pp.2–4
  answer (E) "review again at 50" for the same history.
- Boundary is `ROUTINE_ADULT_MIN_M` via the engine's existing `isOlderAdult`.
- **15 tests; 9 passing / 6 failing before the fix.**

⚠ **One escape, found by mutating and now closed.** Replacing `isOlderAdult` with a
hand-typed `am >= 600` left **all 1,177 tests green** — behaviourally identical, so no
behavioural test can see it, and it is the second age test `CLAUDE.md` forbids twice.
`regression-s6-1`'s source guard existed for exactly this but scanned only the `M` table.
**Widened to the whole engine; the same mutation now fails 1.**

### C8, document 1 — OWNER DECISION 2026-10-17, *"Approve all six removals."* (`9a705ba`)

mm7401a1 off **5,331 cards** across six statements, each for a stated reason (the two
"complete" sentences are the Adult Notes'; the ≥1-year and 8-week intervals are the job
aid's, confirmed cell by cell; the shared-decision path is never discussed in the paper). It
**keeps 2,544** — the ≥50 expansion and PCV13-experienced rows. 5,331 + 2,544 = 7,875, all
thirteen statements accounted for. **17 tests; 10 passing / 7 failing before the fix.**

⚠ **It collided with a pre-existing test and the collision was real.** S15 asserted mm7401a1
on *every* adult card, using the PCV15-only fixture — one of the six removals. S15 exists
because a 19–49 card once linked the superseded **rr7203a1 (2023)** and not mm7401a1.
**Checked before narrowing anything:** rr7203a1 reaches **0 of 17,334 cards both before and
after**, and the card is left holding the Adult Notes and the job aid — the document that
prints its interval. Narrowed to the hazard S15 names, asserted in both directions, split
into two tests. S15's comment claiming rr7203a1 was "still reachable" was stale and is
corrected.

### The measuring tool had been broken on `main` since PR #58 (`089507a`)

`scripts/uncreditedSources.mjs` — the tool **every** count in the C7 log, the citation plan
and the owner's own decisions came from — stopped with `TypeError: noteCiteSlices is not a
function` on `main` for four merges. It needed two exports that existed only on the unmerged
C2/C3 branch. Nothing in the suite could tell "cannot run" from "nobody ran it lately". It
now has a gate built like P2-13's. (#66 has since merged, so it runs for real; the skip is
gone.)

### Measured effect of both documents together

| | before | now |
|---|---|---|
| grey source buttons printed | 45,841 | **39,395** |
| buttons no raised number points at | 26,651 | **20,205** |
| cards carrying ≥1 such button | 16,878 | **15,943** |
| cards citing a document with **no** button | 0 | **0** |
| the job aid's uncredited buttons | 7,920 | 6,805 |
| mm7401a1's uncredited buttons | 7,875 | 2,544 |

**No advice moved.** Not one word of card prose changes, and both verdict corpora are
untouched — which is also why neither could ever have caught this: they record status, brands
and dates, never which document a card credits.

**Mutation counts, all against 1,178 passing**, each applied and restored from a scratchpad
copy, never `git checkout`: job aid back on routine-at-50 **5**; both documents back on the
two "complete" cards **10**; mm7401a1 alone back on them **4**; flip the boundary **9**;
over-apply to every adult age **6**; mm7401a1 back on the three interval/shared cards **5**;
remove the *wrong* document (Adult Notes instead of the MMWR) **7**; hand-type the age
**1** (was 0).

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings and dispositions `docs/archive/c7-2026-10-17-source-readings.md`.

| Item | Scope |
|---|---|
| **C8 — document 2's 12 CITEs** | **Needs no owner decision; this is the next thing to do.** Each of the 12 statements needs its `[c]` marker pointed at the job aid's own sentence, with the quote and a `population` field. All nine quotes (A)–(I) are recorded verbatim in the C7 log. **It will add new raised numbers to thousands of cards, so show her before it lands.** Target: the job aid's 6,805 uncredited cards. |
| **C8 — documents 3, 5, 6** | Removals proposed, **not shown to the owner**. Her C7 cadence is one document at a time, with the quote and the count. Doc 3 = p2016 (34 statements, 8,214 cards), doc 5 = child schedule, doc 6 = adult notes (25 cards, 1 statement). |
| **Doc 4 statement 1** | **1,494 cards. Open owner decision. She was shown it twice and asked that it not be pushed again. Do not re-ask unprompted.** |
| **G1** | The last gate — "a card has a grey button no raised number points at". Can only pass once the CITEs exist. **G2/G3 shipped with #66; G4/G5 shipped with #65** (the handoff before this one listed G4/G5 as open; they are not). |
| **p2016 label** | `refs.js:683` says "(Tables 1–4)" and `refs.test.js:14` asserts "the live document has only Tables 1-4" — the live 2/16/2024 PDF has **five**. The app asserts a false fact about a source. Label only; do **not** re-add Table 5's schedule (transplant is a hard stop). |
| **Document 3's two recorded defects** | 110 cards state a 5-dose infant series p2016 never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before 12 months". Citation accuracy, not wrong advice. |
| **Dead `advisory` flag** | Owner approved removing it as its own change. **Verified dead this session**: nothing in `src/` sets `advisory: true`, so the "Advisory" pill is unreachable. (The PCV21 geographic note is a separate mechanism and stays.) Needs a field-level corpus diff to show 0 real verdict moves. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. Wording question, not a citation one. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

## Why this is a good stopping point

The citation mechanism is finished as a unit and proved: the buttons are numbered (#66), the
numbering and the engine's source list agree, and the two documents whose removals the owner
has signed off are applied with their counts re-measured rather than quoted. Nothing is
half-applied *silently* — document 2's unwritten CITEs are stated as unwritten in three
places. Everything remaining either needs the owner, or is independent of all of it.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. **Merge PR #67** if it is still open, then confirm the Pages deploy and spot-check live.
3. Run `npm test` — confirm **1,178 passing in 102 files**, no skips. (If
   `uncredited-sources-smoke` skips, an export was deleted — that is the point of it.)
4. `preview_start` the dev server; read the real port from `preview_logs`.
5. **Ask, do not default**, on which item is next. Do **not** re-raise doc 4 statement 1.
   Document 2's 12 CITEs are the one item needing no decision from her.
6. Per-item workflow: reproduce → failing test (confirm it fails pre-fix, and say by how
   many) → fix → full suite green → **break the fix and quote the counts** → **drive the
   running app** → commit named by the item ID.
7. Push/merge: branch → PR → squash merge; then confirm the deploy.

## What this session learned

- **Re-measure before quoting, even your own numbers from an hour ago.** Four of the eight
  mutation counts in this branch moved when it was rebased onto the merged `main`, because
  documents 1 and 2 share one expression and each other's tests then catch more. Every
  figure in the code and docs is now the merged-tree figure.
- **A tool can be broken for four merges without anyone noticing**, if nothing imports it.
  The one that was broken is the one every count in this whole effort came from.
- **When a removal breaks an old test, find out what the old test was protecting first.**
  S15's assertion was a proxy; its real hazard was the superseded paper being left alone, and
  that had to be measured (0 of 17,334, before and after) before the assertion could be
  narrowed rather than relaxed.
- **My own heading contradicted my own measurement once**, saying document 2 was "APPLIED"
  when only its two decisions were. Fixed in `bc77f03` and in a PR comment.
