#!/usr/bin/env bash
# Publish GitHub releases from local tags using CHANGELOG.md sections.
#
# Usage:
#   ./scripts/publish-github-releases.sh              # dry-run (list tags)
#   ./scripts/publish-github-releases.sh --push       # create missing releases
#   ./scripts/publish-github-releases.sh --push v0.1.27  # single tag
#
# Requires: gh auth login, git tags pushed to origin

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHANGELOG="$ROOT/CHANGELOG.md"
PUSH=false
SINGLE_TAG=""

for arg in "$@"; do
  case "$arg" in
    --push) PUSH=true ;;
    v*) SINGLE_TAG="$arg" ;;
  esac
done

extract_section() {
  local version="$1"
  awk -v ver="$version" '
    $0 ~ "^## " ver "$" { found=1; next }
    found && /^## / { exit }
    found { print }
  ' "$CHANGELOG" | sed '/^$/d'
}

tags=()
if [[ -n "$SINGLE_TAG" ]]; then
  tags=("$SINGLE_TAG")
else
  while IFS= read -r tag; do
    tags+=("$tag")
  done < <(git -C "$ROOT" tag -l 'v0.1.*' | sort -V)
fi

for tag in "${tags[@]}"; do
  version="${tag#v}"
  if gh release view "$tag" >/dev/null 2>&1; then
    echo "skip $tag (release exists)"
    continue
  fi
  body="$(extract_section "$version")"
  if [[ -z "$body" ]]; then
    echo "skip $tag (no CHANGELOG section for $version)"
    continue
  fi
  title="Point $tag"
  if [[ "$PUSH" == true ]]; then
    echo "creating release $tag"
    gh release create "$tag" --title "$title" --notes "$body"
  else
    echo "would create $tag ($(echo "$body" | wc -l | tr -d ' ') lines)"
  fi
done

echo "done"
