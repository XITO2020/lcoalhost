import fs from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { limit } from '../lib/rate-limit';
import { prisma } from '../lib/prisma';
import { safeFetch } from '../lib/safe-fetch';
import { wrap } from '../lib/wrap';
import { CONNECTORS } from '../scraper/registry';
import { REACTION_TYPES, toDtos } from './dto';

const listQuery = z.object({
  kind: z.enum(['MEME', 'VIDEO', 'ARTICLE']).optional(),
  topic: z.string().regex(/^[a-z]{2,12}$/).optional(),
  sort: z.enum(['new', 'top']).default('new'),
  // Langue de contenu de l'UI courante (contentLang() cote front : en/fr/es). Base ANGLAISE toujours servie +
  // extras de la langue UI (Naim 24/09 : "en FR, tout ce qui est en anglais + les donnees fr ; pareil pour l'ES").
  // Avant : egalite stricte -> FR ne montrait QUE les items 'fr' (or tous les memes Reddit sont 'en') -> convoyeur
  // vide. Les videos restent montrees quelle que soit la langue.
  lang: z.enum(['en', 'fr', 'es']).default('en'),
  limit: z.coerce.number().int().min(1).max(60).default(24),
  offset: z.coerce.number().int().min(0).max(5000).default(0),
});

const reactBody = z.object({ type: z.enum(REACTION_TYPES as [string, ...string[]]) });
const shelfBody = z.object({ folder: z.string().trim().min(1).max(40).default('Mon classeur') });

export const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'lcoalhost-backend' }));

router.get(
  '/items',
  wrap(async (req, res) => {
    const q = listQuery.parse(req.query);
    const rows = await prisma.item.findMany({
      where: {
        status: 'PUBLISHED',
        ...(q.kind && { kind: q.kind }),
        ...(q.topic && { topic: q.topic }),
        ...((q.kind === 'MEME' || q.kind === 'ARTICLE') && { lang: { in: q.lang === 'en' ? ['en'] : ['en', q.lang] } }),
        // Naim 24/09 ("dans les memes on retire tous ceux qui n'ont pas d'image") : un meme sans image (meme texte)
        // n'est plus liste. Filtre d'affichage seulement, rien n'est supprime en base (reversible).
        NOT: { kind: 'MEME', mediaUrl: null, localPath: null },
      },
      orderBy: q.sort === 'top' ? [{ reactionCount: 'desc' }, { score: 'desc' }] : [{ publishedAt: 'desc' }],
      take: q.limit + 1,
      skip: q.offset,
    });
    const page = rows.slice(0, q.limit);
    res.json({ items: await toDtos(page, req.visitorId), hasMore: rows.length > q.limit });
  }),
);

// LIKE/DISLIKE sont mutuellement exclusifs (Naim 22/09) : poser l'un retire l'autre s'il existait.
const REACTION_OPPOSITE: Partial<Record<string, string>> = { LIKE: 'DISLIKE', DISLIKE: 'LIKE' };

// Reaction : bascule (2e clic = retire). Le compteur denormalise `reactionCount` suit dans la meme transaction.
router.post(
  '/items/:id/react',
  limit('react', 60, 60_000),
  wrap(async (req, res) => {
    const { type } = reactBody.parse(req.body);
    const itemId = req.params.id;
    const item = await prisma.item.findFirst({ where: { id: itemId, status: 'PUBLISHED' }, select: { id: true } });
    if (!item) return res.status(404).json({ error: 'introuvable' });
    const where = { itemId_visitorId_type: { itemId, visitorId: req.visitorId, type: type as never } };
    await prisma.$transaction(async (tx) => {
      const existing = await tx.reaction.findUnique({ where });
      if (existing) {
        await tx.reaction.delete({ where });
        await tx.item.update({ where: { id: itemId }, data: { reactionCount: { decrement: 1 } } });
      } else {
        const opposite = REACTION_OPPOSITE[type];
        if (opposite) {
          const oppositeWhere = { itemId_visitorId_type: { itemId, visitorId: req.visitorId, type: opposite as never } };
          if (await tx.reaction.findUnique({ where: oppositeWhere })) {
            await tx.reaction.delete({ where: oppositeWhere });
            await tx.item.update({ where: { id: itemId }, data: { reactionCount: { decrement: 1 } } });
          }
        }
        await tx.reaction.create({ data: { itemId, visitorId: req.visitorId, type: type as never } });
        await tx.item.update({ where: { id: itemId }, data: { reactionCount: { increment: 1 } } });
      }
    });
    const fresh = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
    res.json((await toDtos([fresh], req.visitorId))[0]);
  }),
);

// Classeur : bascule "range / retire".
router.post(
  '/items/:id/shelf',
  limit('shelf', 60, 60_000),
  wrap(async (req, res) => {
    const { folder } = shelfBody.parse(req.body ?? {});
    const itemId = req.params.id;
    const item = await prisma.item.findFirst({ where: { id: itemId, status: 'PUBLISHED' }, select: { id: true } });
    if (!item) return res.status(404).json({ error: 'introuvable' });
    const key = { itemId_visitorId: { itemId, visitorId: req.visitorId } };
    const existing = await prisma.shelf.findUnique({ where: key });
    if (existing) await prisma.shelf.delete({ where: key });
    else await prisma.shelf.create({ data: { itemId, visitorId: req.visitorId, folder } });
    const fresh = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
    res.json((await toDtos([fresh], req.visitorId))[0]);
  }),
);

router.get(
  '/shelf',
  wrap(async (req, res) => {
    const folder = typeof req.query.folder === 'string' ? req.query.folder.slice(0, 40) : undefined;
    const [rows, folders] = await Promise.all([
      prisma.shelf.findMany({
        where: { visitorId: req.visitorId, ...(folder && { folder }) },
        include: { item: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.shelf.groupBy({ by: ['folder'], where: { visitorId: req.visitorId }, _count: { _all: true } }),
    ]);
    const visible = rows.map((r) => r.item).filter((i) => i.status === 'PUBLISHED');
    res.json({ items: await toDtos(visible, req.visitorId), folders: folders.map((f) => ({ folder: f.folder, count: f._count._all })) });
  }),
);

// Telechargement : seulement pour les items `reusable` (licence permissive ou maison). Le reste = "ouvrir la source".
router.get(
  '/items/:id/download',
  limit('download', 20, 60_000),
  wrap(async (req, res) => {
    const item = await prisma.item.findFirst({ where: { id: req.params.id, status: 'PUBLISHED' } });
    if (!item) return res.status(404).json({ error: 'introuvable' });
    if (!item.reusable) {
      return res.status(403).json({ error: 'non_telechargeable', message: 'Contenu tiers : ouvre la source.', permalink: item.permalink });
    }
    await prisma.item.update({ where: { id: item.id }, data: { downloadCount: { increment: 1 } } });
    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'lcoalhost';

    if (item.storage === 'MIRROR' && item.localPath) {
      const abs = path.join(config.mirrorDir, ...item.localPath.split('/'));
      if (!abs.startsWith(config.mirrorDir)) return res.status(400).end();
      return res.download(abs, `lcoalhost-${slug}${path.extname(abs)}`);
    }
    if (!item.mediaUrl) return res.status(404).json({ error: 'pas_de_fichier', permalink: item.permalink });

    const upstream = await safeFetch(item.mediaUrl);
    if (!upstream.ok || !upstream.body) return res.status(502).json({ error: 'source_indisponible' });
    const max = config.MIRROR_MAX_MB * 1024 * 1024;
    const ct = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const ext = ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm' } as Record<string, string>)[ct.split(';')[0]] ?? '';
    res.setHeader('content-type', ct);
    res.setHeader('content-disposition', `attachment; filename="lcoalhost-${slug}${ext}"`);
    let seen = 0;
    await pipeline(
      Readable.fromWeb(upstream.body as never),
      new Transform({
        transform(chunk, _e, cb) {
          seen += chunk.length;
          if (seen > max) cb(new Error('fichier trop lourd'));
          else cb(null, chunk);
        },
      }),
      res,
    ).catch(() => res.destroy());
  }),
);

// Pour les memes-texte maison (rendus en PNG cote navigateur) : on ne compte que le clic.
router.post(
  '/items/:id/downloaded',
  limit('download', 20, 60_000),
  wrap(async (req, res) => {
    const r = await prisma.item.updateMany({ where: { id: req.params.id, reusable: true, status: 'PUBLISHED' }, data: { downloadCount: { increment: 1 } } });
    res.status(r.count ? 204 : 404).end();
  }),
);

router.post(
  '/hit',
  limit('hit', 10, 60_000),
  wrap(async (_req, res) => {
    const c = await prisma.counter.upsert({ where: { key: 'hits' }, create: { key: 'hits', value: 1 }, update: { value: { increment: 1 } } });
    res.json({ hits: c.value });
  }),
);

router.get(
  '/stats',
  wrap(async (_req, res) => {
    const [byKind, byTopic, hits, last, likeCount, dislikeCount] = await Promise.all([
      prisma.item.groupBy({ by: ['kind'], where: { status: 'PUBLISHED' }, _count: { _all: true } }),
      prisma.item.groupBy({ by: ['topic'], where: { status: 'PUBLISHED' }, _count: { _all: true } }),
      prisma.counter.findUnique({ where: { key: 'hits' } }),
      prisma.scrapeRun.findFirst({ where: { finishedAt: { not: null } }, orderBy: { startedAt: 'desc' }, select: { finishedAt: true } }),
      prisma.reaction.count({ where: { type: 'LIKE' } }),
      prisma.reaction.count({ where: { type: 'DISLIKE' } }),
    ]);
    res.json({
      byKind: Object.fromEntries(byKind.map((k) => [k.kind, k._count._all])),
      byTopic: Object.fromEntries(byTopic.map((t) => [t.topic, t._count._all])),
      hits: hits?.value ?? 0,
      lastScrapeAt: last?.finishedAt ?? null,
      // "Taux de charbon en fusion" (22/09, demande Naim) : ratio Like/Hate site entier, affiche a cote du
      // tri "Top rated". Compte brut expose aussi (pas juste le %) pour que le front decide seul de l'affichage
      // (0/0 -> pas de pourcentage significatif, cf. main.js).
      reactions: { like: likeCount, dislike: dislikeCount },
    });
  }),
);

// Transparence : d'ou vient le contenu (pas d'erreurs internes exposees).
router.get('/sources', (_req, res) => {
  res.json(CONNECTORS.map((c) => ({ id: c.id, label: c.label, kinds: c.kinds, enabled: c.enabled() })));
});

export async function ensureMirrorDir(): Promise<void> {
  await fs.promises.mkdir(config.mirrorDir, { recursive: true });
}
