FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm install --filter @app/api... --frozen-lockfile=false
WORKDIR /repo/apps/api
RUN pnpm exec prisma generate
RUN pnpm run build
WORKDIR /repo
RUN pnpm deploy --filter=@app/api --prod /deploy

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy/dist ./dist
COPY --from=build /deploy/prisma ./prisma
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /deploy/package.json ./package.json
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
  && useradd --system --create-home appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
