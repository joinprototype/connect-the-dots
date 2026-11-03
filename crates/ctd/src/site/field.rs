//! `data/field.bin` and `data/field.json`: the world as a field of dots, the picture Read draws behind a
//! story and others may reuse (`web/src/lib/dotfield.ts`). Every thing open data places on the Earth is
//! one grey dot, so the land shows itself where things are dense. The written places are named on top.
//!
//! A dot is its place on the web map's square (Web Mercator, 0 to 1 each way) in 65,536ths. The dots
//! are sorted along a Z curve (their bits interleaved, x first), and the file holds each one's step
//! from the one before as a varint (LEB128), so that neighbours cost a byte or two.

use std::{collections::HashSet, path::Path};

use anyhow::Result;
use serde_json::json;

use super::{data, write};
use crate::{atlas::Atlas, kb::Kb};

/// What the picture may weigh, in gzip bytes (docs/data-contract.md): past it the build warns.
pub const BUDGET: usize = 1024 * 1024;

/// A point's place on the web map's square, in 65,536ths, as `dotfield.ts` reads it.
fn square([lon, lat]: [f64; 2]) -> [u16; 2] {
    let lat = lat.clamp(-85.0, 85.0).to_radians();
    let x = (lon + 180.0) / 360.0;
    let y = (1.0 - (lat.tan() + 1.0 / lat.cos()).ln() / std::f64::consts::PI) / 2.0;
    [x, y].map(|v| (v * 65536.0).clamp(0.0, 65535.0) as u16)
}

/// The bits of `v` spread out with a zero between each.
fn spread(v: u16) -> u32 {
    let mut v = v as u32;
    v = (v | (v << 8)) & 0x00ff_00ff;
    v = (v | (v << 4)) & 0x0f0f_0f0f;
    v = (v | (v << 2)) & 0x3333_3333;
    (v | (v << 1)) & 0x5555_5555
}

/// The dots, ready to write: steps along the Z curve as varints.
pub fn dots(points: impl Iterator<Item = [f64; 2]>) -> (usize, Vec<u8>) {
    let mut codes: Vec<u32> = points.map(square).map(|[x, y]| spread(x) | (spread(y) << 1)).collect();
    codes.sort_unstable();
    let mut out = Vec::with_capacity(codes.len() * 2);
    let mut last = 0;
    for &c in &codes {
        let mut step = c - last;
        last = c;
        while step >= 0x80 {
            out.push((step as u8 & 0x7f) | 0x80);
            step >>= 7;
        }
        out.push(step as u8);
    }
    (codes.len(), out)
}

/// Writes both files. Open data's things are dots, but a person's coordinates are a grave, not a
/// life, so people are left out, as on the Earth; the written entries with coordinates of their own
/// are dots too. The named places are the written ones, best connected first, never one that is
/// sealed or about a sealed entry (ADR-0027), nor one named after a sealed person.
pub fn write_field(kb: &Kb, atlas: Option<&Atlas>, out: &Path) -> Result<()> {
    let open = atlas.into_iter().flat_map(|a| &a.entries).filter(|e| e.kind() != "person").filter_map(|e| e.coords).map(|[lon, lat]| [lon as f64, lat as f64]);
    let written = kb.entities.iter().filter(|e| e.kind != "person").filter_map(|e| e.coords);
    let (count, bytes) = dots(open.chain(written));
    let gz = data::gzip_len(&bytes);
    if gz > BUDGET {
        eprintln!("warning: data/field.bin is {} KB gzip, past its {} KB budget", gz / 1024, BUDGET / 1024);
    }
    let sealed = kb.sealed();
    let names: Vec<&str> = kb.entities.iter().filter(|e| e.sealed).map(|e| e.name.as_str()).collect();
    // the types that are points on the map (entity-types.yaml)
    let mapped: Vec<&String> = kb.schema.types.iter().filter(|(_, t)| t.map).map(|(id, _)| id).collect();
    let ink = mapped.first().map(|t| kb.schema.type_color(t));
    let mut places: Vec<(usize, &crate::kb::Entity, [f64; 2])> = kb
        .entities
        .iter()
        .filter(|e| mapped.contains(&&e.kind) && !sealed.contains(e.id.as_str()) && !names.iter().any(|n| e.name.contains(n)))
        .filter_map(|e| Some((kb.degree(&e.id), e, e.coords?)))
        .collect();
    places.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.name.cmp(&b.1.name)));
    let mut seen = HashSet::new();
    let places: Vec<_> = places
        .into_iter()
        .filter(|(_, e, _)| seen.insert(e.id.as_str()))
        .map(|(degree, e, [lon, lat])| json!([e.id, e.name, (lon * 1e4).round() / 1e4, (lat * 1e4).round() / 1e4, degree]))
        .collect();
    write(&out.join("data").join("field.bin"), bytes)?;
    write(&out.join("data").join("field.json"), serde_json::to_vec(&json!({ "dots": count, "ink": ink, "places": places }))?)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The reading `dotfield.ts` does, here to check the writing.
    fn read(bytes: &[u8]) -> Vec<[u16; 2]> {
        let gather = |c: u32| {
            let mut v = c & 0x5555_5555;
            v = (v | (v >> 1)) & 0x3333_3333;
            v = (v | (v >> 2)) & 0x0f0f_0f0f;
            v = (v | (v >> 4)) & 0x00ff_00ff;
            ((v | (v >> 8)) & 0xffff) as u16
        };
        let (mut out, mut code, mut step, mut shift) = (Vec::new(), 0u32, 0u32, 0);
        for &b in bytes {
            step |= ((b & 0x7f) as u32) << shift;
            shift += 7;
            if b < 0x80 {
                code += step;
                out.push([gather(code), gather(code >> 1)]);
                (step, shift) = (0, 0);
            }
        }
        out
    }

    #[test]
    fn dots_come_back_where_they_were() {
        let points = [[2.35, 48.86], [-74.0, 40.7], [2.35, 48.86], [151.2, -33.9], [-180.0, 85.0], [180.0, -85.0]];
        let (n, bytes) = dots(points.into_iter());
        assert_eq!(n, 6);
        let mut back = read(&bytes);
        let mut want: Vec<[u16; 2]> = points.iter().map(|&p| square(p)).collect();
        back.sort_unstable();
        want.sort_unstable();
        assert_eq!(back, want, "the same dots, a twin kept");
        assert_eq!(square([0.0, 0.0]), [32768, 32768], "the middle of the square");
    }
}
