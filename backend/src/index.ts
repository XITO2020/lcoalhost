import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { config } from './config';
import { adminRouter } from './admin/routes';
import { adsRouter } from './ads/routes';
import { coalRouter, ensureCoalUploadDir } from './coal/routes';
import { hacksRouter } from './hacks/routes';
import { ensureMirrorDir, router } from './items/routes';
import { publicRouter } from './items/public';
import { liquidRouter } from './liquid/routes';
import { promoRouter } from './promo/routes';
import { quoteRouter } from './quote/routes';
import { visitor } from './lib/visitor';
import { logRailsStatus } from './payments/rails/registry';
import { paymentsWebhookRouter } from './payments/webhooks';
import { startScheduler } from './scraper/run';
import { tiktokRouter } from './tiktok/routes';
import { whoamiRouter } from './whoami/routes';

const app = express();
app.set('trust proxy', 1); // derriere nginx en prod
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // /mirror est charge par le front (autre origine en dev)
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// Webhook Stripe : corps BRUT, monte AVANT express.json() (sinon la signature ne verifie plus rien).
app.use('/api/payments/webhooks', paymentsWebhookRouter);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(visitor);

app.use('/mirror', express.static(config.mirrorDir, { maxAge: '7d', index: false, dotfiles: 'deny' }));
// Import local de test (23/09, demande Naim) : sert le dossier videos Conspix pour juger l'affichage des
// cartes VIDEO avec du vrai contenu, en local uniquement. JAMAIS en prod (meme si la variable trainait dans
// un .env mal copie) : double garde isProd + LOCAL_VIDEOS_DIR non vide, voir dev/import-local-videos.ts.
if (!config.isProd && config.LOCAL_VIDEOS_DIR) {
  app.use('/local-videos', express.static(config.LOCAL_VIDEOS_DIR, { index: false, dotfiles: 'deny' }));
  console.log(`[dev] /local-videos -> ${config.LOCAL_VIDEOS_DIR}`);
}
app.use('/api', router);
app.use('/api', hacksRouter);
app.use('/api', tiktokRouter);
app.use('/api', coalRouter);
app.use('/api', adminRouter);
app.use('/api', whoamiRouter);
app.use('/api', liquidRouter);
app.use('/api', adsRouter);
app.use('/api', promoRouter);
app.use('/api', quoteRouter);
// Pages publiques indexables (23/09, SPEC-ROADMAP.md Phase C) : /item/:id, /sitemap.xml, /llms-full.txt — PAS
// sous /api, ce sont des URLs publiques (SEO/AEO), pas des appels internes au front. En prod, nginx doit les
// proxifier vers ce backend (voir deploy/nginx.conf).
app.use(publicRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) return void res.status(400).json({ error: 'requete_invalide', details: err.issues.map((i) => i.message) });
  // JSON syntaxiquement casse (express.json) : faute du client -> 400, pas 500 (23/09).
  if ((err as { type?: string })?.type === 'entity.parse.failed') return void res.status(400).json({ error: 'json_invalide' });
  console.error('[api]', err);
  res.status(500).json({ error: 'erreur_interne' });
});

Promise.all([ensureMirrorDir(), ensureCoalUploadDir()]).then(() => {
  app.listen(config.PORT, () => {
    console.log(`[lcoalhost] API sur http://localhost:${config.PORT}  (mirror: ${config.mirrorDir})`);
    logRailsStatus();
    startScheduler();
  });
});
