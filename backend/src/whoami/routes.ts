// "Le Mouchard" (Naim 22/09, 8e chantier) : montre au visiteur SES PROPRES metadonnees de connexion (IP,
// ville/pays approximatifs, FAI), jamais celles des autres. Promesse explicite faite a l'ecran (et tenue ici
// au pied de la lettre) : rien n'est ecrit en base, rien ne survit au-dela de la reponse HTTP — aucun modele
// Prisma, aucun fichier, juste un calcul a la volee a chaque requete. Le cache ci-dessous est un cache
// TECHNIQUE (economiser le quota gratuit du geolocalisateur), pas un stockage de donnees personnelles : il
// vit en memoire du process, jamais persiste, efface au redemarrage, et ne sert qu'a eviter de re-interroger
// ip-api.com pour la meme IP dans la minute qui suit.
import { createHash } from 'node:crypto';
import { Router } from 'express';
import { getJson } from '../scraper/http';
import { limit } from '../lib/rate-limit';
import { wrap } from '../lib/wrap';

export const whoamiRouter = Router();

// Metriques bidons (22/09, demande Naim) : aleatoires mais STABLES 24h par IP — pas un vrai Math.random() a
// chaque requete, un hash deterministe de (ip + jour UTC) pour que le meme visiteur revoie la meme blague
// toute la journee, et qu'elle change le lendemain. Le contenu (les listes de blagues, par langue) vit cote
// FRONTEND (i18n.js) ; le backend fournit juste un entier stable, le front fait `seed % liste.length` avec
// SA propre liste — decouple, aucun besoin que le backend connaisse la longueur/langue des listes.
function dailySeed(ip: string, salt: string): number {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC), change une fois par jour
  return createHash('sha256').update(`${ip}:${day}:${salt}`).digest().readUInt32BE(0);
}

interface IpApiResponse {
  status: 'success' | 'fail';
  message?: string;
  country?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  org?: string;
  query?: string;
}

interface CacheEntry {
  body: unknown;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60_000;
// Meme pattern de nettoyage periodique que lib/rate-limit.ts (Map en memoire, purge des entrees perimees).
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cache) if (v.expiresAt < now) cache.delete(k);
}, 600_000).unref();

function isPrivateIp(ip: string): boolean {
  const v = ip.replace('::ffff:', '');
  return v === '::1' || v === '127.0.0.1' || /^10\./.test(v) || /^192\.168\./.test(v) || /^172\.(1[6-9]|2\d|3[01])\./.test(v);
}

whoamiRouter.get('/whoami', limit('whoami', 20, 60_000), wrap(async (req, res) => {
  const ip = req.ip ?? '';
  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return void res.json(cached.body);

  const gagSeeds = { gagIngestSeed: dailySeed(ip, 'ingest'), gagStoolSeed: dailySeed(ip, 'stool') };

  if (!ip || isPrivateIp(ip)) {
    const body = { ip: ip || null, local: true, city: null, region: null, country: null, isp: null, ...gagSeeds };
    cache.set(ip, { body, expiresAt: Date.now() + CACHE_TTL_MS });
    return void res.json(body);
  }

  try {
    // ip-api.com : gratuit, sans cle, HTTP uniquement sur le palier gratuit (appel serveur->serveur, pas de
    // souci de contenu mixte). 45 req/min partagees par tout le serveur -> le cache ci-dessus absorbe les
    // visiteurs qui rechargent la page plusieurs fois de suite avec la meme IP.
    const geo = await getJson<IpApiResponse>(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,isp,org,query`,
    );
    const body =
      geo.status === 'success'
        ? { ip: geo.query ?? ip, local: false, city: geo.city ?? null, region: geo.regionName ?? null, country: geo.country ?? null, isp: geo.isp ?? geo.org ?? null, ...gagSeeds }
        : { ip, local: false, city: null, region: null, country: null, isp: null, ...gagSeeds };
    cache.set(ip, { body, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(body);
  } catch {
    // Geolocalisateur indisponible (quota, timeout...) : on renvoie au moins l'IP, jamais une erreur qui
    // casserait la carte 3D pour un service de confort non-critique.
    res.json({ ip, local: false, city: null, region: null, country: null, isp: null, ...gagSeeds });
  }
}));
