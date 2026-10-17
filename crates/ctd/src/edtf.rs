//! A small EDTF (ISO 8601-2, Level 1 subset) parser.
//!
//! Supported: `1962`, `1962-10`, `1962-10-16`, negative (astronomical) years such as
//! `-0449` (= 450 BCE), the qualifiers `~` (approximate), `?` (uncertain) and `%` (both),
//! intervals `a/b`, and open ends `..` or an empty side.
//! Dates become decimal years: `start` inclusive, `end` exclusive, `None` = open.

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Precision {
    Year,
    Month,
    Day,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Point {
    pub year: i64,
    pub month: Option<u32>,
    pub day: Option<u32>,
    pub approx: bool,
    pub uncertain: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct Span {
    pub start: f64,
    pub end: Option<f64>,
    pub label: String,
    #[serde(skip)]
    pub start_label: String,
    #[serde(skip)]
    pub open_end: bool,
}

impl Span {
    /// Written as a range ("1998/2001", "2015/.."), not as one date: a tenure rather than a moment.
    pub fn is_range(&self) -> bool {
        self.open_end || self.label != self.start_label
    }
}

const MONTHS: [&str; 12] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

fn is_leap(y: i64) -> bool {
    (y.rem_euclid(4) == 0 && y.rem_euclid(100) != 0) || y.rem_euclid(400) == 0
}

fn days_in_month(y: i64, m: u32) -> u32 {
    match m {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if is_leap(y) => 29,
        _ => 28,
    }
}

fn days_in_year(y: i64) -> f64 {
    if is_leap(y) { 366.0 } else { 365.0 }
}

fn day_of_year(y: i64, m: u32, d: u32) -> u32 {
    (1..m).map(|mm| days_in_month(y, mm)).sum::<u32>() + d
}

impl Point {
    pub fn precision(&self) -> Precision {
        match (self.month, self.day) {
            (Some(_), Some(_)) => Precision::Day,
            (Some(_), None) => Precision::Month,
            _ => Precision::Year,
        }
    }

    pub fn start(&self) -> f64 {
        let y = self.year as f64;
        match (self.month, self.day) {
            (Some(m), Some(d)) => y + (day_of_year(self.year, m, d) - 1) as f64 / days_in_year(self.year),
            (Some(m), None) => y + (m - 1) as f64 / 12.0,
            _ => y,
        }
    }

    pub fn end(&self) -> f64 {
        match self.precision() {
            Precision::Day => self.start() + 1.0 / days_in_year(self.year),
            Precision::Month => self.start() + 1.0 / 12.0,
            Precision::Year => self.start() + 1.0,
        }
    }

    pub fn label(&self) -> String {
        let year = year_label(self.year);
        let core = match (self.month, self.day) {
            (Some(m), Some(d)) => format!("{d} {} {year}", MONTHS[(m - 1) as usize]),
            (Some(m), None) => format!("{} {year}", MONTHS[(m - 1) as usize]),
            _ => year,
        };
        let mut s = String::new();
        if self.approx {
            s.push_str("c. ");
        }
        s.push_str(&core);
        if self.uncertain {
            s.push('?');
        }
        s
    }
}

pub fn year_label(y: i64) -> String {
    if y >= 1 { y.to_string() } else { format!("{} BCE", 1 - y) }
}

pub fn parse_point(raw: &str) -> Result<Point, String> {
    let mut s = raw.trim();
    let (mut approx, mut uncertain) = (false, false);
    loop {
        if let Some(r) = s.strip_suffix('~') {
            approx = true;
            s = r;
        } else if let Some(r) = s.strip_suffix('?') {
            uncertain = true;
            s = r;
        } else if let Some(r) = s.strip_suffix('%') {
            approx = true;
            uncertain = true;
            s = r;
        } else {
            break;
        }
    }
    let (neg, body) = match s.strip_prefix('-') {
        Some(rest) => (true, rest),
        None => (false, s),
    };
    let mut parts = body.split('-');
    let ys = parts.next().unwrap_or("");
    if ys.is_empty() || ys.len() > 6 || !ys.chars().all(|c| c.is_ascii_digit()) {
        return Err(format!("`{raw}` is not a valid EDTF date (expected YYYY, YYYY-MM or YYYY-MM-DD)"));
    }
    let mut year: i64 = ys.parse().map_err(|_| format!("bad year in `{raw}`"))?;
    if neg {
        year = -year;
    }
    let month = match parts.next() {
        Some(ms) => {
            let m: u32 = ms.parse().map_err(|_| format!("bad month in `{raw}`"))?;
            if ms.len() != 2 || !(1..=12).contains(&m) {
                return Err(format!("month out of range in `{raw}`"));
            }
            Some(m)
        }
        None => None,
    };
    let day = match parts.next() {
        Some(ds) => {
            let d: u32 = ds.parse().map_err(|_| format!("bad day in `{raw}`"))?;
            let m = month.unwrap_or(1);
            if ds.len() != 2 || d == 0 || d > days_in_month(year, m) {
                return Err(format!("day out of range in `{raw}`"));
            }
            Some(d)
        }
        None => None,
    };
    if parts.next().is_some() {
        return Err(format!("`{raw}` has too many parts"));
    }
    Ok(Point { year, month, day, approx, uncertain })
}

fn open(side: &str) -> bool {
    let t = side.trim();
    t.is_empty() || t == ".."
}

/// Parses an EDTF date or interval into a span of decimal years.
pub fn parse(raw: &str) -> Result<Span, String> {
    let s = raw.trim();
    if s.is_empty() {
        return Err("empty date".into());
    }
    if let Some((a, b)) = s.split_once('/') {
        let pa = if open(a) { None } else { Some(parse_point(a)?) };
        let pb = if open(b) { None } else { Some(parse_point(b)?) };
        let (start, start_label) = match (&pa, &pb) {
            (Some(p), _) => (p.start(), p.label()),
            (None, Some(p)) => (p.start(), String::new()),
            (None, None) => return Err(format!("`{raw}` is open on both ends")),
        };
        let end = pb.as_ref().map(|p| p.end());
        if let Some(e) = end
            && e < start
        {
            return Err(format!("`{raw}` ends before it starts"));
        }
        let label = interval_label(pa.as_ref(), pb.as_ref());
        Ok(Span { start, end, label, start_label, open_end: pb.is_none() })
    } else {
        let p = parse_point(s)?;
        Ok(Span { start: p.start(), end: Some(p.end()), label: p.label(), start_label: p.label(), open_end: false })
    }
}

fn interval_label(a: Option<&Point>, b: Option<&Point>) -> String {
    match (a, b) {
        (Some(a), Some(b)) => {
            let plain = |p: &Point| !p.approx && !p.uncertain;
            if plain(a) && plain(b) && a.year == b.year {
                match (a.precision(), b.precision()) {
                    (Precision::Day, Precision::Day) if a.month == b.month => {
                        return format!(
                            "{}–{} {} {}",
                            a.day.unwrap(),
                            b.day.unwrap(),
                            MONTHS[(a.month.unwrap() - 1) as usize],
                            year_label(a.year)
                        );
                    }
                    (Precision::Month, Precision::Month) => {
                        return format!(
                            "{}–{} {}",
                            MONTHS[(a.month.unwrap() - 1) as usize],
                            MONTHS[(b.month.unwrap() - 1) as usize],
                            year_label(a.year)
                        );
                    }
                    _ => {}
                }
            }
            if a.precision() == Precision::Year && b.precision() == Precision::Year && a.year >= 1 && b.year >= 1 {
                let (la, lb) = (a.label(), b.label());
                return format!("{la}–{lb}");
            }
            if a.year < 1 && b.year < 1 && plain(a) && plain(b) && a.precision() == Precision::Year && b.precision() == Precision::Year {
                return format!("{}–{} BCE", 1 - a.year, 1 - b.year);
            }
            format!("{} – {}", a.label(), b.label())
        }
        (Some(a), None) => format!("{} –", a.label()),
        (None, Some(b)) => format!("until {}", b.label()),
        (None, None) => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn years_and_bce() {
        let s = parse("1962").unwrap();
        assert_eq!(s.start, 1962.0);
        assert_eq!(s.end, Some(1963.0));
        assert_eq!(s.label, "1962");
        let b = parse("-0449").unwrap();
        assert_eq!(b.label, "450 BCE");
        let z = parse("0000").unwrap();
        assert_eq!(z.label, "1 BCE");
        assert_eq!(parse("1250~").unwrap().label, "c. 1250");
    }

    #[test]
    fn intervals() {
        assert_eq!(parse("1962-10-16/1962-10-28").unwrap().label, "16–28 Oct 1962");
        assert_eq!(parse("1955/1975").unwrap().label, "1955–1975");
        let open = parse("2008-10/..").unwrap();
        assert!(open.end.is_none());
        assert_eq!(open.label, "Oct 2008 –");
        assert!(parse("1970/1960").is_err());
        assert_eq!(parse("-1999/-1499").unwrap().label, "2000–1500 BCE");
    }

    #[test]
    fn rejects_garbage() {
        assert!(parse("1962-13").is_err());
        assert!(parse("1962-02-30").is_err());
        assert!(parse("sometime").is_err());
        assert!(parse("../..").is_err());
    }

    #[test]
    fn decimal_positions() {
        let d = parse("1971-06-28").unwrap();
        assert!((d.start - 1971.4877).abs() < 0.001);
        let m = parse("1962-10").unwrap();
        assert!((m.start - 1962.75).abs() < 1e-9);
    }
}
