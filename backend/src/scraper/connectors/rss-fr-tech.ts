import type { Connector, RawItem } from '../types';
import { getText, sleep } from '../http';
import { parseFeed } from '../feed-parser';

// Presse tech francaise (demande Naim 23/09 : Korben, "indetronable en France"). Flux RSS officiel, gratuit, sans
// cle, autorise par robots.txt. Verifie le 23/09/2026 (200 OK, 15 entrees datees, parse par feed-parser).
//
// Politique IA de Korben (https://korben.info/ai.txt, revisee 2026-09-03) : CITATION autorisee (source citee +
// lien vers l'article) ; ENTRAINEMENT / corpus derives refuses sans licence RSL. Lcoalhost = titre + credit +
// lien, jamais de copie (storage/policy.ts) -> conforme. NE JAMAIS ajouter 'rss-fr' a la liste des sources
// d'inspiration de l'agent memes (agents/meme-writer.ts : rss-us puis hackernews/devto/lobsters) : generer du
// contenu derive de leurs titres sans attribution est exactement ce que leur politique refuse.
const FEEDS: Array<{ id: string; label: string; url: string; hint: string; limit: number }> = [
  { id: 'korben', label: 'Korben', url: 'https://korben.info/feed', hint: 'general', limit: 10 },
];

// Les liens du flux portent des parametres de suivi (?utm_source=rss&utm_medium=feed...) : retires, lien propre.
function stripTracking(url: string): string {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (k.startsWith('utm_')) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return url;
  }
}

export const rssFrTech: Connector = {
  id: 'rss-fr',
  label: 'Presse tech FR (Korben)',
  kinds: ['ARTICLE'],
  requires: [],
  enabled: () => true,
  async run() {
    const out: RawItem[] = [];
    const errors: string[] = [];
    for (const f of FEEDS) {
      try {
        const entries = parseFeed(await getText(f.url), f.limit);
        for (const e of entries) {
          out.push({
            kind: 'ARTICLE',
            source: 'rss-fr',
            sourceId: `${f.id}:${e.id}`.slice(0, 250),
            sourceLabel: f.label,
            title: e.title,
            permalink: stripTracking(e.link),
            author: e.author,
            topic: f.hint,
            score: 0,
            publishedAt: e.date ?? new Date(),
            lang: 'fr',
          });
        }
      } catch (err) {
        errors.push(`${f.id}: ${(err as Error).message}`);
      }
      await sleep(250);
    }
    if (!out.length && errors.length) throw new Error(errors.join(' | '));
    return out;
  },
};
