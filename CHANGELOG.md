# Changelog

All notable changes to `project-antelacus` are documented in this file.

The format follows a simple project-specific version history.

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
