# SEO / AEO — Audit lever 3 (2026-09-27)

> Site **pas encore déployé** (bascule domaine du 26/09 poussée, KVM2 en attente du go). Tout ce qui
> suit vient d'une lecture réelle du code (pas d'invention), sauf les benchmarks marché externes,
> sourcés. Perf réelle **impossible à mesurer avant la mise en ligne** (le lever 1 du 24/09 avait déjà
> mesuré en dev local, non représentatif — HTTP/1.1 sans compression).

## Ce qui est déjà solide (levers 1-2, vérifié dans le code)

- `/item/:id` : vraie page HTML server-rendered par item (title, meta description, canonical, OG,
  JSON-LD `VideoObject`/`Article`/`ImageObject`, `robots: index,follow`, `loading="lazy"`).
- `/sitemap.xml` : généré depuis la base, `lastmod`/`changefreq`/`priority` réels, pas un fallback SPA.
- `/llms-full.txt` + `llms.txt` statique : dump texte pour moteurs de réponse IA.
- `FAQPage` JSON-LD (4 questions honnêtes) + `WebSite` JSON-LD avec `alternateName`/`sameAs`.
- `robots.txt` : `Allow: /` total, IA comprises (assumé, rien à cacher).

## Corrigé aujourd'hui

- **Meta description homepage** : 164 → **153 caractères** (le lever 1 l'avait déjà signalé à 160 max).
  Le clin d'œil "Jerry Smith" est gardé (choix éditorial, pas à moi d'y toucher) ; juste raccourci
  la formulation autour.

## Trouvé aujourd'hui, PAS touché (décision à toi)

### 1. FR/ES invisibles aux moteurs (le plus gros manque réel)
La langue est **100% client** (`localStorage`, une seule URL `/`, pas de segmentation `/fr/`, `/es/`).
Un crawler ne voit **que la version anglaise** de la homepage — Google ne peut indexer aucune page en
français ou espagnol, et sans URLs distinctes, impossible de poser du `hreflang` (il faut une URL par
langue pour que cette balise ait un sens). C'est un choix d'archi assumé, pas un oubli technique — mais
si tu veux du trafic FR un jour, ça demande un vrai chantier (routing par préfixe de langue), pas un
patch. Je ne l'ai pas touché : hors scope de cet audit, décision produit à prendre d'abord.

### 2. Aucun backlink — le vrai levier "faute de frappe"
Point important à corriger dans l'attente : **aucune techno SEO ne fait apparaître un site dans la
barre d'adresse d'un navigateur** quand quelqu'un tape "localhost" de travers — Chrome/Firefox
proposent depuis l'historique PERSONNEL du visiteur ou depuis Google Suggest, pas depuis un classement
tiers. Ce qui marche réellement : **bien classer sur Google/Bing pour la requête tapée** ("locahost
what is it", "lcoalhost", etc.) — exactement ce que FAQPage + llms.txt visent. Mais aujourd'hui,
**zéro backlink** = zéro autorité de domaine = classement quasi impossible face à Wikipedia/Stack
Overflow sur ces requêtes. Le vrai levier manquant n'est pas technique, c'est relationnel : un post
Hacker News "Show HN", un thread Reddit r/programmerhumor, une mention dev.to. Ça ne se code pas.

### 3. IndexNow (Bing/Yandex) — gain gratuit, à faire APRÈS le déploiement
Fichier clé + ping à chaque publication = indexation Bing quasi instantanée (Google ignore ce
protocole, seulement Bing/Yandex/Naver l'utilisent). Pas fait maintenant : ça pinguerait une URL qui
n'existe pas encore. À poser juste après le premier déploiement réel.

### 4. Perf : à ré-auditer en vrai après déploiement
Le score 55/100 du 24/09 vient du Vite dev server (HTTP/1.1, pas de compression) : non représentatif.
nginx (Traefik derrière) fait déjà gzip + HTTP/2 — à re-mesurer une fois en ligne.

## Prochaine étape recommandée
Après déploiement bêta : (a) IndexNow, (b) 1-2 posts Show HN/Reddit une fois le contenu jugé prêt par
toi, (c) ré-audit perf réel via l'agent edge-optimizer sur `https://lcoal.host`.
