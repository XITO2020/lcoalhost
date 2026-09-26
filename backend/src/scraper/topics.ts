// Classement par sujet, sans LLM (gratuit, deterministe). Ordre = priorite : "survie" (les 5 %) passe avant
// "cybersec", qui passe avant les sujets techniques. `general` = rien de reconnu.

export const TOPICS = ['js', 'python', 'css', 'ia', 'cybersec', 'devops', 'survie', 'general'] as const;
export type Topic = (typeof TOPICS)[number];

const RULES: Array<[Topic, RegExp]> = [
  [
    'survie',
    /ai safety|alignment|misalign|superintelligen|existential (risk|threat)|x-risk|interpretab|human oversight|responsible ai|ai governance|ai risk|kill switch|ai (and|with) humanity/i,
  ],
  [
    'cybersec',
    // + mots FR (23/09, source Korben) : faille, piratage/pirate, fuite de donnees, mouchard, arnaque, rancongiciel.
    /security|securit[ée]|vulnerab|vuln[ée]rabilit|exploit|\bcve-?\d|malware|ransomware|phishing|breach|zero-?day|encryption|chiffrement|privacy|surveillance|infosec|\bhack(ed|er|ing)?\b|backdoor|supply chain attack|\bcert\b|\bfailles?\b|piratage|\bpirat[ée]s?\b|fuites? de donn[ée]es|mouchard|arnaque|ran[çc]ongiciel/i,
  ],
  // + ChatGPT (\bgpt ne matchait pas "ChatGPT") et "intelligence artificielle" (23/09, source Korben).
  ['ia', /\bai\b|\bia\b|\bllms?\b|\bgpt|chatgpt|intelligence artificielle|claude|gemini|mistral|qwen|llama|machine learning|neural|deep learning|agentic|\bagents?\b|copilot|diffusion|chatbot|openai|anthropic/i],
  ['css', /\bcss\b|tailwind|flexbox|\bsass\b|\bscss\b|\bsvg\b|\bhtml5?\b|\bux\b|frontend|front-end/i],
  ['js', /javascript|typescript|node\.?js|\breact\b|\bvue\b|svelte|\bnpm\b|\bdeno\b|\bbun\b|\bjs\b|next\.js|webpack|\bvite\b|\bjquery\b/i],
  ['python', /python|django|flask|\bpip\b|pandas|fastapi|numpy|pytorch|jupyter/i],
  ['devops', /docker|kubernetes|\bk8s\b|linux|devops|ci\/cd|terraform|nginx|\bserver\b|localhost|deploy|sysadmin|bash|\bssh\b|postgres|\bsql\b|\bgit\b|rust\b|golang|\bgo\b/i],
];

export function classify(text: string, hint?: string): Topic {
  for (const [topic, re] of RULES) if (re.test(text)) return topic;
  return (TOPICS as readonly string[]).includes(hint ?? '') ? (hint as Topic) : 'general';
}
