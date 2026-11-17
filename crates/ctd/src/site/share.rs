//! Share cards: the picture a link to a story shows when it is shared (`og:image`). 1200 by 630,
//! black on white like the site: the story's title, subtitle and span on the left, the drawing from
//! its cover on the right, colour only on the dots. Drawn at build time from SVG with the site's own
//! typefaces (static instances of theme/static/fonts, in crates/ctd/fonts), so the same story gives
//! the same bytes and a release uploads only the cards that changed.

use std::{
    collections::HashMap,
    sync::{Arc, OnceLock},
};

use anyhow::{Context, Result};
use regex::Regex;
use resvg::{tiny_skia, usvg};
use skrifa::{
    FontRef, MetadataProvider,
    instance::{LocationRef, Size},
};

use crate::markdown::escape as esc;

const W: f64 = 1200.0;
const H: f64 = 630.0;
const LEFT: f64 = 72.0;
/// The text column ends here; the drawing starts at `ART_X`.
const TEXT_W: f64 = 600.0;
const ART_X: f64 = 712.0;

const DISPLAY: [&[u8]; 2] = [include_bytes!("../../fonts/bricolage-latin.ttf"), include_bytes!("../../fonts/bricolage-latin-ext.ttf")];
const READING: [&[u8]; 2] = [include_bytes!("../../fonts/literata-latin.ttf"), include_bytes!("../../fonts/literata-latin-ext.ttf")];
const DISPLAY_FAMILY: &str = "Bricolage Grotesque";
const READING_FAMILY: &str = "Literata";

fn options() -> &'static usvg::Options<'static> {
    static OPTIONS: OnceLock<usvg::Options<'static>> = OnceLock::new();
    OPTIONS.get_or_init(|| {
        let mut db = usvg::fontdb::Database::new();
        for font in DISPLAY.iter().chain(READING.iter()) {
            db.load_font_data(font.to_vec());
        }
        let mut opt = usvg::Options { fontdb: Arc::new(db), ..Default::default() };
        opt.font_family = READING_FAMILY.into();
        opt
    })
}

/// How wide `text` sets at `size` px: the sum of its glyphs' advances, each from the first font that
/// has the glyph.
fn width(fonts: &[&[u8]], text: &str, size: f64) -> f64 {
    let faces: Vec<FontRef> = fonts.iter().filter_map(|f| FontRef::new(f).ok()).collect();
    text.chars()
        .map(|c| {
            faces
                .iter()
                .find_map(|f| {
                    let gid = f.charmap().map(c)?;
                    f.glyph_metrics(Size::new(size as f32), LocationRef::default()).advance_width(gid)
                })
                .map_or(size * 0.55, f64::from)
        })
        .sum()
}

/// Greedy lines no wider than `max`; past `most`, the last line ends in an ellipsis.
fn wrap(fonts: &[&[u8]], text: &str, size: f64, max: f64, most: usize) -> Vec<String> {
    let mut lines: Vec<String> = Vec::new();
    for word in text.split_whitespace() {
        match lines.last_mut() {
            Some(l) if width(fonts, &format!("{l} {word}"), size) <= max => {
                l.push(' ');
                l.push_str(word);
            }
            _ => lines.push(word.to_string()),
        }
    }
    if lines.len() > most {
        lines.truncate(most);
        if let Some(l) = lines.last_mut() {
            while !l.is_empty() && width(fonts, &format!("{l}…"), size) > max {
                l.pop();
            }
            *l = format!("{}…", l.trim_end_matches([' ', ',', ';', ':']));
        }
    }
    lines
}

/// Lines of text down the left edge; `face` is a family and its weight.
fn text(svg: &mut String, lines: &[String], (family, weight): (&str, u16), size: f64, lead: f64, first: f64, fill: &str) {
    for (i, l) in lines.iter().enumerate() {
        svg.push_str(&format!(
            r#"<text x="{LEFT}" y="{:.1}" font-family="{family}" font-weight="{weight}" font-size="{size}" fill="{fill}">{}</text>"#,
            first + i as f64 * lead,
            esc(l)
        ));
    }
}

/// The site's colour tokens (`--tomato: #e23d28;`), the first value of each, which is the light one.
pub(super) fn tokens(css: &str) -> HashMap<String, String> {
    let re = Regex::new(r"--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;").expect("token pattern");
    let mut out = HashMap::new();
    for c in re.captures_iter(css) {
        out.entry(c[1].to_string()).or_insert_with(|| c[2].to_string());
    }
    out
}

/// A cover drawing, set into the card: its `var(--token)` colours resolved, placed at the right.
fn art(cover: &str, tokens: &HashMap<String, String>) -> String {
    let re = Regex::new(r"var\(--([a-z0-9-]+)(?:,[^)]*)?\)").expect("var pattern");
    let resolved = re.replace_all(cover, |c: &regex::Captures| tokens.get(&c[1]).cloned().unwrap_or_else(|| "#000000".into()));
    resolved.replacen("<svg ", &format!(r#"<svg x="{ART_X}" y="0" width="{:.0}" height="{H}" "#, W - ART_X - 16.0), 1)
}

/// The card's SVG: brand, title, subtitle and span on the left; the cover's drawing on the right.
pub(super) fn svg(title: &str, subtitle: Option<&str>, span: &str, cover: &str, tokens: &HashMap<String, String>) -> String {
    let ink = tokens.get("ink").map_or("#000000", String::as_str);
    let ink2 = tokens.get("ink-2").map_or("#262626", String::as_str);
    let dot = |t: &str| tokens.get(t).map_or("#000000", String::as_str).to_string();
    let mut svg =
        format!(r##"<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="#ffffff"/>"##);
    svg.push_str(&art(cover, tokens));

    // the mark and the name, as in the site's header
    svg.push_str(&format!(
        r#"<path d="M{a} 98 L{b} 76 L{c} 90" fill="none" stroke="{ink}" stroke-width="3"/><circle cx="{a}" cy="98" r="6" fill="{}"/><circle cx="{b}" cy="76" r="6" fill="{}"/><circle cx="{c}" cy="90" r="6" fill="{}"/>"#,
        dot("tomato"),
        dot("cobalt"),
        dot("leaf"),
        a = LEFT + 6.0,
        b = LEFT + 22.0,
        c = LEFT + 40.0
    ));
    svg.push_str(&format!(
        r#"<text x="{}" y="98" font-family="{DISPLAY_FAMILY}" font-weight="800" font-size="28" fill="{ink}">Connect the Dots</text>"#,
        LEFT + 60.0
    ));

    // the title as large as fits in three lines
    let (size, lines) = [84.0, 76.0, 68.0, 60.0, 54.0]
        .iter()
        .map(|&s| (s, wrap(&DISPLAY, title, s, TEXT_W, 3)))
        .find(|(_, l)| !l.last().is_some_and(|l| l.ends_with('…')))
        .unwrap_or_else(|| (48.0, wrap(&DISPLAY, title, 48.0, TEXT_W, 3)));
    let lead = (size * 1.04_f64).round();
    let first = 168.0 + size * 0.8;
    text(&mut svg, &lines, (DISPLAY_FAMILY, 800), size, lead, first, ink);

    // the subtitle in what room is left above the span
    let below = first + (lines.len() - 1) as f64 * lead + 62.0;
    let room = ((520.0 - below) / 40.0).floor() as usize + 1;
    if let Some(sub) = subtitle.filter(|s| !s.trim().is_empty() && room > 0) {
        let sub_lines = wrap(&READING, sub, 30.0, TEXT_W, room.min(3));
        text(&mut svg, &sub_lines, (READING_FAMILY, 400), 30.0, 40.0, below, ink2);
    }
    text(&mut svg, &[span.to_string()], (READING_FAMILY, 400), 24.0, 0.0, 570.0, ink2);
    svg.push_str("</svg>");
    svg
}

/// The card as PNG bytes.
pub(super) fn png(svg: &str) -> Result<Vec<u8>> {
    let tree = usvg::Tree::from_str(svg, options()).context("reading a share card's SVG")?;
    let mut pixmap = tiny_skia::Pixmap::new(W as u32, H as u32).context("making a share card's canvas")?;
    resvg::render(&tree, tiny_skia::Transform::default(), &mut pixmap.as_mut());
    pixmap.encode_png().context("encoding a share card")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tokens() -> HashMap<String, String> {
        super::tokens(
            ":root { --ink: #000000; --ink-2: #262626; --tomato: #e23d28; --cobalt: #2346d6; --leaf: #0b8457; }\n@media (prefers-color-scheme: dark) { :root { --ink: #ffffff; } }",
        )
    }

    #[test]
    fn tokens_keep_the_light_value() {
        assert_eq!(tokens()["ink"], "#000000");
    }

    #[test]
    fn long_titles_wrap_inside_the_column() {
        let lines = wrap(&DISPLAY, "Does Google Have to Break Up? The search case from the complaint to the appeals", 84.0, TEXT_W, 3);
        assert_eq!(lines.len(), 3);
        assert!(lines.iter().all(|l| width(&DISPLAY, l, 84.0) <= TEXT_W), "{lines:?}");
        assert!(lines[2].ends_with('…'));
    }

    #[test]
    fn a_card_draws_the_same_bytes_each_time() {
        let cover = r##"<svg class="cover-art" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice"><rect width="300" height="400" fill="#ffffff"/><circle cx="150" cy="200" r="9" fill="var(--tomato)"/></svg>"##;
        let svg = svg("Why Rome Fell", Some("The road to the sack of 410 & after"), "19 scenes, 378–410", cover, &tokens());
        assert!(svg.contains(r##"fill="#e23d28""##), "the cover's colours are resolved");
        assert!(svg.contains("410 &amp; after"));
        let a = png(&svg).unwrap();
        assert_eq!(a, png(&svg).unwrap());
        assert_eq!(&a[1..4], b"PNG");
    }
}
