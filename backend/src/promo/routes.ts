// Mesure pub anonyme (23/09, SPEC-ROADMAP.md Phase D.4) : le front signale "encart vu a l'ecran" / "encart
// clique" ; on n'enregistre que des COMPTEURS agreges par encart et par jour (table PromoStat) — jamais
// d'identifiant visiteur, d'IP ni de cookie en base. Objectif : un taux de clic reel a montrer a un annonceur.
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { limit } from '../lib/rate-limit';
import { HOUSE_PIN_FILES } from './house-pins.generated';

// Pastilles maison = fichiers de frontend/public/pubs/ (liste generee par frontend/scripts/gen-pubs.js, la meme
// que celle affichee par pub.js). Liste fermee (plutot qu'un simple format) pour qu'un script ne puisse pas
// remplir la table de cles inventees.
const HOUSE_PINS = new Set(HOUSE_PIN_FILES);

const body = z.object({
  events: z
    .array(z.object({ key: z.string().min(4).max(80), type: z.enum(['view', 'click']) }))
    .min(1)
    .max(20),
});

// Anti-gonflage des clics : 1 clic compte par IP + encart + jour. Garde EN MEMOIRE seulement (jamais en base),
// videe chaque jour — meme principe que le limiteur de debit, qui tient deja des IP en memoire.
const clickSeen = new Set<string>();
let clickSeenDay = '';

function today(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function validKey(key: string): Promise<boolean> {
  if (key.startsWith('pub:')) return HOUSE_PINS.has(key.slice(4));
  if (key.startsWith('ad:')) {
    const slot = await prisma.adSlot.findUnique({ where: { id: key.slice(3) }, select: { status: true } });
    return slot?.status === 'APPROVED';
  }
  return false;
}

export const promoRouter = Router();

// Handler async + `.catch(next)` : sans ca, un corps invalide (ZodError) ou une erreur Prisma devient une promesse
// rejetee non geree -> Express 4 ne la rattrape pas -> le PROCESSUS ENTIER s'arrete (bug reel constate le 23/09 :
// un POST malforme a coupe l'API). Le gestionnaire d'erreurs global repond 400 sur ZodError.
promoRouter.post('/promo/events', limit('promo', 120, 60_000), (req, res, next) => {
  record(req, res).catch(next);
});

async function record(req: Request, res: Response): Promise<void> {
  const { events } = body.parse(req.body);
  const day = today();
  const dayKey = day.toISOString().slice(0, 10);
  if (dayKey !== clickSeenDay) {
    clickSeen.clear();
    clickSeenDay = dayKey;
  }

  const totals = new Map<string, { views: number; clicks: number }>();
  const checked = new Map<string, boolean>();
  for (const e of events) {
    if (!checked.has(e.key)) checked.set(e.key, await validKey(e.key));
    if (!checked.get(e.key)) continue;
    if (e.type === 'click') {
      const seen = `${req.ip}|${e.key}`;
      if (clickSeen.has(seen)) continue;
      clickSeen.add(seen);
    }
    const t = totals.get(e.key) ?? { views: 0, clicks: 0 };
    if (e.type === 'view') t.views++;
    else t.clicks++;
    totals.set(e.key, t);
  }

  for (const [key, t] of totals) {
    await prisma.promoStat.upsert({
      where: { key_day: { key, day } },
      create: { key, day, views: t.views, clicks: t.clicks },
      update: { views: { increment: t.views }, clicks: { increment: t.clicks } },
    });
  }
  res.status(204).end();
}
