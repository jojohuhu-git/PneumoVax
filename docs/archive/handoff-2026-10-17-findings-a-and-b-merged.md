# PneumoVax — Handoff after Findings A and B shipped (2026-10-17, late)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`
("PneumoVax dev server") — ⚠ its reported port is wrong every time; read the real one from
`preview_logs` (it said 61937 this session and was **5178**, on path `/PneumoVax/`).

Branch: **`main`**, at `070f333`, working tree clean. **1,083 passing in 95 files**, green,
verified on `main` after the merge. Baseline at session start was 1,072 in 94.

**PR #62 merged** (squash, `070f333`). Pages deployed green and the fix was **spot-checked
on the live site**, not just locally.

## What's done

### FINDING A — merged. An IC child who already had PPSV23 waits five years, not eight weeks

An immunocompromised child or teenager with one PPSV23 on record was told **PCV20 was due
today**, on a card that simultaneously offered a 2nd PPSV23 in 2029 and said "choose ONE
option". Now both options come due together, five years after the first PPSV23.

Measured from the committed corpus before and after — **543** of 16,008 patients reach the
card and all 543 move: **225** go from "due today" to waiting (the clinical change), **228**
were correctly due and stay due (the control that proves the split falls on the five-year
line), **90** were waiting and now wait longer. **0** of 17,652 impossible-entry rows move.

⚠ An earlier note said 219. That script took the first PPSV23 from what was **typed**; the
engine anchors on `ppsv.effective` — the first dose it **accepts**. Take movement counts
from the corpus diff, never from a script over `c.input`.

**Owner decision 2026-10-17: CDC governs.** The decisive argument was not the publication
dates — it is that **immunize.org P2016 contradicts its own Table 4**. Its IC row Option B
says "at least 5 years later"; a child following that Option B *becomes* this patient; its
footnote ‖ then offers the same child PCV20 at 8 weeks. Full argument, both quotes and the
owner decision: `CLINICAL_SPEC.md` **§D-note**.

- Four engine branches, one helper: `icPostPpsv23DueState()` in `recommend.js`.
- The gate is the **later** of (5y from first PPSV23) and (8wk from last pneumococcal dose).
- New citation `pedsIcPpsvWaitFiveYears`. P2016 came **off** these cards (owner: a source
  stays only if it adds something).
- Test: `regression-2026-10-17-finding-a-ic-ppsv23-five-year-wait.test.js` (11 tests; 4
  fail on pre-fix code, confirmed).
- **Unchanged on purpose**: a child who never had a conjugate vaccine still gets 8 weeks —
  CDC says give it "regardless of whether the child has previously received PPSV23 or
  PCV7". A test pins that so the five-year rule cannot creep onto it.

**New standing rule in `CLAUDE.md`**: where a current CDC page and an older immunize.org
handout disagree and AAP is silent, **CDC governs** — and check the older document against
itself first.

### FINDING B — merged. All 25 cited quotes re-read; one "inference" was quoted all along

Owner decided the citation audit must also re-read the sources the app already **cites**
(its selection tool lists only sources a card names but never quotes, so a quoted document
could never enter scope). **All 25 stored quotes across 5 documents checked live: 25/25
verbatim accurate, zero mis-citations.** Method and per-document table:
`docs/archive/c7-2026-10-17-source-readings.md`, section "FINDING B closed".

It caught an error in Finding A's own first commit: branch 4 shipped with a comment calling
its five years an inference. CDC's child notes state it outright, in the IC list — *"…at
least 8 weeks after the most recent PCV13 dose **and** at least 5 years after dose 1
PPSV23"* — conjoining exactly what `icPostPpsv23DueState()` computes. Corrected in place,
cited as `pedsIcPcv13AndPpsvAt6`, and guarded by a test that was proven by deliberately
swapping the citation (1 of 11 fails).

⚠ **Both CDC schedule-notes pages are accordions, shut by default.** A plain fetch of the
child notes returns **8,409** characters of table of contents and not one word of the
pneumococcal rulebook; expanded it is **62,265**. A check that does not expand them
verifies nothing and reports success.

### Also merged
Documentation drift, both re-counted from the committed files: `CLAUDE.md` said the corpora
hold 16,250 and 18,460 rows. They hold **16,008** and **17,652**.

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
reading log `docs/archive/c7-2026-10-17-source-readings.md`.

| Item | Scope |
|---|---|
| **PR #61** | Last session's handoff. **Refused by the merge guard** — "Required status check `test` is expected"; the branch is 1 commit behind `main` and CI never ran on its head. It is also now **largely superseded by this file**. Owner call: rebase to trigger CI and merge, or close it. |
| **Patient-population field** | FINDING B's open half, **not started, deliberately**. 6 of the 25 quotes are accurate but **ambiguous** — they appear more than once on their own page, once in each half of a split the app's logic turns on: `pedsRiskPcv20Complete` (3×), `pedsRiskPcv13At6` (2×), `pedsRiskIncompleteCatchup` (2×) across CDC's child IC/non-IC lists; `adultPcv15ThenPpsv`, `adultPcv13Only`, `adultPcv7Only` (2× each) across the adult notes' Routine-50+/Special-situations-19–49 blocks. `rulebook` is child/adult/any and **cannot** see either split. Sharpest: `pedsRiskPcv13At6`'s IC instance continues "If PPSV23 is used … at least 5 years after dose 1 PPSV23" — the stored quote is the shared prefix with the IC tail cut off. |
| **Doc 4 statement 1** | **1,494 cards**, the largest block in C7. Open owner decision, three readings written out in the C7 log. **She was shown this twice and asked that it not be pushed again. Do not re-ask unprompted.** |
| **C2/C3** | Branch `feature/2026-10-17-c2-c3-numbered-sources`, held and unpushed, **rebased before Finding A landed — re-check it against `070f333`**. C8 depends on it. Backup at `backup/2026-10-17-c2-c3-pre-rebase`. |
| **C8** | Apply all six documents' dispositions. Needs per-card sources; reuse `ROUTINE_ADULT_MIN_M`, never a second age test. |
| **G1, G4, G5** | G1 can only pass once C8 is done. |
| **p2016 label** | `refs.js` says "(Tables 1–4)"; the live 2/16/2024 PDF has **five**. Label only — do **not** re-add Table 5's schedule (transplant is a hard stop). |
| **Dead `advisory` flag** | Owner approved removing it as its own change. Not started. |
| **Interval-prose guard blind spot** | The guard only inspects lines where the key starts the line, so four `doseLabel:` lines hand-type "≥8 weeks" and slip past. (It DID catch four hand-typed "5 years" strings in `detail:` this session — the blind spot is real but narrow.) |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. Wording question, not a citation one. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

Still recorded and unfixed from document 3: 110 cards state a 5-dose infant series p2016
never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before 12
months". Citation accuracy, not wrong advice.

## Why this is a good stopping point

Both findings are merged, green, deployed and live-verified, and the second one corrected
the first rather than leaving the error standing. The one open half of Finding B is written
down with its **measured** scope (6 of 25) instead of half-built — which is the opposite of
the failure mode that produced the transplant hard stop. Nothing is in a partial state a
clinician could see.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. Run `npm test` — confirm **1,083 passing in 95 files** before any new work.
3. `preview_start` the dev server; **read the real port from `preview_logs`**.
4. **Ask the owner, do not default:** what to do with PR #61; whether the
   patient-population field is the next item. Do **not** re-raise doc 4 statement 1.
5. Per-item workflow: reproduce → failing test (confirm it fails pre-fix) → fix → full
   suite green → **drive the running app** → commit named by the item ID.
6. Push/merge: branch → PR → `gh pr merge --squash`; then confirm the Pages deploy
   (`gh run list --limit 3`) and spot-check the live site.

## What this session learned

- **The owner's reading of a source beat the tool's.** Her question about P2016's scope is
  what surfaced that the sheet contradicts itself — a stronger argument than any date
  comparison, and not something the citation tooling could ever have produced.
- **Count occurrences, don't just check found/not-found.** Every one of the 25 quotes is
  verbatim; counting is the only thing that revealed 6 of them cannot say which patient
  they describe.
- **Re-reading a source you already cite finds things.** Finding B's first result was an
  error in Finding A, shipped the same day, in the same PR.
