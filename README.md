# RovorAI Tickets

A small project and ticket management app. TypeScript throughout: Next.js frontend, Express backend, Postgres via Prisma.

- **Live app (Vercel):** https://rovorticketting.vercel.app
- **API (AWS EC2):** https://13-202-9-144.sslip.io (try `/health` or `/api/projects`)

## 1. Setup

**Prerequisites:** Node 20+ (22 LTS recommended), pnpm 9, Docker Desktop.

```bash
docker compose -f infra/docker-compose.dev.yml up -d   # Postgres on localhost:5432
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @app/api db:migrate                      # create tables
pnpm --filter @app/api db:seed:dev                     # 3 projects, 18 tickets
pnpm dev                                               # web :3000, api :4000
```

If another Postgres already uses port 5432, stop it or change `DATABASE_URL` in `apps/api/.env`. `pnpm build`, `pnpm lint`, `pnpm typecheck` and `pnpm test` run from the repo root.

## 2. Architecture

```
Browser ──HTTPS──▶ Vercel: apps/web (Next.js App Router, TanStack Query)
   │
   └──HTTPS (fetch, CORS)──▶ AWS EC2 (Ubuntu 24.04, Elastic IP)
                               Caddy :80/:443  (automatic Let's Encrypt TLS, reverse proxy)
                                 └─▶ apps/api  Express + TypeScript :4000
                                       ├─▶ Postgres 16 (Docker network only, never public)
                                       └─▶ GitHub REST API (cached 5 min in Postgres)
```

A pnpm monorepo: `apps/web` (UI), `apps/api` (backend) and `packages/shared` (Zod schemas, enums and types imported by both, so validation rules exist in one place).

Inside the API, `routes/` validate input and send JSON, `services/` hold the business logic, and `repositories/` are the only code that touches the database.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects?q=` | Projects with counts by status and 3 recent tickets |
| POST | `/api/projects` | Create a project |
| GET / DELETE | `/api/projects/:id` | One project with counts / delete it and its tickets |
| GET | `/api/projects/:id/tickets?q=&status=&priority=` | Search and filter tickets |
| POST | `/api/projects/:id/tickets` | Create a ticket |
| GET | `/api/projects/:id/repo-insights` | Cached GitHub data |
| GET / PATCH / DELETE | `/api/tickets/:id` | Read / update / delete a ticket |

Errors are always `{ "error": { "code", "message", "details?" } }` with `400`, `404`, `422`, `502` or `500`.

Deployment steps are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 3. Frontend state & application data

- **Server data lives in TanStack Query**, fetched in the browser through one typed `apiFetch` wrapper. Query keys are centralised in `lib/queryKeys.ts`.
- **No manual refresh:** every mutation invalidates everything it could affect. Saving a ticket invalidates that project's ticket lists, the project detail and the dashboard list, and React Query refetches whatever is on screen.
- **Search and filters are in the URL** (`?q=&status=TODO,DONE&priority=HIGH`), so they survive reloads and back-navigation and can be shared. The page reads the URL once, then owns the filter state and mirrors it back one way.
- **Search runs on the backend**, debounced 300ms. Previous results stay on screen, dimmed, while new ones load.
- **Forms** use `react-hook-form` with the shared Zod schemas, so browser and API validate with the same rules.
- Loading skeletons, empty states, error states with retry, and a not-found page cover the non-happy paths. The layout is responsive and has a dark mode that follows the system setting.

## 4. Database & data model

Postgres via Prisma. `Project 1 → N Ticket` with `ON DELETE CASCADE`. Status and priority are Postgres enums, so an invalid value is rejected by the database as well as the API. Indexes on `(projectId, status)`, `(projectId, priority)` and `(projectId, updatedAt desc)` back the counts and the filtered ticket list.

The dashboard avoids an N+1: one query for projects, one `GROUP BY (projectId, status)` for all counts, and one small query per project for its recent tickets. A `RepoCache` table holds the GitHub cache. Migrations are committed and applied automatically when the API container starts.

## 5. GitHub integration & caching

`GET /api/projects/:id/repo-insights` fetches the repo and its latest release from GitHub. The panel shows stars, forks, open issues & PRs, watchers, language, licence, last push and latest release. The frontend never calls GitHub. A repo can be entered as `owner/repo` or a full URL and is checked when the project is created.

Results are cached for **5 minutes** in the `RepoCache` table:

1. If the cached row is younger than 5 minutes, return it. No GitHub call.
2. Otherwise ask GitHub with the stored ETag. "Not modified" costs nothing against the rate limit; just reset the timer.
3. If the data changed, store the new copy.
4. If GitHub is down or rate-limited, serve the old copy marked **Stale** instead of failing the page.
5. Simultaneous requests for the same repo share one GitHub call.

The panel shows a Live / Cached / Stale badge and "Updated X ago", so the cache is visible.

## 6. Technical decisions & trade-offs

- **Express on EC2 vs. Vercel functions:** the cache and the database connection pool want a long-lived process. The cost is a server to maintain.
- **Cache in Postgres vs. in memory or Redis:** an in-memory cache is lost on every restart and doesn't work on serverless. Redis would only earn its place with several API instances.
- **Client-side fetching vs. Server Components:** a client cache makes "update everywhere without a refresh" a matter of invalidating keys.
- **Substring search (`ILIKE`) vs. full-text search:** instant and simple at this size. `pg_trgm` or Postgres full-text search would replace it at scale.
- **No pagination:** fine for tens of rows, needed before hundreds.

## 7. Beyond the brief

Three additions that don't change any required behaviour:

- **Email on ticket creation** to an admin address (Nodemailer over SMTP, Amazon SES in production). Sent in the background so creating a ticket never waits on or fails because of email.
- **Project search** on the dashboard, run in Postgres like ticket search.
- **Delete project / delete ticket**, each behind a confirmation dialog that focuses Cancel.

Tests: 21 API tests (`pnpm test`) cover repo parsing, the cache logic, error responses, delete, search and the notifier. The UI was checked with a Playwright click-through during development; those scripts are not in the repo.

## 8. Assumptions & known limitations

- No authentication or roles, as the brief allows. **The live demo is public and writable**, so anyone can change or delete its data.
- New tickets always start as **Todo** and move forward by editing.
- "Recent tickets" means the 3 most recently updated.
- No pagination; search is a simple substring match.
- Deletes are permanent, with no undo.
- Email is best-effort with no retry, and may land in spam.
- One server with no automated backups; API deploys are a manual script.
- The API hostname uses sslip.io, a free DNS service, instead of an owned domain.

Nothing on the brief's required list is knowingly incomplete.

## 9. AI tools used

I used **Claude Code** (Anthropic's Claude, inside VS Code) as a pair programmer throughout. It wrote most of the code under my direction:

- **Implementation:** the monorepo, shared schemas, API and UI, working from a written spec of the brief.
- **Infrastructure:** provisioning the AWS server and writing the Docker, Caddy and deploy scripts.
- **Testing and review:** the API tests, driving a real browser with Playwright, and reviewing screenshots against the Vercel Web Interface Guidelines.
- **Documentation:** drafting this README, which I checked against the app.

## 10. One AI suggestion changed, rejected, or improved — and why

**A bug fix that only looked finished.** Clicking **Clear Filters** on the project page would sometimes bring the old status filter back a moment later. The AI found the cause: the search box waits 300ms before applying, and when that timer fired it merged the search term into an out-of-date copy of the filters. Its fix was to read the latest filters from a ref when the timer fired. The browser test passed and the fix was committed.

On a later run the same test failed at the same step. The filters were still being read back from the URL, so whenever the URL update was slow, the "latest" copy was stale too. The first pass had been luck with timing.

That fix was replaced with a different design instead of being patched again: the page owns the filter state and writes it to the URL one way, every change is applied as an updater function on the current state, and Clear Filters cancels a pending search. Two test steps were added that deliberately trigger the race, and the suite was run repeatedly.

Why I chose this one: the first fix was plausible, well explained and passed its test. Only running the test again exposed it. A passing test showed the symptom was gone on that run, not that the cause was removed.

Two smaller ones: the AI's first New Ticket form let you pick any status, and I had it changed so tickets always start as Todo. I also stopped an AI-drafted plan for logins and roles before any code was written, after re-reading the brief: they aren't required, and they would have broken things that are, such as any user being able to edit a ticket.
