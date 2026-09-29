FROM node:24-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# The build input key, over exactly the context Docker sent (.dockerignore applied) and the public values.
# `docker build --target key --output type=local,dest=<dir> .` writes it to <dir>/BUILD_KEY on its own.
FROM base AS keycalc
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
COPY . /ctx
RUN node /ctx/scripts/release/build-key.mjs /ctx > /BUILD_KEY

FROM scratch AS key
COPY --from=keycalc /BUILD_KEY /BUILD_KEY

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
# Only public values: they are compiled into the browser bundle and the CSP. Nothing secret is a build argument.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN for name in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; do \
      eval "value=\${$name:-}"; [ -n "$value" ] || { echo "build argument $name is missing" >&2; exit 1; }; \
    done
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
# A file, not an env var: an env file given to the container cannot override what /api/build reports.
COPY --from=keycalc /BUILD_KEY ./BUILD_KEY
RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node

EXPOSE 3000

CMD ["node", "server.js"]
