#!/usr/bin/env bash
# The loop's gate (docs/loop.md): what a scout's branch must pass before the reviewer reads it, and again
# before the reviewer merges it. Nothing here judges meaning; it only refuses what is mechanically wrong.
#   tools/loop/gate.sh <base ref> <run dir>
# Run it in the checkout of the branch. <run dir> holds the saved text of every source the branch quotes,
# under src/ (tools/qa/quotecheck.py). $CTD names an engine to use instead of building this checkout's.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
base=${1:?base ref, such as main}
run=${2:?the run folder, with the saved text under src/}
fail() { echo "gate: $*" >&2; exit 1; }

# 1. only the record changes: no code, no templates, no tools, no rules
changed=$(git diff --name-only "$base"...HEAD)
[ -n "$changed" ] || fail "nothing changed"
others=$(printf '%s\n' "$changed" | command grep -vE '^content/(entities|sources|chapters)/|^content/methodology/gaps-ignore\.tsv$' || true)
[ -z "$others" ] || fail "only entries, sources, stories and gaps-ignore.tsv may change, not:
$others"

# 2. nothing personal and no disguised fetches, in the change or in the run's scripts: no browser
#    User-Agent, and not the address of whoever runs this (read here, never written down)
me=$(git config user.email || true)
personal="Mozilla/5\.0|User-Agent:|--user-agent${me:+|$(printf '%s' "$me" | sed 's/[.[\*^$()+?{|]/\\&/g')}"
if git diff "$base"...HEAD | command grep -nE "$personal"; then fail "a request header or a personal detail is in the change"; fi
if command grep -rlE "$personal|curl[^|]* -A " "$run" --include='*.sh' --include='*.py' --include='*.mjs' 2>/dev/null; then fail "a run script sets a User-Agent or holds a personal detail"; fi

# 3. small enough for one careful read
quotes=$(git diff "$base"...HEAD -- content | command grep -cE '^\+.*quote: ' || true)
[ "$quotes" -le 40 ] || fail "$quotes new quotes: at most 40 in one change"

# 4. the record holds, and every old address still works
${CTD:-cargo run -q --release --} check --base "$base"

# 5. every new quote stands word for word in saved text
python3 tools/qa/quotecheck.py "$run" "$base"
echo "gate: passed ($quotes new quotes)"
