# TECHNICAL_DEBT

## Purpose

This file tracks active technical debt, operational risks, and known limitations that are not yet resolved in the codebase.

Update this file when:

- a known risk is intentionally accepted
- a shortcut is taken to unblock delivery
- a missing workflow or safety net is identified
- a review finding is deferred instead of fixed immediately

## Active Items

### TD-001 - Supabase-only cutover lacks admin workflows for all migrated content types

- Status: `Open`
- Severity: `High`
- Area: `content-management`
- Identified: `2026-03-19`
- Context:
  - The site now relies on Supabase as the source of truth for posts, notes, projects, and gallery.
  - Only notes currently have an in-product admin CRUD/publish flow.
  - Posts, projects, and gallery content can be rendered from Supabase, but they cannot yet be managed from the admin UI.
- Risk:
  - Editorial operations are incomplete.
  - Non-note content changes currently require manual database/storage operations.
- Evidence:
  - `src/app/admin/(protected)/page.tsx`
  - `src/app/admin/(protected)/notes/page.tsx`
  - No new content has been published since the cutover (newest item on the site: 2025-08-31).
- Ruled (Project Lead): build a publishing entry for posts, projects and gallery in v2.3.0, designed together with TD-006. Open question for its Phase 1: where the writing happens — an in-site editor (works anywhere, phone included), a local file plus a publish command (best for long-form), or both.
- The note form has no protection against a double submit, and a second submit of a new note with the same slug fails on the unique constraint and shows the framework's generic error page (seen on the first real publish, 2026-09-22). The publishing entry should make saving idempotent by slug.
- Until then the procedure is `docs/content-publishing.md` §三: SQL in the Supabase console. Its SQL was derived from the schema and the code and has not been executed; the first real use is its verification.

### TD-003 - No in-repo bootstrap/recovery path for migrated content

- Status: `Open`
- Severity: `Medium`
- Area: `operations`
- Identified: `2026-03-19`
- Context:
  - The legacy content source files and import tooling were removed after the hard Supabase cutover.
  - The repository no longer contains the original migrated content bodies for posts, notes, projects, or gallery.
- Risk:
  - If the Supabase project is reset, misconfigured, or replaced, there is no repository-contained recovery path.
  - A wrong environment or empty project can make the site appear empty without a built-in backfill workflow.
- Evidence:
  - `package.json`
  - deleted legacy content under `src/content/posts`, `src/content/notes`, `src/content/projects`, `src/content/gallery`
- Ruled (Project Lead, 2026-09-22): in v2.3.0 — a cron on the VPS runs `pg_dump` plus a storage-bucket sync into the VPS data directory; the database password becomes a new secret in the VPS `.env`.

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

Who rules on what: Phase 0 of v2.3.0 (2026-09-22) took every open item on this register, including TD-001, into scope (TD-003 included) — see `docs/features/content-publishing/TRACK.md` zone 一. Nothing is parked.

### TD-005 - Five production dependency advisories remain, each behind a major upgrade

- Status: `Open` · Severity: `High` · Area: `dependencies` · Identified: `2026-09-21`
- Context: after v2.1.4 (`next` 15.5.25 + `npm audit fix`), `npm audit --omit=dev` reports 5: `next` (moderate) and `postcss` via `next` (high) — fixed only in Next 16; `next-mdx-remote` (high — see TD-006); `sharp` (high, fixed in 0.35 — nothing imports it, Next uses it for image optimisation); `next-intl` (moderate, fixed in 4.14.5 — its open-redirect path is not reachable here because its middleware and navigation are not imported).
- Ruled (Project Lead, 2026-09-22): all three, including Next 16, in v2.3.0 — overriding v2.2.0's ruling that Next 16 is its own version.

### TD-006 - Database content is compiled and executed as code on the server

- Status: `Open` · Severity: `High` · Area: `content-rendering`
- Context: `MDXRemote` (next-mdx-remote 5.0.0, no JS blocking) renders note/post/project/gallery bodies in four `[slug]/page.tsx` files. Only the admin can author content, so it is not reachable anonymously — but an admin-password compromise becomes server code execution, and the container runs as root (`Dockerfile` has no `USER`).
- Recommended follow-up: next-mdx-remote 6 with JS blocked, or plain Markdown for database-sourced content; add a non-root user to the image.

### TD-011 - The four content types repeat one repo four times

- Status: `Open` · Severity: `Low` · Area: `maintainability`
- Context: the same 19-line select block appears 10 times; the locale-prefix line `isSupportedLocale(currentLocale) ? \`/${currentLocale}\` : ''` is repeated in Nav and the four cards (one hook would do); the public repos (~380 lines) differ only by `content_type` and one relation; each `*-types.ts` repeats the base row type and three helpers; four OG routes differ by 3 lines. The four mappers genuinely differ and should stay. `src/lib/posts.ts:30` builds a new `cache()` wrapper per call, defeating request-level dedupe (the other three loaders are correct).
- Recommended follow-up: one parameterised content repo + one shared row/helper module (~−500 lines). Leave the loaders for last — a loader factory is the change most likely to be abstraction for its own sake.

### TD-012 - Failures reach visitors raw

- Status: `Open` · Severity: `Low` · Area: `resilience`
- Context: no `error.tsx` / `global-error.tsx` anywhere, so a Supabase error on a cold cache shows Next's bare 500. A missing slug returns 200 with a "not found" message instead of `notFound()` (the four detail pages under `src/app/[locale]/`); fixing that must keep the status a real 404, which `loading.tsx` defeats for anything that streams (`docs/features/routing-slimdown/DESIGN.md` §8). `/api/search-index` returns raw Supabase error text to anonymous callers, and it is the production search path. Unknown URLs are handled: they get the site's own 404 page (`src/app/global-not-found.tsx`). Two more since v2.2.0: the detail pages are now cached, so every unknown slug leaves a page and a data entry for half an hour (crawlers can grow the cache without bound) — the real `notFound()` fixes both at once; and the admin save action has no `error.tsx`, so if `revalidateTag` throws after a successful save the admin sees a generic crash instead of "saved" (`src/app/admin/(protected)/notes/actions.ts`).

### TD-013 - The keepalive alert has no reader

- Status: `Open` · Severity: `Low` · Area: `operations`
- Context: `scripts/supabase-keepalive.sh` writes `ALERT` to a log file on the VPS after three failed runs; nothing reads that file. Together with TD-003 (no backup/export), a paused or lost Supabase project would be noticed by a visitor first.
- Ruled (Project Lead, 2026-09-22): in v2.3.0, as an external dead-man's-switch service — the script pings on success, a missing ping alerts; nothing self-hosted on the VPS, since a monitor must not share a machine with what it watches.

### TD-014 - Small hardening items

- Status: `Open` · Severity: `Low` · Area: `security`
- Context: base image `node:20` is past end-of-life; no CSP or HSTS, `x-powered-by` exposed; Supabase session cookies are set without `secure`; three admin-authored XSS sinks (`PhotoViewer.tsx:190` `innerHTML`, JSON-LD written without escaping `<`, `projects/[slug]/page.tsx:105` `href` without a scheme check); "admin" is an email match only — sign-ups are confirmed disabled and email confirmation on in the Supabase dashboard (2026-09-22), which closes the register-an-admin-address hole; the runbook should record where to re-check; canonical URLs use `antelacus.com`, which nginx redirects to `www`.

### TD-016 - The tests pin mappers only

- Status: `Open` · Severity: `Low` · Area: `tests`
- Context: 12 of 15 cases are mapper snapshots on a full fixture; no fallback path is covered (null `published_at`, null/array metadata, empty tags). Still untested: the sitemap's locale expansion and XML escaping, `getSafeNextPath`. (The locale routing functions are now covered by acceptance tests.)

### TD-017 - The remembered language lasts 7 days on Safari, not a year

- Status: `Open` · Severity: `Low` · Area: `i18n`
- Context: `preferred_locale` is written by `document.cookie` in `src/components/UtilityDropdown.tsx`; Safari's tracking prevention caps script-written cookies at 7 days. A Safari visitor who chose a language falls back to the browser language after a week. Fix: write the cookie from the server (a route handler or server action), which is not capped.

### TD-018 - The skip link lands before the navigation

- Status: `Open` · Severity: `Low` · Area: `accessibility`
- Context: `src/components/SiteDocument.tsx` wraps `children` in `<main id="main-content">`, but the `[locale]` layout renders `<Nav />` inside `children`, so "skip to main content" skips nothing; the admin setup notice and the detail pages' not-found branches nest a second `<main>`. Predates v2.2.0. Fix: the layout renders the nav outside `<main>`, and the inner `<main>`s become `<div>`s.

### TD-019 - The about page is the last repo-file content and the last MDX user

- Status: `Open` · Severity: `Low` · Area: `content-management` · Identified: `2026-09-22`
- Context: `/about` reads `src/content/pages/about/*.mdx`, five per-language files written as JSX (sections, a contact grid, inline SVG icons), rendered by `next-mdx-remote`. It cannot be edited from the admin, and it is the one page the Markdown-only renderer of v2.3.0 does not cover. Converting it to Markdown changes its appearance, which v2.3.0 forbids.
- Ruled (Project Lead, 2026-09-22): v2.4.0 — the visual upgrade redesigns the about page, and it moves into the database as Markdown (per-language rows with fallback to English, then any) in the same version; `next-mdx-remote` leaves with it.

### TD-020 - Three React hook rules run as warnings, not errors

- Status: `Open` · Severity: `Low` · Area: `lint` · Identified: `2026-09-22`
- Context: `eslint-config-next` 16 enables the React Compiler's `react-hooks/set-state-in-effect`, `immutability` and `static-components`. Eighteen existing sites fail them: state set inside effects in the four cards, `Nav`, `SearchModal`, `UtilityDropdown`; ref mutation in `PhotoViewer`; components defined inside `SearchModal`'s render. `eslint.config.mjs` downgrades the three rules to warnings so the gate stays meaningful.
- Retirement trigger: v2.4.0 rewrites these components for the visual upgrade; that version deletes the override and fixes whatever is left.
