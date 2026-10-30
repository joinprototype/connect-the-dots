#!/bin/bash
# Builds the site from a clean commit and sends it to Cloudflare (docs/deploy.md).
#   tools/deploy.sh        uploads a preview with its own URL; nothing goes live
#   tools/deploy.sh live   releases the version in Cargo.toml at dots.joinprototype.com
set -euo pipefail
cd "$(dirname "$0")/.."

[ -z "$(git status --porcelain)" ] || { echo "Commit first: every page names the commit it was built from." >&2; exit 1; }

version=$(sed -n 's/^version = "\(.*\)"/\1/p' Cargo.toml | head -1)
tag="v$version"
if [ "${1:-}" = live ]; then
    git fetch -q origin main
    [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "Push main first: the source of what runs must be public." >&2; exit 1; }
    if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
        echo "$tag is already out. Raise the version in Cargo.toml." >&2
        exit 1
    fi
    grep -q "^## $version " CHANGELOG.md || { echo "Add $version to CHANGELOG.md." >&2; exit 1; }
fi

# URLs never break: every entry id in the last release must still exist or be an alias.
base=$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null || echo origin/main)
cargo run --release -q -- check --base "$base"
npm --prefix web run build
cargo run --release -q -- build

export WRANGLER_SEND_METRICS=false
commit=$(git rev-parse --short HEAD)
if [ "${1:-}" = live ]; then
    npx wrangler@4 deploy --message "$tag $commit"
    git tag -a "$tag" -m "connect-the-dot $version"
    git push -q origin "$tag"
else
    npx wrangler@4 versions upload --message "$commit"
fi
