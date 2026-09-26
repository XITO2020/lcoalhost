import type { Connector, RawItem } from '../types';
import { config } from '../../config';
import { sleep } from '../http';

// Reddit — OFF par defaut. Depuis mai 2026 le .json anonyme repond 403 ; il faut un client OAuth approuve
// manuellement par Reddit (Responsible Builder Policy), et un usage commercial exige un accord ecrit + facturation.
// Code ecrit d'apres la doc OAuth "app-only" ; NON TESTE tant qu'aucune cle n'existe.
//
// Cible (demande Naim 22/09) : l'humour dev/vibecoding autour de localhost, CSS, prompts pourris de vibecoding.
// Deux voies : les subs humour existantes (REDDIT_SUBREDDITS) + une recherche SITE-WIDE (REDDIT_SEARCH_QUERIES,
// endpoint /search) qui attrape le sujet viral du moment meme hors d'une sub dediee. Inspire du filtre qualite +
// dedup + classification que tuveuxun.expert vend sous le nom "Scrappowin" (app/agents/page.tsx, fiche produit
// SANS code associe) : ici, filtre qualite = post_hint image/video + pas de post supprime, dedup = hash du fichier
// a la copie disque (storage/mirror.ts), classification = classify() (scraper/topics.ts).

interface Listing {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        author: string;
        subreddit: string;
        permalink: string;
        over_18: boolean;
        removed_by_category?: string | null;
        post_hint?: string;
        url?: string;
        is_video?: boolean;
        score: number;
        created_utc: number;
        media?: { reddit_video?: { fallback_url: string } };
        preview?: { images?: Array<{ resolutions: Array<{ url: string; width: number }> }> };
      };
    }>;
  };
}

async function token(): Promise<string> {
  const basic = Buffer.from(`${config.REDDIT_CLIENT_ID}:${config.REDDIT_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${basic}`,
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': config.REDDIT_USER_AGENT,
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`token Reddit refuse (HTTP ${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function fetchListing(bearer: string, url: string): Promise<Listing> {
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${bearer}`, 'user-agent': config.REDDIT_USER_AGENT },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Listing;
}

/** Filtre qualite commun : pas de NSFW, pas de post supprime/enleve, un vrai fichier image ou video derriere. */
function toRawItems(listing: Listing, hint: string): RawItem[] {
  const out: RawItem[] = [];
  for (const { data: p } of listing.data.children) {
    if (p.over_18 || p.removed_by_category) continue;
    const thumb = p.preview?.images?.[0]?.resolutions?.find((r) => r.width >= 320)?.url;
    const base = {
      sourceId: p.id,
      sourceLabel: `r/${p.subreddit}`,
      title: p.title,
      permalink: `https://www.reddit.com${p.permalink}`,
      thumbUrl: thumb,
      author: p.author,
      topic: hint,
      score: p.score,
      publishedAt: new Date(p.created_utc * 1000),
      source: 'reddit',
    };
    if (p.post_hint === 'image' && p.url) out.push({ ...base, kind: 'MEME', mediaUrl: p.url });
    else if (p.is_video && p.media?.reddit_video) out.push({ ...base, kind: 'VIDEO', mediaUrl: p.media.reddit_video.fallback_url });
  }
  return out;
}

export const reddit: Connector = {
  id: 'reddit',
  label: 'Reddit (memes + videos, OAuth)',
  kinds: ['MEME', 'VIDEO'],
  requires: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
  enabled: () => Boolean(config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET),
  setupHint:
    'Demander l\'acces API a Reddit (Responsible Builder Policy) : decrire un usage precis, non-commercial d\'abord. ' +
    'Une fois approuve : creer l\'app "script", copier client_id + secret dans backend/.env.',
  async run() {
    const bearer = await token();
    const out = new Map<string, RawItem>();
    const errors: string[] = [];

    for (const sub of config.redditSubs) {
      try {
        const listing = await fetchListing(bearer, `https://oauth.reddit.com/r/${sub}/hot?limit=40&raw_json=1`);
        for (const item of toRawItems(listing, 'general')) out.set(item.sourceId, item);
      } catch (err) {
        errors.push(`r/${sub}: ${(err as Error).message}`);
      }
      await sleep(700);
    }

    for (const q of config.redditSearchQueries) {
      try {
        const url =
          'https://oauth.reddit.com/search?raw_json=1&sort=top&t=month&limit=25' +
          `&q=${encodeURIComponent(q)}`;
        const listing = await fetchListing(bearer, url);
        for (const item of toRawItems(listing, 'general')) out.set(item.sourceId, item);
      } catch (err) {
        errors.push(`recherche "${q}": ${(err as Error).message}`);
      }
      await sleep(700);
    }

    // Une sub renommee/privee ou une recherche vide ne doit pas faire echouer tout le connecteur.
    if (!out.size && errors.length) throw new Error(errors.join(' | '));
    return [...out.values()];
  },
};
