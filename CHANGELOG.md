# Changelog

All notable changes to `project-antelacus` are documented in this file.

The format follows a simple project-specific version history.

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
