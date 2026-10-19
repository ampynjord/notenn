# Mise en ligne de Notenn sur le VPS

Notenn tourne en trois conteneurs derrière le Traefik déjà installé : l'appli (`web`), PostgreSQL (`db`) et la sauvegarde nocturne (`backup`). L'adresse est https://notenn.ampynjord.bzh.

## 1. DNS

Le wildcard `*.ampynjord.bzh` pointe déjà vers le VPS : rien à créer. Vérifier : `dig +short notenn.ampynjord.bzh` doit renvoyer l'IP du VPS.

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

```sh
cd notenn && git pull
cd deploy && docker compose up -d --build
```

Les nouvelles migrations de base s'appliquent toutes seules au démarrage.

Si une mise à jour renomme un service, ajouter `--remove-orphans` pour retirer l'ancien conteneur.

### Mise à jour du 19/10/2026 (code passé en anglais)

Le conteneur `sauvegarde` devient `backup` et le dossier `sauvegardes/` devient `backups/` :

```sh
cd ~/notenn && git pull && cd deploy
docker compose up -d --build --remove-orphans
mv sauvegardes/* backups/ 2>/dev/null; rmdir sauvegardes 2>/dev/null
```

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

## 6. Statistiques de visite (Umami)

Umami compte les visites sans cookie : pas besoin de bandeau de consentement. Il tourne à part, sur https://stats.ampynjord.bzh.

```sh
cd ~/notenn/deploy
sed -i "s/^UMAMI_DB_PASSWORD=.*/UMAMI_DB_PASSWORD=$(openssl rand -hex 32)/" .env
sed -i "s/^UMAMI_APP_SECRET=.*/UMAMI_APP_SECRET=$(openssl rand -hex 32)/" .env
docker compose --profile stats up -d
```

1. Ouvrir https://stats.ampynjord.bzh, se connecter avec `admin` / `umami` et **changer tout de suite le mot de passe**.
2. Ajouter un site « Notenn » (domaine `notenn.ampynjord.bzh`) et copier son identifiant (*Website ID*).
3. Dans `.env` : `UMAMI_SCRIPT_URL=https://stats.ampynjord.bzh/script.js` et `UMAMI_WEBSITE_ID=<identifiant>`.
4. `docker compose --profile stats up -d` pour relancer l'appli avec les statistiques.

Pour mettre Umami à jour en même temps que Notenn, ajouter `--profile stats` à la commande `docker compose up -d --build`.

## Commandes utiles

| Besoin | Commande |
|---|---|
| État | `docker compose ps` |
| Journaux | `docker compose logs -f web` |
| Redémarrer l'appli | `docker compose restart web` |
| Console PostgreSQL | `docker compose exec db psql -U notenn` |
