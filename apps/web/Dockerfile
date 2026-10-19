# Image de production de Notenn (monorepo pnpm).
# Build from the repository root:
#   docker build -f apps/web/Dockerfile -t notenn-web .

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable pnpm

# Workspace dependencies (manifests first, to benefit from the layer cache)
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
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 MEDIA_DIR=/data/media
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs \
  && mkdir -p /data/media && chown -R nextjs:nodejs /data
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
