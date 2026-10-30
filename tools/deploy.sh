#!/bin/bash
# Builds the site from a clean commit and sends it to Cloudflare (docs/deploy.md).
#   tools/deploy.sh        uploads a preview with its own URL; nothing goes live
#   tools/deploy.sh live   production at dots.joinprototype.com
set -euo pipefail
cd "$(dirname "$0")/.."

[ -z "$(git status --porcelain)" ] || { echo "Commit first: every page names the commit it was built from." >&2; exit 1; }

# URLs never break: every entry id that is live now must still exist or be an alias.
base=deployed
git rev-parse -q --verify "$base" >/dev/null || base=origin/main
cargo run --release -q -- check --base "$base"
npm --prefix web run build
cargo run --release -q -- build

export WRANGLER_SEND_METRICS=false
commit=$(git rev-parse --short HEAD)
if [ "${1:-}" = live ]; then
    npx wrangler@4 deploy --message "$commit"
    git tag -f deployed
else
    npx wrangler@4 versions upload --message "$commit"
fi
