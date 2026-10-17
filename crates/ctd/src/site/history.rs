//! Page history: the commits behind each content file, from one `git log` per build.

use std::{collections::HashMap, path::Path, process::Command};

use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub(super) struct Commit {
    hash: String,
    date: String,
    author: String,
    subject: String,
}

pub(super) fn git(root: &Path, args: &[&str]) -> Option<String> {
    let out = Command::new("git").arg("-C").arg(root).args(args).output().ok()?;
    out.status.success().then(|| String::from_utf8_lossy(&out.stdout).trim().to_string())
}

/// Page history: the commits behind each file under `content/`, newest first, from one `git log`
/// per build. Renames are followed as `git log --follow` does: a file keeps its commits under
/// earlier names. Empty when there is no git, no repository or no commit yet, which costs one
/// failed git call.
#[derive(Default)]
pub(super) struct History(HashMap<String, Vec<Commit>>);

impl History {
    pub(super) fn load(root: &Path) -> Self {
        let args = [
            "-c", "log.showSignature=false", "-c", "log.showRoot=true", "log", "-z", "--no-color", "--relative", "--date-order", "-M", "--name-status",
            "--date=short", "--format=%x1e%h%x1f%ad%x1f%an%x1f%s", "--", "content",
        ];
        History(git(root, &args).map(|log| parse_history(&log)).unwrap_or_default())
    }

    pub(super) fn of(&self, rel_path: &str) -> &[Commit] {
        self.0.get(rel_path).map_or(&[], Vec::as_slice)
    }
}

/// Reads `git log -z --name-status` output, newest commit first. Each commit opens with 0x1e and
/// its header fields are split by 0x1f; then come NUL-separated changes: a status and a path, or
/// `R<score>`, the old path and the new one. Going back in time, a rename hands the history of
/// the old name to the file's current name, and the new name's own earlier history (a file that
/// lived there before) is left out, as `git log --follow` does.
fn parse_history(log: &str) -> HashMap<String, Vec<Commit>> {
    let mut by_path: HashMap<String, Vec<Commit>> = HashMap::new();
    // a name the file had earlier → the name it has now; None: an older file that no longer exists
    let mut now_named: HashMap<String, Option<String>> = HashMap::new();
    for record in log.split('\u{1e}') {
        let mut fields = record.split('\0');
        let header: Vec<&str> = fields.next().unwrap_or_default().splitn(4, '\u{1f}').collect();
        let [hash, date, author, subject] = header[..] else { continue };
        let commit = Commit { hash: hash.into(), date: date.into(), author: author.into(), subject: subject.into() };
        while let Some(status) = fields.next() {
            let status = status.trim_start_matches('\n');
            if status.is_empty() {
                continue;
            }
            let Some(path) = fields.next() else { break };
            let (old, path) = if status.starts_with('R') {
                let Some(new) = fields.next() else { break };
                (Some(path), new)
            } else {
                (None, path)
            };
            let current = now_named.get(path).cloned().unwrap_or_else(|| Some(path.to_string()));
            if let Some(current) = &current {
                let list = by_path.entry(current.clone()).or_default();
                if list.last().is_none_or(|c| c.hash != commit.hash) {
                    list.push(commit.clone());
                }
            }
            if let Some(old) = old {
                now_named.insert(path.to_string(), None);
                now_named.insert(old.to_string(), current);
            }
        }
    }
    by_path
}

#[cfg(test)]
mod tests {
    use std::{path::Path, process::Command};

    use super::{Commit, History, parse_history};

    /// A `git log -z --name-status` record, as `History::load` asks for it.
    fn commit_record(hash: &str, subject: &str, changes: &[&str]) -> String {
        format!("\u{1e}{hash}\u{1f}2026-10-17\u{1f}Ann Author\u{1f}{subject}\0\n{}\0", changes.join("\0"))
    }

    #[test]
    fn history_follows_renames_from_one_log() {
        // newest first: b renamed to c, a renamed to b, then edits under the old names
        let log = [
            commit_record("h6", "Edit c and the new b", &["M", "content/c.md", "M", "content/b.md"]),
            commit_record("h5", "Move a to b", &["R100", "content/a.md", "content/b.md"]),
            commit_record("h4", "Move b to c", &["R095", "content/b.md", "content/c.md"]),
            commit_record("h3", "Edit a and b", &["M", "content/a.md", "M", "content/b.md"]),
            commit_record("h2", "Add a and josé", &["A", "content/a.md", "A", "content/josé.md"]),
            commit_record("h1", "Add b, later c", &["A", "content/b.md", "D", "content/gone.md"]),
        ]
        .concat();
        let by_path = parse_history(&log);
        let hashes = |p: &str| by_path.get(p).map(|l| l.iter().map(|c| c.hash.as_str()).collect::<Vec<_>>()).unwrap_or_default();
        assert_eq!(hashes("content/b.md"), ["h6", "h5", "h3", "h2"], "the file now at b came from a");
        assert_eq!(hashes("content/c.md"), ["h6", "h4", "h3", "h1"], "the file now at c was b before");
        assert_eq!(hashes("content/a.md"), Vec::<&str>::new(), "no file is named a any more");
        assert_eq!(hashes("content/josé.md"), ["h2"]);
        assert_eq!(
            by_path["content/b.md"][0],
            Commit { hash: "h6".into(), date: "2026-10-17".into(), author: "Ann Author".into(), subject: "Edit c and the new b".into() }
        );
        assert!(parse_history("").is_empty());
        assert!(parse_history("fatal: not a git repository").is_empty());
    }

    #[test]
    fn history_comes_from_one_git_log_and_is_empty_before_the_first_commit() {
        let root = std::env::temp_dir().join(format!("ctd-test-{}-site-history", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("content/entities")).unwrap();
        let git = |args: &[&str]| {
            Command::new("git")
                .arg("-C")
                .arg(&root)
                .args(["-c", "user.name=Ann Author", "-c", "user.email=ann@example.org", "-c", "commit.gpgsign=false"])
                .args(args)
                .output()
                .is_ok_and(|o| o.status.success())
        };
        if !git(&["init", "-q"]) {
            eprintln!("git is not available: skipped");
            return;
        }
        let write = |p: &str, text: &str| std::fs::write(root.join(p), text).unwrap();
        write("content/entities/ann.md", "Ann\n");
        assert!(History::load(&root).0.is_empty(), "files not committed yet have no history");
        assert!(git(&["add", "-A"]) && git(&["commit", "-q", "--no-verify", "-m", "Add Ann"]));
        assert!(git(&["mv", "content/entities/ann.md", "content/entities/anna.md"]) && git(&["commit", "-q", "--no-verify", "-m", "Rename Ann"]));
        write("content/entities/anna.md", "Ann\nAnna\n");
        assert!(git(&["commit", "-q", "--no-verify", "-am", "Edit Anna"]));
        let history = History::load(&root);
        let subjects: Vec<&str> = history.of("content/entities/anna.md").iter().map(|c| c.subject.as_str()).collect();
        assert_eq!(subjects, ["Edit Anna", "Rename Ann", "Add Ann"]);
        assert_eq!(history.of("content/entities/anna.md")[0].author, "Ann Author");
        assert!(history.of("content/entities/ann.md").is_empty());
        let _ = std::fs::remove_dir_all(&root);
        assert!(History::load(Path::new(&root)).0.is_empty(), "no repository, no history");
    }
}
