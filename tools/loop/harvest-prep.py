#!/usr/bin/env python3
"""Ready a harvest run (docs/loop.md, "Harvest"): what a story's saved sources say beyond the story.

    python3 tools/loop/harvest-prep.py <research dir> <run dir>

Run it in the checkout whose record the harvest adds to (a loop worktree). <research dir> holds a
story run's saved texts under src/ (.cache/stories/research/<story>/). It reads the record through
the engine (`ctd build --graph`; $CTD names a built engine, else cargo runs this checkout's), finds
for every source the saved file that holds the quotes the record already cites from it, and copies it
to <run dir>/src/<source id>.txt, so the harvester knows which text is which source and the gate's
quote check reads only those. It also writes:

    <run dir>/sources.tsv     id, title, url, quotes found, saved file
    <run dir>/entries.tsv     id, type, name, years, sealed: every entry in the record
    <run dir>/links.tsv       from, rel, to: every link the record already holds
    <run dir>/candidates.tsv  pairs of entries one saved text names close together and the record does
                              not join, with the passages that name them, best first
    <run dir>/newcomers.tsv   people the texts name whom the record lacks, matched to the atlas (open
                              data in .cache/atlas: a lead, never proof), each named near two or more
                              record entries, with the passages

No model and no network: it only reads the record and the saved files.
"""
import gzip, json, os, pathlib, re, shutil, subprocess, sys, tempfile, unicodedata

TEXT = {'.txt', '.html', '.htm', '.md', '.xml'}
# What a harvest pairs up: actors and what they made. Places (located in, born in) are what open data
# says best; traditions, concepts, groups and artifacts are never a link to a person here.
TYPES = {'person', 'org', 'event', 'work'}
# Entries a source names mostly as its publisher, platform or an author's affiliation, not as an actor.
QUIET = {'the-times', 'youtube', 'harvard-university', 'princeton-university', 'yale-university',
         'university-of-chicago'}
# Words that say how two named things are joined; a passage with more of them is read first.
CUES = re.compile(r'\b(?:[Pp]resident|[Cc]hairman|[Cc]hair|[Mm]ember|[Mm]inister|[Gg]overnor|[Vv]iceroy|[Ll]eader|'
                  r'[Ss]ecretary|[Dd]elegate|[Dd]elegation|[Ss]igned|[Aa]ppointed|[Ee]lected|[Ff]ounded|[Hh]ead|[Cc]hief|'
                  r'[Cc]ommander|[Jj]udge|[Dd]irector|[Ee]ditor|[Aa]uthor|[Ww]rote|[Ee]nacted|[Pp]assed|[Rr]atified|'
                  r'[Jj]oined|[Ss]erved|[Cc]ommission|[Cc]ommittee|[Aa]mbassador|[Pp]artner|[Ff]ounder|[Oo]wner)\b')


def squeeze(s):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKC', re.sub(r'-\s*\n\s*', '', s)).lower())


def flat(path):
    return re.sub(r'\s+', ' ', path.read_text(errors='ignore'))


def record():
    """The record as the engine reads it, and the ids of sealed entries."""
    root = pathlib.Path(subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True,
                                       text=True, check=True).stdout.strip())
    ctd = os.environ.get('CTD', '').split() or ['cargo', 'run', '-q', '--release', '--']
    with tempfile.TemporaryDirectory() as out:
        subprocess.run(ctd + ['build', '--graph', '--out', out], cwd=root, check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        graph = json.loads((pathlib.Path(out) / 'data/graph.json').read_text())
    sealed = set()
    for p in (root / 'content/entities').rglob('*.md'):
        t = p.read_text(errors='ignore')
        if re.search(r'^sealed: true', t, re.M):
            sealed.update(re.findall(r'^id: "?([^"\n]+)"?', t, re.M))
    return graph, sealed


def checkout():
    """The checkout that holds .cache (a loop worktree shares its git with the main checkout)."""
    common = subprocess.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'],
                            capture_output=True, text=True, check=True).stdout.strip()
    return pathlib.Path(common).parent


def atlas_file():
    return checkout() / '.cache/atlas/entries.tsv.gz'


def wikidata_ids():
    """Wikidata ids the record already holds (`same_as`)."""
    root = pathlib.Path(subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True,
                                       text=True, check=True).stdout.strip())
    return {q for p in (root / 'content/entities').rglob('*.md')
            for q in re.findall(r'wikidata: "?(Q\d+)', p.read_text(errors='ignore'))}


def main():
    research, run = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
    (run / 'src').mkdir(parents=True, exist_ok=True)
    graph, sealed = record()
    nodes = {n['id']: n for n in graph['nodes']}
    cited = {}
    for e in graph['edges']:
        for s in e['sources']:
            if s.get('quote') and len(squeeze(s['quote'])) >= 20:
                cited.setdefault(s['id'], set()).add(squeeze(s['quote']))

    files = [f for f in research.rglob('*') if f.is_file() and f.suffix.lower() in TEXT and 'src' in f.parts]
    texts = {f: squeeze(f.read_text(errors='ignore')) for f in files}
    rows = []
    for sid, qs in sorted(cited.items()):
        src = graph['sources'].get(sid, {})
        # most quotes found wins; a short quote can stand in several pages, so on a tie the file whose
        # name shares most words with the source's id and address wins, and plain text before markup
        words = set(re.findall(r'[a-z0-9]{3,}', f"{sid} {src.get('url') or ''}".lower()))
        best = max(texts, key=lambda f: (sum(q in texts[f] for q in qs),
                                         len(words & set(re.findall(r'[a-z0-9]{3,}', f.stem.lower()))),
                                         f.suffix == '.txt'), default=None)
        n = sum(q in texts[best] for q in qs) if best else 0
        if n * 2 > len(qs):  # most of its quotes: one shared phrase in ten is another text quoting it
            shutil.copyfile(best, run / 'src' / f'{sid}.txt')
            rows.append((sid, src.get('title', ''), src.get('url') or '', f'{n}/{len(qs)}', str(best.relative_to(research))))

    def years(n):
        w = n.get('when') or {}
        return '/'.join('' if w.get(k) is None else str(int(w[k])) for k in ('start', 'end')) if w else ''

    entries = [(i, n['type'], n['name'], years(n), 'sealed' if i in sealed else '') for i, n in sorted(nodes.items())]
    links = sorted({(e['from'], e['rel'], e['to']) for e in graph['edges']})
    cands, scans = candidates(run, nodes, sealed, links, [r[0] for r in rows])
    news = newcomers(atlas_file(), nodes, wikidata_ids(), scans)

    def tsv(name, head, data):
        (run / name).write_text('\t'.join(head) + '\n' + ''.join('\t'.join(r) + '\n' for r in data))
    tsv('sources.tsv', ('id', 'title', 'url', 'quotes', 'file'), rows)
    tsv('entries.tsv', ('id', 'type', 'name', 'years', 'sealed'), entries)
    tsv('links.tsv', ('from', 'rel', 'to'), links)
    tsv('candidates.tsv', ('a', 'a_name', 'b', 'b_name', 'source', 'passages', 'passage'), cands)
    tsv('newcomers.tsv', ('wikidata', 'name', 'description', 'years', 'living', 'same_name', 'mentions',
                          'joined', 'passages'), news)
    print(f'{len(rows)} sources matched to saved text, {len(entries)} entries, {len(links)} links, '
          f'{len(cands)} candidate pairs, {len(news)} newcomers')


WORD = re.compile(r"[A-Za-z0-9][A-Za-z0-9.'’&-]*[A-Za-z0-9]|[A-Za-z0-9]")


def index(names, strict):
    """Names by first word, longest first. `strict` names (people's, and every one-word name) never
    match as the start of a longer name ("John F. Kennedy School", "Supreme Court")."""
    by = {}
    for n, i in names.items():
        toks = tuple(WORD.findall(n))
        if toks:
            by.setdefault(toks[0], []).append((toks, i, ' ' not in n or n in strict))
    for v in by.values():
        v.sort(key=lambda x: -len(x[0]))
    return by


def find(tokens, by):
    """(position, id) of every name in a text's words, the longest at each word."""
    out, k = [], 0
    while k < len(tokens):
        for toks, i, careful in by.get(tokens[k][1], ()):
            n = len(toks)
            if tuple(t for _, t in tokens[k:k + n]) == toks:
                nxt = tokens[k + n][1] if k + n < len(tokens) else ''
                if careful and nxt[:1].isupper():
                    continue
                out.append((tokens[k][0], i))
                k += n - 1
                break
        k += 1
    return out


def with_short(full, short, here):
    """The full names, plus each short name that points to exactly one entry named in full here."""
    local = dict(full)
    for n, ids in short.items():
        ids = ids & here
        if len(ids) == 1 and n not in local:
            local[n] = next(iter(ids))
    return local


def candidates(run, nodes, sealed, links, sids, top=120, width=500):
    """Pairs of entries named in one passage of a saved text that the record does not join yet. A short
    name (an alias such as "Congress", or a surname such as "Nehru") counts in a text only when the
    entry's full name is in the same text, and only if it points to one entry there. Also returns each
    text's words and the entries it names, for newcomers()."""
    full, short, strict = {}, {}, set()
    for i, n in nodes.items():
        if i in sealed or n['type'] not in TYPES or i in QUIET:
            continue
        if ' ' in n['name']:  # a one-word name ("Paper", "Supreme") is too often another word
            full.setdefault(n['name'], i)
            if n['type'] == 'person':
                strict.add(n['name'])
                if len(n['name'].split()[-1]) >= 5:
                    short.setdefault(n['name'].split()[-1], set()).add(i)
        for a in n.get('aliases') or []:
            if len(a) >= 5:
                short.setdefault(a, set()).add(i)
    joined = {frozenset((a, b)) for a, _, b in links}
    full_by, seen, scans = index(full, strict), {}, {}
    for sid in sids:
        text = flat(run / 'src' / f'{sid}.txt')
        tokens = [(m.start(), m.group(0)) for m in WORD.finditer(text)]
        here = {i for _, i in find(tokens, full_by)}
        hits = find(tokens, index(with_short(full, short, here), strict))
        scans[sid] = (text, tokens, hits)
        for k, (at, a) in enumerate(hits):  # every pair named within one passage's width
            for at2, b in hits[k + 1:]:
                if at2 - at > width:
                    break
                if a != b and frozenset((a, b)) not in joined:
                    span = text[max(0, at - 200):at2 + 300]
                    seen.setdefault(tuple(sorted((a, b))), []).append((len(CUES.findall(span)), sid, span))
    # a pair whose passages say how two are joined ("President of", "signed") before one only named often
    ranked = sorted(seen.items(), key=lambda kv: (-max(c for c, _, _ in kv[1]), -len(kv[1])))[:top]
    out = []
    for (a, b), spans in ranked:
        spans = sorted(spans, key=lambda s: -s[0])[:3]
        out.append((a, nodes[a]['name'], b, nodes[b]['name'], spans[0][1], str(len(seen[(a, b)])),
                    ' ‖ '.join(f'[{sid}] {span}' for _, sid, span in spans)))
    return out, scans


def newcomers(atlas, nodes, have_q, scans, top=25, width=500):
    """People the saved texts name, known to the atlas (open data: a lead, never proof), whom the record
    lacks, each named near two or more record entries. Best first: most entries joined in passages
    with words such as "President" or "member", then most mentions."""
    have = {n['name'] for n in nodes.values()} | {a for n in nodes.values() for a in n.get('aliases') or []}
    known = [n['name'].split() for n in nodes.values() if n['type'] == 'person' and ' ' in n['name']]
    surnames = {k[-1] for k in known}  # "Nehru" in a text is the record's Nehru, not a namesake
    tails = {tuple(k[-2:]) for k in known if len(k) >= 3}

    def same_person(label):  # "Sardar Vallabhbhai Patel", "Mohammad Ali Jinnah": the record has them
        toks = label.split()
        return (len(toks) >= 3 and tuple(toks[-2:]) in tails) or any(
            f' {" ".join(k)} ' in f' {label} ' for k in known if k[-1] == toks[-1])
    people, labels = {}, {}
    with gzip.open(atlas, 'rt', errors='ignore') as f:
        for line in f:
            c = line.rstrip('\n').split('\t')
            if len(c) < 8 or c[1] != 'person' or ' ' not in c[3] or c[3] in have:
                continue
            labels[c[3]] = labels.get(c[3], 0) + 1
            if c[0] in have_q or same_person(c[3]):
                continue
            row = dict(q=c[0], fame=int(c[2] or 0), name=c[3], desc=c[4], years=f'{c[5]}/{c[6]}', living=c[7] == '1')
            if c[3] not in people or row['fame'] > people[c[3]]['fame']:
                people[c[3]] = row
    full = {n: n for n in people}
    short = {}
    for n in people:
        last = n.split()[-1]
        if len(last) >= 5 and last not in have and last not in surnames:
            short.setdefault(last, set()).add(n)
    full_by, found = index(full, set(full)), {}
    for sid, (text, tokens, hits) in scans.items():
        here = {i for _, i in find(tokens, full_by)}
        if not here:
            continue
        for at, who in find(tokens, index(with_short(full, short, here), set(full) | set(short))):
            f = found.setdefault(who, {'mentions': 0, 'joined': {}, 'spans': []})
            f['mentions'] += 1
            for at2, e in hits:
                if abs(at2 - at) <= width:
                    lo, hi = min(at, at2), max(at, at2)
                    span = text[max(0, lo - 200):hi + 300]
                    cues = len(CUES.findall(span))
                    f['joined'][e] = max(f['joined'].get(e, 0), cues)
                    f['spans'].append((cues, sid, e, span))
    ranked = sorted(((w, f) for w, f in found.items() if len(f['joined']) >= 2),
                    key=lambda wf: (-sum(1 for c in wf[1]['joined'].values() if c), -wf[1]['mentions']))[:top]
    out = []
    for who, f in ranked:
        p = people[who]
        joined = sorted(f['joined'], key=lambda e: -f['joined'][e])[:8]
        spans, used = [], set()
        for cues, sid, e, span in sorted(f['spans'], key=lambda s: -s[0]):
            if e not in used:
                used.add(e)
                spans.append(f'[{sid} · {e}] {span}')
            if len(spans) == 4:
                break
        out.append((p['q'], who, p['desc'], p['years'], 'living' if p['living'] else '',
                    str(labels.get(who, 1)), str(f['mentions']), ','.join(joined), ' ‖ '.join(spans)))
    return out

if __name__ == '__main__':
    main()
