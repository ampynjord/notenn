# Brouillons et validation des airs

Un air de la banque n'est visible du public qu'une fois **publié**, et seuls certains rôles peuvent le publier.

## Rôles des comptes du back-office (`/admin`)

| Rôle | Ce qu'il peut faire |
|---|---|
| **Rédacteur** (`editor`) | écrire un air et modifier ses **brouillons**. Il ne peut ni publier, ni modifier un air déjà publié, ni supprimer. |
| **Validateur** (`publisher`) | tout ce que fait le rédacteur, plus **publier** un brouillon (cocher « Publié »), dépublier, modifier un air publié. |
| **Administrateur** (`admin`) | tout, y compris la gestion des comptes et la suppression des airs. |

- Un air créé dans l'admin est **toujours** un brouillon, quoi que le formulaire envoie. La case « Publié » est en lecture seule pour un rédacteur.
- Seul un administrateur donne ou retire un rôle. Personne ne peut s'en attribuer un lui-même.
- Le **premier compte** d'une base vide est administrateur d'office (sinon personne ne pourrait attribuer de rôles). Les comptes qui existaient avant les rôles sont devenus administrateurs par la migration `roles_and_drafts`.
- Les visiteurs et les membres ne voient jamais les brouillons ; le back-office, si.

## Valider un air

1. Ouvrir `/admin` → **Airs**, repérer les airs dont « Publié » n'est pas coché.
2. Ouvrir l'air dans l'éditeur du site (même adresse que les autres, en étant connecté, ou importer l'ABC) et **l'écouter** : la banque ne publie que ce qu'on a vérifié à l'oreille.
3. Contrôler le texte, l'origine et les droits (voir `CLAUDE.md` : domaine public, trad libre ou licence libre seulement).
4. Cocher **Publié** et enregistrer.

## Ajouter des airs en brouillon par le code

Les airs bretons sont dans `src/seed/breton.ts` et sont insérés en brouillon par la migration `breton_drafts`. Pour en ajouter un : l'écrire dans ce fichier (en indiquant la source de la partition dans un commentaire) et ajouter une migration qui l'insère. Le test `library.test.ts` vérifie qu'il se lit et se joue sur le Hohner 2915.

## Plus tard

Pour les propositions des membres du site (phase 2 du plan), le même principe s'appliquera : un air proposé reste un brouillon jusqu'à ce qu'un membre de confiance le valide. Le mécanisme de versions de Payload (`versions.drafts`) pourra alors remplacer la case « Publié ».
