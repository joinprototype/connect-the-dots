import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const here = fileURLToPath(new URL('.', import.meta.url));

/** Entry name -> source module. The names become dist/<name>.js and dist/<name>.css. */
const ENTRIES = {
  islands: 'src/islands/main.ts',
  explorer: 'src/explorer/main.tsx',
  story: 'src/story/main.ts',
  world: 'src/world/main.ts',
} as const;
const ENTRY_RE = new RegExp(`^/assets/(${Object.keys(ENTRIES).join('|')})\\.(js|css)$`);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.bin': 'application/octet-stream',
};

/**
 * Dev only: serve a `ctd build` output with the browser code live.
 * - pages, /data/* and /static/* come from ../dist (or $CTD_DIST), so run `ctd build` first;
 * - /assets/<entry>.js maps to the TypeScript source, so HMR works;
 * - /assets/<entry>.css is empty in dev, because Vite injects the CSS imported by each entry;
 * - /static/site.css is ../theme/static/site.css, so theme edits show without a rebuild;
 * - /world/ and /world-synth/ (tile pyramids) come from the site, /world-synth/ from ../.cache/world-synth
 *   (`ctd world --synthetic <n>`) like `ctd serve`; $CTD_WORLD and $CTD_WORLD_SYNTH point them elsewhere.
 *   Missing tiles are 404s.
 * `apply: 'serve'` keeps all of this out of `vite build`.
 */
function devSite(): Plugin {
  const siteRoot = resolve(process.env.CTD_DIST ?? join(here, '../dist'));
  const cacheSynth = join(here, '../.cache/world-synth');
  const worlds: Record<string, string> = {
    '/world/': process.env.CTD_WORLD ? resolve(process.env.CTD_WORLD) : join(siteRoot, 'world'),
    '/world-synth/': process.env.CTD_WORLD_SYNTH
      ? resolve(process.env.CTD_WORLD_SYNTH)
      : !existsSync(join(siteRoot, 'world-synth')) && existsSync(cacheSynth)
        ? cacheSynth
        : join(siteRoot, 'world-synth'),
  };
  const themeCss = join(here, '../theme/static/site.css');
  const useTheme = existsSync(themeCss);
  if (!existsSync(join(siteRoot, 'index.html'))) console.warn(`vite: no site at ${siteRoot}; run \`cargo run -q -- build\` first`);
  return {
    name: 'ctd-dev-site',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const path = decodeURIComponent(url.pathname);
          const entry = ENTRY_RE.exec(path);
          if (entry) {
            const name = entry[1] as keyof typeof ENTRIES;
            if (entry[2] === 'js') {
              req.url = '/' + ENTRIES[name] + url.search;
              return next();
            }
            res.setHeader('Content-Type', MIME['.css']);
            res.end(`/* dev: ${name}.css is injected by /${ENTRIES[name]} */\n`);
            return;
          }
          if (path.startsWith('/@') || path.startsWith('/src/') || path.startsWith('/node_modules/')) return next();
          const world = Object.keys(worlds).find((prefix) => path.startsWith(prefix));
          if (world) {
            const base = worlds[world];
            const file = normalize(join(base, path.slice(world.length)));
            if (!file.startsWith(base) || !existsSync(file) || statSync(file).isDirectory()) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end('not found');
              return;
            }
            res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(readFileSync(file));
            return;
          }
          if (path === '/static/site.css' && useTheme) {
            res.setHeader('Content-Type', MIME['.css']);
            res.setHeader('Cache-Control', 'no-cache');
            res.end(readFileSync(themeCss));
            return;
          }

          let file = normalize(join(siteRoot, path));
          if (!file.startsWith(siteRoot)) return next();
          if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
          else if (!extname(file) && existsSync(file + '/index.html')) file = join(file, 'index.html');
          if (!existsSync(file)) {
            if (path.endsWith('/') || !extname(path)) {
              const notFound = join(siteRoot, '404.html');
              if (existsSync(notFound)) {
                res.statusCode = 404;
                res.setHeader('Content-Type', MIME['.html']);
                res.end(await server.transformIndexHtml(path, readFileSync(notFound, 'utf8')));
                return;
              }
            }
            return next();
          }
          const ext = extname(file);
          if (ext === '.html') {
            // Point the bundle tags at the sources (CSS comes in through each entry's JS in dev).
            let source = readFileSync(file, 'utf8');
            for (const [name, src] of Object.entries(ENTRIES)) {
              source = source
                .replaceAll(`src="/assets/${name}.js"`, `src="/${src}"`)
                .replace(new RegExp(`<link[^>]+href="/assets/${name}\\.css"[^>]*>\\n?`, 'g'), '');
            }
            const html = await server.transformIndexHtml(path, source, req.originalUrl);
            res.setHeader('Content-Type', MIME['.html']);
            res.end(html);
            return;
          }
          res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(readFileSync(file));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  // Built files are served from /assets/ by the site; the dev server serves the built site from /.
  base: command === 'build' ? '/assets/' : '/',
  appType: 'custom',
  publicDir: false,
  plugins: [react(), devSite()],
  server: { port: 5173 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: true,
    manifest: false,
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      input: Object.fromEntries(Object.entries(ENTRIES).map(([name, src]) => [name, resolve(here, src)])),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        codeSplitting: {
          groups: [
            // One shared renderer chunk for the ego graph, the explorer and the story graph.
            { name: 'sigma', test: /[\\/]node_modules[\\/](sigma|graphology|graphology-utils|graphology-layout-forceatlas2|events)[\\/]/ },
            { name: 'gsap', test: /[\\/]node_modules[\\/]gsap[\\/]/ },
            // Vite's dynamic-import helper, shared by every bundle: keep it out of the big chunks below,
            // or islands.js would end up importing deck.gl just to lazy-load the ego graph.
            { name: 'preload-helper', test: /preload-helper/, priority: 20 },
            // deck.gl and its WebGL stack: only the world viewer (world.js, the explorer's world mode) loads it.
            {
              name: 'deck',
              test: /[\\/]node_modules[\\/](@deck\.gl|@luma\.gl|@loaders\.gl|@math\.gl|@probe\.gl|mjolnir\.js|@mapbox[\\/]tiny-sdf)[\\/]/,
            },
          ],
        },
        assetFileNames: (asset) => {
          const name = asset.names[0] ?? '';
          // The MapLibre worker is copied verbatim (imported with ?url); keep it next to the chunks.
          if (name.endsWith('.mjs') || name.endsWith('.js')) return 'chunks/[name]-[hash][extname]';
          return '[name][extname]';
        },
      },
    },
  },
}));
