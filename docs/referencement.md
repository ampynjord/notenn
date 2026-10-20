# Référencement (SEO)

Ce qui est en place pour que Google et les réseaux sociaux comprennent Notenn, et ce qu'il reste à faire à la main.

## Ce que fait le site

Tout vient de `apps/web/src/lib/seo.ts`, utilisé par les pages publiques (accueil, éditeur, banque d'airs, page d'un air, soutenir, confidentialité, mentions légales).

| Élément | Où |
|---|---|
| Titre et description propres à chaque page | `generateMetadata` de chaque page, textes dans `messages/{fr,en}.json` |
| Adresse canonique, sans les paramètres (`?region=…` ne crée pas de doublon) | `pageMetadata` |
| Versions linguistiques (`hreflang`, avec `x-default` = français) | `pageMetadata` et `sitemap.xml` ; l'en-tête HTTP `Link` de next-intl est désactivé (`alternateLinks: false`) pour ne pas les déclarer deux fois |
| Aperçu de partage (Open Graph, carte Twitter) et image 1200×630 | `pageMetadata`, image générée par `app/og/[file]/route.tsx` à `/og/fr.png` et `/og/en.png` |
| Données structurées (schema.org) | accueil : `WebSite` et `SoftwareApplication` ; page d'un air : `MusicComposition` et `BreadcrumbList` |
| `robots.txt` | `app/robots.ts` : tout est ouvert sauf `/admin`, `/api/` et `/healthz` |
| `sitemap.xml` | `app/sitemap.ts` : pages publiques et airs publiés, en français et en anglais |

Les pages privées (compte, bibliothèque) restent en `noindex` ; elles ne sont **pas** interdites dans `robots.txt`, sinon Google ne pourrait pas lire le `noindex`.

## À faire à la main

1. **Google Search Console** : ajouter la propriété « Domaine » `ampynjord.bzh`, valider par l'enregistrement TXT demandé (zone DNS OVH), puis envoyer `https://notenn.ampynjord.bzh/sitemap.xml`. Même chose avec Bing Webmaster Tools.
2. **Liens entrants** : forums et groupes d'accordéon diatonique, communautés de musique traditionnelle, vidéos. Un lien depuis un site connu pèse plus que n'importe quel réglage technique.
3. **Contenu** : plus d'airs (chaque air est une porte d'entrée), et un texte propre à chaque air (histoire, niveau, rythme). Voir la phase 1 de `docs/plan.md`.

## Changer ou ajouter

- **Ajouter une page publique** : l'ajouter à `INDEXABLE_PAGES` dans `lib/seo.ts` (sitemap), et renvoyer `pageMetadata(…)` depuis son `generateMetadata`.
- **Changer de domaine** : modifier `SITE.url` dans `lib/site.ts` (canonique, sitemap, aperçus), `DOMAIN` et `PUBLIC_URL` dans `deploy/.env`, déclarer le nouveau sous-domaine chez OVH et le certificat chez Traefik, et rediriger l'ancien domaine en 301.
- **Vérifier** après un déploiement : `curl https://notenn.ampynjord.bzh/robots.txt`, `…/sitemap.xml`, et l'outil « Test des résultats enrichis » de Google sur une page d'air.
