# Pointer: HCT/CAR-T/B-cell hard-stop plan lives in vaxapp

The full plan/handoff for this cross-repo change is at:

`/Users/joannehuang/Downloads/vaxapp-main/docs/archive/handoff-2026-09-12-hct-cart-bcell-hardstop-plan.md`

and the detailed design doc at:

`/Users/joannehuang/.claude/plans/wiggly-chasing-grove.md`

PneumoVax's piece: add one new risk factor (id like `bcell_car_t_therapy`, label
"CAR-T therapy, B-cell malignancy, or B-cell-depleting therapy") that short-circuits
`recommend()` to a hard-stop result. **Leave the existing `hsct` risk factor and its
`hsctAdvisory()` output completely untouched** — it already does the right thing for
HCT and was explicitly kept as-is in this plan. Read the two files above before
starting; nothing has been implemented yet as of 2026-09-12.
