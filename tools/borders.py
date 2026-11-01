#!/usr/bin/env python3
"""Cuts Cliopatria into what our maps draw, small enough to send to a phone.

Usage: python3 -I tools/borders.py <cliopatria.geojson> content/borders

Two kinds of file, both GeoJSON FeatureCollections with `name` and `source`:
- one per polity a story draws, with one feature per period (`from` and `to` years, inclusive);
- `world-<year>.json`, every polity of that year for the Map's era slider, largest first, each with
  its `name`, a shade (`tone`) and a point for its name (`at`).

Rings are simplified with Douglas-Peucker and islands too small to see are dropped.
content/borders/README.md says what was changed, as CC BY asks.
"""
import json
import math
import sys

SOURCE = "cliopatria-v0-2-1"
# How far a simplified ring may stray, and the smallest ring kept, both in degrees.
TOLERANCE = 0.12
MIN_AREA = 0.15
# The years of the era slider's stops (TICKS in web/src/world/era.ts). It stops before today's contested borders.
# Years count like the site's dates: 0 is 1 BCE, so -2999 is 3000 BCE.
WORLD_YEARS = [-2999, -2499, -1999, -1499, -999, -499, 1, 500, 1000, *range(1100, 1801, 100), 1825, 1850, 1875, 1900, *range(1910, 1991, 10)]
WORLD_TOLERANCE = 0.15
WORLD_MIN_AREA = 0.3
# Cliopatria's formal names, where a plain one is what a reader knows.
PLAIN_NAMES = {
    "Union of Soviet Socialist Republics": "Soviet Union",
    "United States of America": "United States",
    "Communist Cuba": "Cuba",
}
POLITIES = {
    # Stops at 1917: Cliopatria has no polity at Moscow in 1918 and 1919, and its "Russian Republic" of
    # those years is only the territory the Bolsheviks did not hold.
    "russia": {"name": "Russia", "rows": ["Russian Empire", "Russian Republic"], "years": (1900, 1917)},
    "german-empire": {"name": "German Empire", "rows": ["German Empire"], "years": (1900, 1919)},
    "soviet-union": {"name": "Soviet Union", "rows": ["Union of Soviet Socialist Republics"], "years": (1922, 1991)},
    "united-states": {"name": "United States", "rows": ["United States of America"], "years": (1950, 1970)},
    "cuba": {"name": "Cuba", "rows": ["Communist Cuba"], "years": (1960, 1970)},
    "turkey": {"name": "Turkey", "rows": ["Republic of Turkey"], "years": (1950, 1970)},
    "sumer": {"name": "Sumerian city-states", "rows": ["Sumerian City-States"], "years": (-3400, -3001)},
    "egypt-middle-kingdom": {"name": "Egypt, Middle Kingdom", "rows": ["Middle Kingdom of Egypt"], "years": (-1800, -1601)},
    "phoenicia": {"name": "Phoenicia", "rows": ["Phoenicia"], "years": (-1000, -801)},
    "ptolemaic-kingdom": {"name": "Ptolemaic Kingdom", "rows": ["Ptolemaic Kingdom"], "years": (-256, -248)},
    "roman-empire": {"name": "Roman Empire", "rows": ["Roman Empire"], "years": (383, 386)},
    "holy-roman-empire": {"name": "Holy Roman Empire", "rows": ["(Holy Roman Empire)"], "years": (1450, 1460)},
}


def stray(p, a, b):
    """Distance from p to the line through a and b."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = math.hypot(dx, dy)
    if length == 0:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    return abs(dx * (a[1] - p[1]) - dy * (a[0] - p[0])) / length


def simplify(points, tolerance=TOLERANCE):
    """Douglas-Peucker, without recursion: long rings would run out of stack."""
    keep = {0, len(points) - 1}
    todo = [(0, len(points) - 1)]
    while todo:
        first, last = todo.pop()
        worst, at = 0.0, None
        for i in range(first + 1, last):
            d = stray(points[i], points[first], points[last])
            if d > worst:
                worst, at = d, i
        if at is not None and worst > tolerance:
            keep.add(at)
            todo += [(first, at), (at, last)]
    return [points[i] for i in sorted(keep)]


def area(ring):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:]))) / 2


def small_ring(ring, tolerance=TOLERANCE, min_area=MIN_AREA):
    """The ring, simplified in two halves so a closed ring keeps a shape, or None when it is too small."""
    if area(ring) < min_area:
        return None
    mid = len(ring) // 2
    out = simplify(ring[: mid + 1], tolerance)[:-1] + simplify(ring[mid:], tolerance)
    out = [[round(x, 2), round(y, 2)] for x, y, *_ in out]
    return out if len(out) >= 4 else None


def small_polygon(rings, tolerance=TOLERANCE, min_area=MIN_AREA):
    outer = small_ring(rings[0], tolerance, min_area)
    if outer is None:
        return None
    return [outer] + [r for r in (small_ring(x, tolerance, min_area) for x in rings[1:]) if r]


def small_geometry(g, tolerance=TOLERANCE, min_area=MIN_AREA):
    polygons = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    return {"type": "MultiPolygon", "coordinates": [p for p in (small_polygon(x, tolerance, min_area) for x in polygons) if p]}


def inside(p, ring):
    """Even-odd test: is the point inside the ring?"""
    x, y = p
    hit = False
    for (ax, ay), (bx, by) in zip(ring, ring[1:]):
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx - ax) / (by - ay):
            hit = not hit
    return hit


def edge_distance(p, ring):
    """Distance from the point to the nearest segment of the ring."""
    best = math.inf
    for a, b in zip(ring, ring[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy or 1)))
        best = min(best, math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy))
    return best


def name_point(geometry):
    """Where a polity's name goes: the point of a grid over its largest shape that lies deepest inside."""
    ring = max((p[0] for p in geometry["coordinates"]), key=area)
    xs, ys = [q[0] for q in ring], [q[1] for q in ring]
    x0, y0, w, h = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
    grid = [(x0 + w * (i + 0.5) / 16, y0 + h * (j + 0.5) / 16) for i in range(16) for j in range(16)]
    best = max((p for p in grid if inside(p, ring)), key=lambda p: edge_distance(p, ring), default=(x0 + w / 2, y0 + h / 2))
    return [round(best[0], 2), round(best[1], 2)]


def tone(name):
    """A shade, 0 to 2, that stays with the name from year to year, so neighbours mostly differ."""
    return sum(map(ord, name)) % 3


def plain_name(name):
    name = name.strip("()")
    return PLAIN_NAMES.get(name, name)


def world_rows(features, year):
    """The polities of a year, once each. A relation (an alliance, a personal union) is drawn as its
    members; an empire with members is drawn whole, without them."""
    rows = [f for f in features if f["properties"]["FromYear"] <= year <= f["properties"]["ToYear"]]
    relations = {f["properties"]["Name"] for f in rows if f["properties"]["Type"] == "RELATION"}

    def counted(p):
        parents = [x for x in (p["MemberOf"] or "").split(";") if x]
        return p["Type"] == "POLITY" and all(x in relations for x in parents)

    kept = [f for f in rows if counted(f["properties"])]
    return sorted(kept, key=lambda f: (-f["properties"]["Area"], f["properties"]["Name"]))


def year_name(year):
    return f"{1 - year} BCE" if year <= 0 else str(year)


def write_world(features, out):
    for year in WORLD_YEARS:
        cut = []
        for f in world_rows(features, year):
            geometry = small_geometry(f["geometry"], WORLD_TOLERANCE, WORLD_MIN_AREA)
            if geometry["coordinates"]:
                name = plain_name(f["properties"]["Name"])
                props = {"from": year, "to": year, "name": name, "tone": tone(name), "at": name_point(geometry)}
                cut.append({"type": "Feature", "properties": props, "geometry": geometry})
        path = f"{out}/world-{year_name(year).lower().replace(' ', '-')}.json"
        with open(path, "w", encoding="utf-8") as w:
            json.dump({"type": "FeatureCollection", "name": f"The world in {year_name(year)}", "source": SOURCE, "features": cut}, w, separators=(",", ":"))
            w.write("\n")
        points = sum(len(r) for f in cut for p in f["geometry"]["coordinates"] for r in p)
        print(f"{path}: {len(cut)} polities, {points} points")


def main(source, out):
    features = json.load(open(source, encoding="utf-8"))["features"]
    for slug, polity in POLITIES.items():
        low, high = polity["years"]
        rows = [f for f in features if f["properties"].get("Name") in polity["rows"] and f["properties"]["ToYear"] >= low and f["properties"]["FromYear"] <= high]
        rows.sort(key=lambda f: f["properties"]["FromYear"])
        cut = [
            {"type": "Feature", "properties": {"from": f["properties"]["FromYear"], "to": f["properties"]["ToYear"]}, "geometry": small_geometry(f["geometry"])}
            for f in rows
        ]
        path = f"{out}/{slug}.json"
        with open(path, "w", encoding="utf-8") as w:
            json.dump({"type": "FeatureCollection", "name": polity["name"], "source": SOURCE, "features": cut}, w, separators=(",", ":"))
            w.write("\n")
        points = sum(len(r) for f in cut for p in f["geometry"]["coordinates"] for r in p)
        print(f"{path}: {len(cut)} periods, {points} points")
    write_world(features, out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
