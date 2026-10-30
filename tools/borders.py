#!/usr/bin/env python3
"""Cuts the few polities our stories draw out of Cliopatria, small enough to send to a phone.

Usage: python3 -I tools/borders.py <cliopatria.geojson> content/borders

Each output file is one polity: a GeoJSON FeatureCollection with `name` and `source`, one feature per
period (`from` and `to` years, inclusive). Rings are simplified with Douglas-Peucker and islands too
small to see are dropped. content/borders/README.md says what was changed, as CC BY asks.
"""
import json
import math
import sys

SOURCE = "cliopatria-v0-2-1"
# How far a simplified ring may stray, and the smallest ring kept, both in degrees.
TOLERANCE = 0.12
MIN_AREA = 0.15
POLITIES = {
    # Stops at 1917: Cliopatria has no polity at Moscow in 1918 and 1919, and its "Russian Republic" of
    # those years is only the territory the Bolsheviks did not hold.
    "russia": {"name": "Russia", "rows": ["Russian Empire", "Russian Republic"], "years": (1900, 1917)},
    "german-empire": {"name": "German Empire", "rows": ["German Empire"], "years": (1900, 1919)},
    "soviet-union": {"name": "Soviet Union", "rows": ["Union of Soviet Socialist Republics"], "years": (1922, 1991)},
}


def stray(p, a, b):
    """Distance from p to the line through a and b."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = math.hypot(dx, dy)
    if length == 0:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    return abs(dx * (a[1] - p[1]) - dy * (a[0] - p[0])) / length


def simplify(points):
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
        if at is not None and worst > TOLERANCE:
            keep.add(at)
            todo += [(first, at), (at, last)]
    return [points[i] for i in sorted(keep)]


def area(ring):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:]))) / 2


def small_ring(ring):
    """The ring, simplified in two halves so a closed ring keeps a shape, or None when it is too small."""
    if area(ring) < MIN_AREA:
        return None
    mid = len(ring) // 2
    out = simplify(ring[: mid + 1])[:-1] + simplify(ring[mid:])
    out = [[round(x, 2), round(y, 2)] for x, y, *_ in out]
    return out if len(out) >= 4 else None


def small_polygon(rings):
    outer = small_ring(rings[0])
    if outer is None:
        return None
    return [outer] + [r for r in map(small_ring, rings[1:]) if r]


def small_geometry(g):
    polygons = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    return {"type": "MultiPolygon", "coordinates": [p for p in map(small_polygon, polygons) if p]}


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


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
