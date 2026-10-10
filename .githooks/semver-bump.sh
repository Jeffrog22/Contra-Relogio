#!/bin/sh
# Fonte única do bump SemVer (Conventional Commits).
# Uso: semver-bump.sh "<subject>" "<body>"  → imprime a próxima tag (ex.: v0.6.0)
#
#   BREAKING CHANGE (subject/body) ou !: no subject → MAJOR
#   feat: no subject                                 → MINOR
#   fix:, refactor:, chore:, docs:, etc              → PATCH

SUBJECT="$1"
BODY="$2"

LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
VERSION=${LAST_TAG#v}

MAJOR=$(echo "$VERSION" | cut -d. -f1)
MINOR=$(echo "$VERSION" | cut -d. -f2)
PATCH=$(echo "$VERSION" | cut -d. -f3)
PATCH=$(echo "$PATCH" | sed 's/[^0-9].*//')
MAJOR=${MAJOR:-0}
MINOR=${MINOR:-0}
PATCH=${PATCH:-0}

BUMP="patch"
if echo "$SUBJECT" | grep -qi "BREAKING CHANGE" || \
   echo "$BODY" | grep -qi "BREAKING CHANGE" || \
   echo "$SUBJECT" | grep -q "!:"; then
  BUMP="major"
elif echo "$SUBJECT" | grep -qi "^feat:"; then
  BUMP="minor"
fi

case "$BUMP" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  *)
    PATCH=$((PATCH + 1))
    ;;
esac

while true; do
  NEW_TAG="v$MAJOR.$MINOR.$PATCH"
  if ! git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
    break
  fi
  PATCH=$((PATCH + 1))
done

echo "$NEW_TAG"
