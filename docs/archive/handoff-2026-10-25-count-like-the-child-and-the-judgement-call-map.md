# PneumoVax — Handoff after "count like the child" and the judgement-call map (2026-10-25, evening)

Branch: **`claude/beautiful-volta-gaw7c6`**, off `main` at `1c3fe52` — PR #87 was
squash-merged by the owner, so this branch is a clean descendant and is NOT stacked on
anything unmerged.

Baseline on `main` was 1,606 passing in 144 files; now **1,639 passing in 145 files, 0
failures, 0 skips** (`npx vitest run`).

⚠️ **This session ran in a cloud container, not on the owner's Mac.** There is no
`preview_start` / `preview_logs` here. The app was previewed by building it with
`npx vite build --base ./` and inlining the bundle into one self-contained HTML file, which
was sent to her to open in the side panel. The script is
The helper was a scratchpad script and is NOT in the repo. If a future cloud session needs a
preview: `npx vite build --base ./ --outDir <tmp>`, then inline `assets/*.js` into a
`<script type="module">` and `assets/*.css` into a `<style>`, and replace the logo's
`import.meta.env.BASE_URL` reference with a data URI. `dist/` is only ~360 KB, so the single
file is ~350 KB and renders fine. Playwright is preinstalled in the cloud container, so the
page can also be driven headlessly — which is what caught the error in the third commit.

## What's done

Two commits, independent of each other.

### 1. A conjugate given early after a PPSV23 now counts for an adult

**OWNER DECISION 2026-10-25**, after being shown two patients given the same two vaccines on
the same two dates, fourteen days apart:

| | |
|---|---|
| a 55-year-old with chronic lung disease | PPSV23 2026-06-01, PCV20 2026-06-15 |
| a 6-year-old with asplenia | PPSV23 2026-06-01, PCV20 2026-06-15 |

The child's conjugate counted and her series read Complete; the adult's was thrown out and
she was told to return on 2027-06-15. Nothing clinical separated them — the child rulebook
simply has no conjugate-after-PPSV23 row. Her ruling: *"count like the child, provide
alternative in comments."* Then, asked whether it reaches PCV15 (her 2026-10-24 afternoon
ruling had named PCV15 by name): *"All three — PCV15 too but make sure the alternative
option is listed in the expander."* And on the comment's shape: *"Counted + alternative with
a date."*

`ADULT-PCV-AFTER-PPSV23` is now a **CDC recommendation with no grace**, its FOURTH state.
Authority moved OWNER → CDC, the same relabelling Ruling F performed on the 5-year row and
for the same reason: what was removed was an owner-invented bar, leaving CDC's own sentence
behind. "Case H" counts again.

**The alternative's date is not a new calculation.** It comes from
`adultRepeatAfterInvalidDose` — the same function, and therefore the same day, that the card
and the chip printed while the row was a floor.

Measured:

| | |
|---|---|
| verdict corpus | **132 of 17,016** moved, every one from "incomplete, return in a year" to **Complete**. None made to wait longer. |
| record-problem corpus | **0 of 18,264**, byte-identical |
| rendered prose | **132 of 35,280** lines changed, 0 added, 0 removed (`proseDiff.mjs` against a git worktree of `main`) — no collateral wording drift |
| mm7401a1 buttons | 3,795 → 3,663 (−132) |
| job aid buttons | 3,869 → 4,001 (+132); 33 land on "complete by PCV20/21", 99 on "complete by PCV15 + PPSV23", and `jobAidElsewhere` did not move |
| uncredited buttons | **0**, on every C8 sweep, before and after |

Broken five ways: back to a floor **66** tests fail; alternative dropped from the `why`
**15**; PCV15 excluded from the row **11**; alternative date recomputed locally **9**; grace
restored **4**.

Guard: `regression-2026-10-25-conjugate-after-ppsv23-counts-like-the-child.test.js`.
`CLINICAL_SPEC.md` gains **"OWNER DECISION 2026-10-25 — a second row left that table"**.

### 2. The rulebook highlights where the app is making a judgement call

Her request, verbatim: *"I also want the rulebook updated to highlight cases where there are
no clear CDC/ACIP recommendations so the app is making a judgement call."*

New **section 5** on "How recommendations are made", in two halves, each labelled:

- **GENERATED** — every interval row carrying `authority: 'OWNER'`, read live from the same
  table the engine reads, so a row that loses the flag leaves the page in the same commit.
- **WRITTEN** — the two judgement calls that are not rows (the read-across year for a repeat
  conjugate; the transplant hard stop). Each is **driven through the engine** by the C14
  guard rather than taken on trust, because a typed sentence about behaviour is the exact
  failure this page exists to avoid.

The spacing table's "Who says so" column now reads **"This app's judgement"** rather than
"This app". Broken three ways: a judgement row silently dropped **1** test; a written claim
the engine no longer makes **3**; the section rendering nothing **1**.

**A third commit fixed an error DRIVING THE PAGE found, that no test could.** The section
first carried one explanation for every judgement call — *"the interval is theirs; treating
it as a cut-off is ours"* — which is true of the five floors and **false** of
`ADULT-PCV20-21-1Y-AFTER-PCV`, whose own message tells the clinician that **no source states
the interval at all**. They are two different kinds of judgement call. `authorityMeans` now
branches on `enforcement`, the table has a third column saying which, and the guard asserts
both kinds occur and that a row claiming "no source states this" really does carry *"not
ACIP, not CDC"* in its own source text. A page that explains a rule wrongly is worse than one
that omits it — and the suite was green throughout, because nothing compared the page's prose
to the rule's.

## A FINDING worth carrying forward

**The recommendation card's conjugate-to-conjugate read-across sentence is now unreachable** —
measured **0 of 35,223 cards** over both grids. `ADULT-PCV-AFTER-PPSV23` was the last adult
row that could reject a PCV dose, and a repeat card only appears when the LAST dose is
invalid. The clause has **not** been deleted: it rides the dose's own "Why this" disclosure
for all 132 patients, and the card path is there and correct for the day a ruling re-floors
an adult conjugate. Guarded as unreachable rather than removed, per CLAUDE.md's rule about
branches nothing can execute.

A trap this cost: the first version of that guard filtered on the patient's age **today** and
found 1,287 "offenders" — every one a 50-, 65- or 70-year-old with a dose recorded in
**childhood** and rejected by `CHILD-PCV-AFTER-PCV`. The rulebook is chosen by the age AT THE
DOSE. Key such a sweep on the rule that fired, never on the patient's current age.

## What's NOT done — the remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P1 — OWNER DECISION, put to her 2026-10-25** | **The immunocompromised child's PCV20 after a PPSV23** | CDC's child notes and immunize.org p2016 disagree, and **only for an IC child**. CDC (`pedsIcPcv20orPpsv23`, `pedsIcBefore6NoPcv20At6to18`): *"If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23."* p2016 Table 4 footnote ‖: *"(a) give one dose of PCV20 at least 8 weeks after most recent pneumococcal vaccination, or (b) give a second dose of PPSV23 five years after the first."* The app is **silent either way** — there is no child conjugate-after-PPSV23 row. For a NON-IC child both documents agree nothing follows (p2016 footnote §: *"If PPSV23 previously given, then child is complete"*; CDC's non-IC sentence has no five-year clause at all), so the silence is correct there. |
| **P1 — OWNER DECISION** | **The 40 Group-B cards** | Carried over untouched. C13 left them on p2016; ACIP's 2023 Table 1 has no PPSV23 condition either. Changing them alters a decision of 2026-10-23 and a count pinned in two guards. **Ask; do not widen it alone.** |
| **P1 — OWNER DECISION** | **Three wording items from the 66-patient comparison** | In PR #87's body. (a) a healthy 5-year-old who finished the series is told "Not indicated" where CDC says "Schedule complete"; (b) a 25-year-old with asplenia and a PCV20 is told "Complete" where CDC also says "check at 50"; (c) a PCV-naive 2-year-old is told "≥8 weeks after the most recent PCV" when there is no most recent PCV. None changes a dose. |
| **P2** | Patient E's "of 3"; dead `advisory` flag; `intervalWords().adj` has no consumer; the long PCV7 non-counting sentence (1,188 cards) | Wording/cosmetic, none clinical. |
| **P2 — DESIGN PARITY** | MeningoVax has neither of C14's two surfaces, nor this session's judgement-call section | Consult `vaccine-parity` first. The *pattern* ports; the content does not, because MeningoVax's rules are its own. |
| — | **MeningoVax: she wants the same audit there.** Not started. | |

**Closed, do not reopen:** Ruling D, C11, case H (counts), Ruling F, family 3 and the two
PCV13→PPSV23 rows (still floors), the flat-8-week second clock, the Job Aid's last uncredited
statement, the PCV13 hold-out, and — new today — the question of whether "count like the
child" reaches the PPSV23-after-a-conjugate rows. **It does not**, and the reason is her own
analogy: the child rulebook DOES throw those doses out (`CHILD-PPSV23-AFTER-PCV`, a CDC floor
of 8 weeks stated in words). That asymmetry is now asserted, so adding a child
conjugate-after-PPSV23 row later fails a test rather than quietly outliving the reasoning.

## Resuming

1. Branch fresh off `main` if the PR for this branch has merged. Never stack on an unmerged PR.
2. `npx vitest run` — confirm **1,639 passing in 145 files** before any new work.
3. Put the IC-child question to her with the two quotes side by side, then the Group-B cards
   and the three wording items.
4. Per item: reproduce → failing test → fix → `CLINICAL_SPEC.md` in the same commit → full
   suite → **break the fix more than one way and quote the counts** →
   `node scripts/proseDiff.mjs dump <file>` (plain `node`) on both sides → **drive the
   running app** → commit per item.
5. Push/merge: **branch → PR → the owner squash-merges.** A session agent cannot merge.
6. Her standing style rules: plain language for a non-coder, specific patient examples, card
   text abbreviated with an expander, worded clinically and succinctly.
