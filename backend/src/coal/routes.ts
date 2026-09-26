// Add Coal — soumissions visiteurs (demande Naim 22/09) : un lien TikTok, un lien d'article, OU une image,
// 1 par visiteur par jour. Filtre IA (Ollama local) AVANT la relecture de Naim (coal:review/approve/reject) —
// rien n'est jamais publie automatiquement, meme principe que l'agent memes.
//
// "Connecte depuis TabascoCity" : PAS une vraie authentification (voir schema.prisma) — v1 = un champ email TC
// auto-declare, une friction legere, pas une garantie. Une verification reelle demanderait un endpoint cote
// TabascoCity (hors perimetre Lcoalhost), a construire seulement si Naim le demande.
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { classifyLink, classifySubmission } from './classify';
import { inspectLink, type LinkMeta } from './inspect';
import { publishSubmission } from './publish';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { limit } from '../lib/rate-limit';
import { wrap } from '../lib/wrap';

export const coalRouter = Router();

export async function ensureCoalUploadDir(): Promise<void> {
  await fs.promises.mkdir(config.coalUploadDir, { recursive: true });
}

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.coalUploadDir),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXT_BY_MIME[file.mimetype] ?? ''}`),
  }),
  limits: { fileSize: config.COAL_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, IMAGE_MIMES.has(file.mimetype)),
});

const fieldsSchema = z.object({
  // LINK (23/09) = formulaire actuel : un lien quelconque, Qwen decide article/video/meme. TIKTOK/ARTICLE gardes
  // pour compatibilite de l'API.
  kind: z.enum(['LINK', 'TIKTOK', 'ARTICLE', 'IMAGE']),
  url: z.string().url().max(500).refine((u) => /^https:\/\//i.test(u), 'https_requis').optional(), // jamais javascript: (audit 24/09)
  description: z.string().trim().min(3).max(500),
  tcEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
});

async function todaysCount(visitorId: string): Promise<number> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  return prisma.coalSubmission.count({ where: { visitorId, createdAt: { gte: since } } });
}

coalRouter.get('/coal/quota', wrap(async (req, res) => {
  const used = await todaysCount(req.visitorId);
  res.json({ used, max: config.COAL_MAX_PER_DAY, remaining: Math.max(0, config.COAL_MAX_PER_DAY - used) });
}));

coalRouter.post('/coal', limit('coal-submit', 20, 10 * 60_000), upload.single('image'), wrap(async (req, res) => {
  const parsed = fieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    return void res.status(400).json({ error: 'requete_invalide', details: parsed.error.issues.map((i) => i.message) });
  }
  const { kind, description } = parsed.data;
  const url = parsed.data.url?.trim() || undefined;
  const tcEmail = parsed.data.tcEmail?.trim() || undefined;

  if ((kind === 'LINK' || kind === 'TIKTOK' || kind === 'ARTICLE') && !url) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    return void res.status(400).json({ error: 'url_manquante' });
  }
  if (kind === 'TIKTOK' && url && !/tiktok\.com/i.test(url)) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    return void res.status(400).json({ error: 'url_pas_tiktok' });
  }
  if (kind === 'IMAGE' && !req.file) return void res.status(400).json({ error: 'image_manquante' });
  if (kind !== 'IMAGE' && req.file) await fs.promises.unlink(req.file.path).catch(() => {}); // image envoyee par erreur avec un autre kind

  const used = await todaysCount(req.visitorId);
  if (used >= config.COAL_MAX_PER_DAY) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    return void res.status(429).json({ error: 'quota_atteint', message: `Deja ${config.COAL_MAX_PER_DAY} soumission(s) aujourd'hui, reviens demain.` });
  }

  const imagePath = kind === 'IMAGE' && req.file ? path.basename(req.file.path) : undefined;

  // LINK : on lit la page (anti-SSRF) pour que Qwen juge sur du concret et range au bon endroit. Lien injoignable
  // ou non https public = refuse tout de suite, ca ne compte pas dans le quota.
  let linkMeta: LinkMeta | null = null;
  if (kind === 'LINK' && url) {
    linkMeta = await inspectLink(url).catch((err) => {
      console.warn(`[coal] lien illisible ${url}: ${(err as Error).message}`);
      return null;
    });
    if (!linkMeta) return void res.status(400).json({ error: 'lien_illisible' });
  }

  const failed = (err: unknown) => {
    console.error('[coal] classification echouee:', (err as Error).message);
    return { isTech: true, topic: 'general', reason: 'classification indisponible, envoye a la relecture par prudence' };
  };
  // classement d'un LINK (section + langue en plus) ; classifyLink ne leve jamais (repli mot-cle interne)
  const placed = linkMeta ? await classifyLink(description, linkMeta) : null;
  const verdict = placed ?? (await classifySubmission(kind, description, url ?? null).catch(failed));

  let submission = await prisma.coalSubmission.create({
    data: {
      visitorId: req.visitorId,
      tcEmail: tcEmail ?? null,
      kind,
      url: url ?? null,
      imagePath: imagePath ?? null,
      description,
      status: verdict.isTech ? 'PENDING_REVIEW' : 'REJECTED_AI',
      aiTopic: verdict.topic,
      aiReason: verdict.reason,
      aiKind: placed?.kind ?? null,
      aiLang: placed?.lang ?? null,
      aiMeta: linkMeta ? (linkMeta as object) : undefined,
      reviewedAt: verdict.isTech ? null : new Date(),
    },
  });

  // Image jugee hors sujet par l'IA : jamais montree a personne -> supprimee tout de suite (audit 24/09 : elle restait
  // sur le disque pour toujours, seul coal:reject faisait le menage -> disque rempli par des envois en rafale).
  if (submission.status === 'REJECTED_AI' && req.file) await fs.promises.unlink(req.file.path).catch(() => {});

  // Publication directe optionnelle (COAL_AUTO_PUBLISH, off par defaut) : seulement pour un LINK juge pertinent.
  // Echec de publication = la soumission reste simplement en relecture, rien n'est perdu.
  if (config.COAL_AUTO_PUBLISH && placed && submission.status === 'PENDING_REVIEW') {
    await publishSubmission(submission)
      .then(async () => (submission = await prisma.coalSubmission.findUniqueOrThrow({ where: { id: submission.id } })))
      .catch((err) => console.warn(`[coal] publication auto impossible (${submission.id}), reste en relecture: ${(err as Error).message}`));
  }

  res.status(201).json({
    id: submission.id,
    status: submission.status,
    kind: submission.aiKind,
    topic: submission.aiTopic,
    message:
      submission.status === 'REJECTED_AI'
        ? "Le filtre n'a pas reconnu de lien tech dans ta soumission."
        : submission.status === 'APPROVED'
          ? 'Publie.'
          : 'Recu — en attente de relecture.',
  });
}));
