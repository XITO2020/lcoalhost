// multi-payment-rails — adapter Stripe (Checkout Session + webhook dedie). Copie du skill, 22/09/2026.
// Compte : SASU TabascoCity, PARTAGE avec l'ecosysteme (meme decision que TC/Conspix/Zarmazon) —
// PAS ENCORE LIVE (KYC SASU en cours cote TabascoCity) : STRIPE_SECRET_KEY reste vide en attendant, ce rail
// est donc OFF par defaut ici aussi. Clef de TEST utilisable des maintenant pour prouver le flux.

import Stripe from 'stripe';
import type { CreateIntentInput, CreateIntentResult, NormalizedEvent, RailAdapter, WebhookRequest } from './types';
import { railListed, requireEnv } from './types';

let client: Stripe | null = null;
function stripe(): Stripe {
  // Pas d'apiVersion figee : le SDK stripe 18.x pin un literal different a chaque release (constate ici,
  // meme correction que Zarmazon) ; laisser le defaut du SDK evite un TS2322 a chaque upgrade.
  if (!client) client = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
  return client;
}

export const stripeAdapter: RailAdapter = {
  id: 'stripe',
  family: 'psp',

  enabled() {
    return railListed('stripe') && !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET_PAYMENTS;
  },

  async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      client_reference_id: input.intentId,
      customer_email: input.userEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(input.amountEur * 100),
            product_data: { name: input.description },
          },
        },
      ],
      metadata: { intentId: input.intentId, siteId: input.siteId, orderRef: input.orderRef },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + Math.max(30 * 60, Number(process.env.PAYMENTS_INTENT_TTL_MIN ?? 30) * 60),
    });
    if (!session.url) throw new Error('[stripe] session sans url');
    return { family: 'psp', externalId: session.id, checkoutUrl: session.url };
  },

  async handleWebhook(req: WebhookRequest): Promise<NormalizedEvent[]> {
    const sig = req.headers['stripe-signature'];
    if (typeof sig !== 'string') throw new Error('[stripe] signature absente');
    const event = stripe().webhooks.constructEvent(req.rawBody, sig, requireEnv('STRIPE_WEBHOOK_SECRET_PAYMENTS'));

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status !== 'paid') return [];
        return [
          {
            rail: 'stripe',
            type: 'paid',
            intentId: s.client_reference_id ?? s.metadata?.intentId ?? undefined,
            externalId: s.id,
            txRef: typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id ?? s.id,
            paidAmount: BigInt(s.amount_total ?? 0),
            payerRef: s.customer_details?.email ?? undefined,
            raw: { id: event.id, type: event.type },
          },
        ];
      }
      case 'checkout.session.expired': {
        const s = event.data.object as Stripe.Checkout.Session;
        return [{ rail: 'stripe', type: 'expired', intentId: s.client_reference_id ?? undefined, externalId: s.id, txRef: '', raw: { id: event.id } }];
      }
      case 'charge.refunded': {
        const c = event.data.object as Stripe.Charge;
        const pi = typeof c.payment_intent === 'string' ? c.payment_intent : c.payment_intent?.id;
        if (!pi) return [];
        return [{ rail: 'stripe', type: 'refunded', txRef: pi, raw: { id: event.id, charge: c.id } }];
      }
      default:
        return [];
    }
  },

  async refund(txRef: string, amountCents?: number) {
    const r = await stripe().refunds.create({ payment_intent: txRef, amount: amountCents });
    return { ok: r.status === 'succeeded' || r.status === 'pending', refundRef: r.id };
  },
};
