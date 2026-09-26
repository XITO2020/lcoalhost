import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const bool = (d: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? d : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4200),
  CORS_ORIGINS: z.string().default('http://localhost:5180,http://localhost:4180'),
  DATABASE_URL: z.string().min(1),

  SCRAPE_ENABLED: bool(true),
  SCRAPE_INTERVAL_MIN: z.coerce.number().min(5).default(30),
  RETENTION_DAYS: z.coerce.number().min(1).default(45),

  // Politique de copie : un item `reusable` est copie sur disque des qu'il atteint ce seuil d'engagement
  // (reactions + classements). Sous le seuil il reste en simple URL.
  MIRROR_DIR: z.string().default('./data/mirror'),
  MIRROR_MIN_ENGAGEMENT: z.coerce.number().min(1).default(3),
  MIRROR_MAX_MB: z.coerce.number().min(1).default(60),

  // --- "Big cleaning" par quota disque (22/09, demande Naim : "le scrapping remplit tres vite") : au-dela de
  // ce volume total de fichiers MIRROR (memes+videos+images, epingles exclus), le plus ancien non-epingle est
  // efface en premier jusqu'a repasser sous le quota. Tourne a chaque cycle de scrape (voir scraper/run.ts).
  STORAGE_BUDGET_MB: z.coerce.number().min(100).default(10240), // 10 Go
  STORAGE_WARN_RATIO: z.coerce.number().min(0.5).max(1).default(0.9), // notifie l'admin des 90% du quota

  REDDIT_CLIENT_ID: z.string().optional().default(''),
  REDDIT_CLIENT_SECRET: z.string().optional().default(''),
  REDDIT_USER_AGENT: z.string().default('web:lcoalhost:0.1'),
  REDDIT_SUBREDDITS: z.string().default('ProgrammerHumor,linuxmemes,softwaregore,ProgrammingHumor,webdev'),
  // Recherche site-wide (pas limitee a un subreddit) : attrape le meme "prompt pourri de vibecoding" du moment
  // meme s'il n'est pas poste dans une des subs ci-dessus.
  REDDIT_SEARCH_QUERIES: z.string().default('vibecoding,vibe coding fail,localhost meme,css meme,ai wrote this code'),

  // --- Paiements (Hacks, 22/09) : moteur copie de .claude/skills/multi-payment-rails. Vide = rail Stripe OFF. ---
  PAYMENTS_SITE_ID: z.string().default('lcoalhost'),
  PAYMENTS_PUBLIC_URL: z.string().default('http://localhost:5180'),
  PAYMENTS_ENABLED_RAILS: z.string().default('stripe'),
  PAYMENTS_INTENT_TTL_MIN: z.coerce.number().min(5).default(30),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET_PAYMENTS: z.string().optional().default(''),

  // --- Agent memes (22/09) : Ollama LOCAL uniquement, jamais d'API payante. Ecrit en HIDDEN (jamais visible
  // sans relecture de Naim). URL par defaut = machine de dev ; a repointer explicitement en prod (voir CLAUDE.md).
  AGENT_MEMES_ENABLED: bool(true),
  AGENT_MEMES_PER_CYCLE: z.coerce.number().min(0).max(5).default(1),
  AGENT_MEMES_MAX_PENDING: z.coerce.number().min(1).default(20), // pile de brouillons non relus : coupe la generation au-dela
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:7b-instruct'),

  // --- Add Coal (22/09) : soumissions visiteurs (TikTok/article/image), filtre IA Ollama puis validation
  // manuelle Naim (coal:review/approve/reject). 1 soumission par visiteur par jour.
  COAL_UPLOAD_DIR: z.string().default('./data/coal'),
  COAL_MAX_MB: z.coerce.number().min(1).default(8),
  COAL_MAX_PER_DAY: z.coerce.number().min(1).default(1),
  // 23/09 : si true, un LIEN juge pertinent par Qwen est publie DIRECTEMENT a l'endroit choisi par Qwen, sans
  // relecture. false par defaut (regle "aucune publication automatique" du site) : Qwen classe, Naim valide.
  COAL_AUTO_PUBLISH: bool(false),

  // --- Liquid Enhancement (22/09) : le visiteur decrit une idee, Qwen (meme Ollama local que l'agent memes)
  // la reformule. Soumission finale limitee par jour (comme Add Coal) — l'appel d'enhancement lui-meme est
  // juste rate-limite (voir liquid/routes.ts), pas de quota journalier (aucun cout, purement local).
  LIQUID_SUBMIT_MAX_PER_DAY: z.coerce.number().min(1).default(5),

  // --- Mode admin (22/09) : secret partage, PAS un compte. Vide = routes admin toujours refusees (403), aucun
  // risque par defaut. Naim l'entre soit via ?admin=<token> dans l'URL, soit via le mot de passe "Contremaitre"
  // du bureau d'embauche (embauche.js) — garde en localStorage ensuite. A definir aussi en prod (.env du
  // serveur, JAMAIS "123456" — voir le garde-fou juste en dessous), jamais commite.
  ADMIN_TOKEN: z.string().optional().default(''),

  // --- Import local de test (23/09, demande Naim) : brancher en LOCAL un dossier de vraies videos (Conspix
  // atelier, sous-dossiers tech) pour juger l'affichage des cartes VIDEO avec du vrai contenu, sans rien
  // scraper. Vide = desactive (aucune route montee, aucun script utilisable) ; jamais actif en prod (voir
  // index.ts). Chemin propre a la machine de Naim, jamais commite en dur ici — se met dans le `.env` local.
  LOCAL_VIDEOS_DIR: z.string().optional().default(''),

  // --- Regie pub tierce (23/09, SPEC-ROADMAP.md Phase E) : encart self-serve, paye a la soumission (meme
  // rail Stripe que Hacks), PENDING_REVIEW jusqu'a relecture Naim (ads:review/approve/reject).
  // PRIX PLACEHOLDER, PAS UNE DECISION DE NAIM : la tarification reste explicitement ouverte dans
  // SPEC-ROADMAP.md ("decision commerciale, pas technique, a trancher"). Change AVANT toute mise en ligne
  // reelle (jamais grave une supposition comme une decision).
  ADS_PRICE_CENTS: z.coerce.number().min(1).default(999),
  ADS_DEFAULT_DURATION_DAYS: z.coerce.number().min(1).default(30),

  // Demande de devis pub (24/09) : email vers tabascocity@proton.me via SMTP Brevo (FR-EU, aligne anti-Big-Tech),
  // exactement comme TabascoCity (nodemailer + memes noms de variables EMAIL_SERVER_*). Si EMAIL_SERVER_HOST n'est
  // pas configure, la demande est seulement stockee en base (lue par `npm run quotes:review`).
  EMAIL_SERVER_HOST: z.string().default(''),
  EMAIL_SERVER_PORT: z.coerce.number().default(587), // secure deduit du port (465=SSL, sinon STARTTLS), comme conspix
  EMAIL_SERVER_USER: z.string().default(''),
  EMAIL_SERVER_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default('no-reply@lcoal.host'),
  QUOTE_TO_EMAIL: z.string().default('coalthehost@proton.me'), // boite neutre Lcoalhost (discretion d'identite, 26/09)
});

const env = schema.parse(process.env);

// Garde-fou (22/09) : le token "123456" est volontairement faible pour le dev local (facile a taper en testant
// le bureau d'embauche). S'il se retrouve tel quel en prod, ce serait une vraie faille — on refuse de demarrer
// plutot que de laisser passer.
const WEAK_ADMIN_TOKENS = ['123456', 'admin', 'password', 'changeme'];
if (env.NODE_ENV === 'production' && WEAK_ADMIN_TOKENS.includes(env.ADMIN_TOKEN.toLowerCase())) {
  throw new Error(
    `ADMIN_TOKEN="${env.ADMIN_TOKEN}" est un token de dev faible : interdit en production. Mets une vraie chaine aleatoire dans .env.`,
  );
}

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
  mirrorDir: path.resolve(env.MIRROR_DIR),
  coalUploadDir: path.resolve(env.COAL_UPLOAD_DIR),
  redditSubs: env.REDDIT_SUBREDDITS.split(',').map((s) => s.trim()).filter(Boolean),
  redditSearchQueries: env.REDDIT_SEARCH_QUERIES.split(',').map((s) => s.trim()).filter(Boolean),
  // Identifie honnetement le robot aupres des sources (bonne pratique + exige par plusieurs API).
  userAgent: 'lcoalhost-bot/0.1 (+https://lcoal.host; contact: tabascocity@proton.me)',
};
