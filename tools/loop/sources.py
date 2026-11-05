#!/usr/bin/env python3
"""The archive bot: does each source still open, and does it have a saved copy?

    python3 tools/loop/sources.py [--part N/7] [--limit K] [--write] [--out file.tsv]

Checks one part of content/sources (by default today's seventh, so every source is seen once a week),
with plain curl and no header. A source with no `archive_url` gets the Internet Archive's saved copy
closest to the day the source was read (`retrieved`) that answered 200, when one exists (--write adds it to the source file). Nothing is sent to
be saved: it only reads what the Archive already has. www.sec.gov is never fetched (it refuses
automated reads), and archive.org addresses are not checked again.

Prints a summary and writes one row per source checked: id, status, http code, archive, url.
status: ok, gone (404 or 410: the page is no more), refused (the site said no to a script, such as
403 or 429: it may well be fine in a browser), unreachable (no answer).
"""
from __future__ import annotations

import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import time
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[2]
SKIP_HOSTS = {"www.sec.gov", "sec.gov", "archive.org", "web.archive.org"}


def curl(*args: str, timeout: int = 30) -> str:
    """Plain curl: no header, no User-Agent, nothing about anyone."""
    r = subprocess.run(["curl", "-sL", "--max-time", str(timeout), *args], capture_output=True, text=True)
    return r.stdout


def status_of(url: str) -> tuple[str, str]:
    code = curl("-o", "/dev/null", "-w", "%{http_code}", url).strip() or "000"
    if code.startswith(("2", "3")):
        return "ok", code
    if code in ("404", "410"):
        return "gone", code
    if code == "000":
        return "unreachable", code
    return "refused", code


def saved_copy(url: str, when: str | None) -> str | None:
    """The Internet Archive's copy of a page closest to the day it was read (`retrieved`), if it answered 200."""
    api = "https://archive.org/wayback/available?url=" + urllib.parse.quote(url, safe="")
    if when and re.fullmatch(r"\d{4}-\d{2}-\d{2}", when):
        api += "&timestamp=" + when.replace("-", "")
    try:
        closest = json.loads(curl(api) or "{}").get("archived_snapshots", {}).get("closest") or {}
    except json.JSONDecodeError:
        return None
    if closest.get("available") and str(closest.get("status")) == "200" and closest.get("url"):
        return re.sub(r"^http://", "https://", closest["url"])
    return None


def field(text: str, name: str) -> str | None:
    m = re.search(rf"^{name}:\s*(.+?)\s*$", text, re.M)
    return m.group(1).strip().strip('"\'') if m else None


def main() -> None:
    args = sys.argv[1:]
    opt = lambda name, default=None: args[args.index(name) + 1] if name in args else default  # noqa: E731
    part = opt("--part", f"{datetime.date.today().weekday() + 1}/7")
    n, of = (int(x) for x in part.split("/"))
    limit = int(opt("--limit", "0"))
    write = "--write" in args
    out = pathlib.Path(opt("--out", str(ROOT / ".cache/sources-health.tsv")))

    files = sorted((ROOT / "content/sources").glob("*/*.yaml"))
    mine = [f for f in files if int(hashlib.sha1(f.stem.encode()).hexdigest(), 16) % of == n - 1]
    if limit:
        mine = mine[:limit]
    rows, counts, added = [], {}, 0
    for f in mine:
        text = f.read_text()
        url, archive = field(text, "url"), field(text, "archive_url")
        if not url or not url.startswith(("http://", "https://")):
            continue
        host = urllib.parse.urlsplit(url).hostname or ""
        if host in SKIP_HOSTS or host.endswith(".archive.org"):
            status, code = "skipped", "-"
        else:
            status, code = status_of(url)
        kept = "had" if archive else "none"
        if not archive and host not in ("www.sec.gov", "sec.gov"):
            copy = saved_copy(url, field(text, "retrieved"))
            time.sleep(1)  # the Archive's API is shared: one question a second
            if copy:
                kept = "added" if write else "found"
                if write:
                    f.write_text(re.sub(r"^(url:.*\n)", lambda m: m.group(1) + f"archive_url: {copy}\n", text, count=1, flags=re.M))
                    added += 1
        counts[status] = counts.get(status, 0) + 1
        rows.append("\t".join([f.stem, status, code, kept, url]))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("id\tstatus\tcode\tarchive\turl\n" + "".join(r + "\n" for r in rows))
    gone = [r.split("\t") for r in rows if r.split("\t")[1] == "gone"]
    print(f"part {part}: {len(rows)} sources, " + ", ".join(f"{v} {k}" for k, v in sorted(counts.items())) + f"; {added} saved copies added")
    for r in gone:
        print(f"  gone: {r[0]} ({r[2]}), saved copy: {r[3]}")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
