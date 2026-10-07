#!/usr/bin/env bash
# Run from the repo root on the EC2 instance to deploy the latest code.
set -euo pipefail

cd "$(dirname "$0")/.."

git pull --ff-only
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build
docker image prune -f

API_DOMAIN=$(grep -E '^API_DOMAIN=' infra/.env | cut -d '=' -f2-)
echo "==> Waiting for https://${API_DOMAIN}/health"
for i in $(seq 1 15); do
  if curl -fsS "https://${API_DOMAIN}/health" > /dev/null 2>&1; then
    echo "==> Deploy succeeded"
    curl -fsS "https://${API_DOMAIN}/health"
    exit 0
  fi
  sleep 2
done

echo "==> Health check did not pass in time; check 'docker compose logs' "
exit 1
