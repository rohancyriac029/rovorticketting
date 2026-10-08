# RovorAI Tickets

A small project and ticket management app. TypeScript throughout: Next.js frontend, Express backend, Postgres via Prisma.

## 1. Overview & live links

- **Frontend (Vercel):** https://rovorticketting.vercel.app
- **API (AWS EC2):** https://13-202-9-144.sslip.io (try `/health` or `/api/projects`)

What it does:

- **Dashboard** – every project as a card: name, description, linked repo, ticket counts by status, the 3 most recently updated tickets, a link to open the project, and a **New Ticket** action for that project. **New Project** and a project search box sit at the top.
- **Project page** – summary and counts, all tickets, backend search combined with status and priority filters, **New Ticket**, and a **Repository Insights** panel when a GitHub repo is linked.
- **Ticket page** – edit title, description, status and priority; shows created/updated times.
- After any create, edit or delete, the dashboard and project page show the saved state without a manual refresh.

Three things go beyond the brief and are described in [§8](#8-extras-beyond-the-brief): email notification on ticket creation, project search, and deleting projects and tickets.

## 2. Local setup

**Prerequisites:** Node 20 or newer (22 LTS recommended), pnpm 9, Docker Desktop.

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

Notes:

- If another Postgres is already listening on port 5432, either stop it or point `DATABASE_URL` in `apps/api/.env` at a database you want to use.
- The seed is idempotent: it does nothing if any project already exists.
- Email notifications are off locally unless you fill in the `SMTP_*` values in `apps/api/.env`.
- `pnpm build`, `pnpm lint`, `pnpm typecheck` and `pnpm test` all run from the repo root.

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

A pnpm workspace monorepo with three packages:

| Package | Role |
|---|---|
| `apps/web` | Next.js 15 App Router UI. Talks only to our API, never to GitHub. |
| `apps/api` | Express service: validation, business logic, Postgres access, GitHub integration. |
| `packages/shared` | Zod schemas, enums and DTO types, consumed as TypeScript source by both apps (`transpilePackages` on the web side, bundled by `tsup` on the API side). Validation rules and types exist in exactly one place. |

**API layering** (`apps/api/src`): `routes/` parse and validate input with Zod and send JSON → `services/` hold the business logic → `repositories/` are the only code that touches Prisma. `github/` wraps the GitHub client and `notifications/` the mailer. Routes never touch the database and services never touch `req`/`res`.

**Endpoints** (errors are always `{ "error": { "code", "message", "details?" } }`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + database check |
| GET | `/api/projects?q=` | Projects with counts by status and 3 recent tickets; optional search |
| POST | `/api/projects` | Create a project (`name`, `description?`, `repo?`) |
| GET | `/api/projects/:id` | One project with its counts |
| DELETE | `/api/projects/:id` | Delete a project and its tickets |
| GET | `/api/projects/:id/tickets?q=&status=&priority=&sort=&order=` | Search and filter tickets |
| POST | `/api/projects/:id/tickets` | Create a ticket |
| GET | `/api/projects/:id/repo-insights` | Cached GitHub data for the linked repo |
| GET | `/api/tickets/:id` | One ticket with its project's name |
| PATCH | `/api/tickets/:id` | Partial update; an empty body is rejected |
| DELETE | `/api/tickets/:id` | Delete a ticket |

Status codes: `400 VALIDATION_ERROR` (with per-field details), `404 NOT_FOUND`, `422 REPO_NOT_FOUND`, `502 UPSTREAM_ERROR`, `500 INTERNAL_ERROR` (no stack traces in production).

**Why a separate Express service on EC2 rather than Vercel functions:** the GitHub cache (§6) and the database connection pool both want a long-lived process. Serverless invocations share no memory and would each open their own database connection.

## 4. Frontend state & data handling

- **Server data lives in TanStack Query v5**, fetched client-side through one typed `apiFetch` wrapper that turns the API's error envelope into an `ApiError`. Keys are centralised in `lib/queryKeys.ts`: `['projects', { q }]`, `['project', id]`, `['tickets', projectId, filters]`, `['ticket', id]`, `['repoInsights', projectId]`.
- **No manual refresh:** every mutation invalidates everything it could affect. Creating, updating or deleting a ticket invalidates the project's ticket lists, the project detail and all project lists; creating or deleting a project invalidates the project lists. React Query refetches whatever is on screen. `staleTime` is 30s and queries also refetch on window focus.
- **Search and filters are in the URL** (`/?q=`, `/projects/:id?q=&status=TODO,DONE&priority=HIGH`), so they survive a reload and back-navigation and can be shared as links. The page reads the URL once, then owns the filter state and mirrors it back to the URL one way. Filter changes are applied as updater functions, so a slow URL update or a still-pending search can never overwrite a filter the user just changed or cleared.
- **Search is debounced 300ms** in one shared `SearchField`. While a new search loads, the previous results stay on screen, dimmed, instead of flashing a skeleton.
- **Forms** use `react-hook-form` with the shared Zod schemas, so the browser and the API validate with the same rules. Server-side field errors (for example an unknown GitHub repo) are shown next to the field.
- **After a delete**, the deleted record's cached data is purged once its page has closed, so Back shows "not found" rather than a stale copy.

## 5. Database & data model

Postgres via Prisma. `Project 1 — N Ticket` with `ON DELETE CASCADE`. `TicketStatus` and `TicketPriority` are Postgres enums, which makes an invalid value a database-level error, not only an API-level one. Indexes on `(projectId, status)`, `(projectId, priority)` and `(projectId, updatedAt desc)` support the grouped counts on the dashboard and the filtered, sorted ticket list.

The dashboard payload is built without an N+1: one query for the projects, one `GROUP BY (projectId, status)` for all the counts, and one small query per project for its 3 recent tickets.

A separate `RepoCache` table backs the GitHub cache (§6).

Postgres was chosen because the data is relational (every ticket belongs to exactly one project, and the counts are a natural `GROUP BY`), and Prisma for its typed queries and migration workflow. Migrations are committed; production runs `prisma migrate deploy` when the container starts.

## 6. GitHub integration & caching

`GET /api/projects/:id/repo-insights` fetches the repo and its latest release from GitHub and normalises them. The panel shows **stars, forks, open issues & PRs, watchers**, plus language, licence, last push and latest release. The frontend never calls GitHub. A repo can be entered as `owner/repo` or a full GitHub URL, and is checked against GitHub when the project is created.

**Caching** (5-minute TTL, `RepoCache` table keyed by lower-cased `owner/repo`):

1. Read the cache row. If it is younger than the TTL, return it (`source: "cache"`) with no GitHub call.
2. Otherwise call GitHub with `If-None-Match: <stored etag>`. A `304` does not count against GitHub's rate limit; bump `fetchedAt` and return the cached data (`source: "github-revalidated"`).
3. A `200` means the data changed; store it with the new etag (`source: "github"`).
4. If GitHub errors, times out or rate-limits, serve the stale row if there is one (`source: "stale"`) rather than failing the page. Only return `502` when there is nothing to fall back to.
5. Concurrent cache misses for the same repo share one in-flight request, so a burst of page loads triggers one GitHub call.

The panel shows a **Live / Cached / Stale** badge and "Updated X ago", so the cache is visible. In practice a new issue on GitHub shows up in the app within 5 minutes.

**Why Postgres and not an in-memory `Map`:** an in-memory cache is wiped by every restart or redeploy, and would not work at all on serverless, where invocations share no memory. A table survives restarts and is easy to inspect. Redis would be the next step for many API instances; for one box it is an extra moving part with no benefit.

GitHub's `open_issues_count` includes open pull requests, so the metric is labelled "Open Issues & PRs". The TTL is `REPO_CACHE_TTL_MS`; setting `GITHUB_TOKEN` raises GitHub's rate limit from 60 to 5,000 requests an hour.

## 7. UI & accessibility

- **Theme:** warm cream and ochre in light mode, dark tones in dark mode. All colours are CSS-variable tokens, so dark mode is a token swap that follows the system setting. There is no in-app toggle.
- **Responsive:** cards go from three columns to one; on a phone each ticket becomes a stacked row and the whole row is one tap target.
- **States:** skeletons shaped like the content they replace, empty states with a next step, error states with a retry, a not-found page for unknown ids, and toasts for the result of each action.
- **Keyboard and screen readers:** visible focus rings, a skip link, labelled inputs with inline errors, dialogs built on the native `<dialog>` (real focus trap, Escape closes), status shown as text and not colour alone, and a per-page document title.
- The [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) were used as a review checklist.

## 8. Extras beyond the brief

The brief says notifications and several other features are not required. These three were added on top and do not change any required behaviour.

**Email on ticket creation.** When a ticket is created the API emails `ADMIN_EMAIL` with the project, title, status, priority, description and a link to the ticket.

- Lives in `apps/api/src/notifications/` and is called from `ticketService.createTicket`; routes and repositories do not know about it.
- Plain SMTP via Nodemailer, so any provider works. Production uses Amazon SES with an IAM user that may only send from the one verified address.
- Fire-and-forget: the HTTP response never waits on SMTP, and a mail failure is logged instead of failing ticket creation.
- Turned off automatically when the `SMTP_*`, `MAIL_FROM` or `ADMIN_EMAIL` settings are missing.

**Project search.** The dashboard search box calls `GET /api/projects?q=`, a case-insensitive match on name or description that runs in Postgres like ticket search, so it keeps working as the number of projects grows.

**Delete project / delete ticket.** `DELETE /api/projects/:id` and `DELETE /api/tickets/:id` return `204`, or `404` if the record is already gone. In the UI both are low-emphasis buttons behind a confirmation dialog that names what will be removed and focuses **Cancel** by default.

## 9. Testing

- **API: 21 Vitest tests** (`pnpm test`) covering `parseRepo`, the cache algorithm (cold fetch, served from cache within the TTL, stale fallback when GitHub fails), error responses (400 validation, 404, malformed JSON), the delete endpoints, project search, and the email notifier.
- **UI:** during development a 22-step Playwright click-through was run against the local app (create a project, add tickets from the card and from the project, search and filter including rapid type-then-click cases, edit and save, delete with cancel and confirm, back-navigation after a delete), and a shorter check was run against the live site after the later deploys. Those scripts are not part of this repository.

## 10. Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the AWS and Vercel walkthrough. In short: the API, Postgres and Caddy run in Docker on one EC2 `t3.micro` in Mumbai, with Caddy obtaining the HTTPS certificate automatically. The frontend is a standard Vercel deployment that points at the API through `NEXT_PUBLIC_API_URL`. The API only accepts browser requests from the Vercel origins listed in `CORS_ORIGINS`.

## 11. Technical decisions & trade-offs

- **EC2 + Caddy vs. serverless for the API:** chosen for the long-lived connection pool and the GitHub cache. The cost is a server to patch and watch, reduced here with automatic security updates and only ports 22, 80 and 443 open (22 from one IP).
- **`ILIKE` search vs. full-text search:** search is a case-insensitive `contains`. At this scale it is instant and simple. At real scale, `pg_trgm` with a GIN index (substring search) or Postgres full-text search (ranked relevance) would replace it.
- **No pagination:** lists return everything that matches. Fine for tens of rows; required before hundreds of tickets per project.
- **Client-side fetching vs. React Server Components:** all data goes through TanStack Query in the browser, so that invalidating the cache after a mutation refreshes every affected view. The "no manual refresh" requirement is simpler to meet this way than by re-running server components.
- **Postgres-backed cache vs. Redis or in-memory:** see §6.
- **Hard delete vs. soft delete:** deletes are permanent, which keeps the schema and every query simple. An undo or audit trail would need a `deletedAt` column and filters on every read.
- **Fire-and-forget email vs. a queue:** simplest thing that keeps ticket creation fast and reliable. The trade-off is no retry (see §12).

## 12. Assumptions, known limitations, incomplete functionality

Assumptions:

- No authentication, users or permissions, as the brief says they are not required. Everyone sees and can change everything.
- New tickets always start as **Todo**: the create dialog does not offer a status, and a ticket moves to In Progress or Done by editing it. The API still accepts an optional `status` on create and defaults to `TODO`.
- "Recent tickets" on a card means the 3 most recently updated.
- The extra repository metrics beyond stars, forks, open issues and last update are watchers and latest release.

Known limitations:

- **The live demo is public and writable.** With no login, any visitor can add, edit or delete data, so the live data may differ from the seed.
- No pagination, and search is a simple substring match (§11).
- Deletes are permanent; there is no undo.
- Email is best-effort: no retry queue, so a message is lost if SMTP is down. Amazon SES is in sandbox mode and can only send to verified addresses, and mail sent "from" a gmail.com address through SES may land in spam.
- A linked repo is checked when the project is created, not afterwards. If it is later renamed or made private, the insights panel shows the last cached data marked Stale, or an error if nothing was cached, while the rest of the page keeps working.
- Dark mode follows the system setting only.
- One EC2 instance with Postgres on a Docker volume: no automated backups, no failover, and deploys are a manual `scripts/deploy.sh` (no CI/CD).
- The API hostname uses sslip.io, a free wildcard-DNS service, instead of an owned domain.
- Rate limiting is generous (300 requests a minute per IP), suited to a demo.
- The browser click-through tests are not in the repository (§9).

Nothing in the brief's required list is knowingly incomplete.

## 13. AI tools used

I used **Claude Code** (Anthropic's Claude, run inside VS Code) as a pair programmer for the whole project. It wrote most of the code under my direction. Specifically, I used it for:

- **Scaffolding and implementation** – the monorepo, shared Zod schemas, the Express API and the Next.js UI, working from a written spec of the brief.
- **Infrastructure** – provisioning the EC2 instance, security group, Elastic IP and SES sender through the AWS CLI, and writing the Docker, Caddy and deploy scripts.
- **Testing** – the Vitest suite, and driving a real browser with Playwright to click through the app and screenshot it in light, dark and mobile layouts.
- **Review** – reviewing screenshots of the UI against the Vercel Web Interface Guidelines, which surfaced the broken dark-mode badges and the clipped mobile table.
- **Documentation** – drafting this README, which I then checked against the app.

## 14. One AI suggestion changed, rejected, or improved — and why

**The fix for "Clear Filters" that only looked finished.**

On the project page, clicking **Clear Filters** would sometimes bring the old status filter back a moment later. The AI found the cause: the search box waits 300ms before applying what you typed, and when that timer fired it merged the search term into an out-of-date copy of the filters. Its fix was to keep the latest filters in a ref and read them when the timer fired. The browser test passed, and the fix was committed.

The same test failed at the same step on a later run. The fix had only moved the problem: the filters were still read back from the URL, and when the URL update itself was slow, the "latest" copy was still stale. It had passed the first time on timing.

That implementation was replaced with a different design rather than patched again:

- The page reads the URL once, then **owns** the filter state and writes it to the URL one way. Nothing is read back, so a slow URL update cannot feed old filters in.
- Every filter change is an **updater function** applied to the current state, so a delayed search can't overwrite a chip toggled in the meantime.
- **Clear Filters** cancels a search that is still waiting to apply.

Two test steps were added that deliberately hit the race (type, then immediately toggle a chip; type, then immediately clear), and the suite was run repeatedly rather than once.

Why this is the example I chose: the first fix was plausible, explained well, and passed its test. What exposed it was running the test again under different conditions. A passing test showed the symptom was gone on that run, not that the cause was removed.

Two smaller ones:

- **Status on the create form.** The AI's first New Ticket dialog let you pick any status. I had it removed so every ticket starts as Todo and only moves forward by editing, which is how a ticket workflow should read.
- **Login and roles.** I asked for user and admin logins and the AI drew up a plan for Google sign-in, roles and a resolution workflow. I stopped it before any code was written after re-reading the brief: those items are listed as not required, and they would have broken things the brief does require, such as any user being able to edit a ticket and see every ticket in a project.
