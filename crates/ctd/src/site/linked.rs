//! What a page is about, said to search engines in their own vocabulary (ADR-0042).
//!
//! An entry's page carries one block of schema.org JSON-LD: the page, and the person, organization,
//! place or work it is about, tied to the same thing in open data by its `same_as` links. It states
//! only what the page already shows in its heading and facts, and nothing a reader cannot see there.

use serde_json::{Map, Value, json};

/// The subject of an entry's page, as the page shows it.
pub struct Subject<'a> {
    /// The page's absolute address.
    pub url: &'a str,
    /// Its schema.org type, from `entity-types.yaml` ("Thing" when the type names none).
    pub kind: &'a str,
    pub name: &'a str,
    pub summary: Option<&'a str>,
    /// The names the page lists under "Also known as".
    pub aliases: &'a [String],
    /// The same thing elsewhere (Wikidata, a company register), as addresses.
    pub same_as: &'a [String],
    pub image: Option<&'a str>,
    /// The entry's own `[lon, lat]`. Never its place's: that is where it is, not what it is.
    pub coords: Option<[f64; 2]>,
}

/// The JSON-LD for an entry's page: the page itself, then what it is about.
///
/// The subject has no `url` of its own: this page is a page about it, not its home. Dates are left
/// out, because a page gives them as a span that may be approximate, and structured data would state
/// them as exact.
pub fn entity(site_url: &str, site_name: &str, s: &Subject) -> Value {
    let subject_id = format!("{}#subject", s.url);

    let mut page = Map::new();
    page.insert("@type".into(), json!("WebPage"));
    page.insert("@id".into(), json!(s.url));
    page.insert("url".into(), json!(s.url));
    page.insert("name".into(), json!(s.name));
    if let Some(summary) = s.summary {
        page.insert("description".into(), json!(summary));
    }
    page.insert("isPartOf".into(), json!({ "@type": "WebSite", "@id": format!("{site_url}/#site"), "name": site_name, "url": format!("{site_url}/") }));
    page.insert("mainEntity".into(), json!({ "@id": subject_id }));

    let mut subject = Map::new();
    subject.insert("@type".into(), json!(s.kind));
    subject.insert("@id".into(), json!(subject_id));
    subject.insert("name".into(), json!(s.name));
    if !s.aliases.is_empty() {
        subject.insert("alternateName".into(), json!(s.aliases));
    }
    if let Some(summary) = s.summary {
        subject.insert("description".into(), json!(summary));
    }
    if !s.same_as.is_empty() {
        subject.insert("sameAs".into(), json!(s.same_as));
    }
    if let Some(image) = s.image {
        subject.insert("image".into(), json!(image));
    }
    if let (Some([lon, lat]), "Place") = (s.coords, s.kind) {
        subject.insert("geo".into(), json!({ "@type": "GeoCoordinates", "latitude": lat, "longitude": lon }));
    }
    subject.insert("mainEntityOfPage".into(), json!({ "@id": s.url }));

    json!({ "@context": "https://schema.org", "@graph": [Value::Object(page), Value::Object(subject)] })
}

#[cfg(test)]
mod tests {
    use super::*;

    const URL: &str = "https://example.test/e/ada/";

    fn subject<'a>(kind: &'a str, same_as: &'a [String], aliases: &'a [String]) -> Subject<'a> {
        Subject { url: URL, kind, name: "Ada Lovelace", summary: Some("Mathematician."), aliases, same_as, image: None, coords: None }
    }

    #[test]
    fn a_page_names_its_subject_and_ties_it_to_open_data() {
        let same_as = ["https://www.wikidata.org/wiki/Q7259".to_string()];
        let aliases = ["Augusta Ada King".to_string()];
        let ld = entity("https://example.test", "Connect the Dots", &subject("Person", &same_as, &aliases));

        assert_eq!(ld["@context"], "https://schema.org");
        let (page, who) = (&ld["@graph"][0], &ld["@graph"][1]);
        assert_eq!(page["@type"], "WebPage");
        assert_eq!(page["url"], URL);
        assert_eq!(page["isPartOf"]["@id"], "https://example.test/#site");
        assert_eq!(page["mainEntity"]["@id"], who["@id"], "the page points at the subject it carries");
        assert_eq!(who["@type"], "Person");
        assert_eq!(who["name"], "Ada Lovelace");
        assert_eq!(who["description"], "Mathematician.");
        assert_eq!(who["alternateName"], json!(["Augusta Ada King"]));
        assert_eq!(who["sameAs"], json!(["https://www.wikidata.org/wiki/Q7259"]));
        assert_eq!(who["mainEntityOfPage"]["@id"], URL);
    }

    #[test]
    fn a_subject_says_nothing_the_page_does_not() {
        let ld = entity("https://example.test", "Connect the Dots", &Subject { summary: None, ..subject("Thing", &[], &[]) });
        let who = ld["@graph"][1].as_object().unwrap();
        let said: Vec<&str> = who.keys().map(String::as_str).collect();
        // No url (this page is not the subject's home), no dates, and no empty lists.
        assert_eq!(said, ["@type", "@id", "name", "mainEntityOfPage"]);
        assert!(ld["@graph"][0].get("description").is_none());
    }

    #[test]
    fn only_a_place_has_a_point_on_the_map() {
        let at = Some([-118.49, 34.02]);
        let place = entity("https://example.test", "Connect the Dots", &Subject { coords: at, ..subject("Place", &[], &[]) });
        assert_eq!(place["@graph"][1]["geo"], json!({ "@type": "GeoCoordinates", "latitude": 34.02, "longitude": -118.49 }));

        let person = entity("https://example.test", "Connect the Dots", &Subject { coords: at, ..subject("Person", &[], &[]) });
        assert!(person["@graph"][1].get("geo").is_none(), "a person is not a point: {person}");
    }
}
