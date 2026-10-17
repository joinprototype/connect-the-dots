//! Markdown rendering with `[[wikilinks]]`. Content comes from public PRs, so raw HTML is escaped
//! and only safe link targets are written as links.

use std::sync::LazyLock;

use pulldown_cmark::{CowStr, Event, Options, Parser, Tag, TagEnd, html};
use regex::Regex;

static WIKILINK: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]").unwrap());

/// Link target of a wikilink whose page does not exist yet; rendered as a "redlink", never a link.
const WANTED: &str = "ctd-wanted:";

pub fn wikilink_targets(md: &str) -> Vec<String> {
    WIKILINK.captures_iter(md).map(|c| c[1].trim().to_string()).collect()
}

pub fn escape(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

fn escape_label(s: &str) -> String {
    s.replace('[', "\\[").replace(']', "\\]")
}

/// Plain text (a role, a note, a summary) for a generated markdown line: one line, with every
/// character that could start markup escaped, so it shows exactly as written and never as a link.
pub fn text(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for (i, word) in s.split_whitespace().enumerate() {
        if i > 0 {
            out.push(' ');
        }
        for c in word.chars() {
            if matches!(c, '\\' | '`' | '*' | '_' | '[' | ']' | '<' | '>' | '&' | '~' | '|' | '#' | '!') {
                out.push('\\');
            }
            out.push(c);
        }
    }
    out
}

/// The scheme of a URL as a browser reads it, lowercased ("javascript" for " JavaScript:…"), or
/// `None` for a relative link such as `/e/spacex/`, `#src-1` or `notes.html`.
pub fn url_scheme(url: &str) -> Option<String> {
    // browsers skip leading spaces and control characters, and drop tabs and newlines anywhere
    let url: String = url.trim_start_matches(|c: char| c <= ' ').chars().filter(|c| !matches!(c, '\t' | '\n' | '\r')).collect();
    let end = url.find([':', '/', '?', '#'])?;
    url[end..].starts_with(':').then(|| url[..end].to_ascii_lowercase())
}

/// Link and image targets content may use: relative paths, #fragments, http(s) and mailto.
/// Anything else (javascript:, data:, vbscript:…) loses its link and keeps its text.
fn allowed(url: &str) -> bool {
    matches!(url_scheme(url).as_deref(), None | Some("http" | "https" | "mailto"))
}

/// What an opened link or image became, so its end tag is written to match.
enum Open {
    Kept,
    Wanted,
    Dropped,
}

/// Renders markdown to HTML. `resolve` maps a wikilink target to (url, display name).
pub fn render(md: &str, resolve: &dyn Fn(&str) -> Option<(String, String)>) -> String {
    let replaced = WIKILINK.replace_all(md, |caps: &regex::Captures| {
        let target = caps[1].trim();
        let label = caps.get(2).map(|m| m.as_str().trim().to_string());
        match resolve(target) {
            Some((url, name)) => format!("[{}]({url})", escape_label(&label.unwrap_or(name))),
            None => format!("[{}]({WANTED}{target})", escape_label(&label.unwrap_or_else(|| target.to_string()))),
        }
    });
    let opts = Options::ENABLE_TABLES | Options::ENABLE_FOOTNOTES | Options::ENABLE_STRIKETHROUGH | Options::ENABLE_SMART_PUNCTUATION;
    let mut open: Vec<Open> = Vec::new();
    let parser = Parser::new_ext(&replaced, opts).filter_map(|ev| match ev {
        Event::Html(h) | Event::InlineHtml(h) => Some(Event::Text(CowStr::from(h.to_string()))),
        Event::Start(Tag::Link { ref dest_url, .. }) if dest_url.starts_with(WANTED) => {
            open.push(Open::Wanted);
            Some(Event::InlineHtml(r#"<span class="redlink" title="No page yet">"#.into()))
        }
        Event::Start(Tag::Link { ref dest_url, .. } | Tag::Image { ref dest_url, .. }) => {
            if allowed(dest_url) {
                open.push(Open::Kept);
                Some(ev)
            } else {
                open.push(Open::Dropped);
                None
            }
        }
        Event::End(TagEnd::Link | TagEnd::Image) => match open.pop() {
            Some(Open::Wanted) => Some(Event::InlineHtml("</span>".into())),
            Some(Open::Dropped) => None,
            _ => Some(ev),
        },
        other => Some(other),
    });
    let mut out = String::new();
    html::push_html(&mut out, parser);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn plain(md: &str) -> String {
        render(md, &|_| None)
    }

    #[test]
    fn wikilinks_resolve_and_html_is_escaped() {
        let resolve = |t: &str| (t == "spacex").then(|| ("/e/spacex/".to_string(), "SpaceX".to_string()));
        let html = render("Founded [[spacex]] and [[nope|Nope]]. <script>x</script>", &resolve);
        assert!(html.contains(r#"<a href="/e/spacex/">SpaceX</a>"#));
        assert!(html.contains(r#"<span class="redlink" title="No page yet">Nope</span>"#));
        assert!(!html.contains("<script>"));
    }

    #[test]
    fn unsafe_link_targets_lose_their_link_but_keep_their_text() {
        for md in [
            "[filing](javascript:alert(document.domain))",
            "[filing](JavaScript:alert(1))",
            "[filing](javascript&#58;alert(1))",
            "[filing](< javascript:alert(1)>)",
            "[filing](<java\tscript:alert(1)>)",
            "[filing][r]\n\n[r]: javascript:alert(1)",
            "[filing](vbscript:msgbox(1))",
            "[filing](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)",
            "[filing](ctd-wanted:x \"title\")",
        ] {
            let html = plain(md);
            assert!(!html.contains("<a"), "{md} → {html}");
            assert!(html.contains("filing"), "{md} → {html}");
        }
        let auto = plain("<javascript:alert(1)>");
        assert!(!auto.contains("<a") && auto.contains("javascript:alert(1)"), "{auto}");
        let img = plain("![chart](javascript:alert(1))");
        assert!(!img.contains("<img") && img.contains("chart"), "{img}");
        let linked = plain("[![logo](https://example.org/logo.png)](javascript:alert(1))");
        assert!(linked.contains(r#"<img src="https://example.org/logo.png""#) && !linked.contains("<a"), "{linked}");
    }

    #[test]
    fn safe_link_targets_stay_links() {
        for (md, href) in [
            ("[a](https://www.sec.gov/x)", "https://www.sec.gov/x"),
            ("[a](HTTP://example.org)", "HTTP://example.org"),
            ("[a](/e/spacex/)", "/e/spacex/"),
            ("[a](#src-1)", "#src-1"),
            ("[a](notes.html)", "notes.html"),
            ("[a](./a:b)", "./a:b"),
            ("[a](mailto:press@example.org)", "mailto:press@example.org"),
        ] {
            assert!(plain(md).contains(&format!(r#"<a href="{href}">a</a>"#)), "{md} → {}", plain(md));
        }
    }

    #[test]
    fn plain_text_stays_plain() {
        let md = format!("*{}*", text("[mother](https://example.org) <b>&#58; *x* `y`\n\n# z"));
        assert_eq!(plain(&md), "<p><em>[mother](https://example.org) &lt;b&gt;&amp;#58; *x* `y` # z</em></p>\n");
    }

    #[test]
    fn schemes_are_read_like_a_browser_reads_them() {
        assert_eq!(url_scheme(" \u{1}JavaScript:x").as_deref(), Some("javascript"));
        assert_eq!(url_scheme("java\nscript:x").as_deref(), Some("javascript"));
        assert_eq!(url_scheme("https://x.org/a:b").as_deref(), Some("https"));
        assert_eq!(url_scheme("/e/a:b/"), None);
        assert_eq!(url_scheme("#a:b"), None);
        assert_eq!(url_scheme("page?x=a:b"), None);
    }
}
