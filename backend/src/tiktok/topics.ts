// Mots-cles TikTok voules par Naim (22/09). 2 fautes de frappe evidentes normalisees ici (videcode -> vibecode,
// browzer -> browser) ; le mot tape par Naim reste accepte en entree (voir TOPIC_ALIASES) pour ne rien casser.
export const TIKTOK_TOPICS = [
  'dev',
  'rgpd',
  'css',
  'vibecode',
  'tech',
  'ia',
  'hacking',
  'robots',
  'neuralink',
  'cyberpunk',
  'http',
  'web3',
  'tokens',
  'api',
  'claude',
  'hermes',
  'agents',
  'mcp',
  'localhost',
  'app',
  'vercel',
  'browser',
  'linux',
  'kali',
  'madamebonplan',
  'ecotech',
  // --- Categories atelier Conspix (23/09, demande Naim) : dossiers de l'atelier video
  // (C:\Users\naimd\Videos\conspix-memeral-reserv-videos\0-atelier) destines a devenir des shorts Veille —
  // reprises telles quelles (slugs derives des noms de dossiers) pour l'accordeon de filtre du rail TikTok
  // (frontend/src/tiktok.js). 3 slugs deja presents ci-dessus (api/css/linux) reutilises, pas dupliques.
  'artistic-ai-apps',
  'blender3d-unreal5',
  'body-training',
  'books',
  'bricolage',
  'bricolage-hardware',
  'business-do-it-sure',
  'cloud-data-astuces',
  'coding',
  'combo-crea',
  'combo-net-use',
  'combo-seo-ia',
  'cool-apps',
  'crypto-sbt-bots',
  'deep-learning-new-ia',
  'dropshipping',
  'economy',
  'funny',
  'gpt-since-1stmayo23',
  'langues',
  'motivation',
  'nocode',
  'seo',
  'sketching',
  'socials-planification-automaization',
  'terminal-cmd-tools',
  'tktk',
  'toshop-remover-nft-ia',
  'unclassified-ai-tips',
  'video-edit',
  'web3-ressources-navigation',
  'website-ai-aout2023',
  // sous-dossiers de "coding" (capture 1 de Naim)
  'apps-flutter',
  'c',
  'coding-ia',
  'combo-astuces',
  'combo-coding',
  'debug',
  'docker-kubernetes-git',
  'flipper',
  'java',
  'js',
  'node',
  'php-symf-sql',
  'py',
  'react-vue-vite',
  'solidity-cryptocrea',
] as const;

export type TiktokTopic = (typeof TIKTOK_TOPICS)[number];

const TOPIC_ALIASES: Record<string, TiktokTopic> = { videcode: 'vibecode', browzer: 'browser' };

export function normalizeTopic(raw: string): TiktokTopic | null {
  const t = raw.trim().toLowerCase();
  if ((TIKTOK_TOPICS as readonly string[]).includes(t)) return t as TiktokTopic;
  return TOPIC_ALIASES[t] ?? null;
}

// Passerelle avec le classement gratuit/deterministe de scraper/topics.ts (js/python/css/ia/cybersec/devops/
// survie/general) : sert partout ou un texte est classe automatiquement puis doit retomber sur un mot de la
// liste Naim ci-dessus (coal/approve.ts, watch/import-dump.ts). Approximatif par nature — mappe au plus proche.
export const SCRAPER_TO_TIKTOK_TOPIC: Record<string, TiktokTopic> = {
  js: 'dev', python: 'dev', css: 'css', devops: 'dev', ia: 'ia', cybersec: 'hacking', survie: 'ia', general: 'tech',
};
