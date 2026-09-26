// Mode admin (demande Naim 22/09) : supprimer un meme/video/article du feed. PAS un compte — un secret partage
// (`ADMIN_TOKEN`, header `x-admin-token`), verifie en temps constant. Vide par defaut = routes TOUJOURS refusees
// (403), aucun risque tant que Naim n'a pas defini de token. Cote front : `?admin=<token>` une fois dans l'URL,
// garde en localStorage ensuite (main.js). Portee volontairement etroite : seulement `Item` (le "feed"), pas
// TiktokClip/Hack/CoalSubmission — Naim n'a demande que memes/videos/articles.
import { createHash, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { limit } from '../lib/rate-limit';
import { wrap } from '../lib/wrap';
import { TOPICS } from '../scraper/topics';
import { storageStatus } from '../storage/budget';

export const adminRouter = Router();
// Frein anti-bruteforce sur le token, LIMITE a /admin (audit 24/09) : sans chemin, ce use() s'appliquait a TOUTES les
// routes montees apres ce routeur sur /api (whoami, liquid, ads, promo/events...) -> 30 req/min cumulees par IP pour
// des visiteurs normaux (IP partagee mobile/entreprise = 429).
adminRouter.use('/admin', limit('admin', 30, 60_000));

// Comparaison a temps constant sur les EMPREINTES sha256 (meme taille, 32 octets, quel que soit l'entree) : l'ancien
// padEnd(64) comptait en caracteres, pas en octets -> caracteres multi-octets ou token > 64 = buffers de tailles
// differentes = exception (500) au lieu d'un refus.
const digest = (s: string) => createHash('sha256').update(s, 'utf8').digest();
function validToken(given: string): boolean {
  if (!config.ADMIN_TOKEN) return false; // pas de token configure = jamais admin
  return given.length > 0 && timingSafeEqual(digest(given), digest(config.ADMIN_TOKEN));
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.get('x-admin-token') ?? '';
  if (!validToken(token)) return void res.status(403).json({ error: 'admin_refuse' });
  next();
}

adminRouter.get('/admin/whoami', requireAdmin, (_req, res) => res.json({ ok: true }));

// Statut du quota disque (22/09, "big cleaning") : consulte par le front pour avertir l'admin AVANT que la
// purge automatique (scraper/run.ts, a chaque cycle) n'efface quoi que ce soit — jamais de surprise.
adminRouter.get('/admin/storage', requireAdmin, wrap(async (_req, res) => res.json(await storageStatus())));

// Epingler / desepingler (22/09) : protege un Item du "big cleaning" par quota disque. Meme perimetre etroit
// que la suppression : seulement Item, pas TiktokClip/Hack/CoalSubmission.
adminRouter.patch('/admin/items/:id/pin', requireAdmin, wrap(async (req, res) => {
  const item = await prisma.item.findUnique({ where: { id: req.params.id }, select: { id: true, pinned: true } });
  if (!item) return void res.status(404).json({ error: 'introuvable' });
  const updated = await prisma.item.update({ where: { id: item.id }, data: { pinned: !item.pinned } });
  res.json({ id: updated.id, pinned: updated.pinned });
}));

// Publication directe (23/09, SPEC-ROADMAP.md Phase A) : jusqu'ici la seule facon de publier un item passait
// par le scraper, l'agent memes (HIDDEN par defaut) ou Add Coal (PENDING_REVIEW) — aucune ne convient pour un
// item que Naim ecrit lui-meme (pub maison/annonce). Statut PUBLISHED direct : c'est l'admin qui poste, pas un
// tiers a moderer. Langue OBLIGATOIRE dans le payload (pas de defaut implicite, cf. spec) : evite qu'un item
// atterrisse dans la mauvaise langue par oubli du formulaire (embauche.js).
// Liens http(s) seulement, meme pour l'admin (audit 24/09 : z.string().url() acceptait javascript:).
const webUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), 'http_requis');
const createItemBody = z.object({
  kind: z.enum(['MEME', 'VIDEO', 'ARTICLE']),
  lang: z.enum(['en', 'fr', 'es']),
  topic: z.enum(TOPICS),
  title: z.string().trim().min(1).max(300),
  caption: z.string().trim().max(500).optional(),
  mediaUrl: webUrl.optional(),
  embedUrl: webUrl.optional(),
  thumbUrl: webUrl.optional(),
  permalink: webUrl.optional(),
  sponsored: z.boolean().optional().default(false),
});

// `.catch(next)` (23/09) : handler async sans filet -> un champ invalide saisi dans le formulaire Poster (ex. URL
// mal formee) levait une ZodError non rattrapee et ARRETAIT toute l'API. Le gestionnaire global repond 400.
adminRouter.post('/admin/items', requireAdmin, (req, res, next) => {
  createItem(req, res).catch(next);
});

async function createItem(req: Request, res: Response): Promise<void> {
  const body = createItemBody.parse(req.body);
  const item = await prisma.item.create({
    data: {
      kind: body.kind,
      source: 'lcoalhost-admin',
      sourceId: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceLabel: 'Lcoalhost',
      title: body.title,
      caption: body.caption ?? null,
      permalink: body.permalink ?? body.mediaUrl ?? body.embedUrl ?? 'https://lcoalhost.lol',
      mediaUrl: body.mediaUrl ?? null,
      embedUrl: body.embedUrl ?? null,
      thumbUrl: body.thumbUrl ?? null,
      topic: body.topic,
      lang: body.lang,
      status: 'PUBLISHED',
      storage: 'LINK',
      reusable: false,
      sponsored: body.sponsored,
      publishedAt: new Date(),
    },
  });
  console.log(`[admin] publie : ${item.kind}/${item.lang} ${item.id} (${item.title.slice(0, 60)})`);
  res.status(201).json(item);
}

adminRouter.delete('/admin/items/:id', requireAdmin, wrap(async (req, res) => {
  const item = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!item) return void res.status(404).json({ error: 'introuvable' });

  if (item.storage === 'MIRROR' && item.localPath) {
    const abs = path.join(config.mirrorDir, ...item.localPath.split('/'));
    if (abs.startsWith(config.mirrorDir)) await fs.promises.unlink(abs).catch(() => {});
  }
  await prisma.item.delete({ where: { id: item.id } });
  console.log(`[admin] supprime : ${item.kind} ${item.id} (${item.title.slice(0, 60)})`);
  res.status(204).end();
}));
