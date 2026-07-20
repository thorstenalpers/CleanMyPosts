#!/usr/bin/env bash
# Decides whether there is anything worth releasing.
#
# A release is warranted when there are new commits since the last tag
# (features, fixes, breaking changes).
#
# Exit 0 = something to release, 3 = nothing to release, 1 = error.
set -euo pipefail

# Run from the repository root so the tag/log lookups are unambiguous.
cd "$(git rev-parse --show-toplevel)"

last_tag="$(git tag --sort=-v:refname | head -1)"
if [[ -n "$last_tag" ]]; then
  commits="$(git log "$last_tag"..HEAD --oneline 2>/dev/null || true)"
else
  commits="$(git log --oneline 2>/dev/null || true)"
fi

if [[ -z "$commits" ]]; then
  echo "No new commits since ${last_tag:-the start} — nothing to release."
  exit 3
fi

echo "Releasable changes since ${last_tag:-the start}:"
echo "$commits"
exit 0
