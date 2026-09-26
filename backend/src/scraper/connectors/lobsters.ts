import type { Connector } from '../types';
import { getJson } from '../http';

// Lobsters — communaute tech invitation-only, JSON public sans cle.
interface Story {
  short_id: string;
  title: string;
  url: string;
  score: number;
  created_at: string;
  submitter_user: string | { username: string };
  tags: string[];
  comments_url: string;
}

export const lobsters: Connector = {
  id: 'lobsters',
  label: 'Lobsters',
  kinds: ['ARTICLE'],
  requires: [],
  enabled: () => true,
  async run() {
    const list = await getJson<Story[]>('https://lobste.rs/hottest.json');
    return list.map((s) => ({
      kind: 'ARTICLE' as const,
      source: 'lobsters',
      sourceId: s.short_id,
      sourceLabel: 'Lobsters',
      title: s.title,
      permalink: s.url || s.comments_url,
      discussionUrl: s.comments_url,
      author: typeof s.submitter_user === 'string' ? s.submitter_user : s.submitter_user?.username,
      tags: s.tags,
      score: s.score,
      publishedAt: new Date(s.created_at),
    }));
  },
};
