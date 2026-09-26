// multi-payment-rails — reglement idempotent d'un NormalizedEvent sur une PaymentIntent. Copie du skill,
// adapte uniquement l'import prisma (22/09/2026). Point unique de verite : le webhook Stripe passe ici.

import { prisma } from '../lib/prisma';
import type { NormalizedEvent } from './rails/types';
import { RAIL_TO_PRISMA } from './rails/types';
import { onPaid, onRefunded, ecosystemCredit } from './fulfillment';

type Intent = NonNullable<Awaited<ReturnType<typeof prisma.paymentIntent.findUnique>>>;

async function findIntent(ev: NormalizedEvent): Promise<Intent | null> {
  if (ev.intentId) return prisma.paymentIntent.findUnique({ where: { id: ev.intentId } });
  if (ev.externalId) return prisma.paymentIntent.findUnique({ where: { externalId: ev.externalId } });
  if (ev.txRef && ev.type === 'refunded') return prisma.paymentIntent.findUnique({ where: { txRef: ev.txRef } });
  return null;
}

function toJson(v: unknown): unknown {
  return JSON.parse(JSON.stringify(v ?? null, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));
}

async function recordEvent(intentId: string, ev: NormalizedEvent, type: string): Promise<boolean> {
  try {
    await prisma.paymentEvent.create({
      data: { intentId, rail: RAIL_TO_PRISMA[ev.rail], type, txRef: ev.txRef ?? '', payload: toJson({ ...ev, raw: ev.raw }) as never },
    });
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') return false;
    throw err;
  }
}

export async function settle(ev: NormalizedEvent): Promise<void> {
  const intent = await findIntent(ev);
  if (!intent) {
    console.warn(`[payments/settle] intent introuvable pour ${ev.rail}/${ev.type} txRef=${ev.txRef}`);
    return;
  }

  switch (ev.type) {
    case 'seen': {
      if (intent.status !== 'PENDING' && intent.status !== 'SEEN') return;
      const fresh = await recordEvent(intent.id, ev, `seen:${ev.confirmations ?? 0}`);
      if (fresh && intent.status === 'PENDING') {
        await prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: 'SEEN', txRef: ev.txRef || undefined } });
      }
      return;
    }

    case 'paid': {
      if (intent.status === 'PAID' || intent.status === 'REFUNDED') return;
      const late = intent.status === 'EXPIRED' || Date.now() > intent.expiresAt.getTime();
      if (late) {
        await recordEvent(intent.id, ev, 'late_payment');
        console.warn(`[payments/settle] PAIEMENT TARDIF ${intent.id} (${ev.rail}) txRef=${ev.txRef} — traitement manuel`);
        return;
      }
      const expected = intent.payAmount !== null ? BigInt(intent.payAmount.toString()) : BigInt(Math.round(Number(intent.amountEur) * 100));
      if (ev.paidAmount !== undefined && ev.paidAmount < expected) {
        const tol = Number(process.env[`${ev.rail.toUpperCase()}_AMOUNT_TOLERANCE_PCT`] ?? process.env.PAYMENTS_AMOUNT_TOLERANCE_PCT ?? 0);
        if (ev.paidAmount < (expected * BigInt(100 - tol)) / 100n) {
          await recordEvent(intent.id, ev, 'underpaid');
          console.warn(`[payments/settle] SOUS-PAIEMENT ${intent.id} recu=${ev.paidAmount} attendu=${expected}`);
          return;
        }
      }
      if (ev.paidAmount !== undefined && ev.paidAmount > expected) await recordEvent(intent.id, ev, 'overpaid');

      const fresh = await recordEvent(intent.id, ev, 'paid');
      if (!fresh) return;

      const updated = await prisma.$transaction(async (tx) => {
        const cur = await tx.paymentIntent.findUnique({ where: { id: intent.id } });
        if (!cur || cur.status === 'PAID') return null;
        return tx.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            txRef: ev.txRef || cur.txRef,
            paidAmount: ev.paidAmount !== undefined ? (ev.paidAmount.toString() as never) : undefined,
            payerRef: ev.payerRef ?? cur.payerRef,
          },
        });
      });
      if (!updated) return;

      try {
        await onPaid(updated);
        await prisma.paymentIntent.update({ where: { id: intent.id }, data: { fulfilledAt: new Date() } });
      } catch (err) {
        console.error(`[payments/settle] fulfillment KO ${intent.id}: ${(err as Error).message}`);
        await recordEvent(intent.id, { ...ev, txRef: ev.txRef }, 'fulfillment_failed');
        return;
      }

      if (process.env.ECOSYSTEM_LINK_ENABLED === 'true') {
        const ok = await ecosystemCredit(updated).catch(() => false);
        await recordEvent(intent.id, ev, ok ? 'ecosystem_ok' : 'ecosystem_pending');
        if (ok) await prisma.paymentIntent.update({ where: { id: intent.id }, data: { ecosystemCreditedAt: new Date() } });
      }
      return;
    }

    case 'expired': {
      if (intent.status !== 'PENDING') return;
      if (await recordEvent(intent.id, ev, 'expired')) {
        await prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: 'EXPIRED' } });
      }
      return;
    }

    case 'failed': {
      if (intent.status === 'PAID') return;
      if (await recordEvent(intent.id, ev, 'failed')) {
        await prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: 'FAILED' } });
      }
      return;
    }

    case 'refunded': {
      if (intent.status !== 'PAID') return;
      if (await recordEvent(intent.id, ev, 'refunded')) {
        await prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: 'REFUNDED' } });
        await onRefunded(intent).catch((err) => console.error(`[payments/settle] onRefunded KO ${intent.id}: ${(err as Error).message}`));
      }
      return;
    }
  }
}
