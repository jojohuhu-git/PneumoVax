# PneumoVax — Handoff after FINDING K (2026-10-18)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json`.
What the app is: client-side React SPA giving pneumococcal vaccine advice across the
lifespan. No backend; every clinical claim on a card must be traceable to a document that
speaks for *that patient*.

Branch: **`feature/2026-10-18-finding-k-nested-bullet`**, stacked on
`feature/2026-10-18-p0-cards-name-the-history` at `ca2023c` (PR #71, which is **not yet
merged**). Pushed; `main` is protected and requires the `test` check, so this lands
branch → PR → squash merge.
Baseline was 1,277 passing in 112 files; now **1,285 passing in 113 files**, all green,
no skips. Working tree clean at `0915530`.

**⚠ PR #71 was CONFLICTING, not green as its handoff said** — PR #70 landed the rescued
p2016 handoff on `main` while #71 was in review, so both sides added the same file. Fixed
in `ca2023c` (keep this branch's superseded banner; one sentence corrected). **#71 is now
CLEAN / MERGEABLE with `test` SUCCESS and needs the owner to squash-merge it first.**

Consumed and superseded: `handoff-2026-10-18-p0-cards-name-the-history.md`.

## What's done (by ID)

1. **The merge-conflict fix on PR #71** — `ca2023c`. Docs only; suite re-run on the merged
   tree.
2. **FINDING K — a quote is only about the patient its PARENT BULLET describes** — `0915530`.
   CDC's child notes nest their rules. "Previously received at least 1 dose of PCV20: no
   further PCV or PPSV23 doses needed" is a **sub-bullet**, printed four times, each under a
   parent carrying its own conditions (at 6–18: *"Received PCV before age 6 years **but have
   not received PPSV23**"*). One `refs.js` entry held the non-IC wording for both risk
   classes; `recommend.js` said the sentence "carries no age condition in its own words".
   True of the sentence alone, false of the sentence in place. **992 cards showed it; 56
   fitted.** Dispositions, after reading both CDC pages live (notes accordion expanded) and
   p2016 cell by cell from a live download:
   - **56** CDC's sub-bullet, split per risk class (the IC instance at 6–18 uses *different
     words*), plus p2016's row, which also fits.
   - **40** p2016 Table 4 only — "2 through 18 years (any risk condition) | Completed PCV
     series before age 6 years, including one or more doses of PCV20 | No additional doses",
     quoted for the first time. It states no PPSV23 condition. CDC's notes row comes off.
   - **288** CDC's Risk-based page, which states the completion in words under "Never
     received PCV13, PCV15, or PCV20". **This closes the handoff's 864-card P1 item.**
   - **576** OWNER DECISION: cite the row the PCV20 **satisfied**, and say that dose has
     been given. Escalation case (a) — no document states a completion for "a conjugate at
     8–13, then PCV20 at 17". CDC's Risk-based chip comes off.
   - **32** 15-month-olds were already right (their card says "at age 2 years or later");
     they only needed the **Age 2–5** instance as its own key.
3. **FINDING L, the 864 of it this commit owned** — same commit. A numbered citation whose
   document is not among the card's grey buttons. `pcvInterchangeableBridge` now returns
   `refKeys`; **every call site using `cites` must spread `refKeys` into its refs**, never
   into the block-level `refs`.

**NO VERDICT MOVED.** Both corpora byte-identical, and a field-level diff of all 2,112
changed prose lines shows dose verdicts, intervals, due dates and dose labels identical on
every one. Uncredited pairs **51 → 50**.

## Owner decisions made this session (apply, do not re-litigate)

- **The 576: cite the row the PCV20 satisfied.** Shown the three candidate options with
  card counts and the patients; she chose it over "cite the completion sentence anyway" and
  "say no document speaks".
- **Priority: fix FINDING K before the queued C8 citation work**, because two queued items
  touch these same cards.

## What's NOT done — the remaining queue

Queue doc: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`;
readings: `docs/archive/c7-2026-10-17-source-readings.md`. Re-measure, never quote a count
from a log.

| Priority | Item | Scope |
|---|---|---|
| **P1** | **FINDING L — the remaining 446** | Three keys, all enumerated: `pedsInfantLastDose1215mo` (220 cards, "PCV dose 5 of 5"), `pedsSecondPpsv5y` (111 + 90, the two "Option B: 1 dose PPSV23" cards), `adultPcv15ThenPpsvShort` (25, the adult PPSV23-completes card). Each needs its document added to that card's chips — but **check first that the document has a fitting row**, or this becomes FINDING F pointed the other way. `scripts/uncreditedSources.mjs` cannot see this class. |
| **P1** | **C8 doc 3 — p2016's remaining CITEs** | Now **39** statements, 7,275 cards (was 40/7,371; FINDING K credited 96). |
| **P1** | **C8 — CDC Child/Adolescent Notes** | Now **8** statements, 1,107 cards (was 7/1,067). The +40 is FINDING K's group B: the card cites only p2016, while the notes chip is still there via the **risk-condition list** (`cdcChildSpecialSituations` shares a page, so one chip serves two roles). Not a wrong-patient citation — decide whether a risk-condition chip needs its own number, uniformly. |
| **P1** | **C8 — Catch-up Job Aid** | Statement 1 (1,584 cards) is the decision she asked **not** to be re-raised. Statement 2 (144 cards) is a clean CITE. |
| **P1** | **C8 — CDC Adult Notes** | 1 statement, 25 cards. Same card as FINDING L's `adultPcv15ThenPpsvShort`; do them together. |
| ~~P2~~ **SETTLED** | **Should p2016 go back on FINDING K's 576?** | **ANSWERED 2026-10-18: NO.** Owner shown the 17-year-old with chronic lung disease (PCV13 at 8, PCV20 at 17) with both documents' rows side by side, and the cost — the all-columns guard would have to accept a patient who HAS a PCV20, which is what FINDING J rests on. She chose the single CDC Child Notes row. The code already did this; the comment in `recommend.js` now records the decision. **Do not re-raise.** |
| **P2** | **The wrong-ROW gap the all-columns guard cannot close** | Unchanged: it asks whether *some* p2016 row fits, not whether the row the card *used* fits. |
| **P2** | **Grid gap, recorded not fixed** | `buildCases()` cannot express p2016 row 2's patient. Moves both corpora; needs the owner. |
| **P2** | **Dead `advisory` flag** | Owner approved removal as its own change; needs a field-level corpus diff to show 0 real verdict moves. |
| **P2** | **Interval-prose guard blind spot** | Only inspects lines where the key starts the line, so a `doseLabel:` can hand-type "≥8 weeks". |
| **P2** | **The sentence nothing quotes** | No document read states, in words, that healthy 5–18s are not caught up. |
| **P2** | **Job aid footnote §, unread** | p.1 carries PPSV23 minimum intervals after PCV13. Nothing rests on it. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

Also corrected for the record: `c7-2026-10-17-source-readings.md` line 1328 records the
sub-bullet as occurring **3** times ("non-IC ×2 and IC"). It occurs **4** times. That
reading noted the sentence was ambiguous and never opened its parent bullets.

## Why this is a good stopping point

FINDING K is one family — a card reading a patient a sentence was not written about — closed
across all four of its branches with a guard that fails the suite on any of them, proved by
four mutations. Nothing is half-applied: tree clean, suite green, every number measured this
session, and the one new finding (L) is fully enumerated rather than vaguely flagged.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-18-finding-k-nested-bullet`
   (or `main` once both PRs are merged — **#71 must merge first**, this branch is stacked on it).
2. Run `npm test` — confirm **1,285 passing in 113 files**, no skips, before any new work.
3. `npx vite-node scripts/uncreditedSources.mjs` — confirm **50** pairs.
4. **No owner decision is open.** The p2016/576 question was SETTLED on 2026-10-18 (no).
   Her standing instruction for the next one: *"If you need other citation decisions, I
   need the age, risk factors and vaccine history to find them for you."* Her 2026-10-18
   process rule: decide alone when every candidate document gives the same dose and only the
   citation is in question; escalate on (a) no document has a row, (b) two documents give
   different doses, (c) a verdict would move; every judgement call goes in the PR body.
5. Per item: reproduce → failing test (**say the pre-fix failure count and check it is the
   number you expected**) → fix → full suite green → **break the fix and quote the counts** →
   **`node scripts/proseDiff.mjs` and classify every changed line field by field** → **drive
   the running app** → commit named by the item ID.
6. Push/merge: branch → PR → squash merge, then confirm the Pages deploy.

⚠ Tooling notes that cost time this session: `scripts/proseDiff.mjs` takes **`dump <file>`**
then **`diff <before> <after>`** and needs plain **`node`**; `scripts/uncreditedSources.mjs`
needs **`vite-node`**. **`preview_start` reports the wrong port** — it said 59851, the real
one was **5176** with base `/PneumoVax/`; read it from `preview_logs`. **CDC notes pages hide
the whole paediatric rulebook in a collapsed accordion** whose content is in the HTML but not
in `innerText` — the panel is `#accordion-panel-pneumo-situations`; walk its nested `<li>`
elements with `textContent` to see which sentence sits under which parent, because the flat
text loses exactly the structure FINDING K turned on. `M` in `recommend.js` is module-local,
not exported — regression tests use literal month numbers.
