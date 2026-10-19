# Notenn — consignes pour l'IA

- Projet privé de Gwenvaël : application web de tablatures, V1 = accordéon diatonique en **Système Argoat**.
- Langue de travail : français. Réponses brèves.
- Code en anglais : noms de fichiers et dossiers, identifiants, commentaires, noms des tests. Doc, commits et PR restent en français pour l'instant.
- Interface traduite (français, anglais) : aucun texte affiché codé en dur, adresses /fr/… et /en/….
- Plan et décisions : `docs/plan.md` (résumé) — ne pas contredire les décisions qui y figurent sans le signaler.
- Prototype de référence : `prototype/systeme-argoat.html` (moteur, rendu, PDF). Le plan de clavier Hohner 2915 est dans `docs/`.
- Stack cible : Next.js + Payload CMS 3 + PostgreSQL, TypeScript, déploiement Docker + Traefik sur VPS.
- Le moteur musical doit rester un module TypeScript indépendant, multi-instruments et multi-voix, testé sur de vrais fichiers.
- Droit d'auteur : ne jamais ajouter à la bibliothèque ou aux exemples des œuvres protégées ; uniquement domaine public, trad libre, licences libres.
- Code fermé : pas de licence open source.
