// Publie une soumission Add Coal validee : cree le contenu public au BON endroit du site (23/09 : logique sortie
// de approve.ts pour servir aussi a la publication automatique optionnelle, cf. COAL_AUTO_PUBLISH dans routes.ts).
//  - TIKTOK, ou LINK que Qwen a range en VIDEO avec un id TikTok -> TiktokClip (rail Veille), oEmbed officiel ;
//  - ARTICLE / LINK->ARTICLE -> Item ARTICLE (lien + vignette) ;
//  - LINK->VIDEO -> Item VIDEO (lecteur integrable ou fichier video direct, jamais copie) ;
//  - LINK->MEME -> Item MEME (image affichee depuis sa source, jamais copiee : contenu tiers = lien + credit) ;
//  - IMAGE (upload) -> copie dans le mirror, Item MEME `reusable:false`.
// La section (kind), la categorie (topic) et la langue viennent du classement de Qwen (classify.ts).
import fs from 'node:fs';
import path from 'node:path';
import type { CoalSubmission } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { classify } from '../scraper/topics';
import { normalizeTopic, SCRAPER_TO_TIKTOK_TOPIC } from '../tiktok/topics';
import type { LinkMeta } from './inspect';

async function tiktokClip(sub: CoalSubmission, url: string, videoId: string): Promise<string> {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
    headers: { 'user-agent': config.userAgent },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`oEmbed TikTok a refuse cette URL (HTTP ${res.status}).`);
  const data = (await res.json()) as { html?: string; author_name?: string; title?: string };
  if (!data.html) throw new Error('Reponse oEmbed sans champ html.');
  const topic = normalizeTopic(sub.aiTopic ?? '') ?? SCRAPER_TO_TIKTOK_TOPIC[sub.aiTopic ?? 'general'] ?? 'tech';
  // Clip deja present (import Naim, videos.json...) : on n'y touche PAS — bug reel du 23/09, une soumission visiteur
  // reecrivait la categorie et la legende d'un clip deja cure par Naim.
  const clip = await prisma.tiktokClip.upsert({
    where: { platform_videoId: { platform: 'TIKTOK', videoId } },
    create: { source: 'coal', platform: 'TIKTOK', videoId, embedHtml: data.html, authorHandle: data.author_name ?? null, caption: data.title ?? sub.description, topic },
    update: {},
  });
  return clip.id;
}

const common = (sub: CoalSubmission) => ({
  source: 'coal',
  sourceId: sub.id,
  sourceLabel: 'Add Coal (soumission visiteur)',
  // JAMAIS l'email (audit 24/09, BLOQUANT) : auto-declare, non verifie -> n'importe qui pouvait faire publier l'email
  // d'un tiers a cote d'un contenu. Il reste en base sur la soumission (relecture), jamais sur le contenu public.
  author: 'visiteur',
  topic: sub.aiTopic ?? classify(sub.description),
  lang: sub.aiLang ?? 'en',
  reusable: false,
  status: 'PUBLISHED' as const,
  publishedAt: new Date(),
});

/** Cree le contenu public et passe la soumission en APPROVED. Leve une Error lisible si c'est impossible. */
export async function publishSubmission(sub: CoalSubmission): Promise<string> {
  if (sub.status !== 'PENDING_REVIEW') throw new Error(`Statut actuel: ${sub.status} (seul PENDING_REVIEW peut etre publie).`);
  let resultItemId: string;

  if (sub.kind === 'TIKTOK') {
    const videoId = sub.url?.match(/\/video\/(\d+)/)?.[1];
    if (!videoId || !sub.url) throw new Error('URL TikTok invalide (attendu .../video/<id>).');
    resultItemId = await tiktokClip(sub, sub.url, videoId);
  } else if (sub.kind === 'LINK') {
    const m = sub.aiMeta as unknown as LinkMeta | null;
    if (!m || !sub.url) throw new Error('Lien sans inspection enregistree.');
    const title = (m.title ?? sub.description).slice(0, 160);
    if (sub.aiKind === 'VIDEO' && m.tiktokVideoId) {
      // Un carrousel .../photo/<id> est refuse par l'oEmbed, le meme id en .../video/<id> passe (cf. import-dump.ts).
      resultItemId = await tiktokClip(sub, m.url.replace('/photo/', '/video/'), m.tiktokVideoId);
    } else if (sub.aiKind === 'VIDEO') {
      if (!m.embedUrl && !m.mediaUrl) throw new Error('Aucun lecteur video trouve sur ce lien.');
      const item = await prisma.item.create({
        data: { ...common(sub), kind: 'VIDEO', title, permalink: m.url, embedUrl: m.embedUrl, mediaUrl: m.embedUrl ? null : m.mediaUrl, thumbUrl: m.thumbUrl, license: null, storage: 'LINK' },
      });
      resultItemId = item.id;
    } else if (sub.aiKind === 'MEME') {
      const image = m.mediaUrl ?? m.thumbUrl;
      if (!image) throw new Error('Aucune image trouvee sur ce lien.');
      const item = await prisma.item.create({
        data: { ...common(sub), kind: 'MEME', title: title.slice(0, 120), permalink: m.url, mediaUrl: image, license: null, storage: 'LINK' },
      });
      resultItemId = item.id;
    } else {
      const item = await prisma.item.create({
        data: { ...common(sub), kind: 'ARTICLE', title, permalink: m.url, thumbUrl: m.thumbUrl, license: null, storage: 'LINK' },
      });
      resultItemId = item.id;
    }
  } else if (sub.kind === 'ARTICLE') {
    if (!sub.url) throw new Error('URL article manquante.');
    const item = await prisma.item.create({
      data: { ...common(sub), kind: 'ARTICLE', title: sub.description.slice(0, 160), permalink: sub.url, license: null, storage: 'LINK' },
    });
    resultItemId = item.id;
  } else {
    if (!sub.imagePath) throw new Error('Image manquante sur cette soumission.');
    const src = path.join(config.coalUploadDir, sub.imagePath);
    if (!fs.existsSync(src)) throw new Error(`Fichier introuvable: ${src}`);
    await fs.promises.mkdir(config.mirrorDir, { recursive: true });
    const filename = `coal-${sub.id}${path.extname(sub.imagePath)}`;
    const dest = path.join(config.mirrorDir, filename);
    await fs.promises.copyFile(src, dest);
    const { size: fileSize } = await fs.promises.stat(dest); // meme comptage que mirror.ts, sert au "big cleaning"
    const item = await prisma.item.create({
      data: {
        ...common(sub),
        kind: 'MEME',
        title: sub.description.slice(0, 120),
        permalink: 'https://lcoalhost.lol', // pas de page source externe : upload direct
        license: 'Soumission visiteur (Add Coal) — droits non verifies',
        storage: 'MIRROR',
        localPath: filename,
        mirroredAt: new Date(),
        fileSize,
      },
    });
    resultItemId = item.id;
  }

  await prisma.coalSubmission.update({ where: { id: sub.id }, data: { status: 'APPROVED', resultItemId, reviewedAt: new Date() } });
  return resultItemId;
}
