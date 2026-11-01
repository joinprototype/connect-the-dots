#!/usr/bin/env python3
"""Fetch the atlas: the best-known things in the world, from Wikidata (CC0), through QLever.

    python3 tools/atlas/fetch.py [--min 5]

Writes gzipped TSV to .cache/atlas/raw/, one file per query, and skips files that exist, so a run
can stop and resume. One query at a time: QLever is a shared public service.

What may come in is a whitelist. Left out on purpose: ethnicity, religion, family, party, health,
crime, and every interpretive property ("influenced by", "has cause"). ADR-0022 says why.
"""
import argparse
import gzip
import os
import sys
import time
import urllib.error
import urllib.request

ENDPOINT = "https://qlever.dev/api/wikidata"
AGENT = "connect-the-dots/0.4 (https://dots.joinprototype.com; open knowledge graph)"
RAW = ".cache/atlas/raw"
PREFIX = """PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
"""

# our type -> Wikidata classes. build.py decides which wins when an item is in several.
TYPES = {
    "person": ["Q5"],
    "event": ["Q1656682", "Q1190554"],
    "work": ["Q17537576"],
    "place": ["Q486972", "Q56061", "Q6256", "Q618123", "Q811979", "Q15642541"],
    "org": ["Q43229"],
    "artifact": ["Q2424752", "Q39546", "Q42889", "Q7397", "Q11019"],
    "tradition": ["Q9174"],
    "concept": ["Q151885", "Q11862829", "Q17737", "Q12136", "Q34770", "Q31629", "Q11344", "Q79529"],
}
# never a dot: Wikimedia's own pages, taxa, sky objects, list-like occurrences, and ethnic groups (ADR-0016)
EXCLUDED = ["Q17442446", "Q4167836", "Q11266439", "Q4167410", "Q13406463", "Q16521", "Q6999", "Q47150325", "Q18340514",
            "Q3186692", "Q577", "Q39911", "Q27020041", "Q26213387", "Q41710", "Q113145171"]
# when each thing happened
DATES = {"born": "P569", "died": "P570", "inception": "P571", "dissolved": "P576", "start": "P580", "end": "P582", "date": "P585", "published": "P577"}
# (property, our relation, reversed): Wikidata says `a P b`; reversed means the link runs b -> a
LINKS = [
    ("P19", "born_in", False), ("P27", "citizen_of", False), ("P69", "educated_at", False), ("P108", "worked_at", False),
    ("P54", "member_of", False), ("P463", "member_of", False), ("P112", "founded", True), ("P169", "ceo_of", True),
    ("P488", "chair_of", True), ("P35", "head_of", True), ("P6", "head_of", True), ("P749", "part_of", False),
    ("P355", "part_of", True), ("P361", "part_of", False), ("P159", "headquartered_in", False), ("P131", "located_in", False),
    ("P17", "located_in", False), ("P276", "located_in", False), ("P710", "involved", False), ("P1344", "involved", True),
    ("P50", "authored", True), ("P57", "produced", True), ("P170", "produced", True), ("P86", "produced", True),
    ("P175", "produced", True), ("P178", "produced", True), ("P176", "produced", True), ("P123", "produced", True),
    ("P272", "produced", True),
]


def run(name: str, query: str) -> None:
    path = f"{RAW}/{name}.tsv.gz"
    if os.path.exists(path):
        return
    req = urllib.request.Request(ENDPOINT, data=(PREFIX + query).encode(), method="POST")
    req.add_header("Accept", "text/tab-separated-values")
    req.add_header("Content-Type", "application/sparql-query")
    req.add_header("User-Agent", AGENT)
    for wait in (30, 60, 120, 300, 600, 0):
        started = time.time()
        try:
            with urllib.request.urlopen(req, timeout=1800) as res, gzip.open(path + ".part", "wb", 3) as out:
                tail = b""
                while chunk := res.read(1 << 20):
                    out.write(chunk)
                    tail = (tail + chunk)[-200:]
            # QLever answers 200 and stops mid-file when a query outruns its limit
            if b"timed out" in tail or b"Error" in tail:
                raise TimeoutError(f"cut short: {tail[-60:]!r}")
            os.rename(path + ".part", path)
            print(f"{name}: {os.path.getsize(path) >> 20} MB gzip in {time.time() - started:.0f} s", flush=True)
            time.sleep(2)
            return
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            print(f"{name}: {err}; waiting {wait} s", flush=True)
            if not wait:
                raise
            time.sleep(wait)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--min", type=int, default=5, help="fewest language editions an item needs to be fetched")
    least = parser.parse_args().min
    os.makedirs(RAW, exist_ok=True)
    known = f"wikibase:sitelinks ?s . FILTER(?s >= {least})"
    for kind, roots in TYPES.items():
        for root in roots:
            path = "wdt:P31" if kind == "person" else "wdt:P31/wdt:P279*"
            run(f"type-{kind}-{root}", f"SELECT DISTINCT ?i ?s WHERE {{ ?i {known} ?i {path} wd:{root} }}")
    # names apart from types: joined in one query they outrun the service's time limit. Many names now
    # sit under "mul", the label for every language, with no English copy.
    # And cut by how well known a thing is: millions of rows in one go also outrun it.
    bands = [(least, 6), (6, 7), (7, 8), (8, 10), (10, 13), (13, 18), (18, 30), (30, 100000)]
    for low, high in bands:
        band = f"wikibase:sitelinks ?s . FILTER(?s >= {low} && ?s < {high})"
        for lang in ("en", "mul"):
            run(f"label-{lang}-{low}", f'SELECT ?i ?v WHERE {{ ?i {band} ?i rdfs:label ?v . FILTER(LANG(?v) = "{lang}") }}')
        run(f"description-en-{low}", f'SELECT ?i ?v WHERE {{ ?i {band} ?i schema:description ?v . FILTER(LANG(?v) = "en") }}')
    # a class of things ("priest", "airplane") is a concept, whatever else its parents make it
    run("classes", f"SELECT DISTINCT ?i WHERE {{ ?i {known} ?i wdt:P279 ?c }}")
    for root in EXCLUDED:
        run(f"not-{root}", f"SELECT DISTINCT ?i WHERE {{ ?i {known} ?i wdt:P31/wdt:P279* wd:{root} }}")
    for name, prop in DATES.items():
        run(f"date-{name}", f"SELECT ?i ?v WHERE {{ ?i {known} ?i wdt:{prop} ?v }}")
    run("coords", f"SELECT ?i ?v WHERE {{ ?i {known} ?i wdt:P625 ?v }}")
    run("image", f"SELECT ?i ?v WHERE {{ ?i {known} ?i wdt:P18 ?v }}")
    for prop, rel, _ in LINKS:
        run(f"link-{prop}-{rel}", f"""SELECT ?a ?b WHERE {{ ?a {known} ?a wdt:{prop} ?b .
          ?b wikibase:sitelinks ?t . FILTER(?t >= {least}) }}""")


if __name__ == "__main__":
    sys.exit(main())
