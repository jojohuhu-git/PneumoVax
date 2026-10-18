> **SUPERSEDED 2026-10-18** by [`handoff-2026-10-18-p2016-column-fit-and-four-rulings.md`](handoff-2026-10-18-p2016-column-fit-and-four-rulings.md).
> PR #69 was merged, so `main` is at `a7dc1e3` and the branch in this file is gone.
> The STRUCTURAL QUESTION listed here as blocking ~25 CITEs is **ANSWERED** (owner rule:
> every p2016 column must fit), and the "112 residue" open decision is **settled** by the
> owner's PCV13/PCV15 interchangeability ruling. Four further findings (H, I, J and the
> unknown-product group) were discovered after this file was written and are not in it.
> The uncredited count of 43 still holds; re-measure rather than trusting it. Follow the
> newer file.

# PneumoVax — Handoff after FINDING G and FINDING 2 (2026-10-18)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.

The app's promise this session kept testing: a card must name the patient it is about, and
quote only documents that speak for it. Two findings this session are both that fault.

⚠ The dev server's port was **5173** this time and `preview_start` reported it correctly —
but it has been wrong before, so still read it from `preview_logs`.
⚠ `scripts/proseDiff.mjs` needs plain **`node`**; `scripts/uncreditedSources.mjs` needs
**`vite-node`**. No `timeout` command on this machine.

Branch: **`feature/2026-10-18-c8-doc3-p2016`**, off `origin/main` (`7c0559a`), pushed and in
sync, working tree **clean** at `048827a`, 2 commits ahead.
Suite **1,256 passing in 108 files**, all green, no skips (baseline was 1,248 in 107).

**PR [#69](https://github.com/jojohuhu-git/PneumoVax/pull/69) is OPEN, `test` green on the
current head commit `048827a`, `mergeStateStatus` CLEAN** (read from `gh`, not assumed).
This session could not merge it — the auto-mode classifier refuses `gh pr merge`.

PR #68 from the previous session **was already merged** before this session started; its
handoff reached `main` intact. `feature/2026-10-18-c8-doc1-last-45` can be deleted.

## What's done

### 1 · FINDING G (`a8f4ea4`) — TWO OWNER DECISIONS, a new finding
368 cards described a vaccine history the child did not have. A 6-year-old with a cochlear
implant whose only dose was a **PCV15 at age 4** read *"…child 6–18 years with **PCV13 only
(at/after age 6)**"*. The dose was right; the sentence was about a different child.

The owner gave the governing p2016 Table 4 row for two patients, and those rulings settle
that **a single conjugate dose before age 6 counts as "Completed PCV series before age 6
years"**, and that the row's band really is "2 through 18 years" — **the 24–71 month rows
are not a ceiling**.

Root cause: the engine branched on the dose **count** under a comment saying it could not
see dose ages. It can — `pcv.band` has held them for months. Three edits in `recommend.js`.

| | before | after |
|---|---|---|
| cards saying "PCV13 only (at/after age 6)" | 448 | 224 |
| …history really is that | 112 | 112 |
| …history is something else | **336** | **112** |

Verdicts moved: **32 of 17,016 real, 40 of 18,264 impossible**; 72 corpus lines, 0 added, 0
removed — all one history (age 24 mo, three PCV13 at 16/18/20 mo). Prose moved 536 of
35,280 lines, classified line by line, nothing unexpected.

### 2 · FINDING 2 (`048827a`) — OWNER DECISION
"5 doses in total" was credited to p2016, whose Table 1 tops out at **4**. Owner: cite MMWR
2022 Table 2. The card now shows its arithmetic — *"the 4 already on record, and the booster
still owed at age 12–15 months [1]"* — so the `[c]` sits on the clause a document supports.
**No verdict moved**; prose moved 594 of 35,280 lines.

⚠ `mmwr7137a3` **described the wrong document** — `rulebook: 'adult'`, "among adults". It is
a **children's** report. Invisible because it was an orphan nothing cited. Corrected, and
split into a whole-page entry plus the quoted `pedsInfantLastDose1215mo`.

### 3 · In the same commit, from reading rather than from comments
- **p2016 has FIVE tables**, not four. The 2026-09-13 comment claiming otherwise was dated
  *later* than the document's own 2/16/2024 item date — same shape as FINDING F.
  `refs.test.js` had asserted the **false** fact; it now asserts the true one, plus a new
  assertion that no refs entry cites a post-transplant schedule. **The transplant hard stop
  is untouched** — naming a table in a label is not citing its schedule.
- `regression-p6-3`'s unquoted-ref test named `mmwr7137a3` outright and broke when that
  entry gained a quote. It now **chooses** an unquoted ref and checks all 13.

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`.

| Item | Scope |
|---|---|
| **THE STRUCTURAL QUESTION — asks first, blocks ~25 CITEs** | p2016 is almost entirely tables. Nearly every CITE it earns is a **cell read with its row label** (for the healthy 5–18-year-old, all p2016 says is "No additional doses"). Unlike doc 2's job-aid cells — two text runs at two x positions — p2016's are one run per cell under an explicit row label. The owner's two rulings **quoted p2016 table rows and their Option A/B cells as governing text**, which reads as a yes; she was told that reading and did not correct it, but **she never answered the question directly**. Confirm before applying 25 CITEs. |
| **The 112 residue — OPEN OWNER DECISION** | After FINDING G, 112 cards are age-correct and **product-wrong**: the dose at/after age 6 was PCV15 (64), unknown (32), or PCV15 + a rejected same-day PCV20 (16). p2016 rows 8/9 say "PCV13 only", so the document has no row for them. Pinned by a test so it cannot drift. **Nothing was reworded** — ask. |
| **C8 doc 3 — p2016's remaining CITEs** | 33 statements, 8,235 cards. Blocked on the structural question above. |
| **C8 — Catch-up Job Aid** | 2 statements, 1,728 cards. Statement 1 (1,584 cards) is the open decision **she asked not to be re-raised — do not re-ask**. Statement 2 (144) is a clean CITE. |
| **C8 — CDC Child/Adolescent Notes** | 7 statements, 1,115 cards. **Two of them are new this session**: moving the number onto MMWR left CDC's notes a grey chip with no number on the 220 five-dose cards. Honest consequence, small, and the next CITE pass should close it. |
| **C8 — CDC Adult Notes** | 1 statement, 25 cards. |
| **Grid gap, recorded not fixed** | `buildCases()` **cannot express p2016 row 2's patient**: of 440 at-risk 24–71-month cases with ≥3 counting doses, **zero** have all three before 12 months, because the grid's histories are fixed day-offsets from today. Reverting the row-2 wording alone is invisible to the sweep. Adding that history would change both corpora and needs the owner. |
| **CLAUDE.md corpus sizes are stale** | It says 16,008 and 17,652; measured today they are **17,016 and 18,264**. Not corrected this session — it is the owner's rulebook and the drift is worth her seeing. |
| **Doc 3's remaining recorded defect** | Finding 3 is **DONE** (fixed in FINDING G). Finding 1 and Finding 4 were fixed on 2026-10-17. |
| **Dead `advisory` flag** | Owner approved removing it as its own change; needs a field-level corpus diff to show 0 real verdict moves. |
| **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. |
| **Job aid footnote §, unread** | p.1 carries PPSV23 minimum intervals after PCV13. Nothing rests on it. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

**Uncredited (source, statement) pairs: 43** (was 42). It went **up by one** — FINDING 2
moved the raised number onto MMWR and left CDC's notes uncredited on 220 cards. Measure with
`npx vite-node scripts/uncreditedSources.mjs`; never quote a count from a log.

## Why this is a good stopping point

Both findings are implemented, tested, measured, mutation-proved and live-verified, and each
is complete as a unit. Every remaining citation item is independent of the others. Nothing is
half-applied, and the two things that need the owner are stated as questions rather than
guessed at.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-18-c8-doc3-p2016`
2. **Merge PR #69** if still open, then confirm the Pages deploy and spot-check live.
3. Run `npm test` — confirm **1,256 passing in 108 files**, no skips, before any new work.
4. `preview_start`; confirm the server serves THIS tree.
5. **Ask, do not default — and ask with PATIENTS.** The owner's instruction stands:
   *"If you need other citation decisions, I need the age, risk factors and vaccine history
   to find them for you."* This session's two decisions came back **immediately** when put
   as patients, after four were bounced as statements. Pull examples out of the engine.
   The two open questions are the structural one and the 112 residue. Do **not** re-raise
   the Catch-up Job Aid's statement 1.
6. Per-item workflow: reproduce → failing test (**say the pre-fix failure count and check it
   is the number you expected, not merely non-zero**) → fix → full suite green → **break the
   fix and quote the counts** → **`node scripts/proseDiff.mjs` and classify every changed
   line** → **drive the running app** → commit named by the item ID.
7. Push/merge: branch → PR → squash merge; then confirm the deploy.

## What this session learned

- **A sentence can be false while every number is right.** 368 cards named a history the
  child did not have, with the correct dose on them, through 16,008 + 17,652 green corpus
  lines. 464 of the 536 changed prose lines moved **no verdict at all**. The only instrument
  that sees this class is `proseDiff.mjs`, and only if you classify the diff rather than
  count it.
- **The engine had already named this bug twice in its own comments and never swept for it.**
  `recommend.js` says the rows-8/9 label "would be a true sentence about somebody else", and
  the 2026-10-17 IC fix rescued one group from that very row. A comment is not a guard.
- **A stale comment is worse than no comment.** "We can't see exact ages of historical doses"
  was false when written or soon after, and it is the whole reason the engine branched on a
  dose count. Check the claim, not just the code under it.
- **A test can enshrine a false fact as firmly as a true one.** `refs.test.js` asserted
  p2016 had no Table 5. The document always had five.
- **A sweep over a grid with a hole in it is not a guard for what falls in the hole.**
  Reverting the row-2 wording alone passes every grid-based assertion and is caught only by a
  hand-built control patient.
- **Check what a needle actually matches.** The first version of part B matched "fewer than
  3 PCV doses", failing on 976 perfectly correct cards.
