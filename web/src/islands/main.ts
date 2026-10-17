// islands.js: progressive enhancement for reading pages. Light DOM, no framework.
import './islands.css';
import { CtdLensChips } from './lens-chips';
import { CtdSearch } from './search';

function define(name: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(name)) customElements.define(name, ctor);
}

define('ctd-search', CtdSearch);
define('ctd-lens-chips', CtdLensChips);
