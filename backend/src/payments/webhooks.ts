// multi-payment-rails — webhooks PSP. Monte AVANT express.json() dans index.ts :
//   app.use('/api/payments/webhooks', paymentsWebhookRouter);
// Copie du skill, adapte uniquement l'import registry (22/09/2026).

import { Router, raw } from 'express';
import { wrap } from '../lib/wrap';
import { getRail } from './rails/registry';
import { settle } from './settle';

export const paymentsWebhookRouter = Router();

paymentsWebhookRouter.post('/:rail', raw({ type: '*/*', limit: '1mb' }), wrap(async (req, res) => {
  const adapter = getRail(req.params.rail);
  if (!adapter || adapter.family !== 'psp' || !adapter.handleWebhook) return void res.status(404).json({ error: 'unknown_rail' });

  let events;
  try {
    events = await adapter.handleWebhook({ rawBody: req.body as Buffer, headers: req.headers });
  } catch (err) {
    console.warn(`[payments/webhook] ${adapter.id} rejete : ${(err as Error).message}`);
    return void res.status(400).json({ error: 'bad_signature' });
  }

  try {
    for (const ev of events) await settle(ev);
    return void res.status(200).json({ received: events.length });
  } catch (err) {
    console.error(`[payments/webhook] ${adapter.id} settle KO : ${(err as Error).message}`);
    return void res.status(500).json({ error: 'settle_failed' });
  }
}));
