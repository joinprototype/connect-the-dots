#!/usr/bin/env python3
"""Every quote added since a git ref must stand, word for word, in saved source text.
Case, spacing and punctuation are ignored, and so is a word broken across a line.
Only files in a folder named src count: a generator script or a note holds the quote it was given.
Usage: python3 tools/qa/quotecheck.py <dir of saved text> [base ref, default main]"""
import json, pathlib, re, subprocess, sys, unicodedata

def squeeze(s):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKC', re.sub(r'-\s*\n\s*', '', s)).lower())

saved, base = pathlib.Path(sys.argv[1]), sys.argv[2] if len(sys.argv) > 2 else 'main'
added = subprocess.run(['git', 'diff', base, '--', 'content'], capture_output=True, text=True, check=True).stdout
quotes = [json.loads(q) for line in added.splitlines() if line.startswith('+') for q in re.findall(r'quote: ("(?:[^"\\]|\\.)*")', line)]
texts = [squeeze(p.read_text(errors='ignore')) for p in saved.rglob('*') if p.is_file() and 'src' in p.parts and p.suffix not in ('.pdf', '.raw', '.png', '.jpg')]
joined = '\0'.join(texts)
missing = [q for q in quotes if squeeze(q) not in joined]
for q in missing:
    print('NOT FOUND:', q[:120])
print(f'{len(quotes)} quotes, {len(missing)} not found in {len(texts)} saved texts')
sys.exit(1 if missing else 0)
