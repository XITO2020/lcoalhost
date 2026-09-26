// Lcoalhost — en dev, /api, /mirror, /local-videos, /item, /sitemap.xml et /llms-full.txt sont proxifies vers
// le backend :4200 (meme origine => cookie visiteur OK). En prod, nginx doit faire de meme (voir
// deploy/nginx.conf, conteneur lh_web sur le KVM2) — /item/:id, /sitemap.xml, /llms-full.txt sont generes par le backend
// depuis la base (SPEC-ROADMAP.md Phase C, 23/09), plus des fichiers statiques. /local-videos n'existe jamais
// en prod (cf. index.ts/config.ts) : inoffensif de le garder ici, la route backend n'existe simplement pas
// si LOCAL_VIDEOS_DIR est vide ou NODE_ENV=production.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { HIDDEN_IN_PROD } from './src/pubs-hidden-in-prod.js';

// Build de PRODUCTION seulement (Naim 24/09) : retire de dist/pubs/ les pastilles de sites a garder discrets —
// pub.js ne les affiche deja pas en prod, mais le fichier aurait encore ete accessible par son URL sur le serveur.
function dropHiddenPubs() {
  let outDir = 'dist';
  return {
    name: 'lcoalhost-drop-hidden-pubs',
    apply: 'build',
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    closeBundle() {
      for (const f of HIDDEN_IN_PROD) fs.rmSync(path.join(outDir, 'pubs', f), { force: true });
    },
  };
}

// Dossiers "deposer un fichier = pris en compte" (Naim 23/09) : en dev, le generateur correspondant est relance des
// qu'un fichier y est ajoute ou retire — plus besoin de redemarrer le serveur (souci reel du 23/09 : 10 fonds jour
// deposes pendant que le dev tournait, restes invisibles). En build, predev/prebuild (package.json) suffisent.
const WATCHED = [
  ...['circles', 'squares', path.join('zone_fr_only', 'circles'), path.join('zone_fr_only', 'squares')].map((s) => ({
    dir: path.join('public', 'pubs', s),
    script: 'scripts/gen-pubs.js',
  })),
  { dir: path.join('public', 'videos'), script: 'scripts/gen-backup-videos.js' },
  { dir: path.join('public', 'videos', 'always_init'), script: 'scripts/gen-backup-videos.js' },
  ...['fr', 'en', 'es'].map((l) => ({ dir: path.join('public', 'videos', l), script: 'scripts/gen-backup-videos.js' })),
  { dir: path.join('public', 'img', 'day-bg'), script: 'scripts/gen-day-bg.js' },
  { dir: path.join('public', 'img'), script: 'scripts/gen-banner-titles.js' },
];
function regenerateOnDrop() {
  return {
    name: 'lcoalhost-regenerate-on-drop',
    configureServer(server) {
      const root = server.config.root;
      const run = (file) => {
        const rel = path.relative(root, file);
        for (const w of WATCHED) {
          if (path.dirname(rel) === w.dir || (w.dir === path.join('public', 'img') && rel.startsWith(w.dir + path.sep))) {
            execFileSync(process.execPath, [w.script], { cwd: root, stdio: 'inherit' });
          }
        }
      };
      server.watcher.on('add', run);
      server.watcher.on('unlink', run);
    },
  };
}

export default defineConfig({
  plugins: [regenerateOnDrop(), dropHiddenPubs()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:4200', changeOrigin: true },
      '/mirror': { target: 'http://localhost:4200', changeOrigin: true },
      '/local-videos': { target: 'http://localhost:4200', changeOrigin: true },
      '/item': { target: 'http://localhost:4200', changeOrigin: true },
      '/sitemap.xml': { target: 'http://localhost:4200', changeOrigin: true },
      '/llms-full.txt': { target: 'http://localhost:4200', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 650, // three.js (~500 Ko, 128 Ko gzip) vit dans un chunk charge en differe
  },
});
