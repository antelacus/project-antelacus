# CLAUDE.md

**antelacus.com** — a multilingual personal blog/portfolio with a "活手稿" (living manuscript) aesthetic. Next.js 15 App Router, Supabase (PostgreSQL), self-hosted on a VPS with Docker + nginx, Cloudflare in front.

## Commands

The scripts are in `package.json`. What the names do not tell you:

- `npm run test` — unit tests on Node's built-in runner (no Jest/Vitest). One file: `node --import tsx --test tests/posts-repo.test.ts`.
- `npm run test:runtime` — acceptance checks against a **running** server; needs `BASE_URL`. How to build and start a local server without a database is in the header of `tests/runtime/acceptance.runtime.mjs`.
- `npm run build` must succeed without reaching Supabase; the gate builds with placeholder env vars to prove it.

**The gate** is `.github/workflows/check.yml`: every push and PR runs it, and `.github/workflows/deploy.yml` deploys only after it passes. Before pushing, run what it runs first: `npm run lint && npx tsc --noEmit && npm run test`.

## Architecture

### Data flow

```
Supabase (content_items, content_tags, gallery_images, project_links)
  → src/lib/server/*-repo.ts                   server-only queries and row → domain mappers
  → src/lib/{posts,notes,gallery,projects}.ts  public loaders: unstable_cache, one tag per content type, one hour
  → src/app/[locale]/…                         server components
```

A write path invalidates its content type's tag after a successful write (`revalidateTag`); every page showing that content reads it through the tag, so nothing is revalidated by path.

Each content type keeps three layers — domain type (`src/lib/post-types.ts`), row type (from `src/lib/server/database.types.ts`), mapper (in its repo file). Change all three together.

### Routing and languages

- Supported locales, the default, and the public sections are listed in `src/i18n/routing.ts` and nowhere else (a test enforces it).
- Every locale rule lives in `src/i18n/route-decision.ts`, a pure function; `src/proxy.ts` (Next 16's name for the middleware) only carries out its decision. The proxy must stay in `src/` — at the repo root Next builds without error and silently does not register it.
- There is no top-level layout. `src/app/[locale]/layout.tsx` and `src/app/admin/layout.tsx` are the root layouts and share `src/components/SiteDocument.tsx`, so `<html lang>` comes from the URL.
- **Public pages stay cacheable**: nothing rendered under `src/app/[locale]/` reads cookies or headers, and every layout and page there calls `setRequestLocale`. Evidence of cacheability is a running server's response headers — the build's route table is not.
- A new public section = a directory under `src/app/[locale]/` **and** an entry in `localizedSections`; without the entry its unprefixed URL is a 404 instead of a redirect.
- A new top-level route or file in `public/` must be registered in `src/i18n/routing.ts` too: the proxy answers 404 for any first segment it does not know, compared by whole segment, never by prefix (a test enforces the registry).
- The 404 page is `src/app/global-not-found.tsx` (an experimental Next flag in `next.config.ts`). Do not build behaviour on `notFound()` in a root layout.
- Share images (`og.png` routes) keep their unprefixed URLs — external platforms have cached them.
- UI strings: `src/messages/<locale>.json`; a key missing from a locale falls back to `en`. Content is single-source — every locale shows the same article.

The framework constraints behind these rules, each with the measurement that established it: `docs/features/routing-slimdown/DESIGN.md` §7–§8.

### Search

`src/components/SearchModal.tsx` fetches `/api/search-index` once and filters in memory.

### Authentication

Supabase Auth, cookie sessions (`@supabase/ssr`); admins are the emails in `SUPABASE_ADMIN_EMAILS`. The service-role client bypasses RLS and is handed out only by `getAdminServiceRoleClient` in `src/lib/server/admin-auth.ts` (a test enforces it). A check in a layout does not protect a page — Next renders them in parallel.

### Styling

Theme variables, the container classes (`.content-container-standard`, `.content-container-wide`) and the card system (`.card`, `.card-link`, `.tag`) are in `src/app/globals.css`; Tailwind 4 for utilities. The aesthetic intent: `docs/aesthetic-thesis.md`.

## Environment and deployment

Variables: `.env.example`. The real `.env` exists only on the VPS. `SUPABASE_SERVICE_ROLE_KEY` is server-only; nothing secret goes in a `NEXT_PUBLIC_*` variable.

A push to `main` deploys: gate → SSH to the VPS → `docker compose up -d --build` → health check. Details: `docs/DEPLOYMENT.md`, `deploy/nginx/www.antelacus.com.conf`.

## Conventions

- TypeScript strict; `@/*` maps to `src/`. Components `PascalCase.tsx`, utilities `camelCase.ts`.
- Server-only modules import `"server-only"`. Wrap `JSON.parse` in try-catch. No tokens in localStorage.
- Commits: Conventional Commits with the version or module as scope — `feat(v2.2.0): …`, `fix(og): …`.
- Branching: a feature branch → PR into `main` → tag.

## Documentation

Feature docs live in `docs/features/<feature>/` as `REQ.md`, `DESIGN.md` and the live `TRACK.md`; the `custom-conventions` skill governs what goes where. Open debt: `docs/TECHNICAL_DEBT.md`. `docs/versions/` is the archive from before that convention.
