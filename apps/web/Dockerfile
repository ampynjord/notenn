# Image de production de Notenn (monorepo pnpm).
# À construire depuis la racine du dépôt :
#   docker build -f apps/web/Dockerfile -t notenn-web .

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable pnpm

# Dépendances du workspace (manifestes d'abord pour profiter du cache)
FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/.npmrc apps/web/
COPY packages/engine/package.json packages/engine/
COPY packages/argoat/package.json packages/argoat/
COPY packages/import/package.json packages/import/
RUN pnpm install --frozen-lockfile

# Build Next.js (sortie standalone)
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo ./
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @notenn/web build

# Image finale minimale
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
