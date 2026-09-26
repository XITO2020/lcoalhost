// Memes-texte maison : contenu 100 % Lcoalhost -> reusable + MIRROR (rien a copier, le rendu est natif).
// TEXTES PROVISOIRES ecrits par Claude : a remplacer / completer par la voix de Naim.
import { PrismaClient } from '@prisma/client';
import { classify } from '../src/scraper/topics';

const prisma = new PrismaClient();

const MEMES: Array<{ title: string; caption: string; topic?: string }> = [
  { title: 'Ça marche sur ma machine.', caption: 'Alors on livre ma machine.' },
  { title: 'git push --force', caption: 'Le seul sport de compétition que je pratique au boulot.', topic: 'devops' },
  { title: 'localhost:3000 est déjà utilisé.', caption: 'Comme mon temps de cerveau disponible.', topic: 'js' },
  { title: '1997 : 14 lignes de HTML et un compteur de visites.', caption: '2026 : 400 Mo de node_modules pour afficher « Hello ».', topic: 'js' },
  { title: 'L’IA : « Je suis là pour t’aider. »', caption: 'Moi, en train de relire chaque ligne qu’elle a écrite.', topic: 'ia' },
  { title: 'Mot de passe : admin1234', caption: 'Jerry Smith, responsable sécurité depuis 2019.', topic: 'cybersec' },
  { title: 'Le stagiaire : « J’ai juste supprimé le dossier. »', caption: 'Le serveur : « Moi j’ai juste supprimé la prod. »', topic: 'devops' },
  { title: 'Active la double authentification.', caption: 'Skynet n’a pas de téléphone pour recevoir le code.', topic: 'survie' },
];

async function main() {
  for (const [i, m] of MEMES.entries()) {
    const sourceId = `maison-${i + 1}`;
    await prisma.item.upsert({
      where: { source_sourceId: { source: 'lcoalhost', sourceId } },
      create: {
        kind: 'MEME',
        source: 'lcoalhost',
        sourceId,
        sourceLabel: 'Lcoalhost',
        title: m.title,
        caption: m.caption,
        permalink: 'https://lcoalhost.lol',
        author: 'la Centrale',
        topic: m.topic ?? classify(`${m.title} ${m.caption}`),
        lang: 'fr', // voix FR exclusive de Naim (decision 22/09) : jamais traduits/affiches en mode EN
        license: 'Lcoalhost (contenu maison)',
        reusable: true,
        storage: 'MIRROR',
        publishedAt: new Date(Date.now() - i * 3600_000),
      },
      // jamais d'ecrasement du texte (si Naim edite un meme en base, le prochain start.bat n'y touche pas) ;
      // lang seul est reaffirme, pour ne pas rester bloque sur le defaut 'en' si ce champ arrive apres coup
      // (bug reel constate le 22/09 : 8 memes crees avant l'ajout de `lang` sont restes 'en').
      update: { lang: 'fr' },
    });
  }
  console.log(`seed: ${MEMES.length} memes maison`);
}

// Hacks : brouillons issus de la veille MCP du 22/09 (_obsidian-vault/radar/2026-09-22-lcoalhost-mcp-site-hacks.md).
// published=false : Claude ne publie jamais un contenu payant sans relecture de Naim.
const HACKS: Array<{ slug: string; title: string; teaser: string; body: string; sourceNote: string }> = [
  {
    slug: 'nuage-qui-flotte-sans-js',
    title: 'Le nuage qui flotte sans JS',
    teaser: "La technique du hero Lcoalhost lui-même : une forme de nuage en CSS pur (pilule + 2 ronds), qui dérive tout seul. Zéro librairie, zéro canvas.",
    body:
      '## Le principe\n\n' +
      'Une pilule blanche (`border-radius:999px`) + 2 pseudo-éléments ronds en `::before`/`::after` positionnés en haut, ' +
      'pour casser la silhouette et donner un profil de nuage. Une seule `@keyframes` en `translateY` fait le reste.\n\n' +
      '```css\n.cloud { position:relative; background:#fff; border-radius:999px;\n  box-shadow:0 14px 26px -10px rgba(10,3,2,.6); animation:drift 6.5s ease-in-out infinite; }\n' +
      '.cloud::before,.cloud::after{ content:""; position:absolute; background:#fff; border-radius:50%; z-index:-1; }\n' +
      '.cloud::before{ width:20px; height:20px; top:-8px; left:16px; }\n.cloud::after{ width:14px; height:14px; top:-5px; right:20px; }\n' +
      '@keyframes drift{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }\n```\n\n' +
      "Décale l'`animation-delay` de chaque nuage (ex. `-2.2s`, `-4.1s`) pour que plusieurs nuages ne dérivent pas en phase — " +
      "c'est ce petit désynchronisme qui vend l'illusion.",
    sourceNote: 'Recette maison (hero.js/style.css de Lcoalhost, 22/09/2026), pas de MCP nécessaire.',
  },
  {
    slug: 'debug-scene-threejs-agent',
    title: 'Debug une scène Three.js en direct avec un agent',
    teaser: "threejs-devtools-mcp expose ta scène Three.js à un agent IA : il inspecte matériaux, lumières et perfs sans que tu écrives un seul console.log.",
    body:
      '## Installation\n\nDépôt : github.com/DmitriyGolub/threejs-devtools-mcp (MIT, à vérifier avant usage commercial).\n' +
      "Fonctionne avec Three.js vanilla ET React Three Fiber.\n\n" +
      '## 3 prompts qui servent vraiment\n\n' +
      "1. « Liste tous les materiaux de la scene et signale ceux avec un `map` non charge. »\n" +
      "2. « La scene rame a 20 objets : donne-moi le rapport de perf (draw calls, geometrie la plus lourde). »\n" +
      "3. « Cette lumiere est trop dure : propose 2 reglages (`intensity`, `shadow.bias`) et applique le meilleur. »\n\n" +
      "**Non teste par Claude** (recherche seulement, 22/09/2026) : verifie le depot et la licence avant d'en faire ta chaine de debug.",
    sourceNote: 'github.com/DmitriyGolub/threejs-devtools-mcp — trouvé via veille MCP 22/09/2026, non installé ni testé.',
  },
  {
    slug: 'fond-genere-sans-image',
    title: 'Un fond généré sans texture ni image',
    teaser: "Un fond animé en quelques Ko de code plutôt qu'une image lourde à charger : clin d'œil direct au « site léger » de Lcoalhost.",
    body:
      '## Pourquoi pas une image\n\nUne image de fond en 1080p pèse facilement 200-400 Ko. Un fond genere en GLSL/Canvas ' +
      "pese le poids du code (quelques Ko) et s'adapte a n'importe quelle taille d'ecran sans flou.\n\n" +
      '## Piste a explorer : genart-mcp\n\n' +
      "Un MCP dedie a l'art generatif (p5.js, Three.js, GLSL, Canvas2D, SVG) peut generer et capturer des variantes " +
      "avant de choisir celle a coder en dur sur le site (on ne garde PAS le MCP en prod, juste le resultat).\n\n" +
      "**Non teste par Claude** (recherche seulement, 22/09/2026) — a essayer et reecrire avec un vrai resultat avant publication.",
    sourceNote: 'Piste genart-mcp (glama.ai) — trouvée via veille MCP 22/09/2026, non installée ni testée.',
  },
];

async function seedHacks() {
  for (const h of HACKS) {
    await prisma.hack.upsert({
      where: { slug: h.slug },
      create: { ...h, published: false },
      update: {}, // jamais d'ecrasement : si Naim edite/publie un hack en base, le prochain start.bat n'y touche pas
    });
  }
  console.log(`seed: ${HACKS.length} hacks (brouillons, published=false)`);
}

main()
  .then(seedHacks)
  .finally(() => prisma.$disconnect());
