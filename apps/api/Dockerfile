# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo@2.10.4
COPY . .
RUN turbo prune api --docker

FROM base AS installer
# Dummy URL for prisma generate during build (runtime uses real DATABASE_URL)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hm-db"

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY apps/api/docker-entrypoint.sh /app/apps/api/docker-entrypoint.sh
COPY apps/api/docker-seed-admin.sh /app/apps/api/docker-seed-admin.sh
# Build only runtime packages (skip @repo/jest-config → next)
RUN pnpm --filter @repo/shared build \
  && pnpm --filter @repo/database build \
  && pnpm --filter api build

FROM base AS runner
ENV NODE_ENV=production
ENV HOME=/home/nestjs
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home --home-dir /home/nestjs nestjs \
  && corepack prepare pnpm@11.20.0 --activate \
  && mkdir -p /home/nestjs/.cache \
  && chown -R nestjs:nodejs /home/nestjs

COPY --from=installer --chown=nestjs:nodejs /app .

RUN chmod +x /app/apps/api/docker-entrypoint.sh \
  && chmod +x /app/apps/api/docker-seed-admin.sh

USER nestjs
EXPOSE 3000
ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
