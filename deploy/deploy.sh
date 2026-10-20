#!/bin/sh
# Deploys one Notenn image on the VPS. Run by GitHub Actions over SSH, or by hand:
#   GHCR_TOKEN=<token able to read the package> sh deploy/deploy.sh sha-<commit>
#
# 1. saves the database, 2. starts the new image, 3. waits for /healthz,
# 4. if the new version is not healthy in time, starts the previous image again and fails.
# Database migrations run forward only: a rollback is safe as long as the previous version
# can read the current schema; otherwise restore the dump made at step 1 (README, section 5).
set -eu

TAG="${1:?usage: deploy.sh <image tag, e.g. sha-abc1234>}"
REPO_IMAGE="${NOTENN_IMAGE_REPO:-ghcr.io/ampynjord/notenn-web}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"

cd "$(dirname "$0")"
compose() { docker compose "$@"; }
log() { printf '==> %s\n' "$*"; }

if [ -n "${GHCR_TOKEN:-}" ]; then
  log "Login to ghcr.io"
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-ampynjord}" --password-stdin >/dev/null
  trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT
fi

NEW="$REPO_IMAGE:$TAG"
log "Pull $NEW"
docker pull -q "$NEW"

# Image running now, to come back to if the new one fails.
PREVIOUS=""
CURRENT_ID="$(compose ps -q web 2>/dev/null || true)"
if [ -n "$CURRENT_ID" ]; then
  PREVIOUS="$(docker inspect --format '{{.Config.Image}}' "$CURRENT_ID")"
  log "Running now: $PREVIOUS"
fi

if [ -n "$(compose ps -q db 2>/dev/null || true)" ]; then
  mkdir -p backups
  DUMP="backups/pre-deploy_$(date -u +%Y%m%d-%H%M%S)_${TAG}.dump"
  log "Backup to $DUMP"
  compose exec -T db pg_dump -U notenn -Fc notenn > "$DUMP"
fi

wait_healthy() {
  id="$(compose ps -q web)"
  elapsed=0
  while [ "$elapsed" -lt "$HEALTH_TIMEOUT" ]; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" 2>/dev/null || echo missing)"
    [ "$status" = "healthy" ] && return 0
    [ "$status" = "unhealthy" ] && return 1
    sleep 5
    elapsed=$((elapsed + 5))
  done
  return 1
}

log "Start $NEW"
WEB_IMAGE="$NEW" compose up -d --no-build --remove-orphans

if wait_healthy; then
  log "Deployed $TAG"
  docker image prune -f >/dev/null 2>&1 || true
  exit 0
fi

log "New version not healthy after ${HEALTH_TIMEOUT}s; last logs:"
compose logs --tail 60 web || true
if [ -n "$PREVIOUS" ]; then
  log "Rolling back to $PREVIOUS"
  WEB_IMAGE="$PREVIOUS" compose up -d --no-build web
  if wait_healthy; then log "Rolled back to $PREVIOUS"; else log "Previous version is not healthy either"; fi
fi
exit 1
