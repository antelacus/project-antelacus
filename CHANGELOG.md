# Changelog

All notable changes to `project-antelacus` are documented in this file.

The format follows a simple project-specific version history.

## v2.2.0 - 2026-09-21

### Fixed
- Language routing works. The middleware had never run in production (it sat where Next does not register it). As a result `<html lang>` was `en` on every page whatever its language, the admin's sign-in session was never renewed, and any first path segment rendered as if it were a language — `/xx-anything/posts` returned the posts page, an unbounded set of duplicate URLs. Now every page declares the language of its URL, language variants (`/zh-tw/…`, `/en-US/…`) redirect to the supported one, and old unprefixed links (`/posts/<slug>`) redirect to the visitor's language.
- Unknown URLs get a real 404 with the site's own page. Ordinary words are not mistaken for languages (`/essays` is a 404, not Spanish).
- The seal on the home share image (`/og.png`) was an empty missing-glyph box; it is now the red square it was meant to be.
- Two font preloads on every page pointed at files that never existed.

### Changed
- Public pages are cached: a page is rendered on its first visit and reused for up to an hour. Notes published from the admin appear at once; a direct database edit shows within the hour (detail pages used to take up to two).
- The site remembers a language picked from the language menu and uses it the next time you arrive without a language in the URL. Opening a link in another language is not a choice and is not remembered.
- Images and share images are cached for a day, not "forever": a replaced image now reaches everyone within a day.
- The skip link follows the page language (it was always Chinese).

### Removed
- Offline support. The service worker's only effect was caching; `/sw.js` remains as a stub that removes the old worker and its caches from returning visitors' browsers.
- About 1,900 lines of unused code, five npm scripts that could not fail, three unused dependencies.

### For the maintainer
- Nothing deploys without passing the gate: lint, type check, unit tests, a build without a database, and acceptance checks against the running server.
- `CLAUDE.md`, the README and `docs/content-publishing.md` describe the site as it is; the publishing guide now covers the Supabase-era procedure.

## v2.1.4 - 2026-09-21

### Security
- Upgraded Next.js from 15.4.8 to 15.5.25 (server-action source exposure and denial-of-service advisories) and applied the non-breaking dependency fixes. Known production vulnerabilities went from 13 (2 critical) to 5 (none critical); the remaining five need major upgrades and are tracked as TD-005.

## v2.1.3 - 2026-09-21

### Security
- Draft notes could be read without signing in: `/admin/notes` checked the admin only in its layout, and the page streamed its data before the redirect to the login page took effect. The privileged database client is now handed out only after the admin check. No draft existed while the flaw was live.

## v2.1.0 - 2026-03-19

### Added
- Added Supabase-backed content infrastructure for posts, notes, projects, and gallery entries.
- Added Supabase Auth-protected admin routes and note publishing workflow under `/admin`.
- Added relational schemas and hardening migrations for dynamic content entities, tags, gallery images, and project links.
- Added versioned development documentation under `docs/versions/v2/dynamic-content/`.
- Added `docs/TECHNICAL_DEBT.md` and a major-version roadmap at `docs/versions/v2/v2_DEVELOPMENT_PLAN.md`.

### Changed
- Migrated runtime content reads from repository-managed files to Supabase-backed published content.
- Switched tags, search, and sitemap generation at runtime to dynamic Supabase-backed sources.
- Updated the homepage to render dynamically so newly published content can surface without redeploying.
- Imported legacy posts, notes, projects, and gallery data into Supabase, including gallery media in Supabase Storage.
- Preserved existing public URL structure while moving content management to the new backend.

### Removed
- Removed repository-managed runtime content files for migrated domains (`posts`, `notes`, `projects`, `gallery`).
- Removed repository-managed gallery image assets for migrated gallery entries.
- Removed static search-index and tag-registry runtime/build dependencies for migrated content domains.
- Removed legacy file-based runtime fallback paths for migrated content readers.

## v2.0.0 - 2026-03-19

### Added
- Added VPS self-hosting with Docker and nginx.
- Added deployment artifacts: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, and `deploy/nginx/www.antelacus.com.conf`.
- Added `docs/DEPLOYMENT.md` for VPS deployment and cutover guidance.

### Changed
- Moved production hosting from Vercel to the VPS behind Cloudflare.
- Set `www.antelacus.com` as the canonical production host and redirected `antelacus.com` to it.
- Enabled standalone Next.js output for containerized deployment.
- Added production image optimization support with `sharp`.
- Switched TypeScript helper scripts to a Docker-friendly `tsx` execution path.
- Updated project documentation to reflect VPS hosting and the current publish flow.
- Stabilized generated metadata so unchanged content no longer creates timestamp-only git diffs.

### Removed
- Removed active Vercel production dependency for the site.
- Replaced legacy `.js` SEO helper scripts with `.cjs` variants compatible with the updated module setup.

## v1.0.0

### Initial Release
- Launched the personal site as a Next.js content-driven website.
- Hosted production on Vercel with the custom `antelacus.com` domain.
- Published content from repository-managed MDX files and static assets.
- Included tag registry generation, static search index generation, and content validation during builds.
