// multi-payment-rails — LA SEULE PARTIE SPECIFIQUE A LCOALHOST du moteur de paiement.
// onPaid : la commande de hacks passe PAID -> deverrouille l'acces (HackUnlock) pour le visiteur acheteur.
// Idempotent : peut etre rejoue si fulfilledAt est null (crash) -> upsert, jamais de creation en double.
// Pas de pont TabascoCity ici (un "hack" n'est pas une oeuvre de patrimoine) : ecosystemCredit reste un stub.
//
// Ads (23/09, Phase E) : meme point d'entree, distingue par prefixe d'orderRef ("LH-" hacks, "AD-" ads) —
// un paiement d'encart ne DEBLOQUE rien tout seul, reste PENDING_REVIEW (relu par Naim, ads:review) : payer
// n'achete que le passage en file de relecture, jamais la mise en ligne directe.

import type { PaymentIntent } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function onPaid(intent: PaymentIntent): Promise<void> {
  if (intent.orderRef.startsWith('AD-')) return onAdPaid(intent);

  const order = await prisma.hackOrder.findUnique({ where: { ref: intent.orderRef }, include: { items: true } });
  if (!order) throw new Error(`hack_order_introuvable:${intent.orderRef}`);

  if (order.status !== 'PENDING') {
    console.warn(`[payments/fulfillment] commande ${order.ref} deja ${order.status} (paiement en double ? intent ${intent.id})`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.hackOrder.update({ where: { id: order.id }, data: { status: 'PAID', paymentIntentId: intent.id } });
    for (const item of order.items) {
      await tx.hackUnlock.upsert({
        where: { hackId_visitorId: { hackId: item.hackId, visitorId: order.visitorId } },
        create: { hackId: item.hackId, visitorId: order.visitorId, orderId: order.id },
        update: {},
      });
    }
  });
  console.log(`[payments/fulfillment] commande ${order.ref} payee : ${order.items.length} hack(s) debloque(s) pour ${order.visitorId}`);
}

export async function onRefunded(intent: PaymentIntent): Promise<void> {
  if (intent.orderRef.startsWith('AD-')) return onAdRefunded(intent);

  const order = await prisma.hackOrder.findUnique({ where: { ref: intent.orderRef }, include: { items: true } });
  if (!order) return;
  await prisma.$transaction(async (tx) => {
    await tx.hackOrder.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
    for (const item of order.items) {
      await tx.hackUnlock.deleteMany({ where: { hackId: item.hackId, visitorId: order.visitorId, orderId: order.id } });
    }
  });
  console.warn(`[payments/fulfillment] commande ${order.ref} remboursee : acces revoque`);
}

// Encart paye = passe en file de relecture, RIEN d'autre (pas de mise en ligne directe, cf. commentaire
// d'en-tete). Naim decide ensuite via `npm run ads:approve`/`ads:reject`.
async function onAdPaid(intent: PaymentIntent): Promise<void> {
  const slot = await prisma.adSlot.findUnique({ where: { orderRef: intent.orderRef } });
  if (!slot) throw new Error(`ad_slot_introuvable:${intent.orderRef}`);
  if (slot.status !== 'PENDING_REVIEW') {
    console.warn(`[payments/fulfillment] encart ${slot.id} deja ${slot.status} (paiement en double ? intent ${intent.id})`);
    return;
  }
  console.log(`[payments/fulfillment] encart ${slot.id} (${intent.orderRef}) paye : en attente de relecture Naim (ads:review)`);
}

// Rembourse apres coup (rejet tardif, litige...) : repasse l'encart en REJECTED s'il n'y etait pas deja —
// jamais de suppression, la trace reste pour l'historique.
async function onAdRefunded(intent: PaymentIntent): Promise<void> {
  const slot = await prisma.adSlot.findUnique({ where: { orderRef: intent.orderRef } });
  if (!slot || slot.status === 'REJECTED') return;
  await prisma.adSlot.update({ where: { id: slot.id }, data: { status: 'REJECTED', reviewedAt: new Date() } });
  console.warn(`[payments/fulfillment] encart ${slot.id} rembourse : repasse REJECTED`);
}

/** Pont ecosysteme TC — non utilise pour les hacks (pas d'oeuvre de patrimoine). Stub par contrat du moteur. */
export async function ecosystemCredit(_intent: PaymentIntent): Promise<boolean> {
  return true;
}
