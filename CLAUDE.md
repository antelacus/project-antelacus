# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**antelacus.com** — a multilingual personal blog/portfolio with a "活手稿" (living manuscript) aesthetic. Built with Next.js 15 App Router, Supabase (PostgreSQL), self-hosted on VPS via Docker + nginx.

## Commands

```bash
npm run dev                       # Dev server with Turbopack
npm run build                     # Production build (postbuild: tags, search index, content validation)
npm run start                     # Serve production build locally
npm run lint                      # ESLint (Next.js + TypeScript rules)
npm run test                      # Unit tests (Node.js built-in test runner)
node --import tsx --test tests/posts.test.ts  # Run a single test file
npm run validate:dynamic-content  # Zod schema validation for Supabase content
npm run seo:check                 # SEO smoke test (sitemap, robots, metadata)
npm run seo:validate              # Validate homepage metadata + OG images
```

**Minimum verification gate**: `npm run lint && npm run build` must pass before any PR/merge. Content changes should also pass `npm run validate:dynamic-content`.

## Architecture

### Data Flow (v2.1.0 — Supabase)

```
Supabase DB (content_items, content_tags, gallery_images, project_links)
    ↓
src/lib/server/*-repo.ts    — Server-only queries (import "server-only")
    ↓
src/lib/{posts,notes,gallery,projects}.ts  — Public loaders with unstable_cache (ISR)
    ↓
src/app/[locale]/...        — Server components render pages
```

### Type Safety (3-layer pattern)

Each content type follows the same structure:
- **Domain types**: `Post`, `Note`, `Photo`, `Project` (in `src/lib/*-types.ts`)
- **DB row types**: `PostRecordRow`, etc. (derived from `src/lib/server/database.types.ts`)
- **Mappers**: `mapPostRecordToPost()`, etc. (in repo files)

When adding/modifying content types, maintain all three layers.

### Key Directories

```
src/app/[locale]/          # Localized routes (App Router)
src/app/[locale]/admin/    # Protected admin routes (Supabase Auth)
src/components/            # React components (PascalCase: PostCard.tsx)
src/lib/                   # Public data loaders and type definitions
src/lib/server/            # Server-only repo functions (DB queries)
src/lib/supabase/          # Supabase client creation (browser/server/middleware)
src/i18n/                  # Locale config, detection, routing
src/messages/              # UI translation JSON files per locale
src/content/               # Legacy MDX content (posts, notes, gallery, projects)
src/app/globals.css        # Global styles, CSS variables, card/container system
deploy/                    # Docker, nginx configs
supabase/                  # DB migrations
tests/                     # Unit tests (*.test.ts)
scripts/                   # Build-time utilities (SEO, validation, indexing)
docs/                      # Architecture docs, deployment guide, version plans
```

### Internationalization

- **5 locales**: `zh-CN`, `zh-HK`, `en` (default), `fr`, `es` — defined in `src/i18n/routing.ts`
- **URL-based**: `/{locale}/posts/...` — middleware auto-detects and redirects
- **UI strings**: `src/messages/{locale}.json` — add keys to `zh-CN.json` first, then sync others
- **Content**: Single source per article (no per-locale MDX duplicates); all locales show the same content

### Middleware (`middleware.ts`)

Handles two concerns:
1. **i18n routing**: locale detection from `Accept-Language`, redirect to `/{locale}/...`, normalize variant codes (e.g., `zh-hans` → `zh-CN`)
2. **Auth**: `/admin` and `/auth` routes go through Supabase session middleware

### Styling System

- Global theme via CSS variables in `src/app/globals.css` (`--color-paper`, `--color-ink`, `--color-seal`, etc.)
- Container classes: `.content-container-standard` (90ch), `.content-container-wide` (110ch)
- Card system: `.card`, `.card-link`, `.tag` — unified across all content types
- Tailwind CSS 4 for utilities; custom CSS for semantic components

### Search

- **Build-time**: `scripts/build-search-index.ts` generates static JSON index per locale
- **Runtime**: `SearchModal.tsx` loads index client-side, filters in-memory
- **Dev fallback**: `/api/search-index` endpoint generates index dynamically

### Authentication

- Supabase Auth with cookie-based sessions (`@supabase/ssr`)
- Admin access controlled by `SUPABASE_ADMIN_EMAILS` env var
- Protected routes under `/admin/(protected)/`

## Environment Variables

See `.env.example`. Critical ones:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public, client-safe
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to client
- `SUPABASE_ADMIN_EMAILS` — comma-separated admin emails
- `ANTELACUS_PORT=3002` — host port for Docker; container runs on `PORT=3000`

## Deployment

```bash
# On VPS: pull, build Docker image, restart
git pull && docker compose up -d --build
```

- `output: 'standalone'` in `next.config.ts` for Docker
- nginx reverse proxy config at `deploy/nginx/www.antelacus.com.conf`
- Cloudflare DNS in front

## Coding Conventions

- **TypeScript strict mode** with `@/*` path alias (maps to `./src/*`)
- **Naming**: Components `PascalCase.tsx`, utilities `camelCase.ts`, scripts `kebab-case.ts`
- **Commits**: Conventional Commits — `feat(scope): description`, `fix(search): ...`, `chore(v2.0.0): ...`
- **Branching**: All work on `development` → merge to `main` → tag for release
- Server-only code must import `"server-only"` package
- Wrap all `JSON.parse` in try-catch
- No secrets in `NEXT_PUBLIC_*` prefixed vars; no tokens in localStorage

## Testing

- Framework: Node.js built-in `test` module (no Jest/Vitest)
- Test files: `tests/*.test.ts`
- Coverage: type mappers, tag extraction, date resolution
- Run with: `node --import tsx --test tests/*.test.ts`

## Documentation

Project docs live in `docs/`. Version-specific development docs go in `docs/versions/v*/[feature-name]/` using phase-prefixed names (`PHASE1_PRD.md`, `PHASE2_DESIGN.md`, `PHASE3-5_TRACK.md`). Never create `docs/plans/` or date-prefixed files.
