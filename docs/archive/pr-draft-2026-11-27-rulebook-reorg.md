## What this changes

The **Rulebook** screen is rebuilt into MeningoVax's layout, exactly as reviewed in the 2026-11-27 mock-up (`docs/archive/mockup-2026-11-27-pneumovax-rulebook-v1.html`, committed here with its handoff). **No recommendation, card, dose label or citation on a result card changes** — this is the Rulebook page only.

- **L1** One fold, "How PneumoVax decides", with five steps: Stop check · Read the record · Children's schedule · Adults' schedule · Time between doses. Below a "Reference" label: PneumoVax decisions · Sources. Every fold starts closed.
- **L2 / E18** Each fold has its own Show/Hide; "Show all" sits beside the "How PneumoVax decides" bar, opens every fold (Decisions and Sources included) and then reads "Hide all". These are **MeningoVax's own components and CSS**, copied word for word; a test compares them with MeningoVax's checkout when it is on this machine. They use the shared colour names, so they draw in PneumoVax's green.
- **L3** Removed (each repeated another part): the jump buttons, "Common series patterns", the Age lines box, the separate risk-group lists. Each group's conditions open from **Details** under its name.
- **L4** "More than one condition" once in each schedule; the children's list has no smoking or alcohol use disorder.
- **L5** Step 5 is "Time between doses".
- **E1–E16** as tagged in the mock-up, wording copied from it.

## Three owner decisions made while building (2026-11-27)

1. **E15, "PPSV23 under 8 weeks after a PCV" — split by age.** Read live today: ACIP's current report (mm7401a1) prints "A minimum interval of 8 weeks can be considered" only in its **50-and-over** row; for 19–49 with these conditions it says "administer a single dose of PPSV23 ≥8 weeks after the PCV15 dose". The mock-up's line read as if the "can be considered" sentence covered 19–49. Now: *"8 weeks is the recommended interval at 19–49 years for an immunocompromising condition, cochlear implant or CSF leak. From 50 years, 'a minimum interval of 8 weeks can be considered', sooner than the usual 1 year. They do not say whether a PPSV23 given before 8 weeks counts."* (I added "for an immunocompromising condition, cochlear implant or CSF leak" to the option you chose — without it the sentence would be untrue for a 19–49-year-old with a chronic condition only, whose interval is 1 year.)
2. **CDC's grace sentence shows in the Rulebook only.** Step 5's children's heading quotes CDC General Best Practices, read live today and found once: *"Doses of any vaccine administered ≥5 days earlier than the minimum interval or age should not be counted as valid doses and should be repeated as age appropriate."* No result card quotes it (the line under a too-soon dose says "per CDC"), so it is the one named exception to "a Source shows only a sentence a card cites" (`RULEBOOK_ONLY_SOURCES`). No card changed.
3. **New footer, the same in both apps** (replaces E17). Your wording, your address as a mail link, and "Last updated <date>" — the date of the latest commit, read when the app is built (`src/data/rulebookFooter.js`, identical in MeningoVax). It came up because the approved footer's semicolon broke MeningoVax's no-semicolon rule.

## Judgement calls, for your audit

- **No Source was removed from any row.** Four rows the mock-up drew without a Source tag kept the sentence they already carried (PPSV23-before-2 special case; children's "PPSV23, then PCV" — the one p2016 row; children's 2nd PPSV23; adult "PCV, then PPSV23" and "PPSV23, then any PCV"; adult "PCV15, then a PPSV23 that did not count"). Taking a document off a row is a clinical act, so I didn't.
- **The chronic / cochlear / CSF-leak children's row no longer repeats the card's "at 19" / "at 50" line** (Cora, Owen, 2026-11-07), because the mock-up's row (E7) doesn't. The **card is unchanged** and still says it; `CLINICAL_SPEC.md` now says so.
- **E8, healthy row:** "or 19 years if smoking or alcohol use disorder is selected" — the card does this from age 5. Under 5 with smoking ticked, the card adds no re-evaluation age at all. Left as written (an unrealistic history).
- **E9, doses in all by age at dose 1** is generated: each band is run through the engine at its first and last month (4 · 3 · 2 · 1 · none), and the page refuses to load if the two ends disagree.
- **E14, "Applies in"** is generated from the rows that carry each chip, so it reads e.g. "Step 5, children's PCV and PPSV23 table, adults' table" rather than the mock-up's hand-written "Step 5, children's and adults' tables".
- **E16, Sources:** grouped as MeningoVax groups them; each document's subtitle comes from `refs.js`, so a few read slightly differently from the mock-up's hand-written ones.
- **Step 5's PCV-after-PCV Source** shows the two catch-up cells a card quotes (the 4-week ones). The 8-week cells are never quoted on a card — there the advised date and the minimum are the same, so the card states no separate minimum.
- **E15 examples** ("Given 3 months after the PPSV23 dose of Jan 10, 2026. CDC recommends 1 year." and the same-day PCV15 line) are read off two new worked patients' real dose lines, not typed.

## Checks

- Full suite: **2,570 tests in 232 files**. The last full run had 2,569 passing and 1 failing — a mistake in this PR's own new test, fixed; that file then passed 20 of 20, and nothing else changed after the full run. (Baseline on `main`: 2,551.)
- **Prose diff, `main` vs this branch: 0 of 35,280 card lines changed** — no result card, dose label or citation moved. Both verdict corpora green.
- New guard `regression-2026-11-27-rulebook-reorg.test.jsx`, mutation-checked: breaking the copied MeningoVax CSS, dropping Sources from Show all, and typing a wrong number into the doses-in-all table each turned it red.
- Live in the app: at 375 px with every fold and every Details panel open, nothing runs off the screen or past its cell (one overlap — "Immunocompromising" in a narrow column — was found this way and fixed); desktop clean; no console errors.

## Not in this PR

- **MeningoVax**: step 5 renamed "Time between doses" (L5) and the same footer — its own PR (2,770 of 2,770 tests passing there).
- Carried over: MeningoVax's `DoseEditor.jsx` still says "Date (optional)"; whether it takes PneumoVax's 2026-11-17 wording is still to ask.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
