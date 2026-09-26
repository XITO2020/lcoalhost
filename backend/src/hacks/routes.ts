// Hacks — brique payante de Lcoalhost (demande Naim 22/09) : des recettes dev/design ecrites, 4,44 € piece
// ou 8,88 € le pack de 3 (prix fixe, pas de calcul par article : "modele tres con", assume). Pas de compte :
// l'acces achete est rattache au cookie visiteur (lh_vid), comme les reactions/classeur.
//
// PAS D'ADMIN/AUTH sur ce site : pas de route de remboursement automatisee -> Stripe dashboard, a la main.
// NON TESTE contre un vrai paiement Stripe (pas de cle live ni de cle de test fournie) : voir CLAUDE.md.

import { randomUUID, randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { limit } from '../lib/rate-limit';
import { wrap } from '../lib/wrap';
import { getRail } from '../payments/rails/registry';
import { RAIL_TO_PRISMA, intentTtlMs } from '../payments/rails/types';

export const hacksRouter = Router();

const SINGLE_CENTS = 444;
const PACK3_CENTS = 888;

function publicUrl(): string {
  return config.PAYMENTS_PUBLIC_URL.replace(/\/$/, '');
}

function hackDto(h: { id: string; slug: string; title: string; teaser: string; body: string; sourceNote: string | null; priceCents: number }, unlocked: boolean) {
  return {
    id: h.id,
    slug: h.slug,
    title: h.title,
    teaser: h.teaser,
    body: unlocked ? h.body : null,
    sourceNote: h.sourceNote,
    priceCents: h.priceCents,
    unlocked,
  };
}

hacksRouter.get('/hacks', wrap(async (req, res) => {
  const hacks = await prisma.hack.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } });
  const unlocked = new Set(
    (await prisma.hackUnlock.findMany({ where: { visitorId: req.visitorId, hackId: { in: hacks.map((h) => h.id) } }, select: { hackId: true } })).map(
      (u) => u.hackId,
    ),
  );
  res.json({ hacks: hacks.map((h) => hackDto(h, unlocked.has(h.id))), pricing: { single: SINGLE_CENTS, pack3: PACK3_CENTS } });
}));

hacksRouter.post(
  '/hacks/checkout',
  limit('hacks-checkout', 10, 10 * 60_000),
  wrap(async (req, res) => {
    const parsed = z.object({ hackIds: z.array(z.string().min(1)).min(1).max(3) }).safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'requete_invalide' });
    const hackIds = [...new Set(parsed.data.hackIds)];
    if (hackIds.length !== 1 && hackIds.length !== 3) {
      return void res.status(400).json({ error: 'choisis_1_ou_3', message: 'Choisis 1 hack (4,44 €) ou exactement 3 (8,88 € le pack).' });
    }

    const hacks = await prisma.hack.findMany({ where: { id: { in: hackIds }, published: true } });
    if (hacks.length !== hackIds.length) return void res.status(404).json({ error: 'hack_introuvable' });

    const alreadyUnlocked = await prisma.hackUnlock.findMany({ where: { visitorId: req.visitorId, hackId: { in: hackIds } } });
    if (alreadyUnlocked.length) return void res.status(409).json({ error: 'deja_debloque', hackIds: alreadyUnlocked.map((u) => u.hackId) });

    const rail = typeof req.body?.rail === 'string' ? req.body.rail : 'stripe';
    const adapter = getRail(rail);
    if (!adapter) return void res.status(400).json({ error: 'rail_indisponible' });

    const totalCents = hackIds.length === 1 ? SINGLE_CENTS : PACK3_CENTS;
    const ref = `LH-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const description = `Lcoalhost — ${hacks.length === 1 ? hacks[0].title : `pack de 3 hacks (${hacks.map((h) => h.title).join(', ')})`}`.slice(0, 200);

    const order = await prisma.hackOrder.create({
      data: { ref, visitorId: req.visitorId, totalCents, items: { create: hackIds.map((hackId) => ({ hackId })) } },
    });

    const intentId = randomUUID();
    const expiresAt = new Date(Date.now() + intentTtlMs());
    try {
      const result = await adapter.createIntent({
        intentId,
        siteId: config.PAYMENTS_SITE_ID,
        orderRef: ref,
        description,
        amountEur: totalCents / 100,
        successUrl: `${publicUrl()}/?hacks=merci&order=${ref}`,
        cancelUrl: `${publicUrl()}/?hacks=annule&order=${ref}`,
        metadata: { visitorId: req.visitorId, orderRef: ref },
      });
      const intent =
        result.family === 'psp'
          ? await prisma.paymentIntent.create({
              data: {
                id: intentId,
                siteId: config.PAYMENTS_SITE_ID,
                rail: RAIL_TO_PRISMA[adapter.id],
                orderRef: ref,
                description,
                amountEur: (totalCents / 100).toFixed(2),
                expiresAt,
                externalId: result.externalId,
                checkoutUrl: result.checkoutUrl,
                metadata: { visitorId: req.visitorId },
              },
            })
          : null;
      if (!intent) throw new Error('rail on-chain non supporte pour les hacks (Stripe uniquement)');
      await prisma.hackOrder.update({ where: { id: order.id }, data: { paymentIntentId: intent.id } });
      res.status(201).json({ orderRef: ref, intentId: intent.id, checkoutUrl: intent.checkoutUrl, totalCents });
    } catch (err) {
      await prisma.hackOrder.delete({ where: { id: order.id } }).catch(() => {});
      console.error(`[hacks/checkout] ${adapter.id}: ${(err as Error).message}`);
      res.status(502).json({ error: 'paiement_indisponible' });
    }
  }),
);

hacksRouter.get('/hacks/checkout/:intentId', wrap(async (req, res) => {
  const i = await prisma.paymentIntent.findUnique({ where: { id: req.params.intentId } });
  if (!i) return void res.status(404).json({ error: 'introuvable' });
  res.json({ status: i.status, orderRef: i.orderRef, checkoutUrl: i.checkoutUrl, paidAt: i.paidAt });
}));
