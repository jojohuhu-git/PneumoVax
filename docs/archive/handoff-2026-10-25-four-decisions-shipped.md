> **⚠️ SUPERSEDED (2026-10-25, later the same day)** — see
> `handoff-2026-10-25-conjugate-gaps-card-wording-and-2023-citations.md`.
> Three further items shipped on the same branch and PR after this was written
> (§K-CONJUGATE, C12 and C13), and the queue below is stale in two ways: **PR #85
> is CLOSED** — the owner closed it, so the P0 is resolved and needs nothing —
> and the **2023 PCV20-children MMWR is now on the cards**, which is the P1 item
> listed below. The test counts here (1,521 in 138 files) are superseded by
> **1,576 in 142**. Do not resume from this document.

# PneumoVax — Handoff after the owner's four decisions of 2026-10-25

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
⚠️ **read the real port from `preview_logs`**: `preview_start` reported 62142 this session
and the server was actually on **5176**. Navigating to the reported port fails outright.
(Third session running where this has been true.)

Branch: **`fix/2026-10-25-invalid-dose-adults-and-children`**, off `main` at `1b36184`
(PR #84 squash-merged overnight, so this branch is NOT stacked on anything unmerged).
Pushed and in sync. Working tree **clean** at `243f708`.

Baseline on `main` was 1,505 passing in 136 files; now **1,521 passing in 138 files, 0
failures, 0 skips** (`npx vitest run --reporter=json`, after the final commit).

[PR #86](https://github.com/jojohuhu-git/PneumoVax/pull/86) **open, NOT merged** — the owner
squash-merges; a session agent cannot. **CI was still running when this was written; check
it before anything else.**

## What's done

Four decisions, asked at the start of the session and answered by the owner in two rounds.
Her words are quoted verbatim in each commit message, in `CLINICAL_SPEC.md` and in each
guard's header.

1. **SAFETY NET** (`ef4f991`) — `repeatDueDate` joined `doseVerdict` in `src/test-grid.js`,
   so both corpora now record the date a clinician reads under a REJECTED dose. Measured
   with one mutation (every repeat date +999 days): **before 122 of 17,016 and 0 of 18,264**
   (and all 122 only as a side effect through the card), **after 5,265 and 1,254**. Proved
   inert field by field: **0 real changes** in either file, no key added or lost.
2. **DECISIONS 2 + 4** (`47e3661`) — `ADULT-PPSV23-AFTER-PCV13` (402 patients) and
   `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` (210) joined `CARD_FOLLOWS_INVALID_DOSE`.
   *"yes A is treated the same as B."* The date is the **later of her two clocks** —
   *"i am thinking it is third row"* — and the card explains and cites it, as she required.
   212 cards reworded, **179 of 17,016** verdicts moved, 0 of 18,264.
   `CLINICAL_SPEC.md` §K-INVALID rewritten.
   ⚠️ The widening silently took **mm7401a1 off 212 cards it speaks for** (3,795 → 3,583),
   FINDING F's mirror for the third time on this one card. Its "PCV13 only" row is now cited
   **for the disposition, never for the date**, in its own sentence. Caught by the three C8
   guards, not by `uncreditedSources.mjs`, which cannot see this class.
3. **DECISION 3** (`243f708`) — the note under a too-early dose no longer names a date when
   no card asks for a further dose. **647 of the 814 children** with a rejected PPSV23 were
   being shown one. Her ruling and her document: CDC/ACIP *Use of 20-Valent Pneumococcal
   Conjugate Vaccine Among U.S. Children*, 22 Sep 2023, **Table 1** —
   `https://stacks.cdc.gov/view/cdc/133252`, fetched live 2026-10-25 (the table is in the
   PDF; the landing page is metadata only). `CLINICAL_SPEC.md` gains **§K-NOPROMISE**.
   3,282 of 35,280 rendered lines changed, **0 verdicts moved** — both corpora are blind to
   it, which is why the guard sweeps rendered sentences and pins both sides.

All three were **live-verified by driving the app**, not only by tests, and each shipped
with four separate mutations quoted in its commit message.

## What's NOT done — the remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P0 — OWNER DECISION, unanswered** | **PR #85** | Still open, headline WRONG (says Ruling F "splits at 1 year"; it does not). She was asked this session and did not answer. **Close it, or merge it as history.** Do not decide this alone. |
| **P1 — OWNER DECISION** | **Add the 2023 PCV20-children MMWR to `refs.js`** | She said *"You can reference this document for pediatric recommendations too."* Not done: the cards it would sit on already cite CDC's child notes for the same claim, so this is CDC-vs-CDC and adding a second grey button touches guards with pinned counts. Worth doing deliberately, with her, not as a side effect. |
| **P1** | **`ADULT-PPSV23-AFTER-PPSV23`, `ADULT-PCV20-21-1Y-AFTER-PCV`, `ADULT-PCV20-21-AFTER-PCV13`** | The three remaining adult floors. All measured at **0 real patients** the grid can build — but see the ⚠️ in `decision-2026-10-24-the-adult-floors-that-remain.md`: "0 in the grid" is not "0 in a clinic". `ADULT-PPSV23-AFTER-PPSV23` is SETTLED (keep, 5 years). |
| **P2** | Patient E's "of 3"; overdue children read oddly ("due at age 4 months" on a 12-month-old, pre-existing on `main`); chips print ISO dates while cards print `Dec 7, 2026`; dead `advisory` flag; `intervalWords().adj` has no consumer | All wording/cosmetic, none clinical. |
| — | **MeningoVax: she wants the same audit there** — *"I will eventually need to go to meningovax to do the same audit."* Not started. Consult `vaccine-parity` first. | |

**Closed, do not reopen:** Ruling D, C11, case H, Ruling F (do NOT split it at 1 year),
families 2 and 3, the flat-8-week second clock, the Job Aid's last uncredited statement
(1,584 cards — she asked for it not to be re-raised), and now the PCV13 hold-out, which she
lifted herself.

## Why this is a good stopping point

Every decision she gave is implemented, measured, guarded, live-verified and written into
the rulebook, and the branch is a clean descendant of a merged `main`. The one P0 left is a
question for her, not work. Nothing in the remaining queue blocks anything else.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout fix/2026-10-25-invalid-dose-adults-and-children`
   — or branch fresh off `main` if PR #86 has merged. Never stack on an unmerged PR.
2. `npx vitest run --reporter=json` — confirm **1,521 passing in 138 files** before any new
   work. For the file count use `len(testResults)`; pipe to `tail`, never `head`.
3. **Check PR #86's `test` check**, and **put PR #85 to her** — it is the only blocked item.
4. Per item: reproduce → failing test (quote the pre-fix count) → fix → `CLINICAL_SPEC.md`
   in the same commit → full suite → **break the fix more than one way and quote the
   counts** → `node scripts/proseDiff.mjs dump <file>` on both sides (plain `node`, NOT
   `vite-node`) compared field by field → **drive the running app** → commit per item.
5. Push/merge: **branch → PR → the owner squash-merges.** A session agent cannot merge.
6. Her standing style rule, given this session: *"Keep questions and explanations in plain
   simple language for a noncoder... Use specific patient examples, visuals if needed."*
   Ask with a named patient and a control, run through the real engine — never a rule id
   and a count.

## Three traps this session paid for

- **`git checkout -- <file>` after a mutation wipes the real fix too.** Restoring
  `validate.js` from git, rather than from the backup copy taken before the mutation, threw
  away that commit's entire change; only a `grep` caught it. Always restore from the
  scratchpad copy, never from git, while the working tree holds uncommitted work.
- **Apostrophes in a shell label break the report, not the test.** Two of eight mutation
  runs executed fine and printed a node `SyntaxError` instead of their count. Pass labels
  through the environment, not through nested quotes.
- **A prose-only change leaves both corpora green.** Item 3 moved 3,282 rendered lines and
  0 corpus rows, because the corpora record a reason COUNT and the swap keeps the count.
  `proseDiff.mjs` is the only thing that can see it — and checking it by *substitution*
  (does removing the clause from every "before" line reproduce the "after" line exactly?)
  is what proves nothing else moved.
