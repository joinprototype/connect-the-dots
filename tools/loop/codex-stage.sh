#!/bin/bash
# One stage of a nightly run on OpenAI's Codex (ADR-0038): a story or a leads run. The prompt comes on stdin.
#   tools/loop/codex-stage.sh <worktree> <run dir> <stage name> < prompt
# Codex runs without the user's config, so no plugin, connector or browser is loaded; its sandbox may
# write only in the worktree and one workspace folder ($CODEX_ADD_DIR, by default .cache/stories; a
# leads run passes .cache/loop), and it may use the network for plain curl. It does not commit: the
# run commits after the checks. Every event goes to
# <run dir>/<stage>.jsonl, which the run greps for request headers and personal details.
set -euo pipefail
WT=$(cd "$1" && pwd)
RUN_DIR=$2
STAGE=$3
ROOT=$(dirname "$(git -C "$WT" rev-parse --path-format=absolute --git-common-dir)")
S=$ROOT/.cache/stories
mkdir -p "$RUN_DIR"
codex exec \
  --ignore-user-config \
  -m "${CODEX_MODEL:-gpt-6.1-sol}" \
  -c model_reasoning_effort="\"${CODEX_EFFORT:-medium}\"" \
  -c approval_policy='"never"' \
  -s workspace-write \
  -c sandbox_workspace_write.network_access=true \
  -C "$WT" \
  --add-dir "${CODEX_ADD_DIR:-$S}" \
  --json \
  -o "$RUN_DIR/$STAGE.txt" \
  - > "$RUN_DIR/$STAGE.jsonl"
# what the run reads: the agent's last message and the tokens it used
cat "$RUN_DIR/$STAGE.txt"
grep -o '"usage":{[^}]*}' "$RUN_DIR/$STAGE.jsonl" | tail -1 || true
