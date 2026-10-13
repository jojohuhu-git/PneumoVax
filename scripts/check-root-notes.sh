#!/bin/sh
# Save-time guardrail: flags a NEW note file added at the top level of the
# project that has no approved home. It does NOT move, rename, or delete
# anything — it just pauses the save so you can ask Claude where the file
# should live (usually docs/archive/ for notes, or docs/agent/ for a manual).
#
# Only the files listed in "allowed" belong at the top level.

allowed="CLAUDE.md MAP.md README.md CLINICAL_SPEC.md"

# queue P1-4: the message below is built FROM "allowed" above, never typed out
# a second time. It used to name three files while the list permitted four,
# so the guardrail told you a rule it was not enforcing. Edit "allowed" and the
# message follows; a test runs this script and checks that it still does.
allowed_sentence=$(printf '%s' "$allowed" | tr ' ' '\n' | awk '
  { names[NR] = $0 }
  END {
    for (i = 1; i <= NR; i++) {
      if (i > 1) printf (i == NR ? (NR > 2 ? ", and " : " and ") : ", ")
      printf "%s", names[i]
    }
  }')

added=$(git diff --cached --name-only --diff-filter=A)

stray=""
IFS='
'
for f in $added; do
  case "$f" in
    */*)   continue ;;   # inside a folder — that's fine
    *.md)  ;;            # a top-level note — check it
    *)     continue ;;   # top-level non-note (config, etc.) — not our concern
  esac
  case " $allowed " in
    *" $f "*) continue ;;   # on the approved list — fine
  esac
  stray="${stray}  $f
"
done

if [ -n "$stray" ]; then
  printf '\n'
  printf '  ─────────────────────────────────────────────────────────────\n'
  printf '  STOP: a new note has no home yet\n'
  printf '  ─────────────────────────────────────────────────────────────\n\n'
  printf '  These file(s) were about to be saved at the top level:\n\n'
  printf '%s\n' "$stray"
  printf '  Only %s belong at the top level.\n\n' "$allowed_sentence"
  printf '  Ask Claude: "where should this file live?" — it will suggest a\n'
  printf '  folder (notes usually go in docs/archive/, manuals in docs/agent/).\n\n'
  printf '  If you truly want it at the top level anyway, redo the save with:\n'
  printf '      git commit --no-verify\n\n'
  exit 1
fi
