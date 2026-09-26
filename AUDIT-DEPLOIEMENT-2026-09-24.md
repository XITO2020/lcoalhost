# Audit de deploiement Lcoalhost -> KVM2 (24/09/2026)

Trois audits en lecture seule (infrastructure, securite backend, front + legal/RGPD) + verifications executees
(compilation, tests, build de prod, vulnerabilites des dependances, routes API, console). Ce fichier liste ce qui a
ete CORRIGE ce jour et ce qui RESTE, par ordre de priorite.

## Corrige et verifie le 24/09

| Point | Correctif | Preuve |
|---|---|---|
| ReDoS Add Coal (BLOQUANT) : une page piegee gelait toute l'API (95 s pour 44 Ko) | Lecture de l'en-tete en temps lineaire (`coal/inspect.ts`) | Page piegee 512 Ko : 1 ms ; page normale : memes infos extraites |
| Email Add Coal publie comme auteur (BLOQUANT) | `author: 'visiteur'` (`coal/publish.ts`) | 0 item existant concerne |
| Build Docker backend en echec (BLOQUANT) | `prisma/` copie avant `npm ci` (`backend/Dockerfile`) | Relu ; pas de Docker local pour executer |
| Page vide des le 2e deploiement (BLOQUANT) | `dist/` et `videos/` vides mais jamais supprimes + `restart web` + controle du vrai site (`deploy-kvm2.sh`) | `bash -n` OK |
| Limiteur admin applique a toutes les routes publiques | Limite a `/admin` (`admin/routes.ts`) | tsc OK |
| Comparaison du token admin pouvant planter | Empreintes sha256 a temps constant | tsc OK |
| Liens `javascript:` acceptes (vol du token admin au clic) | https exige cote serveur (pubs, Add Coal), http(s) pour l'admin ; `safeHref` cote affichage | tsc + build OK |
| Injection dans le JSON-LD de `/item/:id` | `<` echappe en `<` | Titre piege : JSON intact, aucune balise injectee |
| `/api/ads/active?position=inconnu` -> 500 | Validation -> 400 | 400 / 200 / 200 / 200 |
| Site mort si le stockage navigateur est bloque | Lectures `localStorage` protegees (`i18n.js`, `theme.js`) | build OK |
| Images Add Coal rejetees par l'IA jamais supprimees | Suppression immediate | tsc OK |
| `index.html` en cache apres deploiement | `Cache-Control: no-cache` + en-tetes de securite repetes (`nginx.conf`) | relu |
| Logs et memoire des conteneurs non bornes (KVM2 partage) | Logs 3 x 10 Mo, memoire 384m / 512m / 64m (`docker-compose.yml`) | YAML valide |
| Pastilles discretes (TC, Ref.land, Zarmazon, Conspix, AVC News Sport) | Absentes du build de prod (fichiers ET textes du code), sous-dossiers `circles/` `squares/` compris | `dist/pubs` : 6 ronds + 2 carres ; 0 nom dans le JS |
| 17 lecteurs TikTok charges d'un coup -> "Access Denied" Akamai | Lecteur cree seulement pour le clip affiche et ses voisins (max 4) | Test : 0 au depart, [3,4,5,6] au clip 5 |

Verifications globales : tsc backend 0 erreur, 24 tests OK, build de prod OK, 0 vulnerabilite front, 3 alertes
"elevees" backend toutes dans l'outil CLI Prisma (`deepmerge-ts`, non atteignable par un visiteur).

## Reste a faire AVANT la mise en ligne publique

### Legal / RGPD (bloquant pour un lancement public en France)
1. **Mentions legales** : hebergeur complet (reprendre celui de tuveuxun : Hostinger International Ltd, 61 Lordou
   Vironos Street, 6023 Larnaca, Chypre), telephone de l'editeur (exige par la LCEN pour une societe), retirer la
   note interne publique ("Scaleway... voir CLAUDE.md"). A trancher : siege de tuveuxun = Paris 7e (domiciliation)
   mais RCS Versailles ; memoire legale = Juziers. Utiliser les donnees REELLES du Kbis actuel.
2. **TikTok / Instagram** : l'IP des visiteurs part chez TikTok avant tout consentement. Option recommandee : facade
   "cliquer pour charger" (ou banniere de consentement, necessaire de toute facon le jour de Google Analytics).
3. **ip-api.com** (Mouchard) : IP de chaque visiteur envoyee en HTTP a un tiers, non declaree, offre gratuite
   probablement non commerciale (a verifier). Supprimer l'appel ou le declarer.
4. **Politique de confidentialite** a reecrire : TikTok, images tierces, Liquid (IA locale), Add Coal (duree de
   conservation, email), cookie `lh_vid` (365 j), stockage navigateur, pubs (pixel de fait), bases legales.
5. **EXIF/GPS** des photos Add Coal publies tels quels : les retirer a l'approbation.

### Serveur (a verifier au premier deploiement)
6. Port 8086 : fermer au pare-feu (sinon IP visiteur falsifiable, contournement des limites).
7. Ollama du KVM2 : ecoute-t-il hors 127.0.0.1 ? Si oui et sans pare-feu, il est public. Modele `qwen2.5:3b` present ?
8. Les 4 noms de domaine doivent pointer sur 187.77.144.220 AVANT le `up` (un seul certificat pour les 4).

### Securite (important, non bloquant)
9. `?admin=<token>` dans l'URL = token ecrit dans les logs nginx/Traefik : garder seulement le formulaire.
10. Quota Add Coal par cookie (contournable) : ajouter un quota par IP ; plafonner `data/coal`.
11. Ollama : aucune limite globale de concurrence (Liquid + Add Coal peuvent saturer le CPU partage).
12. Images des encarts et memes Add Coal chargees chez le soumetteur : remplacables apres approbation, pixel de fait.

### Contenu au lancement
13. Onglet Memes FR vide (tous les memes FR etaient des memes texte, retires) : decision Naim.
14. Onglets Hacks / Annoncer inutilisables tant que Stripe est eteint ; prix pub 9,99 EUR = placeholder.
15. `always_init/cpx-promo-2024.mp4` (promo Conspix d'apres son nom) lue en premier par tous les visiteurs, alors que
    Conspix est masque par discretion : decision Naim. Videos `fr/Download(...).mp4` : origine/droits a confirmer,
    25-30 Mo chacune (version web allegee conseillee).
