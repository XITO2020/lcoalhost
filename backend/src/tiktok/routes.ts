// TikTok/Instagram — lecture seule. Aucun scraping cable : les clips viennent de `npm run tiktok:add`
// (add-clip.ts, une URL a la fois) ou `npm run watch:import` (import-dump.ts, veille manuelle en lot), tous
// deux via l'oEmbed OFFICIEL de la plateforme. Rien de plus large n'est expose ici : pas de route d'ecriture
// publique (le site n'a pas d'auth, ce serait une porte ouverte a n'importe qui pour injecter du contenu).
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { wrap } from '../lib/wrap';
import { normalizeTopic, TIKTOK_TOPICS } from './topics';

export const tiktokRouter = Router();

tiktokRouter.get('/tiktok', wrap(async (req, res) => {
  const topic = typeof req.query.topic === 'string' ? normalizeTopic(req.query.topic) : null;
  if (req.query.topic && !topic) return void res.status(400).json({ error: 'topic_inconnu', topics: TIKTOK_TOPICS });

  const clips = await prisma.tiktokClip.findMany({
    where: { status: 'PUBLISHED', ...(topic && { topic }) },
    orderBy: { addedAt: 'desc' },
    take: 12,
  });
  res.json({
    // videoId (23/09) : le front construit le lecteur officiel pilotable tiktok.com/player/v1/{videoId} (son global).
    clips: clips.map((c) => ({ id: c.id, platform: c.platform, videoId: c.videoId, embedHtml: c.embedHtml, authorHandle: c.authorHandle, caption: c.caption, note: c.note, topic: c.topic })),
    topics: TIKTOK_TOPICS,
  });
}));
