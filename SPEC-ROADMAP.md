# Lcoalhost — Spec & feuille de route vers un site autonome, monétisable, séducteur

Date : 2026-09-22. Objectif fixé par Naim : le trafic vient de la faute de frappe universelle des
devs/vibecoders (`localhost` → `lcoalhost`) — quasi-certitude de volume, donc **pub tierce
(particuliers + entreprises) réaliste** et **promo directe des propres sites de Naim (lien
TabascoCity) mega possible**. But : un site 100 % complet, autonome, qui séduit les passionnés de
code / design numérique / tech / anticipation. Ce document fusionne (1) le recensement factuel de
l'existant (audit code, pas de suppositions) et (2) le plan d'étapes pour combler les manques.

À lire avant d'y toucher : [`CLAUDE.md`](CLAUDE.md) (800+ lignes, historique des passes), `MD/`
n'existe pas pour ce projet (docs à plat : `CLAUDE.md`, `CONNECTEURS.md`, `PAIEMENTS.md`,
`STATUS.md`).

---

## 1. Recensement de l'existant (audit code, 22/09/2026)

### 1.1 SEO — partiel, bloqué par l'absence de SSR
- Existe : `frontend/public/robots.txt` (autorise explicitement les crawlers IA), `sitemap.xml`
  (**1 seule URL**, la homepage), meta title/description/canonical, Open Graph, Twitter Card,
  JSON-LD `WebSite` sitewide (`frontend/index.html` L6-39).
- Manque : le site est une **SPA 100 % rendue côté client, sans SSR ni prerendering**
  (`backend/src/index.ts` ne sert que `/api/*` ; nginx fait un simple `try_files $uri /index.html`).
  Résultat : **aucune URL par item** (meme/vidéo/article), donc rien à indexer individuellement,
  donc rien à faire remonter sur une recherche précise. Domaine canonique (`lcoalhost.lol` vs
  `lcoal.host`) encore marqué "à confirmer" dans le HTML.

### 1.2 AEO (citabilité par les moteurs de réponse IA) — embryonnaire
- Existe : `llms.txt` (explique le site, la blague du nom, le domaine canonique), mais sa section
  "Key pages" ne liste que la homepage.
- Manque : pas de `llms-full.txt` (dump de contenu), pas de JSON-LD par item (`Article`/
  `ImageObject`/`VideoObject`), pas de version statique/crawlable des memes/vidéos/articles.

### 1.3 Metrics API (côté propriétaire, pas le Mouchard qui est côté visiteur) — quasi inexistant
- Existe : un seul compteur global (`Counter.hits` en base), exposé publiquement (sans auth) via
  `GET /api/stats` (agrégats par kind/topic + total hits + dernier scrape). Aucune persistance de
  visite individuelle, aucune géo/référent/device, aucune série temporelle.
- Manque : tout ce qu'il faut pour **vendre de la pub avec des chiffres** — vues par page/période,
  visiteurs uniques, provenance, taux de clic sur les pastilles pub. Aucun outil d'analytics
  (Google Analytics, Plausible, Umami…) n'est branché, aucune table de logs de visite n'existe.

### 1.4 Admin — peut modérer, ne peut pas publier
- Existe : mode admin "embauche" (`backend/src/admin/routes.ts`), auth par token partagé
  (`ADMIN_TOKEN`), routes : whoami, storage, **pin** un item, **delete** un item. C'est tout.
- Manque : **aucune route pour créer/publier un item depuis l'interface web.** Toute publication
  (scraper, agent memes, Add Coal des visiteurs, Liquid Enhancement) passe par des **scripts CLI
  exécutés en local par Naim** (`npm run coal:approve`, `agent:publish`, etc.) — rien n'est
  accessible depuis le navigateur en mode admin. Donc : pas de bouton "poster un meme/une pub
  maison", et **aucune notion de choix de langue à la publication** puisque la publication
  elle-même n'existe pas côté web (`Item.lang` est fixé par le scraper ou le seed, jamais par un
  humain via une UI).

### 1.5 Pages légales — rédigées mais pas validées
- Existe : `mentions-legales.html`, `cgu.html`, `confidentialite.html` (`frontend/public/legal/`),
  complètes et cohérentes avec le fonctionnement réel du site (identité SASU, hébergeur Scaleway,
  cookie `lh_vid`, Add Coal, Hacks/Stripe, purge 45 jours, droit CNIL). **Toutes les trois annoncent
  elles-mêmes qu'elles doivent être relues par Naim/un juriste avant mise en ligne** ; l'adresse
  Scaleway est notée "de mémoire, à confirmer".
- Manque : relecture réelle, confirmation de l'adresse Scaleway, **aucun bandeau de consentement
  cookies** (n'existe pas dans le frontend — probablement pas nécessaire tant que `lh_vid` reste un
  cookie strictement fonctionnel, cf. §3.6).

### 1.6 Pub tierce (particuliers + entreprises) — zéro infrastructure
- Existe : `#pub-aside` (5 pastilles, `href="#"` en dur, ce sont des promos internes à l'écosystème
  Naim/QISHIM — pas de la pub tierce) et `#ads-aside` (5 rectangles gris "Your ad here", même pas
  un `<a>`, purement décoratif).
- Manque : **aucun modèle Prisma Ad/Advertiser/AdSlot**, aucune route backend, aucun formulaire de
  soumission, aucun flux de paiement pour un encart. La politique de confidentialité le confirme
  elle-même : "emplacements vides, sans partenaire branché."

### 1.7 "0 cookies" — affirmation fausse telle qu'écrite aujourd'hui
- Fait établi : le site pose **un vrai cookie**, `lh_vid` (httpOnly, `backend/src/lib/visitor.ts`),
  qui sert d'identifiant anonyme pour les réactions et le classeur. Ce n'est PAS un cookie de
  tracking publicitaire, mais ce n'est pas zéro cookie non plus.
- Incohérence trouvée : le texte du Mouchard (`mouchard.trust`, `mouchard.modalTrust` dans
  `i18n.js`, et la ligne visible sous le HUD) dit littéralement **"Zero cookies"** dans les 3
  langues, alors que le pied de page dit correctement "No **tracking** cookies : just one anonymous
  ID..." et que `confidentialite.html` décrit `lh_vid` comme "un cookie technique anonyme". Le
  Mouchard se contredit avec sa propre politique de confidentialité sur la même page.

### 1.8 Responsive mobile/tablette — incomplet, un bug critique déjà corrigé (23/09)
- Constat Naim (22/09) : le responsive n'est pas fini sur mobile et tablette.
- **Testé en vrai le 23/09** (375px mobile, 768px tablette portrait, 1024px tablette paysage) :
  **bug critique trouvé et corrigé** — sous 980px, `.centrale` passait bien en grille 1 colonne,
  mais `.plant-col`/`.viewer` gardaient leur `grid-column:1`/`grid-column:2` hérités du desktop
  (jamais réinitialisés dans la media query mobile). Un placement de grille explicite force la
  création d'une colonne implicite même quand `grid-template-columns` n'en définit qu'une : tout le
  site s'écrasait sur 2 colonnes de ~138px/~227px au lieu d'empiler en pleine largeur — mobile
  essentiellement cassé. Corrigé (`grid-column: auto` sur les 3 enfants concernés dans la media
  query `max-width:980px`) et revérifié : 1 colonne pleine largeur (343px sur 375px d'écran), 0
  débordement horizontal, feed/footer/pub-aside tous corrects.
- **Reste à auditer** (pas fait ce soir, faute de temps) : la zone intermédiaire 980-1240px
  (tablette paysage, testée superficiellement ce soir — semble correcte mais pas passée au crible
  élément par élément), l'alignement de la navbar qui bascule sur 2 lignes en mobile (le bouton
  "Classeur" se retrouve seul, esthétique à revoir mais non bloquant), et tous les formulaires
  (Liquid Enhancement, Add Coal, Hacks) non testés en largeur tactile.

### 1.9 Poids des images — non optimisé (23/09)
- Constat Naim (23/09) : toutes les images du site doivent être allégées — point manquant de
  l'audit initial, important pour le rendu (temps de chargement mobile en particulier, alors que le
  trafic visé vient justement d'une faute de frappe grand public, pas d'un public captif qui
  attendra).
- Non audité en détail ce soir (poids réels par image, formats utilisés, présence ou non de
  `srcset`/formats modernes AVIF-WebP, lazy-loading systématique ou pas) — à faire avec la même
  rigueur que le reste : mesurer avant de corriger.

### 1.10 Feed TikTok/Veille — déjà traité hors de ce document (fonctionnel, scraping manuel pour
l'instant, cf. `CLAUDE.md`). Non détaillé ici puisque Naim l'a explicitement mis à part de la
demande.

---

## 2. Feuille de route — dans l'ordre où l'attaquer

### Phase A — Admin : publication directe + choix de langue (bloquant pour le reste) ✅ FAIT (23/09)
**Pourquoi en premier** : sans ça, ni les memes-pub maison, ni le lien TabascoCity, ni une vraie
pub tierce approuvée ne peuvent atterrir dans le feed autrement qu'en repassant par un script CLI
à la main à chaque fois — pas "autonome".
**Fait, testé de bout en bout (détail dans `CLAUDE.md`, 38e passe)** : `POST /admin/items`,
`Item.sponsored`, onglet "Poster" admin-only, étiquette "Partenaire" toujours visible dans le feed.
**Procédé** :
1. Nouvelle route backend `POST /admin/items` (dans `backend/src/admin/routes.ts`, même garde
   `x-admin-token` que l'existant) : accepte `kind` (MEME/VIDEO/ARTICLE), `topic`, `lang`
   (**select `en`/`fr`/`es` obligatoire dans le payload** — pas de défaut implicite), titre,
   média (upload ou URL), texte. Statut de départ : `PUBLISHED` direct (c'est Naim qui poste,
   pas un tiers à modérer — différent du flux Add Coal/Liquid qui reste `PENDING_REVIEW`).
2. Étendre `Item.lang` si besoin (actuellement `en`/`fr` seulement côté Prisma à vérifier — l'ajout
   d'`es` doit être cohérent avec `contentLang()` côté frontend qui aujourd'hui retombe sur `en`
   pour l'UI espagnole faute de contenu ES ; publier volontairement en ES devient alors possible).
3. Frontend : dans `frontend/src/embauche.js` (déjà le mode admin "habillé"), ajouter un petit
   formulaire "Poster" avec un **sélecteur de langue explicite et visible** (pas un radio caché),
   réutilisant le pattern déjà en place pour Liquid Enhancement (`.chip` pour kind/topic).
4. Un item "pub maison" (promo TabascoCity/écosystème) est un `Item` comme un autre avec un
   `kind` dédié (ex. `PROMO`) ou un flag `pinned`-like (`sponsored: true`) pour le distinguer
   visuellement dans le feed (bordure/étiquette différente, jamais un item masqué en pub native
   trompeuse — transparence obligatoire, cf. droit de la consommation).

### Phase B — Lien direct TabascoCity
**Procédé** : une fois Phase A faite, Naim poste lui-même 1-2 items "pub maison" pointant vers
TabascoCity (comme n'importe quel item du feed, avec le flag `sponsored`/`PROMO`), plus une
pastille dédiée dans `#pub-aside` (`frontend/src/pub.js`, déjà prévu pour ça — juste remplacer un
`href="#"` par la vraie URL TabascoCity). Aucun développement supplémentaire nécessaire au-delà de
la Phase A + fournir l'URL.

### Phase C — SEO/AEO réel (permalinks + structured data) ✅ FAIT (23/09)
**Pourquoi ça bloque le volume de trafic long terme** : sans URL par item, Google/Bing/les IA ne
peuvent indexer/citer QUE la homepage, jamais un meme précis qui pourrait devenir viral sur une
requête de longue traîne.
**Fait, testé (détail `CLAUDE.md` 39e passe)** : `/item/:id` (HTML+JSON-LD, CSP vérifiée réelle),
`/sitemap.xml` dynamique (871 URLs, XML validé), `/llms-full.txt`. Bug réel trouvé en même temps :
un MEME publiable en `lang=es` via le formulaire Poster (Phase A) aurait été invisible pour
toujours (filtre MEME strict par langue + `contentLang()` ne demande jamais `es`) — corrigé.
Domaine canonique : **`lcoalhost.lol`, tranché par Naim le 22/09** (cf. `CLAUDE.md` §SEO/AEO) — déjà
appliqué partout (canonical, OG, JSON-LD, sitemap, robots, llms.txt, 301 nginx depuis `lcoal.host`).
**Procédé** (sans SSR complet, qui serait disproportionné pour un site Express+SPA) :
1. À chaque publication (scraper, admin, Coal approuvé), générer un **snapshot HTML statique**
   minimal par item (`GET /item/:id` côté nginx sert un fichier pré-rendu, pas la SPA) : titre,
   image/vidéo, description, JSON-LD `Article`/`ImageObject`/`VideoObject`, lien "voir en contexte"
   vers la SPA. Génération faisable en Node pur (template string, pas de framework SSR à ajouter).
2. Le `sitemap.xml` devient généré dynamiquement (route `GET /sitemap.xml` côté backend ou script
   de build) au lieu du fichier statique à 1 URL — une entrée par item publié.
3. `llms.txt` → ajouter une section "Key pages" pointant vers `/item/:id` type d'URL + un
   `llms-full.txt` qui dump le contenu texte des items récents (format simple, pas de service tiers).
4. ~~Trancher le domaine canonique~~ — ✅ `lcoalhost.lol` (Naim, 22/09).

### Phase D — Metrics API pour argumenter la pub ⏳ PARTIEL (23/09)
**Pourquoi** : vendre un encart sans chiffres de trafic réels, c'est invendable face à un
annonceur, particulier ou entreprise.
**DÉCISIONS NAIM (23/09, fin de journée)** — remplacent tout ce qui précédait sur ce point :
- **Umami ABANDONNÉ.** Malentendu reconnu : Umami est un logiciel serveur à part (sa propre base), ce que
  Naim n'avait jamais voulu. Motif : **le KVM2 doit rester LÉGER** pour faire la place à un LLM puissant
  (tuveuxun.expert, puis Lcoalhost — amélioration du Qwen déjà dispo). `analytics.js` (inerte) supprimé,
  build vérifié.
- **Google Analytics pour la mesure des pubs** (choix Naim ; Lcoalhost est hors du périmètre anti-Big-Tech
  strict TC/Conspix). **Conséquence obligatoire** : GA dépose des cookies → bandeau de consentement RGPD à
  construire AVANT de l'activer, et correction des textes qui promettent "zéro cookie de tracking"
  (`confidentialite.html` section Cookies, `mouchard.trust`/`mouchard.modalTrust` dans i18n.js). Pas encore fait.
- Le comptage de trafic "maison" (pages vues/sources) envisagé à la place d'Umami n'est donc PAS construit.
**Fait** : taux de clic réel des encarts (point 4 ci-dessous), anonyme et sans cookie — reste utile en
complément de GA (aucun consentement requis).
4. ✅ **FAIT (23/09, 53e passe)** — taux de clic réel : affichages RÉELS (encart ≥50 % à l'écran, pas juste
   présent dans la page) + clics, par encart et par jour, pour les pastilles maison ET les encarts de la
   régie (Phase E). Agrégé et anonyme (table `PromoStat`, ni cookie ni IP ni identifiant en base).
   Rapport : `npm run promo:stats [-- jours]`. Mention ajoutée à `confidentialite.html`.

### Phase E — Régie pub tierce (particuliers + entreprises) — ✅ FAIT (23/09, 44e passe), sauf 2 points
**Statut réel** : `ADS_ASIDE` (encarts rectangles) entièrement câblé et vérifié en vrai (formulaire self-serve
→ paiement Stripe → PENDING_REVIEW → CLI review/approve/reject → rendu réel côté front, étiquette "Publicité"
toujours visible, fallback honnête sur les placeholders tant que rien n'est approuvé). **Reste ouvert** :
`PUB_ASIDE` (pastilles rondes, rotation maison) pas branché — intégration dans `pub.js` plus lourde, laissée
en TODO délibéré. **Tarification réelle non tranchée** (`ADS_PRICE_CENTS=999` = placeholder, pas une décision
Naim — voir §"Reste à trancher" en bas de fichier). Détail complet : `CLAUDE.md` 44e passe.

**Procédé** :
1. Nouveaux modèles Prisma : `Advertiser` (contact, société ou particulier, statut vérifié),
   `AdSlot` (position : `pub-aside`/`ads-aside`/`feed-native`, dates début/fin, prix, statut
   `PENDING_REVIEW`/`APPROVED`/`REJECTED`/`EXPIRED` — même discipline que `CoalSubmission` :
   **jamais publié automatiquement**, toujours relu par Naim avant mise en ligne).
2. Formulaire self-serve public (`/annoncer` ou équivalent) : upload visuel + lien + créneau désiré
   + email de contact. Écrit en `PENDING_REVIEW`, jamais affiché tant que non approuvé (CLI ou,
   une fois la Phase A faite, depuis le mode admin web).
3. Paiement : réutiliser l'intégration Stripe déjà en place pour les Hacks (`PaymentIntent`,
   `PaymentEvent` existent déjà en base) plutôt que d'ajouter un 2e provider de paiement.
4. À l'expiration (`AdSlot.endDate` dépassée), un job (cron déjà présent pour le scraper, même
   pattern) désactive automatiquement l'encart — pas de pub périmée qui traîne.
5. Distinction visuelle stricte pub tierce vs pub maison TabascoCity (Phase B) : libellé
   "Publicité"/"Partenaire" explicite, exigence légale de transparence commerciale.

### Phase F — Légal, à finaliser avant toute mise en ligne publique — ⏳ PARTIEL (23/09, 46e passe)
1. **Relecture réelle par Naim (et si besoin un juriste) des pages** — reste entièrement à faire,
   action humaine, pas technique.
2. **Adresse d'hébergement — PAS résolu, ne pas deviner** : `mentions-legales.html` disait
   "Scaleway SAS (offre Dedibox)" avec une fausse adresse — faux depuis la correction KVM2 du 23/09
   (41e passe). Remplacé par une mention honnête "à confirmer avant mise en ligne" plutôt que
   d'inventer une 2e fausse adresse (Hostinger KVM2 n'est confirmé que pour une PARTIE du site,
   portée exacte du déploiement toujours en attente — voir `reference_serveurs_prod`). **Naim doit
   trancher la portée du déploiement AVANT que cette ligne puisse être remplie pour de vrai.**
3. ✅ **FAIT** — Texte "Zero cookies" du Mouchard : déjà corrigé lors d'une passe précédente
   (`mouchard.trust`). **Régression trouvée et corrigée cette passe** : `mouchard.modalTrust`
   (Labo Pentest) affirmait encore "zéro pub tierce active" — devenu FAUX depuis que la Phase E a
   câblé une vraie régie pub tierce. Reformulé pour rester vrai en toutes circonstances : accent mis
   sur l'absence de cookie de tracking + l'étiquetage "Publicité" toujours visible, plutôt qu'une
   promesse de "zéro pub" qui se périme des le 1er encart approuvé.
4. ✅ Décision bandeau de consentement confirmée applicable : les encarts de la régie pub tierce
   (Phase E) sont de simples `<img>`/`<a>`, aucun cookie ni pixel de tracking — le bandeau RGPD
   reste donc PAS requis, documenté explicitement dans `confidentialite.html`.
5. **Nouveau (cette passe)** : `confidentialite.html` (catégorie de données "Encarts Annoncer" +
   destinataires/sous-traitants + section Cookies réécrite) et `cgu.html` (nouvel article 8 "Encarts
   publicitaires (Annoncer)", articles renumérotés 8→13) mis à jour pour couvrir la régie pub tierce
   de la Phase E — ces pages ne mentionnaient pas du tout cette fonctionnalité avant.

### Phase G — Responsive + poids des images (perf réelle avant mise en ligne) — ⏳ PARTIEL (23/09, 49e passe)
**Statut réel** : débordement horizontal 980-1240px corrigé (`overflow-x:hidden` html+body, volets fermés en
`translateX(±100vw)`) ; formulaires Liquid/Coal/Hacks/Annoncer sans débordement à 375px ; logos `pubs/`
3,24 Mo → 132 Ko ; logos Labo Pentest réparés (étaient cassés). `loading="lazy"` déjà présent partout.
**Incident** : recompression en place de 25 images de fond/thème sans sauvegarde — 5 restaurées, 21 encore
re-encodées en attente des originaux de Naim (détail `CLAUDE.md` 49e passe). **Reste ouvert** : layout shift
des images de memes (`.media img`, dimensions à stocker côté backend) ; taille des chips/boutons tactiles
(< 44px, décision design Naim) ; bouton Classeur seul en mobile (cosmétique, décision Naim).

**Pourquoi juste avant le déploiement** : le trafic visé (faute de frappe grand public) est un
public de passage, pas captif — un site lent ou cassé sur mobile perd ce trafic avant même qu'il
juge le contenu.
1. Responsive : le bug critique de grille (§1.8, 2 colonnes écrasées sous 980px) est déjà corrigé
   et vérifié (23/09). Reste : audit élément par élément de la zone 980-1240px, des formulaires
   (Liquid/Coal/Hacks) en largeur tactile, et polish de la navbar (bouton "Classeur" isolé sur sa
   propre ligne en mobile).
2. Images (§1.9) : mesurer le poids réel actuel par image/format avant de corriger (pas de
   correctif à l'aveugle). Pistes attendues une fois mesuré : conversion systématique en
   WebP/AVIF, `loading="lazy"` partout où pas déjà fait, dimensions explicites (`width`/`height`)
   pour éviter le layout shift, compression des assets maison (mascotte T360, bannières) qui n'ont
   pas la contrainte d'un scraping externe.

### Phase H — Déploiement — ⏳ DÉBLOQUÉ (23/09 : cible = KVM2), fichiers de déploiement à réécrire
- `ADMIN_TOKEN` de prod à générer (fort, jamais celui de dev) — garde-fou déjà en place : le backend
  refuse de démarrer en prod avec le token faible de dev. Génération = côté serveur, par Naim.
- ✅ Domaine canonique tranché : `lcoalhost.lol` (Phase C.4).
- ✅ **Cible d'hébergement TRANCHÉE (Naim 23/09)** : **Lcoalhost va sur le KVM2 Hostinger** (Traefik, serveur
  partagé Dueria/Raisup/tuveuxun), **avec un petit dossier vidéo de secours** si le pont vidéos Conspix
  n'existe pas. **Contrainte : le KVM2 doit rester LÉGER** — il doit garder la place pour un LLM puissant
  (tuveuxun.expert, puis Lcoalhost ; amélioration du Qwen déjà dispo) → pas d'Umami, pas de service annexe
  lourd ; surveiller le poids de Lcoalhost (Postgres, mirror disque, quota `big cleaning`).
- ✅ **Fichiers de déploiement réécrits pour le KVM2 (23/09, 57e passe)** : `docker-compose.yml` (db + backend +
  `web` nginx alpine en réseau hôte :8086, labels Traefik, certificat Let's Encrypt automatique), `deploy/nginx.conf`,
  `deploy/deploy-kvm2.sh` + **`deploy-kvm2.bat`** (double-clic), `env.docker.example`, `deploy/DEPLOY.md`. Ancienne
  version Dedibox archivée (`deploy/archive-dedibox/`). Build + paquets testés en local ; **jamais exécuté sur le
  serveur** (pas d'accès SSH depuis la machine de dev).
- **Reste (Naim)** : DNS Porkbun → `187.77.144.220` ; 1er `deploy-kvm2.bat` puis remplir le `.env` du serveur ;
  adresse Hostinger dans `mentions-legales.html` (Phase F.2 — à reprendre du contrat, pas inventée).
- Une fois tranché : mise en ligne publique réelle, avec indexation qui peut enfin commencer à produire
  un effet mesurable (rien de tout ceci n'a d'effet SEO/AEO réel avant déploiement + indexation).

---

## 3. Ce qui N'EST PAS dans cette feuille de route (hors scope, volontairement)
- Le feed TikTok/Veille (déjà traité ailleurs, Naim l'a explicitement mis à part).
- Tout scan actif du visiteur (ports, device fingerprint invasif) — ligne rouge déjà posée deux
  fois cette session, ne sera jamais reconsidérée ici.
- Choix d'un réseau publicitaire programmatique tiers (Google AdSense, etc.) — la régie de la Phase E est
  pensée en direct/self-serve. (Note 23/09 : Naim a en revanche choisi **Google Analytics pour mesurer les
  pubs** — Lcoalhost est hors du périmètre anti-Big-Tech strict, réservé à TC/Conspix. Voir Phase D.)

---

## 4. Incertitudes / à trancher par Naim (mis à jour 23/09)
- Tarification des encarts pub tiers (Phase E) — `ADS_PRICE_CENTS=999` n'est qu'un placeholder.
- Relecture juridique des pages légales (Phase F.1).
- Embeds TikTok et RGPD : simple mention dans la politique, ou façade "cliquer pour charger".
- Déjà tranchés (pour mémoire) : domaine canonique `lcoalhost.lol` (22/09) ; flag `Item.sponsored`
  plutôt qu'un `kind: PROMO` (Phase A, 23/09) ; **hébergement = KVM2 + petit dossier vidéo de secours,
  KVM2 léger (23/09)** ; **Umami abandonné, Google Analytics pour les pubs (23/09)**.
