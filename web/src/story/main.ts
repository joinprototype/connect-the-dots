// story.js: the chapter player. MapLibre (with its stylesheet) and sigma load lazily, when a shot needs them.
import './story.css';
import { CtdStory } from './story';

if (!customElements.get('ctd-story')) customElements.define('ctd-story', CtdStory);
