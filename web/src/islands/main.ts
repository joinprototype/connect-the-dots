// islands.js: progressive enhancement for reading pages. Light DOM, no framework.
import './islands.css';
import { CtdAtlasLinks } from './atlas-links';
import { CtdBox } from './box';
import { CtdLensChips } from './lens-chips';
import { startThreads } from './threads';

function define(name: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(name)) customElements.define(name, ctor);
}

define('ctd-box', CtdBox);
define('ctd-lens-chips', CtdLensChips);
define('ctd-atlas-links', CtdAtlasLinks);
startThreads();
