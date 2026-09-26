// Liquid Enhancement (22/09, demande Naim) : le visiteur decrit une idee d'amelioration pour une des 3
// parties du site (metrics/videos/articles+memes), Qwen (Ollama local, meme mecanisme que agents/
// meme-writer.ts, zero cout) la reformule en version "liquide" plus concrete. Si satisfait, le visiteur
// soumet — TOUJOURS en PENDING_REVIEW, jamais applique automatiquement au site (meme discipline que Add
// Coal et l'agent memes : Naim relit et decide via liquid:review/approve/reject).
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { limit } from '../lib/rate-limit';
import { wrap } from '../lib/wrap';

export const liquidRouter = Router();

const AREAS = ['METRICS', 'VIDEOS', 'ARTICLES_MEMES'] as const;

const AREA_DESC: Record<(typeof AREAS)[number], string> = {
  METRICS: 'la carte "Vos metriques de dev pourri" (IP, geolocalisation approximative, resolution ecran, fuseau horaire, langue, OS/navigateur, detection de trackers)',
  VIDEOS: 'la captation/le scraping des videos (PeerTube via Sepia Search, oEmbed TikTok/Instagram)',
  ARTICLES_MEMES: 'la captation/le scraping des articles et memes (Hacker News, DEV, Lobsters, Reddit, Lemmy, flux RSS securite/IA)',
};

const LANG_NAME: Record<string, string> = { en: 'anglais', fr: 'francais', es: 'espagnol' };

function systemPrompt(area: (typeof AREAS)[number], lang: string): string {
  return `Tu es un assistant produit pour Lcoalhost, un site d'humour dev/tech qui scrape du contenu et affiche des metriques de connexion. Le visiteur propose une idee brute d'amelioration pour ${AREA_DESC[area]}. Reformule cette idee en une specification courte, concrete et realiste (3 a 4 phrases maximum), en ${LANG_NAME[lang] ?? 'francais'}. Reste factuel : n'invente jamais qu'une fonctionnalite existe deja, ne promets rien de faux ni de techniquement impossible. Si l'idee est hors-sujet, incomprehensible ou absurde, dis-le poliment plutot que d'inventer une reformulation. Reponds avec SEULEMENT le texte reformule, sans preambule, sans guillemets, sans markdown.`;
}

async function askQwen(system: string, prompt: string): Promise<string | null> {
  const res = await fetch(`${config.OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: config.OLLAMA_MODEL, system, prompt, stream: false, options: { temperature: 0.6 } }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status} (${config.OLLAMA_URL} joignable ?)`);
  const data = (await res.json()) as { response?: string };
  const text = data.response?.trim();
  return text ? text.slice(0, 800) : null;
}

const enhanceBody = z.object({
  area: z.enum(AREAS),
  prompt: z.string().trim().min(5).max(400),
  lang: z.enum(['en', 'fr', 'es']).default('fr'),
});

liquidRouter.post('/liquid/enhance', limit('liquid-enhance', 10, 60_000), wrap(async (req, res) => {
  const parsed = enhanceBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'requete_invalide', details: parsed.error.issues.map((i) => i.message) });
  const { area, prompt, lang } = parsed.data;
  try {
    const enhanced = await askQwen(systemPrompt(area, lang), prompt);
    if (!enhanced) return void res.status(502).json({ error: 'reponse_illisible' });
    res.json({ enhanced });
  } catch (err) {
    res.status(503).json({ error: 'ollama_indisponible', message: (err as Error).message });
  }
}));

async function todaysCount(visitorId: string): Promise<number> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  return prisma.liquidSubmission.count({ where: { visitorId, createdAt: { gte: since } } });
}

liquidRouter.get('/liquid/quota', wrap(async (req, res) => {
  const used = await todaysCount(req.visitorId);
  res.json({ used, max: config.LIQUID_SUBMIT_MAX_PER_DAY, remaining: Math.max(0, config.LIQUID_SUBMIT_MAX_PER_DAY - used) });
}));

const submitBody = z.object({
  area: z.enum(AREAS),
  rawInput: z.string().trim().min(5).max(400),
  enhanced: z.string().trim().min(3).max(800),
});

liquidRouter.post('/liquid', limit('liquid-submit', 20, 10 * 60_000), wrap(async (req, res) => {
  const parsed = submitBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'requete_invalide', details: parsed.error.issues.map((i) => i.message) });

  const used = await todaysCount(req.visitorId);
  if (used >= config.LIQUID_SUBMIT_MAX_PER_DAY) {
    return void res.status(429).json({ error: 'quota_atteint', message: `Deja ${config.LIQUID_SUBMIT_MAX_PER_DAY} soumission(s) aujourd'hui, reviens demain.` });
  }

  const submission = await prisma.liquidSubmission.create({ data: { visitorId: req.visitorId, ...parsed.data } });
  res.status(201).json({ id: submission.id, status: submission.status });
}));
