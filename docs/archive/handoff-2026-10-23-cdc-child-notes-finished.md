# PneumoVax — Handoff after finishing CDC's Child/Adolescent Notes (2026-10-23)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`
(reported and served on 5173 this session; still read the real port from `preview_logs`).
What the app is: a client-side React SPA giving pneumococcal vaccine advice across the
lifespan. No backend; **every clinical claim on a card must be traceable to a document that
speaks for *that patient***.

Branch: **`feature/2026-10-23-c8-cdc-child-notes`**, off `main` (which now carries everything
through PR #74). Pushed; PR open — see below.
Baseline was 1,339 passing in 117 files; now **1,371 passing in 122 files**, all green, no
skips. Tree clean at `f7235de` plus the docs commit.

Consumed and superseded: `handoff-2026-10-22-finding-m-and-catchup-citations.md`.

## ⚠ FIRST: the PR situation is finally simple

`main` is up to date — the owner merged PR #74 on 2026-10-23 (`b6d6364`), which carried
FINDINGS H/I/J/K/M, the chip rename and all earlier C8 work. **PR #73 was closed, not merged**,
because every one of its commits was already inside #74; its "conflicts" were an artefact of
that squash. Nothing is lost and nothing is pending from previous sessions.

This session's branch has its own PR to `main`. `main` is protected and requires the `test`
check: branch → PR → squash merge, and **a session agent cannot merge** (the classifier blocks
`gh pr merge`), so hand the owner a green PR and stop.

## What's done (by ID)

Five commits, each with its own guard, mutation evidence, field-level prose diff and a run in
the real app.

1. **FINDING N — a 6-year-old was quoted a toddler's sentence** — `ae9dc5f`. CDC's child notes
   answer one history (series done, no PCV20, no PPSV23) **four** times: in each at-risk list,
   under "Age 2–5 years" and again under "Age 6–18 years", with different parents and different
   wording. Only the Age 2–5 pair had keys, and the block serving 24 months to 18 years cited
   them at every age. **496 cards** for children aged 6+ quoted the younger sentence. Two new
   `refs.js` entries; one age test in one place reading `M.m72`. Guard
   `regression-finding-n-2026-10-23-child-notes-age-band-row.test.js` (mutations fail 4 / 5 / 3).
2. **The "high-risk series is complete" card credits all three sources** — `7d6bebf`, 145 cards.
   **OWNER DECISION**: *"her series is complete based on the following recommendation"* with a
   deep link to CDC's Age 6–18 row — the row that ORDERED the PPSV23 she has had. p2016's
   footnote § says it outright; the IC row's footnote ǁ gives options instead, so the two risk
   classes cite different footnotes. The "Verified against CDC PneumoRecs VaxAdvisor" sentence
   was dropped from that card (a mobile app is not a governing source) — flagged as a
   judgement call in the PR body.
3. **The five-year dose is credited on both of its cards** — `858fc01`, 702 cards. The PCV20
   card and the "2nd PPSV23" alternative are one recommendation shown twice; only the first
   ever credited CDC. One shared helper builds the alternative and takes the row as an
   argument. The guard's real job: **for one patient the two cards must quote the same row**.
4. **The five-dose infant catch-up card credits the booster row** — `af856ce`, 220 cards.
   FINDING 2 had moved the citation to MMWR because no document states a total of five; CDC
   does state where the last dose goes, so the marker sits on the booster clause, conditional
   on `target > 4` so the routine card does not get a second number for the same sentence.
5. **A prior PCV20 completes the series** — `f7235de`, 40 cards. **OWNER DECISION, and it
   reverses half of FINDING K**: shown the 6-year-old with asplenia (PCV20 at 5, PPSV23 eight
   weeks later), she answered with the deep link to that whole branch, parent and sub-bullet
   together. So *"but have not received PPSV23"* describes the history that led to the dose.
   FINDING K's guard now records the exception and **pins it at 40**; its other **864** (no
   conjugate before age 6) are still barred.

Plus a docs commit: `CLAUDE.md` gains both owner decisions and FINDING N's rule;
`docs/agent/testing.md` gains a section for the five new guards.

**CDC's Child/Adolescent Notes are FINISHED** — 8 uncredited statements over 1,107 cards at
session start, **zero** now. Overall pairs **47 → 38**. Third of six documents to reach zero.

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`. **Re-measure, never quote a count
from a log or a handoff.**

| Priority | Item | Scope |
|---|---|---|
| **P1** | **C8 doc 3 — p2016's remaining CITEs** | **37** statements, 6,986 cards. The only large block left. Read it with `scripts/pdfLayout.py` (page 2 is Table 4) — and read the FOOTNOTES: § and ǁ are what settled 185 cards today, and they hang off the very column that appears to exclude the patient. |
| **P2** | **The wrong-ROW gap** | Still open in general, but **FINDING N is the first instance found in CDC's notes rather than p2016** — the same shape (a document that fits, a row that does not). Closing it generally needs the engine to record which row it used. |
| **P2** | **Grid gap, recorded not fixed** | `buildCases()` cannot express p2016 row 2's patient, any 2-dose healthy 24–59mo child, or — found today — **any at-risk child under 72 months on the "PCV complete (includes PCV20)" card with a PPSV23**. Deleting that card's age split broke no sweep; the patient is asserted directly instead. Moving the grid moves both corpora; needs the owner. |
| **P2** | **Dead `advisory` flag** | Owner approved removal as its own change; needs a field-level corpus diff to show 0 real moves. |
| **P2** | **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **P2** | **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. |
| **P2** | **Job aid footnote §, unread** | p.1 carries PPSV23 minimum intervals after PCV13. Nothing rests on it. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** the Catch-up Job Aid's 144-card statement; FINDING L (wrong
premise); the p2016/576 question (owner said NO, 2026-10-18); "add a number-has-a-chip guard"
(G2 does it). The Job Aid's **other** statement — 1,584 cards, healthy 5–18s not caught up —
is the decision the owner asked **not** to be re-raised.

## Why this is a good stopping point

One document is finished rather than partly done, which is the unit the owner's rule asks for
("cite it, or take it off that card" — every (document, statement) pair settled). Five
independent commits, each provable on its own. Both owner decisions taken this session are
recorded in `CLAUDE.md` with the patient that produced them, so the next session applies them
rather than re-deriving them. p2016 is a clean next block with no dependency on anything here.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-23-c8-cdc-child-notes`
2. Check the PR's state, and whether `main` has moved. **Do not leave the branch without a PR.**
3. `npx vitest run` — confirm **1,371 passing in 122 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable count use `--reporter=json --outputFile=…`.
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **38** pairs.
5. Start on p2016 (37 statements). **Two rules learned today, both load-bearing there:** read
   the footnotes as part of the row, and check whether a document prints the same rule in more
   than one age band before deciding which instance a card should quote.
6. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix in more than one way and
   quote the counts** → **proseDiff `dump` then `diff`, classified field by field** → **drive
   the running app, with a control** → commit named by the item ID.
7. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict. Everything else where the dose is
   unchanged is yours to decide (OWNER DECISION 2026-10-18), grouped in the PR body for audit.

## Lessons this session paid for

- **A mutation that passes is a finding.** Deleting the age split on the PCV20-complete card
  broke nothing, because the grid cannot reach that card under 72 months — the code was live
  all the same. The 4-year-old is now asserted directly.
- **An invariant can be too strong.** "No card gives CDC's notes two numbers" fails on 1,648
  CORRECT cards: two different sentences, two claims. The real rule is that no card gives the
  same SENTENCE two numbers.
- **Balance markers against cites.** One version of a card had three `[c]` and two citations;
  the renderer drops the orphan silently, so nothing on screen would have shown it. The doc-2
  balance sweep caught it.
- **`proseDiff` DOES record quotes** (via each cite's label), so a citation-only change shows
  up there — but the `diff | grep -c '^<'` shorthand reported 0 while the files differed. Load
  both dumps in python and compare key by key instead.
