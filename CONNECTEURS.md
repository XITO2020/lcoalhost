# Lcoalhost — connecteurs : ce qui tourne, ce qui manque, quoi faire

> Etat au **20/09/2026**. Toutes les lignes « OK » ont ete **executees pour de vrai ce jour-la** (cycle complet,
> 1 tour de scraping : 6 sources sur 7 actives, 432 items en base). Etat live a tout moment : **`connectors.bat`**.

## 1. Regle lien / copie (code : `backend/src/storage/policy.ts`)

**Le DROIT decide si on a le droit de copier ; la facilite a retrouver ne decide que de savoir si ca vaut le coup.**
Un meme « facile a retrouver » n'est pas pour autant copiable : c'est le contenu de quelqu'un d'autre.

| Cas | Ce qu'on garde | Telechargement |
|---|---|---|
| Article (HN, DEV, Lobsters, CERT-FR…) | titre + URL + credit. **Jamais copie.** | « Source ↗ » |
| Meme / video tiers, licence inconnue ou NC | URL + miniature hotlinkee + credit | « Source ↗ » |
| Contenu sous licence permissive (CC0, domaine public, CC BY, CC BY-SA) | URL au depart ; **copie sur disque quand la communaute l'a valide** (≥ 3 reactions + classements) | oui |
| Contenu maison (memes Lcoalhost) | natif, sur nos disques | oui (PNG genere) |

- **Pourquoi pas « tout copier des que ca marche »** : redistribution de contenu tiers sur un site qu'on veut monetiser.
- **Pourquoi pas « tout en lien »** : un lien meurt. Le controle de liens (`linkcheck.ts`, 7 jours) masque les 404/410 ;
  seul un item copie ne meurt jamais.
- **Limite honnete** : les videos PeerTube sont souvent en **HLS seul** (pas de fichier direct). Prouve le 20/09 : elles
  restent en lecteur integre et ne sont copiees que si la source expose un fichier ≤ 720p et ≤ 60 Mo.
- **Dedup a la copie (ajoute le 22/09, prouve)** : au moment de copier un fichier, un sha256 est calcule PENDANT le
  telechargement (zero requete en plus) et compare aux items deja copies. Le meme repost sur 2 sources (ex. Reddit +
  Lemmy) n'est copie qu'une fois ; le doublon reste en simple lien et n'est plus jamais retente (`contentHash` non nul).
  **Limite assumee** : hash EXACT (octet a octet) — un recadrage, un filigrane ou une recompression n'est pas detecte
  (ca demanderait un hash perceptuel + decodage d'image, pas fait ici).
- Reglages : `MIRROR_MIN_ENGAGEMENT` (3), `MIRROR_MAX_MB` (60), `RETENTION_DAYS` (45) dans `backend/.env`.

## 2. Connecteurs actifs (sans cle, sans compte)

| ID | Contenu | Provenance | Verifie le 20/09 |
|---|---|---|---|
| `hackernews` | articles (7 requetes JS/Python/CSS/LLM/secu/Linux/AI safety) | API Algolia (FR) | OK, 25 items |
| `devto` | articles debutant/intermediaire (7 tags) | Forem, open source | OK, 125 items |
| `lobsters` | articles tech | Lobsters | OK, 25 items |
| `rss` | **les 5 %** : CERT-FR (ANSSI), EFF, Krebs, Schneier, Alignment Forum | flux officiels | OK, 38 items |
| `lemmy` | **memes** : programmer_humor, linuxmemes, softwaregore | Lemmy, federe, open source | OK, 130 items (85 images) |
| `peertube` | **videos libres avec licence** via Sepia Search (Framasoft, FR) | PeerTube | OK, 82 items, 12 sous licence permissive |
| `rss-us` | **presse tech US** (demande Naim 22/09, scraping "particulierement americain") : TechCrunch, The Verge, Ars Technica, Wired | flux officiels US | OK, 40 items, verifie le 22/09 |
| `rss-fr` | **presse tech FR** (demande Naim 23/09) : Korben (`korben.info/feed`), `lang=fr`, parametres `utm_*` retires des liens. Politique IA du site (`korben.info/ai.txt`) : citation avec lien OK, entrainement / contenu derive sans attribution REFUSE -> **ne jamais l'ajouter aux sources de l'agent memes** | flux officiel | OK, 10 items, verifie le 23/09 |

Langue (23/09) : les **memes ET les articles** sont filtres par langue dans le feed (videos non). Toute source
francophone doit donc declarer `lang: 'fr'` (champ `RawItem.lang`, absent = `en`) — c'est le cas de `rss-fr` et de
CERT-FR dans `rss` (corrige le 23/09 : etait enregistre en anglais).

## 3. Reddit — le seul qui bloque, et pourquoi

- **Constate le 20/09** : `reddit.com/r/ProgrammerHumor/hot.json` sans authentification → **HTTP 403**.
- **D'apres des articles tiers (non verifie sur la page Reddit)** : depuis la « Responsible Builder Policy » (juin 2026), tout
  nouveau client OAuth passe par une **approbation manuelle** ; l'usage **commercial** demande un accord ecrit et est
  facture **~0,24 $ / 1 000 appels**, delai 2 a 4 semaines.
- **Cout estime** si approuve (22/09, avec la recherche site-wide en plus) : 1 jeton + 5 subreddits + 5 recherches =
  11 appels/cycle × 48 cycles/jour ≈ 15 800 appels/mois ≈ **3,8 $/mois**. A reverifier sur la page officielle au moment
  de la demande.
- **Declaration (regle anti-Big-Tech)** : provenance = Reddit Inc., independant, **pas** l'un des 4 Big-Tech interdits ;
  verification = tarifs non confirmes a la source ; alignement = Lcoalhost est de la comedie a rentabiliser (hors perimetre
  strict TC/Conspix), mais plateforme americaine fermee → **a toi de dire si tu la veux**.
- **A faire (toi, je n'ai pas le droit de creer de compte)** : demander l'acces API sur Reddit en decrivant l'usage
  (agregation avec credit + lien, aucun stockage de contenu tiers), puis creer l'app de type « script » et coller
  `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` dans `backend/.env`. Le connecteur (`connectors/reddit.ts`) s'allume tout seul.
  **Code ecrit d'apres la doc OAuth, NON TESTE** faute de cle.
- **Verdict** : Lemmy fournit deja les memes sans aucune accreditation. Reddit ne devient necessaire que pour le **volume**
  et pour les **videos de memes**.

### Ciblage « vibecoding / localhost / CSS » (demande Naim 22/09)

- `REDDIT_SUBREDDITS` = ProgrammerHumor, linuxmemes, softwaregore, ProgrammingHumor, **webdev** (nouveau).
- `REDDIT_SEARCH_QUERIES` (nouveau, recherche **site-wide** via `/search`, pas limitee a une sub) : `vibecoding`,
  `vibe coding fail`, `localhost meme`, `css meme`, `ai wrote this code`. Objectif : attraper le meme viral du moment
  (« prompt pourri de vibecoding ») meme quand il n'est poste dans aucune des subs ci-dessus.
- **Corrige au passage** : une sub renommee/privee/introuvable faisait planter TOUT le connecteur pour le cycle (comme
  Lemmy/PeerTube avant elles, chaque source est maintenant isolee — une erreur n'empeche pas les autres).
- Ces noms de subs/requetes sont des **hypotheses non verifiees** (impossible de les tester sans cle) — a corriger une
  fois l'API accordee si certaines ne remontent rien.

### « Scrappowin » — d'ou vient ce nom (clarifie avec Naim le 22/09)

Ce n'est **pas un outil existant dans ce depot** : c'est une **fiche produit du catalogue B2B tuveuxun.expert**
(`sites/tuveuxun-expert/app/agents/page.tsx`, slug `scrappowin`) — un agent de scraping d'images **vendu**, pas codé
ici. Ses arguments marketing : respect de `robots.txt`, filtre qualite, **dedup par hash perceptuel**, classement
automatique. Pour Lcoalhost je m'en inspire honnetement, pas a l'identique : filtre qualite (post supprime/NSFW ecarte,
vrai fichier image/video exige) et classement (`topics.ts`) existaient deja ; la **dedup ajoutee le 22/09 est un hash
EXACT** (sha256 du fichier), pas perceptuel — voir §1. Si un vrai dedup perceptuel (resistant au recadrage/recompression)
devient utile, ca demandera une dependance de decodage d'image (`sharp`, deja utilise par Zarmazon) : pas fait ici pour
garder le backend leger, a rouvrir si les doublons visuels deviennent genants en pratique.

## 4. Connecteurs que je te conseille d'ajouter (dans l'ordre)

1. **Filtre de moderation des images** : brancher `softwares/cortex-moderation` (Qwen2.5-VL local, deja partage) sur les
   memes avant publication. Aujourd'hui seuls les drapeaux NSFW des sources filtrent.
2. **Classement par IA locale** (Ollama + Qwen) a la place des regex de `topics.ts` : distingue « securite de l'IA » de
   « garde-fous d'un pipeline LLM » (faux positif que j'ai deja corrige a la main), et ecarte le hors-sujet.
3. **Soumissions des visiteurs** (comme ref.land) : image + declaration de droits → contenu `reusable` → copie disque.
   C'est la voie la plus propre pour avoir de vrais fichiers a nous, et le nerf de « telecharger ».
4. **Mastodon** (#programmerhumor, #devhumor) : API publique, memes en federe. **Non verifie**, a tester avant.
5. **YouTube (lecteur officiel en embed, RSS des chaines, sans cle)** : possible, mais **Google = Big-Tech** → decision a toi.
6. **MinIO** (deja sur la Dedibox) si les copies depassent quelques dizaines de Go ; en dev/lancement le disque local suffit.

## 5. Ajouter un connecteur

Ecrire un fichier dans `backend/src/scraper/connectors/` qui exporte un `Connector` (`id`, `enabled()`, `run()` → `RawItem[]`),
puis l'ajouter dans `registry.ts`. Rien d'autre : classement par sujet, politique lien/copie, controle de liens et purge
s'appliquent automatiquement.

## 6. Point juridique a valider avant la pub

Afficher un lien + titre + miniature hotlinkee + credit est le cadre le plus prudent, **pas une immunite**. Avant de
brancher de la publicite sur un flux de memes tiers, faire relire ce point (droit de citation / miniatures / DMCA).
Prevoir aussi une adresse de retrait de contenu et un bouton « masquer » (statut `HIDDEN`, aujourd'hui modifiable en base).
