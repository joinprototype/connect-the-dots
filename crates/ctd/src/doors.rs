//! Any name in a story is a door (ADR-0028): the first mention of an entry in a scene links to its
//! page. This only adds links, so it works on the parsed text and never changes a word. It prefers
//! precision to reach: it looks only for the story's own entries, and a name that could be something
//! else stays plain.

use std::{
    cmp::Reverse,
    collections::{BTreeSet, HashMap, HashSet},
};

use pulldown_cmark::{Event, Tag, TagEnd, TextMergeStream};
use serde_json::Value;

use crate::{
    kb::{Entity, Kb, shot_entries},
    markdown::escape,
};

/// How a story can write an entry: its name, its form in a sentence and its aliases, with or without
/// their "the" ("The Times", "the Times"), in the text's own apostrophes. A form with no capital is a
/// common noun, not a name.
fn written(e: &Entity) -> BTreeSet<String> {
    let mut forms = BTreeSet::new();
    for form in std::iter::once(&e.name).chain(&e.in_sentence).chain(&e.aliases) {
        let form = form.replace('\'', "’");
        forms.insert(form.strip_prefix("the ").or(form.strip_prefix("The ")).unwrap_or(&form).to_string());
        if !form.starts_with("the ") {
            forms.insert(form);
        }
    }
    forms.retain(|n| n.chars().any(char::is_uppercase));
    forms
}

/// One word after any "The": it could be something else, unless the scene itself lists the entry.
fn one_word(name: &str) -> bool {
    !name.strip_prefix("The ").unwrap_or(name).contains(' ')
}

/// Too short to be sure of: a letter ("X"), or two that are not capitals ("Ur", where "UN" is fine).
fn too_short(name: &str) -> bool {
    match name.chars().count() {
        0 | 1 => true,
        2 => name.chars().any(char::is_lowercase),
        _ => false,
    }
}

/// Every written name, and the one entry it can mean: a name two entries share means neither.
pub struct Names<'k> {
    kb: &'k Kb,
    only: HashMap<String, Option<&'k str>>,
}

impl<'k> Names<'k> {
    pub fn new(kb: &'k Kb) -> Self {
        let mut only: HashMap<String, Option<&str>> = HashMap::new();
        for e in &kb.entities {
            for name in written(e) {
                only.entry(name).and_modify(|o| *o = None).or_insert(Some(&e.id));
            }
        }
        Names { kb, only }
    }

    /// What a story's scenes may link: the names of the entries they list, longest first.
    pub fn story(&self, shots: &[Value]) -> Story<'_> {
        let listed: BTreeSet<&str> = shots.iter().flat_map(shot_entries).map(|(_, id)| id).collect();
        let entries: Vec<&Entity> = listed.into_iter().filter_map(|id| self.kb.entity(id)).collect();
        // "Krupp" beside Gustav Krupp could be the man or his firm
        let people = entries.iter().filter(|e| self.kb.schema.types.get(&e.kind).is_some_and(|t| t.family));
        let surnames: Vec<(&str, &str)> = people.filter_map(|e| Some((e.name.rsplit(' ').next()?, e.id.as_str()))).collect();
        let clear = |n: &str, id: &str| !too_short(n) && self.only[n] == Some(id) && !surnames.iter().any(|&(s, p)| s == n && p != id);
        let mut names: Vec<(String, &str)> = Vec::new();
        for e in &entries {
            names.extend(written(e).into_iter().filter(|n| clear(n, &e.id)).map(|n| (n, e.id.as_str())));
        }
        names.sort_by_key(|(n, _)| Reverse(n.len()));
        Story { doors: self, names }
    }

    /// The start of a door: an ordinary link to the entry, with the class that draws its line of dots.
    fn door(&self, id: &str) -> Option<(&'k str, String)> {
        let e = self.kb.entity(id)?;
        let layer = &self.kb.schema.types.get(&e.kind)?.layer;
        Some((&e.id, format!(r#"<a class="door-{layer}" href="/e/{}/">"#, escape(&e.id))))
    }
}

/// Whether a text is inside quotation marks. Marks may open in one run of a paragraph and close in
/// another, around a link or an emphasis.
#[derive(Clone, Copy, Default)]
struct Quote {
    double: bool,
    single: bool,
}

impl Quote {
    fn open(self) -> bool {
        self.double || self.single
    }

    /// The state after reading `t`. Inside a word, ’ is an apostrophe and closes nothing.
    fn after(mut self, t: &str) -> Self {
        let mut chars = t.chars().peekable();
        while let Some(c) = chars.next() {
            match c {
                '“' => self.double = true,
                '”' => self = Quote::default(),
                '‘' => self.single = true,
                '’' if !chars.peek().is_some_and(|n| n.is_alphanumeric()) => self.single = false,
                _ => {}
            }
        }
        self
    }
}

/// Small words that open sentences: their capital says nothing about the name after them.
const OPENERS: [&str; 28] = [
    "A", "An", "The", "In", "On", "At", "By", "For", "From", "To", "Of", "After", "Before", "As", "When", "While", "Then", "That", "This", "Its", "His", "Her",
    "Their", "Some", "Each", "If", "But", "And",
];

/// Whether the capital of the word before a name says nothing about the name: the word opens a sentence
/// or ends a clause. A short word and its full stop are an abbreviation ("St.", "J.", "U.S."), which does not.
fn apart(w: &str) -> bool {
    OPENERS.contains(&w)
        || w.ends_with([',', ';', ':', '!', '?', ')', '”'])
        || w.ends_with("’s")
        || (w.ends_with('.') && w.chars().filter(|c| c.is_alphabetic()).count() > 3)
}

/// Whether `t[at..end]` stands alone, and is not a piece of a word or of a longer name: "Rockefeller-funded",
/// "O’Brien", "New York Times", "Bank of England". One word after a capital is a piece too ("Great
/// Britain", "Lake Victoria"); two after a capital are a name with its title ("President Barack Obama").
fn whole(t: &str, at: usize, end: usize) -> bool {
    let (before, after) = (&t[..at], &t[end..]);
    let capital = |w: &str| w.chars().next().is_some_and(char::is_uppercase);
    if before.ends_with(|c: char| c.is_alphanumeric() || matches!(c, '-' | '’' | '.')) || after.starts_with(|c: char| c.is_alphanumeric() || c == '-') {
        return false;
    }
    if after.strip_prefix(' ').is_some_and(capital) {
        return false;
    }
    let mut back = before.split_whitespace().rev();
    let last = back.next();
    if one_word(&t[at..end]) && last.is_some_and(|w| capital(w) && !apart(w)) {
        return false;
    }
    let of = if last == Some("the") { back.next() } else { last };
    !(of == Some("of") && back.next().is_some_and(capital))
}

/// Where names stand in `t`, in reading order: a longer name wins over any name inside it.
fn found<'n>(t: &str, names: &[&'n (String, &'n str)]) -> Vec<(usize, usize, &'n str)> {
    let mut hits: Vec<(usize, usize, &str)> = Vec::new();
    for (name, id) in names {
        for (at, _) in t.match_indices(name.as_str()) {
            let end = at + name.len();
            if whole(t, at, end) && !hits.iter().any(|&(a, b, _)| at < b && a < end) {
                hits.push((at, end, id));
            }
        }
    }
    hits.sort_unstable();
    hits
}

/// The names one story's scenes may link.
pub struct Story<'n> {
    doors: &'n Names<'n>,
    names: Vec<(String, &'n str)>,
}

impl Story<'_> {
    /// Opens a scene's doors in its parsed narration. Text in a link, a bold scene title, a blockquote,
    /// a code span or quotation marks stays as it is; a link to an entry becomes a door, and counts as
    /// that entry's first mention.
    pub fn open<'e>(&self, shot: &Value, events: impl Iterator<Item = Event<'e>>) -> Vec<Event<'e>> {
        let own: HashSet<&str> = shot_entries(shot).map(|(_, id)| id).collect();
        let names: Vec<&(String, &str)> = self.names.iter().filter(|(n, id)| own.contains(id) || !one_word(n)).collect();
        let mut seen: HashSet<&str> = HashSet::new();
        let mut quote = Quote::default();
        let mut quiet = 0;
        let mut out = Vec::new();
        for ev in TextMergeStream::new(events) {
            match ev {
                Event::Start(Tag::Link { ref dest_url, .. }) => {
                    quiet += 1;
                    let id = dest_url.strip_prefix("/e/").and_then(|p| p.strip_suffix('/'));
                    match id.and_then(|id| self.doors.door(id)) {
                        Some((id, start)) => {
                            seen.insert(id);
                            out.push(Event::InlineHtml(start.into()));
                        }
                        None => out.push(ev),
                    }
                }
                Event::Start(Tag::Strong | Tag::Image { .. } | Tag::BlockQuote(_) | Tag::CodeBlock(_) | Tag::Heading { .. }) => {
                    quiet += 1;
                    out.push(ev);
                }
                Event::End(TagEnd::Link | TagEnd::Strong | TagEnd::Image | TagEnd::BlockQuote(_) | TagEnd::CodeBlock | TagEnd::Heading(_)) => {
                    quiet -= 1;
                    out.push(ev);
                }
                Event::End(TagEnd::Paragraph) => {
                    quote = Quote::default();
                    out.push(ev);
                }
                Event::Text(t) => {
                    let mut from = 0;
                    if quiet == 0 {
                        for (at, end, id) in found(&t, &names) {
                            if !seen.contains(id) && !quote.after(&t[..at]).open() {
                                let Some((id, start)) = self.doors.door(id) else { continue };
                                seen.insert(id);
                                out.push(Event::Text(t[from..at].to_string().into()));
                                out.push(Event::InlineHtml(start.into()));
                                out.push(Event::Text(t[at..end].to_string().into()));
                                out.push(Event::InlineHtml("</a>".into()));
                                from = end;
                            }
                        }
                    }
                    quote = quote.after(&t);
                    out.push(Event::Text(t[from..].to_string().into()));
                }
                other => out.push(other),
            }
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use std::sync::LazyLock;

    use serde_json::json;

    use super::*;
    use crate::{
        kb::Kb,
        markdown::{render, render_scene},
        testkit::{entity, file, load, source},
    };

    static WORLD: LazyLock<Kb> = LazyLock::new(|| {
        let org = |id: &str, name: &str, more: &str| {
            file(&format!("content/entities/org/{}/{id}.md", &id[..2]), &format!("---\nid: {id}\ntype: org\nname: {name}\n{more}---\n"))
        };
        let (kb, _) = load(
            "doors",
            &[
                entity("person", "kofi-annan", "Kofi Annan", ""),
                entity("person", "ann-lee", "Ann Lee", ""),
                org("apple", "Apple", "aliases: [\"Apple Computer\", apple-computer]\n"),
                org("bank-of-england", "Bank of England", ""),
                org("england", "England", ""),
                org("united-nations", "United Nations", "aliases: [UN, \"the World Body\", mankind]\n"),
                org("fall", "Fall of Rome", "in_sentence: the fall of Rome\n"),
                org("x-corp", "X", ""),
                org("ur", "Ur", ""),
                org("ford", "Ford", ""),
                org("ford-city", "Ford", ""),
                org("new-york", "New York", ""),
                org("times", "The Times", ""),
                org("krupp-ag", "Krupp AG", "aliases: [Krupp]\n"),
                entity("person", "gustav-krupp", "Gustav Krupp", ""),
                source("rec", "T1"),
            ],
        );
        kb
    });

    /// `md` as a scene that lists `own`, in a story whose other scene lists `also`.
    fn scene(kb: &Kb, md: &str, own: &[&str], also: &[&str]) -> String {
        let (shot, other) = (json!({ "reveal": own }), json!({ "reveal": also }));
        let names = Names::new(kb);
        render_scene(md, &|t| kb.resolve(t).map(|e| (format!("/e/{}/", e.id), e.name.clone())), &names.story(&[shot.clone(), other]), &shot)
    }

    fn door(id: &str, name: &str) -> String {
        format!(r#"<a class="door-power" href="/e/{id}/">{name}</a>"#)
    }

    #[test]
    fn the_first_mention_in_a_scene_opens_and_each_scene_starts_again() {
        let kb = &*WORLD;
        let html = scene(kb, "Apple grew. Apple grew again.", &["apple"], &[]);
        assert_eq!(html, format!("<p>{} grew. Apple grew again.</p>\n", door("apple", "Apple")));
        let next = scene(kb, "Then Apple fell, and Kofi Annan's report said so.", &["apple", "kofi-annan"], &[]);
        assert!(next.contains(&door("apple", "Apple")), "{next}");
        assert!(next.contains(r#"<a class="door-people" href="/e/kofi-annan/">Kofi Annan</a>’s report"#), "the name, not its ’s: {next}");
    }

    #[test]
    fn one_word_needs_the_scene_itself_to_list_it_and_a_longer_name_any_scene() {
        let kb = &*WORLD;
        assert!(!scene(kb, "He ate an Apple.", &[], &[]).contains("<a"), "an entry the story never lists");
        assert!(!scene(kb, "Apple trees grew.", &[], &["apple"]).contains("<a"), "one word, listed only by another scene");
        assert!(scene(kb, "Kofi Annan spoke.", &[], &["kofi-annan"]).contains("<a"), "a full name, listed by another scene");
    }

    #[test]
    fn a_name_that_could_be_something_else_stays_plain() {
        let kb = &*WORLD;
        let own = ["ford", "ford-city", "x-corp", "ur"];
        let html = scene(kb, "Ford bought X in Ur.", &own, &[]);
        assert!(!html.contains("<a"), "shared by two entries, or too short: {html}");
        assert!(!scene(kb, "We bought it for mankind.", &["united-nations"], &[]).contains("<a"), "no capital, no name");
        assert!(scene(kb, "The UN met.", &["united-nations"], &[]).contains(">UN</a>"), "capitals are enough");
        assert!(scene(kb, "Then the World Body met.", &["united-nations"], &[]).contains(">World Body</a>"), "an alias, after its \"the\"");
        assert!(scene(kb, "Then came the fall of Rome.", &["fall"], &[]).contains(">fall of Rome</a>"), "the form in a sentence");
        assert!(scene(kb, "Then The Times wrote.", &["times"], &[]).contains(">The Times</a>"), "its \"The\" is part of the name");
        assert!(scene(kb, "Then the Times wrote.", &["times"], &[]).contains(">Times</a>"), "a sentence's \"the\" is not");
        assert!(!scene(kb, "The Times wrote.", &[], &["times"]).contains("<a"), "still one word, and another scene's entry");
        assert!(scene(kb, "Then Krupp sold.", &["krupp-ag"], &[]).contains(">Krupp</a>"), "a firm, in a story without the man");
        assert!(!scene(kb, "Then Krupp sold.", &["krupp-ag"], &["gustav-krupp"]).contains("<a"), "beside him, it could be either");
    }

    #[test]
    fn only_whole_names_open_and_the_longest_first() {
        let kb = &*WORLD;
        let own = ["england", "bank-of-england", "new-york"];
        let html = scene(kb, "The Bank of England sat in England.", &own, &[]);
        assert_eq!(html, format!("<p>The {} sat in {}.</p>\n", door("bank-of-england", "Bank of England"), door("england", "England")));
        for md in [
            "The England-funded plan.",
            "The Englander left.",
            "New England won.",
            "The Duke of England spoke.",
            "The King of the England spoke.",
            "Sir J. England spoke.",
            "New York Times readers.",
            "Mr. England spoke.",
        ] {
            let html = scene(kb, md, &own, &[]);
            assert!(!html.contains("<a"), "{md} → {html}");
        }
        for md in ["He left. England won.", "Paris, England won.", "Lord Byron’s England won.", "The people of England."] {
            let html = scene(kb, md, &own, &[]);
            assert!(html.contains("<a"), "{md} → {html}");
        }
        assert!(scene(kb, "Secretary-General Kofi Annan spoke.", &["kofi-annan"], &[]).contains("<a"), "a title before a full name");
    }

    #[test]
    fn quotes_titles_and_links_stay_as_they_are() {
        let kb = &*WORLD;
        let own = ["apple", "ann-lee", "kofi-annan"];
        for md in [
            "He said \"Apple won\".",
            "He said “Apple won”.",
            "He said ‘Apple’s rival won’.",
            "“It was *the* year, Apple won” he said.",
            "“Ann Lee and [[kofi-annan]] said Apple won.”",
            "**Apple.** Grew.",
            "> Apple grew.",
            "`Apple` grew.",
            "![Apple](https://example.org/a.png) grew.",
        ] {
            let html = scene(kb, md, &own, &[]);
            assert!(!html.contains("/e/apple/"), "{md} → {html}");
            assert!(!html.contains("Ann Lee</a>"), "{md} → {html}");
        }
        let html = scene(kb, "“Apple won,” he said of Apple.", &own, &[]);
        assert_eq!(html, format!("<p>“Apple won,” he said of {}.</p>\n", door("apple", "Apple")), "the first mention outside the quote");
        let html = scene(kb, "Kofi Annan’s Apple won, as it’s said, “Apple” and Ann Lee.", &own, &[]);
        assert_eq!(html.matches("<a").count(), 3, "an apostrophe opens and closes nothing: {html}");
        let html = scene(kb, "\"Kofi Annan.\"\n\nApple grew.", &own, &[]);
        assert!(html.contains(&door("apple", "Apple")), "a quote ends with its paragraph: {html}");
    }

    #[test]
    fn links_to_entries_are_doors_and_count_as_first_mentions() {
        let kb = &*WORLD;
        let html = scene(kb, "[[apple|Apple]] grew, as Apple said. [Read](https://example.org/Apple).", &["apple"], &[]);
        assert_eq!(html, format!("<p>{} grew, as Apple said. <a href=\"https://example.org/Apple\">Read</a>.</p>\n", door("apple", "Apple")));
        let html = scene(kb, "See [[apple-computer|the firm]].", &["apple"], &[]);
        assert!(html.contains(&door("apple", "the firm")), "an old id reaches the page: {html}");
    }

    #[test]
    fn doors_change_no_word() {
        let kb = &*WORLD;
        let text = |html: &str| {
            let tag = regex::Regex::new(r"</?a\b[^>]*>").unwrap();
            tag.replace_all(html, "").into_owned()
        };
        let own = ["apple", "ann-lee", "kofi-annan", "england", "bank-of-england", "united-nations"];
        let md = "**Apple & co.** Ann Lee's <b>Apple</b> -- and *the Bank of England* -- met \"UN\" at [[england|England's]] door... Kofi Annan?\n\nAT&T's UN.";
        let plain = render(md, &|t| kb.resolve(t).map(|e| (format!("/e/{}/", e.id), e.name.clone())));
        let doors = scene(kb, md, &own, &[]);
        assert!(doors.matches("<a").count() > plain.matches("<a").count(), "{doors}");
        assert_eq!(text(&doors), text(&plain));
    }
}
