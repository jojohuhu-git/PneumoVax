# PneumoVax — Handoff after C7's reading finished, and a PCV20 timing finding (2026-10-17, evening)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`
("PneumoVax dev server") — ⚠ its reported port is wrong every time; read the real one from
`preview_logs` (it was **5177** this session while `preview_start` said 58408).

Branch: **`main`**, at `9b1bc1d`, working tree clean. **1,072 passing in 94 files**, green,
verified on `main` after the last merge. Three PRs merged this session: #58, #59, #60.

> ⚠ **READ FINDING A FIRST.** It concerns advice now live on the public site, it was found
> by the owner pointing at a document C7 had never read, and it is **not fixed**.

## FINDING A (open, clinical) — 219 immunocompromised patients are told PCV20 is due today where CDC says wait 5 years

**Measured, not estimated:** 219 of the 16,008 grid patients. Script kept at
`scripts/`-worthy quality but currently only in the session scratchpad — **re-derive it**,
it is ten lines over `buildCases()` (match a rec whose label contains "immunocompromising"
and "PCV20" and whose lead contains "8 weeks" and which is `dueToday`, then compare the
first PPSV23 date + 60 calendar months against today).

| | |
|---|---|
| Who | Immunocompromised children/adolescents — **asplenia or HIV** only; `cochlear_implant` appears solely alongside asplenia, so the IC classification itself is **correct**, checked. |
| Ages affected | 60, 72, 216 and 227 months (5y, 6y, 18y, 18y11m). |
| What the app says | "1 dose PCV20 (immunocompromising)" — `Give 1 dose of PCV20 ≥8 weeks after the most recent pneumococcal vaccine — OR a 2nd PPSV23 ≥5 years after the first PPSV23`, **status due today**. |
| What CDC says | Nothing today. Wait ≥5 years from dose 1 PPSV23. |
| Control that proves it is not a blanket error | **234 other patients get the same card and are correctly due** — their first PPSV23 was ≥5 years ago. The split falls exactly on the 5-year line. |

The two sources disagree and the engine followed the one that offers the earlier dose:

- **immunize.org p2016 footnote ‖** — "options are (a) give one dose of PCV20 **at least 8
  weeks** after most recent pneumococcal vaccination, or (b) give a second dose of PPSV23
  five years after the first dose of PPSV23."
- **CDC, Summary of Risk-based Pneumococcal Vaccination Recommendations** (read live
  2026-10-17, page dated MAY 8, 2026 —
  https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html),
  6–18y, "Received PCV13 or PCV15 before age 6 years, never received PCV20" →
  Immunocompromising condition → Received 1 dose of PPSV23:
  > "Then **no pneumococcal vaccines are recommended at this time.** Wait until at least 5
  > years have passed since they received their first PPSV23 dose. Then give 1 dose of PCV20
  > or PPSV23."
- **CDC Child/Adolescent Notes**, already recorded in the C7 log as quote **(F)**:
  > "If PPSV23 is used, administer **either PCV20 or dose 2 PPSV23 at least 5 years after
  > dose 1 PPSV23.**"

So **two CDC sources put both options at 5 years; one immunize.org footnote puts option (a)
at 8 weeks.** The app's 2nd-PPSV23 date already matches CDC; only the PCV20 line does not.

**Do not just change it.** It is a clinical change on code merged today, it needs
`verify-clinical-source`, a failing test, the owner's decision, and both corpora will move.
Note also that CLAUDE.md's authority rule ranks AAP as the tiebreak against CDC but says
nothing about **CDC vs immunize.org** — that gap is itself an owner question.

## FINDING B (open, structural) — C7's six documents were chosen by a tool that cannot see cited sources

`scripts/uncreditedSources.mjs` lists sources a card **lists but never cites**. A document
that IS cited therefore never appears — which is why the risk-indications page above, which
backs **three** stored citations (`pedsSecondPpsv5y`, `pedsBefore6NoPcv20`,
`cdcRiskIndications`) and is a chip on the cards the IC fix created today, **was never in
C7's scope at all**. The owner found it by asking.

Its two stored quotes were checked live today and are **verbatim accurate** — so this is a
coverage gap, not a mis-citation. But C7 cannot be called "all sources verified" while the
selection rule is "sources nothing points at".

## What's done this session

1. **PR #58 merged** (`a47010f`) — the IC-children clinical fix. Pages deploy green;
   **verified on the live site**: a 6-year-old with asplenia, PCV15 at 3y11m, PPSV23 at
   4y11m now gets PCV20 "today" plus the 2030 alternative, where it previously said
   "complete". (That "today" is Finding A.)
2. **IC-1 needs no MeningoVax mirror** — checked, with reasons, not assumed. ACIP gives all
   four high-risk meningococcal indications the *same* 2-dose series, so there is no
   IC/non-IC dose-count split; and MeningoVax's high-risk path never reaches
   `status: 'complete'` (after 2 doses it stays `risk-based` with boosters). Recorded in
   memory.
3. **PR #59 merged** (`dd6731a`) — **C7 document 6**, CDC Adult Notes, read live. One
   statement, 25 cards, **CITE, no removals**: the card's uncited "if PPSV23 is unavailable,
   PCV20 or PCV21 may be substituted" is stated almost verbatim by CDC, about the same
   patient. Owner decided 2026-10-17 to **fold the code change into C8**, not ship alone.
4. **PR #60 merged** (`9b1bc1d`) — **C7 document 4**, the catch-up job aid. It was **never
   actually blocked**: the PDF was already in `~/Downloads/pneumococcal.pdf`. Statement 2
   (132 cards) is a **CITE** that closes a real mismatch — the card states "≥8 weeks" and
   its current quote ("1 dose PCV") contains no interval at all, while the job aid's
   24–59-month rows say "at least 8 weeks" verbatim. Statement 1 is an **open decision**
   (below).
5. **The held C2/C3 branch is rebased and green** — `feature/2026-10-17-c2-c3-numbered-sources`,
   now `main` + two commits, **1,086 passing in 95 files**, **NOT pushed**, still held.
   Rebasing turned one of its own tests red and **the app was right**: `buttonRow()` asked
   whether source numbers run 1..n across the **whole page**, which only matched the real
   rule (per card) while its fixture produced one card — the IC fix makes that same fixture
   emit two. Fixed per card, **not loosened**: with the numbering deliberately broken
   (`[{src.n + 1}]`), 3 of that file's 14 tests still fail. Backup at
   `backup/2026-10-17-c2-c3-pre-rebase`.

## What's NOT done — the remaining queue

Queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
reading log `docs/archive/c7-2026-10-17-source-readings.md` (**all 6 read**).

| Item | Scope |
|---|---|
| **FINDING A** | Above. Clinical, live, 219 patients. Highest priority. |
| **FINDING B** | Above. Decide whether C7 must also re-read the *cited* sources. |
| **Doc 4 statement 1** | **1,494 cards** — the largest block in C7. Open owner decision, three readings written out in the C7 log: (a) cite the job aid for the sentence describing its own scope, (b) remove the button as was done for document 2 statement 8, (c) also reword the clinical sentence. **The owner was shown this twice and did not choose — she asked that it not be pushed again. Wait for her.** |
| **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up; every catch-up table merely stops at age 4. Recorded, not fixed; a wording question, not a citation one. |
| **C8** | Apply all six documents' dispositions, document 6's included. Needs per-card sources — `collectRefs()` cannot vary a card's source list by age band. Reuse `ROUTINE_ADULT_MIN_M`; never add a second age test. |
| **G1, G4, G5** | G1 can only pass once C8 is done. |
| **C2/C3** | Rebased, green, held, unpushed. **C8 depends on it**, and its absence is why the measuring script dies on `main`. |
| **p2016 label** | `refs.js` says "(Tables 1–4)"; the document has five. Label only — do **not** re-add Table 5's schedule. |
| **Dead `advisory` flag** | Owner approved removing it as its own change. Not started. |
| **Interval-prose guard blind spot** | Background task `task_50100c88`: the guard only inspects lines where the key starts the line, so four `doseLabel:` lines hand-type "≥8 weeks" and slip past. |
| **C4, C5** | MeningoVax-only, untouched, independent. |

Also still recorded and unfixed from document 3: 110 cards state a 5-dose infant series
p2016 never gives; 32 describe "3 PCV doses before 24 months" where p2016 says "all before
12 months". Citation accuracy, not wrong advice.

## Why this is a good stopping point

Everything shipped is merged, green and live-verified, and the three PRs were independent of
each other. The two open findings are **written down with measured counts and live quotes**
rather than half-implemented, which is the opposite of the failure mode that produced the
transplant hard stop. Nothing is in a partial state a clinician could see.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. Run `npm test` — confirm **1,072 passing in 94 files** before any new work.
3. `preview_start` the dev server; **read the real port from `preview_logs`**.
4. **Ask the owner, do not default:**
   - **Finding A** — 219 patients, CDC vs immunize.org. Needs her clinical call, and it
     implies a CLAUDE.md authority-rule gap (CDC vs immunize.org is unranked).
   - **Finding B** — does C7 re-read the cited sources too?
   - **Doc 4 statement 1** — she declined to choose today. Do not re-ask unprompted.
5. Per-item workflow: read the source live → disposition into the C7 log → failing test →
   fix → full suite green → **drive the running app** → commit named by the item ID. For
   C7/C8 the cadence is **one document at a time**, quotes shown, then wait.
6. Push/merge: branch → PR → `gh pr merge --squash`; after merge confirm the Pages deploy
   (`gh run list --limit 3`) and spot-check the live site.

## What this session learned

- **The owner's one-line question was worth more than the whole measuring tool.** "Are you
  not using this document?" surfaced both findings above. The tool's blind spot (Finding B)
  is exactly the kind a measurement can't see about itself.
- **A rebase is a test.** Putting two green branches together broke one, and the break was
  real information: a test that had quietly been asserting a weaker thing than it claimed.
- **Check `~/Downloads` before asking for a click.** Two of the three PDFs were already
  there, and one handoff recorded a blocker that had already been cleared.
