// explorer.js: the React app mounted on #explorer-root (/x/).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ExplorerBoundary } from './boundary';
import './explorer.css';

const el = document.getElementById('explorer-root');
if (el) {
  el.classList.add('ctdx-root');
  createRoot(el).render(
    <StrictMode>
      <ExplorerBoundary>
        <App />
      </ExplorerBoundary>
    </StrictMode>,
  );
} else {
  console.warn('connect-the-dot explorer: #explorer-root not found');
}
