#!/usr/bin/env python3
"""Reduce what fetch.py saved to the atlas: the best-known things in the world, and the links among them.

    python3 tools/atlas/build.py [--total 1000000]

Writes .cache/atlas/entries.tsv.gz and links.tsv.gz, which `ctd build` reads. Ranked by how many
language editions of Wikipedia cover a thing: that is only a measure of how well known it is, and
no fact on the site rests on it. ADR-0023 says what comes in and how it is marked.
"""
from __future__ import annotations

import argparse
import collections
import glob
import gzip
import os
import re
import sys

RAW = ".cache/atlas/raw"
OUT = ".cache/atlas"
# share of the total for each type
SHARES = {"person": 0.42, "event": 0.07, "work": 0.15, "place": 0.17, "org": 0.12, "artifact": 0.03, "tradition": 0.01, "concept": 0.03}
# Wikidata's class tree files physics under occurrence and Islam under organization, so the order
# matters: an item takes the first of these it is in, the narrow lists before the wide ones.
PASSES = [
    ("person", ["Q5"]),
    ("tradition", ["Q9174"]),
    ("concept", ["Q11862829", "Q12136", "Q34770", "Q17737", "Q31629", "Q11344", "Q79529"]),
    ("place", ["Q6256", "Q486972", "Q56061", "Q618123", "Q811979", "Q15642541"]),
    ("artifact", ["Q7397", "Q42889", "Q11019", "Q39546", "Q2424752"]),
    ("work", ["Q17537576"]),
    ("org", ["Q43229"]),
    ("event", ["Q1656682", "Q1190554"]),
    ("concept", ["Q151885"]),
]
# never a summary line: labels on people are a rule here (CLAUDE.md), and crowd-edited text can carry them
LABELS = re.compile(r"\b(terrorist|criminal|murderer|killer|rapist|fraud\w*|convict\w*|p(a)?edophile|dictator|traitor|conspiracy theorist|"
                    r"cult leader|mobster|gangster|drug lord|extremist|racist|sex offender|whistleblower|hero|villain|tyrant|despot)\b", re.I)
MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
NOT_A_NAME = re.compile(rf"^(Category|Template|Wikipedia|Portal|Module|Help|Draft|File|Special|Project|User|MediaWiki|Talk|List of)\b|^\d{{4}}\b|\(disambiguation\)|^({MONTHS})( \d+)?$|^Wikimedia ", re.I)
DATES = {"person": (["born"], ["died"]), "org": (["inception"], ["dissolved"]), "place": (["inception"], ["dissolved"]),
         "event": (["start", "date", "inception"], ["end"]), "work": (["published", "inception"], []), "artifact": (["inception", "published"], ["dissolved"]),
         "tradition": (["inception"], ["dissolved"]), "concept": (["inception"], [])}
PERSON_LIFE = 120  # no recorded death and born within this many years: treated as living


def rows(path: str):
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as f:
        next(f, None)
        for line in f:
            yield line.rstrip("\n").split("\t")


def qid(cell: str) -> str:
    return cell.rsplit("/", 1)[-1].rstrip(">")


def text(cell: str) -> str:
    m = re.match(r'^"(.*)"(@\w+)?$', cell)
    s = m[1] if m else cell
    return s.replace('\\"', '"').replace("\\\\", "\\").replace("\t", " ")


def year(cell: str) -> int | None:
    m = re.match(r'^"?(-?\d{1,6})-', cell)
    return int(m[1]) if m else None


def relations() -> dict[str, tuple[set, set]]:
    """From content/schema/relations.yaml: which types each relation may join."""
    found = {}
    text_ = open("content/schema/relations.yaml").read()
    for name, body in re.findall(r"^([a-z_]+):\n  \{(.*)\}$", text_, re.M):
        ends = []
        for side in ("from", "to"):
            m = re.search(rf"\b{side}: (\[[^\]]*\]|\w+)", body)
            ends.append(set(re.findall(r"\w+", m[1])) if m else {"any"})
        found[name] = (ends[0], ends[1])
    return found


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--total", type=int, default=1_000_000)
    total = parser.parse_args().total
    never = {qid(r[0]) for path in glob.glob(f"{RAW}/not-*.tsv.gz") for r in rows(path) if r}
    print(f"{len(never)} left out by class", flush=True)
    classes = {qid(r[0]) for r in rows(f"{RAW}/classes.tsv.gz") if r}
    # an English name wins over the name for every language
    names = {qid(r[0]): text(r[1]) for path in glob.glob(f"{RAW}/label-mul-*.tsv.gz") for r in rows(path) if len(r) > 1}
    names.update({qid(r[0]): text(r[1]) for path in glob.glob(f"{RAW}/label-en-*.tsv.gz") for r in rows(path) if len(r) > 1})
    lines = {qid(r[0]): text(r[1]) for path in glob.glob(f"{RAW}/description-en-*.tsv.gz") for r in rows(path) if len(r) > 1}
    print(f"{len(names)} names, {len(lines)} summaries", flush=True)
    best: dict[str, tuple] = {}
    for kind, roots in PASSES:
        for root in roots:
            for r in rows(f"{RAW}/type-{kind}-{root}.tsv.gz"):
                if len(r) < 2:
                    continue
                q = qid(r[0])
                if q in never or q in best:
                    continue
                name = names.get(q, "")
                if not name or name.startswith("Q") and name[1:].isdigit() or NOT_A_NAME.search(name):
                    continue
                links = int(re.sub(r"\D", "", r[1].split("^^")[0]) or 0)
                as_type = "concept" if q in classes and kind not in ("person", "place", "tradition") else kind
                best[q] = (as_type, links, name, lines.get(q, ""))
        print(f"{kind}: {sum(1 for v in best.values() if v[0] == kind)}", flush=True)
    chosen: dict[str, tuple] = {}
    by_kind = collections.defaultdict(list)
    for q, v in best.items():
        by_kind[v[0]].append(q)
    spare = []
    for kind, share in SHARES.items():
        ranked = sorted(by_kind[kind], key=lambda q: -best[q][1])
        cut = int(total * share)
        chosen.update((q, best[q]) for q in ranked[:cut])
        spare += ranked[cut:]
    spare.sort(key=lambda q: -best[q][1])
    chosen.update((q, best[q]) for q in spare[: max(0, total - len(chosen))])
    print(f"{len(chosen)} chosen, of {len(best)}", flush=True)

    dates: dict[str, dict[str, int]] = collections.defaultdict(dict)
    for path in glob.glob(f"{RAW}/date-*.tsv.gz"):
        name = os.path.basename(path)[5:-7]
        for r in rows(path):
            if len(r) > 1 and (q := qid(r[0])) in chosen and (y := year(r[1])) is not None:
                dates[q].setdefault(name, y)
    coords: dict[str, tuple[str, str]] = {}
    for r in rows(f"{RAW}/coords.tsv.gz"):
        if len(r) > 1 and (q := qid(r[0])) in chosen and q not in coords:
            if m := re.search(r"Point\((-?[\d.]+) (-?[\d.]+)\)", r[1], re.I):
                coords[q] = (f"{float(m[1]):.4f}", f"{float(m[2]):.4f}")
    images: dict[str, str] = {}
    for r in rows(f"{RAW}/image.tsv.gz"):
        if len(r) > 1 and (q := qid(r[0])) in chosen and q not in images:
            images[q] = r[1].rsplit("/", 1)[-1].rstrip(">").rstrip('"')

    rules = relations()
    seen = set()
    written = collections.Counter()
    with gzip.open(f"{OUT}/links.tsv.gz.part", "wt", encoding="utf-8", compresslevel=4) as out:
        for path in sorted(glob.glob(f"{RAW}/link-*.tsv.gz")):
            m = re.match(r"link-(P\d+)-(\w+)\.tsv\.gz", os.path.basename(path))
            prop, rel = m[1], m[2]
            flip = prop in {"P112", "P169", "P488", "P35", "P6", "P355", "P1344", "P50", "P57", "P170", "P86", "P175", "P178", "P176", "P123", "P272"}
            allowed_from, allowed_to = rules[rel]
            for r in rows(path):
                if len(r) < 2:
                    continue
                a, b = qid(r[0]), qid(r[1])
                if flip:
                    a, b = b, a
                if a == b or a not in chosen or b not in chosen or (a, rel, b) in seen:
                    continue
                if "any" not in allowed_from and chosen[a][0] not in allowed_from:
                    continue
                if "any" not in allowed_to and chosen[b][0] not in allowed_to:
                    continue
                seen.add((a, rel, b))
                written[rel] += 1
                out.write(f"{a}\t{rel}\t{b}\n")
    os.replace(f"{OUT}/links.tsv.gz.part", f"{OUT}/links.tsv.gz")
    print(sum(written.values()), "links", written.most_common(), flush=True)

    this_year = 2026
    with gzip.open(f"{OUT}/entries.tsv.gz.part", "wt", encoding="utf-8", compresslevel=4) as out:
        for q, (kind, links, name, desc) in chosen.items():
            starts, ends = DATES[kind]
            have = dates.get(q, {})
            start = next((have[k] for k in starts if k in have), "")
            end = next((have[k] for k in ends if k in have), "")
            if kind == "person" and LABELS.search(desc):
                desc = ""
            living = kind == "person" and end == "" and start != "" and this_year - start < PERSON_LIFE
            lon, lat = coords.get(q, ("", ""))
            image = images.get(q, "")
            out.write("\t".join(map(str, (q, kind, links, name, desc, start, end, int(living), lon, lat, image))) + "\n")
    os.replace(f"{OUT}/entries.tsv.gz.part", f"{OUT}/entries.tsv.gz")
    print("done", flush=True)


if __name__ == "__main__":
    sys.exit(main())
