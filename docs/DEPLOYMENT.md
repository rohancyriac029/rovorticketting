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

## Live deployment

| | |
|---|---|
| Frontend | https://rovorticketting.vercel.app (Vercel project `rovorticketting`) |
| API | https://13-202-9-144.sslip.io (Elastic IP `13.202.9.144`) |

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
| Email | Amazon SES in the same region: one verified sender address, and an IAM user `rovorai-ses-smtp` allowed only `ses:SendRawEmail` from that address |

Running cost is roughly $10 a month (instance plus storage). The Elastic IP is free while attached to a running instance and billed if the instance is stopped.

## One-time server setup

1. `scripts/ec2-bootstrap.sh` runs automatically via EC2 user-data on first boot (installs Docker, creates swap, enables unattended-upgrades). It's idempotent, so it's safe to re-run by hand over SSH if needed.
2. Copy `infra/.env.example` to `infra/.env` on the server and fill in real values: `API_DOMAIN`, Postgres credentials, `CORS_ORIGINS`, and optionally `GITHUB_TOKEN` and the email settings below. Keep the file readable only by its owner (`chmod 600 infra/.env`).
3. Run `scripts/deploy.sh` from the repo root on the server. It builds and starts `db`, `api`, and `caddy` via `infra/docker-compose.yml`, then polls `/health`.
4. Seed the database once: `docker compose -f infra/docker-compose.yml exec api node dist/seed.js`.

## Email notifications (optional)

The API emails `ADMIN_EMAIL` when a ticket is created, and stays silent if these are not set:

```
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<SES SMTP username>
SMTP_PASS=<SES SMTP password>
MAIL_FROM=<verified sender address>
ADMIN_EMAIL=<where notifications go>
APP_URL=https://rovorticketting.vercel.app
```

With Amazon SES: verify the sender address (SES emails it a confirmation link), create an IAM user limited to `ses:SendRawEmail`, and derive its SMTP password from the access key. While the SES account is in sandbox mode it can only send to verified addresses, so the admin address must be verified too. Any other SMTP provider works with the same settings.

## Domain / TLS

No custom domain was required for this assignment — the API is served over HTTPS via the `<ip-with-dashes>.sslip.io` wildcard DNS service, which resolves to the Elastic IP with no DNS configuration needed. Caddy automatically obtains and renews a Let's Encrypt certificate for that hostname the first time it sees inbound traffic on ports 80/443.

If a real domain is preferred later: point an A record at the Elastic IP, set `API_DOMAIN` in `infra/.env` to that domain, and re-run `scripts/deploy.sh`.

## Vercel (frontend)

1. Import the repo into Vercel.
2. **Root Directory**: `apps/web`.
3. Leave the build and install commands on their defaults. Vercel detects the pnpm workspace and installs from the repo root, which is how the build sees `packages/shared`. This relies on "Include files outside the root directory", which is on by default for new projects and lives under Project Settings → Build and Deployment (it is not shown on the import screen).
4. Environment variable: `NEXT_PUBLIC_API_URL=https://<API_DOMAIN>`.
5. Deploy. Then add the resulting Vercel origin to `CORS_ORIGINS` in `infra/.env` on the server and restart the API. To allow Vercel's preview URLs as well, set `ALLOW_VERCEL_PREVIEWS=true` and `VERCEL_PROJECT_NAME` to the Vercel project's name.

Every push to `main` redeploys the frontend automatically.

## Redeploying

The frontend redeploys itself on every push to `main`. The API does not: SSH into the instance and run `scripts/deploy.sh`. It pulls the latest `main`, rebuilds the `api` image, restarts the stack, prunes dangling images and waits for `/health`.

- **A change that touches both the API and the UI:** update the API first, then let the frontend deploy, so the live site never shows a control the API cannot answer yet. One way is to push the commit to a temporary branch, fast-forward the server to it and build, and only then push `main`.
- **If the build seems stuck:** on a `t3.micro` the image build takes a few minutes. It has once stalled during `pnpm install`; if it shows no progress for 10 minutes, cancel it and run it again.
- **Changing only `infra/.env`** (for example `CORS_ORIGINS`): no rebuild is needed, run `docker compose -f infra/docker-compose.yml --env-file infra/.env up -d api`.

## Verifying

```
curl https://<API_DOMAIN>/health
curl https://<API_DOMAIN>/api/projects
```
