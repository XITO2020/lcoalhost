import type { Connector, RawItem } from '../types';
import { getText, sleep } from '../http';
import { parseFeed } from '../feed-parser';

// Les "5 %" : cybersecurite + securite de l'IA. Flux RSS officiels, sans cle.
// CERT-FR = agence francaise (ANSSI) ; EFF = droits numeriques ; Alignment Forum = securite de l'IA.
// lang : CERT-FR publie en francais (23/09 : etait enregistre 'en' comme toutes les sources historiques — faux,
// et bloquant depuis que les articles sont filtres par langue). Absent = 'en'.
const FEEDS: Array<{ id: string; label: string; url: string; hint: string; limit: number; lang?: 'fr' }> = [
  { id: 'cert-fr', label: 'CERT-FR', url: 'https://www.cert.ssi.gouv.fr/feed/', hint: 'cybersec', limit: 6, lang: 'fr' },
  { id: 'eff', label: 'EFF', url: 'https://www.eff.org/rss/updates.xml', hint: 'cybersec', limit: 8 },
  { id: 'krebs', label: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', hint: 'cybersec', limit: 8 },
  { id: 'schneier', label: 'Schneier on Security', url: 'https://www.schneier.com/feed/atom/', hint: 'cybersec', limit: 8 },
  { id: 'alignment-forum', label: 'AI Alignment Forum', url: 'https://www.alignmentforum.org/feed.xml', hint: 'survie', limit: 8 },
];

export const rssSecurite: Connector = {
  id: 'rss',
  label: 'Flux securite + securite IA (CERT-FR, EFF, Krebs, Schneier, Alignment Forum)',
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
            source: 'rss',
            sourceId: `${f.id}:${e.id}`.slice(0, 250),
            sourceLabel: f.label,
            title: e.title,
            permalink: e.link,
            author: e.author,
            topic: f.hint,
            score: 0,
            publishedAt: e.date ?? new Date(),
            lang: f.lang,
          });
        }
      } catch (err) {
        errors.push(`${f.id}: ${(err as Error).message}`);
      }
      await sleep(250);
    }
    // Un flux en panne ne doit pas masquer les autres : erreur seulement si TOUT est tombe.
    if (!out.length && errors.length) throw new Error(errors.join(' | '));
    return out;
  },
};
