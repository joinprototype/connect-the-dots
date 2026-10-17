//! Diagnostics reported by `ctd check` and the build.

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Level {
    Error,
    Warn,
}

#[derive(Debug, Clone)]
pub struct Diag {
    pub level: Level,
    pub file: String,
    pub claim: Option<String>,
    pub msg: String,
    pub hint: Option<String>,
}

impl Diag {
    pub fn err(file: impl Into<String>, msg: impl Into<String>) -> Self {
        Diag { level: Level::Error, file: file.into(), claim: None, msg: msg.into(), hint: None }
    }

    pub fn warn(file: impl Into<String>, msg: impl Into<String>) -> Self {
        Diag { level: Level::Warn, file: file.into(), claim: None, msg: msg.into(), hint: None }
    }

    pub fn claim(mut self, claim: impl Into<String>) -> Self {
        self.claim = Some(claim.into());
        self
    }

    pub fn hint(mut self, hint: impl Into<String>) -> Self {
        self.hint = Some(hint.into());
        self
    }
}

/// Prints diagnostics grouped by file and returns (errors, warnings).
pub fn print(diags: &[Diag]) -> (usize, usize) {
    let mut sorted: Vec<&Diag> = diags.iter().collect();
    sorted.sort_by(|a, b| (&a.file, a.level, &a.claim).cmp(&(&b.file, b.level, &b.claim)));
    let (mut errors, mut warnings) = (0, 0);
    for d in sorted {
        let (tag, color) = match d.level {
            Level::Error => {
                errors += 1;
                ("error", "\x1b[31m")
            }
            Level::Warn => {
                warnings += 1;
                ("warn ", "\x1b[33m")
            }
        };
        let place = match &d.claim {
            Some(c) => format!("{} [{}]", d.file, c),
            None => d.file.clone(),
        };
        eprintln!("{color}{tag}\x1b[0m {place}: {}", d.msg);
        if let Some(h) = &d.hint {
            eprintln!("      \x1b[2mhint: {h}\x1b[0m");
        }
    }
    (errors, warnings)
}
