#!/usr/bin/env python3
"""Pick the story whose saved sources tonight's harvest reads (docs/loop.md, "Harvest").

Usage: python3 tools/loop/harvest-pick.py <ROOT>

Prints one research folder's name from <ROOT>/.cache/stories/research, or nothing when
none is left. The oldest folder first, then the one with the most saved texts. Left out:
folders with fewer than 15 texts, the Epstein set (its named people get a second reading
by hand), and every story already in <ROOT>/.cache/loop/harvested.tsv (story, harvest,
date, result), whatever its result.
"""
import os
import sys

MIN_TEXTS = 15


def main(root):
    research = os.path.join(root, '.cache', 'stories', 'research')
    log = os.path.join(root, '.cache', 'loop', 'harvested.tsv')
    done = set()
    if os.path.exists(log):
        with open(log) as f:
            done = {line.split('\t')[0] for line in f if line.strip()}
    rows = []
    for name in os.listdir(research):
        src = os.path.join(research, name, 'src')
        if name in done or name.startswith(('epstein', '_')) or not os.path.isdir(src):
            continue
        texts = len(os.listdir(src))
        if texts < MIN_TEXTS:
            continue
        st = os.stat(os.path.join(research, name))
        day = int(getattr(st, 'st_birthtime', st.st_mtime) // 86400)
        rows.append((day, -texts, name))
    if rows:
        print(min(rows)[2])


if __name__ == '__main__':
    main(sys.argv[1])
