#!/usr/bin/env bash
# Runs deploy/deploy.sh on the VPS over SSH (used by the CI and Rollback workflows).
# On failure, the last lines of output become an annotation, readable from the run summary
# and through the GitHub API.
# Env: DEPLOY_KEY, VPS_HOST, VPS_PORT, VPS_USER, GHCR_TOKEN, GHCR_USER, TAG, SHA
set -uo pipefail

install -m 700 -d ~/.ssh
printf '%s\n' "$DEPLOY_KEY" > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
if ! ssh-keygen -y -f ~/.ssh/deploy_key > /dev/null 2>&1; then
  echo "::error title=Deploy key::NOTENN_DEPLOY_KEY is not a valid private key (paste the whole file, BEGIN and END lines included)."
  exit 1
fi

# The remote script travels on stdin, so the token never appears on a command line.
ssh -i ~/.ssh/deploy_key -p "$VPS_PORT" \
  -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 \
  "$VPS_USER@$VPS_HOST" bash -s <<REMOTE 2>&1 | tee deploy.log
set -e
cd ~/notenn
git fetch -q origin
git reset -q --hard '$SHA'
GHCR_TOKEN='$GHCR_TOKEN' GHCR_USER='$GHCR_USER' sh deploy/deploy.sh '$TAG'
REMOTE
code=${PIPESTATUS[0]}

if [ "$code" -ne 0 ]; then
  msg=$(tail -n 30 deploy.log | sed -e 's/%/%25/g' -e 's/\r//g' | sed ':a;N;$!ba;s/\n/%0A/g')
  echo "::error title=Deploy failed (exit $code)::$msg"
fi
rm -f ~/.ssh/deploy_key
exit "$code"
