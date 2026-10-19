#!/bin/sh
# Une sauvegarde au démarrage puis chaque nuit à 3 h UTC :
# base au format custom de pg_dump + archive des médias. Les plus anciennes sont supprimées.
set -eu
sauvegarder() {
  d=$(date +%Y-%m-%d_%H%M)
  # Commandes séparées : au moindre échec, set -e arrête le script avant la purge (les anciennes sauvegardes
  # restent) et Docker relance le conteneur.
  rm -f /sauvegardes/*.tmp
  pg_dump -Fc -f "/sauvegardes/notenn_$d.dump.tmp"
  mv "/sauvegardes/notenn_$d.dump.tmp" "/sauvegardes/notenn_$d.dump"
  tar -czf "/sauvegardes/medias_$d.tar.gz.tmp" -C /data media
  mv "/sauvegardes/medias_$d.tar.gz.tmp" "/sauvegardes/medias_$d.tar.gz"
  find /sauvegardes -name 'notenn_*.dump' -mtime +"$KEEP_DAYS" -delete
  find /sauvegardes -name 'medias_*.tar.gz' -mtime +"$KEEP_DAYS" -delete
  echo "Sauvegarde $d faite"
}
sauvegarder
while true; do
  # Secondes jusqu'au prochain 03:00 UTC (calcul simple, sans dépendre des options de date de busybox).
  attente=$(( (3 * 3600 - $(date -u +%s) % 86400 + 86400) % 86400 ))
  [ "$attente" -eq 0 ] && attente=86400
  sleep "$attente"
  sauvegarder
done
