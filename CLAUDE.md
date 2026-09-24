# CLAUDE.md

**antelacus.com** — a multilingual personal blog/portfolio with the 《临湖》 (Ante Lacus) aesthetic. Next.js App Router, Supabase (PostgreSQL), self-hosted on a VPS with Docker + nginx, Cloudflare in front.

## Commands

The scripts are in `package.json`. What the names do not tell you:

- `npm run test` — unit tests on Node's built-in runner (no Jest/Vitest). It preloads `tests/setup/stub-server-only.mjs` so modules that import `server-only` can be tested; one file: `node --import tsx --import ./tests/setup/stub-server-only.mjs --test tests/posts-repo.test.ts`. Database-touching code is tested against `tests/fakes/supabase.ts`.
- `npm run test:runtime` — acceptance checks against a **running** server; needs `BASE_URL`. How to build and start a local server without a database is in the header of `tests/runtime/acceptance.runtime.mjs`.
- `npm run build` must succeed without reaching Supabase; the gate builds with placeholder env vars to prove it.
- `npm run test:ui` — the UI gate, `scripts/ui-check.sh`: a local Supabase stack (Docker; on a Mac it starts colima if needed) seeded from `supabase/seed.sql`, a build against it, then `tests/ui/` and the runtime suite with the database. It tears down everything it started and refuses any address off this machine. Takes a few minutes. `UI_SERVE=1 npm run test:ui` serves the same seeded site for a look by hand instead of checking it.

**The gate** is `.github/workflows/check.yml` (jobs `check` and `ui`): every push and PR runs it, and `.github/workflows/deploy.yml` deploys only after it passes. Before pushing, run what it runs first: `npm run lint && npx tsc --noEmit && npm run test`. At a version close, also `python3 scripts/check_doc_budget.py` (retired from the gate, still the budget).

## Architecture

### Data flow

```
Supabase (content_items, content_tags, gallery_images, project_links)
  → src/lib/server/content-repo.ts             server-only reads and the save (one RPC), parameterised by content type
  → src/lib/{posts,notes,gallery,projects}.ts  public loaders: unstable_cache, one tag per content type, half an hour
  → src/lib/markdown/                          the one Markdown renderer (public pages and the admin preview)
  → src/app/[locale]/…                         server components
```

What differs between the four content types (cache tag, section, relation, mappers) is one row each in `src/lib/content-types.ts`; the repo, the loaders and the admin read it there. A content type's mapper lives in its `src/lib/*-types.ts` on the shared row of `src/lib/content-row.ts`.

Writes go through `/admin/content/<type>/<slug>` → `src/app/admin/(protected)/content/actions.ts` → `save_content_item`, a database function (in `supabase/migrations/`) that writes the row and its relations in one transaction; `scripts/db-function-check.sh` exercises it on a throwaway Postgres. After a save the action invalidates the type's tag; every page showing that content reads it through the tag, so nothing is revalidated by path. Images upload through `POST /api/admin/upload` into the `media` bucket.

The about page is not content: one row per language in `site_pages`, read through `src/lib/pages.ts` (tag `pages`; the language fallback is `src/lib/page-locale.ts`) and edited, text only, at `/admin/pages/about`.

Bodies are Markdown, never executed: raw HTML and JSX render as text, links are http(s)/mailto only.

### Routing and languages

- Supported locales, the default, and the public sections are listed in `src/i18n/routing.ts` and nowhere else (a test enforces it).
- Every locale rule lives in `src/i18n/route-decision.ts`, a pure function; `src/proxy.ts` (Next 16's name for the middleware) only carries out its decision. The proxy must stay in `src/` — at the repo root Next builds without error and silently does not register it.
- There is no top-level layout. `src/app/[locale]/layout.tsx` and `src/app/admin/layout.tsx` are the root layouts and share `src/components/SiteDocument.tsx`, so `<html lang>` comes from the URL.
- **Public pages stay cacheable**: nothing rendered under `src/app/[locale]/` reads cookies or headers, and every layout and page there calls `setRequestLocale`. Evidence of cacheability is a running server's response headers — the build's route table is not.
- A new public section = a directory under `src/app/[locale]/` **and** an entry in `localizedSections`; without the entry its unprefixed URL is a 404 instead of a redirect.
- A new top-level route or file in `public/` must be registered in `src/i18n/routing.ts` too: the proxy answers 404 for any first segment it does not know, compared by whole segment, never by prefix (a test enforces the registry).
- An unknown path gets `src/app/global-not-found.tsx` (an experimental Next flag in `next.config.ts`); an unknown slug or tag, or an about page with no version, gets `src/app/[locale]/not-found.tsx`. Do not build behaviour on `notFound()` in a root layout.
- Share images (`og.png` routes) keep their unprefixed URLs — external platforms have cached them.
- UI strings: `src/messages/<locale>.json`; a key missing from a locale falls back to `en`. Content is single-source — every locale shows the same article.

The framework constraints behind these rules, each with the measurement that established it: `docs/features/routing-slimdown/DESIGN.md` §7–§8.

### Search

`src/components/SearchDialog.tsx` fetches `/api/search-index` on first open and filters in memory with `src/lib/search-filter.ts`.

### Authentication

Supabase Auth, cookie sessions (`@supabase/ssr`); admins are the emails in `SUPABASE_ADMIN_EMAILS`. The service-role client bypasses RLS and is handed out only by `getAdminServiceRoleClient` in `src/lib/server/admin-auth.ts` (a test enforces it). A check in a layout does not protect a page — Next renders them in parallel.

### Styling

The public site's styles are all in `src/app/globals.css`, never in its components: theme variables, the layout, one section per page form — the gate and its windows, the catalogue (`.catalog`), the handscroll (`.scroll`). The admin has a section there too, plus inline styles. Tailwind 4 is imported only for its base reset; no utility classes are used. The design rules the public styles carry out: `docs/aesthetic-thesis.md`.

## Environment and deployment

Variables: `.env.example`. The real `.env` exists only on the VPS. `SUPABASE_SERVICE_ROLE_KEY` is server-only; nothing secret goes in a `NEXT_PUBLIC_*` variable.

A push to `main` deploys: gate → SSH to the VPS → `docker compose up -d --build` → health check. Details: `docs/DEPLOYMENT.md`, `deploy/nginx/www.antelacus.com.conf`.

## Conventions

- TypeScript strict; `@/*` maps to `src/`. Components `PascalCase.tsx`, utilities `camelCase.ts`.
- Server-only modules import `"server-only"`. Wrap `JSON.parse` in try-catch. No tokens in localStorage.
- Commits: Conventional Commits with the version or module as scope — `feat(v2.2.0): …`, `fix(og): …`.
- Branching: a feature branch → PR into `main` → tag.

## Documentation

Feature docs live in `docs/features/<feature>/` as `REQ.md`, `DESIGN.md` and the live `TRACK.md`; the `custom-conventions` skill governs what goes where. Open debt: `docs/TECHNICAL_DEBT.md`. Cross-feature vocabulary: `docs/GLOSSARY.md`. `docs/versions/` is the archive from before that convention.
