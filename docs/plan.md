# Plan — Notenn

Notenn est une application web, hébergée sous ampynjord.bzh en français et en anglais, qui transforme une partition, un MIDI ou un enregistrement en tablature, avec curseur de lecture et PDF. La V1 est consacrée à l'accordéon diatonique et au **Système Argoat** ; les autres instruments s'ajoutent ensuite. Code fermé ; revenus par dons et fonctions consommant des ressources serveur.

Document de référence vivant : le plan détaillé est tenu dans le doc « Plan — Notenn » sur claude.ai. Ce fichier en est le résumé versionné.

## Système Argoat — tablature gestuelle pour accordéon diatonique

| Élément | Affichage |
| --- | --- |
| Sens du soufflet | Une ligne P (poussé) et une ligne T (tiré) |
| Rang | Numéro avec apostrophe = rang intérieur, sans = rang extérieur ; double apostrophe (6'') = 3e rang |
| Rythme | Espacement proportionnel au temps + points discrets sur chaque temps, trait court en début de mesure |
| Note tenue | Trait après le numéro jusqu'à la fin de la note |
| Main gauche | Ligne de basses : rond plein = basse, rond vide = accord, chiffre = groupe de boutons (adapté au clavier) |
| Portée | Partition classique au-dessus, optionnelle, alignée sur la tablature |
| Autres notations | Corgeron et CADB, tous deux en phase 2 |

## Périmètre

| Domaine | Décision |
| --- | --- |
| Claviers | Modèles existants fournis (Hohner, Castagnari, Saltarelle…) + éditeur visuel de clavier |
| Pratique | Curseur, boucle, ralenti, métronome avec décompte, clavier animé ; écoute au micro mise de côté |
| Son | Synthé léger (pas d'échantillons) |
| Imports | MIDI, MusicXML, ABC, saisie à la main ; MP3 (calcul dans le navigateur) juste après la bêta ; photo/PDF de partition en phase 3, en premier |
| Exports | PDF, MIDI, MusicXML, PNG, lien de partage |
| Impression | Taille réglable, mise en page, couleur ou N&B, livret avec sommaire |
| Édition | Bouton/rang/soufflet au clic, préférences de jeu, annotations, historique des versions |
| Voix | Mélodie + basses, accords main droite ; duos et paroles plus tard (moteur multi-voix dès la phase 0, sans changer l'affichage) |
| Bibliothèque | Domaine public, trad, licences libres, créations des membres ; tout membre propose, des membres de confiance valident ; classée par instrument, région/style, niveau ; recherche |
| Communauté | Comptes, favoris, partage, notes, commentaires, corrections ; modération par membres de confiance |
| Connexion | E-mail + mot de passe d'abord, Google et Apple ensuite ; atelier utilisable sans compte ; bêta sans comptes |
| Hors ligne | Favoris jouables sans internet |
| Organisation | Répertoires (setlists), mode scène ; groupes et classes plus tard |
| Paiement | Dons via plateforme sans frais fixes ; paiement à l'usage via Stripe pour toute fonction très coûteuse en argent ou en ressources serveur (photo/PDF de partition en tête) |
| Statistiques | Suivi complet, bandeau de consentement RGPD |
| Style | Sobre et moderne |
| Langues | Interface en français et en anglais, adresses /fr/… et /en/… ; code, structure, commentaires et tests en anglais |

## Droit d'auteur

- Bibliothèque publique : uniquement domaine public, airs trad (transcriptions libres), licences libres, créations des membres. Fiche avec auteur, date, licence ; modération ; signalement et retrait rapide.
- Atelier personnel : fichiers de l'utilisateur convertis dans son navigateur, jamais publiés.
- Morceaux récents : seulement avec licences d'éditeurs, plus tard.
- Consulter un juriste PI avant l'ouverture publique.

## Stack

| Composant | Choix |
| --- | --- |
| Front + back | Next.js (React, TypeScript) + Payload CMS 3 (comptes, rôles, modération, versions, fichiers) |
| Base | PostgreSQL (recherche plein texte) |
| Moteur musical | Module TypeScript indépendant, testé, partagé navigateur/serveur |
| Profils d'instruments | JSON versionnés |
| Rendu | SVG maison (portée + tablature + curseur) |
| Formats | @tonejs/midi, abcjs, jsPDF |
| Audio → notes | Basic Pitch, dans le navigateur |
| Partition → notes | Service Python séparé (Audiveris), dernière phase |
| Hébergement | VPS, Docker + Traefik, sauvegardes |

Protection du code : build minifié et obscurci, calculs sensibles côté serveur, CGU, e-Soleau (INPI).

## Priorités par phase

| Domaine | 0 · Moteur universel | 1 · V1 | 2 · Mois suivants | 3 · Ensuite |
| --- | --- | --- | --- | --- |
| Technique | Moteur multi-instruments/multi-voix ; Next.js + Payload + PostgreSQL sur VPS ; banc de tests | PWA ; statistiques + consentement | Synchro hors ligne des favoris | Service Python partitions |
| Instruments | Format des profils, Hohner 2915 | Diatonique : Sol/Do 2 rangs courants, autres tonalités (La/Ré, Do/Fa…), 3 rangs | D'abord accordéon chromatique / piano, guitare, ukulélé ; puis harmonica, concertina ; éditeur de clavier | Saxophone, flûtes (tin whistle, flûte à bec), bombarde / biniou, piano |
| Imports | MIDI, MusicXML, ABC | Choix de piste, plage, transposition ; MP3 juste après la bêta | Saisie à la main | Photo/PDF de partition (en premier de la phase) |
| Tablature | Doigté, basses ; moteur multi-voix | Système Argoat (avec 3e rang) ; portée ; accords main droite | Corgeron, CADB ; annotations | Duos, paroles |
| Pratique | | Curseur, boucle sur un passage, ralenti sans changer la hauteur, métronome avec décompte | Clavier animé, mode scène | (Micro, mis de côté) |
| Édition | | Bouton/rang/soufflet au clic (dans la bêta) ; préférences | Historique des versions | |
| Exports | | PDF : avec ou sans portée, mesures par ligne, couleur ou N&B | MIDI, MusicXML, PNG, lien | Livret |
| Communauté | | Atelier sans compte, airs libres | Comptes, bibliothèque, partage, modération, notes, commentaires, corrections | Licences d'éditeurs |
| Organisation | | | Setlists | Groupes, classes (après photo/PDF de partition) |
| Revenus | | Dons | | Paiement à l'usage (fonctions coûteuses) |
| Langues | | FR + EN | | |

## Lancement

Tests seul sur le Hohner, puis bêta ouverte marquée « bêta » ; bouche-à-oreille.

## Tâches de la phase 0

- [ ] Vérifier « Argoat » et « Notenn » sur data.inpi.fr (classes 9, 15, 41, 42)
- [x] Choisir le sous-domaine : notenn.ampynjord.bzh (enregistrement DNS à créer)
- [x] Créer le dépôt Git privé
- [x] Créer le projet Next.js + Payload CMS 3 + PostgreSQL
- [x] Préparer le déploiement VPS (Docker, Traefik, HTTPS, sauvegardes) — reste la mise en ligne (deploy/README.md)
- [x] Extraire le moteur du prototype en module TypeScript
- [x] Définir le format JSON des profils d'instruments, y décrire le Hohner 2915
- [ ] Prévoir plusieurs voix et accords main droite dans le moteur
- [x] Banc de tests : une vingtaine de vrais fichiers MIDI, MusicXML, ABC
- [x] Tests automatiques du moteur (lecture, choix de piste, doigté, basses)
- [x] Porter le rendu Système Argoat dans le nouveau projet
- [ ] e-Soleau du Système Argoat une fois finalisé
