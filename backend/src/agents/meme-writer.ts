// Agent memes — un LLM LOCAL (Ollama, zero cout, jamais d'API payante) ecrit des memes-texte ORIGINAUX,
// inspires (sans le recopier) d'un vrai titre d'actu deja scrape. Ecrit toujours en status HIDDEN : jamais
// visible sans relecture de Naim (npm run agent:review puis agent:publish).
// Demande Naim 22/09 : "des agents IA nourrissent aussi la bete de nouveautes" ; il edite les textes a la main.
//
// Bilingue (decision Naim 22/09, PAS une simple traduction) : EN = base, priorise l'humour US, inspire en
// priorite des sources americaines (rss-us : TechCrunch/Verge/ArsTechnica/Wired). FR = plus riche, recoit une
// ADAPTATION creative de la blague EN ("version drole", pas une traduction litterale) EN PLUS des memes maison
// 100% FR de Naim (seed.ts). Les deux langues sont ecrites en 2 appels Ollama separes, chacune en HIDDEN.
import { randomUUID } from 'node:crypto';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { classify, TOPICS } from '../scraper/topics';

const SYSTEM_EN = `You write short meme-text captions for Lcoalhost, an American-flavored dev/tech/AI humor site.
Tone: 90s internet, goofy, never mean, never NSFW, never discriminatory.
Strict rule: you invent a JOKE inspired by the given topic. Never state any technical fact as true
(no fake numbers, no fake quotes) — this is comedy, not news.
Reply with ONLY a JSON object, one line, exactly this shape:
{"title":"...","caption":"...","topic":"..."}
- title = short hook, max 90 characters
- caption = short punchline, max 140 characters
- topic = a single word from: ${TOPICS.join(', ')}`;

const SYSTEM_FR = `Tu adaptes en francais une blague de dev/tech deja ecrite en anglais pour Lcoalhost, site d'humour francais.
Ce n'est PAS une traduction litterale : reecris-la pour qu'elle soit drole en francais (references, jeux de
mots, formulations francaises), meme si ca change des mots. Ton : annees 90, potache, jamais mechant, jamais
NSFW.
Reponds UNIQUEMENT avec un objet JSON, une seule ligne, exactement ce format :
{"title":"...","caption":"..."}
- title = accroche courte, 90 caracteres maximum
- caption = punchline courte, 140 caracteres maximum`;

interface Draft {
  title: string;
  caption: string;
  topic?: string;
}

function extractJson(raw: string): Draft | null {
  const cleaned = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const j = JSON.parse(cleaned.slice(start, end + 1)) as Partial<Draft>;
    if (typeof j.title !== 'string' || typeof j.caption !== 'string') return null;
    const title = j.title.trim().slice(0, 120);
    const caption = j.caption.trim().slice(0, 200);
    if (!title || !caption) return null;
    return { title, caption, topic: typeof j.topic === 'string' ? j.topic : undefined };
  } catch {
    return null;
  }
}

async function askOllama(system: string, prompt: string): Promise<Draft | null> {
  const res = await fetch(`${config.OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: config.OLLAMA_MODEL, system, prompt, stream: false, format: 'json', options: { temperature: 0.9 } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status} (${config.OLLAMA_URL} joignable ?)`);
  const data = (await res.json()) as { response?: string };
  return data.response ? extractJson(data.response) : null;
}

async function saveDraft(draft: Draft, lang: 'en' | 'fr'): Promise<void> {
  const topic = draft.topic && (TOPICS as readonly string[]).includes(draft.topic) ? draft.topic : classify(`${draft.title} ${draft.caption}`);
  await prisma.item.create({
    data: {
      kind: 'MEME',
      source: 'agent',
      sourceId: randomUUID(),
      sourceLabel: `Agent IA (${config.OLLAMA_MODEL})`,
      title: draft.title,
      caption: draft.caption,
      permalink: 'https://lcoalhost.lol',
      author: 'agent',
      topic,
      lang,
      license: 'Lcoalhost (contenu maison, ecrit par agent IA)',
      reusable: true,
      storage: 'MIRROR',
      status: 'HIDDEN', // jamais visible sans relecture — npm run agent:review puis agent:publish
      publishedAt: new Date(),
    },
  });
}

/** Ecrit jusqu'a `n` paires de memes-texte EN+FR en brouillon. Ne jete jamais tout le cycle : une panne
 * Ollama = juste zero meme ecrit ce coup-ci. */
export async function writeMemes(n = config.AGENT_MEMES_PER_CYCLE): Promise<{ written: number; skipped: string }> {
  if (!config.AGENT_MEMES_ENABLED || n <= 0) return { written: 0, skipped: 'desactive' };

  const pending = await prisma.item.count({ where: { source: 'agent', status: 'HIDDEN' } });
  if (pending >= config.AGENT_MEMES_MAX_PENDING) {
    return { written: 0, skipped: `${pending} brouillons deja en attente de relecture (max ${config.AGENT_MEMES_MAX_PENDING})` };
  }

  // Inspiration = un vrai titre recent (7 jours). Priorite aux sources US (rss-us) ; repli sur HN/DEV/Lobsters
  // si rien d'americain n'est encore en base (ex. tout premier cycle).
  const since = new Date(Date.now() - 7 * 86400_000);
  let pool = await prisma.item.findMany({
    where: { kind: 'ARTICLE', status: 'PUBLISHED', source: 'rss-us', publishedAt: { gte: since } },
    select: { title: true },
    take: 200,
  });
  if (!pool.length) {
    pool = await prisma.item.findMany({
      where: { kind: 'ARTICLE', status: 'PUBLISHED', source: { in: ['hackernews', 'devto', 'lobsters'] }, publishedAt: { gte: since } },
      select: { title: true },
      take: 200,
    });
  }
  if (!pool.length) return { written: 0, skipped: 'aucun article recent en base pour inspirer l’agent' };

  let written = 0;
  for (let i = 0; i < n; i++) {
    const inspiration = pool[Math.floor(Math.random() * pool.length)].title;
    let en: Draft | null;
    try {
      en = await askOllama(SYSTEM_EN, `Today's news headline (get inspired by it, don't copy it): "${inspiration}"`);
    } catch (err) {
      console.warn(`[agent/memes] Ollama indisponible: ${(err as Error).message}`);
      break; // inutile d'insister si Ollama est down
    }
    if (!en) {
      console.warn(`[agent/memes] reponse EN illisible, ignoree (inspiration: "${inspiration.slice(0, 60)}")`);
      continue;
    }
    await saveDraft(en, 'en');
    written++;

    try {
      const fr = await askOllama(SYSTEM_FR, `Blague en anglais a adapter :\ntitle: ${en.title}\ncaption: ${en.caption}`);
      if (fr) {
        await saveDraft({ ...fr, topic: en.topic }, 'fr');
        written++;
      } else {
        console.warn('[agent/memes] adaptation FR illisible, EN garde seul');
      }
    } catch (err) {
      console.warn(`[agent/memes] adaptation FR echouee (EN garde seul): ${(err as Error).message}`);
    }
  }
  return { written, skipped: '' };
}
