import { cpSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

// Vite builds only the React portfolio (index.html). Everything else is
// already static and ships as committed: the services pages, the 404 page,
// crawler files, the domain file and the assets whose URLs must not change
// (CV PDFs, icons, og:image). cabanyal.css is also copied unhashed, since
// the services pages and the 404 page link it at /portfolios/cabanyal.css.
const STATIC = [
  'CNAME',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'assets',
  'administraciones',
  'portfolios/cabanyal.css',
];
// Build scripts and page copy stay in the repo, not on the site.
const PRIVATE = /\.(mjs|md)$/;

function copyStatic(): Plugin {
  let outDir = 'dist';
  return {
    name: 'copy-static',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    closeBundle() {
      for (const entry of STATIC) {
        cpSync(entry, path.join(outDir, entry), { recursive: true, filter: (src) => !PRIVATE.test(src) });
      }
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  publicDir: false,
  plugins: [react(), copyStatic()],
  build: {
    // Keep hashed bundles apart from the committed assets/ folder.
    assetsDir: 'static',
  },
});
