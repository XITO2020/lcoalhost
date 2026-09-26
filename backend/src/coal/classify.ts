// Filtre IA (Ollama LOCAL, zero cout) pour Add Coal (demande Naim 22/09) : "benner ce qui ne rentre dans
// aucune des cases tech" AVANT que Naim ne voie quoi que ce soit. Ne juge QUE la pertinence thematique
// (dev/tech/cybersec/IA) — jamais le ton, le gout ou le caractere choquant : ca reste la decision de Naim en
// relecture (coal:review / coal:approve / coal:reject), meme principe que l'agent memes.
import { config } from '../config';
import { classify, TOPICS } from '../scraper/topics';
import type { CoalTarget, LinkMeta } from './inspect';

interface Verdict {
  isTech: boolean;
  topic: string;
  reason: string;
}

const SYSTEM = `You are a topic gate for Lcoalhost, a dev/tech/AI humor and curation site.
Given a visitor submission (a TikTok link, an article link, or an image), decide if it plausibly belongs to
one of these categories: ${TOPICS.join(', ')}.
Reject anything with no real connection to software development, tech/hacker culture, cybersecurity, or AI —
no matter how interesting it is otherwise (politics, sports, food, unrelated memes, etc.).
Do NOT judge quality, taste, or offensiveness. Topical relevance only — a human reviews everything after you.
Reply with ONLY one line of JSON, exactly this shape:
{"isTech":true|false,"topic":"...","reason":"..."}
- topic = single word from the list above (best guess even when isTech is false)
- reason = one short sentence explaining the call, in French`;

function extractVerdict(raw: string): Verdict | null {
  const cleaned = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    const j = JSON.parse(cleaned) as Partial<Verdict>;
    if (typeof j.isTech !== 'boolean') return null;
    return {
      isTech: j.isTech,
      topic: typeof j.topic === 'string' && (TOPICS as readonly string[]).includes(j.topic) ? j.topic : 'general',
      reason: typeof j.reason === 'string' ? j.reason.slice(0, 200) : '',
    };
  } catch {
    return null;
  }
}

async function askOllama(prompt: string): Promise<Verdict | null> {
  const res = await fetch(`${config.OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: config.OLLAMA_MODEL, system: SYSTEM, prompt, stream: false, format: 'json', options: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status} (${config.OLLAMA_URL} joignable ?)`);
  const data = (await res.json()) as { response?: string };
  return data.response ? extractVerdict(data.response) : null;
}

// ---------------------------------------------------------------------------------------------------------------
// LIENS (23/09, demande Naim) : Qwen verifie la pertinence PUIS range le contenu — section du site (Articles /
// Videos / Memes), categorie (topic) et langue — a partir de ce que l'inspection de la page a VRAIMENT trouve
// (inspect.ts). Il ne peut choisir qu'une section techniquement possible pour ce lien (`possible`).
// ---------------------------------------------------------------------------------------------------------------
export interface LinkVerdict extends Verdict {
  kind: CoalTarget;
  lang: 'en' | 'fr' | 'es';
}

const LINK_SYSTEM = `You are the curator of Lcoalhost, a dev/tech/AI humor and curation site.
A visitor submitted a LINK. You get the visitor's note and what was found on the page.
1. Decide if it plausibly belongs to one of these categories: ${TOPICS.join(', ')}. Reject anything with no real
   connection to software development, tech/hacker culture, cybersecurity, or AI (politics, sports, food, unrelated
   memes...). Do NOT judge quality, taste, or offensiveness: topical relevance only.
2. Decide WHERE it goes on the site, choosing ONLY among the "possible" sections given:
   - MEME: a funny image / joke picture
   - VIDEO: a video to watch
   - ARTICLE: something to read (news, blog post, tutorial, doc)
3. Detect the content language: en, fr or es (best guess).
Reply with ONLY one line of JSON, exactly this shape:
{"isTech":true|false,"kind":"ARTICLE|VIDEO|MEME","topic":"...","lang":"en|fr|es","reason":"..."}
- topic = single word from the category list (best guess even when isTech is false)
- reason = one short sentence explaining the call, in French`;

const LANGS = ['en', 'fr', 'es'] as const;
const langOf = (v: unknown): LinkVerdict['lang'] | null => {
  const s = typeof v === 'string' ? v.slice(0, 2).toLowerCase() : '';
  return (LANGS as readonly string[]).includes(s) ? (s as LinkVerdict['lang']) : null;
};

export async function classifyLink(description: string, m: LinkMeta): Promise<LinkVerdict> {
  const prompt = [
    `visitor note: ${description}`,
    `url: ${m.url}`,
    `content-type: ${m.contentType || '?'}`,
    m.title && `page title: ${m.title}`,
    m.description && `page description: ${m.description}`,
    m.siteName && `site: ${m.siteName}`,
    m.ogType && `open graph type: ${m.ogType}`,
    m.htmlLang && `html lang: ${m.htmlLang}`,
    `possible sections: ${m.possible.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');
  const fallbackLang = langOf(m.htmlLang) ?? 'en';
  try {
    const res = await fetch(`${config.OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: config.OLLAMA_MODEL, system: LINK_SYSTEM, prompt, stream: false, format: 'json', options: { temperature: 0.2 } }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status} (${config.OLLAMA_URL} joignable ?)`);
    const data = (await res.json()) as { response?: string };
    const base = data.response ? extractVerdict(data.response) : null;
    if (base) {
      const j = JSON.parse(data.response!.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim()) as { kind?: string; lang?: string };
      const kind = m.possible.includes(j.kind as CoalTarget) ? (j.kind as CoalTarget) : m.guess;
      return { ...base, kind, lang: langOf(j.lang) ?? fallbackLang };
    }
    console.warn('[coal/classify] reponse Ollama illisible (lien), repli sur classement mot-cle');
  } catch (err) {
    console.warn(`[coal/classify] Ollama indisponible (lien), repli sur classement mot-cle: ${(err as Error).message}`);
  }
  const topic = classify(`${description} ${m.title ?? ''} ${m.description ?? ''}`);
  return { isTech: topic !== 'general', topic, kind: m.guess, lang: fallbackLang, reason: 'repli mot-cle (Ollama indisponible ou reponse illisible)' };
}

/** Classe une soumission Add Coal. Panne Ollama = repli sur le classement mot-cle deterministe du scraper
 * (jamais de blocage juste parce que le LLM local est down) ; le motif dit honnetement que c'est un repli. */
export async function classifySubmission(kind: string, description: string, url: string | null): Promise<Verdict> {
  const prompt = `kind: ${kind}\ndescription: ${description}${url ? `\nurl: ${url}` : ''}`;
  try {
    const v = await askOllama(prompt);
    if (v) return v;
    console.warn('[coal/classify] reponse Ollama illisible, repli sur classement mot-cle');
  } catch (err) {
    console.warn(`[coal/classify] Ollama indisponible, repli sur classement mot-cle: ${(err as Error).message}`);
  }
  const topic = classify(description);
  return { isTech: topic !== 'general', topic, reason: 'repli mot-cle (Ollama indisponible ou reponse illisible)' };
}
