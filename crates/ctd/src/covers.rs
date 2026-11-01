//! Generated covers: every entry and story gets a book-like cover in a print ink, its title set
//! large above a drawing of its own links in white. Deterministic: same id, same cover and ink.

use std::fmt::Write;

use crate::{markdown::escape as esc, world::Rng};

const W: f64 = 300.0;
const H: f64 = 400.0;

/// A print ink: the colour of a cover or a story's header, what reads on it, and its text colour on
/// white paper (the lighter inks darkened to 4.5:1).
#[derive(Clone, Copy, serde::Serialize)]
pub struct Ink {
    pub bg: &'static str,
    pub fg: &'static str,
    pub text: &'static str,
}

const INKS: [Ink; 8] = [
    Ink { bg: "#e23d28", fg: "#ffffff", text: "#c9301c" },
    Ink { bg: "#2346d6", fg: "#ffffff", text: "#2346d6" },
    Ink { bg: "#0b8457", fg: "#ffffff", text: "#0b7a50" },
    Ink { bg: "#ffc22e", fg: "#171a3a", text: "#171a3a" },
    Ink { bg: "#7b36b8", fg: "#ffffff", text: "#7b36b8" },
    Ink { bg: "#0a79b5", fg: "#ffffff", text: "#0a6ea5" },
    Ink { bg: "#d42a6a", fg: "#ffffff", text: "#c4235f" },
    Ink { bg: "#171a3a", fg: "#ffffff", text: "#171a3a" },
];

/// The ink of a story or an entry, by its id.
pub fn ink(id: &str) -> Ink {
    INKS[(seed(id) % INKS.len() as u64) as usize]
}

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
fn open(id: &str) -> String {
    let bg = ink(id).bg;
    format!(
        r##"<svg class="cover-art" viewBox="0 0 {W} {H}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice"><rect width="{W}" height="{H}" fill="{bg}"/>"##
    )
}

/// The title, top left like a book cover: greedy-wrapped, at most four lines.
fn title(svg: &mut String, label: &str, fg: &str) {
    let size = if label.chars().count() > 34 { 28.0 } else { 36.0 };
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
        r#"<text x="26" y="{:.0}" style="fill:{fg};font:800 {size}px var(--font-display,sans-serif);letter-spacing:-0.3px">"#,
        24.0 + size
    );
    for (i, l) in lines.iter().enumerate() {
        let dy = if i == 0 { 0.0 } else { size * 1.12 };
        let _ = write!(svg, r#"<tspan x="26" dy="{dy:.1}">{}</tspan>"#, esc(l));
    }
    svg.push_str("</text>");
}

/// Faint background dots, kept below the title.
fn stars(svg: &mut String, rng: &mut Rng, n: usize, fg: &str) {
    for _ in 0..n {
        let (x, y, r) = (rng.f() * W, 190.0 + rng.f() * (H - 200.0), 0.8 + rng.f() * 1.4);
        let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="{r:.1}" fill="{fg}" fill-opacity="0.4"/>"#);
    }
}

/// A constellation: the entry at the centre, its links around it (count = `links`).
pub fn entity(id: &str, label: &str, links: usize) -> String {
    let mut rng = Rng(seed(id));
    let fg = ink(id).fg;
    let mut svg = open(id);
    title(&mut svg, label, fg);
    stars(&mut svg, &mut rng, 7, fg);
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
            let _ = write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{fg}" stroke-opacity="0.45" stroke-width="1.4"/>"#, pts[i].0, pts[i].1, pts[j].0, pts[j].1);
        }
    }
    for &(x, y) in &pts {
        let _ = write!(svg, r#"<line x1="{cx:.1}" y1="{cy:.1}" x2="{x:.1}" y2="{y:.1}" stroke="{fg}" stroke-opacity="0.8" stroke-width="2.4"/>"#);
    }
    for &(x, y) in &pts {
        let r = 3.6 + rng.f() * 3.0;
        let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="{r:.1}" fill="{fg}"/>"#);
    }
    let _ = write!(svg, r#"<circle cx="{cx:.1}" cy="{cy:.1}" r="19" fill="{fg}" fill-opacity="0.25"/><circle cx="{cx:.1}" cy="{cy:.1}" r="11" fill="{fg}"/>"#);
    svg.push_str("</svg>");
    svg
}

/// A route: `stops` dots joined left to right, first and last emphasised.
pub fn route(id: &str, label: &str, stops: usize) -> String {
    let mut rng = Rng(seed(id));
    let fg = ink(id).fg;
    let mut svg = open(id);
    title(&mut svg, label, fg);
    stars(&mut svg, &mut rng, 9, fg);
    let n = stops.clamp(2, 12);
    let pts: Vec<(f64, f64)> = (0..n)
        .map(|i| {
            let t = i as f64 / (n - 1) as f64;
            (36.0 + t * (W - 72.0), 290.0 + (rng.f() - 0.5) * 110.0 * (1.0 - (2.0 * t - 1.0).powi(2)).max(0.25))
        })
        .collect();
    let d: Vec<String> = pts.iter().enumerate().map(|(i, p)| format!("{}{:.1} {:.1}", if i == 0 { "M" } else { "L" }, p.0, p.1)).collect();
    let _ = write!(svg, r#"<path d="{}" fill="none" stroke="{fg}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>"#, d.join(" "));
    for (i, &(x, y)) in pts.iter().enumerate() {
        let end = i == 0 || i == n - 1;
        let r = if end { 10.0 } else { 6.0 };
        let fill = if end { fg } else { ink(id).bg };
        let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="{r}" fill="{fill}" stroke="{fg}" stroke-width="3.5"/>"#);
    }
    svg.push_str("</svg>");
    svg
}

/// A story's own map: the places its scenes mark, in their true positions, the places joined in the
/// order the story visits them, and the routes it draws in the accent. `None` with too few places to
/// make a shape.
pub fn journey(id: &str, label: &str, stops: &[[f64; 2]], routes: &[(usize, usize)]) -> Option<String> {
    if stops.len() < 3 {
        return None;
    }
    let bounds = |i: usize| stops.iter().fold((f64::MAX, f64::MIN), |(lo, hi), p| (lo.min(p[i]), hi.max(p[i])));
    let (west, east) = bounds(0);
    let (south, north) = bounds(1);
    // degrees of longitude shrink away from the equator
    let squeeze = ((south + north) / 2.0).to_radians().cos().max(0.2);
    let (width, height) = (((east - west) * squeeze).max(1.0), (north - south).max(1.0));
    let (left, top, room_w, room_h) = (36.0, 196.0, W - 72.0, H - 232.0);
    let scale = (room_w / width).min(room_h / height);
    let at = |p: [f64; 2]| {
        let x = left + room_w / 2.0 + ((p[0] - west) * squeeze - width / 2.0) * scale;
        let y = top + room_h / 2.0 + ((north - p[1]) - height / 2.0) * scale;
        (x, y)
    };
    let pts: Vec<(f64, f64)> = stops.iter().map(|&p| at(p)).collect();
    let mut rng = Rng(seed(id));
    let fg = ink(id).fg;
    let mut svg = open(id);
    title(&mut svg, label, fg);
    stars(&mut svg, &mut rng, 7, fg);
    for pair in pts.windows(2) {
        let _ = write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{fg}" stroke-opacity="0.45" stroke-width="1.6"/>"#, pair[0].0, pair[0].1, pair[1].0, pair[1].1);
    }
    for &(a, b) in routes {
        let _ = write!(svg, r#"<line x1="{:.1}" y1="{:.1}" x2="{:.1}" y2="{:.1}" stroke="{fg}" stroke-width="4.5" stroke-linecap="round"/>"#, pts[a].0, pts[a].1, pts[b].0, pts[b].1);
    }
    for &(x, y) in &pts {
        let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="5.4" fill="{fg}"/>"#);
    }
    let (x, y) = pts[0];
    let _ = write!(svg, r#"<circle cx="{x:.1}" cy="{y:.1}" r="15" fill="{fg}" fill-opacity="0.25"/><circle cx="{x:.1}" cy="{y:.1}" r="8" fill="{fg}"/></svg>"#);
    Some(svg)
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

    #[test]
    fn a_journey_draws_its_places_inside_the_cover() {
        let places = [[-3.0, 40.0], [30.0, 31.0], [44.0, 33.0], [8.0, 50.0]];
        let svg = journey("c", "A story", &places, &[(1, 2)]).unwrap();
        assert_eq!(svg, journey("c", "A story", &places, &[(1, 2)]).unwrap());
        assert!(svg.contains(r#"stroke-width="4.5""#));
        for cx in svg.split(r#"<circle cx=""#).skip(1).map(|s| s.split('"').next().unwrap().parse::<f64>().unwrap()) {
            assert!((0.0..=W).contains(&cx), "{cx}");
        }
        assert!(journey("c", "Too few", &places[..2], &[]).is_none(), "two places make no shape");
    }
}
