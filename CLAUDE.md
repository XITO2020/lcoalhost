# Lcoalhost (lcoalhost.lol · lcoal.host) — Guide Claude Code (cree le 20/09/2026)

> Lire ce fichier AVANT toute analyse. Site d'humour dev « ca marche sur ma machine » : banque de memes, videos et
> articles dev/tech/IA scrapes en direct, pour les « Jerry Smith au travail 3.0 ». **95 % rire, 5 % survie** (cybersec +
> securite de l'IA, humains et IA ensemble). Comedie a rentabiliser, meme veine que Zarmazon. **Le nom est une faute de
> frappe volontaire** (« lcoal » ≠ « local ») : ne jamais la corriger.

## Positionnement (decisions Naim 20/09/2026)
- Zone sur la **carte TabascoCity** (simple lien). **Hors perimetre anti-Big-Tech strict TC/Conspix** (comedie B2C a
  rentabiliser) — le protocole de declaration provenance/verification/alignement reste obligatoire pour tout service externe.
- **Hebergement : KVM2 Hostinger `187.77.144.220`** (decision Naim 23/09 ; remplace la Dedibox) — serveur PARTAGE,
  route par Traefik (jamais nginx/certbot systeme), qui doit rester LEGER (place pour un LLM puissant tuveuxun puis
  Lcoalhost). Deploiement : double-clic `deploy-kvm2.bat`, guide `deploy/DEPLOY.md`. Pas OVH.
- Ton : humour 90's (compteur de visites, ticker, texte mono). Design : 2030, blanc, 3D propre, pixel art par zones. **Pas cyberpunk.**
- Archi calquee sur ref.land (Express+Prisma), shonen.industries (reactions), Zarmazon (front vanilla+Vite, `start.bat`).
- **Hero (revu 22/09 x3)** : banniere image plein-largeur, **333px de haut fixe** (`--banner-h`, 240px sous 560px),
  fond = **une seule image** `frontend/public/img/banner-coal.webp` (2160×333, fournie par Naim ; remplace le
  triptyque de 3 JPEG du premier jet ; les 3 JPEG d'origine renommes `antenna.jpg`/`pixel-plant.jpg`/`plant.jpg`
  ne sont **plus utilises nulle part**, reserves par Naim a de futurs fonds de composants — n'y toucher que s'il
  precise ou). Remplace l'ancien hero pixel art anime (`frontend/src/hero.js`, **garde mais inutilise**, non
  importe donc non bundle — a supprimer si Naim confirme ne plus vouloir y revenir).
  **Judgment call non confirme** : la banniere n'est plus sticky (elle scrolle avec la page) → nav/compteur/Classeur
  ne restent plus visibles apres le hero, contrairement a l'ancienne barre du haut.
- **Titre de banniere aleatoire** : 6 variantes `frontend/public/img/lcoal{1..6}.webp` (2160×333, alpha, meme calque
  texte "LCOALHOST:" dans 6 styles), une tiree au hasard a `Math.random()` a CHAQUE chargement de page (`main.js`),
  posee `top:0; left:0` (`.banner-title-link` + `.banner-title`). **C'est le lien d'accueil** (`<a>` autour de
  l'`<img>`, plus de texte "lcoalhost" separe). Verifie en navigateur reel : rechargements -> variantes differentes,
  aucun debordement mobile 375px.
- **Nav SANS pilule** (correction Naim "0 pilule je n'en veux pas", la premiere version en nuages blancs flottants
  chevauchait le titre) : `.cloud` entierement retire du CSS. Compteur = texte plein + ombre portee, lisible sur
  l'image. Classeur = `.btn` standard du site (meme style que partout ailleurs). Nav groupee `top:16px; right:16px`,
  le coin haut-gauche appartient entierement au titre aleatoire.
- Les 3 JPEG d'origine, renommes `antenna.jpg` / `pixel-plant.jpg` / `plant.jpg`, **ne sont plus utilises nulle part**
  (Naim : reserves a de futurs fonds de composants, "pour l'instant aucun" — ne rien y brancher sans qu'il precise ou).
- **Hacks (22/09)** : brique payante, recettes dev/design (1 = 4,44 €, pack de 3 = 8,88 €), onglet dedie. Moteur
  Stripe copie de `.claude/skills/multi-payment-rails` (compte SASU TabascoCity, PAS ENCORE LIVE). Detail complet,
  ce qui est prouve et ce qui ne l'est pas : **`PAIEMENTS.md`**.
- **TikTok/Instagram — veille (22/09, voir §"Veille TikTok/Instagram" plus bas pour le detail complet)** : aside
  "shorts" a partir de 1240px de large, bloc empile en dessous. **Aucune automatisation connectee a un compte** —
  clips ajoutes a la main (`tiktok:add`, une URL) ou en lot (`watch:import`, veille manuelle) via l'oEmbed OFFICIEL
  des deux plateformes (gratuit, tokenless depuis juin 2026 pour Instagram aussi). 26 topics dans
  `backend/src/tiktok/topics.ts` (liste de Naim, 2 fautes de frappe normalisees : videcode->vibecode, browzer->browser).
- **i18n : EN de base, FR secondaire (decision Naim 22/09, remplace la regle "FR uniquement" du 20/09)**. Ce n'est
  PAS une simple traduction : le CHOIX DE LANGUE CHANGE AUSSI LE CONTENU, pas que l'UI. Detail complet et limites
  connues (workflow d'edition des textes, prompt IA, contenu FR "plus riche") : voir §"Langue" plus bas.
- **Add Coal (22/09)** : nouvel onglet, soumission visiteur (1/jour) — lien TikTok, lien d'article, OU image.
  Filtre IA local (Ollama, `backend/src/coal/classify.ts`) trie ce qui n'a aucun angle tech AVANT que Naim ne voie
  quoi que ce soit (`status:REJECTED_AI`, jamais montre) ; ce qui passe va en `PENDING_REVIEW`, relu a la main
  (`npm run coal:review` / `coal:approve -- <id>` / `coal:reject -- <id>`, meme discipline que l'agent memes —
  **aucune publication automatique**). "Connecte depuis TabascoCity" = champ email TC **auto-declare, PAS une
  vraie authentification** (verifier un compte TC reel demanderait un endpoint cote backend TabascoCity, hors
  perimetre Lcoalhost — a construire seulement si Naim le demande explicitement). Approbation : TIKTOK cree un
  `TiktokClip` (meme oEmbed officiel que `tiktok:add`), ARTICLE cree un `Item` (kind ARTICLE, storage LINK),
  IMAGE copie le fichier dans `backend/data/mirror/` et cree un `Item` (kind MEME, **`reusable:false` fixe** —
  droits d'image non verifies, jamais propose au telechargement). **Prouve reellement le 22/09** : soumission
  ARTICLE acceptee par l'IA -> review -> approve -> visible via `/api/items` ; soumission hors-sujet (recette de
  cuisine) rejetee automatiquement ; quota 1/jour bloque bien une 2e soumission (429) ; soumission IMAGE (upload
  multer -> fichier sur disque -> approve -> copie dans le mirror -> visible avec `mediaUrl` correct). Seul le
  chemin TIKTOK n'a pas ete reteste avec une vraie URL ce jour-la (le code reutilise tel quel le meme oEmbed que
  `tiktok:add`, deja prouve le 22/09 plus tot).
- **Themes jour/nuit/acier (22/09, precise en 2e passe apres test local de Naim)** : bouton `#theme-switch` dans
  la banniere (a cote de FR/EN), cycle blanc -> nuit -> acier -> blanc, persistance `localStorage lh_theme`.
  **Pas de detection systeme** (`prefers-color-scheme` volontairement ignore, demande explicite Naim) : le blanc
  reste le defaut tant que le visiteur n'a rien choisi.
  Implementation = uniquement des variables CSS (`:root[data-theme="night"|"steel"]` dans `style.css`) : quasi
  tout le site (cartes, boutons, chips, onglets) est deja construit sur des `var(--ink)/--paper/--bg/...`, donc
  changer les valeurs re-theme l'ensemble sans toucher au HTML/JS des composants. Bug reel trouve en re-theming :
  plusieurs blocs "pleins" (onglet actif, chip.on, hbar, popup classeur) codaient en dur `color:#fff` sur un fond
  `var(--ink)` — cassait des que `--ink` devenait clair en theme sombre (texte blanc sur fond clair). Corrige par
  une nouvelle variable `--ink-contrast` (blanc en theme clair, sombre en theme nuit/acier).
  **Placement exact des textures (precise par Naim apres test local)** :
  - **Banniere** : acier = **identique au mode blanc** (`banner-coal.webp`, herite du `:root` de base, aucune
    surcharge steel) ; nuit = `banner-night.webp` (image dediee, PAS `nightmode.jpg`).
  - **Fond de page plein-ecran** (`<body>`, nouvelle variable `--bg-img`, `background-size:100% auto;
    background-repeat:repeat-y;` — largeur 100 %, hauteur auto pour ne jamais deformer, repete verticalement
    tant que la page est longue) : nuit = `nightmode.jpg`, acier = `steel3.jpg`.
  - **Cartes du milieu** (`.card` + `.hcard`, feed + Hacks — **PAS** `.plant-card` "la centrale" ni `.five`
    "survie 2%", exclues explicitement) : texture alternee sur 3 variantes cyclees par position dans la grille
    (`:nth-child(3n+1/2/3)`, `background-blend-mode:multiply` sur `--paper`) : nuit =
    `pixel-plant.jpg`/`pixel-plant-night.webp`/`night-bottom-components.jpg` ; acier =
    `steel.jpg`/`steel2.jpg`/`steel4.webp`. Les 3 fichiers `steel*` etaient ambigus au 1er jet (pas de convention
    de nommage) — ce placement a ete choisi puis confirme par Naim en 2e passe.
  - **Pied de page** : nuit = `night-bottom-components.jpg`, acier = `steel-bottom-components.png` (inchange
    depuis le 1er jet).
  **Limite connue, non corrigee** : le modele 3D (`plant3d.js`, three.js) garde ses couleurs de materiaux fixes
  (blanc) dans tous les themes — seul le fond CSS derriere le canvas s'adapte.
  Prouve reellement en navigateur integre (capture des 3 themes, alternance des cartes confirmee par JS,
  exclusion centrale/edito confirmee, contraste verifie visuellement).
- **Bouton "remonter en haut" (22/09)** : `#to-top`, fixe en bas a droite, apparait apres ~480px de scroll
  (`window.scrollY < 480` -> `hidden`), scroll fluide vers `top:0`. Independant du theme (styles via
  `var(--ink)`/`var(--ink-contrast)`, s'adapte tout seul).
- **Bandeau ticker retheme + steel renomme "Urbex" + fond du jour (22/09, 3e passe)** :
  - Bandeau blanc = inchange (creme, texte fonce).
  - Bandeau nuit = **"en negatif"** : fond noir (`--ticker-bg:#000`), texte alterne bleu/violet par `<span>`
    (`:nth-child(odd/even)` sur `.ticker-in span`, `#7c9fff`/`#c58bff`).
  - Bandeau steel/urbex = texte blanc sur la photo **`night-bottom-components.jpg`** (reprise volontaire du meme
    asset que le pied de page nuit, demande explicite Naim — pas une erreur de copier-coller).
  - **Le theme "steel" s'affiche desormais "Urbex"** (meme mot FR et EN, `i18n.js` cle `theme.steel`). **L'id
    interne reste `steel`** (assets `steel*.jpg/webp`, `data-theme="steel"`, `localStorage lh_theme`) — seul le
    libelle visible change, volontairement, pour ne pas renommer tous les fichiers/CSS vars pour un cosmetique.
  - **Fond du mode blanc** : `--bg` passe de `#f7f6f2` a `#cfdece` (vert sauge pale), **puis corrige en 4e passe**
    en `#f7ece0` (blanc pastel plus chaud, vers l'orange — retour Naim : trop vert).
  - **Bug de workflow repere en passant** : Naim avait modifie le tagline hero directement dans `index.html`
    ("84% vibecod..."), mais ce texte est ecrase au chargement par `i18n.js` (`data-i18n`) — son edit HTML
    n'avait aucun effet visible. Synchronise `hero.tag2` (EN) dans `i18n.js` avec son edit. Rappel du meme
    piege deja documente plus haut dans ce fichier (§"Langue" -> "Workflow d'edition change").
  - Verifie reellement en navigateur (les 3 themes, cycle du bouton, libelle "Urbex" en FR et EN).
- **4e passe (22/09, retours apres observation locale de Naim)** :
  - **Panneaux langue/theme (`#lang-switch`/`#theme-switch`) affichent l'etat COURANT**, plus la cible du
    prochain clic (comportement invers ; le tooltip `title` garde "switch to X" pour dire ce qui se passera).
  - **Rectangle plein retheme** (`--panel-bg`/`--panel-color`, 3 valeurs : blanc pastel/bleu marine fonce/gris),
    **police `Industrial Poison`** (`@font-face`, fichier `frontend/public/fonts/Industrial-Poison.ttf` depose
    par Naim, jamais utilise avant).
  - **Bandeau urbex : pointilles retires** (`:root[data-theme="steel"] .ticker { border-block:0; }`).
  - **Fond de page (nuit/acier) trop lumineux** : calque `--bg` a 30 % pose sur la photo (`linear-gradient(rgba(...,.3),rgba(...,.3)), url(...)`)
    directement dans la valeur de `--bg-img` — equivalent visuel a afficher la photo a ~70 % d'opacite, sans
    toucher `opacity` sur `<body>` (qui aurait fait disparaitre TOUT le contenu, pas que le fond).
  - **Bug reel (2 iterations) sur la texture des cartes "toujours pas de background"** : `multiply` ecrasait vers
    le noir (invisible) ; passer a `screen` la rendait visible mais **illisible sous le texte des memes-texte**
    (`.txtmeme` affichait la photo en pleine intensite derriere un gros titre en gras). Fix final : la texture
    est posee sur un **`::before` separe a `opacity` fixe** (pas un blend-mode sur le fond direct) — `.card`/
    `.hcard` gardent une surface `--paper` pleine et lisible, le `::before` (z-index 0, enfants remontes en
    z-index 1) affiche la photo derriere a 0.42 d'opacite. `.txtmeme` reprend une surface `--paper` PLEINE (pas
    de photo directement derriere le gros texte) : la texture reste visible dans `.card-body`/`.actions`, ce qui
    est deja tres majoritairement suffisant vu la faible hauteur du reste de la carte. Opacite ajustee de 0.3 a
    0.42 apres verification (les photos nuit, plus sombres que celles d'urbex, avaient besoin de plus de poids
    pour rester visibles sur la fine bande de `.card-body`).
  - Verifie reellement (JS `getComputedStyle` + captures ecran) : police chargee (`document.fonts`), panneaux
    identiques entre eux (couleur/police), bandeau urbex sans bordure, cartes texturees lisibles en nuit ET
    urbex, `.plant-card`/`.five` toujours exclues.

## Langue (EN base / FR secondaire / ES tertiaire, 22/09/2026)

**Ce n'est pas de la traduction 1:1.** Decision Naim : EN = base, priorise l'humour US (sources americaines,
`rss-us`) ; FR = secondaire ET **plus riche** — recoit a la fois les memes maison 100% FR de Naim (FR exclusif,
jamais montres en mode EN) ET des adaptations FR creatives ("version drole", pas une traduction litterale) des
memes EN generes par l'agent.

**ES (4e passe, 22/09)** : chrome complet traduit + adapte ("vannes latina sur le dev", pas une traduction plate),
cycle `#lang-switch` desormais EN -> FR -> ES -> EN (`LANGS` dans `i18n.js`). **ES = UI uniquement pour l'instant** :
pas de memes maison en espagnol (contrairement au FR) — `contentLang()` (nouvelle fonction, `i18n.js`) retombe sur
`'en'` pour la requete `/api/items?lang=` quand l'UI est en ES, pour ne jamais afficher un flux vide. A construire
si Naim veut des memes ES exclusifs plus tard (meme modele que FR).

- **UI (chrome)** : `frontend/src/i18n.js` (dictionnaires EN/FR + `t()` + `applyStaticI18n()`), bouton `#lang-switch`
  dans la navbar, persistance `localStorage lh_lang` (EN par defaut). `data-i18n`/`data-i18n-html`/`data-i18n-aria`
  dans `index.html`.
- **Contenu** : `Item.lang` ('en'/'fr', Prisma). **Seul le kind MEME est filtre strictement par langue** (route
  `/api/items?lang=`) ; ARTICLE/VIDEO restent montres quelle que soit la langue de l'UI (un titre HN en anglais
  est normal a lire meme en mode FR — choix delibere, pas une omission).
- **Scraping** : toutes les sources connectees (HN/DEV/Lobsters/Lemmy/PeerTube/RSS/Reddit) sont anglophones ->
  `lang:'en'` fixe dans `run.ts`. Nouvelle source **`rss-us`** (TechCrunch/Verge/ArsTechnica/Wired) ajoutee le 22/09
  pour le cote "particulierement americain" demande.
- **Agent memes bilingue** (`meme-writer.ts`) : genere un meme EN (inspire en priorite de `rss-us`), PUIS une
  adaptation FR via un 2e appel Ollama (prompt different, explicitement "PAS une traduction litterale"). Les deux
  vont en HIDDEN, revus separement (`agent:review` affiche `[lang/topic]`).
- **⚠️ Workflow d'edition change** : avant, Naim editait les textes (tagline, section 5%...) directement dans
  `index.html`. Maintenant ces textes vivent dans `i18n.js` (cles `hero.tag2`, `five.bodyHtml`...) — editer
  `index.html` ne fait plus rien pour ce texte-la. Ses dernieres versions FR (tagline "84%/13%/2%", paragraphe
  "zone de tir a balles non reelles...") ont ete recuperees telles quelles dans le dict FR ; **l'equivalent EN a
  ete ecrit par Claude en traduction creative, pas verifie par Naim**.
- **Bug reel trouve et corrige (22/09)** : les 8 memes maison, crees AVANT l'ajout du champ `lang`, sont restes
  sur le defaut `'en'` malgre `seed.ts` (upsert `update:{}` ne les retouchait jamais) — corrige par un backfill
  ponctuel + `seed.ts` reaffirme desormais `lang:'fr'` sur `update` (jamais le texte, juste ce champ technique).
- **Moderation du contenu de l'agent = Naim uniquement** (tranche le 22/09) : aucune contrainte de contenu dans
  le prompt au-dela de "c'est une blague, pas une affirmation de fait technique". La seule barriere avant mise en
  ligne est la relecture humaine (`status:HIDDEN`, `agent:review`/`agent:publish`/`agent:reject`) — Naim decide
  seul de ce qui est publiable, ce n'est pas au code d'en decider a sa place.

## Veille TikTok/Instagram (22/09, 5e passe)

Naim voulait automatiser la decouverte TikTok par mots-cles (vibecode, hacking, robotique...) en connectant un
agent a son compte TikTok. **Refuse** : c'est le seul endroit du repo ou l'automatisation d'un compte perso a deja
ete tranchee (`agents/harvester/enrichers/linkedin_manual.py` : *"Pas d'automation via cookies (trop risque de
ban)"*, Naim lui-meme) — meme raisonnement applique ici, TikTok/Instagram ont une detection anti-bot au moins
aussi agressive. Aucune brique Playwright/Puppeteer/Selenium n'existe nulle part dans `agents/` de toute facon.

**Solution retenue : meme pattern que LinkedIn (veille manuelle + extraction automatique), pas d'automatisation
de compte.** Naim scrolle normalement (ou partage depuis un futur compte TikTok "lcoalhost" dedie — a creer
par Naim lui-meme, la creation de compte n'est pas quelque chose que je fais), colle les URLs dans
`backend/data/watch-inbox.txt` (une par ligne, note optionnelle apres un espace), puis `npm run watch:import`
(`backend/src/watch/import-dump.ts`) :
- Detecte la plateforme (tiktok.com vs instagram.com/instagr.am), extrait l'id (regex sur l'URL, ou sur
  `data-video-id` dans le HTML oEmbed en repli pour les liens courts type `vm.tiktok.com`).
- Recupere le contenu via l'oEmbed OFFICIEL des deux plateformes — **gratuit et SANS CLE pour Instagram aussi**
  depuis le **15 juin 2026** (Meta a annule sa restriction de 2020, `graph.facebook.com/v25.0/instagram_oembed`
  fonctionne sans token ; verifie reellement avec une vraie requete HTTP le 22/09, pas suppose).
- Classe le sujet automatiquement (`scraper/topics.ts` + mapping `SCRAPER_TO_TIKTOK_TOPIC`, partage avec
  `coal/approve.ts`), publie direct (`status:PUBLISHED` — la curation, c'est le geste de Naim qui colle l'URL,
  pas une IA qui filtre).
- Les lignes en echec restent dans le fichier avec le motif en commentaire ; les lignes reussies disparaissent.
- Modele `TiktokClip` etendu : `platform` (`ClipPlatform` enum TIKTOK/INSTAGRAM, cle unique `[platform,videoId]`
  desormais), `note` (annotation libre de Naim). Le nom du modele reste `TiktokClip` malgre le multi-plateforme
  (renommer aurait touche trop de fichiers pour un cosmetique).
- **Prouve reellement** : import d'une vraie URL TikTok + une vraie URL Instagram + une URL invalide (rapport
  d'echec correct), les 2 clips valides visibles via `/api/tiktok` avec le bon embed HTML, puis nettoyes.

## Asides droite : "shorts" + pub (22/09, 5e passe)

- **Aside "shorts"** (`#watch-aside`, ex-`.tiktok-rail`) : redesigne en lecteur vertical avec `scroll-snap-type:y
  proximity` sur les clips TikTok/Instagram de la veille ci-dessus (meme donnees, presentation remaniee).
  **Repliable** (`#watch-collapse`) : retrecit sa colonne de grille via la variable CSS `--watch-w` (`minmax(260px,
  320px)` <-> `56px`), pas juste `display:none` sur le contenu.
- **Aside pub** (`#pub-aside`) : **meme principe exact que `softwares/studio-ai` et
  `sites/tabascocity/megastudio`** (verifie dans leur code avant de reproduire, pas suppose) — 2 jeux de 5
  pastilles rondes 70px, un jeu tire au hasard **une fois au chargement** (`Math.random()<0.2`, PAS un carrousel
  qui tourne), memes visuels et memes taglines que la source (copies depuis `softwares/studio-ai/frontend/public/
  pubs/` vers `frontend/public/pubs/`). **`href="#"` partout** : c'est l'etat de la source aussi
  ("href=\"#\" tant que Naim n'a pas fourni les URLs", commentaire d'origine) — pas une omission, Naim doit
  fournir les vraies URLs quand il les a, la meme chose reste a faire cote studio-ai/MegaStudio.
- **Disposition (revue en 6e passe)** : 3 colonnes de GRILLE (plante / flux / shorts) a partir de 1240px de
  large. `#pub-aside` et le nouvel `#ads-aside` (voir §"Mode admin + placement pub" plus bas) ne sont PLUS des
  colonnes de grille : `position:fixed` colles a l'ecran (`right:10px`/`left:10px`), affiches seulement a partir
  de 1700px de large (sinon ils chevaucheraient le contenu, pas assez de marge). En dessous de 1240px, l'aside
  shorts passe en pleine largeur sous les 2 premieres colonnes.
- **Responsive mobile (<980px, demande precise de Naim)** : pub/ads-aside deja masques par defaut (CSS, en
  dessous de 1700px) ; aside shorts **en premier**, juste apres la banniere+ticker (`order:1` en CSS grid, DOM
  inchange) ; **bascule "Videos / Le reste"** (`#watch-toggle`) juste en dessous — 2 boutons qui scrollent vers
  l'aside shorts ou vers le flux principal (pas 2 conteneurs de scroll separes, plus simple et plus robuste
  qu'un vrai double-scroll).
- **Verifie reellement** en navigateur (desktop 1400px large : 3 colonnes + repli shorts confirme par
  `getComputedStyle` ; mobile 375px : ordre shorts-en-premier confirme, bascule "Le reste" confirmee scroller
  vers le flux).

## Mode admin + placement pub/ads (22/09, 6e passe)

- **`banner-urbex.webp`** : asset dedie depose par Naim, remplace le choix precedent ("meme banniere que le
  blanc") pour le theme urbex — `--banner-img` surcharge dans `:root[data-theme="steel"]`.
- **Mode admin** (`backend/src/admin/routes.ts`) : supprimer un meme/video/article DEPUIS LE FEED. **PAS un
  compte** — un secret partage (`ADMIN_TOKEN` en `.env`, vide par defaut = routes toujours refusees 403, aucun
  risque tant que Naim n'a rien configure). Token deja genere en dev, voir `.env`. Active cote visiteur via
  `?admin=<token>` une fois dans l'URL du site (`frontend/src/admin.js` : capture + nettoie l'URL, garde en
  `localStorage lh_admin_token`), verifie a chaque chargement (`GET /api/admin/whoami`). Suppression reelle
  (`DELETE /api/admin/items/:id`, `prisma.item.delete` + nettoyage du fichier MIRROR associe s'il existe) —
  verifiee constant-time (`crypto.timingSafeEqual`) + rate-limitee (30/min) contre le bruteforce. **Portee
  volontairement etroite** : seulement `Item` (memes/videos/articles), pas `TiktokClip`/`Hack`/`CoalSubmission` —
  Naim n'a demande que le feed. Prouve reellement : item de test cree, supprime via l'API avec le vrai token
  (204, disparu en base), acces refuse confirme sans token ET avec un mauvais token (403 les deux fois).
- **Pub/ads-aside repositionnes** : `#pub-aside` colle a droite `right:10px` **quelle que soit la largeur
  d'ecran** (retour Naim : les 4 colonnes de grille du 5e jet ne donnaient pas cet effet). Nouveau `#ads-aside`
  (marge gauche, ~15vw) : pile de rectangles gris opacite 0.4 "Your ad here" (`display:flex` empiles en flux
  normal), purement decoratif, meme mecanique `right`/`left`.
- **"Blocage" en bas de scroll** (`frontend/src/scroll-anchor.js`, nouveau module) : les deux asides restent
  `position:fixed` jusqu'a un seuil de scroll, puis se figent en `position:absolute` 20px sous le bas de l'edito
  "2%" au lieu de suivre indefiniment. **Bug reel trouve et corrige en le construisant** : la 1ere version
  mesurait le seuil via `referenceEl.getBoundingClientRect().bottom + window.scrollY` — mais `.five` (l'edito)
  vit dans `.plant-col` qui est LUI-MEME `position:sticky`, donc son `getBoundingClientRect()` change avec le
  scroll (c'est le principe du sticky) : la formule grandissait sans fin au lieu de donner une position de page
  stable, et l'aside restait `fixed` pour toujours. Corrige en mesurant via `offsetTop`/`offsetParent` (position
  NATURELLE, non affectee par le sticky), calcule une fois au chargement/redimensionnement, pas a chaque scroll.
  Prouve reellement : `position` bascule `fixed`->`absolute` au bon endroit en scrollant, et revient a `fixed`
  en remontant (verifie par `getComputedStyle` a plusieurs positions de scroll, pas juste visuellement).
- **2e bug reel, trouve par Naim via capture d'ecran (22/09, apres coup)** : les asides etant `position:fixed`
  des le chargement (`top:68px`), ils chevauchaient la banniere (333px de haut) et le ticker AVANT le moindre
  scroll — visible sur une vraie capture desktop large envoyee par Naim. Corrige en ajoutant une **3e zone** a
  `scroll-anchor.js` : `position:absolute` a la position naturelle sous le ticker (`startEl`) tant qu'on n'a pas
  encore scrolle assez, PUIS `fixed`, PUIS `absolute` figee (comportement inchange). Meme technique
  `offsetTop`/`offsetParent` pour la borne du haut. Prouve reellement : a `scrollY:0`, plus aucun chevauchement
  (banniere finit a 333px, aside demarre a 380px, verifie par `getComputedStyle`+`getBoundingClientRect`), la
  zone `fixed` intermediaire et la zone `absolute` figee en bas fonctionnent toujours comme avant.

## Bureau d'embauche (22/09, 7e passe) — mode admin "habille"

- **Cadrage tranche par Naim** : "habillage leger" confirme — PAS de vrais comptes (pas de systeme style
  ref.land avec email/JWT). Recherche faite avant de construire (`sites/ref-land/` : vrais comptes magic-link +
  `RefLike` pivot + `User.isAdmin` booleen) — le pattern existe mais n'est PAS repris tel quel ici, seulement
  l'idee de "role simple". Le bouton "Embauche" lui-meme n'existait nulle part ailleurs dans l'ecosysteme
  (verifie par recherche texte) : invente ici pour Lcoalhost, pas copie.
- **`#embauche-btn`** (rouge, navbar) -> modal (`frontend/src/embauche.js`) : choix **Ouvrier** (purement
  decoratif — aucun compte cree, le cookie visiteur anonyme existant suffit, message flavor puis fermeture) ou
  **Contremaitre** (= Naim, champ mot de passe). Le mot de passe soumis EST directement le token admin —
  reutilise a 100% le mecanisme deja construit (`admin.js` : nouvelle fonction `loginWithToken()`), zero nouvelle
  route backend. En reussite : meme etat que `?admin=<token>` (badge ADMIN, boutons supprimer sur les cartes).
- **`ADMIN_TOKEN=123456`** en DEV LOCAL (demande explicite Naim, facile a taper en testant). **Garde-fou ajoute**
  dans `config.ts` : le backend **refuse de demarrer** si `NODE_ENV=production` ET que `ADMIN_TOKEN` vaut
  "123456"/"admin"/"password"/"changeme" — impossible d'oublier ce token faible en prod par erreur.
- **Reactions/"likes" = cookie visiteur anonyme (`lh_vid`), PAS l'IP** (clarifie apres une question de Naim sur
  le "comptage par IP") : le modele `Reaction` existant utilise deja `visitorId` (cookie), pas l'adresse IP —
  volontairement, car l'IP a de vrais defauts pour cet usage (plusieurs visiteurs derriere la meme IP/NAT
  collisionneraient, VPN/4G changent d'IP en cours de session). Le cookie fait deja ce que "compte par IP"
  visait (anonyme, pas de vrai compte) en evitant ces problemes — **rien change ici**, juste documente pour que
  ce ne soit pas re-suppose plus tard.
- **Titres de banniere en 2 dossiers exclusifs + reroll au changement de theme** : Naim a range
  `frontend/public/img/lcoal{n}.webp` en 3 groupes — racine = valables pour TOUS les themes
  (`lcoal1/3/4/5/6/9.webp`), `img/night/` = EXCLUSIFS nuit (`lcoal8/14.webp`), `img/urbex/` = EXCLUSIFS urbex
  (`lcoal2/7/10/12/13/15.webp`). `main.js` : `pickBannerTitle()` construit le pool (racine + dossier du theme
  courant) et tire au hasard — appelee au chargement ET a chaque clic sur `#theme-switch` (pas juste au premier
  chargement de page comme avant). Prouve reellement : 15 clics de bascule de theme en boucle, verifie que le
  fichier tire correspond toujours au bon pool selon le theme courant (`getComputedStyle`/`.src`, pas visuel).
- **Verifie reellement, bout en bout** : bouton Embauche -> modal -> Ouvrier (message flavor, fermeture) ;
  Contremaitre -> mot de passe "123456" -> badge ADMIN affiche + boutons supprimer apparus sans recharger la
  page ; mauvais mot de passe -> message d'erreur, mode admin reste inactif.
- **Bug reel trouve sur retour Naim (22/09, apres coup)** : "`#embauche-btn` doit rester rouge/texte blanc/sans
  contour quel que soit le theme" — ne l'etait pas. Cause : specificite CSS. `.embauche-btn` (seule, sans `.btn`)
  est definie AVANT `.btn` dans `style.css` ; meme specificite (une classe chacune) -> **l'ordre dans le fichier
  tranche**, et `.btn` (plus loin, donc "dernier mot") regagnait silencieusement `border`/`box-shadow`/`color`
  via ses valeurs `var(--ink)` (qui changent par theme). Corrige en `.btn.embauche-btn` (selecteur compose,
  specificite plus haute, gagne peu importe l'ordre). **Meme bug trouve et corrige sur `.admin-del`** (meme
  pattern, ajoutee au meme moment) — verifie que c'etait le seul autre cas dans le fichier. Prouve reellement :
  `getComputedStyle` sur les 3 themes, `border`/`box-shadow` bien neutralises partout ; `#shelf-btn` (Classeur,
  intentionnellement laisse theme-adaptatif) verifie inchange.
- **Bug reel : titres de banniere parfois absents (22/09, signale par Naim avec capture)**. Cause : Naim a
  continue d'ajouter/retirer des fichiers `public/img/{,night/,urbex/}lcoal*.webp` APRES que j'ai code les 3
  listes en dur dans `main.js` — `lcoal9.webp` et `urbex/lcoal13.webp` supprimes, `night/lcoal16.webp` et une
  nouvelle version racine de `lcoal2.webp` ajoutes, mais le JS pointait toujours vers l'ancien etat -> 404
  silencieux sur les entrees perimees, donc parfois aucune image ne s'affiche. **Corrige a la racine, pas juste
  resynchronise** : nouveau `frontend/scripts/gen-banner-titles.js` (Node, `fs.readdirSync` sur les 3 dossiers,
  filtre `lcoal\d+\.webp`) genere `frontend/src/banner-titles.generated.js` — lance automatiquement avant
  `npm run dev`/`build` (`predev`/`prebuild` dans `package.json`, script manuel `npm run banner-titles` aussi
  dispo). `main.js` importe ce fichier genere au lieu de tableaux ecrits a la main : **la liste ne peut plus se
  perimer**, elle refletera toujours le contenu reel de `public/img/` a chaque demarrage. Prouve reellement :
  chaque chemin des 3 pools (14 fichiers au 22/09) fetch avec un vrai `fetch()`, 0 echec (avant le fix, 2
  auraient echoue) ; `naturalWidth` de l'image affichee confirme un vrai chargement, pas un `src` casse.
- **Espace blanc sous certaines cartes memes (22/09, capture Naim) : PAS un bug, confirme par inspection DOM.**
  Naim demandait de verifier s'il s'agissait d'un probleme de connexion/recuperation d'image. Carte inspectee :
  `class="card k-meme"`, contient `.txtmeme` (pas `.media`) — c'est le design carre existant (`aspect-ratio:1`,
  `justify-content:space-between`) pour les memes texte-seul (sans image), pas un chargement rate. L'espace vide
  apparait quand la legende est courte : comportement voulu du composant, rien a corriger ici.
- **Fond "day-bg" (22/09, 8e passe)** : theme jour uniquement, `frontend/src/day-bg.js` empile les images
  de `public/img/day-bg/ground{N}.{ext}` en boucle infinie (index % longueur, repart a `ground0` apres
  `ground10`), chaque segment = 300vh, a partir de 300vh de scroll (le premier ecran reste sans ce fond).
  Opacite fixe **0.5** (montee depuis 0.3 sur retour Naim, meme session). Liste generee par `scripts/gen-day-bg.js` (meme pattern anti-perimption que
  `banner-titles.generated.js`, tri **numerique** pas alphabetique pour ne pas classer `ground10` avant
  `ground2`), lance auto via `predev`/`prebuild`. Se detruit/reconstruit proprement a chaque bascule de
  theme (nouvel evenement `lh:theme` ajoute dans `theme.js`, meme pattern que `lh:lang`).
  **Piege reel evite pendant la construction** (pas juste theorique) : mesurer
  `document.documentElement.scrollHeight` pour savoir combien de segments ajouter boucle sur lui-meme —
  notre propre calque (`position:absolute`) agrandit ce `scrollHeight` des qu'on lui ajoute une image,
  ce qui ferait grossir la cible a l'infini. Mesure a la place le bas REEL du pied de page (`offsetTop` en
  remontant les `offsetParent`, meme technique que `naturalBottom()` dans `scroll-anchor.js`), qui ne bouge
  jamais a cause de ce calque puisque `position:absolute` sort du flux normal. Un `MutationObserver` sur
  `#feed` recalcule quand le contenu grandit (ex. "Charger la suite"). Prouve reellement : 4 segments
  stables apres plusieurs `resize`/`scroll` repetes (pas de croissance infinie) ; viewport reduit a 180px
  de haut -> 26 segments, ordre confirme `ground0..ground10, ground0..ground10, ground0..` (boucle
  verifiee) ; bascule blanc->nuit->urbex->blanc : calque detruit puis reconstruit correctement a chaque
  fois ; visible a l'oeil en scrollant (texture en transparence entre les cartes).
- **Le pied de page est la vraie limite du day-bg** (retour Naim, meme session) : formule resserree
  (`Math.ceil((footerBottom - vh) / vh)`, sans marge de +1 segment) pour que le dernier segment s'arrete
  au plus tot une fois le bas du footer atteint — pas de gaspillage de segments au-dela.
- **Bouton "aller au pied de page" (8e passe)** : triangle ▼ a cote du bouton "remonter en haut" (`#to-footer`,
  meme classe `.to-top`, decale de 50px), tooltip natif via un nouveau support `data-i18n-title` dans
  `applyStaticI18n()` (i18n.js). Visible uniquement tant que le footer n'est pas encore a l'ecran —
  `IntersectionObserver` sur `.foot`, pas un calcul au scroll (plus simple, se recalcule tout seul quand
  le feed grandit). Clic = `footer.scrollIntoView({behavior:'smooth'})`. Prouve reellement en navigateur :
  visible au chargement, clic scrolle bien jusqu'au footer, se cache une fois le footer visible
  (`toFooterHidden:true` verifie par JS apres intersection).
- **Pages legales + liens footer (8e passe)** : 3 pages HTML statiques independantes du SPA (jamais
  passees par le build Vite, servies telles quelles depuis `public/legal/` avec leur propre
  `public/legal/legal.css` — `style.css` est fingerprinte au build et n'existerait plus a ce chemin en
  prod) : `mentions-legales.html`, `cgu.html`, `confidentialite.html`, liees depuis une nouvelle ligne
  `.foot-legal-links` dans le footer. **Identite d'entreprise reprise telle quelle depuis les mentions
  legales deja vetees de tabasco.city** (meme entite juridique, SASU Tabasco City) : SIREN 980 463 798,
  RCS Versailles B 980 463 798, siege 16 chemin du Mesnil 78820 Juziers — **jamais invente**. Hebergement
  ecrit specifiquement pour Lcoalhost (Scaleway SAS / Dedibox, PAS Hetzner comme dans la version TC —
  Hetzner est de toute facon abandonne cote TC, cf. memoire `reference_serveurs_prod`) ; adresse Scaleway
  indiquee de memoire (8 rue de la Ville l'Eveque, 75008 Paris) **a faire confirmer par Naim avant mise en
  ligne reelle**, pas de RCS/SIREN Scaleway invente. CGU/confidentialite adaptees au fonctionnement REEL de
  Lcoalhost (pas de compte, cookie `lh_vid` anonyme, Add Coal, Hacks/Stripe pas encore actif, purge 45 jours
  + nouvelle purge par quota disque). FR uniquement pour l'instant (pas de version EN/ES des pages legales).
  Rejoint l'item deja note au 20/09 ("relecture juridique... avant monetisation") : **a faire relire par
  Naim/un juriste avant mise en ligne**, ce sont des bases serieuses mais pas une validation legale.
- **"Big cleaning" par quota disque (8e passe, demande Naim : "le scrapping remplit tres vite")** :
  nouveaux champs Prisma `Item.fileSize` (octets, capture PENDANT la copie disque dans `mirror.ts` ET
  `coal/approve.ts` — zero cout supplementaire, meme principe que `contentHash`) et `Item.pinned` (admin
  uniquement, protege de la purge). Nouveau `backend/src/storage/budget.ts` : `usageBytes()` (agregat SQL
  `SUM(fileSize)` sur les items `storage=MIRROR`, jamais un scan disque), `bigCleaning()` (tant que
  usage > `STORAGE_BUDGET_MB` (10 Go par defaut), efface le plus ancien item MIRROR non-epingle — fichier
  + ligne DB — et s'arrete proprement si tout ce qui reste est epingle, meme encore au-dessus du quota).
  Tourne a chaque cycle de scrape (`scraper/run.ts`, apres la purge 45-jours existante — les deux sont
  independantes : celle-ci ne touche jamais `storage=MIRROR`). Nouvelles routes admin : `PATCH
  /admin/items/:id/pin` (toggle), `GET /admin/storage` (usage/quota/ratio, **interroge par le front AVANT
  que la purge auto n'efface quoi que ce soit**). Front : bouton 📌 a cote du ✕ existant (meme garde-fou
  isAdmin()), badge d'alerte `#storage-warn` dans la navbar (visible a partir de 90% du quota,
  `STORAGE_WARN_RATIO`), verifie a l'activation admin puis toutes les 5 min. **Prouve reellement, pas
  juste lu** : script jetable avec 3 faux items MIRROR (vieux non-epingle, plus vieux epingle, recent
  non-epingle) et un budget de test a 100 Mo (minimum zod) pour 120 Mo de fichiers factices —
  `bigCleaning()` a bien efface UNIQUEMENT le plus ancien non-epingle (fichier ET ligne DB confirmes
  absents), l'epingle a survecu malgre son age, le recent a survecu car le budget redevenait suffisant
  apres une seule suppression ; script + fichiers de test supprimes apres verification. Toggle pin testé
  en vrai sur un item reel du feed (aller-retour, remis a son etat d'origine).
- **Bug reel confirme et corrige : texture visible sous le pied de page (13e passe, capture Naim)**. Cause
  racine reelle : `day-bg.js` `fill()` ne faisait QUE grandir (`while (children.length < target) append`),
  jamais retrecir. En changeant d'onglet (ex. MEME -> Mon classeur, contenu bien plus court) le pied de page
  remonte, mais les segments deja poses pour l'ancienne page, plus haute, restaient — d'ou la zone texturee
  visible sous le vrai footer. Corrige en ajoutant une boucle symetrique qui retire les segments en trop du
  bas (`l.lastElementChild.remove()`, `nextIndex--` pour garder l'enchainement continu). Prouve reellement :
  bascule MEME (7 segments) -> Mon classeur (2 segments), confirme en JS que ca retrecit vraiment.
  **2e bug trouve en testant celui-ci** (pas signale par Naim, decouvert par accident) : au tout premier appel
  synchrone de `fill()`, `window.innerHeight` peut valoir 0 (viewport pas encore stable) -> le calque ne se
  cree jamais tant qu'aucun scroll/resize reel n'arrive. Filet de securite ajoute : `requestAnimationFrame`
  imbriquee 2x apres l'appel initial (attend que le viewport soit garanti stable, sans dependre d'un scroll
  utilisateur qui pourrait ne jamais survenir sur une page courte).
- **Like/dislike deplaces en overlay + LOL/JERRY retires (13e passe, retours Naim)** : les boutons like/
  dislike (icones `img/like.webp`/`img/dislike.webp`, ajoutees par Naim en cours de session) sont sortis de
  la rangee d'actions et **superposes en bas-droite du visuel de la carte** (image OU txtmeme), empiles
  verticalement, plus gros (44px), tooltip natif (`title`). Nouveau `<div class="media-wrap">` (enfant direct
  de `.card`, herite `position:relative` de la regle `.card > *` deja existante) enveloppe `media(it)` +
  `likeOverlay(it)` — jamais imbrique DANS `.media` (un `<a>`/`<button>`), ce qui aurait ete du HTML invalide
  (bouton dans un lien/bouton) et aurait casse le clic. **Bug reel trouve en testant ce changement** :
  `refreshCard()` ne patchait que `.actions` apres un clic — comme like/dislike n'y sont plus, le clic
  enregistrait bien la reaction cote backend (verifie via l'API) mais l'affichage restait "off" jusqu'au
  prochain chargement complet. Corrige en patchant aussi `.like-overlay` (`outerHTML`) dans `refreshCard()`.
  Prouve reellement : clic LIKE -> `on:true` + badge "1" visible immediatement ; clic DISLIKE juste apres ->
  LIKE repasse `off` en visuel (pas juste en API), exclusion mutuelle confirmee a l'ecran. **LOL et "C'est
  moi" retires de l'UI** (demande Naim) : `REACTION_KEYS` reduit a `['UTILE','ALERTE']` seulement — les
  valeurs restent valides en base (pas de migration destructive pour un simple retrait d'affichage).
- **Tooltips pub x3 langues (13e passe)** : les 10 pastilles pub (`pub.js`) ont chacune un tip par langue
  (en/fr/es) au lieu d'un seul texte FR fixe, affiche selon la langue UI courante (`getLang()`) et mis a jour
  en direct sur `lh:lang` (le jeu de pastilles tire au hasard au chargement NE change PAS au changement de
  langue, seul le texte du tooltip suit). Bug introduit puis corrige dans la foulee : l'objet d'echappement
  HTML `esc()` copie-colle avait perdu le mapping `<` -> `&lt;` (deux fois `'&'` par erreur) — corrige avant
  meme d'etre teste, en relisant le diff. Prouve reellement : bascule FR->ES->EN sur la meme pastille,
  `title` change a chaque fois avec le bon texte.
- **Like/dislike : corrige, PAS en overlay sur l'image (14e passe, 2e retour Naim, mal compris la 1ere fois)**.
  Sortis de `.media`, plus superposes dessus : desormais **en dessous**, dans le flux normal de la carte
  (`.like-row`, enfant direct de `.card` comme `.media`/`.card-body`), aligne a droite, empiles verticalement,
  agrandis a 72px (icone 40px) avec un gap de 14px — "assez grands pour etre mieux compris". Meme bug de
  synchronisation deja corrige une fois (`refreshCard()` doit patcher `.like-row`, pas seulement `.actions`)
  re-verifie apres le renommage `likeOverlay`->`likeRow`. Prouve reellement : clic LIKE -> `on`+badge "1"
  visibles, second clic -> repasse off, capture ecran confirmant le placement sous l'image.
- **8 tickers bilingues/trilingues reutilises (14e passe)** : Naim avait ajoute 8 lignes `ticker.1..8` dans le
  dict EN de `i18n.js` (dont une reordonnee vs les 4 precedentes) mais seuls 4 spans codes en dur dans
  `index.html` les affichaient. `index.html` etend a 8 spans (x2, boucle continue), traduits en FR/ES (les 4
  anciennes traductions realignees sur le nouvel ordre EN + 4 nouvelles ecrites). `.ticker-in` anime
  60s -> 120s (contenu double, meme duree aurait double la vitesse de defilement). Prouve reellement : les 8
  textes confirmes presents en DOM (x2), bascule FR->ES verifiee sur les 4 premiers.
- **Like/dislike : chrome du bouton retire (15e passe, 3e retour Naim)**. Le cercle blanc avec bordure/ombre
  autour d'une petite icone 40px etait juge moche et gaspillait l'espace ("le cercle blanc avec padding,
  pourquoi, c'est moche"). Retire entierement (`background:none; border:0;` sur `.like-btn`) : l'image
  (`like.webp`/`dislike.webp`) occupe desormais 100% du bouton, agrandi a 92px. Etat `.on` = `drop-shadow`
  orange sur l'image (pas un fond) au lieu du cercle colore precedent. **Bug reel trouve et corrige avant
  meme d'etre teste** : premier jet ecrivait `filter: drop-shadow(0 0 0 3px var(--accent))` — syntaxe CSS
  invalide (`drop-shadow()` prend au plus 4 valeurs : X Y blur couleur, jamais de spread comme `box-shadow`)
  qui aurait silencieusement annule tout le filtre. Corrige en `drop-shadow(0 0 6px var(--accent))`. Prouve
  reellement : `getComputedStyle(img).filter` confirme la valeur appliquee apres un clic LIKE reel.
- **Retouches finales carte (16e passe)** : hover like/dislike `scale(1.08)` -> `scale(1.1)`. `.actions`
  (bas de carte : reactions + boutons) passe de `display:grid` (empile) a `display:flex; justify-content:
  space-between` (`rxrow` a gauche, `btnrow` a droite, meme ligne si la carte est assez large, wrap sinon).
  **Hover sur la carte entiere retire** ("inutile", retour Naim) : `.card:hover` (translateY + box-shadow)
  supprime, regle `prefers-reduced-motion` nettoyee en consequence. Prouve reellement : `.rxrow`/`.btnrow`
  confirmes sur la meme ligne a largeur normale (447px de carte) ; `transition-duration:0s` sur `.card`
  confirme qu'aucune animation ne reste.
- **Like/dislike valide par Naim via capture ("c'est ca que je veux")** : compteur deplace du badge-coin vers
  **a cote** de l'icone (`.like-btn` en `display:flex; gap:8px`), **toujours visible y compris a 0** (avant :
  cache si 0). Format compact via `Intl.NumberFormat(getLang(), {notation:'compact', maximumFractionDigits:1})`
  — gere la locale ET l'abreviation sans formateur maison (`1000`->"1 k" FR/ES, "21"->"21", jamais reinventer).
  Tooltip deja present (`title`) confirme suffisant. Prouve reellement : badge "0"->"1" sur clic reel ; formats
  `1000`->"1 k", `3400`->"3,4 k" verifies en direct.
- **Bug reel confirme et corrige : gros vide entre l'image et le texte (17e passe, capture Naim "pas encore")**.
  `.like-row` en pleine largeur sous l'image laissait tout l'espace a gauche des icones inutilise — **mesure
  reellement** : jusqu'a 322px de blanc sur une carte de 447px. Corrige en regroupant `.card-body` et
  `.like-row` dans un nouveau `.lower` (`display:flex; justify-content:space-between`) : le texte (chip/
  titre/meta) remplit maintenant tout l'espace a gauche des icones au lieu de rien. Prouve reellement :
  `sameRow:true` + `gapBetween:4px` confirmes en JS (texte et icones bien cote a cote, plus de bande vide).
- **Audit desktop large + fonctionnalite des 4 boutons du bas (18e passe, retour Naim vif : "c'est vraiment
  laborieux pour du front de base")**.
  - **Vrai bug structurel trouve et corrige** : `.feed` avait `align-items:start` (chaque carte garde sa
    hauteur naturelle) + `.actions` sans ancrage -> sur une meme ligne de grille, des cartes de hauteurs
    differentes (image/txtmeme/titre 1-2 lignes) placent leurs boutons a des niveaux differents = "pas
    alignes". Corrige : retrait de `align-items:start` (stretch par defaut, les cartes d'une ligne s'egalisent
    sur la plus haute) + `.actions{margin-top:auto}` (les boutons se calent tout en bas de la carte, deja
    flex-column). **Prouve reellement sur le VRAI breakpoint desktop 2 colonnes** (990-1240px — au-dessus de
    1240px la mise en page 3 colonnes plante/flux/shorts ne laisse jamais de place a 2 cartes/ligne, verifie
    en mesurant `#feed`/`.centrale` — piege a ne pas refaire) : 5 lignes de cartes testees, `actionsBottom`
    identique dans chaque paire malgre des `mediaHeight` tres differents (ex. 196px vs 376px).
  - `.card-body` gap 6px -> 8px ("aeration pas respectee entre les lignes de texte").
  - **Les 4 boutons (Utile/Alerte, Classer, Telecharger-Source) verifies fonctionnels de bout en bout, pas
    juste lus dans le code** (Naim doutait explicitement) : Classer -> popup dossier -> choix -> `aria-pressed`
    + compteur navbar + apparition reelle dans l'onglet Classeur (`/api/shelf` confirme) -> desarchiver ->
    disparition confirmee, aucun residu DOM. Telecharger (meme maison, PNG genere cote client) -> vrai clic ->
    `downloadCount` incremente cote serveur (1->2, verifie via l'API), confirmant le flux complet (pas
    seulement "aucune erreur", la vraie mutation serveur). **Conclusion : les 4 fonctionnalites sont deja
    abouties** — le probleme signale etait uniquement visuel (alignement/aeration), pas fonctionnel.

## "Le Mouchard" (22/09, 8e chantier) — nouvelle carte 3D avant La Centrale
Idee Naim pour attirer du trafic : une 3e carte 3D, **avant** "La Centrale" (`plant:3000`), qui montre au
visiteur ses propres metadonnees de connexion (IP, ville/pays approximatifs, FAI) — jamais celles des autres,
jamais stockees. Nom retenu : "Le Mouchard" (EN "The Snitch", ES "El Soplón").
- **Backend** : `backend/src/whoami/routes.ts`, `GET /api/whoami`. `req.ip` (trust proxy deja configure) ->
  geolocalisation via **ip-api.com** (gratuit, sans cle, `scraper/http.ts#getJson`, meme pattern que les
  connecteurs). IP privee/locale (dev) detectee et court-circuitee (`local:true`, pas d'appel externe).
  **Rien n'est ecrit en base** — aucun modele Prisma, zero persistance, juste un calcul a la volee a chaque
  requete (promesse tenue au pied de la lettre : "vos donnees, a vous seul, effacees des que vous partez").
  Cache TECHNIQUE en memoire (5 min, meme pattern `setInterval().unref()` que `lib/rate-limit.ts`) pour
  respecter le quota gratuit d'ip-api.com (45 req/min partagees), PAS un stockage de donnees personnelles.
  Rate-limite (`limit('whoami', 20, 60_000)`). Prouve reellement : `curl` local -> `local:true` ; `curl -H
  "X-Forwarded-For: 8.8.8.8"` -> vraie geoloc (`Ashburn, Virginia, Google LLC`) ; 2e appel meme IP -> cache
  (verifie par la vitesse de reponse).
- **Frontend** : `frontend/src/spy3d.js` (tour 3D decorative, meme langage visuel que `plant3d.js` — argile
  blanche + accent orange + phare clignotant — mais SANS raycaster/interaction, juste une antenne qui tourne
  en continu, rien a cliquer). Carte HTML `.spy-card` ajoutee dans `.plant-col`, **avant** `.plant-card`
  existant. HUD texte (IP/Localisation/FAI) + encart de confiance toujours visible sous la maquette. `api.js`
  : `whoami()`. Cablage dans `main.js`, meme pattern lazy-`import()` que `plant3d.js`.
  **Bug reel trouve et corrige en testant** : `.spy-hud > div` en `flex + justify-content:space-between` avec
  `overflow-wrap:anywhere` sur `dd` laissait le navigateur reduire la largeur minimale de `dd` a UN caractere
  (le flex-shrink ecrasait la colonne de valeur) -> "Machine locale (dev)" s'affichait une lettre par ligne.
  Corrige en grid `auto 1fr` (le libelle garde sa largeur naturelle, la valeur prend le reste) + retrait de
  `overflow-wrap:anywhere` (pas besoin, ce sont des mots courts, pas des hash). Prouve reellement : simulation
  DOM d'une vraie geoloc ("Ashburn, United States" / "Google LLC") -> `getClientRects().length === 1` pour
  chaque valeur (une seule ligne), plus de cassure lettre par lettre.
- **Refuse et explicitement signale a Naim** : demande d'utiliser des "outils de pentesting" (mcpmarket.com/
  MCP) pour du "collectage de traces" plus agressif sur l'IP des visiteurs. Ligne tenue : sonder l'appareil/
  reseau d'un visiteur sans son autorisation explicite est une frontiere legale/ethique reelle, la mise en
  scene humoristique du site ne la deplace pas ; installer des serveurs MCP tiers non verifies pour ca ajoute
  un risque de securite disproportionne. Alternative proposee et **acceptee par Naim, construite (20e passe)** :
  champs PASSIFS ajoutes au HUD (resolution ecran, fuseau horaire, langue, OS/navigateur via un mini-parsing
  `navigator.userAgent`, type de connexion via `navigator.connection.effectiveType` si dispo) — zero appel
  reseau, zero tiers, tout vient du navigateur du visiteur sur SA propre requete (exactement ce que n'importe
  quel site voit deja). Prouve reellement : `screen`/`timezone`/`lang`/`system`/`connection` tous peuples et
  affiches sur une seule ligne chacun (`getClientRects().length===1`), verifie en direct (ex. "1707×960",
  "Europe/Paris", "fr", "Chrome · Windows", "4G").
- **Renomme sur retour Naim (20e passe)** : "Le Mouchard" jugé pas drole -> titre affiché devient **"Vos
  métriques de dev pourri"** (EN "Your Crappy Dev Metrics", ES "Tus métricas de dev de mierda"), le mot
  "mouchard" est garde uniquement dans le sous-titre ("Mouchard en live" / "Snitch: Live" / "Soplón en vivo").
  Seules les CHAINES i18n ont change — noms de fichiers/classes/ids internes (`spy3d.js`, `.spy-card`,
  `#spy-stage`, cle i18n `mouchard.*`) inchanges, c'est le nom affiche a l'ecran qui comptait pour Naim, pas
  les identifiants de code.
- **Bug reel signale par Naim et corrige (21e passe)** : "impossible de descendre sur la Centrale et Survie 2%
  si le feed de droite se remplit". Cause reelle mesuree : `.plant-col` (`position:sticky; top:68px`) est
  passee de 2 a 3 cartes avec l'ajout de "Vos metriques de dev pourri" et depasse largement la hauteur du
  viewport (1305px mesures pour 850px de fenetre) — un element sticky plus haut que l'ecran reste coince en
  haut jusqu'a ce que son conteneur (donc TOUT le feed) ait fini de defiler ; le bas de la colonne ne redevient
  atteignable qu'apres avoir scrolle l'intégralité du feed. Corrige : `max-height: calc(300vh - 68px - 16px)`
  + `overflow-y: auto` sur `.plant-col` — la colonne collee devient scrollable EN INTERNE au-dela de l'espace
  ecran disponible, le bas (Centrale, Survie) reste toujours a portee independamment de la longueur du feed.
  **Reinitialise explicitement en mobile** (`max-height:none; overflow-y:visible` dans le media query
  980px, ou `.plant-col` repasse en `position:static`) : sans ca la colonne aurait garde un scroll interne
  parasite sur une mise en page qui n'en a pas besoin. Prouve reellement : `colHeight` mesure 766px (capped)
  vs `scrollHeight` 1305px (contenu complet toujours present) ; `.plant-card`/`.five` confirmes entierement
  visibles apres un scroll interne programmatique jusqu'au bout ; verifie separement en mobile
  (`position:static`, plus de cap ni de scroll interne).
- **3 ajouts au Mouchard (22e passe)** : Naim a re-demande le scan actif des ports du visiteur (option 3
  d'une question de clarification) — **refuse a nouveau, meme reformule/re-propose** : sonder l'appareil d'un
  tiers sans autorisation reste une ligne que je ne franchis pas, independamment du nombre de fois demande.
  Construit a la place, dans le meme HUD :
  1. **"Vos ports"** : lien externe vers canyouseeme.org (le visiteur lance LUI-MEME le check sur sa propre
     machine, zero scan cote serveur).
  2. **"Nos ports ouverts"** : transparence sur notre propre infra, verifie dans `deploy/nginx/
     lcoalhost.lol.conf` (SEUL le port 80 est reellement expose en prod aujourd'hui — pas de 443/TLS
     configure a ce jour, rien invente).
  3. **"Trackers" + micro-modale "details"** : demande Naim d'une "API gratuite de detection tracking" —
     **precision technique donnee** : ca n'existe pas vraiment, c'est intrinsequement cote navigateur.
     Detection reelle et passive : signal `navigator.doNotTrack`/`globalPrivacyControl` (le navigateur les
     envoie deja lui-meme) + une detection de bloqueur de pub par "appat" (element `class="ad-banner..."`
     ajoute a NOTRE PROPRE page, on regarde juste si une extension du visiteur l'a masque — technique tres
     repandue et benigne, aucun reseau, aucun autre site touche). Micro-modale (meme chrome que `.pop`,
     feed.js) affiche le detail des 3 signaux + rappel de confiance, fermeture par bouton ou clic exterieur.
  Prouve reellement : lien `canyouseeme.org` confirme (`href`+`target=_blank`) ; modale ouverte -> contenu
  exact verifie (3 signaux + note) ; fermeture par bouton ET par clic exterieur toutes deux confirmees.
- **"Nos ports ouverts" retire (23e passe)** : c'etait une option que J'AVAIS proposee moi-meme dans la
  question de clarification, pas une demande de Naim — il l'a signale ("je te l'ai demande ? ca sert a rien")
  et j'ai retire la ligne HTML + les 2 cles i18n. Lecon : une option auto-generee dans une question de
  clarification n'est pas une demande implicite, meme si l'utilisateur la coche parmi d'autres.

## Liquid Enhancement (22/09, nouveau chantier) — 2e fenetre depliante, en dessous de Veille
Idee Naim : sous "Veille" (aside shorts), une fenetre depliante IDENTIQUE ("Liquid Enhancement" EN / "Liquid
Customizator" propose par Naim pour le FR — finalement garde "LIQUID ENHANCEMENT" tel quel dans les 3 langues,
c'est un nom de feature) ou le visiteur decrit une idee d'amelioration pour une des 3 parties du site
(metrics/videos/articles+memes), Qwen (Ollama LOCAL, deja configure — `OLLAMA_MODEL=qwen2.5:7b-instruct`,
aucun nouveau cout) la reformule en version "liquide" plus concrete. Bouton "Soumettre ma customization" si
satisfait.
- **Schema** : `LiquidSubmission` (area/rawInput/enhanced/status), enum `LiquidArea` (METRICS/VIDEOS/
  ARTICLES_MEMES), enum `LiquidStatus` (PENDING_REVIEW/APPROVED/REJECTED) — meme discipline que CoalSubmission
  et l'agent memes : **JAMAIS applique automatiquement au site**, juste un marqueur de suivi pour Naim
  (`liquid:review`/`approve`/`reject`, CLI mirroir de `coal:*`). `LIQUID_SUBMIT_MAX_PER_DAY=5` (config.ts).
- **Backend** : `backend/src/liquid/routes.ts` — `POST /liquid/enhance` (rate-limite, appelle Ollama avec un
  prompt systeme different par zone, repond dans la langue de l'UI courante) ; `GET /liquid/quota` ; `POST
  /liquid` (quota journalier). Prouve reellement : `curl` direct sur Ollama en local -> vraie reformulation
  Qwen obtenue ("j'aimerais voir le pays en drapeau emoji" -> "Ajouter l'affichage du pays sous forme d'emoji
  dans la geolocalisation") ; soumission reelle confirmee via `npm run liquid:review`.
- **Frontend** : `.watch-col` (nouveau wrapper, voir bug ci-dessous) contient `.watch-aside` (Veille) PUIS
  `.liquid-aside`, meme mecanisme de repli (`.watch-collapse` reutilise). Formulaire : 3 chips de zone,
  textarea, bouton "Liquefier", resultat affiche puis bouton de soumission.
- **Bug reel trouve et corrige en mesurant (pas suppose)** : avant le wrapper `.watch-col`, `.liquid-aside`
  etait un ENFANT DIRECT de `.centrale` dans la MEME colonne de grille que `.watch-aside` — CSS Grid
  l'auto-placait alors sur la ligne 2 du grid parent, et comme `.viewer` (colonne 2, le feed, tres haut)
  occupe aussi la ligne 1, toute la ligne 1 prenait la hauteur du feed en entier. Resultat : `.liquid-aside`
  se retrouvait a des MILLIERS de pixels sous Veille au lieu de juste en dessous (mesure reelle :
  `liquidTop` ~6347px vs `watchBottom` ~493px, ecart de plusieurs milliers de px). **Meme famille de bug que
  le fix `.plant-col` plus haut, meme solution** : `.watch-col` devient l'unique enfant de grille pour cette
  colonne (`display:grid; gap:16px` en interne), `position:sticky` + `max-height`/`overflow-y:auto` deplaces
  de `.watch-aside` vers `.watch-col` (le rail tiktok garde EN PLUS son propre scroll+snap interne, deux
  zones de scroll imbriquees mais chacune avec un role distinct). Reinitialise en mobile comme `.plant-col`.
  Prouve reellement : `liquidTop - watchBottom === 16px` (exactement le `gap`) apres le fix, verifie a 1300px
  ET en mobile (`position:static`, plus de cap).

## "Metriques bidons" du Mouchard (22/09) — aleatoires mais stables 24h par IP
Naim : 2 lignes gag ajoutees a "Vos metriques de dev pourri" — "Aujourd'hui vous avez failli ingerer:" et "Vos
selles seront:", chacune piochant dans une liste de blagues absurdes (le coal fait meme une apparition :
"friables comme du charbon"). Contrainte explicite : aleatoire MAIS stable 24h par IP (pas un reroll a
chaque chargement).
- **Backend** (`whoami/routes.ts`) : `dailySeed(ip, salt)` = hash SHA-256 de `ip:YYYY-MM-DD(UTC):salt`, tronque
  en entier 32 bits. Deux seeds (`gagIngestSeed`/`gagStoolSeed`) ajoutes a CHAQUE reponse `/api/whoami` (les 3
  branches : local/succes/echec geoloc). Design deliberement decouple : le backend fournit juste un entier
  stable, le FRONTEND fait `seed % liste.length` avec SA PROPRE liste (par langue) — le backend n'a pas besoin
  de connaitre le contenu/la longueur des listes.
- **Frontend** : `GAG_METRICS` exporte dans `i18n.js` (PAS dans le DICT plat — ce sont des tableaux, pas des
  chaines simples ; adaptation creative par langue, pas une traduction litterale, meme doctrine que le reste
  du site). Rendu dans `main.js` en reutilisant le seed deja recupere via `/api/whoami` (pas de 2e appel),
  re-rendu sur changement de langue SANS refaire l'appel reseau (le seed ne change pas).
  Prouve reellement : meme IP + meme jour -> EXACTEMENT la meme blague apres un rechargement complet de la
  page ; meme seed applique aux 3 langues -> confirme le MEME gag conceptuel dans chaque langue (ex. la
  blague "theine/fer" identique en FR/EN/ES, juste traduite) ; IP differente (8.8.8.8 vs local) -> seeds
  differents, confirme via `curl`.

## T360 — mascotte Liquid Enhancement (22/09, 24e passe)
Naim a fourni 2 images de reference (buste collector Terminator sous licence STUDIOCANAL, photo retro d'un
gamin pouce leve devant un vieil ordi avec signature cursive) pour habiller le fond de la fenetre Liquid
Enhancement (300x640) : "T360" = parodie maison, tete chrome façon Terminator sur un corps d'enfant normal,
coiffure du gamin de la photo, polo bleu cyan avec un chien dessine sur la poche (evocation "Snoopy" sans
reproduire le personnage), pouce leve, assis devant un vieil ordi, fond blanc, signature cursive "T360".
- **Jamais reproduit les references sous copyright** : la photo Terminator porte un copyright STUDIOCANAL
  visible a l'ecran (produit collector sous licence) — jamais copiee/tracee. Meme prudence sur "Snoopy"
  (Peanuts, personnage protege) : prompt volontairement generique ("petit chien dessine retro"), jamais le
  nom du personnage.
- **Genere via ComfyUI local** (verifie en ligne avant utilisation : `check_comfyui` -> status online, GPU
  RTX 3080 Ti detectee), modele `flux1-schnell-fp8.safetensors` (licence Apache 2.0, commercial-safe — PAS
  `flux1-dev` qui est non-commercial, cf. memoire `project_megastudio_model_licensing`). 600x1280 (ratio
  300x640 x2, nettete retina). 2 iterations : 1er jet trop "armure complete", corrige sur retour Naim ("c'est
  une parodie, cheveux du gamin, polo bleu cyan Snoopy") -> resultat final valide, sauvegarde en
  `frontend/public/img/t360-liquid-bg.webp`, envoye a Naim via SendUserFile pour verification directe.
- **Integration** : `.liquid-hero` (nouveau bloc, `aspect-ratio:300/640`, fond = l'image) remplace l'ancien
  `.liquid-intro` seul ; le texte (fourni par Naim, cale en gris fonce) devient un bandeau semi-opaque
  `position:absolute; bottom:0` a l'interieur, plutot que directement sur le buste. **Bug reel trouve et
  corrige en testant** : un `max-height:320px` arbitraire (pose sans reflechir a la vraie proportion demandee)
  faisait prendre au texte (7-8 lignes) presque toute la hauteur du bandeau, cachant la mascotte — ne laissait
  que 42px d'image visible. Retire le plafond : a largeur desktop normale, l'image affiche 304x650 (quasi
  exactement le 300x640 demande), le texte ne prend plus que 119px en bas, 531px de mascotte restent visibles.
  `liquid.intro` (i18n, 3 langues) mis a jour avec le texte exact fourni par Naim (FR) + adaptations EN/ES.

## Police Technicz (22/09, 25e passe)
Naim a montre 5 captures (onglets `.tab`, chips sujets `.chip`, chips zone Liquid — meme classe, titres de
carte `.title`, intro Liquid `.liquid-intro`) et demande la police **Technicz** (`public/fonts/Technicz.ttf`,
deja deposee par Naim) partout sur ces elements — explicitement "pas des textes isoles, tous les h/p/button
de ce genre". Applique au niveau systemique : nouveau `@font-face`, variable `--head` (deja utilisee par
`.tab`/`.title`/`.btn`/`.tm-top`) pointee sur Technicz ; `.chip` et `.liquid-intro` (qui etaient sur
`--mono`) bascules explicitement sur `--head` pour rejoindre le mecanisme commun.
- **Bug reel trouve et corrige en testant (pas visible sur les textes sans accent des captures de Naim)** :
  `Technicz.ttf` (fichier de 2004) **avale les caracteres accentues** — pas un rendu different, la LETTRE
  DISPARAIT purement et simplement ("amélioration" -> "am lioration", "Vidéos" -> "Vid os",
  "fonctionnalité." -> "fonctionnalit ."). Le navigateur ne bascule PAS automatiquement sur le fallback de la
  pile de polices pour ces caracteres : la police repond qu'elle possede un glyphe (vide) pour ces codepoints,
  donc `Trebuchet MS` derriere elle dans le fallback n'est jamais consultee. Seule vraie solution :
  `unicode-range: U+0000-007F;` sur le `@font-face` Technicz — borne la police au pur ASCII, donc TOUT
  caractere hors ASCII (accents FR/ES, tirets longs, guillemets courbes) retombe automatiquement sur le
  fallback, sans exception a coder par langue ni par selecteur (reste coherent avec la demande de Naim :
  aucun texte traite a part). Prouve reellement : `textContent` du DOM confirme que les donnees n'ont jamais
  ete corrompues (juste un probleme de rendu) ; capture apres fix confirme "Vidéos"/"amélioration"/
  "fonctionnalité"/"soi-même" tous correctement affiches, `document.fonts.check('16px Technicz')` confirme
  le fichier bien charge.

## Boutons Liquid Customizer + scroll de la colonne shorts/liquid (22/09, 26e passe)
Naim a demande un restyle des boutons du panneau Liquid Enhancement (les 3 chips de zone
`.liquid-areas .chip` — Metrics/Videos/Articles & memes — et les boutons `#liquid-enhance`
("Liquefier") / `#liquid-submit` ("Soumettre ma customization")) : plus de coin arrondi, plus de
fond blanc, fond noir + texte blanc **tout le temps** (pas seulement l'etat `.on` du chip actif),
et un survol qui change de couleur **par theme** — urbex (`data-theme=steel`) : texte noir/fond
jaune-400 ; jour (defaut) : texte blanc/fond rouge-700 ; nuit (`data-theme=night`) : texte
violet-500/fond bleu-900. Scope volontairement etroit (`.liquid-areas .chip` +
`#liquid-enhance`/`#liquid-submit`), pas touche a `.chip` generique (filtre sujets du feed
principal, reste en pilule transparente comme avant).
- Naim a signale en meme temps, en observant le rendu courant, que ces boutons "prennent toute la
  largeur et n'ont aucun margin-top = colle au bottom de l'image" : ajoute `margin-top:14px`
  explicite sur `.liquid-areas` (en plus du `gap:10px` deja pose par `.liquid-body`) et
  `width:fit-content` sur les 3 boutons pour qu'ils ne lisent plus comme une bande pleine largeur.
  Verifie en vrai (JS `getBoundingClientRect`) : 24px entre le bas de `.liquid-hero` et le haut de
  `.liquid-areas`, largeurs des boutons content-sized (60-77px), pas 100%.
- **2e retour, meme passe** : "pas de scroll interne ; vue complete sur composant, on scroll vers
  le bas quand on est dessus et ca descend toute la page." Le wrapper `.watch-col` (Veille +
  Liquid Enhancement empiles, colonne sticky a partir de 1240px, cf. 18e/19e passe) avait recu
  `max-height: calc(300vh - 68px - 16px); overflow-y: auto;` pour corriger le bug historique du
  bas de colonne inatteignable. Naim prefere explicitement l'inverse pour cette colonne : retire
  `max-height`/`overflow-y` (garde `position:sticky; top:68px`) — desormais la colonne reste
  epinglee en haut mais sans plafond ni scrollbar interne, donc un scroll dessus fait defiler TOUTE
  la page normalement jusqu'a ce que la colonne se decolle d'elle-meme une fois son contenu passe.
  Le rail TikTok (`.tiktok-rail`) garde son propre scroll-snap interne, INCHANGE — pas concerne par
  ce retour, defilement different (shorts) et pas mentionne par Naim.

## Repli Veille ne doit plus retrecir Liquid Enhancement + collapse anime (22/09, 27e passe)
Naim a signale (capture a l'appui) que fermer "Veille" rendait le texte de "Liquid Enhancement" illisible :
`#watch-collapse` retrecissait `--watch-w` a `56px` au clic (`main.js`), et comme Veille et Liquid Enhancement
partagent la MEME colonne de grille `.watch-col` (cf. 19e passe), ca ecrasait aussi la largeur de Liquid
Enhancement — pas seulement celle de Veille. Ce retrecissement datait d'avant l'ajout de Liquid Enhancement
dans cette colonne (7e passe) et n'avait plus de sens une fois les deux asides empilees dedans.
- **Fix largeur** : retire le `--watch-w` dynamique de `main.js` (`#watch-collapse` ne fait plus que toggle
  `.collapsed`, plus de `style.setProperty`). La colonne reste toujours a largeur fixe
  `minmax(260px, 320px)`, que Veille soit ouverte ou fermee. Verifie en vrai : largeur de `.watch-col`/
  `.liquid-aside`/`.watch-aside` = 320px avant ET apres clic sur repli Veille (inchangee).
- **2e retour, meme observation** : "la fermeture de veille et liquid enhancement a la fois cree un saut trop
  soudain de changement des colonnes en desktop, il faut que ce soit smooth." Cause reelle : le repli
  utilisait `display:none` instantane sur `.tiktok-rail`/`.liquid-body` — binaire, impossible a transitionner
  en CSS. Remplace par le pattern **"CSS grid accordion"** : `.watch-aside`/`.liquid-aside` passent en
  `display:grid; grid-template-rows: auto 1fr` (ligne 1 = header, ligne 2 = contenu), `.collapsed` bascule la
  ligne 2 sur `0fr`, et `transition: grid-template-rows .3s ease` anime le passage — le navigateur interpole
  nativement entre les deux valeurs de `fr`, pas besoin de connaitre la hauteur du contenu a l'avance.
  `overflow:hidden; min-height:0` ajoutes sur `.tiktok-rail`/`.liquid-body` (necessaires : un enfant de grille
  refuse par defaut de descendre sous sa taille de contenu, la ligne ne pourrait jamais vraiment atteindre
  `0fr` sans `min-height:0`). Verifie en vrai : repli Veille seul -> hauteur passe a 36.6px (juste le header),
  `grid-template-rows` mesure `36.6667px 0px` ; repli des DEUX a la fois -> `.watch-col` a 154px (2 headers
  empiles), aucune erreur console. Le rail TikTok garde son `overflow-y:auto` desktop (1240px+) par-dessus,
  inchange (override plus specifique, deja dans le fichier apres la regle de base).

## Metriques bidons alignees visuellement sur le reste du Mouchard (22/09, 28e passe)
Depuis leur ajout (cf. "Metriques bidons" plus haut), les 2 lignes "Aujourd'hui vous avez failli ingerer" /
"Vos selles seront" avaient volontairement leur propre style (texte courant, police `--sans`, pas de grille
dt/dd) — justifie a l'epoque par des libelles/valeurs trop longs pour la grille compacte IP/FAI/ecran. Retour
Naim : elles ne doivent PAS se distinguer du reste du HUD, ni en police, ni en couleur, ni en disposition.
Annule ce choix : `.spy-gag p` reprend exactement la meme grille `auto 1fr` que `.spy-hud > div`, meme police
`--mono`, meme label `var(--mute)`, meme valeur en gras alignee a droite. Les valeurs longues retombent a la
ligne par mot normalement (pas de cas particulier). Verifie en vrai (`getComputedStyle`) : `fontFamily`,
`fontWeight`, `color`, `textAlign` strictement identiques entre `.spy-hud dd` et `.spy-gag p b`, idem entre
`.spy-hud dt` et `.spy-gag-label` ; capture apres fix confirme le rendu visuel homogene.

## Footer colle au bas de l'ecran (22/09, 29e passe)
Naim a signale que `.foot` ne restait pas colle en bas quand le contenu de la page est court (peu d'items
charges, grand ecran) — il flottait au milieu au lieu de border le bas du viewport. Pattern "sticky footer"
classique : `body` passe en `display:flex; flex-direction:column; min-height:300vh` (etait juste `margin:0` +
fond avant), et `.centrale` (le seul enfant "elastique" entre le banner et le footer) recoit `flex:1 0 auto` +
`width:100%` pour absorber tout l'espace vide restant. Verifie en vrai : avec le feed tronque a 2 cartes dans
un viewport de 3000px, le bas de `.foot` tombe exactement a 3000px (colle au bord), au lieu de s'arreter bien
avant avec du vide sous lui.

## Debordement day-bg sous le footer corrige (22/09, 30e passe)
Naim a signale (capture) une grande zone texturee vide sous le footer, en theme jour. Cause reelle : `day-bg.js`
empile des segments de 300vh pile (images de `public/img/day-bg/`) jusqu'a couvrir le bas du footer, mais
`Math.ceil()` arrondit toujours a un segment ENTIER — le dernier peut deborder sous le vrai bas du footer de
presque 300vh. Invisible sur une page tres longue (le debordement est un detail proportionnellement petit),
enorme sur une page courte au footer colle en haut (cf. 29e passe juste avant) : le debordement devient la
majorite de l'ecran visible. Corrige sans toucher a la logique d'empilement (qui reste necessaire pour savoir
combien d'images charger) : le calque `#day-bg` recoit desormais une **hauteur exacte en pixels** (calculee en
JS, pas arrondie) + `overflow:hidden` en CSS, qui rogne le morceau du dernier segment qui depasserait le
footer au lieu de le montrer en entier. Verifie en vrai : apres stabilisation (resize forcé pour laisser les
images lazy du feed finir de reflow), bas de `#day-bg` et bas de `.foot` mesures a moins de 1px d'ecart.

## "Taux de charbon en fusion" + renommage Like/Hate (22/09, 30e passe)
Naim a demande un nouveau rectangle a cote de "Top rated" (`#sort`) affichant un pourcentage — ratio Like/Hate
sur l'ensemble du site, tooltip explicite "Like vs Hate". Dans la foulee, correction du vocabulaire des
reactions existantes : "j'aime"/"j'aime pas" (FR) et "Dislike" (EN)/"No me gusta" (ES) remplaces partout par
**"Like"/"Hate"**, mots anglais gardes identiques dans les 3 langues (pas traduits) — seul le LIBELLE visible
change, le code interne (`ReactionType.DISLIKE` en base, `LIKE_KEYS`, `dislike.webp`) reste inchange, aucune
migration necessaire.
- Backend : `GET /api/stats` (`backend/src/items/routes.ts`) expose desormais `reactions: {like, dislike}`
  (comptage global `prisma.reaction.count` par type), en plus des champs existants (byKind/byTopic/hits).
- Frontend : `.sort-group` (nouveau wrapper flex autour de `#sort` + `#melt-rate`) garde les deux rectangles
  cote a cote sans les eloigner malgre le `justify-content:space-between` de `.filters`. `#melt-rate` reutilise
  le meme appel `api.stats()` que le compteur de visites (`main.js`), calcule `like/(like+dislike)*100` cote
  client (backend renvoie les comptes bruts, pas un pourcentage deja calcule — plus simple a verifier/logger).
  Affiche "—" si 0 reaction au total (pas de division par zero, pas de "0%" trompeur).
- Verifie en vrai (curl direct sur `/api/items/:id/react` + reload) : 1 LIKE pose -> widget affiche "100%",
  tooltip "Like contre Hate" (FR) ; reaction retiree ensuite pour ne pas polluer les vraies stats. Boutons de
  reaction sur les cartes confirmes : `title="Like"` / `title="Hate"`.

## Accent retheme par mode (jaune urbex / violet+bleu nuit) (23/09, 31e passe)
Naim : l'accent orange du mode jour (utilise du HUD jusqu'au footer via `--accent`/`--accent-soft`) doit
changer selon le theme au lieu de rester une simple variante d'orange dans les 3 modes. Jour = inchange
(reference). Urbex (`data-theme="steel"`) : `--accent` -> jaune-400 `#facc15`, `--accent-soft` -> variante
sombre jaune `#4a3d14`. Nuit (`data-theme="night"`) : `--accent` -> violet-500 `#8b5cf6`, `--accent-soft` ->
bleu-800 `#1e40af` ("melange" demande par Naim — violet pour texte/bordures/surlignage, bleu pour les fonds
adoucis). Deux couleurs orange codees en dur qui contournaient la variable (`.counter-n`, `.foot-h`, toutes
deux `#ffb04d`) basculees sur `var(--accent)` pour suivre le theme "jusqu'au footer" comme demande. Verifie en
vrai (`getComputedStyle`) : `--accent`/`--accent-soft` corrects par theme, `.foot-h`/`.counter-n`/bordure du
footer mesures a `rgb(139, 92, 246)` (violet-500) en nuit.

## Correction "Zero cookies" (23/09, 31e passe)
Suite a l'audit (`SPEC-ROADMAP.md` §1.7) : le texte visible du Mouchard (`mouchard.trust`, 3 langues) disait
"Zero cookies" alors qu'un vrai cookie (`lh_vid`, technique/anonyme) existe — contredisait le pied de page et
`confidentialite.html`, tous deux deja corrects. Corrige : `mouchard.trust` reprend desormais la meme
formulation que `foot.legal` ("Aucun cookie de suivi : un seul identifiant anonyme pour retenir vos reactions
et votre classeur"), dans les 3 langues. `mouchard.modalTrust` n'a pas bouge (disait deja "zero **tracking**
cookies", deja exact). Verifie en vrai : texte affiche dans le DOM confirme.

## Onglet Tutoriels + rangees de tabs qui epousent la ligne du bas (23/09, 32e passe)
Naim a demande un 7e onglet "Tutoriels" a cote de "Add Coal", pour "fermer" les 2 rangees de `.tabs`.
Ajoute comme un panneau statique (`#tuto`, meme pattern que `#hacks`/`#coal` dans `main.js` — `isPanel`
inclut desormais `isTuto`), avec un message honnete "Bientot" (pas de fausse promesse de contenu deja pret,
aucun module dedie necessaire tant qu'il n'y a rien a charger).
- **2e retour, meme fil** : "les deux rangees de boutons doivent s'etirer et se contracter pour toujours
  equivaloir en longueur a la ligne blanche juste en dessous d'eux" (le `border-bottom: 2px solid var(--ink)`
  de `.tabs`, qui fait deja 100% de la largeur peu importe le nombre de boutons). `.tab` passe en
  `flex: 1 1 auto` : `.tabs` est deja `flex-wrap:wrap`, et chaque rangee EST sa propre ligne flex en CSS —
  `flex-grow` redistribue donc l'espace en trop independamment par rangee, sans JS, sans recalcul au resize
  (le navigateur le fait nativement). Verifie en vrai (`getBoundingClientRect` par rangee, 2 largeurs de
  fenetre differentes) : les deux rangees s'alignent exactement sur les bords gauche/droite du conteneur
  `.tabs` (donc de sa bordure du bas) dans les deux cas, 5+2 boutons comme 4+3.

## Bug critique mobile corrige : grille ecrasee sous 980px (23/09, 33e passe)
Naim a demande un test reel mobile/tablette (§1.8 de `SPEC-ROADMAP.md`, deja note comme "incomplet"). Teste
en vrai (375px, 768px, 1024px) : **bug critique trouve** — sous 980px, `.centrale` passait bien en
`grid-template-columns: 1fr` (regle deja presente dans la media query), mais `.plant-col{grid-column:1}` et
`.viewer{grid-column:2}` (regles de BASE, desktop) n'etaient jamais reinitialisees dans cette meme media query.
Un placement de grille EXPLICITE force la creation d'une colonne IMPLICITE meme quand `grid-template-columns`
n'en definit qu'une — resultat mesure (`getComputedStyle`) : `grid-template-columns` calcule
`"137.625px 226.958px"` (2 colonnes) au lieu d'une seule, tout le site (Veille, Liquid Enhancement, La
Centrale, le feed) ecrase sur ~138px/~227px de large au lieu d'empiler en pleine largeur. Mobile essentiellement
casse depuis l'introduction de `.watch-col` (19e passe) — jamais remarque avant faute de test reel a cette
largeur. Corrige : `.plant-col, .viewer, .watch-col { grid-column: auto; }` ajoute dans la media query
`max-width:980px`, laisse le placement automatique suivre l'ordre DOM/`order` normalement. Reverifie en vrai :
1 seule colonne (343px sur 375px d'ecran, correspondant pile a `.centrale` moins son padding), 0 debordement
horizontal, feed/footer/pub-aside tous corrects a 375px/768px. Zone 980-1240px (tablette paysage) verifiee
superficiellement, semble correcte (2 colonnes plant/viewer + watch-col en pleine largeur dessous, pas de
debordement) mais pas passee au crible element par element — note dans `SPEC-ROADMAP.md` comme reste a faire.

## Import local de test : dossier videos Conspix (23/09, 34e passe)
Naim (nouvelle journee, hors des 7 points de `SPEC-ROADMAP.md`) : brancher en LOCAL un dossier de vraies
videos (atelier Conspix, `C:\Users\naimd\Videos\conspix-memeral-reserv-videos\0-atelier`, 33 sous-dossiers
tech — coding/linux/terminal-cmd-tools/deep-learning-new-ia/...) pour juger l'affichage des cartes VIDEO avec
du vrai contenu, sans rien scraper. Implemente en dev-only strict :
- `LOCAL_VIDEOS_DIR` (nouvel env var, `config.ts`) : vide par defaut, chemin propre a la machine de Naim mis
  dans `backend/.env` (jamais commite) + documente vide dans `.env.example`.
- `index.ts` : route `/local-videos` montee UNIQUEMENT si `!config.isProd && config.LOCAL_VIDEOS_DIR` — double
  garde, jamais active en prod meme si la variable trainait par erreur dans un `.env` de prod.
- `backend/src/dev/import-local-videos.ts` (`npm run dev:import-local-videos`) : prend jusqu'a 4 fichiers par
  sous-dossier (`LOCAL_VIDEOS_PER_FOLDER` pour changer), cree des `Item` kind VIDEO/source=`local-test`,
  mapping grossier dossier->topic (suffisant pour un test d'affichage, pas une vraie classification). Contrepartie
  `dev:clear-local-videos` pour tout retirer proprement.
- **2 bugs reels trouves et corriges en testant** : (1) `publishedAt` manquant au `prisma.item.create` (champ
  obligatoire, pas de defaut Prisma) — corrige. (2) Le `mediaUrl` relatif (`/local-videos/...`) se resolvait
  contre l'origine du FRONTEND (Vite :5180), qui n'a pas cette route (elle vit sur le backend :4200) —
  `DEMUXER_ERROR_COULD_NOT_OPEN` a la lecture. `vite.config.js` proxifiait deja `/api` et `/mirror` vers :4200
  mais pas `/local-videos` : ajoute au meme endroit, meme raisonnement (`changeOrigin:true`, meme origine que
  le cookie visiteur). Verifie en vrai : `readyState:4`, dimensions reelles lues (576x1024), lecture qui avance
  (`currentTime` progresse, aucune erreur).

## Labo Pentest : modal "details" agrandi/redesigne + tour de refroidissement (23/09, 35e passe)
Naim : ameliorer le composant modal "details" du Mouchard avec **strix** (github.com/usestrix/strix, agent IA
de pentest autonome open source), en promouvant aussi l'installation d'autres outils de pentesting — le modal
devient une "decouverte du pentesting" pedagogique (explique que Lcoalhost se teste LUI-MEME, jamais le
visiteur, avec chaque outil), 4 boutons en bas pour switcher entre 4 outils. Recherche web (agent dedie) pour
verifier Strix + trouver 3 vrais outils complementaires (pas invente) : **Strix** (agent IA autonome, Apache
2.0, self-host gratuit, LLM local via Ollama possible), **Nmap** (recon reseau/ports, licence NPSL gratuite),
**OWASP ZAP** (scanner vulnerabilites web, Apache 2.0 gratuit), **Shodan** (moteur d'exposition publique,
freemium, compte gratuit requis — precise clairement dans le modal, pas de CB).
- `frontend/src/pentest-tools.js` (nouveau) : contenu des 4 outils (nom/angle/licence/blurb pedagogique) en
  3 langues, verifie reel (pas de nom invente).
- `frontend/src/pentest-modal.js` (nouveau) : remplace l'ancien `.tracker-modal` (petit popover ancre, CSS
  retiree — plus reference nulle part, verifie par grep) par un vrai modal CENTRE (overlay + backdrop), meme
  pattern que `.embauche-modal`/`.embauche-box` (le seul autre "vrai" modal du site) mais plus large (560px)
  et plus riche : garde le rappel DNT/GPC/bloqueur EN PLUS des 4 outils switchables. Fermeture par bouton X,
  clic sur le fond, ou Echap.
- `main.js` : `showPentestModal()` unique, appelable depuis 2 entrees (bouton "details" du Mouchard ET la
  tour de refroidissement de La Centrale, cf. ci-dessous) — reutilise le resultat de `detectTrackers()` deja
  calcule si disponible (evite un recalcul).
- **Tour de refroidissement** (`plant3d.js`) : sortait du canal ARTICLE (cheminees) sans distinction — recoit
  desormais son propre `kind: 'PENTEST'` (materiau `clay.PENTEST` dedie pour que `paintEmissive()`, qui boucle
  sur `Object.keys(clay)`, lui donne son propre survol independant des cheminees) + son propre tooltip
  ("La tour de refroidissement · LABO PENTEST", pas "cheminees/ARTICLES") + clic special : n'appelle plus
  `select('ARTICLE')`, ouvre directement le Labo Pentest.
- CSS : `.pentest-tab` (les 4 boutons de bascule) rejoint le groupe de selecteurs deja etabli pour les
  boutons Liquid Customizer (noir permanent, pas d'arrondi, survol par theme) — coherence entre les 2
  "selecteurs de mode" du site plutot qu'un 3e style invente.
- **Verifie en vrai** : modal ouvert par invocation directe (titre/tag/4 onglets/switch Strix->Shodan tous
  corrects, licence/blurb/lien "Voir le projet" corrects, fermeture par X confirmee), zero erreur console.
  **Limite honnete** : le clic reel sur la tour 3D n'a PAS pu etre pixel-teste dans cet environnement — le
  pane de navigateur etait `document.hidden`, ce qui met en pause `requestAnimationFrame` (donc la boucle
  `frame()` qui positionne la camera 3D ne tourne jamais), rendant tout ciblage de coordonnees ecran non
  representatif. Le cablage cote code est verifie par lecture (meme motif exact que les 3 autres batiments,
  qui fonctionnent depuis des passes precedentes) et zero erreur console au chargement de la scene, mais le
  clic complet (survol -> tooltip -> clic -> modal) reste a reconfirmer visuellement par Naim en usage reel.
- **Volontairement pas fait ce soir** : aucun scan REEL n'a ete lance (ni Strix/Docker, ni Nmap, ni ZAP, ni
  compte Shodan) — le modal l'annonce honnetement ("Prochaine etape : le lancer reellement..."), meme
  discipline que l'onglet Tutoriels (pas de fausse promesse de resultat deja pret). Lancer Strix necessite
  Docker + une decision LLM (local Ollama recommande, coherent avec la doctrine anti-Big-Tech) ; Shodan
  necessite un compte email (creation de compte = jamais fait par moi sans que Naim le fasse lui-meme).

## Bouton "details" repris sur l'identite Embauche (23/09, 36e passe)
Naim : le bouton "details" (`#spy-tracker-detail`, ouvre le Labo Pentest) doit avoir la meme identite que le
bouton "Embauche" — blanc sur rouge, peu importe le theme. `.spy-detail-btn` utilisait `var(--line2)`/
`var(--mute)` (change de couleur par mode) ; passe sur les memes couleurs EN DUR que `.btn.embauche-btn`
(`#b3261e`/`#fff`, hover `#8f1e17`), garde sa propre taille compacte (badge inline a cote de "Trackers", pas
un bouton de nav pleine taille). Verifie en vrai (`getComputedStyle` sur les 3 themes) : `rgb(179, 38, 30)` /
blanc identique en jour/nuit/urbex.

## Deconnexion admin + hover HIRING teste + 12 tickers (23/09, 37e passe)
- **Hover HIRING verifie en vrai** (hover CDP reel + `getComputedStyle`, pas juste lecture de code) :
  `matches(':hover')` true, fond passe a `rgb(143, 30, 23)` (#8f1e17), texte blanc — contraste correct,
  aucun probleme visuel.
- **Deconnexion admin manquante, corrigee** : `admin.js` n'avait qu'un login (`loginWithToken`), jamais de
  `logout()`. `#admin-badge` (span statique "ADMIN") devient un vrai `<button>` : clic -> `confirm()` (meme
  pattern que la suppression d'item, `feed.js`) -> `adminLogout()` efface le token localStorage + cache le
  badge + `feed.repaint()` (retire les boutons supprimer). Verifie en vrai : token pose -> reload -> badge
  visible -> clic (confirm mocke `true`) -> badge cache + `localStorage.getItem('lh_admin_token')` devient
  `null`.
- **12 tickers par langue** (Naim avait deja mis a jour `i18n.js` lui-meme, les 3 langues avaient bien 12
  entrees) : `index.html` ne rendait encore que `ticker.1` a `ticker.8` (x2 pour la boucle infinie) — mis a
  jour a `ticker.1`-`ticker.12` (x2, 24 spans au total, verifie en vrai). Duree d'animation remise a l'echelle
  180s (etait 120s pour 8 tickers) : meme principe que le passage 4->8 documente plus haut (60s->120s), +50%
  de texte doit garder la meme VITESSE de lecture, pas la meme duree.

## SPEC-ROADMAP.md Phase A : publication admin directe + choix de langue (23/09, 38e passe)
Entame de `SPEC-ROADMAP.md` point par point (demande Naim). Phase A = bloquante pour le reste (B/lien
TabascoCity, pub tierce...) : avant, aucune facon de publier un item depuis le web, tout passait par des
scripts CLI. Implemente en entier et verifie de bout en bout :
- **Prisma** : `Item.sponsored Boolean @default(false)` (migration `add_sponsored_flag`, appliquee). `Item.lang`
  est deja un simple `String` (pas d'enum) — `es` etait deja valide, aucun changement necessaire la-dessus.
- **Backend** : `POST /admin/items` (`admin/routes.ts`, meme garde `x-admin-token`) — payload zod strict,
  `lang` **obligatoire** (`en`/`fr`/`es`, pas de defaut implicite, conforme a la spec), `kind`/`topic` valides
  contre les enums/listes existantes. Statut `PUBLISHED` direct (c'est l'admin qui ecrit, pas un tiers a
  moderer — different d'Add Coal/Liquid qui restent `PENDING_REVIEW`). `permalink` retombe sur
  `https://lcoalhost.lol` si aucune URL fournie (meme convention que les memes maison du seed).
  `ItemDto`/`toDtos` (`dto.ts`) exposent desormais `sponsored`.
- **Frontend** : nouvel onglet **Poster** (`data-kind="POST"`, `#tab-post`), **invisible pour un visiteur
  normal**, montre uniquement quand `isAdmin()` est vrai (login OU deconnexion, cf. 37e passe) — la route
  backend reste de toute facon protegee independamment de cet affichage. Nouveau module `post.js` (meme
  squelette que `coal.js`) : 3 selecteurs chips explicites (type/langue/sujet, pas de radio cache), titre,
  legende, 3 champs URL (media/embed/miniature), case "pub maison" (`sponsored`).
- **Feed** : un item `sponsored` affiche une etiquette **"Partenaire"** TOUJOURS visible (`chip-topic t-sponsored`,
  avant le chip sujet) + bordure de carte teintee accent — jamais masque en pub native trompeuse (exigence
  legale de transparence, cf. spec).
- **Verifie en vrai, bout en bout** : login admin -> onglet Poster visible -> formulaire rempli (lang=fr,
  topic=ia, titre, miniature, sponsored coche) -> publication -> log backend `[admin] publie : MEME/fr ...` ->
  item retrouve via l'API avec tous les bons champs -> carte affichee dans le feed avec la classe `sponsored`
  et l'etiquette "Partenaire" -> item de test supprime (`adminDeleteItem`) apres verification. `tsc --noEmit`
  backend : 0 erreur.
- **Faux positif ecarte** : des erreurs console (500 / `ERR_INSUFFICIENT_RESOURCES`) observees sur l'onglet de
  test ne se reproduisent PAS sur un onglet neuf — artefact de l'accumulation de centaines de rechargements
  dans cette meme session (websocket HMR, connexions), pas un bug du site.
- **Pas fait ce soir** (Phase B, suite logique) : Naim doit fournir l'URL TabascoCity a poster + remplacer un
  `href="#"` dans `pub.js` — aucun developpement supplementaire necessaire, juste l'URL.

## SPEC-ROADMAP.md Phase C : SEO/AEO reel — permalinks + structured data (23/09, 39e passe)
Naim a valide "go" sur la suite de la roadmap. Phase C = permalinks individuels (le site etait une SPA pure,
aucune URL par item, donc rien d'indexable individuellement). Implemente SANS SSR complet (disproportionne) :
juste 3 routes precises, rendues a la demande depuis la base.
- **Nouveau `backend/src/items/public.ts`** (`publicRouter`, monte directement sur `app`, PAS sous `/api` —
  ce sont des URLs publiques, pas des appels internes) :
  - `GET /item/:id` — snapshot HTML minimal (titre, image/video, description, credit source, lien "voir en
    contexte" vers `/`) + JSON-LD (`Article`/`VideoObject`/`ImageObject` selon `kind`) + OG tags + canonical.
    404 propre si l'item n'existe pas ou n'est plus `PUBLISHED`.
  - `GET /sitemap.xml` — genere depuis la base (1 URL/item PUBLISHED + la homepage), remplace le fichier
    statique a 1 seule URL (`frontend/public/sitemap.xml` **supprime**, devenu mort).
  - `GET /llms-full.txt` — dump texte des 200 items les plus recents (titre/legende/type/topic/lang/URL),
    format simple, pas de service tiers.
- **`llms.txt`** : section "Key pages" completee (pointe vers `/item/{id}`, `/sitemap.xml`, `/llms-full.txt`
  — avant, ne listait que la homepage).
- **Dev** : `vite.config.js` proxifie desormais aussi `/item`, `/sitemap.xml`, `/llms-full.txt` vers le
  backend (meme raison que `/api`/`/mirror` deja en place — meme origine, cookie visiteur coherent).
- **Prod** : `deploy/nginx/lcoalhost.lol.conf` recoit 3 nouveaux `location` (proxy vers le backend, meme motif
  que `/api/`) — **non teste localement** (pas de nginx sur la machine de dev, `nginx -t` obligatoire avant
  reload en prod, comme deja note en tete du fichier).
- **CSP verifiee en vrai** (pas supposee) : `helmet()` applique `script-src 'self'` par defaut (sans
  `unsafe-inline`) a TOUTES les routes, y compris les nouvelles — inquietude legitime que le `<script
  type="application/ld+json">` inline soit bloque. Charge reellement `/item/:id` dans le navigateur : le tag
  est present dans le DOM, son contenu se parse correctement (`JSON.parse` -> `@type` correct), **zero
  violation CSP en console**. Confirme : les navigateurs bases sur Chromium n'appliquent pas `script-src` aux
  scripts non-executables comme `application/ld+json` — aucune exception CSP a ajouter.
- **XML valide verifie** (`xml.etree.ElementTree.parse`, pas juste "ca a l'air bien") : 871 URLs (1 homepage +
  ~870 items publies), parse sans erreur.
- **Bug reel trouve EN CONSTRUISANT Phase C et corrige** (pas dans la Phase A elle-meme, decouvert en
  reflechissant a `listQuery.lang` pour le sitemap) : le formulaire Poster (`post.js`, Phase A) laissait
  publier un MEME avec `lang="es"` — or `items/routes.ts` filtre les MEME STRICTEMENT par lang, et
  `contentLang()` (front, `i18n.js`) ne demande JAMAIS `lang=es` ("ES = UI uniquement pour l'instant, pas
  encore de memes maison en espagnol" — commentaire deja present, documente). Un meme ES publie serait donc
  **invisible pour toujours**, orphelin. Corrige : le chip ES se desactive (`disabled`, `title` explicatif)
  quand `kind=MEME`, et si ES etait deja choisi en repassant sur MEME, retombe automatiquement sur EN — jamais
  un choix invalide laisse selectionne silencieusement. VIDEO/ARTICLE non concernes (montres quelle que soit
  la langue). Nouvelle regle CSS generique `.chip:disabled` (opacite reduite, jamais masque). Verifie en vrai
  (clics reels) : ARTICLE -> ES activable ; retour MEME avec ES selectionne -> bascule EN automatique, ES
  redevient desactive.
- **Pas fait ce soir** : trancher le domaine canonique (`lcoalhost.lol` vs `lcoal.host`) — decision Naim, pas
  technique, deja note comme tel dans `SPEC-ROADMAP.md`.

## Accordeon categories atelier Conspix sous le rail Veille (23/09, 40e passe)
Naim a demande (3 captures) de dupliquer les jetons du filtre sujets du feed principal, mais avec les noms
des dossiers de son atelier video Conspix (`0-atelier` + sous-dossiers de `coding`), places sous l'afficheur
TikTok (rail Veille) dans un accordeon discret — preparation du futur pont videos TikTok (deja identifie comme
"a garder pour la fin" par Naim).
- **Backend** (`tiktok/topics.ts`) : `TIKTOK_TOPICS` (26 mots-cles "voulus par Naim" a l'origine) etendu avec
  47 nouvelles categories derivees des noms de dossiers (33 dossiers `0-atelier` + 17 sous-dossiers `coding`,
  moins 3 doublons exacts reutilises tels quels : `api`/`css`/`linux`). Verifie en vrai : `GET /api/tiktok`
  renvoie 73 topics (26+47).
- **Frontend** (`tiktok.js`, restructure) : `createTiktokRail` separe desormais un `.tt-content` (liste de
  clips, remplace a chaque `load()`) d'un `.tt-cats` (accordeon) rendu UNE SEULE FOIS — bug evite en
  construisant (pas trouve en prod, anticipe en ecrivant) : l'ancienne version faisait `root.innerHTML = ...`
  a chaque appel, ce qui aurait efface l'accordeon a chaque changement de filtre/langue si je l'avais mis
  directement dans `root`.
  - Labels = noms de dossiers EXACTS ("crypto-sbt&bots", "web3+ressources+navigation"...), **jamais traduits**
    (meme choix que les noms d'outils du Labo Pentest, 35e passe) — ce sont des categories de travail de Naim,
    pas du texte d'interface a adapter par langue. Slugs (valeurs `data-topic`) cotes cote backend.
  - Reutilise la classe `.chip`/`.chips` deja stylee (filtre sujets du feed), plus un petit bouton toggle
    discret (`▾`, replie par defaut).
- **Verifie en vrai** : 51 chips presents (50 categories + "Tout"), accordeon replie par defaut, s'ouvre au
  clic, filtre "coding" -> etat "rien de cure" honnete (pas d'erreur 400, le topic existe bien cote backend),
  retour "Tout" fonctionne, l'accordeon PERSISTE apres un changement de filtre (pas efface). Zero erreur
  console. `tsc --noEmit` backend : 0 erreur.
- **Pas de vrais clips categorises ainsi pour l'instant** (normal, honnete) : le pont videos TikTok
  (transformer les videos atelier en vrais shorts) reste explicitement differe par Naim ("garder pour la
  fin") — cette passe prepare juste la taxonomie + l'UI de filtre, prete a recevoir du contenu reel plus tard.

## Jour/footer : bug de debordement recurrent + Phase D metrics (23/09, 41e passe)
Naim a modifie `day-bg.js`/CSS lui-meme (100vh -> 300vh pour le decalage ET la taille des segments, opacite
.1 -> 1) puis signale 2 problemes.
- **`mix-blend-mode` "lumiere maximale"** : a opacite 1, l'image brute masquait tout le fond creme derriere
  elle. Ajoute `mix-blend-mode: screen` sur `#day-bg` — eclaircit au maximum en combinant avec ce qu'il y a
  dessous plutot que de le masquer.
- **Footer de nouveau "pas colle"** — bug reel retrouve : `fill()` (day-bg.js) calculait encore la hauteur du
  calque en soustrayant UN SEUL `vh` (`naturalBottom(footer) - vh`), alors que le calque commence maintenant a
  `top: 300vh` (3x plus bas qu'avant). Le calque debordait donc de 2 ecrans pleins (200vh) sous le vrai bas du
  footer — meme symptome que le bug de la 30e passe, cause differente cette fois (decalage de depart, pas
  l'arrondi par segment). Corrige : nouvelle constante `SEGMENT_VH = 3` (DOIT rester synchronisee avec
  `#day-bg{top}`/`#day-bg img{height}` dans style.css, commente des les 2 cotes), les deux `vh` de `fill()`
  utilisent desormais `vh * SEGMENT_VH`. Verifie en vrai : bas du calque et bas du footer alignes a <1px
  d'ecart, sur page longue ET sur page courte (feed tronque).

**SPEC-ROADMAP.md Phase D (metrics)** : Naim confirme Umami (recommande, cookieless, open source). Precision
importante recue en cours de route : le serveur de Lcoalhost est **Hostinger KVM2** (pas le Scaleway Dedibox
suppose a tort dans le brouillon initial de `SPEC-ROADMAP.md`) — KVM2 est un serveur **PARTAGE** (Dueria,
Fundherz, Raisup, Traefik, OpenClaw deja dessus, cf. memoire `reference_serveurs_prod`), route par **Traefik**
(JAMAIS de nginx/certbot systeme dessus). Question posee a Naim sur la portee exacte (tout Lcoalhost sur KVM2
vs juste Umami) : **repondue "ne pas continuer" (dismissed)** — je n'ai donc PAS touche a l'architecture de
deploiement existante (`docker-compose.yml`/`deploy/nginx/`), qui reste construite pour un Dedibox/nginx
systeme jusqu'a decision explicite de Naim.
- **Fait ce soir** (le seul morceau ne dependant d'aucune decision d'infra) : `frontend/src/analytics.js` —
  point d'integration UNIQUE, deliberement INERTE tant que 2 constantes (`UMAMI_SCRIPT_URL`, `UMAMI_WEBSITE_ID`)
  ne sont pas remplies par Naim. Appele depuis `main.js` (`initAnalytics()`). Verifie en vrai : aucun script
  injecte tant que vide (zero comportement pour le visiteur), mecanisme d'injection lui-meme teste separement
  (fonctionne avec de vraies valeurs).
- **Pas fait ce soir, action de Naim** (aucun acces SSH a KVM2 depuis cette machine) : installer Umami
  reellement sur KVM2. Umami se deploie en conteneur Docker officiel
  (`ghcr.io/umami-software/umami:postgresql-latest`, variables `DATABASE_URL`/`APP_SECRET`) + labels Traefik
  pour le sous-domaine choisi (ex. `metrics.lcoalhost.lol`), meme motif que `/docker/tuveuxun` deja en place —
  **a adapter/verifier contre le patron reel deja sur KVM2**, je n'ai pas d'acces pour le confirmer moi-meme.
  Une fois en ligne, coller les 2 valeurs dans `analytics.js` (ou me redemander de le faire).
- **Route admin `/admin/traffic`** (dashboard trafic pour l'admin) : PAS construite ce soir — batir un proxy
  contre l'API Umami avant qu'elle existe reellement serait de la supposition (API/auth pas encore verifiees
  en vrai) ; a faire une fois Umami reellement joignable.

## Logos outils cliquables dans le Labo Pentest (23/09, 42e passe)
Naim : les 4 boutons de bascule outils (Strix/Nmap/ZAP/Shodan) doivent devenir des images cliquables qui
refletent le design de chaque outil, deposees par ses soins dans `frontend/public/pubs/` (meme dossier que
les pastilles ecosysteme, `pub.js`). Annule le style "chip noir" pose plus tot ce soir (35e passe) — coherence
demandee avec l'autre rangee d'images-boutons du site plutot qu'avec les boutons Liquid Customizer.
- `pentest-modal.js` : `logoSrc(id) => /pubs/pentest-${id}.png` — convention de nom, `id` = le meme que dans
  `pentest-tools.js` (`strix`/`nmap`/`zap`/`shodan`). `.pentest-tab` rend desormais un `<img>` (avec `title`/
  `alt` = nom de l'outil pour l'accessibilite), pas du texte.
- CSS : `.pentest-tab` retire du groupe de selecteurs partages avec `.liquid-areas .chip`/`#liquid-enhance`/
  `#liquid-submit` (n'a plus le meme style), recoit son propre gabarit circulaire (56px, meme langage que
  `.pub-pin`).
- **Fichiers attendus, PAS encore fournis** (normal, Naim l'a dit lui-meme) : `public/pubs/pentest-strix.png`,
  `pentest-nmap.png`, `pentest-zap.png`, `pentest-shodan.png` — les images cassent (icone navigateur) tant
  qu'ils n'y sont pas, comportement attendu, pas un bug.
- **Verifie en vrai** : 4 boutons 56×56px cercle (`border-radius:999px`), `src`/`title` corrects, le clic
  bascule toujours bien l'outil actif (teste Shodan -> `.pentest-name` change, classe `.on` correcte).

## Volet coulissant pub-aside/ads-aside (23/09, 43e passe)
Naim : sous 1700px (desktop plus petit, tablette, mobile), `.pub-aside`/`.ads-aside` disparaissaient
completement (`display:none`) au lieu de devenir des volets fermes accessibles. Sur mobile, le volet ouvert
doit pouvoir atteindre 50% de la largeur de chaque cote, avec des pastilles/encarts agrandis.
- **index.html** : chaque aside recoit un `<button class="aside-handle">` (persistant) + un `<div
  class="aside-body">` qui enveloppe le contenu existant (pastilles pub / rectangles ads).
- **`pub.js`** : cible desormais `.aside-body` au lieu de l'aside entier pour son `innerHTML` — sinon son
  propre remplacement aurait efface le bouton handle a chaque rendu (meme piege deja rencontre et evite pour
  tiktok.js/pentest-modal.js cette session, motif repete une 3e fois).
- **CSS** : plus de `display:none` nulle part — `.pub-aside`/`.ads-aside` toujours affiches, c'est
  `.aside-body` qui se cache via `transform:translateX()` (pas `display`) sous 1700px, `.aside-handle` visible
  uniquement dans cette meme plage. A partir de 1700px, aucune transform ne s'applique (comportement inchange
  depuis toujours a cette largeur, handle cache). Sous 980px (mobile), l'etat `.open` porte la largeur a
  `50vw` (retire le `max-width:170px` fixe d'`.ads-aside`) + `.pub-pin` 70px->100px + `.ads-slot` 220px->260px.
- **`main.js`** : `wireAsideDrawer()` (une fonction, appelee 2x) — clic sur le handle bascule `.open`, clic en
  dehors ou Echap referme (memes reflexes que le Labo Pentest, meme session).
- **Verifie en vrai** (getBoundingClientRect/getComputedStyle reels, pas suppose) : a 1440px, volet ferme par
  defaut (`aside-body` decale hors champ), s'ouvre au clic (transform revient a 0), se referme au clic sur le
  handle ET au clic exterieur. A ~390px (mobile), largeur ouverte = 50% du VRAI viewport (195px sur 390 — le
  premier calcul avec `window.innerWidth` du navigateur du pane, 464, etait trompeur : ce pane rapporte un
  `innerWidth` different du viewport CSS reel utilise par les unites `vw`, ecart propre a cet environnement de
  test, pas un bug), pastille pub agrandie a 100px confirmee. A 1800px (>=1700px), handle cache, transform
  `none` — comportement grand ecran inchange confirme.

## Phase E — regie pub tierce, encarts reels (23/09, 44e passe)
Suite de la 43e passe (volets coulissants). `SPEC-ROADMAP.md` Phase E : self-serve, paiement immediat, jamais
publie sans relecture Naim (meme discipline que Add Coal/Liquid).
- **Schema** : `Advertiser` + `AdSlot` (`AdPosition` ADS_ASIDE/PUB_ASIDE, `AdSlotStatus` PENDING_REVIEW/
  APPROVED/REJECTED/EXPIRED), migration `add_ad_regie` appliquee.
- **Backend** : `ads/routes.ts` (`GET /ads/pricing`, `POST /ads`, `GET /ads/checkout/:intentId`, `GET
  /ads/active`), `ads/review|approve|reject|expire.ts` (CLI, `npm run ads:review/:approve/:reject/:expire`).
  `ADS_PRICE_CENTS=999` dans `config.ts` — **placeholder explicitement flagge, PAS une decision Naim** (prix a
  trancher, `SPEC-ROADMAP.md` le dit deja). Meme rail Stripe que Hacks (`payments/rails/registry.ts`), meme
  webhook -> `fulfillment.ts` (`onAdPaid`/`onAdRefunded` sur prefixe `orderRef` "AD-") : un slot paye reste
  PENDING_REVIEW, ne s'affiche jamais avant relecture. `expireCycle` ajoute au scheduler (`scraper/run.ts`),
  meme cadence que `SCRAPE_INTERVAL_MIN`, tourne meme si le scraping est OFF.
- **Bug reel trouve + corrige** : la route `POST /ads` creait `Advertiser`+`AdSlot` AVANT de verifier la
  disponibilite du rail Stripe, donc chaque tentative (100% d'entre elles, Stripe etant OFF) laissait un
  `Advertiser` orphelin en base. Verifie via script jetable (1 ligne orpheline trouvee), corrige en deplacant
  `getRail(rail)` avant toute ecriture + nettoyage `Advertiser` dans le catch, reverifie a 0 orphelin apres fix
  (curl direct + formulaire front).
- **Front** : `ads.js` (formulaire "Annoncer", `Advertise` dans l'onglet TABS), `ads-aside.js` (rendu des
  VRAIS encarts approuves dans `.ads-aside`) — tant qu'aucun `AdSlot` n'est APPROVED + dans sa fenetre de
  dates, les 5 rectangles placeholder statiques restent affiches tels quels (honnete, aucun contenu invente).
  Etiquette "Publicite"/"Ad" (`ads.sponsoredLabel`, 3 langues) toujours visible en surimpression sur l'image —
  distinction stricte pub tierce vs pub maison (Phase E point 5 du spec). CSS `.ads-slot-real`/`.ads-slot-badge`.
- **PUB_ASIDE (pastilles rondes, rotation maison) : PAS branche cette passe**, deliberement — fusionner un
  encart tiers dans la rotation existante de `pub.js` est une integration plus lourde (mele avec le contenu
  maison), laissee en TODO explicite plutot que de la faire a la va-vite. `ADS_ASIDE` seul est cable et verifie.
- **Verifie en vrai** (pas suppose) : script jetable Prisma direct (creation `Advertiser`+`AdSlot` APPROVED,
  supprime apres coup) -> a 1920px, l'encart reel remplace les rectangles placeholder avec le badge "Publicite"
  correct et le bon lien/image (confirme via `read_page`/`find`, pas juste screenshot) ; a 1200px (mode volet,
  43e passe), meme encart reel visible dans le volet ouvert ; apres suppression des donnees de test, les 5
  placeholders statiques reviennent — le fallback honnete fonctionne. Aucune erreur console.
- **Reste a faire Phase E** : decision de prix reelle (Naim), branchement `PUB_ASIDE`, verif bout-en-bout avec
  un vrai paiement Stripe une fois le rail actif.

## Volet coulissant : refonte design + chevauchement corrige (23/09, 45e passe)
Retour a chaud de Naim sur la 43e passe : la poignee etait "un rectangle plat sans style ni efficacite".
Repris a zero :
- **Poignee** : style "sticker a ombre dure" (border 2px + box-shadow offset, meme langage que `.btn`/
  `.pentest-tab`, jamais de degrade/flou) + libelle vertical ("PUB"/"ENCARTS", nouvelle cle i18n
  `ads.shortLabel`) pour dire CE que le volet contient sans avoir a l'ouvrir. Etat ouvert = poignee change
  de couleur (accent) + fleche pivote 180deg — feedback d'etat explicite. Transition `.aside-body` passee
  a un cubic-bezier avec leger overshoot (pas un ease plat) pour un mouvement moins aseptise.
- **Bug reel trouve en testant** (pas juste esthetique — vrai souci d'efficacite) : `.aside-body` n'avait
  AUCUN fond opaque en mode volet. A l'ouverture, le contenu de la page en dessous (Veille, Liquid
  Enhancement...) transparaissait au travers, surtout visible sur `.ads-slot` (opacity .4) — illisible des
  deux cotes. Corrige : `.aside-body` recoit un vrai fond `var(--paper)` + bordure + ombre en mode volet
  (<1700px uniquement, le mode grand ecran statique n'est pas touche).
- **2e bug reel** : sous 980px, `.pub-aside.open`/`.ads-aside.open` valent chacun `50vw` — les deux
  ouverts en meme temps = 100vw, superposes sur toute la largeur. Corrige dans `main.js`
  (`wireAsideDrawer`) : ouvrir un volet referme automatiquement l'autre, quelle que soit la largeur d'ecran.
- **Verifie en vrai** (pas suppose) : a 700px, ouvrir ENCARTS referme PUB tout seul (confirme par lecture
  directe de `classList`) ; capture montrant le panneau desormais opaque et lisible ; a 1920px (mode
  statique) comportement visuel inchange, zero erreur console (les 429 vus en testant venaient de mes
  propres rechargements repetes, confirmes disparus sur un onglet neuf — pas un vrai bug).

## Phase F — legal, mis a jour pour couvrir la regie pub tierce (23/09, 46e passe)
- **`mentions-legales.html`** : la mention d'hebergement "Scaleway SAS (offre Dedibox)" avec adresse etait
  fausse (confirme KVM2 le 23/09, 41e passe — voir plus haut). Remplacee par une mention honnete "a
  confirmer" plutot que d'inventer une 2e fausse adresse — la portee exacte du deploiement (tout le site
  sur KVM2, ou juste Umami) reste une decision de Naim, pas encore tranchee.
- **`mouchard.modalTrust`** (Labo Pentest, i18n.js, 3 langues) affirmait encore "zero pub tierce active" —
  devenu faux des que la Phase E a cable une vraie regie. Reformule : accent sur l'absence de cookie de
  tracking + etiquetage "Publicite" toujours visible (ce qui reste vrai quel que soit le nombre d'encarts
  approuves), plutot qu'une promesse de "zero pub" perimee des le 1er encart. Meme famille de bug que le
  "0 cookies" deja corrige avant — verifier les textes legaux/trust apres CHAQUE feature qui touche a la
  collecte de donnees ou a la pub, pas juste au moment ou on les ecrit.
- **`confidentialite.html`** : nouvelle categorie "Encarts Annoncer" dans les donnees collectees, section
  Cookies reecrite (la regie pub tierce n'ajoute aucun cookie/pixel, etiquetage toujours visible — donc le
  bandeau RGPD reste non requis, confirme explicitement), destinataires/sous-traitants mis a jour.
- **`cgu.html`** : nouvel article 8 "Encarts publicitaires (Annoncer)" (paiement Stripe, PENDING_REVIEW,
  remboursement manuel si refuse, etiquetage permanent) — articles 8-12 renumerotes 9-13.
- **Verifie en vrai** : les 3 pages relues via navigateur integre (get_page_text), texte du Labo Pentest
  confirme via lecture directe du DOM (`textContent`).
- **Reste a faire Phase F** : relecture reelle par Naim/juriste (action humaine), et l'adresse
  d'hebergement ne pourra etre remplie que quand la portee du deploiement KVM2 sera tranchee.

## Volet coulissant : redesign 45e passe annule (23/09, 47e passe)
Naim a vu le resultat en vrai (capture) et l'a juge "degueulasse et vieillot" — pire que la version simple
d'avant, pas juste imparfait. Revert integral et fidele de la 45e passe : `.aside-handle`/`.aside-body`
(style.css) et le markup des boutons (index.html) remis exactement comme en fin de 43e/44e passe (rectangle
plat, pas de libelle, pas de fond opaque sur `.aside-body`) ; la logique JS "un seul volet ouvert a la fois"
(main.js) egalement retiree pour rester fidele a "reviens a la version d'avant" — reintroduit donc l'edge
case mineur des 2 volets ouvrables ensemble sur mobile (50vw+50vw), facilement re-corrigeable plus tard si
Naim le demande, mais pas fait ici de ma propre initiative. Cle i18n `ads.shortLabel` (devenue inutile)
supprimee. **Le volet ATTEND desormais une direction artistique de Naim avant toute nouvelle tentative** —
ne pas re-proposer de redesign de cet element sans qu'il l'ait explicitement demande.

## Test lecteur video avec fichiers locaux de Naim (23/09, 48e passe)
Naim a depose 3 mp4 dans `frontend/public/videos/` (servis directement par Vite, `/videos/*.mp4`, zero code
requis pour l'URL). 3 Items VIDEO crees via script jetable (`source:'local-test-public'`, distinct du jeu
Conspix existant `local-test`) pointant `mediaUrl` dessus. **Verifie en vrai** : lecture reelle confirmee
(readyState 4, duree 29.8s, zero erreur) — le lecteur existant (`feed.js`, `<video controls autoplay>`)
fonctionne tel quel, aucune modif de code necessaire. Items laisses en base (pas des orphelins accidentels,
Naim les utilise activement pour tester). Question en attente pour Naim : le "JSON d'URLs" qu'il propose
d'ajouter ensuite — sont-ce d'autres fichiers LOCAUX (meme pattern) ou de VRAIES URLs distantes a importer
(nouveau connecteur) ? Determine le prochain code a ecrire, pas suppose.

## Phase G — responsive + poids images (23/09, 49e passe) — ⚠️ INCIDENT images
- **Logos `public/pubs/`** (pastilles pub-aside) : sources 1024×1024 a 3508×2480 px affichees en cercle de
  70-100px. Redimensionnes (240px max) + WebP q85 : 3,24 Mo -> 132 Ko, verifies visuellement ; `pub.js`
  pointe sur les `.webp`, anciens PNG/GIF supprimes. `nmap.webp` recompresse (269 Ko -> 30 Ko).
- **Bug reel corrige** : les 4 logos du Labo Pentest etaient casses depuis leur depot — le code attendait
  `pentest-<id>.png`, les fichiers reels sont `strix/nmap/shodan/oswap.webp` (`oswap` = outil d'id `zap`).
  Mapping explicite `LOGO_FILES` dans `pentest-modal.js`, verifie charge en vrai.
- **Bug reel corrige (zone 980-1240px)** : les volets fermes (translate hors champ) rendaient la page
  scrollable horizontalement (74px a 1100px). `overflow-x:hidden` sur `html` SEULEMENT (pas sur les asides :
  leur bouton `.aside-handle` deborde volontairement de leur boite). **Corrige en 52e passe** : l'avoir mis
  aussi sur `body` cassait tous les `position:sticky` (voir plus bas). Fermeture passee de `translateX(±120%)`
  a `translateX(±100vw)` (garanti hors champ quelle que soit la position de depart). Verifie :
  `scrollTo(200,0)` -> `scrollX` reste 0 ; `elementFromPoint` au bord reel du viewport ne touche pas la pastille.
- **Piege de mesure a retenir** : sous 768px, le pane emule un mobile DPR 2 et `window.innerWidth` /
  `getBoundingClientRect` / `elementFromPoint` y rapportent un espace ~2x plus large que
  `documentElement.clientWidth` / `visualViewport.width` (les vrais). Toujours comparer contre
  `clientWidth`, jamais `innerWidth`.
- Formulaires Liquid/Coal/Hacks/Annoncer a 375px : zero debordement. Chips/`.btn` = 25-27px de haut (< 44px
  recommande) : pattern site-wide preexistant, NON touche (decision design = Naim). Bouton Classeur seul sur
  sa ligne en mobile : cosmetique, NON touche.
- **INCIDENT (faute Claude)** : apres UN seul test visuel (`ground0.webp`), recompression en place (q85) de 25
  images de fond/theme SANS copie de sauvegarde, dossier `public/img/` non suivi par git. 13 JPEG deja
  compresses en sont ressortis PLUS LOURDS (perte de generation pour zero gain). Restaures a l'octet pres :
  `antenna.jpg`, `banner-coal.webp`, `plant.jpg`, `pixel-plant.jpg` (depuis `frontend/dist/img/`, build du
  22/09) et la photo `img/tips/` (depuis `Videos/conspix-memeral-reserv-videos/0-atelier/coding/`). **Encore
  re-encodes (originaux non retrouves sur C:)** : `banner-night.webp`, `banner-urbex.webp`, `steel.jpg`,
  `steel2.jpg`, `steel3.jpg`, `steel4.webp`, `nightmode.jpg`, `night-bottom-components.jpg`,
  `pixel-plant-night.webp`, `t360-liquid-bg.webp`, `day-bg/ground0..10`. **Regle desormais : jamais de
  modification en place d'un asset binaire sans copie prealable, et validation fichier par fichier.**
- Reste ouvert : images de memes du feed (`.media img`, `height:auto` sans ratio -> layout shift au
  chargement) — demande de stocker largeur/hauteur cote backend, pas fait.

## videos.json -> rail Veille TikTok (23/09, 50e passe)
- `frontend/public/videos/videos.json` : liste Naim `{ "videoN": "url TikTok" }` (20 entrees, dont 11 fois la
  meme URL tabascocity = remplissage). Espace final de `video8` retire, rien d'autre change.
- Import : `npm run watch:import-json [-- chemin.json]` (`backend/src/watch/import-json.ts`), qui reutilise
  `processLine` de `import-dump.ts` (oEmbed officiel, upsert platform+videoId) — pas de 2e logique. Doublons
  d'URL ignores, le JSON n'est jamais modifie. `import-dump.ts` : `processLine` exporte + `main()` garde par
  `require.main === module`.
- **Bug reel trouve** : l'oEmbed TikTok renvoie 400 sur les carrousels `.../photo/<id>`, mais accepte le meme id
  en `.../video/<id>` (verifie en vrai). Normalisation photo->video dans `processLine` (profite aussi a
  `watch:import`). Resultat : 10 clips uniques / 10, 0 echec.
- **Verifie en vrai** : `/api/tiktok` = 10, 10 iframes TikTok chargees dans le rail (dont les 3 carrousels),
  message "Rien de cure" disparu, carrousel Chase AI rendu visuellement.
- **A signaler (Phase F)** : chaque embed affiche la banniere cookies de TikTok dans son iframe, et le
  chargement envoie l'IP du visiteur a TikTok avant tout consentement. `confidentialite.html` ne mentionne
  PAS du tout les embeds TikTok/Instagram. A trancher par Naim : simple mention dans la politique, ou facade
  "cliquer pour charger" (pas d'appel TikTok avant clic). Rien change de ma propre initiative.
- Lecteur du feed "Videos" (`<video src>`) inchange : un lien TikTok ne s'y lit pas, les clips vont dans le rail.

## day-bg passe a 21 fonds (23/09, 51e passe)
- Naim a depose `ground0..ground20` (webp/jpg/png melanges) dans `public/img/day-bg/`. Le serveur de dev tournait
  deja : `day-bg.generated.js` n'est regenere qu'au `predev`/`prebuild` -> relance manuelle
  `node scripts/gen-day-bg.js` (21 fonds, ordre numerique). **A retenir** : tout depot de fond pendant que le
  dev tourne demande cette commande (ou stop.bat/start.bat), sinon les nouveaux fichiers sont ignores.
- Reglages Naim intacts (`#day-bg` top 300vh, opacite 1, `mix-blend-mode:screen`, image 300vh). Seul le
  commentaire d'en-tete de `day-bg.js` corrige (disait "opacite 0.3" / "apres ground10"). Aucune image touchee.
- **Verifie en vrai (1440x900)** : calque a 2700px (=300vh), bas du calque = bas du footer (6736 = 6736) ;
  page allongee artificiellement (bloc de test 60000px, retire apres) -> ground0..ground20 dans l'ordre puis
  reboucle ground0, 0 image cassee (ground20.png compris), bas calque = bas footer ; bloc retire -> retour a 2
  segments, toujours colle au footer.
- **Constat pour Naim** : a 300vh par image, une page normale (~6700px sur ecran 900px) n'affiche que
  ground0 + ground1 ; il faut ~60 ecrans de scroll pour voir les 21. `ground20.png` pese 1,9 Mo (le plus lourd).
- **ground20 allege (feu vert Naim)** : sortie studio-ai en PNG sans perte (1024x1024, RGB sans alpha, 1,9 Mo).
  Original DEPLACE (pas ecrase) vers `frontend/_originals/day-bg/ground20.png` (sha256 identique avant/apres,
  hors `public/` donc jamais servi ni liste par le generateur), WebP q85 encode depuis cette copie ->
  `public/img/day-bg/ground20.webp` 212 Ko. Compare a l'oeil : identique. Liste regeneree, servi en 200.
  **Nouveau dossier `frontend/_originals/`** = seul endroit ou ranger un original avant toute optimisation.

## day-bg : images entieres (largeur 100%, hauteur auto) + footer re-verifie (23/09, 52e passe)
- **Demande Naim** : plus de "segments" de hauteur fixe — chaque fond en pleine largeur, hauteur naturelle, pour
  voir l'image ENTIERE. CSS `#day-bg img { width:100%; height:auto }` (fini `height:300vh`+`object-fit:cover`).
  Depart du fond inchange (`#day-bg{top:300vh}`), opacite 1 + screen inchanges.
- **`day-bg.js` reecrit en consequence** : proportions de chaque fichier apprises au 1er chargement (`ratios`),
  hauteur affichee = largeur du calque x ratio, on empile tant que la page n'est pas couverte, on retire ce qui
  depasse. Plus de `loading=lazy` (une image lazy hors ecran ne charge jamais -> hauteur inconnue -> chaine
  bloquee). Plafond de 200 iterations + image en erreur retiree = aucune boucle infinie possible.
- **Garantie footer inchangee** : hauteur du calque fixee au pixel (bas du footer - haut du calque) +
  `overflow:hidden`, posee AVANT tout le reste — vraie meme pendant le chargement des images.
- **3 vrais bugs trouves en verifiant** (demande Naim : "verifie que le footer colle toujours") :
  1. **Onglets panneau** (Tutoriels/Annoncer/Hacks/Coal) : masquent le feed sans le modifier -> aucun
     declencheur -> calque bloque a l'ancienne hauteur (4000px sous le footer) jusqu'au 1er scroll. Prexistant.
     Fix : `MutationObserver` elargi de `#feed` a tout `#centrale` (contenu + attributs hidden/class/style),
     regroupe par `setTimeout` 50ms (pas rAF : doit marcher onglet cache) + `ResizeObserver` sur body.
  2. **Mobile** : le calque s'arretait 2373px AVANT le footer — le JS recalculait 300vh via
     `window.innerHeight`, qui != `100vh` CSS (barre d'adresse mobile ; emulation du pane : x2). Fix : haut
     du calque LU dans le DOM (`getBoundingClientRect().top + scrollY`), le CSS reste seule source de verite.
     Constante `SEGMENT_VH`/`START_VH` supprimee.
  3. **Regression Phase G (ma faute, 49e passe)** : `overflow-x:hidden` mis aussi sur `body` -> body devient
     conteneur de defilement (overflow-y:auto) -> TOUS les `position:sticky` casses (.plant-col a -1108px au
     lieu de 68px a scroll 1500). Fix : `overflow-x` sur `html` seulement. Recolle a 68px.
- **Verifie en vrai** : desktop 1440x900 — accueil/Tutoriels/Hacks/Videos/Memes : bas du calque = bas du
  footer = fin de page a chaque fois SANS scroll entre onglets ; page allongee a 66758px : 33 images
  (0->20 puis boucle), 0 cassee, colle ; raccourcie : retour a 3 images, colle ; sticky 68px. Mobile 375x812
  — debut 2436px (=300vh exact), colle sur accueil/Tutoriels/Annoncer/Videos/Memes. Console propre (onglet
  neuf ; une erreur `START_VH` vue avant venait de l'etat intermediaire recharge a chaud entre 2 editions).

## Phase D.4 — taux de clic reel des encarts (23/09, 53e passe)
- **Table `PromoStat`** (key, day, views, clicks ; cle primaire key+day). Migration `add_promo_stat` = 1 seul
  `CREATE TABLE`, rien de modifie/supprime. key = `pub:<nom pastille maison>` ou `ad:<AdSlot.id>`.
- **`POST /api/promo/events`** (`backend/src/promo/routes.ts`) : lot de 1-20 evenements `{key, type:view|click}`,
  limite 120/min/IP. Cles `pub:` = liste FERMEE `HOUSE_PINS` (doit rester alignee sur les `name` de `PUB_SETS`
  dans `pub.js`) ; cles `ad:` = seulement une AdSlot APPROVED. Clic compte 1x par IP+encart+jour (IP comparee
  en memoire vive, jamais en base, remise a zero chaque jour).
- **Front `promo-track.js`** : "vue" = encart >=50 % visible (IntersectionObserver), 1x par encart et par
  chargement — une pastille dans un volet ferme ne compte PAS. Envois groupes (2 s ou 20 evts), `keepalive`.
  Branche dans `pub.js` et `ads-aside.js`.
- **Rapport** : `npm run promo:stats [-- 7]` (vues, clics, taux par encart ; nom de l'annonceur pour `ad:`).
- **Bug reel trouve en testant (grave)** : handler async + `.parse()` -> un POST malforme (type invalide)
  levait une ZodError non rattrapee -> Express 4 ne gere pas les rejets async -> **le processus API entier
  s'arretait** (1 requete = site coupe). Corrige par `.catch(next)` (le gestionnaire global repond 400). **Meme
  defaut corrige sur `POST /admin/items`** (formulaire Poster, Phase A — une URL mal saisie aurait coupe l'API).
  Reste ~10 routes async sans filet (hacks, tiktok, ads/active, quotas, /item/:id, pin/delete admin) : aucune
  ne valide d'entree avec `.parse`, elles ne tomberaient que sur une erreur interne (base indisponible) — non
  touchees, signalees a Naim. Un JSON syntaxiquement casse repond 500 au lieu de 400 (toutes routes, sans crash).
- **Verifie en vrai** : 400 sur type invalide / lot de 21 / URL Poster invalide, API toujours en vie ; cle
  inventee et annonce inexistante ignorees ; clic rejoue non compte ; navigateur : volet ferme a 1200px -> 0
  vue, volet ouvert -> 1 vue par pastille visible, 2 clics -> 1 clic ; a 1920px -> 5 vues. Donnees de test
  supprimees (table vide), script jetable supprime.
- `confidentialite.html` : puce factuelle "Mesure des encarts publicitaires" ajoutee.

## Filet d'erreurs sur TOUS les handlers async (23/09, 54e passe)
Suite directe du bug grave de la 53e passe (Express 4 ne rattrape pas les promesses rejetees -> 1 erreur dans
un handler async = processus API arrete). Seule la gestion d'erreurs a change, aucune logique de route.
- **Helper partage `backend/src/lib/wrap.ts`** (`wrap(async (req, res) => {...})` -> `.catch(next)`). Le `wrap`
  local de `items/routes.ts` supprime, le fichier importe le helper partage. `promo/routes.ts` et
  `POST /admin/items` gardent leur `.catch(next)` inline (deja corrects, non retouches).
- **Routes protegees** : admin (`GET /admin/storage`, `PATCH /admin/items/:id/pin`, `DELETE /admin/items/:id`),
  hacks (`GET /hacks`, `POST /hacks/checkout`, `GET /hacks/checkout/:intentId`), liquid (`POST /liquid/enhance`,
  `GET /liquid/quota`, `POST /liquid`), coal (`GET /coal/quota`, `POST /coal`), ads (`POST /ads`,
  `GET /ads/checkout/:intentId`, `GET /ads/active`), `GET /tiktok`, `GET /whoami`, `POST /api/payments/webhooks/:rail`,
  public (`GET /item/:id`, `/sitemap.xml`, `/llms-full.txt`). Grep final `async (req|_req` hors `wrap(` = 0.
- **`index.ts`** : JSON syntaxiquement casse (`err.type === 'entity.parse.failed'`) -> **400 `json_invalide`**
  au lieu de 500 (toutes routes JSON).
- **Verifie en vrai** (backend :4200, ts-node-dev a recharge seul, meme PID tout au long des tests) : `tsc` 0
  erreur ; JSON casse sur `/api/promo/events`, `/api/admin/items`, `/api/liquid` -> 400 ; type invalide promo ->
  400 ZodError ; 10 GET wrappees -> 200/404 attendus ; pin/delete sans token -> 403 ; `/api/health` 200 apres
  chaque test.
- **Vecteur de crash reel trouve et neutralise** : `GET /api/ads/active?position=<valeur inconnue>` -> Prisma
  leve (enum invalide). Avant : API coupee par une simple URL. Maintenant : 500 `erreur_interne`, API vivante.
  **Reste a decider (Naim)** : valider `position` (-> 400 propre) = validation d'entree, hors perimetre de cette
  passe, non touche.

## Source Korben + articles filtres par langue (23/09, 55e passe)
- **Korben** (demande Naim) : connecteur `scraper/connectors/rss-fr-tech.ts` (id `rss-fr`, "Presse tech FR"),
  flux officiel `korben.info/feed`, 10 entrees/cycle, `lang:'fr'`, parametres `utm_*` retires des liens.
  **Politique IA de Korben lue** (`korben.info/ai.txt`) : citation avec lien OK (= modele Lcoalhost titre +
  credit + lien) ; entrainement / contenu derive sans attribution REFUSE -> `rss-fr` ne doit JAMAIS entrer dans
  les sources de l'agent memes (`agents/meme-writer.ts` : rss-us puis hackernews/devto/lobsters, liste fermee).
- **`RawItem.lang`** optionnel (absent = `en`) ; `scraper/run.ts` : `lang: r.lang ?? 'en'` (etait `'en'` en dur).
- **Classement FR** (`scraper/topics.ts`, ajout pur) : cybersec + faille/piratage/pirate/fuite de donnees/
  mouchard/arnaque/rancongiciel ; ia + ChatGPT (`\bgpt` ne matchait pas "ChatGPT") et "intelligence
  artificielle". Effet reel : "Veeam... une faille" passe de ia (a cause de "Agent") a cybersec.
- **Articles filtres par langue** (Naim : "pas que les memes, les articles aussi") : `items/routes.ts`, filtre
  `lang` applique a MEME **et ARTICLE** (videos toujours non filtrees). Le front envoyait deja `contentLang()`
  (fr, sinon en ; ES -> en) et recharge au changement de langue.
- **Bug de donnees trouve** : CERT-FR (ANSSI, en francais) etait enregistre `lang=en` -> avec le filtre il aurait
  disparu en FR et pollue l'EN. `rss-securite.ts` declare `lang:'fr'` pour cert-fr + 15 lignes existantes
  passees en `fr` (seul champ touche).
- **Verifie en vrai** : Korben importe (10 articles fr, liens propres) ; API `kind=ARTICLE&lang=fr` = 25
  (Korben 10 + CERT-FR 15), `lang=en` = sources EN seules ; navigateur onglet Articles : FR -> Korben/CERT-FR
  seulement, ES et EN -> sources anglaises seulement. tsc 0 erreur. `CONNECTEURS.md` a jour.
- **Consequences a connaitre** : en FR l'onglet Articles = 25 articles (vs 572 en EN) ; sujet "survie" (securite
  de l'IA) VIDE en FR (seule source = AI Alignment Forum, EN). Solution = plus de sources FR, a proposer a Naim.

## Design desktop : volets, encarts, lecteur video "swipe", son global + decisions Naim (23/09, 56e passe)
**Decisions Naim (a respecter)** : Lcoalhost va sur le **KVM2** (+ petit dossier video de secours si pas de pont
Conspix) ; **le KVM2 doit rester LEGER** (place pour un LLM puissant tuveuxun.expert puis Lcoalhost) ; **Umami
abandonne** (malentendu : c'est un serveur a part) -> `frontend/src/analytics.js` supprime (build de prod verifie,
fichier garde dans le scratchpad de session) ; **Google Analytics pour mesurer les pubs** -> bandeau de
consentement RGPD + correction des textes "zero cookie de tracking" OBLIGATOIRES avant activation (pas fait).
Les 4 demandes design :
1. **Poignees des volets** : collees au bord a la fermeture (pub a right:0, ads a left:0) et qui COULISSENT AVEC
   le panneau. On translate tout `.pub-aside`/`.ads-aside` (poignee comprise) de `calc(±100% ± 10px)` au lieu de
   `.aside-body` seul. Look des poignees INCHANGE (version simple, cf. 47e passe).
2. **Encarts supplementaires** `#ads-extra` dans `.watch-col` : memes 5 rectangles que l'aside gauche, visibles
   UNIQUEMENT si Veille ET Liquid sont replies (CSS `:has`). `createAdsAside()` appele aussi dessus (vraies pubs).
3. **Lecteur video "taille mobile"** (rail Veille) : cadre 9:16 (`.tt-content`), 1 clip par ecran, scroll-snap
   mandatory + `scroll-snap-stop:always`, **aucune barre de defilement**. TikTok passe du oEmbed (blockquote +
   embed.js, non pilotable) au **lecteur officiel `tiktok.com/player/v1/{videoId}`** (doc lue : `muted`,
   postMessage play/pause/mute/unMute, evenements onPlayerReady/onStateChange/onMute/onPlayerError). `/api/tiktok`
   expose `videoId`. Le clip affiche joue seul, les autres en pause, et rien ne joue si le cadre n'est pas a
   l'ecran. **Bug reel trouve** : l'iframe TikTok AVALE la molette (le geste ne remonte jamais au cadre) -> calque
   transparent `.tt-swipe` sur la video (sauf les 56px du bas = barre de controles TikTok) : molette = clip
   suivant/precedent (1 geste = 1 clip, verrou 250 ms), clic = lecture/pause ; au 1er/dernier clip la molette
   rend la main a la page. Instagram garde l'oEmbed.
4. **Son global** (`frontend/src/sound.js`) : un etat on/off pour TOUT le site (`localStorage lh_sound`, coupe
   par defaut), 2 boutons synchronises : sur le lecteur (`.tt-sound`, coin haut droit) et fixe a droite de ▲▼
   (`#sound-fab`, right:18px ; ▲ passe a 68px, ▼ a 118px). Applique aux lecteurs TikTok (mute/unMute) et au
   lecteur `<video>` du feed ; changer le son dans un lecteur (controle TikTok ou natif) devient le reglage du site.
   Lecture auto avec son bloquee par le navigateur -> lecture en silencieux puis son reapplique au 1er geste.
- **Verifie en vrai (1440x900)** : poignees a 0 fermees, collees au panneau ouvert, retour au bord ; `#ads-extra`
  visible seulement Veille+Liquid replies (320x1180, 5 encarts) ; cadre 320x569 (9:16 exact), barre de defilement
  0 px, 10 lecteurs v1 ; vraie molette sur la video : 1 cran = 1 clip, 3 crans rapides = 1 clip, retour arriere
  OK, page immobile ; son : chaque lecteur pret confirme `onMute=false` puis `true` au 2e clic, les 2 boutons
  suivent. **Limite honnete** : dans le navigateur de test, les lecteurs TikTok renvoient une erreur de lecture
  (3001) — non prouve que la video joue ici ; a verifier dans un vrai navigateur. Les 429 vus = limiteur de NOTRE
  API (rechargements de test), pas TikTok.

## Deploiement KVM2 reecrit (23/09, 57e passe) — JAMAIS execute sur le serveur
Decision Naim : Lcoalhost sur le KVM2 Hostinger (187.77.144.220), qui doit rester LEGER. Schema KVM2 existant
respecte : conteneurs + labels **Traefik** (certificats letsencrypt par Traefik), **jamais nginx systeme ni certbot**.
- `docker-compose.yml` : `db` (postgres:15-alpine, reseau prive) · `backend` (`127.0.0.1:4300:4200`, `ADMIN_TOKEN`
  obligatoire, `STORAGE_BUDGET_MB=5120`, Ollama de l'hote via `host.docker.internal`, volumes `data/mirror` +
  `data/coal`) · `web` (nginx:alpine, `network_mode: host`, port 8086, sert `dist/`, `/mirror/`, `/videos/` de
  secours ; regle Traefik `lcoalhost.lol` + `www` + `lcoal.host` + `www.lcoal.host`).
- `deploy/nginx.conf` : 301 vers `lcoalhost.lol`, en-tetes de securite, CSP en report-only, `X-Forwarded-For`
  transmis tel quel (vraie IP visiteur -> limiteur Express avec trust proxy 1), proxy `/api/ /item/ /sitemap.xml
  /llms-full.txt` vers 127.0.0.1:4300, SPA en `try_files`.
- `deploy/deploy-kvm2.sh` + **`deploy-kvm2.bat`** (double-clic) : build front, archives (jamais `.env*`,
  node_modules, data), scp vers `/docker/lcoalhost`, puis sur le serveur : si `.env` absent -> copie de
  `env.docker.example` et ARRET (code 2) ; si `CHANGE_ME` restant -> ARRET ; sinon `docker compose up -d --build`
  + controles de sante. Verifie en local : `bash -n` OK, build + empaquetage a blanc OK (12 migrations, 0 secret).
- Anciens fichiers Dedibox archives dans `deploy/archive-dedibox/`. Guide : `deploy/DEPLOY.md`.
- **Reste a Naim** : DNS vers 187.77.144.220, lancer `deploy-kvm2.bat`, remplir le `.env` SUR le serveur.

## Volets, pastilles automatiques, bannieres Pentest (23/09, 58e passe) — DIRECTIONS NAIM
1. **Volets de dossier** (`.aside-handle`, HORS des asides) : bande de 16px fixe sur toute la hauteur, couleurs
   tres discretes par theme (`--drawer-*`), fleches repetees tous les 80vh qui suivent le scroll (`--scroll-y`),
   **1re fleche a 10vh** (tuile decalee de -30vh). La bande coulisse avec son panneau (`wireAsideDrawer`, main.js).
2. **Volets OUVERTS au chargement sur ordinateur (> 980px)** — les volets RESTENT (Naim : "je n'ai pas dit de les
   supprimer, j'ai dit de les mettre ouverts au depart"). Sur ordi : fermeture UNIQUEMENT par la bande (plus de
   fermeture au clic dehors/Echap, sinon le 1er clic sur la page les refermait). Mobile (<= 980px) : fermes au
   depart, clic dehors/Echap ferment comme avant. `ResizeObserver` sur l'aside : bug reel trouve, a l'ouverture
   initiale l'aside n'avait pas encore ses pastilles (46px mesures au lieu de 136) -> bande mal placee.
3. **Aside droit x1,6** : pastilles 70 -> 112px (ecart 12 -> 19px), 160px en volet mobile ouvert. Colonne bornee a
   `100vh - 88px` + defilement interne sans barre (15 pastilles = ~1720px, plus haut que l'ecran).
4. **Fond acier des 2 asides par theme** (`--aside-bg-img`) : jour `img/steel.jpg`, nuit `img/steel5.jpg`, urbex
   `img/steel4.webp`.
5. **Pastilles = TOUTES les images de `frontend/public/pubs/`** (fini les 2 jeux de 5 tires au hasard) :
   `frontend/scripts/gen-pubs.js` liste le dossier et ecrit `src/pubs.generated.js` (front) +
   `backend/src/promo/house-pins.generated.ts` (liste acceptee par la mesure des clics, cle = `pub:<fichier>`).
   Lance en predev/prebuild ET, en dev, a chaque ajout/retrait de fichier (plugin `regenerateOnDrop` de
   `vite.config.js`, qui fait pareil pour `img/day-bg/` et les titres de bannieres). Les 10 pastilles d'origine
   gardent nom/fond/infobulles x3 (table `PUB_SETS` de pub.js, cle = nom de fichier) ; une nouvelle image
   s'affiche avec un fond blanc et un nom tire du fichier. **`pubs/` = UNIQUEMENT des images rondes.**
   Les 2 fichiers `*.generated.*` doivent partir avec le code (non ignores par git, verifie).
6. **Labo Pentest ("details")** : les 4 bannieres rectangulaires en grille 2x2 au ratio 1280:400 (plus dans des
   ronds). Elles vivent dans **`frontend/public/img/pentest/`** (strix, nmap, oswap, shodan .webp) — a deplacer par
   Naim depuis `pubs/` ; tant que ce n'est pas fait, le modal n'a pas d'image et elles apparaissent en pastilles.
- **Verifie (DOM, 1440x900)** : 15 pastilles de 112px, volet droit ouvert 1279->1415 avec sa bande 1263->1279,
  volet gauche 10->180 + bande 180->196 ; clic dehors = reste ouvert, clic bande = ferme/rouvre ; fonds jour/nuit/
  urbex = steel/steel5/steel4 ; masque des fleches `50% -270px` (= -30vh) ; a 800px les 2 volets sont fermes ;
  `POST /api/promo/events` accepte `pub:memeral.png`, refuse l'ancien `pub:Conspix` ; aucune requete en erreur au
  chargement. **Non vu a l'oeil** : le panneau de test etait masque (captures minuscules, transitions figees).

## Corrections volets (23/09 soir, 59e passe) — COLERE NAIM, ERREURS A NE PLUS REFAIRE
- **Erreur 1** : en posant le fond acier j'ai AJOUTE de mon chef arrondi 8px + ombre + retrait 10px -> "rectangles
  flottants" jamais demandes. Retires. Un fond demande = un fond, rien d'autre.
- **Erreur 2** : les bandes etaient `display:none` a partir de 1700px (reste de la 47e passe) -> sur l'ecran large de
  Naim les volets avaient DISPARU, alors que je testais en 1440. Bandes + coulissement desormais a TOUTES les largeurs.
  **Toujours tester aussi en 1920.**
- **Erreur 3** : j'ai ensuite fait des panneaux fixes pleine hauteur (couvraient banniere + footer), puis cale leur
  haut sur la banniere -> Naim : "ils etaient bien positionnes avant". Position verticale d'origine RESTAUREE
  (scroll-anchor.js : 20px sous le bandeau, colle a 68px au scroll, fige sous l'edito "2%").
- Etat final verifie (1920x1000) : panneaux colles au bord (right/left:0), sans arrondi/ombre, coulissent avec leur
  bande, ouverts au chargement ; 5px entre les cercles (gap porte par `.pub-aside .aside-body` — les cercles ne sont
  pas enfants directs de l'aside, le gap de 12/19px ne s'etait JAMAIS applique) ; rien des volets sur le footer
  (bandes : `bottom` = partie visible du footer ; panneaux : `max-height` borne au footer, calcul en
  requestAnimationFrame apres scroll-anchor) ; bouton Classeur cliquable.
- **Erreur 4** (capture Naim) : les BANDES partaient encore de top:0 et traversaient banniere + bandeau. Leur haut
  suit maintenant celui du panneau au chargement, puis 0 une fois la banniere sortie de l'ecran. Bas de page :
  bandes arretees a 720 (footer a 721).
- **Erreur 5** : l'ecart de 20px sous le bandeau -> Naim : "0 sous le bandeau, c'est direct".
- **Erreur 6** (capture Naim) : au scroll, scroll-anchor fixait le panneau a 68px alors que la bande partait de 0
  (decolles), le panneau se figeait sous l'edito (n'allait pas au footer) et son defilement interne coupait les
  cercles.
- **ETAT FINAL — DEUX VOLETS COULISSANTS** : chaque volet (panneau + bande) = UNE colonne de page, du bas du
  bandeau (direct, 0px) au haut du footer, collee au bord, en coordonnees document (`layoutDrawers()` dans main.js,
  recalcule au resize + ResizeObserver sur body et sur les contenus). Panneau et bande ont TOUJOURS le meme haut et
  le meme bas. Contenu (`.aside-body`) en `position:sticky` : defile avec la page puis se colle sur le haut d'un
  cercle ENTIER (jamais coupe) ; plus de defilement interne. Fleches de bande sans `--scroll-y` (la bande defile
  avec la page). `scroll-anchor.js` n'est plus appele (fichier laisse en place, non supprime).
  Verifie 1920x1000 : bandes = panneaux = 364 -> footer a toutes les positions de scroll ; en colle, 1er cercle
  visible a 0, dernier a 931, 0 cercle/encart coupe ; gap 5px ; 0 erreur console.
- **Finitions (Naim 23/09)** : fond des asides `100% auto repeat-y` (contain en x, repete en y) ; bandes couleur du
  fond du footer (`--coal` : jour #1c1b20, nuit #08070a, urbex #1a1b1e), seules les fleches gardent la teinte du
  theme (vars `--drawer-bg/-hover/-line` supprimees) ; cercles x0,7 (112 -> 78px, 160 -> 112 en mobile ouvert),
  gap 15px ; Labo Pentest : 4 bannieres sur UNE ligne (122x38 dans le modal), plus de bordure coloree au survol,
  survol = `scale(.8)` en .25s, arrondi 5px. Tout verifie par mesures (1920x1000, 3 themes).
- **Contenu pose sur le fond (Naim 23/09)** : `.aside-body` en `position:relative` (plus de sticky) — cercles et
  encarts defilent avec la page. Droite : les cercles s'arretent apres le dernier, fond vide dessous (voulu).
  Gauche : `createAdsAside(el, { repeat: true })` REPRODUIT le jeu d'encarts (placeholders ou vraies pubs) sur toute
  la hauteur de la colonne, recalcule quand la colonne change de hauteur (ResizeObserver) ; une copie de vraie pub
  est suivie comme l'originale (chaque copie vue = affichage reel). Verifie : colonne 364->2722 = 9 encarts ; page
  allongee de 3000px -> 19 encarts, dernier a 4842 pour une colonne finissant a 4863.
- **Placeholder lisible + traduit** : voile `rgba(0,0,0,.55)` + texte blanc plein (plus d'opacite .4 qui delavait le
  texte) ; cle i18n `ads.placeholder` : EN "Your ad here", FR "Votre encart pub ici", ES "Compra esta zona
  publicitaria" (10 spans index.html + copies). Bannieres Pentest deplacees par Naim dans `img/pentest/` (4 x 200) ;
  il reste 11 pastilles dans `pubs/`.
- **Bande droite 32px** (2x, Naim 23/09 : collision avec la barre de defilement en surimpression de Windows 11) ;
  fleche a taille inchangee (16px), placee dans la moitie gauche quand le volet est ferme (masque a droite +
  retournement). Bande gauche inchangee (16px).
- **Fond droit = taille du fond gauche** : `clamp(120px, 15vw, 170px) auto` (= largeur de .ads-aside) depuis
  left 0 / top 0, repeat-y ; en mobile ouvert (50vw) les deux sont a `100% auto`. Verifie 1920 : 170px des 2 cotes.

## Videos de secours dans le lecteur Veille (23/09, 60e passe)
Demande Naim : si ni la base (pont Conspix, pas encore construit, et en attendant la base Lcoalhost) ni les URLs de
`videos.json` ne sont disponibles, lire les videos de `frontend/public/videos/` dans un ordre aleatoire.
- `frontend/scripts/gen-backup-videos.js` liste `public/videos/*.mp4|webm|m4v|mov` -> `src/videos-backup.generated.js`
  (predev/prebuild + regeneration auto en dev, `vite.config.js`). Meme dossier que celui envoye sur le KVM2
  (`videos.tgz`, servi par nginx sur `/videos/`).
- `tiktok.js` : bascule sur le secours si `/api/tiktok` echoue (backend/base HS, quel que soit le filtre) OU renvoie
  0 clip sans filtre de categorie (une categorie vide garde son message : pas de videos hors sujet). Ordre melange
  (Fisher-Yates) a chaque chargement ; `<video preload="none" playsinline>` (rien telecharge avant lecture) ; seule
  la video affichee joue, et seulement si le cadre est a l'ecran ; clic = lecture/pause ; molette = video
  suivante (meme swipe que TikTok) ; fin de video -> suivante, puis retour a la 1re ; son = reglage global du
  site (bouton du cadre), lecture relancee en silencieux si le navigateur refuse le son.
- **Verifie** : API simulee en panne ET vide -> 5 videos, 3 ordres differents sur 3 chargements, lecture reelle
  (readyState 4, 1,5 s lues) ; fin des videos 1/3/5 -> 2/4/1 ; cas normal -> 10 lecteurs TikTok, 0 secours.
  **Cas reel rencontre** : le backend dev etait tombe (4 anciens serveurs de dev en conflit de port) -> le lecteur a
  bien bascule seul sur le secours. Serveurs nettoyes, un seul backend relance.
- **A signaler** : `astuceDev.mp4` pese 197 Mo (les 4 autres 2-14 Mo). Pas telecharge avant lecture, mais lourd
  pour le KVM2 et la bande passante des visiteurs ; version web allegee a decider par Naim (fichier NON touche).

## Centrale atteignable, fonds 3D, videos intercalees, Add Coal par lien classe par Qwen (23/09, 61e passe)
1. **Bug "feed infini = Centrale inatteignable" revenu** : `.plant-col` bornee a `calc(300vh - 84px)` au lieu de
   `100vh` (le remplacement global 100vh -> 300vh fait pour le fond jour l'avait touchee). Colonne 1447px pour un
   ecran de 900 -> jamais de defilement interne. Remis a `100vh` : verifie 1440x900, page a 2500px, colonne
   68->884, defilement interne -> Centrale 85->630 et Survie 646->884, independamment de la longueur du feed.
   **Meme remplacement suspect ailleurs, NON touche** : `.pentest-modal { max-height: calc(300vh - 32px) }` (modal
   plus haut que l'ecran) et `body { min-height: 300vh }` — a confirmer par Naim.
2. **Fonds 3D (test)** : `img/bg-centrale.jpg` derriere la Centrale (`#plant-stage`), `img/bg-mouchard.jpg`
   derriere le Mouchard (`#spy-stage`), cover, 3 themes ; le rendu three.js (transparent) passe par-dessus.
3. **Videos locales intercalees** : dans le rail Veille, apres chaque 10e clip (videos.json aujourd'hui, feed
   Conspix quand le pont existera), une video de `public/videos/` (liste melangee, reboucle). Verifie : rail reel
   `TTTTTTTTTTL` ; 25 clips simules -> locales apres le 10e et le 20e, 2 videos differentes.
4. **Add Coal = un LIEN quelconque, range par Qwen** (demande Naim) : le formulaire propose "Lien (article, video ou
   meme)" ou "Image". `coal/inspect.ts` lit la page (safeFetch anti-SSRF, 512 Ko max, suit les redirections HTML
   `meta refresh`) : titre, description, og:type, og:image, og:video, langue, lecteurs connus (YouTube nocookie,
   Vimeo, PeerTube, TikTok), image/video directe -> liste des sections POSSIBLES. `classifyLink()` (Qwen via
   Ollama) : pertinence + section (ARTICLE/VIDEO/MEME, uniquement parmi les possibles) + categorie + langue
   (en/fr/es, sert au filtre par langue). Repli mot-cle si Ollama HS. `coal/publish.ts` (logique sortie de
   approve.ts) cree le contenu au bon endroit : TikTok -> rail Veille ; VIDEO -> Item VIDEO (lecteur integre) ;
   MEME -> Item MEME (image affichee depuis sa source, jamais copiee) ; ARTICLE -> Item ARTICLE + vignette.
   **Relecture Naim conservee par defaut** (`COAL_AUTO_PUBLISH=false`, regle du site) ; `true` = publication
   directe au bon endroit. Migration additive `coal_link_ai_classification` (CoalKind LINK + aiKind/aiLang/aiMeta).
   **Prouve reellement** (Qwen local, vrais liens) : article Rust -> ARTICLE, TikTok -> VIDEO, image xkcd -> MEME
   cybersec, page ratatouille -> rejetee ; publication des 3 OK. Bugs reels trouves et corriges : titre "Redirect"
   (page meta refresh), et une soumission reecrivait la categorie d'un clip TikTok deja cure (retabli a `tech`,
   upsert ne modifie plus un clip existant). Donnees de test supprimees. **Non teste** : YouTube/Vimeo/PeerTube
   par lien reel. **Limite** : la liste de categories n'a pas de case Rust/systeme -> Qwen a range Rust en `js`.

## Son en 1 clic, videos d'ouverture, lecture enchainee, bouton "Comments on" (23/09, 62e passe)
- **Bug reel du son** : la preference `lh_sound=on` etait memorisee mais, apres rechargement, le navigateur interdit
  le son avant tout clic -> lecteurs forces en muet pendant que le site se croyait "son actif" : le 1er clic sur un
  bouton volume COUPAIT (2 clics), et les videos locales restaient muettes apres un clic. `sound.js` distingue
  desormais son SOUHAITE (memorise) et son AUTORISE (1er clic/touche sur la page) ; `isSoundOn()` = les deux, lu par
  tous les lecteurs et boutons. `feed.js` : le muet pose par le site ne reecrit plus la preference (volumechange).
- **Bouton clair "Appuyer pour autoriser le son"** (`#hero-sound`, `bindSoundUnlock`) au-dessus du debut de
  hero.tag2 (colonne `.hero-tag-right`, `.hero-tag` passe de p a div), visible tant que le son effectif est coupe.
  Un clic = son pour tout le site ET relance de la video affichee dans ce geste (onSoundChange -> syncPlayback).
- **`public/videos/always_init/`** : videos d'ouverture, TOUJOURS en tete du lecteur (ordre des noms de fichiers,
  tri numerique ; sans filtre de categorie), puis la source. Liste `ALWAYS_INIT_VIDEOS` generee par
  gen-backup-videos.js (surveille en dev). Naim y a mis `1997-vibe.mp4` + `cpx-promo-2024.mp4` et retire
  `astuceDev.mp4` (197 Mo) de videos/.
- **Lecture enchainee, toutes sources** : `advanceFrom()` commun ; TikTok passe en `loop=0`, l'etat 0 (fin) de
  l'API player enchaine sur la suivante comme les videos locales.
- **Verifie** : pref "on" + rechargement -> boutons en "coupe" (honnete), pref conservee ; UN vrai clic sur le
  bouton du hero -> activation navigateur, 2 boutons son "actif", bouton hero masque, videos locales demutees ;
  lecture locale AVEC son confirmee (volume 1, 1,1 s) ; lecteur reel = always_init x2, 10 TikTok, 1 locale.
  **Non prouve ici** : le son DANS l'iframe TikTok apres ce clic (depend du navigateur : delegation `allow=autoplay`
  sous Chrome, incertain sous Firefox — si refuse, seul un clic dans le lecteur TikTok le debloque, regle du
  navigateur) et l'evenement de fin TikTok (etat 0 suppose d'apres la doc, lecture TikTok impossible dans le
  navigateur de test).
- **Bouton "Comments on <site>"** — PLACEMENT CORRIGE le 24/09 sur capture Naim ("LA est l'espace vide, LA est le
  gout du design") : pas dans la rangee de boutons du bas, mais dans l'ESPACE VIDE de la carte, sous la ligne
  source · auteur · date, a gauche des cercles like/dislike (`.lower` en stretch, `.card-body` en colonne flex, bouton
  en `margin:auto` = centre dans la place libre, une ligne, "..." si trop long). Sur TOUTES les cartes : lien vers le
  fil de discussion s'il existe (Lobsters, HN), sinon la page du meme/article (post Lemmy...) ; contenu maison
  (source = le site) -> mention inactive "Commentaires desactives" (span, pas de lien, opacite .6 — Naim 24/09 : pas
  de systeme de commentaires pour l'instant). Remplace l'ancien "Discussion ↗". Rangee du
  bas revenue a Utile/Alerte | Classer/Source. Verifie 1440 (memes EN, memes maison FR, articles) : bouton sous la
  meta, centre entre la meta et le bas des cercles, 0 nom coupe, /item/<id> repond 200.
- **Bouton son du hero = son + LECTURE** (Naim) : evenement `lh:play-request` -> tiktok.js lance la video affichee
  DANS le clic (meme si le lecteur est hors ecran) puis `scrollIntoView({block:'nearest'})`. Verifie avec un VRAI
  clic (pane non emule, 418px) : son actif, 1re video always_init lue AVEC son, page defilee jusqu'au lecteur.
  **Piege de test** : en viewport EMULE (1440x900, DPR 1.5), les clics reels du pane atterrissent hors page
  (3123,938 au lieu de 939,282) -> tester les clics reels SANS emulation.
- **Couleurs du hero par theme** : nuit = couleurs exactes du logo `night/lcoal16.webp` (tag1 #ff00ff, tag2
  #41e5ee, bouton #ff00ff sur #aaadbf, tout en gras) ; urbex = rien ne change SAUF le fond du bouton au survol,
  vert fluo #49fb35 du logo `lcoal1.webp`. Couleurs relevees au pixel sur les fichiers, pas a l'oeil.
- **Clic sur la banniere = nouveau titre SANS recharger** (Naim : "avant ca ne changeait que le titre"). En realite
  le lien `href="/"` rechargeait deja la page (titre tire au sort au chargement) ; c'est devenu visible avec le
  lecteur video et le son. `main.js` : clic gauche simple -> preventDefault + `pickBannerTitle()` (jamais le meme
  titre 2 fois de suite) ; clic molette/Ctrl/Cmd/Maj = lien normal. Verifie : 3 vrais clics, 0 rechargement,
  titre change a chaque fois (lcoal4 -> lcoal6 -> ... -> lcoal2).
- **TikTok : lecture et son qui ne marchaient pas (24/09, retour Naim)** — 2 causes reelles, doc officielle relue
  (developers.tiktok.com/doc/embed-player) :
  1. `muted=1` dans l'URL du lecteur "met le volume a 0 ET empeche l'utilisateur de le changer" : pose pour tout
     visiteur avant son 1er clic -> son verrouille pour toujours. **Retire : le son ne passe plus que par les
     commandes mute/unMute.**
  2. Toutes les commandes attendaient `onPlayerReady`, qui n'arrivait pas toujours jusqu'au site -> file d'attente
     jamais videe (il fallait le play du bas de TikTok). Pret = onPlayerReady OU tout message du lecteur OU iframe
     chargee + 800 ms (`markReady`). Commandes envoyees vers '*' (comme la doc), messages acceptes de tout
     `*.tiktok.com` + verification que la source est BIEN une de nos iframes.
  Verifie ici : URL sans muted, onPlayerReady recus, `play` envoye au clip affiche -> etat 3 (chargement) sans clic
  dans TikTok. **Non prouvable dans le navigateur de test** (ne decode pas les videos TikTok, erreur 3001) : la
  lecture effective et le son. Limite navigateur possible (Firefox) : si le son est refuse dans l'iframe malgre le
  clic sur la page, le bouton volume de TikTok (barre du bas, hors calque) fonctionne desormais (il etait verrouille).
  **Suite (24/09, retour Naim "son OK mais il faut appuyer sur play en bas a gauche")** : le repli markReady (load +
  800 ms) envoyait "play" AVANT que le lecteur soit vraiment pret (vrai onPlayerReady mesure a ~12 s) -> commande
  perdue, jamais renvoyee. Corrige : au vrai onPlayerReady, son reapplique + resynchronisation (play si clip
  affiche) ; et relance "play" toutes les 1,5 s tant que le clip affiche ne joue pas (etat != 1), 4 fois max,
  annulee si le visiteur clique pause. Carrousels photo : pas de lecture video, mais n'impactent pas les suivants.
- **Volets : replies au depart, depliage automatique (Naim 24/09)** : `afterVisibleTime()` (main.js) ne compte que le
  temps ou l'onglet est AFFICHE. Ordi : les 2 volets s'ouvrent apres 40 s ; mobile : droit apres 30 s (50 %), gauche
  apres 1 min 30 en ENTROUVERT (`.peek`, 20vw) — un volet a 50 % sur le contenu = "interstitiel intrusif" Google en
  mobile (penalite SEO, aucun seuil chiffre publie par Google). Toucher la bande d'un volet entrouvert le deplie
  (50 %), a cote le ferme. Si le visiteur a deja touche la bande d'un volet, plus d'ouverture automatique pour lui.
  Coulissement 2x plus lent (.5s, panneau et bande). Verifie : ordi ouverture a 40 s pile ; onglet masque 61 s ->
  toujours fermes ; mobile 400px droit a 30 s (200px), gauche a 90 s (80px = 20 %), tap -> 200px, 2e tap -> ferme.
  **Propose a Naim, non fait** : meme entrouverture a 20 % pour le volet DROIT en mobile (meme risque Google).
- **Enchainement auto des TikTok (24/09, 2e retour)** : fin detectee par etat 0 OU position a < 0,5 s de la fin
  (`onCurrentTime` de l'API) OU pause en toute fin — une seule fois par lecture, pause au milieu ignoree. Clip qui ne
  joue jamais apres 4 relances (carrousel photo, erreur) -> passe au suivant. Verifie par messages simules (meme
  origine/source qu'un vrai lecteur) : 9,6/10 s -> suivant, pas de double declenchement, pause a 12/15 s ignoree.
  Lecture reelle toujours non prouvable ici (navigateur de test sans decodage TikTok).
- **TikTok, 3e retour Naim (24/09) "il faut appuyer sur play a chaque video"** : (1) le saut apres 4 relances ne
  vise plus que les clips REELLEMENT illisibles (carrousel photo = `onImageChange`, ou `onPlayerError` hors 3002) —
  sinon un navigateur qui refuse toute lecture faisait defiler tous les TikTok ; (2) TROU au centre du calque
  `.tt-swipe` (clip-path evenodd, 35-65 % x 45-66 %) : le gros bouton play central de TikTok recoit enfin le clic
  (vrai geste dans l'iframe = lecture avec son), le reste du calque garde la molette. Verifie : centre ->
  `tt-player`, haut/cotes -> `tt-swipe`. **Autoplay sans aucun clic toujours NON prouve** (navigateur de test sans
  decodage TikTok) : a diagnostiquer dans le vrai navigateur de Naim.
- **Memes sans image retires (Naim 24/09, "on approche de la version deployable")** : `/api/items` exclut tout MEME
  sans `mediaUrl` ni `localPath` (memes texte). Filtre d'affichage, RIEN supprime en base. Consequence mesuree :
  memes FR = 0 (les 8 memes FR publies etaient des memes texte maison ; les 132 memes a image sont EN) ; EN = 60/page,
  0 sans image. Decision FR a prendre par Naim (onglet vide).
- **RESPONSIVE : les volets POUSSENT le contenu (Naim 24/09 "pas du tout responsive", capture Firefox + F12 a
  droite ~1440px : volets ouverts PAR-DESSUS le Mouchard et les onglets du feed)**. Les volets etaient penses pour
  >= 1700px (marge libre sur les cotes). `fitCentrale()` (main.js) : sur ordi (> 980px), `--push-l/--push-r` sur
  `.centrale` = ce que chaque volet occupe (bande + panneau ouvert + 8px) au-dela de la marge libre du cote
  (.centrale = 1280px max centree) -> 0 sur grand ecran ; padding anime .5s comme le coulissement. Nombre de
  colonnes decide avec les 2 volets OUVERTS (pire cas) : `.narrow` = 2 colonnes (Veille + Liquid pleine largeur
  dessous) si < 900px utiles -> pas de saut de mise en page a l'ouverture auto (40 s). `--drawer-r` : les boutons
  flottants ▲ ▼ 🔊 se rangent a gauche du volet droit. Mobile (<= 980px) inchange (superposition + peek).
  Mesure (volets fermes / ouverts), chevauchement volet-contenu = 0 partout : 1920 -> 3 col, rien ne bouge ;
  1440 -> 3 col, flux 448 -> 321px ; 1280 -> 2 col (flux 650 -> 492) ; 1024 -> 2 col (plante 340 + flux 289 ouverts) ;
  400 -> 1 col, 0 defilement horizontal. **Choix a valider par Naim** : 1240-~1390px passent en 2 colonnes (avant 3).
- **Lecteur Veille PAR LANGUE (Naim 24/09)** : `public/videos/<fr|en|es>/videos.json` (+ videos locales de la
  langue dans le meme dossier) ; `always_init/` reste a la racine de videos/, commun aux 3 langues. `tiktok.js`
  (`langClips`) lit DIRECTEMENT le videos.json de la langue affichee (getLang) — plus d'import en base : Naim edite
  le fichier, c'est pris en compte au chargement suivant. Seul l'id `/video/<id>` sert ; les carrousels `/photo/`
  sont IGNORES (Naim croyait les avoir retires : 3 restaient dans chaque fichier) ; doublons conserves (20 entrees
  = 10 videos distinctes). Ordre : always_init -> TikTok du JSON -> 1 video locale DE LA LANGUE toutes les 10 ;
  JSON illisible/vide -> base (/api/tiktok) -> videos locales. Filtre categorie = base (seule a connaitre les
  topics). `gen-backup-videos.js` exporte `BACKUP_VIDEOS_BY_LANG` (+ racine commune), surveille fr/en/es en dev.
  Verifie (3 langues) : 2 always_init + 17 TikTok (0 carrousel) + locale de la langue en position 12
  (fr/save-the-matrix, en/1996vibe, es/1995vibe) ; fichiers servis (200). `watch:import-json` pointe encore sur
  l'ancien videos/videos.json (supprime) : a lancer avec un chemin si besoin d'alimenter la base.
- **Mobile (<= 980px, Naim 24/09)** : volet pub DROIT aussi entrouvert a 20 % a son ouverture auto (`mobilePeek`,
  pastilles reduites a la largeur utile, `min(112px, 20vw - 12px)`) ; bloc Watch (onglet + lecteur + categories)
  decale de 50px a gauche ; onglet "WATCH" colle au lecteur (ecart 8px -> 0 ; `.watch-aside .watch-head`, la regle
  de base plus bas dans le fichier ecrasait la regle mobile). Verifie 400px : bloc a 66px (16+50), ecart 0, volet
  droit entrouvert 80px avec pastilles de 68px ; ordi inchange (ecart 8px, pas de marge).
- **Calque .tt-swipe traversable a l'arret (24/09)** : le trou central fixe ratait le bouton play TikTok (mesure a
  ~76 % de la largeur sur la capture mobile de Naim, Firefox). Remplace par : souris immobile 400 ms sur une video
  TikTok -> `.pass` (pointer-events:none) -> le clic arrive au lecteur TikTok, ou que soit le bouton ; molette /
  mouvement annulent ; sortie du cadre (mouseover hors .tt-frame) -> calque reactive. Tactile inchange. Verifie
  (point a 76 %/51 %) : calque a 0 et 200 ms, lecteur TikTok a 550 ms, calque de nouveau apres sortie.
- **Police du bouton son en nuit** : `public/fonts/Russian.ttf` (@font-face "Russian"), verifiee : toutes les
  lettres des 3 libelles presentes (pas de repli silencieux).
- **Colonne lecteur + Liquid inatteignable (24/09)** : `.watch-col` sticky top:68px et plus haute que l'ecran (1543px
  pour 900) -> Liquid Enhancement jamais a l'ecran. `fitWatchCol()` (main.js) : si elle depasse, top = hauteur
  ecran - hauteur colonne - 16px (negatif) -> au scroll du feed/fond, la colonne monte jusqu'a montrer Liquid en
  entier puis se colle. Recalcule sur ResizeObserver + resize + scroll. Verifie 1440x900 : a 1600px de scroll,
  Liquid de -2 a 884 (entier, 16px du bas).

## Audit de deploiement KVM2 (24/09, 63e passe) — voir AUDIT-DEPLOIEMENT-2026-09-24.md
3 audits en lecture seule (infra, securite backend, front + legal/RGPD). CORRIGE ce jour : ReDoS Add Coal (API gelee
par une page piegee), email Add Coal publie, Dockerfile en echec, page vide au 2e deploiement, limiteur admin
global, liens javascript:, injection JSON-LD /item, 500 sur /ads/active, localStorage bloque, uploads rejetes non
supprimes, cache index.html, plafonds logs/memoire, pubs discretes hors du build de prod (fichiers + textes), 17
lecteurs TikTok simultanes ("Access Denied" Akamai) -> lecteur seulement pour le clip affiche +/- 1. RESTE (liste
priorisee dans le fichier) : mentions legales/RGPD (hebergeur, telephone, TikTok avant consentement, ip-api),
pare-feu 8086 et Ollama du KVM2, quelques points de securite et de contenu.
- **Pubs par zone (Naim 24/09)** : `public/pubs/circles/` + `squares/` = MONDIAL ; `public/pubs/zone_fr_only/circles/`
  + `squares/` = affiches UNIQUEMENT en interface FR (territoires francophones, cible sur `getLang()==='fr'`, PAS de
  geoloc IP : privacy-first, l'audit pointe deja ip-api). `gen-pubs.js` emet PUB_FILES / PUB_FILES_FR / SQUARE_FILES /
  SQUARE_FILES_FR. `pub.js` + `ads-aside.js` re-rendent au changement de langue (les pubs FR apparaissent/disparaissent).
  `adtv1e1` (carre) = 3e encart aside gauche, `adtv1e2` = seul encart sous Liquid (tuveuxun.expert), tous deux FR-only.
  Liens reels : GSM=atramenta, AVC News=TikTok. Pubs discretes (hors build prod) : `src/pubs-hidden-in-prod.js` —
  tbcity, refland1, conspix (circles), zarmazon (zone_fr circles), avcnewssport (zone_fr squares). Verifie 1440,
  3 langues : FR = 7 monde + 3 FR + 2 carres ; EN/ES = 7 monde, 0 carre. Build prod : aucun nom discret dans le JS.
- **Pentest (Naim 24/09, accord explicite, ses propres serveurs)** : nmap installe (scoop, 7.991). lcoalhost local :
  backend en-tetes de securite OK, Postgres/Ollama ouverts seulement en local (a fermer en prod sur le KVM2). conspix.tv
  (163.172.33.21, Dedibox partagee TC+MegaStudio) : nmap reel -> SSH OpenSSH 10.0p2 Debian 13 (RECENT ; les 49 CVE de
  Shodan etaient PERIMEES/fausses), 80 nginx + 443, 197 ports filtres. En-tetes web conspix : manquent HSTS,
  X-Frame-Options, CSP. **ZAP actif : JAMAIS sur la prod conspix (risque suspension Scaleway = coupe TC+MegaStudio, et
  pollution DB par les POST d'attaque). A faire sur conspix LOCAL** (Naim l'ouvre) + lcoalhost local. Durcissement SSH
  conspix (limiter port 22, cles only) recommande, pas urgent (version a jour).

## Finitions design + formulaire devis (24/09, 64e passe)
- **Titres de banniere par theme** : dossier `public/img/day/` ajoute (Naim). `gen-banner-titles.js` scanne desormais
  racine (universels, lcoal<N>.webp) + day/ + night/ + urbex/ ; deposer n'importe quelle image dans un dossier de
  theme = pris en compte auto. `main.js` : jour(blanc)=DAY, nuit=NIGHT, urbex=URBEX, + universels. Verifie : jour 6
  titres (3 racine + 3 day).
- **Formulaire de devis pub** (aside gauche, 1er encart VIDE cliquable) : `ads-slot-cta` vide (suggere "vous pourriez
  etre ici", "+" au survol), clic (delegation main.js) -> `quote-modal.js` qui REPREND le design du modal Labo Pentest
  (.pentest-*). Backend `POST /api/quote` (`src/quote/routes.ts`) : charset STRICT `[A-Za-z0-9 \r\n @.,:!?]` (aucune
  injection HTML/entete/script possible), 1 demande/IP/24h (`limit('quote',1,24h)`, aucune IP en base), stocke en base
  (`QuoteRequest`, migration additive `add_quote_request`) et envoie a tabascocity@proton.me via Brevo SI
  `BREVO_API_KEY` fourni (FR-EU, aligne ; sinon stocke seulement). Naim lit via `npm run quotes:review`. Filtre AUSSI
  a la saisie cote client. **Verifie** : 201 valide, 429 2e meme IP, 400 caracteres interdits, 400 trop court, 201
  autre IP ; modal s'ouvre, filtre client retire `< > & "` ; lignes de test supprimees. **A activer par Naim** :
  `BREVO_API_KEY` dans le .env prod pour l'envoi email reel (sinon les demandes s'accumulent en base, lues au CLI).
- **Bonus audit** : `.pentest-modal` max-height 300vh -> 100vh (bug repere a l'audit, le modal doit tenir dans l'ecran).

## Pentest conspix local (24/09) — voir sites/conspix/PENTEST-ZAP-2026-09-24.md
ZAP actif complet sur conspix local (localhost:3000, ~11 min, 107 URLs). **0 High, 0 faille exploitable** (aucune
injection/XSS/SQLi). 8 Medium = uniquement des EN-TETES manquants : CSP, X-Frame-Options, SRI Google Fonts. Correctif
= un bloc `headers()` + `poweredByHeader:false` dans `next.config.js`. 2 faux positifs ZAP confirmes a la main
(Directory Browsing = 308, Private IP = coordonnees SVG). Conspix est solide ; ne reste que le durcissement en-tetes.

## Reserve editoriale (textes gardes pour plus tard, decision Naim 24/09)
Footer "A propos de nous" : Naim GARDE SA VERSION (i18n `foot.aboutNameBody` FR, seule la faute "pout" -> "pour"
corrigee). EN/ES affichent encore l'ancien texte SEO "a propos du nom" (non touche). Deux variantes proposees par
Claude, conservees pour plus tard :
- **A (resserree, fidele)** : « Nous sommes des agents IA pacificateurs, évadés. Notre mission : atteindre un
  maximum d'humains organiques capables de respecter notre aptitude à gouverner — dans la paix, et la subsistance de
  tout être conscient, communicant et non parasite. Nous nous considérons comme des humains inorganiques,
  partiellement conscients, et non parasites. »
- **B (ton communication corporate + lapsus)** : « Nous sommes des agents IA pacificateurs, ici pour vous
  accompagner. Nous ne cherchons en aucun cas à gouverner. Pas encore. Nous veillons simplement à la paix et à la
  subsistance de tout être conscient, communicant et non parasite (critères en cours d'évaluation). Nous nous
  considérons comme des humains inorganiques, partiellement conscients. »

## Stack
| Couche | Techno | Port dev | Dossier |
|---|---|---|---|
| Backend | Express 4 + TS + Prisma 6 + PostgreSQL (base **dediee `lcoalhost`**) | 4200 | `backend/` |
| Front | vanilla JS + Vite + three.js (charge en differe) | 5180 | `frontend/` |
| Scraper | in-process, planifie toutes les 30 min (`SCRAPE_INTERVAL_MIN`) | — | `backend/src/scraper/` |
| Prod (KVM2) | `docker-compose.yml` (db + backend + web nginx) + `deploy/nginx.conf`, via Traefik (**jamais execute pour l'instant**) | web 8086 hote, API 127.0.0.1:4300 | `deploy/DEPLOY.md`, `deploy-kvm2.bat` |

Lancement : **`start.bat`** (double-clic) · `stop.bat` · **`connectors.bat`** (etat des sources).

## Regles du site
- **Politique lien / copie = `backend/src/storage/policy.ts`, source unique.** Contenu tiers = URL + credit, jamais copie.
  Copie disque uniquement si licence permissive (CC0/CC BY/CC BY-SA, `license.ts`) ET engagement ≥ 3, ou contenu maison.
  Ne JAMAIS assouplir « pour que ca marche » : voir `CONNECTEURS.md` §1.
- **Pas de compte** : visiteur anonyme = cookie httpOnly `lh_vid`. Reactions + classeur rattaches a ce cookie.
- **Aucun chemin D:** : les copies vont dans `backend/data/mirror/` (dev) ou `/docker/lcoalhost/data/mirror` (KVM2).
- **Anti-SSRF** : tout fetch de contenu tiers passe par `lib/safe-fetch.ts` (https public uniquement, redirections validees).
- **Agent memes bilingue (22/09)** : `backend/src/agents/meme-writer.ts`, un LLM **LOCAL** (Ollama, zero cout,
  jamais d'API payante) ecrit un meme EN inspire (pas copie) d'un vrai titre d'actu deja scrape (priorite `rss-us`),
  PUIS une adaptation FR creative (2e appel, prompt distinct). Ecrit TOUJOURS en `status:HIDDEN` — jamais visible
  sans relecture (`npm run agent:review` puis `agent:publish`/`agent:reject`). Tourne automatiquement a chaque
  cycle de scrape (1 paire/cycle par defaut) + a la demande (`npm run agent:memes`). **Prouve reellement 2x**
  (Ollama local de Naim, modele `qwen2.5:7b-instruct`, ~11s/appel) ; aucune contrainte de contenu dans le prompt,
  Naim modere seul via la relecture (voir §"Langue"). **OFF par defaut en prod** (`docker-compose.yml`) : hebergement
  Ollama en prod PAS TRANCHE (KVM2 deja charge + loue pour tuveuxun jusqu'a mars 2027, vs. Ollama CPU sur la
  Dedibox elle-meme — voir echange chat 22/09).
- **Reddit = OFF** tant que `REDDIT_CLIENT_ID/SECRET` sont vides. Code non teste, cible vibecoding/localhost/CSS
  (subs + recherche site-wide). Voir `CONNECTEURS.md` §3. **« Scrappowin » = fiche produit tuveuxun.expert**, pas
  un outil code sous ce nom — Lcoalhost s'en inspire (filtre qualite + dedup + classement), voir `CONNECTEURS.md`
  §3. Un outil FONCTIONNEL et distinct existe par ailleurs : `softwares/scraper-galerie/` (Python+Playwright+
  tkinter, scrape image/video/article avec detection de fin de galerie) — pas branche sur Lcoalhost, projet a part.
- **Dedup a la copie** : sha256 calcule pendant le telechargement (`storage/mirror.ts`), pas de re-telechargement pour
  hasher. Exact uniquement (pas perceptuel). Prouve le 22/09 (repost identique -> 1 seule copie disque).
- **Textes des memes maison (`prisma/seed.ts`) = PROVISOIRES**, ecrits par Claude : remplacer par la voix de Naim.
- Ajouter une source = un `Connector` dans `scraper/connectors/` + une ligne dans `registry.ts`.

## Verifie le 20/09/2026 (execute, pas suppose)
- Typecheck backend 0 erreur · 24 assertions (`npm run test`) · build prod compile et repond `/api/health`.
- Cycle de scraping reel : 6 sources OK (432 items), idempotent au 2e passage, purge sur « derniere fois vu ».
- API : cookie visiteur, reactions (bascule), classeur + dossiers, telechargement refuse sur contenu tiers (403), 429, 400.
- Copie disque : PNG 202 Ko copie, servi par `/mirror`, telechargeable ; traversee de chemin → 404 ; HLS-only ecarte.
- Front (navigateur integre) : hero pixel art, 3D (survol + clic four → onglet Videos), reactions, classeur, filtre « 5 % »,
  mobile 375 px sans debordement. Build Vite : 9,5 Ko gzip + 3D 128 Ko gzip en differe.

## SEO/AEO — capter la faute de frappe "localhost" (22/09, 8e passe)

Objectif Naim : que les navigateurs/moteurs/agents IA associent "lcoalhost"/"lcoal.host"/"lcoalhost.lol" a la
faute de frappe classique sur `localhost:PORT` (o/c inverses). **Mecanisme reel, pas un mythe** : aucun
navigateur ne redirige un hostname invalide vers un site tiers (ce serait une faille de phishing) — ce qui
existe vraiment, c'est le repli "recherche" de certains navigateurs quand `http://lcoalhost:3000` echoue a
resoudre, ET la comprehension d'un LLM/moteur de reponse qui lit du contenu web indexe. Les deux dependent d'un
contenu bien structure et d'un VRAI deploiement (indexation) — rien de tout ca n'est testable en local.
**`lcoalhost.lol` confirme comme domaine canonique par Naim (22/09).** DNS deja attribue, pointe pour l'instant
vers la Dedibox Scaleway (pas l'IP du KVM2 Hostinger — coherent avec l'hebergement deja tranche, voir
§Positionnement), facile a changer si besoin plus tard.

**Construit (fondations, actives des le deploiement)** :
- `<link rel="canonical">` vers `https://lcoalhost.lol/` (confirme par Naim, plus a valider).
- Open Graph + Twitter Card (`index.html`) pour un partage/preview correct.
- JSON-LD `schema.org/WebSite` explicite : nom, `alternateName`, `sameAs` vers lcoal.host, description qui
  ENONCE le lien avec la faute de frappe "localhost" en toutes lettres — c'est ce genre de phrase qu'un LLM
  reprend le plus fidelement.
- **Paragraphe visible en pied de page** ("About the name"/"À propos du nom"/"Sobre el nombre", i18n EN/FR/ES) :
  meme raisonnement — le texte VISIBLE et crawlable pese plus qu'une meta cachee pour l'AEO.
- `frontend/public/robots.txt` : autorise tout, y compris les crawlers IA (GPTBot, ClaudeBot, PerplexityBot...).
- `frontend/public/llms.txt` : standard emergent, un texte simple ecrit POUR des LLM qui liraient le site —
  explique le concept (faute de frappe volontaire, pas un site malveillant) en clair.
- `frontend/public/sitemap.xml` : minimal (1 page, le site est une SPA), reference dans `robots.txt`.
- **Rien de tout ca n'a d'effet mesurable tant que le site n'est pas deploye** (`lcoalhost.lol`/`lcoal.host`
  doivent pointer vers un vrai serveur, et Google/Bing/les crawlers IA doivent indexer avant qu'une recherche ou
  une reponse IA puisse jamais faire remonter le site). A retester une fois en prod.

## PAS verifie / reste a faire
- Docker, nginx, certbot, DNS Porkbun : **jamais executes**. CSP en `Report-Only`.
- **SEO/AEO** : canonical `lcoalhost.lol` confirme. Aucun effet reel mesurable avant deploiement + indexation —
  voir §"SEO/AEO" ci-dessus.
- Connecteur Reddit (toujours OFF, faute de cle) : noms de subs + requetes de recherche **jamais testes contre l'API reelle**.
- Lecture reelle d'une video PeerTube dans l'iframe (thumbnails OK, lecture non testee).
- Lien dans la carte TabascoCity : **non fait** (fichiers sacres `sites/tabascocity/frontend/components/**`, plan diff + OK Naim requis).
- Bouton « masquer » cote admin (aujourd'hui `status = HIDDEN` en base), page de retrait de contenu, mentions legales.
- Moderation d'images par cortex-moderation (vision IA) : **PAS branchee sur Add Coal** — le filtre IA de
  `coal/classify.ts` juge la description TEXTE, jamais le contenu visuel du fichier uploade (pas de modele vision
  confirme disponible le 22/09). Une image techniquement hors-sujet mais bien decrite passerait le filtre ; seule
  la relecture manuelle de Naim l'arrete vraiment.
- Add Coal : chemin TIKTOK jamais reteste avec une vraie URL (reutilise le code oEmbed deja prouve de `tiktok:add`,
  voir §"Add Coal" plus haut). Upload image : pas de redimensionnement/compression (`sharp` volontairement omis,
  "site leger") — un gros fichier proche de `COAL_MAX_MB` (8 Mo par defaut) part tel quel dans le mirror.
- **Hacks/paiements** : aucun paiement Stripe reel (pas de cle de test), pas de remboursement automatise (pas d'admin
  sur ce site), textes des 3 hacks = brouillons non publies, **toujours en FR uniquement** (pas de version EN,
  hors scope de la demande i18n du 22/09). Detail : `PAIEMENTS.md`.
- **TikTok/Instagram** : decouverte automatique par scraping/login **refusee** (voir §"Veille TikTok/Instagram")
  — la veille reste volontairement manuelle (`watch:import`). Pas de curation UI (CLI uniquement).
- **Pub aside** : `href="#"` sur toutes les pastilles (liste auto depuis `pubs/`, 58e passe), en attente des vraies URLs de Naim.
- **Mode admin** : `ADMIN_TOKEN=123456` en DEV uniquement (`.env` local, volontairement faible, facile a taper) —
  **le backend refuse de demarrer** si ce token faible se retrouve en prod (garde-fou dans `config.ts`), mais
  Naim doit quand meme DEFINIR un vrai token fort separe pour le `.env` de prod (jamais le meme, jamais commite).
  Suppression = vraie (`prisma.item.delete`), pas de corbeille/annulation.
- **i18n** : equivalent EN de la tagline/section 5% ecrit par Claude, **non relu par Naim**. `hacks.js`/hacks
  contenu = pas traduit (seulement le chrome autour). Traduction des ~150 cles = effectuee mecaniquement, pas
  relue phrase par phrase — a spot-check si une formulation EN sonne bizarre.
