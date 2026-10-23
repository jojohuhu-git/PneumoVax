> ## ⚠ SUPERSEDED — 2026-10-22
>
> **This queue has been consumed.** Continue from
> [`handoff-2026-10-22-finding-m-and-catchup-citations.md`](handoff-2026-10-22-finding-m-and-catchup-citations.md).
>
> Two things in this document are now known to be WRONG; do not act on them:
>
> 1. **The Catch-up Job Aid split of "60 / 72 / 12 cards" is wrong**, and two of the three
>    cells it names do not fit the patients it assigns them to. Counted on EFFECTIVE doses
>    (which is how the job aid's own preamble says to count) it was 48/84/12, and after
>    FINDING M it is 48/84. The owner ruled on 2026-10-22 to re-derive from the measurement.
>    Done in `67e6e56`.
> 2. **Its 12-card group was not a citation problem at all.** It was FINDING M — a healthy
>    child whose PCV series was finished in the second year of life was being asked for one
>    more dose, against all three documents on the card. Fixed in `fee6c3c`.
>
> The rest of this document — the chip rename, FINDING L's closure, the C8 Adult Notes CITE,
> the tooling notes, and the remaining queue — still stands.

# PneumoVax — Handoff after closing FINDING L and renaming a misleading chip (2026-10-22)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` (it
reports port 5173, base `/PneumoVax/` — read the real port from `preview_logs`).
What the app is: a client-side React SPA giving pneumococcal vaccine advice across the
lifespan. No backend; **every clinical claim on a card must be traceable to a document that
speaks for *that patient***.

Branch: **`feature/2026-10-22-finding-l-closed-and-chip-names`**, off
`feature/2026-10-18-finding-k-nested-bullet` (which is PR #73's head). Pushed.
Baseline was 1,285 passing in 113 files; now **1,296 passing in 115 files**, all green, no
skips. Working tree clean at `cdde73e`.

Consumed and superseded: `handoff-2026-10-18-finding-k-nested-bullets.md`.

## ⚠ FIRST: two PRs, and the order matters

**PR #73** — https://github.com/jojohuhu-git/PneumoVax/pull/73 — is **OPEN, MERGEABLE, CLEAN,
`test` SUCCESS**, and carries FINDING K. **It is not merged, so the live site still shows
FINDING K's 904 wrong-patient quotes.** It needs the owner to squash-merge it.

Why it exists at all: PR #72 was aimed at the *parent branch* instead of `main`, and that
parent's own PR (#71) merged **13 seconds earlier** — so #72 landed in a branch that had
already been absorbed. `main` got FINDINGS H, I, J and the column-fit guard and never got
FINDING K. #73 is the repair, aimed at `main`.

**This session's branch is stacked on #73 and has NO PR yet** (owner said stop). Two routes:

1. **Merge #73 first**, then open a PR for this branch → `main`. Its diff will then be only
   this session's three commits.
2. Or open one PR from this branch → `main`, which would carry #73's content too and make
   #73 redundant.

Either is fine; **do not leave this branch without a PR** — a branch that never gets one is
exactly how FINDING K went missing. Both branches are pushed, so nothing is local-only.

`main` is protected and requires the `test` check: branch → PR → squash merge.

## What's done (by ID)

Three commits on this branch. (`6773300` and the merge `1b87054` are on **PR #73's** branch,
not this one.)

1. **The chip rename** — `22c7d05`. A 19-year-old with asplenia who has had PCV15 is told
   "Give PPSV23 ≥8 weeks after the PCV15 dose [1]", and button [1] read **"MMWR ≥50
   expansion"**. The citation was right in every other way — the sentence is mm7401a1's
   19–49 immunocompromising row, quoted verbatim, with `population: ['adult-19to49']`. Only
   the chip's label was wrong, taken from the paper's title while the app uses the table
   inside it for adults from 19 up. **1,015 cards showed it to a 19–49 adult.**
   **OWNER DECISION 2026-10-22:** one age-neutral name everywhere → **`ACIP 2025 Adult MMWR`**,
   on all 13 mm7401a1 entries.
   - **Trap**: 11 of the 13 spelled the name with a `≥` escape, not the character, so a
     search for the literal `≥50` found only 2. The partial rename left one paper under two
     names, which C1's "a short name identifies exactly one document" test caught.
   - New guard `regression-2026-10-22-chip-name-fits-the-patient.test.jsx`: sweeps the whole
     grid, fails if any button shown to an under-50 adult (or a child) is named for the
     50-and-over band. No allowlist. Confirmed it fails pre-fix with **exactly 1,015**.
   - **Tooling fix in the same commit**: `scripts/proseDiff.mjs` recorded every citation
     LABEL but never the chip's `short` — the words actually printed on the button — so this
     change would have reported **zero**. It now records chip names.
   - Proof: proseDiff 4,690 of 35,280 lines changed, 0 added/removed, and a field-level
     comparison shows **all 4,690 differ ONLY in a chip name**; both corpora untouched;
     driven in the running app.

2. **FINDING L closed as a wrong premise, and `CLAUDE.md` corrected** — `4e55c48`.
   The rulebook stated as fact that 446 cards "leave a reader clicking `[2]` with nothing to
   match". **Measured: 0 of 17,361 cards.** `cardSources()` builds the button row by walking
   the numbered citations FIRST, so a number always gets a button. The 446 is real only as an
   engine/renderer inconsistency and is invisible to the reader — **do not "fix" it**.
   - The class was **already guarded**: `G2` in `regression-c2-c3-numbered-sources.test.jsx`
     sweeps >15,000 cards asserting exactly that property, and C3 fixed the one real instance
     (the immunize.org PCV7 page had no whole-page entry — the origin of the 1,188). Proved
     load-bearing by deleting the cite-seeding from `cardSources`: G2 fails plus 4 others.
   - The enumeration was incomplete anyway: by its own measure the class is **1,634**, not
     446 — `immPCV7` alone is 1,188 and was never mentioned.
   - FINDING K's `refKeys` change rests on the same wrong reason. The change is harmless and
     moved no verdict, so it stays; only its justification is corrected.

3. **C8 — CDC Adult Notes' last uncredited statement** — `cdde73e`. 25 cards. On the
   19–49 IC / cochlear / CSF "PPSV23 (≥8 weeks after PCV15)" card, CDC's notes sat as a grey
   button no number pointed at, because the interval sentence cites ACIP there (the 8 weeks)
   while at ≥50 and 19–49 chronic-only it cites the notes (the year).
   New entry `adultPcv15NeedsPpsvCompletion`, quoting **"If PCV15 is used, administer 1 dose
   PPSV23"** — the quote stops there on purpose, because CDC's sentence continues "at least 1
   year" and this patient is told 8 weeks. Conditional on `ppsvIntervalCite` so the document
   never takes a second number where it is already cited (same rule as `mmwrNoneRowCites`).
   - Read live 2026-10-22 with the accordion expanded and walked as nested `<li>`s: the
     sentence is printed **twice**, identically, under "Age 50 years or older" and under
     "Age 19–49 years with certain underlying medical conditions" — hence `population` names
     both bands, which forced a deliberate edit to the pinned multi-group list.
   - Uncredited pairs **50 → 49**; CDC Adult Notes drops off the report entirely.
   - proseDiff 25 lines, all 19–49 asplenia / HIV / cochlear / CSF (5 apiece); **0** changed
     in vaccine, dose label, PCV verdicts, PPSV23 verdicts or geo note.

## Two OWNER DECISIONS taken but NOT implemented — do these first

Both were decided on 2026-10-22; the owner then asked to stop and hand off. **Apply them, do
not re-litigate.**

1. **The Catch-up Job Aid, 144 cards — split the citation three ways.**
   The handoff before this called it "a clean CITE". **It is not.** The job aid
   (`cdcCatchupJobAid`, `.../job-aids/pneumococcal.pdf`, "Healthy Children 4 months–4 years",
   Jan 2025) **never names a product** — its cells read "Dose 1", "Dose 2 (Final Dose)", not
   "PCV15 or PCV20" — and its 8-week wording depends on the prior-dose column. Read page 3
   with `python3 scripts/pdfLayout.py <pdf>` (prints x/y coordinates so a cell is tied to its
   own row; a flat text dump interleaves the columns).

   The card says one thing to all 144: *"Give 1 dose of PCV15 or PCV20, ≥8 weeks after the
   most recent PCV."* Measured split:

   | Prior counting PCV doses | Cards | What the job aid's 24–59 month row says |
   |---|---|---|
   | 0 | **60** | "Give Dose 1 today" → "No additional doses needed". **No 8 weeks anywhere.** |
   | 1 | **72** | 8 weeks appears only where Dose 1 was given after the 1st birthday *and* less than 8 weeks ago |
   | 3 | **12** | "Give Dose 4 (Final Dose) today", or "No dose today" — no 8-week clause |

   **Decision: cite the cell that fits each group** — the 60 cite the "Give Dose 1 today / no
   additional doses needed" row, the 72 cite the 8-week cell, the 12 cite the "Give Dose 4
   (Final Dose) today" row. This is the owner's p2016 all-columns rule applied to a different
   document: the age column fits, the prior-dose column is where it hid. Same shape as
   `mmwrBothPcv13PpsvKey()`. **No dose or date changes** — only which sentence each card
   points at. The card is at `src/logic/recommend.js:631`.

   **She did NOT choose** to change the wording for the 60 children with no previous PCV, who
   are currently shown "≥8 weeks after the most recent PCV" with no most-recent PCV to count
   from. That was offered as a separate option and not taken — **leave the wording alone.**

2. **Keep the full-grid chip-name sweep.** It takes the suite from ~22s to ~53s. The owner
   chose that over folding the assertions into the existing C2/C3 sweep, so the finding keeps
   its own named guard file. **Do not "optimise" it away.**

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`. **Re-measure, never quote a count
from a log** — the logs predate the IC-children fix and read low.

| Priority | Item | Scope |
|---|---|---|
| **P1** | **Catch-up Job Aid, 144 cards** | Decided, not implemented — see above. Its other statement (1,584 cards) is the decision the owner asked **not** to be re-raised. |
| **P1** | **C8 doc 3 — p2016's remaining CITEs** | **39** statements, 7,275 cards. The biggest block left; most recent findings hid here. |
| **P1** | **C8 — CDC Child/Adolescent Notes** | **8** statements, 1,107 cards. Includes FINDING K's group B, where the notes chip is present via the risk-condition list (`cdcChildSpecialSituations` serves two roles). Decide whether a risk-condition chip needs its own number, uniformly. |
| **P2** | **The wrong-ROW gap the all-columns guard cannot close** | It asks whether *some* p2016 row fits, not whether the row the card *used* fits. Closing it generally needs the engine to record which row it used, which it does not do. |
| **P2** | **Grid gap, recorded not fixed** | `buildCases()` cannot express p2016 row 2's patient. Moves both corpora; needs the owner. |
| **P2** | **Dead `advisory` flag** | Owner approved removal as its own change; needs a field-level corpus diff to show 0 real verdict moves. |
| **P2** | **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **P2** | **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. |
| **P2** | **Job aid footnote §, unread** | p.1 carries PPSV23 minimum intervals after PCV13. Nothing rests on it. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** FINDING L (wrong premise, above); the p2016/576 question (owner
said NO, 2026-10-18); the "add a number-has-a-chip guard" item (G2 already does it).

## Why this is a good stopping point

Three independent units, each committed on its own with its own proof, tree clean and suite
green. The two open owner decisions are *decided* — the next session applies them rather than
asking. Nothing is half-applied: the chip rename touched all 13 entries, and the Adult Notes
CITE closed that document completely rather than partially.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-22-finding-l-closed-and-chip-names`
2. **Check PR #73's state first** (`gh pr view 73`). If merged, rebase/merge `main` in and
   open this branch's PR. If not, see the two routes at the top.
3. Run `npx vitest run` — confirm **1,296 passing in 115 files**, no skips, before any new
   work. (`npm test` is the same command; pipe to `tail`, never to `head` — `head` closing the
   pipe wedges the run.)
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **49** pairs.
5. Start with the Catch-up Job Aid split (decided, above).
6. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix and quote the counts** →
   **`node scripts/proseDiff.mjs dump <file>` then `diff <before> <after>`, and classify every
   changed line field by field** → **drive the running app** → commit named by the item ID.
7. Push/merge: branch → PR → squash merge, then confirm the Pages deploy and spot-check the
   live site.

## Tooling notes that cost time this session

- **`scripts/pdfLayout.py <pdf> [page]`** is the right way to read the CDC job aids — it
  prints text with x/y coordinates so a table cell can be tied to its row. A flat dump
  interleaves the columns, which is how a true sentence gets attached to the wrong patient.
  To get a PDF locally, `WebFetch` saves the binary to disk even when it declines to
  transcribe it; the saved path is printed in its result.
- **`scripts/proseDiff.mjs`** takes `dump <file>` then `diff <before> <after>` and needs plain
  `node`. `scripts/uncreditedSources.mjs` and `scripts/citationMapping.mjs` need `vite-node`.
- **`citationMapping.mjs` already reports the FINDING L class** ("cards citing a document with
  no button"). Run it before acting on any finding of that shape.
- **Search `refs.js` for BOTH spellings** of any string containing a symbol — `≥` and
  `≥`. That is what made the chip rename a two-step job.
- **CDC notes pages are accordions.** The content is in the HTML but not in `innerText`; walk
  the panel's nested `<li>` elements with `textContent`, because the flat text loses the
  parent/child nesting FINDING K turned on. Panel ids on the adult page:
  `accordion-panel-pneumo-routine`, `-situations`, `-contraindications`.
- `M` in `recommend.js` is module-local, not exported — regression tests use literal month
  numbers. The engine's input shape is `ageMonths` / `pcvDoses` / `ppsv23Doses`, and the age
  comes back as `result.meta.ageMonths`.
