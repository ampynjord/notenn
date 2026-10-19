# Mise en ligne de Notenn sur le VPS

Notenn tourne en trois conteneurs derrière le Traefik déjà installé : l'appli (`web`), PostgreSQL (`db`) et la sauvegarde nocturne (`sauvegarde`). L'adresse est https://notenn.ampynjord.bzh.

## 1. DNS

Chez le registraire de `ampynjord.bzh`, ajouter un enregistrement `A` (et `AAAA` si le VPS a une IPv6) :

```
notenn.ampynjord.bzh.  A  <IP du VPS>
```

Vérifier : `dig +short notenn.ampynjord.bzh` doit renvoyer l'IP du VPS.

## 2. Vérifier les réglages de Traefik

Trois valeurs doivent correspondre à ton Traefik ; les valeurs par défaut sont les plus courantes.

| Variable | Défaut | Où la trouver |
|---|---|---|
| `TRAEFIK_NETWORK` | `traefik` | `docker network ls` : le réseau auquel Traefik est rattaché |
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

## 5. Sauvegardes

Le conteneur `sauvegarde` fait une sauvegarde au démarrage puis chaque nuit à 3 h UTC, dans `deploy/sauvegardes/` :

- `notenn_<date>.dump` : la base (format `pg_dump -Fc`) ;
- `medias_<date>.tar.gz` : les fichiers déposés.

Elles sont gardées `BACKUP_KEEP_DAYS` jours (14 par défaut). Elles restent sur le VPS : pour survivre à la perte du serveur, les copier ailleurs (rsync vers le homelab, par exemple).

Lancer une sauvegarde à la main : `docker compose restart sauvegarde`.

### Restaurer

```sh
docker compose stop web
docker compose exec -T db pg_restore -U notenn -d notenn --clean --if-exists < sauvegardes/notenn_<date>.dump
docker compose run --rm -v "$PWD/sauvegardes:/s" --entrypoint sh web -c "tar -xzf /s/medias_<date>.tar.gz -C /data"
docker compose start web
```

## Commandes utiles

| Besoin | Commande |
|---|---|
| État | `docker compose ps` |
| Journaux | `docker compose logs -f web` |
| Redémarrer l'appli | `docker compose restart web` |
| Console PostgreSQL | `docker compose exec db psql -U notenn` |
