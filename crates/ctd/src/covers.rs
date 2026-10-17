//! Generated covers: every entry and story gets a book-like cover, its title set in the reading
//! serif above a drawing of its own links. Deterministic (same id, same cover), neutral ink on
//! paper with one accent. Colors that must follow light/dark mode use CSS variables in `style`.

use std::fmt::Write;

use crate::{markdown::escape as esc, world::Rng};

const W: f64 = 300.0;
const H: f64 = 400.0;
const INK: &str = "#8e8e93";
const LINE: &str = "#c7c7cc";
const ACCENT: &str = "#0066cc";

fn seed(id: &str) -> u64 {
    // FNV-1a
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in id.bytes() {
        h ^= b as u64;
        h = h.wrapping_mul(0x0100_0000_01b3);
    }
    h
}

/// Covers are decorative: the title always appears as text next to them, so screen readers skip them.
fn open() -> String {
    format!(
        r##"<svg class="cover-art" viewBox="0 0 {W} {H}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice"><rect width="{W}" height="{H}" style="fill:var(--cover,#f5f5f7)"/>"##
    )
}

/// The title, top left like a book cover: greedy-wrapped, at most four lines.
fn title(svg: &mut String, label: &str) {
    let size = if label.chars().count() > 34 { 25.0 } else { 31.0 };
    let per_line = ((W - 52.0) / (size * 0.52)) as usize;
    let mut lines: Vec<String> = Vec::new();
    for word in label.split_whitespace() {
        match lines.last_mut() {
            Some(l) if l.chars().count() + 1 + word.chars().count() <= per_line => {
                l.push(' ');
                l.push_str(word);
            }
            _ => lines.push(word.to_string()),
        }
    }
    if lines.len() > 4 {
        lines.truncate(4);
        if let Some(l) = lines.last_mut() {
            l.push('…');
        }
    }
    let _ = write!(
        svg,
        r#"<text x="26" y="{:.0}" style="fill:var(--ink,#1d1d1f);font:600 {size}px ui-serif,'New York','Iowan Old Style',Georgia,serif;letter-spacing:-0.3px">"#,
        24.0 + size
    );
    for (i, l) in lines.iter().enumerate() {
        let dy = if i == 0 { 0.0 } else { size * 1.12 };
        let _ = write!(svg, r#"<tspan x="26" dy="{dy:.1}">{}</tspan>"#, esc(l));
    }
    svg.push_str("</text>");
}

/// Faint background dots, kept below the title.
fn stars(svg: &mut String, rng: &mut Rng, n: usize) {
    for _ in 0..n {
        let (x, y, r) = (rng.f() * W, 190.0 + rng.f() * (H - 200.0), 0.8 + rng.f() * 1.4);
        let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="{r:.1}" fill="{LINE}"/>"#);
    }
}

/// A constellation: the entry at the centre, its links around it (count = `links`).
pub fn entity(id: &str, label: &str, links: usize) -> String {
    let mut rng = Rng(seed(id));
    let mut svg = open();
    title(&mut svg, label);
    stars(&mut svg, &mut rng, 7);
    let n = links.clamp(3, 16);
    let (cx, cy) = (W / 2.0, 272.0);
    let rot = rng.f() * std::f64::consts::TAU;
    let mut pts = Vec::with_capacity(n);
    for i in 0..n {
        let a = rot + i as f64 / n as f64 * std::f64::consts::TAU + (rng.f() - 0.5) * 0.35;
        let r = 50.0 + rng.f() * 34.0;
        pts.push((cx + r * a.cos(), cy + r * a.sin()));
    }
    // a few second-degree links for texture
    for i in 0..n {
        if rng.f() < 0.35 {
            let j = (i + 1 + (rng.f() * 3.0) as usize) % n;
            let _ = write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{LINE}" stroke-width="1"/>"#, pts[i].0, pts[i].1, pts[j].0, pts[j].1);
        }
    }
    for &(x, y) in &pts {
        let _ = write!(svg, r#"<line x1="{cx:.1}" y1="{cy:.1}" x2="{x:.1}" y2="{y:.1}" stroke="{LINE}" stroke-width="1.6"/>"#);
    }
    for &(x, y) in &pts {
        let r = 3.6 + rng.f() * 3.0;
        let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="{r:.1}" fill="{INK}"/>"#);
    }
    let _ = write!(svg, r#"<circle cx="{cx:.1}" cy="{cy:.1}" r="17" fill="{ACCENT}" fill-opacity="0.16"/><circle cx="{cx:.1}" cy="{cy:.1}" r="10" fill="{ACCENT}"/>"#);
    svg.push_str("</svg>");
    svg
}

/// A route: `stops` dots joined left to right, first and last emphasised.
pub fn route(id: &str, label: &str, stops: usize) -> String {
    let mut rng = Rng(seed(id));
    let mut svg = open();
    title(&mut svg, label);
    stars(&mut svg, &mut rng, 9);
    let n = stops.clamp(2, 12);
    let pts: Vec<(f64, f64)> = (0..n)
        .map(|i| {
            let t = i as f64 / (n - 1) as f64;
            (36.0 + t * (W - 72.0), 290.0 + (rng.f() - 0.5) * 110.0 * (1.0 - (2.0 * t - 1.0).powi(2)).max(0.25))
        })
        .collect();
    let d: Vec<String> = pts.iter().enumerate().map(|(i, p)| format!("{}{:.1} {:.1}", if i == 0 { "M" } else { "L" }, p.0, p.1)).collect();
    let _ = write!(svg, r#"<path d="{}" fill="none" stroke="{ACCENT}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>"#, d.join(" "));
    for (i, &(x, y)) in pts.iter().enumerate() {
        let end = i == 0 || i == n - 1;
        let r = if end { 10.0 } else { 6.0 };
        let fill = if end { ACCENT } else { "var(--cover,#f5f5f7)" };
        let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="{r}" style="fill:{fill}" stroke="{ACCENT}" stroke-width="3"/>"#);
    }
    svg.push_str("</svg>");
    svg
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn covers_are_deterministic_and_escaped() {
        let a = entity("x", "A & B <C>", 5);
        assert_eq!(a, entity("x", "A & B <C>", 5));
        assert_ne!(a, entity("y", "A & B <C>", 5));
        assert!(a.contains("A &amp; B &lt;C&gt;"));
        assert!(!a.contains("<C>"));
        assert!(route("p", "How is A connected to B?", 4).contains("<tspan"));
    }

    #[test]
    fn empty_routes_and_entries_still_draw() {
        for stops in [0, 1] {
            assert!(route("p", "A to A", stops).ends_with("</svg>"));
        }
        assert!(entity("x", "", 0).ends_with("</svg>"));
    }
}
