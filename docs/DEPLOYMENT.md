# Deployment

## Architecture

```
Browser ──HTTPS──▶ Vercel: apps/web (Next.js, TanStack Query)
   │
   └──HTTPS (fetch, CORS)──▶ AWS EC2 (Ubuntu 24.04, Elastic IP)
                               Caddy :80/:443  (automatic Let's Encrypt TLS, reverse proxy)
                                 └─▶ apps/api  Express + TypeScript :4000
                                       ├─▶ Postgres 16 (Docker network only, never public)
                                       └─▶ GitHub REST API (cached 5 min in Postgres)
```

## AWS resources provisioned

| Resource | Value |
|---|---|
| Region | ap-south-1 (Mumbai) |
| Instance type | t3.micro (economical: ~$8/mo on-demand, with a 2GB swapfile to absorb Docker build memory spikes) |
| AMI | Ubuntu 24.04 LTS, Canonical official |
| Storage | 20 GB gp3 |
| Security group | `rovorai-api-sg` — 22/tcp from admin IP only, 80/443/tcp from 0.0.0.0/0. **5432 and 4000 are never exposed.** |
| Elastic IP | Allocated and associated (free while attached to a running instance) |
| Key pair | `rovorai-api-key` (ed25519, private key kept locally, never committed) |

## One-time server setup

1. `scripts/ec2-bootstrap.sh` runs automatically via EC2 user-data on first boot (installs Docker, creates swap, enables unattended-upgrades). It's idempotent, so it's safe to re-run by hand over SSH if needed.
2. Copy `infra/.env.example` to `infra/.env` on the server and fill in real values (`API_DOMAIN`, Postgres credentials, `CORS_ORIGINS`, `GITHUB_TOKEN` optional).
3. Run `scripts/deploy.sh` from the repo root on the server. It builds and starts `db`, `api`, and `caddy` via `infra/docker-compose.yml`, then polls `/health`.
4. Seed the database once: `docker compose -f infra/docker-compose.yml exec api node dist/seed.js`.

## Domain / TLS

No custom domain was required for this assignment — the API is served over HTTPS via the `<ip-with-dashes>.sslip.io` wildcard DNS service, which resolves to the Elastic IP with no DNS configuration needed. Caddy automatically obtains and renews a Let's Encrypt certificate for that hostname the first time it sees inbound traffic on ports 80/443.

If a real domain is preferred later: point an A record at the Elastic IP, set `API_DOMAIN` in `infra/.env` to that domain, and re-run `scripts/deploy.sh`.

## Vercel (frontend)

1. Import the repo into Vercel.
2. **Root Directory**: `apps/web`.
3. Enable "Include files outside the root directory" (required so the build can see `packages/shared`).
4. Environment variable: `NEXT_PUBLIC_API_URL=https://<API_DOMAIN>`.
5. Deploy. Then add the resulting Vercel origin to `CORS_ORIGINS` in `infra/.env` on the server and re-run `scripts/deploy.sh`.

## Redeploying

SSH into the instance and run `scripts/deploy.sh`. It pulls the latest `main`, rebuilds the `api` image, restarts the stack, and prunes dangling images.

## Verifying

```
curl https://<API_DOMAIN>/health
curl https://<API_DOMAIN>/api/projects
```
