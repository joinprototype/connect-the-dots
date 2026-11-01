#!/usr/bin/env python3
"""Write each entry's Wikidata id and, where Wikimedia Commons has one under a free license, its image.

    python3 tools/atlas/link.py

Reads .cache/atlas/matches.tsv from match.py, after reviewing it, and tools/atlas/corrections.tsv.
"""
import glob
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request

AGENT = "connect-the-dots/0.4 (https://dots.joinprototype.com; open knowledge graph)"
FREE = re.compile(r"^(public domain|pd\b|cc0|cc[ -]by(-sa)?\b)", re.I)
UNFREE = re.compile(r"\b(nc|nd)\b|non-?commercial|fair use", re.I)
# no picture of a prophet or a religion's symbol: for many readers that is not a neutral thing to show
NO_PICTURE_TYPES = {"tradition", "concept", "group"}
# nor a war's collage, which may show the dead, nor a chart that says nothing to a reader
NO_PICTURE = {"jesus", "muhammad", "moses", "abraham", "world-war-ii", "financial-crisis-of-2008"}


def get(base: str, **params) -> dict:
    url = base + "?" + urllib.parse.urlencode({"format": "json", **params})
    req = urllib.request.Request(url, headers={"User-Agent": AGENT})
    for wait in (5, 20, 60, 0):
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                return json.load(res)
        except OSError:
            time.sleep(wait)
    return {}


def plain(text: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", text))).strip()


def main() -> None:
    fixes = dict(l.rstrip("\n").split("\t") for l in open("tools/atlas/corrections.tsv") if not l.startswith("#"))
    qid: dict[str, str] = {}
    for line in open(".cache/atlas/matches.tsv"):
        f = line.rstrip("\n").split("\t")
        q = fixes.get(f[0], f[3])
        if q.startswith("Q"):
            qid[f[0]] = q
    # entries that came with their id: they want a picture too
    done = {}
    for path in glob.glob("content/entities/*/*/*.md"):
        head = open(path).read().split("\n---", 1)[0]
        if (m := re.search(r"^same_as:.*wikidata: (Q\d+)", head, re.M)) and not re.search(r"^image:", head, re.M):
            done[re.search(r"^id: (.+)$", head, re.M)[1]] = m[1]
    qid.update(done)
    ids = sorted(set(qid.values()))
    pictures: dict[str, str] = {}
    for i in range(0, len(ids), 50):
        got = get("https://www.wikidata.org/w/api.php", action="wbgetentities", ids="|".join(ids[i : i + 50]), props="claims")
        for q, item in got.get("entities", {}).items():
            claims = item.get("claims", {}).get("P18", [])
            if claims and claims[0]["mainsnak"].get("datavalue"):
                pictures[q] = claims[0]["mainsnak"]["datavalue"]["value"]
        time.sleep(0.2)
    names = sorted(set(pictures.values()))
    info: dict[str, dict] = {}
    for i in range(0, len(names), 40):
        titles = "|".join("File:" + n for n in names[i : i + 40])
        got = get("https://commons.wikimedia.org/w/api.php", action="query", prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=640, titles=titles)
        for page in got.get("query", {}).get("pages", {}).values():
            if page.get("imageinfo"):
                info[page["title"].removeprefix("File:").replace("_", " ")] = page["imageinfo"][0]
        time.sleep(0.2)
    linked = pictured = 0
    for path in glob.glob("content/entities/*/*/*.md"):
        text = open(path).read()
        head, sep, body = text[3:].partition("\n---")
        eid = re.search(r"^id: (.+)$", head, re.M)[1]
        kind = re.search(r"^type: (.+)$", head, re.M)[1]
        q = qid.get(eid)
        if not q:
            continue
        add = []
        if re.search(r"^same_as:.*wikidata", head, re.M):
            pass
        elif re.search(r"^same_as: \{", head, re.M):
            head = re.sub(r"^same_as: \{", f"same_as: {{wikidata: {q}, ", head, flags=re.M)
        else:
            add.append(f"same_as: {{wikidata: {q}}}")
        linked += 1
        im = info.get(pictures.get(q, "").replace("_", " "))
        if im and kind not in NO_PICTURE_TYPES and eid not in NO_PICTURE and not re.search(r"^image:", head, re.M):
            meta = im.get("extmetadata", {})
            lic = plain(meta.get("LicenseShortName", {}).get("value", ""))
            author = plain(meta.get("Artist", {}).get("value", ""))[:90]
            if FREE.search(lic) and not UNFREE.search(lic):
                add.append(f"image: {{url: {json.dumps(im['thumburl'].split('?')[0])}, license: {json.dumps(lic)}, author: {json.dumps(author or 'Unknown')}, page: {json.dumps(im['descriptionurl'])}}}")
                pictured += 1
        if add:
            head = re.sub(r"^(summary:.*)$", lambda m: m[1] + "\n" + "\n".join(add), head, count=1, flags=re.M)
        open(path, "w").write("---" + head + sep + body)
    print(f"{linked} linked, {pictured} with a free image")


if __name__ == "__main__":
    sys.exit(main())
