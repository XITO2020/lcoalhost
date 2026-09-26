// Regie pub tierce — self-serve (23/09, SPEC-ROADMAP.md Phase E). Un particulier ou une entreprise soumet un
// encart, paie immediatement (meme rail Stripe que Hacks), reste en PENDING_REVIEW jusqu'a relecture Naim
// (ads:review/approve/reject, CLI — meme discipline que Coal/Liquid : jamais publie automatiquement). Rejet
// apres paiement = remboursement manuel via le dashboard Stripe (meme motif deja assume pour les Hacks, pas
// de route de remboursement automatisee — le site n'a pas d'admin/auth pour ca).
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { limit } from '../lib/rate-limit';
import { wrap } from '../lib/wrap';
import { getRail } from '../payments/rails/registry';
import { RAIL_TO_PRISMA, intentTtlMs } from '../payments/rails/types';

export const adsRouter = Router();

function publicUrl(): string {
  return config.PAYMENTS_PUBLIC_URL.replace(/\/$/, '');
}

const submitBody = z.object({
  advertiserName: z.string().trim().min(1).max(120),
  advertiserEmail: z.string().trim().email(),
  note: z.string().trim().max(500).optional(),
  position: z.enum(['PUB_ASIDE', 'ADS_ASIDE']),
  // https UNIQUEMENT (audit 24/09) : z.string().url() acceptait javascript:alert(1) -> lien piege au clic.
  imageUrl: z.string().url().refine((u) => /^https:\/\//i.test(u), 'https_requis'),
  linkUrl: z.string().url().refine((u) => /^https:\/\//i.test(u), 'https_requis'),
  tooltip: z.string().trim().min(1).max(200),
});

adsRouter.get('/ads/pricing', (_req, res) => {
  res.json({ priceCents: config.ADS_PRICE_CENTS, durationDays: config.ADS_DEFAULT_DURATION_DAYS });
});

adsRouter.post(
  '/ads',
  limit('ads-submit', 5, 60 * 60_000),
  wrap(async (req, res) => {
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'requete_invalide', details: parsed.error.issues.map((i) => i.message) });
    const body = parsed.data;

    // Rail verifie AVANT toute ecriture (23/09, bug reel trouve en testant : la 1ere version creait
    // Advertiser+AdSlot puis verifiait le rail, laissant un Advertiser orphelin a chaque tentative tant que
    // Stripe n'est pas configure — ce qui est le cas de TOUT essai aujourd'hui).
    const rail = typeof req.body?.rail === 'string' ? req.body.rail : 'stripe';
    const adapter = getRail(rail);
    if (!adapter) return void res.status(400).json({ error: 'rail_indisponible' });

    const advertiser = await prisma.advertiser.create({
      data: { name: body.advertiserName, email: body.advertiserEmail, note: body.note },
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + config.ADS_DEFAULT_DURATION_DAYS * 86_400_000);
    const priceCents = config.ADS_PRICE_CENTS;

    const slot = await prisma.adSlot.create({
      data: {
        advertiserId: advertiser.id,
        position: body.position,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl,
        tooltip: body.tooltip,
        startDate,
        endDate,
        priceCents,
      },
    });

    const ref = `AD-${new Date().getFullYear()}-${slot.id.slice(-8).toUpperCase()}`;
    const description = `Lcoalhost — encart pub (${body.position}, ${config.ADS_DEFAULT_DURATION_DAYS}j) pour ${body.advertiserName}`.slice(0, 200);
    const intentId = randomUUID();
    const expiresAt = new Date(Date.now() + intentTtlMs());
    try {
      const result = await adapter.createIntent({
        intentId,
        siteId: config.PAYMENTS_SITE_ID,
        orderRef: ref,
        description,
        amountEur: priceCents / 100,
        successUrl: `${publicUrl()}/?ads=merci&order=${ref}`,
        cancelUrl: `${publicUrl()}/?ads=annule&order=${ref}`,
        metadata: { advertiserId: advertiser.id, adSlotId: slot.id },
      });
      if (result.family !== 'psp') throw new Error('rail on-chain non supporte pour les ads (Stripe uniquement)');
      const intent = await prisma.paymentIntent.create({
        data: {
          id: intentId,
          siteId: config.PAYMENTS_SITE_ID,
          rail: RAIL_TO_PRISMA[adapter.id],
          orderRef: ref,
          description,
          amountEur: (priceCents / 100).toFixed(2),
          expiresAt,
          externalId: result.externalId,
          checkoutUrl: result.checkoutUrl,
          metadata: { advertiserId: advertiser.id, adSlotId: slot.id },
        },
      });
      await prisma.adSlot.update({ where: { id: slot.id }, data: { orderRef: ref, paymentIntentId: intent.id } });
      res.status(201).json({ orderRef: ref, intentId: intent.id, checkoutUrl: intent.checkoutUrl, priceCents });
    } catch (err) {
      await prisma.adSlot.delete({ where: { id: slot.id } }).catch(() => {});
      await prisma.advertiser.delete({ where: { id: advertiser.id } }).catch(() => {});
      console.error(`[ads/submit] ${adapter.id}: ${(err as Error).message}`);
      res.status(502).json({ error: 'paiement_indisponible' });
    }
  }),
);

adsRouter.get('/ads/checkout/:intentId', wrap(async (req, res) => {
  const i = await prisma.paymentIntent.findUnique({ where: { id: req.params.intentId } });
  if (!i) return void res.status(404).json({ error: 'introuvable' });
  res.json({ status: i.status, orderRef: i.orderRef, checkoutUrl: i.checkoutUrl, paidAt: i.paidAt });
}));

// Encarts APPROUVES + en cours de validite, pour l'affichage (pub.js/ads.js) — lecture publique, rien de
// sensible (memes donnees que ce qui sera affiche a l'ecran de toute facon).
// Position validee (audit 24/09) : une valeur inconnue faisait planter la requete Prisma (500) au lieu d'un 400.
const activeQuery = z.object({ position: z.enum(['PUB_ASIDE', 'ADS_ASIDE']).optional() });
adsRouter.get('/ads/active', wrap(async (req, res) => {
  const parsed = activeQuery.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ error: 'position_invalide' });
  const { position } = parsed.data;
  const now = new Date();
  const slots = await prisma.adSlot.findMany({
    where: { status: 'APPROVED', startDate: { lte: now }, endDate: { gt: now }, ...(position && { position }) },
    orderBy: { createdAt: 'desc' },
    select: { id: true, position: true, imageUrl: true, linkUrl: true, tooltip: true },
  });
  res.json({ slots });
}));
