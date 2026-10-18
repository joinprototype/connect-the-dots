import { useEffect, useState } from 'react';
import { loadDetails, type GraphIndex } from '../lib/data';
import type { GEdge } from '../lib/types';

/** Detail files one panel loads at most: past that, a long list reads without its qualifiers. */
const MAX_FILES = 40;

/**
 * Loads the detail files that hold these entries' words and these links' (a link's own entry first, then
 * its target's, for a link past a hub's cap), and renders again as they arrive.
 */
export function useWords(idx: GraphIndex, entries: readonly string[], links: readonly GEdge[] = []): void {
  const [, setVersion] = useState(0);
  const key = `${entries.join(' ')}|${links.map((e) => e.id).join(' ')}`;
  useEffect(() => {
    let live = true;
    const load = async (ids: string[]) => {
      const todo = [...new Set(ids)].filter((id) => !idx.details.has(id)).slice(0, MAX_FILES);
      if (!todo.length) return;
      await Promise.all(todo.map((id) => loadDetails(idx, id)));
      if (live) setVersion((v) => v + 1);
    };
    const missing = () => links.filter((e) => !e.full);
    void load([...entries, ...missing().map((e) => e.from)]).then(() => load(missing().map((e) => e.to)));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` names what is loaded
  }, [idx, key]);
}
