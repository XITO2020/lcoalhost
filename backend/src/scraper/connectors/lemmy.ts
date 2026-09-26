import type { Connector, RawItem } from '../types';
import { getJson, sleep } from '../http';

// Lemmy = "Reddit federe", open source, API publique SANS cle ni approbation. Source de memes principale
// tant que l'acces Reddit n'est pas accorde. Chaque communaute est interrogee sur SA instance.
const COMMUNITIES: Array<{ instance: string; name: string; hint: string }> = [
  { instance: 'programming.dev', name: 'programmer_humor', hint: 'general' },
  { instance: 'lemmy.world', name: 'linuxmemes', hint: 'devops' },
  { instance: 'lemmy.ml', name: 'programmerhumor', hint: 'general' },
  { instance: 'lemmy.world', name: 'softwaregore', hint: 'general' },
];

interface PostView {
  post: {
    ap_id: string;
    name: string;
    url?: string;
    thumbnail_url?: string;
    url_content_type?: string;
    nsfw: boolean;
    removed: boolean;
    deleted: boolean;
    published: string;
  };
  creator: { name: string };
  community: { name: string; nsfw: boolean };
  counts: { score: number };
}

export const lemmy: Connector = {
  id: 'lemmy',
  label: 'Lemmy (memes : programmer_humor, linuxmemes, softwaregore)',
  kinds: ['MEME', 'VIDEO'],
  requires: [],
  enabled: () => true,
  async run() {
    const out: RawItem[] = [];
    const errors: string[] = [];
    for (const c of COMMUNITIES) {
      try {
        const data = await getJson<{ posts: PostView[] }>(
          `https://${c.instance}/api/v3/post/list?community_name=${c.name}&sort=Hot&limit=40`,
        );
        for (const p of data.posts) {
          const ct = p.post.url_content_type ?? '';
          const isImage = ct.startsWith('image/');
          const isVideo = ct.startsWith('video/');
          if (!p.post.url || (!isImage && !isVideo)) continue; // liens externes / texte : hors sujet ici
          if (p.post.nsfw || p.community.nsfw || p.post.removed || p.post.deleted) continue;
          out.push({
            kind: isVideo ? 'VIDEO' : 'MEME',
            source: 'lemmy',
            sourceId: p.post.ap_id,
            sourceLabel: `c/${p.community.name}`,
            title: p.post.name,
            permalink: p.post.ap_id,
            mediaUrl: p.post.url,
            thumbUrl: p.post.thumbnail_url ?? (isImage ? p.post.url : undefined),
            author: p.creator.name,
            topic: c.hint,
            score: p.counts.score,
            publishedAt: new Date(p.post.published),
          });
        }
      } catch (err) {
        errors.push(`${c.name}@${c.instance}: ${(err as Error).message}`);
      }
      await sleep(300);
    }
    if (!out.length && errors.length) throw new Error(errors.join(' | '));
    return out;
  },
};
