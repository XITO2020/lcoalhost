# Lcoalhost — Hacks & paiements (créé 22/09/2026)

> Brique payante demandée par Naim le 22/09 : des recettes dev/design écrites, vendues 4,44 € pièce ou
> 8,88 € le pack de 3 (prix fixes, pas de calcul par article — assumé, Naim l'a appelé « modèle très con »).
> **« poser les bases d'un concept ecom à peaufiner »** : ceci est un v0.1 volontairement minimal.

## Stack

Moteur copié de `.claude/skills/multi-payment-rails` (22/09/2026), **un seul rail câblé : Stripe**
(compte SASU TabascoCity, **partagé avec l'écosystème, PAS ENCORE LIVE** — KYC SASU en cours, confirmé
dans `.claude/skills/multi-payment-rails/rails/stripe.md`). Ajouter un autre rail (PayPal, Tezos…) plus
tard = copier l'adapter du skill dans `backend/src/payments/rails/` + l'ajouter à `registry.ts`, rien d'autre.

| Fichier | Rôle |
|---|---|
| `backend/prisma/schema.prisma` | `PaymentIntent`/`PaymentEvent`/`PaymentCursor` (génériques, copiés) + `Hack`/`HackOrder`/`HackOrderItem`/`HackUnlock` (spécifiques) |
| `backend/src/payments/rails/{types,stripe.adapter,registry}.ts` | moteur générique, copié du skill |
| `backend/src/payments/{settle,webhooks,fulfillment}.ts` | `settle.ts`/`webhooks.ts` copiés ; `fulfillment.ts` = **la seule partie spécifique** (déverrouille les hacks payés) |
| `backend/src/hacks/routes.ts` | `GET /api/hacks` (gated), `POST /api/hacks/checkout`, `GET /api/hacks/checkout/:intentId` |
| `frontend/src/hacks.js` | onglet Hacks : sélection (1 ou 3), barre flottante, redirection Stripe Checkout |

## Politique de prix (code, pas de calcul dynamique)

1 hack sélectionné = 444 centimes. Exactement 3 = 888 centimes. Tout autre nombre → 400 `choisis_1_ou_3`.
Le prix informatif `Hack.priceCents` (444 par défaut) n'est **pas** utilisé dans le calcul — gardé pour
un futur système à prix variables, pas branché.

## Identité de l'acheteur

**Pas de compte** sur Lcoalhost : l'acheteur est identifié par son cookie visiteur (`lh_vid`), exactement
comme les réactions et le classeur. `HackUnlock` est unique par `(hackId, visitorId)`. Un acheteur qui vide
ses cookies ou change de navigateur perd son accès — **limite assumée**, cohérente avec le reste du site.

## Vérifié le 22/09/2026 (exécuté, pas supposé)

- Typecheck 0 erreur. Migration Prisma réelle appliquée (`payments_hacks_tiktok`).
- **Chemin normal (Stripe OFF, pas de clé)** : `POST /api/hacks/checkout` → 400 `rail_indisponible`, aucune
  commande créée en base.
- **Chemin échec Stripe (fausse clé test)** : rail passe ON, la commande est créée puis **supprimée** au
  rejet de l'appel Stripe (401 côté Stripe) → 502 `paiement_indisponible`, base propre après coup (0 order,
  0 intent).
- **Webhook** : signature invalide → 400 `bad_signature` ; rail inconnu → 404 `unknown_rail`. Monté AVANT
  `express.json()` (sinon la vérification de signature Stripe échoue toujours).
- **Front** (navigateur réel) : sélection d'1 hack → barre « 1 sélectionné — 4,44 € » → clic Payer → message
  d'erreur propre (Stripe pas branché) → aucune commande fantôme laissée en base. Mobile 375px sans
  débordement. Gating confirmé : `body` de la recette = `null` tant que non débloqué, `teaser` toujours visible.
- **Correction remontée dans le skill** (bug réel trouvé ici) : `stripe@18.5.0` type `apiVersion` sur un
  littéral unique différent de celui documenté par le skill (`'2024-06-20'` casse le typecheck) → fixé en
  **omettant `apiVersion`** (même solution que Zarmazon), et la doc/template du skill mis à jour en conséquence.

## PAS vérifié / reste à faire

- **Aucun paiement Stripe réel n'a été effectué** (pas de clé de test valide fournie) : le chemin succès
  (`checkout.session.completed` → hack débloqué) n'a jamais tourné pour de vrai. À prouver dès qu'une clé
  `sk_test_...` existe (`stripe listen --forward-to localhost:4200/api/payments/webhooks/stripe`).
- **Pas de remboursement automatisé** : le site n'a pas d'authentification admin, donc pas de route
  `/refund` (contrairement à Zarmazon/TC) — un remboursement se fait à la main sur le dashboard Stripe.
- Les **3 hacks seedés sont des brouillons** (`published: false`), textes écrits par Claude à partir de la
  veille MCP du 22/09 (`_obsidian-vault/radar/2026-09-22-lcoalhost-mcp-site-hacks.md`) — à relire, réécrire
  dans ta voix, et publier (`Hack.published = true`) avant toute vente réelle.
- Mentions légales / CGV pour une vente en ligne : rien de fait.
