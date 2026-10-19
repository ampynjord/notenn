# Notenn

Application web qui transforme une partition, un MIDI ou un enregistrement en tablature, avec curseur de lecture et export PDF. Première cible : l'accordéon diatonique, avec le **Système Argoat** (tablature gestuelle pour accordéon diatonique).

Projet privé — tous droits réservés.

## Contenu du dépôt

| Dossier | Contenu |
| --- | --- |
| `docs/` | Plan du projet, définition du Système Argoat, format des profils d'instruments, plan de clavier Hohner 2915 |
| `apps/web/` | Application Next.js + Payload CMS 3 (PostgreSQL) |
| `packages/engine/` | Moteur musical TypeScript : mélodie, transposition, doigté, basses, profils de claviers |
| `prototype/` | Prototype fonctionnel en une page HTML (import MIDI/MusicXML/ABC, doigté, basses, portée, curseur, PDF) |

Le prototype s'ouvre directement dans un navigateur : `prototype/systeme-argoat.html`.

## Stack prévue

- Next.js (React, TypeScript), application web installable (PWA)
- Payload CMS 3 intégré à Next.js
- PostgreSQL
- Hébergement sur VPS : Docker + Traefik
- Plus tard : service Python séparé pour la lecture de partitions (photo/PDF)

## Feuille de route

| Phase | Contenu |
| --- | --- |
| 0 · Moteur universel | Moteur TypeScript multi-instruments et multi-voix, projet Next.js + Payload, banc de tests sur vrais fichiers |
| 1 · V1 | Accordéon diatonique, Système Argoat, import MIDI/MusicXML/ABC/MP3, export PDF, FR + EN, dons |
| 2 · Mois suivants | Autres instruments, Corgeron et CADB, comptes et communauté, exports MIDI/MusicXML/PNG |
| 3 · Ensuite | Photo/PDF de partition, paiement à l'usage, groupes et classes, duos et paroles |

Détail complet : [`docs/plan.md`](docs/plan.md).

## Démarrer en local

Prérequis : Node 22, pnpm 10, Docker.

```bash
pnpm install
pnpm db:up                      # PostgreSQL de développement
cp apps/web/.env.example apps/web/.env   # puis mettre un PAYLOAD_SECRET aléatoire
pnpm dev                        # http://localhost:3000 et /admin
pnpm test                       # tests du moteur
```
