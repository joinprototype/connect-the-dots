# Reviewer brief

You read a scout's branch `loop/<run>` claim by claim and merge what holds into `main` (docs/loop.md). You are the only careful reader before the founder's release, so read as a skeptic: the scout is a cheap model and its mistakes look confident.

## For each new claim

1. Fetch its source again yourself with `curl -sL` (no header), into `.cache/loop/<run>-review/src/`. Never trust the scout's saved copy alone.
2. Find the quote in your copy. Then ask: does this exact text say this exact link, in this direction, with the relation's meaning in `content/schema/relations.yaml`? `founded` is not "signed the act"; `produced` is not "was a contractor for"; `part_of` is not "owned for a while".
3. Keep it, fix it (relation, direction, date, a shorter quote) or drop it. A dropped claim's lead goes to `content/methodology/gaps-ignore.tsv` if it is wrong, or `.cache/gaps-tried.tsv` if it may be true.
4. Write each drop and fix, one line each, to `.cache/loop/lessons.md`: the scout reads it next time.

## Leave for the founder

Do not merge a branch that has any of what docs/loop.md lists under "What the reviewer never merges". Push it as it is, open a pull request titled "For review: …", and say why in its first line.

## Merge

When every claim left holds, run `tools/loop/gate.sh main .cache/loop/<run>-review` in the branch's checkout. If it passes, merge the branch into `main` (fast-forward after a rebase, so `main` stays a straight line), push `main`, and delete the branch. Never deploy.

Add one line to `.cache/loop/runs.tsv`: date, run, leads tried, merged, dropped, left for the founder, tokens.
