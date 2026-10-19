#!/bin/sh
# One backup at startup, then every night at 03:00 UTC:
# the database in pg_dump custom format plus an archive of the media files. Old ones are deleted.
set -eu
backup() {
  d=$(date +%Y-%m-%d_%H%M)
  # Separate commands: on any failure, set -e stops the script before the purge (older backups are
  # kept) and Docker restarts the container.
  rm -f /backups/*.tmp
  pg_dump -Fc -f "/backups/notenn_$d.dump.tmp"
  mv "/backups/notenn_$d.dump.tmp" "/backups/notenn_$d.dump"
  tar -czf "/backups/media_$d.tar.gz.tmp" -C /data media
  mv "/backups/media_$d.tar.gz.tmp" "/backups/media_$d.tar.gz"
  find /backups -name 'notenn_*.dump' -mtime +"$KEEP_DAYS" -delete
  find /backups -name 'media_*.tar.gz' -mtime +"$KEEP_DAYS" -delete
  echo "Backup $d done"
}
backup
while true; do
  # Seconds until the next 03:00 UTC (plain arithmetic, no reliance on busybox date options).
  wait_s=$(( (3 * 3600 - $(date -u +%s) % 86400 + 86400) % 86400 ))
  [ "$wait_s" -eq 0 ] && wait_s=86400
  sleep "$wait_s"
  backup
done
