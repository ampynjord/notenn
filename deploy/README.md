# Mise en ligne de Notenn sur le VPS

Notenn tourne en trois conteneurs derrière le Traefik déjà installé : l'appli (`web`), PostgreSQL (`db`) et la sauvegarde nocturne (`backup`). L'adresse est https://notenn.ampynjord.bzh.

## 1. DNS

Chaque sous-domaine est déclaré à la main dans la zone DNS OVH (pas de wildcard) : une entrée A (et AAAA si le VPS a de l'IPv6) vers l'IP du VPS pour `notenn` et, pour les statistiques, `stats`. Vérifier : `dig +short notenn.ampynjord.bzh` doit renvoyer l'IP du VPS.

## 2. Vérifier les réglages de Traefik

Trois valeurs doivent correspondre à ton Traefik ; les valeurs par défaut sont celles du VPS actuel.

| Variable | Défaut | Où la trouver |
|---|---|---|
| `TRAEFIK_NETWORK` | `traefik-network` | `docker network ls` : le réseau auquel Traefik est rattaché |
| `TRAEFIK_ENTRYPOINT` | `websecure` | dans la configuration de Traefik (`entryPoints`, celui du port 443) |
| `TRAEFIK_CERTRESOLVER` | `letsencrypt` | dans la configuration de Traefik (`certificatesResolvers`) |

## 3. Installer

```sh
git clone git@github.com:ampynjord/notenn.git
cd notenn/deploy
cp .env.example .env
# Remplir POSTGRES_PASSWORD et PAYLOAD_SECRET :
sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 32)/" .env
sed -i "s/^PAYLOAD_SECRET=.*/PAYLOAD_SECRET=$(openssl rand -hex 32)/" .env
chmod 600 .env
docker compose up -d --build
```

Le premier démarrage construit l'image (quelques minutes), crée les tables (migrations Payload) puis lance l'appli. Suivre : `docker compose logs -f web`.

Ensuite, ouvrir https://notenn.ampynjord.bzh/admin et **créer tout de suite le compte administrateur** : tant qu'il n'existe pas, le premier venu peut le créer.

## 4. Mettre à jour

### Automatiquement (CI/CD)

Chaque fusion sur `main` lance `.github/workflows/ci.yml` :

1. **Contrôles** (aussi sur chaque branche et PR) : typecheck, lint, tests unitaires, migrations sur une base vide, tests d'intégration, build, tests navigateur.
2. **Image** : construite par GitHub et poussée sur `ghcr.io/ampynjord/notenn-web`, taguée `sha-<commit>` et `latest`.
3. **Déploiement** : GitHub se connecte au VPS en SSH et lance `deploy/deploy.sh`, qui :
   - fait une sauvegarde de la base (`backups/pre-deploy_…dump`) ;
   - lance la nouvelle image ;
   - attend que `/healthz` réponde (base joignable, migrations passées) ;
   - si ce n'est pas le cas au bout de 3 minutes, relance la version précédente, et le déploiement passe en rouge dans GitHub.

Revenir à une version précédente : GitHub → Actions → **Rollback** → *Run workflow*, avec le commit voulu. La base n'est pas ramenée en arrière ; si une migration doit être défaite, restaurer la sauvegarde `pre-deploy` (section 5).

#### Mise en place (une seule fois)

Sur le VPS, une clé réservée à Notenn pour GitHub. Elle ne sert qu'à ça et peut être retirée sans toucher aux autres projets.

```sh
ssh-keygen -t ed25519 -N "" -C "github-actions notenn" -f ~/notenn-deploy
cat ~/notenn-deploy.pub >> ~/.ssh/authorized_keys
cat ~/notenn-deploy   # à copier dans GitHub, puis :
rm ~/notenn-deploy ~/notenn-deploy.pub
```

Le dépôt sur le VPS doit pouvoir faire `git fetch` (c'est déjà le cas s'il a été cloné en SSH, section 3).

Dans GitHub → `ampynjord/notenn` → *Settings* → *Secrets and variables* → *Actions* → *New repository secret* :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | `ampynjord.bzh` (nom qui pointe sur le VPS ; le SSH ne passe pas par Traefik) |
| `NOTENN_DEPLOY_KEY` | le contenu de `~/notenn-deploy` (clé privée, en entier) |
| `VPS_PORT` | facultatif, `2222` par défaut |
| `VPS_USER` | facultatif, `debian` par défaut |

L'image est privée : le déploiement s'identifie sur ghcr.io avec le jeton temporaire du workflow, rien à stocker sur le VPS.

### À la main

```sh
cd ~/notenn && git pull
cd deploy && docker compose pull web && docker compose up -d
```

`docker compose up -d --build` reconstruit l'image sur le VPS si besoin (sans passer par GitHub).

Les nouvelles migrations de base s'appliquent toutes seules au démarrage.

Si une mise à jour renomme un service, ajouter `--remove-orphans` pour retirer l'ancien conteneur.

### Mise à jour du 19/10/2026 (code passé en anglais)

Le conteneur `sauvegarde` devient `backup` et le dossier `sauvegardes/` devient `backups/` :

```sh
cd ~/notenn && git pull && cd deploy
docker compose up -d --build --remove-orphans
mv sauvegardes/* backups/ 2>/dev/null; rmdir sauvegardes 2>/dev/null
```

### Mise à jour du 19/10/2026 (comptes et bibliothèque)

Remplir `RESEND_API_KEY` dans `.env` (section 6) avant ou juste après la mise à jour. Les tables des comptes se créent toutes seules au démarrage.

## 5. Sauvegardes

Le conteneur `backup` fait une sauvegarde au démarrage puis chaque nuit à 3 h UTC, dans `deploy/backups/` :

- `notenn_<date>.dump` : la base (format `pg_dump -Fc`) ;
- `media_<date>.tar.gz` : les fichiers déposés (anciennement `medias_<date>.tar.gz`).

Elles sont gardées `BACKUP_KEEP_DAYS` jours (14 par défaut). Elles restent sur le VPS : pour survivre à la perte du serveur, les copier ailleurs (rsync vers le homelab, par exemple).

Lancer une sauvegarde à la main : `docker compose restart backup`.

### Restaurer

```sh
docker compose stop web
docker compose exec -T db pg_restore -U notenn -d notenn --clean --if-exists < backups/notenn_<date>.dump
docker compose run --rm -v "$PWD/backups:/s" --entrypoint sh web -c "tar -xzf /s/media_<date>.tar.gz -C /data"
docker compose start web
```

## 6. E-mails des comptes (Resend)

Les comptes reçoivent deux e-mails : la confirmation d'adresse à l'inscription et le lien « mot de passe oublié ». Ils partent par [Resend](https://resend.com). Sans clé, personne ne peut activer son compte.

1. Créer un compte Resend, puis *Domains* → *Add domain* : `ampynjord.bzh`. Ajouter chez OVH (zone DNS) les enregistrements que Resend affiche (SPF, DKIM, éventuellement MX de retour) et attendre qu'il passe en *Verified*.
2. *API Keys* → *Create API key*, droit *Sending access* limité au domaine.
3. Dans `.env` :
   ```sh
   RESEND_API_KEY=re_…
   EMAIL_FROM=notenn@ampynjord.bzh
   ```
4. `docker compose up -d` pour relancer l'appli.

Tester : créer un compte sur le site avec sa propre adresse. En cas de souci, `docker compose logs web | grep -i mail`.

Les comptes du site (« membres ») sont distincts des administrateurs : ils n'ouvrent jamais `/admin`. Leurs bibliothèques sont privées, même pour l'administrateur ; il voit seulement la liste des comptes (Membres) et peut en supprimer un.

## Commandes utiles

| Besoin | Commande |
|---|---|
| État | `docker compose ps` |
| Journaux | `docker compose logs -f web` |
| Redémarrer l'appli | `docker compose restart web` |
| Console PostgreSQL | `docker compose exec db psql -U notenn` |
