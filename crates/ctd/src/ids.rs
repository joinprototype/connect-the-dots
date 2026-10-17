//! Entry ids are URLs (`/e/<id>/`). `ctd check --base <git ref>` compares the ids at that ref with
//! the current ones: an id that disappears must live on as an alias (a redirect), or its links break.

use std::{collections::HashMap, path::Path, process::Command};

use crate::{diag::Diag, kb::Kb};

/// Errors for entry ids present at `base` that no current entry or alias carries. The permanent
/// `uid` tells a rename from a removal.
pub fn check_removed(root: &Path, kb: &Kb, base: &str) -> Vec<Diag> {
    let out = Command::new("git").arg("-C").arg(root).args(["grep", "-e", "^uid:", base, "--", "content/entities"]).output();
    let Ok(out) = out else {
        return vec![Diag::warn("content/", "git is not available, so ids were not compared with the base")];
    };
    // `git grep` exits with 1 when nothing matches; anything else is an error (an unknown ref)
    if !out.status.success() && out.status.code() != Some(1) {
        return vec![Diag::err("content/", format!("cannot read `{base}`: {}", String::from_utf8_lossy(&out.stderr).trim()))];
    }
    let now: HashMap<&str, &str> = kb.entities.iter().filter_map(|e| e.uid.as_deref().map(|u| (u, e.id.as_str()))).collect();
    let prefix = format!("{base}:");
    let mut diags = Vec::new();
    // each line: "<ref>:content/entities/person/el/elon-musk.md:uid: 01JB…"
    for line in String::from_utf8_lossy(&out.stdout).lines() {
        let Some((path, uid)) = line.strip_prefix(&prefix).and_then(|l| l.rsplit_once(":uid:")) else { continue };
        let Some(old) = Path::new(path).file_stem().and_then(|s| s.to_str()) else { continue };
        if kb.index.contains_key(old) || kb.aliases.contains_key(old) {
            continue;
        }
        let msg = match now.get(uid.trim()) {
            Some(new) => format!("entry `{old}` was renamed to `{new}`: add `{old}` to its aliases, so /e/{old}/ keeps working"),
            None => format!("entry `{old}` was removed: /e/{old}/ would break. Keep `{old}` as an alias of the entry that replaces it"),
        };
        diags.push(Diag::err(path, msg));
    }
    diags
}

#[cfg(test)]
mod tests {
    use std::{fs, process::Command};

    use super::check_removed;
    use crate::testkit::{file, write_repo};

    fn person(id: &str, uid: &str, aliases: &str) -> (String, String) {
        file(&format!("content/entities/person/{}/{id}.md", &id[..2]), &format!("---\nuid: {uid}\nid: {id}\ntype: person\nname: {id}\naliases: [{aliases}]\nclaims: []\n---\n"))
    }

    #[test]
    fn a_removed_or_renamed_id_must_stay_as_an_alias() {
        let root = write_repo("ids", &[person("ann", "01AAAAAAAAAAAAAAAAAAAAAAAA", ""), person("bob", "01BBBBBBBBBBBBBBBBBBBBBBBB", "")]).unwrap();
        let git = |args: &[&str]| {
            Command::new("git")
                .arg("-C")
                .arg(&root)
                .args(["-c", "user.name=Ann", "-c", "user.email=ann@example.org", "-c", "commit.gpgsign=false"])
                .args(args)
                .output()
                .is_ok_and(|o| o.status.success())
        };
        if !git(&["init", "-q"]) {
            eprintln!("git is not available: skipped");
            return;
        }
        assert!(git(&["add", "-A"]) && git(&["commit", "-q", "--no-verify", "-m", "two entries"]));
        // ann becomes anna (same uid), bob is deleted
        fs::remove_file(root.join("content/entities/person/an/ann.md")).unwrap();
        fs::remove_file(root.join("content/entities/person/bo/bob.md")).unwrap();
        let (path, text) = person("anna", "01AAAAAAAAAAAAAAAAAAAAAAAA", "");
        fs::write(root.join(&path), text).unwrap();
        let (kb, _) = crate::load_kb(&root).unwrap();
        let said: Vec<String> = check_removed(&root, &kb, "HEAD").into_iter().map(|d| d.msg).collect();
        assert_eq!(said.len(), 2, "{said:?}");
        assert!(said[0].contains("`ann` was renamed to `anna`"), "{said:?}");
        assert!(said[1].contains("`bob` was removed"), "{said:?}");
        // keeping the old ids as aliases keeps their URLs
        let (path, text) = person("anna", "01AAAAAAAAAAAAAAAAAAAAAAAA", "ann, bob");
        fs::write(root.join(&path), text).unwrap();
        let (kb, _) = crate::load_kb(&root).unwrap();
        assert!(check_removed(&root, &kb, "HEAD").is_empty());
        assert_eq!(check_removed(&root, &kb, "no-such-ref").len(), 1, "an unknown ref is an error");
        let _ = fs::remove_dir_all(&root);
    }
}
