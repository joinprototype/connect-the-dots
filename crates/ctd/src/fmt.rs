//! `ctd fmt`: assigns permanent ULIDs to files that lack a `uid`.

use std::{fs, path::Path};

use anyhow::Result;
use ulid::Ulid;

use crate::load::{ext, files, split_frontmatter};

pub fn fill_uids(root: &Path) -> Result<usize> {
    let content = root.join("content");
    let mut n = 0;
    for dir in ["entities", "chapters"] {
        for p in files(&content.join(dir)).into_iter().filter(|p| ext(p) == "md") {
            let text = fs::read_to_string(&p)?;
            let Some((fm, _)) = split_frontmatter(&text) else { continue };
            if fm.lines().any(|l| l.starts_with("uid:")) {
                continue;
            }
            let nl = if text.contains("\r\n") { "\r\n" } else { "\n" };
            let updated = text.replacen(&format!("---{nl}"), &format!("---{nl}uid: {}{nl}", Ulid::new()), 1);
            fs::write(&p, updated)?;
            n += 1;
        }
    }
    for p in files(&content.join("sources")).into_iter().filter(|p| matches!(ext(p), "yaml" | "yml")) {
        let text = fs::read_to_string(&p)?;
        if text.lines().any(|l| l.starts_with("uid:")) {
            continue;
        }
        let nl = if text.contains("\r\n") { "\r\n" } else { "\n" };
        fs::write(&p, format!("uid: {}{nl}{text}", Ulid::new()))?;
        n += 1;
    }
    Ok(n)
}

#[cfg(test)]
mod tests {
    use crate::testkit::{file, write_repo};

    #[test]
    fn a_windows_file_gets_its_uid_once() {
        let root = write_repo("fmt-crlf", &[file("content/entities/person/zo/zoe.md", "---\r\nid: zoe\r\ntype: person\r\nname: Zoe\r\nclaims: []\r\n---\r\n")]).unwrap();
        assert_eq!(super::fill_uids(&root).unwrap(), 1);
        assert_eq!(super::fill_uids(&root).unwrap(), 0, "the uid is written, so a second run has nothing to do");
        let text = std::fs::read_to_string(root.join("content/entities/person/zo/zoe.md")).unwrap();
        assert!(text.starts_with("---\r\nuid: ") && !text.replace("\r\n", "").contains('\n'), "line endings kept: {text:?}");
        let _ = std::fs::remove_dir_all(&root);
    }
}
