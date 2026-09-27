// Ajoute UN clip TikTok curé à la main, via l'oEmbed OFFICIEL de TikTok (gratuit, sans clé, respecte les ToS —
// c'est le mécanisme d'intégration sanctionné par TikTok pour une vidéo connue à l'avance ; ça ne permet PAS
// de découvrir des vidéos par hashtag/mot-clé, juste d'intégrer une URL précise qu'on lui donne).
//
// Usage : npm run tiktok:add -- "https://www.tiktok.com/@compte/video/123..." <topic>
// <topic> = un des mots de src/tiktok/topics.ts (dev, css, vibecode, localhost, ia, hacking, ...).
//
// NON TESTE avec une vraie URL (aucune fournie a la construction du script, 22/09/2026) : le format de reponse
// oEmbed de TikTok est suppose d'apres sa documentation publique, pas verifie ici avec un succes reel.
import { prisma } from '../lib/prisma';
import { normalizeTopic, TIKTOK_TOPICS } from './topics';

interface OembedResponse {
  html?: string;
  author_name?: string;
  title?: string;
}

function extractVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

async function main() {
  const [url, topicArg] = process.argv.slice(2);
  if (!url || !topicArg) {
    console.error('Usage: npm run tiktok:add -- "<url TikTok>" <topic>');
    console.error(`Topics valides : ${TIKTOK_TOPICS.join(', ')}`);
    process.exit(1);
  }
  const topic = normalizeTopic(topicArg);
  if (!topic) {
    console.error(`Topic inconnu "${topicArg}". Valides : ${TIKTOK_TOPICS.join(', ')}`);
    process.exit(1);
  }
  const videoId = extractVideoId(url);
  if (!videoId) {
    console.error('URL TikTok invalide (attendu .../video/<id>).');
    process.exit(1);
  }

  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
    headers: { 'user-agent': 'lcoalhost-bot/0.1 (+https://lcoal.host; contact: coalthehost@proton.me)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.error(`oEmbed TikTok a refusé cette URL (HTTP ${res.status}). Vidéo privée, supprimée, ou URL mal formée ?`);
    process.exit(1);
  }
  const data = (await res.json()) as OembedResponse;
  if (!data.html) {
    console.error("Réponse oEmbed sans champ html — le format a peut-être changé, à vérifier à la main.");
    process.exit(1);
  }

  await prisma.tiktokClip.upsert({
    where: { platform_videoId: { platform: 'TIKTOK', videoId } },
    create: { source: 'manuel', platform: 'TIKTOK', videoId, embedHtml: data.html, authorHandle: data.author_name ?? null, caption: data.title ?? null, topic },
    update: { embedHtml: data.html, authorHandle: data.author_name ?? null, caption: data.title ?? null, topic },
  });
  console.log(`Ajouté : ${videoId} (${topic})${data.author_name ? ` — @${data.author_name}` : ''}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
