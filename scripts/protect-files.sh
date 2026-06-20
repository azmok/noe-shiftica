#!/usr/bin/env bash
#
# protect-files.sh — pre-commit guard (mechanical enforcement layer)
#
# Blocks any commit that stages a PROTECTED file, so that fast/eager agents
# (e.g. Gemini Flash) cannot silently edit core files. This turns the
# documentation-level "please don't touch" rule into a hard requirement.
#
# Source of truth for the protected list:
#   AGENTS.md "Protected files" == .antigravity/rules.md §4-B.
# NOTE: .antigravity/notouch.md currently holds a SCOPE-LOCK *template*
#       (TASK / SURGICAL SCOPE / FORBIDDEN ACTIONS), NOT a parseable file
#       list, so the canonical list is hardcoded below. Keep it in sync with
#       AGENTS.md if the protected set changes.
#
set -euo pipefail

# One entry per line. Trailing slash = directory prefix.
PROTECTED="
src/collections/
src/payload.config.ts
src/access/
src/lib/db.ts
components/Footer.tsx
"

staged="$(git diff --cached --name-only --diff-filter=ACMR || true)"
[ -z "$staged" ] && exit 0

violations=""
while IFS= read -r file; do
  [ -z "$file" ] && continue
  while IFS= read -r pattern; do
    [ -z "$pattern" ] && continue
    matched=0
    case "$pattern" in
      */) # directory: match anything beneath it
        case "$file" in "$pattern"*) matched=1 ;; esac
        ;;
      *)  # file: exact, prefix (defensive), or nested under any dir
        case "$file" in
          "$pattern")  matched=1 ;;
          "$pattern"*) matched=1 ;;
          */"$pattern") matched=1 ;;
        esac
        ;;
    esac
    if [ "$matched" -eq 1 ]; then
      violations="${violations}  BLOCKED: ${file}   (protected rule: \"${pattern}\")
"
    fi
  done <<INNER
$PROTECTED
INNER
done <<OUTER
$staged
OUTER

if [ -n "$violations" ]; then
  echo "=================================================================="
  echo "  COMMIT BLOCKED - protected file(s) are staged"
  echo "=================================================================="
  printf '%s' "$violations"
  echo "------------------------------------------------------------------"
  echo "  These files require EXPLICIT human approval"
  echo "  (AGENTS.md \"Protected files\" / .antigravity/rules.md 4-B)."
  echo ""
  echo "  AI AGENTS: do NOT bypass. Unstage and stop, e.g."
  echo "      git restore --staged <file>"
  echo "  then ask Azuma for approval before touching these files."
  echo ""
  echo "  (A human emergency override exists via standard git procedure,"
  echo "   for Azuma only - never for agents.)"
  echo "=================================================================="
  exit 1
fi

exit 0
