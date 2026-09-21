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
- Recommended follow-up:
  - Add admin CRUD/publish flows for posts, projects, and gallery in a future minor version.

### TD-002 - Search now has a single runtime dependency with no fallback path

- Status: `Accepted`
- Severity: `Medium`
- Area: `search`
- Identified: `2026-03-19`
- Context:
  - The static search-index fallback was intentionally removed during the Supabase-only cutover.
  - The search modal now depends entirely on `/api/search-index`.
- Risk:
  - Any failure in the runtime search API makes the search modal unavailable.
  - Search availability is now tightly coupled to the live application and Supabase-backed content fetches.
- Evidence:
  - `src/components/SearchModal.tsx`
  - `src/app/api/search-index/route.ts`
- Recommended follow-up:
  - Optional only. If desired later, add a resilient degraded mode or operational monitoring for search failures.

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
- Recommended follow-up:
  - Create an operational backup/export process outside the runtime app, or restore a private recovery tool that is not part of the public runtime path.

### TD-004 - `/about` remains a file-based exception

- Status: `Intentional`
- Severity: `Low`
- Area: `localization`
- Identified: `2026-03-19`
- Context:
  - `/about` still reads localized MDX files from disk.
  - This was intentionally kept outside the Supabase migration scope.
- Risk:
  - The content architecture is not fully uniform across the site.
  - Future maintenance needs to remember that `/about` does not follow the same source-of-truth model as the migrated content domains.
- Evidence:
  - `src/lib/pages.ts`
  - `src/app/[locale]/about/page.tsx`
- Recommended follow-up:
  - No immediate action required unless the site later standardizes all content on Supabase.

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

Who rules on what: TD-005 is a hotfix (v2.1.4). Every other item below goes to **Phase 0 of v2.2.0**, which takes each one into scope, accepts it, or declines it — none of them is parked.

### TD-005 - Next 15.4.8 and 12 other production dependencies carry known vulnerabilities

- Status: `Open` · Severity: `Critical` · Area: `dependencies` · Identified: `2026-09-21`
- Context: `npm audit --omit=dev` reports 13 (2 critical, 8 high). Direct ones: `next` (server-action source exposure, DoS; fixed in 15.5.25), `next-mdx-remote` (see TD-006), `sharp`, `image-size`, `next-intl` (open-redirect path not reachable here: its middleware/navigation are not imported).
- Recommended follow-up: hotfix — `next` to 15.5.x plus `npm audit fix`, on its own so a regression is attributable.

### TD-006 - Database content is compiled and executed as code on the server

- Status: `Open` · Severity: `High` · Area: `content-rendering`
- Context: `MDXRemote` (next-mdx-remote 5.0.0, no JS blocking) renders note/post/project/gallery bodies in four `[slug]/page.tsx` files. Only the admin can author content, so it is not reachable anonymously — but an admin-password compromise becomes server code execution, and the container runs as root (`Dockerfile` has no `USER`).
- Recommended follow-up: next-mdx-remote 6 with JS blocked, or plain Markdown for database-sourced content; add a non-root user to the image.

### TD-007 - `middleware.ts` has never run in production

- Status: `Open — ruled: activate it (Project Lead, 2026-09-21)` · Severity: `High` · Area: `routing`
- Context: the file sits at the repo root while the app is under `src/app`; a fresh build registers zero middleware. Consequences, all confirmed live: no `Accept-Language` redirect, no `NEXT_LOCALE` cookie (so `<html lang>` is always `en`), no Supabase session refresh, and **any** locale prefix renders (`/xx-anything/posts` → 200), i.e. unbounded duplicate pages.
- Constraint for the fix: moving it to `src/` as-is would 308 `/og.png` and `/<type>/<slug>/og.png` to `/en/...`, which do not exist — exclude the OG routes first. `[locale]/layout.tsx` should also `notFound()` on an unsupported locale regardless.
- Recommended follow-up: part of the next minor; then delete the 8 redirect-shell pages under `src/app/{posts,notes,…}`.

### TD-008 - Every public page is rendered on demand; nothing is cached

- Status: `Open` · Severity: `Medium` · Area: `performance`
- Context: all public responses carry `cache-control: private, no-cache, no-store` and `cf-cache-status: DYNAMIC`. Cause: `src/app/layout.tsx:79` reads `cookies()` to pick `<html lang>`, which makes the whole tree dynamic; `[locale]` has no `generateStaticParams`. Activating the middleware (TD-007) does not fix this — the `<html>` element has to move into the locale layout so `lang` comes from the route param.
- Recommended follow-up: design it together with TD-007.

### TD-009 - Nothing gates a deploy

- Status: `Open` · Severity: `Medium` · Area: `ci`
- Context: a push to `main` builds and ships on the VPS; lint, `tsc` and the tests run nowhere in CI, so the "minimum verification gate" in `CLAUDE.md` is honour-system. A build that succeeds but serves an unhealthy app leaves the broken container running (no rollback). The build also needs Supabase reachable (the sitemap is prerendered), so a paused project blocks every deploy.
- Recommended follow-up: a CI job (lint, tsc, tests) that the deploy job depends on; keep the previous image tagged for rollback.

### TD-010 - About 1,600 lines of dead code and checks that cannot fail

- Status: `Open` · Severity: `Medium` · Area: `maintainability`
- Context: zero-importer files (`src/styles/color-schemes.ts` 347, `src/lib/performance.ts` 187, `MasonryGrid.tsx`, `NavigationTracker.tsx`, `src/lib/supabase/client.ts`, four `Client*Card.tsx` pass-throughs, four unused exports of `src/lib/tags.ts`); `PerformanceMonitor.tsx` + `public/sw.js` (~420 lines — no analytics endpoint is ever passed, its only effect is registering a service worker; removal needs a self-unregistering worker for existing visitors); scripts that prove nothing (`validate:dynamic-content` validates hard-coded samples against its own schema, `seo-check.cjs` looks for a file that does not exist, `validate-metadata.cjs` greps a redirect shell, two stubs); unused dependencies `ts-node`, `image-size`, `next-tweet`.
- Recommended follow-up: delete, in the next minor. `src/content/` and `gray-matter` are **live** (the about page) — not part of this.

### TD-011 - The four content types repeat one repo four times

- Status: `Open` · Severity: `Low` · Area: `maintainability`
- Context: the same 19-line select block appears 10 times; the public repos (~380 lines) differ only by `content_type` and one relation; each `*-types.ts` repeats the base row type and three helpers; four OG routes differ by 3 lines. The four mappers genuinely differ and should stay. `src/lib/posts.ts:30` builds a new `cache()` wrapper per call, defeating request-level dedupe (the other three loaders are correct).
- Recommended follow-up: one parameterised content repo + one shared row/helper module (~−500 lines). Leave the loaders for last — a loader factory is the change most likely to be abstraction for its own sake.

### TD-012 - Failures reach visitors raw

- Status: `Open` · Severity: `Low` · Area: `resilience`
- Context: no `error.tsx` / `global-error.tsx` anywhere, so a Supabase error on a cold cache shows Next's bare 500. A missing slug returns 200 with a "not found" message instead of `notFound()` (`src/app/posts/[slug]/page.tsx:49` and siblings). `/api/search-index` returns raw Supabase error text to anonymous callers — and it is the production search path, not the "dev fallback" `CLAUDE.md` calls it.

### TD-013 - The keepalive alert has no reader

- Status: `Open` · Severity: `Low` · Area: `operations`
- Context: `scripts/supabase-keepalive.sh` writes `ALERT` to a log file on the VPS after three failed runs; nothing reads that file. Together with TD-003 (no backup/export), a paused or lost Supabase project would be noticed by a visitor first.

### TD-014 - Small hardening items

- Status: `Open` · Severity: `Low` · Area: `security`
- Context: base image `node:20` is past end-of-life; no CSP or HSTS, `x-powered-by` exposed; Supabase session cookies are set without `secure`; three admin-authored XSS sinks (`PhotoViewer.tsx:190` `innerHTML`, JSON-LD written without escaping `<`, `projects/[slug]/page.tsx:105` `href` without a scheme check); "admin" is an email match only — **check in the Supabase dashboard that sign-ups are disabled or email confirmation is required**, otherwise a listed address with no account yet can be registered by anyone; canonical URLs use `antelacus.com`, which nginx redirects to `www`.

### TD-015 - `CLAUDE.md` describes a project that no longer exists

- Status: `Open` · Severity: `Low` · Area: `docs`
- Context: it names a `postbuild` step and `scripts/build-search-index.ts` (neither exists), calls the search endpoint a dev fallback, places mappers in the repo files (they are in `*-types.ts`) and admin under `[locale]/admin` (it is `src/app/admin`), says `src/content/` is legacy (it is live), and prescribes the retired doc naming (`docs/versions/v*/…/PHASE1_PRD.md`). `package.json` says `0.1.0`; tags `v2.1.1` and `v2.1.2` have no changelog entry.

### TD-016 - The tests pin mappers only

- Status: `Open` · Severity: `Low` · Area: `tests`
- Context: 12 of 15 cases are mapper snapshots on a full fixture; no fallback path is covered (null `published_at`, null/array metadata, empty tags). Riskiest untested logic: `normalizeToSupportedLocale` and `mapPathLocaleSegment` in `src/i18n/detect.ts` (pure functions; the second matches any segment starting with `en`, `fr` or `es`), the sitemap's locale expansion and XML escaping, `getSafeNextPath`.
