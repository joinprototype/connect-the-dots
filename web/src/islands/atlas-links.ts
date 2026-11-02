// <ctd-atlas-links q="Q42">: a page written by hand, then the wider links open data knows of. Marked as
// such, and fetched only when a reader scrolls near it: nothing off screen is loaded.
import { atlasEntry, hrefOf, INKS, openRest, type Neighbour } from '../lib/atlas';
import { el } from '../lib/dom';

export class CtdAtlasLinks extends HTMLElement {
  connectedCallback(): void {
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen.disconnect();
          void this.fill();
        }
      },
      { rootMargin: '400px' },
    );
    seen.observe(this);
  }

  private async fill(): Promise<void> {
    const q = this.getAttribute('q');
    const entry = q ? await atlasEntry(q) : undefined;
    if (!entry?.g.length) return;
    const list = el('div', 'atlas-groups');
    for (const [i, [phrase, names, more]] of entry.g.entries()) {
      const part = el('section', 'atlas-group');
      const head = el('h3', '', phrase.charAt(0).toUpperCase() + phrase.slice(1));
      if (more) head.append(el('span', 'count', (names.length + more).toLocaleString('en')));
      part.append(head);
      const ul = el('ul');
      const add = (n: Neighbour) => {
        const a = el('a', '', n[1]);
        a.href = hrefOf(n);
        a.style.setProperty('--c', `var(${INKS[n[2]] ?? '--accent'})`);
        const li = el('li');
        li.append(a);
        ul.append(li);
      };
      names.forEach(add);
      part.append(ul);
      if (more) part.append(openRest(q!, i, more, [], 'atlas-open', add));
      list.append(part);
    }
    const note = el('p', 'atlas-note', 'From Wikidata, an open database anyone can edit. We have not checked these links by hand.');
    this.append(el('h2', '', 'Also in open data'), list, note);
  }
}
