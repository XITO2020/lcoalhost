# Lcoalhost — STATUS

> Mise a jour : 2026-09-22 · **v0.1 jouable en local** · pas encore deploye · DNS `lcoalhost.lol` + `lcoal.host` achetes (Porkbun)

## Etat
- Backend + scraper + API : **fonctionnels et testes** (6 connecteurs sur 7, cf. `CONNECTEURS.md`).
- Front : banniere image + navbar en nuages (22/09), Centrale 3D cliquable (trémie=memes, four=videos, cheminees=articles),
  flux, reactions, classeur, telechargement, onglet **Hacks** (paiement, cf. `PAIEMENTS.md`), aside **TikTok** (cf. `CLAUDE.md`).
- Lancement : `start.bat` · `stop.bat` · `connectors.bat`.

## Avant la mise en ligne (KVM2 Hostinger — decision Naim 23/09, remplace la Dedibox)
- [ ] Remplacer les 8 memes maison + 3 hacks provisoires par les textes de Naim (`backend/prisma/seed.ts`)
- [ ] Decision Reddit : demander l'acces API ou s'en passer (Lemmy couvre les memes)
- [ ] Decision TikTok : decouverte automatique (scraping, ToS a risque) ou curation manuelle seule (`tiktok:add`) ?
- [ ] Prouver un paiement Stripe reel (cle de test) avant toute vente de hack ; publier au moins 1 hack (`Hack.published=true`)
- [ ] DNS Porkbun -> `187.77.144.220`, puis 1er `deploy-kvm2.bat` + remplir le `.env` serveur (`deploy/DEPLOY.md`)
- [ ] Mentions legales, adresse de retrait de contenu, bouton « masquer », CGV pour la vente de hacks
- [ ] Relecture du point juridique « memes tiers + publicite » (`CONNECTEURS.md` §6)
- [ ] Lien dans la carte TabascoCity (plan diff, fichiers sacres)
- [ ] CSP : passer de `Report-Only` a `Content-Security-Policy` apres verification console

## Last action
- 2026-09-22 : hero refondu en banniere image + navbar-nuages ; connecteur Reddit cible vibecoding/localhost/CSS
  + dedup sha256 a la copie ; veille MCP pour hacks vendables ; brique Hacks/Stripe (backend+front, non teste en
  paiement reel) ; aside TikTok (oEmbed officiel, curation manuelle uniquement, prouve avec 1 vraie video).
- 2026-09-20 : creation complete du site (backend, scraper 7 connecteurs, politique lien/copie, front, 3D, deploiement).
