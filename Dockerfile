FROM node:24-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Everything the runtime owns belongs to the unprivileged user: pages are generated on first visit and
# revalidated, and Next writes them under .next/cache. Copied as root they would fail with EACCES.
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node

EXPOSE 3000

CMD ["node", "server.js"]
