#!/usr/bin/env python3
"""Find each entry's Wikidata item, by name and type. Prints a table to review; writes nothing else.

    python3 tools/atlas/match.py > .cache/atlas/matches.tsv

A match is a lead, not a fact: a wrong one would put another person's picture on a page.
"""
import glob
import json
import re
import sys
import time
import urllib.parse
import urllib.request

API = "https://www.wikidata.org/w/api.php"
AGENT = "connect-the-dots/0.4 (https://dots.joinprototype.com; open knowledge graph)"
HUMAN, DISAMBIGUATION = "Q5", "Q4167410"


def api(**params) -> dict:
    url = API + "?" + urllib.parse.urlencode({"format": "json", "maxlag": 5, **params})
    req = urllib.request.Request(url, headers={"User-Agent": AGENT})
    for wait in (5, 20, 60, 0):
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                data = json.load(res)
            if "error" not in data:
                return data
        except OSError:
            pass
        time.sleep(wait)
    return {}


def entries() -> list[dict]:
    found = []
    for path in glob.glob("content/entities/*/*/*.md"):
        head = open(path).read().split("\n---", 1)[0]
        field = lambda k: (re.search(rf"^{k}: *(.+)$", head, re.M) or [None, ""])[1].strip().strip('"')
        found.append({"id": field("id"), "type": field("type"), "when": field("when"), "name": field("name"), "path": path})
    return sorted(found, key=lambda e: e["id"])


def values(item: dict, prop: str) -> list:
    return [c["mainsnak"].get("datavalue", {}).get("value") for c in item.get("claims", {}).get(prop, [])]


def main() -> None:
    all_entries = entries()
    leads: dict[str, list[str]] = {}
    for e in all_entries:
        found = api(action="wbsearchentities", search=e["name"], language="en", type="item", limit=6).get("search", [])
        leads[e["id"]] = [h["id"] for h in found]
        time.sleep(0.15)
    ids = sorted({q for qs in leads.values() for q in qs})
    items: dict[str, dict] = {}
    for i in range(0, len(ids), 50):
        got = api(action="wbgetentities", ids="|".join(ids[i : i + 50]), props="claims|descriptions|labels|sitelinks", languages="en")
        items.update(got.get("entities", {}))
        time.sleep(0.15)
    for e in all_entries:
        best = None
        for q in leads[e["id"]]:
            it = items.get(q, {})
            classes = {v["id"] for v in values(it, "P31") if isinstance(v, dict)}
            if DISAMBIGUATION in classes or (HUMAN in classes) != (e["type"] == "person"):
                continue
            exact = it.get("labels", {}).get("en", {}).get("value") == e["name"]
            key = (exact, len(it.get("sitelinks", {})))
            if best is None or key > best[0]:
                best = (key, q, it)
        if not best:
            print(e["id"], e["type"], e["when"], "NONE", "", "", "", "", "", sep="\t")
            continue
        (exact, links), q, it = best
        born = next((v["time"][1:5] for v in values(it, "P569") if isinstance(v, dict)), "")
        year = e["when"][:4] if re.match(r"\d{4}", e["when"]) else ""
        flags = ("" if exact else "NAME ") + ("DATE" if e["type"] == "person" and year and born and year != born else "")
        image = next((v for v in values(it, "P18") if isinstance(v, str)), "")
        desc = it.get("descriptions", {}).get("en", {}).get("value", "")
        print(e["id"], e["type"], e["when"], q, links, born, desc[:64], flags.strip(), image, sep="\t")


if __name__ == "__main__":
    sys.exit(main())
