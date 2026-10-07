# RovorAI Tickets

A small project and ticket management app. TypeScript throughout — Next.js frontend, Express backend, Postgres via Prisma.

## 1. Overview & live links

- **Frontend (Vercel):** https://rovorticketting.vercel.app
- **API (AWS EC2):** https://13-202-9-144.sslip.io (health: `/health`, e.g. `/api/projects`)

## 2. Local setup

**Prerequisites:** Node 22 LTS, pnpm 9, Docker Desktop.

```bash
# 1. Start a local Postgres (dev only, mapped to localhost:5432)
docker compose -f infra/docker-compose.dev.yml up -d

# 2. Install dependencies
pnpm install

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Run migrations and seed data (3 projects, 18 tickets)
pnpm --filter @app/api db:migrate
pnpm --filter @app/api db:seed:dev

# 5. Run both apps
pnpm dev
# web:  http://localhost:3000
# api:  http://localhost:4000
```

`pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm --filter @app/api test` all run at the repo root.

## 3. Architecture

```
Browser ──HTTPS──▶ Vercel: apps/web (Next.js App Router, TanStack Query)
   │
   └──HTTPS (fetch, CORS)──▶ AWS EC2 (Ubuntu 24.04, Elastic IP)
                               Caddy :80/:443  (automatic Let's Encrypt TLS, reverse proxy)
                                 └─▶ apps/api  Express + TypeScript :4000
                                       ├─▶ Postgres 16 (Docker network only, never public)
                                       └─▶ GitHub REST API (cached 5 min in Postgres)
```

A pnpm workspace monorepo: `apps/web`, `apps/api`, and `packages/shared` (Zod schemas, enums, and DTO types consumed as TypeScript source by both apps — `transpilePackages` on the web side, bundled via `tsup`'s `noExternal` on the API side). This keeps validation rules and types in exactly one place instead of duplicating them across the HTTP boundary.

The backend is a plain Express service on a small EC2 box rather than Vercel serverless functions, mainly because of the GitHub cache (see §6) and because Postgres needs a long-lived process to pool connections against — serverless functions would each cold-start their own connection and have no shared memory between invocations.

## 4. Frontend state & data handling

- **TanStack Query v5** for all server data, client-side. Query keys are centralized in `lib/queryKeys.ts`: `['projects']`, `['project', id]`, `['tickets', projectId, filters]`, `['ticket', id]`, `['repoInsights', projectId]`.
- Every mutation (create project, create ticket, update ticket) invalidates everything it could affect — e.g. updating a ticket invalidates that ticket, the project's ticket list, the project detail, and the dashboard list. This is what makes "dashboard and project page reflect changes without a manual refresh" work: React Query refetches the invalidated queries and the UI re-renders.
- Search and filters live in the URL (`?q=&status=TODO,DONE&priority=HIGH`) so they survive back-navigation and are shareable links, not just component state.
- The search input is debounced 300ms; `placeholderData: keepPreviousData`-style behavior avoids a loading flash while typing.

## 5. Database & data model

Postgres via Prisma. `Project 1 — N Ticket`, cascade delete. `TicketStatus` and `TicketPriority` are Postgres enums (not free-text), which makes invalid values a database-level constraint, not just an API-level one. Indexes on `(projectId, status)`, `(projectId, priority)`, and `(projectId, updatedAt desc)` support the dashboard's grouped counts and the project page's filtered/sorted ticket list without full scans.

A separate `RepoCache` table backs the GitHub insights cache — see §6 for why it's a table and not an in-memory `Map`.

Postgres was chosen over a document store because the data is genuinely relational (every ticket belongs to exactly one project, and the dashboard's grouped counts are a natural `GROUP BY`), and Prisma for its typed query builder and straightforward migration workflow.

## 6. GitHub integration & caching

`GET /api/projects/:id/repo-insights` normalizes GitHub's repo + latest-release responses into stars, forks, open issues, watchers, language, license, default branch, topics, last push, and latest release.

**Caching algorithm** (5-minute TTL, `RepoCache` table keyed by lowercased `owner/repo`):

1. Read the cache row. If it's younger than the TTL, return it (`source: "cache"`) — no GitHub call.
2. Otherwise, call GitHub with `If-None-Match: <stored etag>`. A `304` doesn't count against GitHub's rate limit, so this is cheap even when nothing changed — bump `fetchedAt` and return the cached data (`source: "github-revalidated"`).
3. A `200` means real changes; upsert the row with the new data and etag (`source: "github"`).
4. If GitHub errors, times out, or rate-limits: serve the stale cached row if one exists (`source: "stale"`) rather than failing the whole page; only 502 if there's nothing to fall back to.
5. Concurrent requests for the same repo during a cache miss are deduped through an in-process `Map<string, Promise>`, so a burst of page loads triggers one GitHub call, not N.

The UI shows "Updated X ago · cached/live" so the caching is visible, not just implemented.

**Why Postgres instead of an in-memory `Map`:** an in-memory cache is simplest, but it's wiped on every redeploy/restart and — critically — wouldn't survive if this ran as serverless functions at all, since separate invocations don't share memory. Postgres survives restarts and is trivially inspectable. Redis is the natural next step if this needed to scale across many API instances; for a single EC2 box it would be an extra moving part for no real benefit here.

Note: GitHub's `open_issues_count` includes open pull requests, not just issues — called out in the UI copy's intent, not hidden.

## 6a. Ticket email notifications (extra, beyond the brief)

The brief lists notifications as out of scope; this was added afterwards as an explicit extra. When a ticket is created, the API emails `ADMIN_EMAIL` with the project, title, status, priority, description, and a link to the ticket.

- Lives in `apps/api/src/notifications/`, called from `ticketService.createTicket` — routes and repositories are unaware of it.
- Sent over plain SMTP via Nodemailer, so any provider works. Production uses **Amazon SES** (`email-smtp.ap-south-1.amazonaws.com`) with an IAM user that may only `ses:SendRawEmail` from the one verified address.
- **Fire-and-forget:** the HTTP response never waits on SMTP, and a mail failure is logged instead of failing ticket creation.
- **Disabled automatically** when `SMTP_*` / `MAIL_FROM` / `ADMIN_EMAIL` aren't set (e.g. local dev).
- Limitations: no retry queue — an email is lost if SMTP is down or the process restarts mid-send (the next step would be an outbox table + worker). SES is in sandbox mode, so it can only send to verified addresses, and mail sent "from" a gmail.com address via SES may land in spam.

## 6b. Project search & delete (extras, beyond the brief)

- **Project search:** the dashboard has a search box backed by `GET /api/projects?q=` — a case-insensitive match on name or description, run in Postgres like ticket search, so it keeps working as the number of projects grows. The term lives in the URL (`/?q=`), is debounced 300ms, and the previous results stay on screen (dimmed) while the next ones load.
- **Delete:** `DELETE /api/projects/:id` and `DELETE /api/tickets/:id` return `204`, or `404` if the record is already gone. Deleting a project removes its tickets through the database's `ON DELETE CASCADE`. In the UI both sit behind a confirmation dialog that names what will be removed and focuses **Cancel** by default; they are low-emphasis buttons on the project and ticket pages so they don't compete with the main actions.
- After a delete the affected lists are invalidated as with any other mutation, and the deleted record's cached data is purged once its page has closed, so Back shows "not found" rather than a stale copy.
- Limitations: deletes are permanent (no soft delete or undo), and because there is no authentication (per the brief) anyone with the link can delete data.

## 7. Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full AWS + Vercel walkthrough. Summary: the API runs in Docker on a single EC2 instance behind Caddy (automatic HTTPS via Let's Encrypt); the frontend is a standard Vercel deployment pointed at the API's public URL via `NEXT_PUBLIC_API_URL`.

## 8. Technical decisions & trade-offs

- **EC2 + Caddy vs. serverless for the API:** chosen for the long-lived Postgres connection pool and the GitHub cache (§6). The cost is one more thing to patch/monitor versus a fully managed platform — mitigated here with `unattended-upgrades` and a minimal attack surface (only 22/80/443 open, Postgres never exposed).
- **`ILIKE` search vs. full-text search:** ticket search uses a case-insensitive `contains` on title/description. At the assignment's scale (15–20 tickets) this is instant and simple. At real scale, `pg_trgm` + a GIN index (for fuzzy/substring search) or Postgres full-text search (for ranked relevance) would be the next step — not implemented here because it would be unverifiable complexity against 18 rows.
- **No pagination:** the project/ticket lists return everything that matches. Explicitly out of scope at this data size; would be required before this could handle hundreds of tickets per project.
- **Client-side fetching vs. React Server Components:** all data fetching goes through TanStack Query on the client rather than server components, specifically so that cache invalidation after a mutation can drive a refetch without a full page reload — the "no manual refresh" requirement is much simpler to satisfy with a client-side cache than by re-running server components on every navigation.

## 9. Assumptions, known limitations, incomplete functionality

- No authentication, multi-tenancy, or permissions, per the assignment's explicit scope.
- New tickets always start as **Todo**: the create dialog doesn't offer a status, and a ticket moves to In Progress or Done by editing it. (The API still accepts an optional `status` on create and defaults to `TODO`.)
- Ticket search/filtering has no pagination; fine at the seeded scale, not production-scale.
- Repo verification at project-creation time only checks the repo exists (a 404 is rejected); it doesn't re-validate on every ticket operation.
- The GitHub-insights "one more useful metric" beyond stars/forks/open issues/last-updated is latest release tag + watcher count — shown together since either may be absent for a given repo.
- Rate limiting is intentionally generous (300 req/min/IP) since this is a demo, not a production API under real load.

## 10. AI tools used

TODO(human)

## 11. One AI suggestion changed, rejected, or improved — and why

TODO(human)
