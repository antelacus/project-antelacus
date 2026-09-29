# Changelog

All notable changes to `project-antelacus` are documented in this file.

The format follows a simple project-specific version history.

## v2.5.0 - 2026-09-29

### Added
- A staging site, `staging.antelacus.com`, beside production behind the same web server and Cloudflare, open only to the owner. Every pushed change lands there first, with real content, and can be checked on a phone; its admin signs in and shows drafts but cannot save.
- Merging a change puts the exact build staging checked on the live site, checks the public site, and rolls back by itself if that check fails. A rollback by hand is one button. New versions are tagged, changed share images purged from Cloudflare's cache, and the sign-up settings checked, all without manual steps.
- `docs/DEPLOYMENT.md` is the release handbook, step by step.

### Changed
- The admin reads through the signed-in session: an admin is marked on the account itself, no longer by an email list in the server's configuration.
- The site's image no longer contains any secret, and is built once, never on the server.

### Fixed
- The project-link type selector in the admin has an accessible name.

## v2.4.1 - 2026-09-24

### Fixed
- The admin works again when signed in. Since v2.4.0 every signed-in admin page answered with Cloudflare's 502: the response headers, session cookies included, outgrew the web server's default buffer for them.

## v2.4.0 - 2026-09-24

### Added
- The whole site, public pages and admin alike, meets WCAG 2.2 AA: every task — reading, searching, browsing an album, changing language, and in the admin writing and publishing a piece — works with the keyboard alone, with visible focus; screen readers hear search results, loading and failures; pages can be zoomed and read at 320px wide without scrolling sideways; the album viewer has previous and next buttons on touch screens too.
- Search opens from anywhere with ⌘K or Ctrl+K.
- A long piece (three or more sections) has a folded table of contents after its opening, and its last line offers "back to top · contents".
- Every piece says the language it is written in, wherever it is listed.

### Changed
- A new look, *Ante Lacus* (`docs/aesthetic-thesis.md`). The home page is a gate — name, Latin motto, a vermilion end mark — and four windows onto the newest piece of each kind, the latest album largest. List pages are catalogues. A piece reads as a handscroll: date, title and lead at the opening; tags, language and dates in the tail, ending on the end mark. Covers appear only on the piece's own page.
- Nothing moves unless the reader does: no entrance or looping animation, no shadows; hovering an item turns it moss, and following a link fades the page briefly. The navigation stays at the top instead of following the reader.
- Headings and body are set in Source Serif 4 and Source Han Serif, Chinese with book leading and justification; Cormorant Garamond appears only on the gate.
- Search is one field: title matches rank above tags, tags above summaries.
- The about page is kept per language and edited in the admin; a language without its own version shows the English one. Its texts are rewritten.
- A tag no piece carries is a 404.
- The home and detail pages declare their canonical address and language alternates.

### Fixed
- Footnote links jump to their notes (they never did since v2.3.0).

### Removed
- The utility menu, the search filters and sort orders, the paper texture, and the home page's six cards.

### For the maintainer
- A second gate job, `ui`: a throwaway local Supabase with synthetic content, a build against it, and browser checks (Playwright + axe) in four device contexts; `npm run test:ui` runs the same locally.
- The React Compiler lint rules are errors again; `next-mdx-remote` and `gray-matter` are gone.

## v2.3.0 - 2026-09-22

### Added
- Every content type can be written and published from the admin: posts, notes, projects and albums have one editor at `/admin/content/<type>`, usable on a phone. Images are pasted, dropped or picked from the device and uploaded as you write; albums take several photos at once, in your order, with captions and a chosen cover; projects carry their links. A preview shows exactly what the page will show.
- A nightly backup of the database and every stored image lands on the server, and three small jobs (keep the database awake, back up, check the site from outside) report to a dead-man's switch that emails when one of them stops reporting.

### Changed
- Bodies are Markdown (CommonMark, tables, task lists, formulas). Anything that looks like HTML or code is shown as text, never run. A paragraph made only of images becomes a row of captioned figures.
- Saving is all-or-nothing: an item and its tags, images and links are written together or not at all; saving twice does not create twice; a published item keeps its original publication date through edits and re-publishing.
- A page that does not exist is a real 404; an address with a malformed slug is refused before any page runs. Errors never show the database's words.
- Security headers on every response (Content-Security-Policy, Strict-Transport-Security), sign-in cookies unreadable by scripts, and the container runs as an unprivileged user on a maintained Node.
- Every canonical, alternate and share address uses `https://www.antelacus.com`.
- The language you pick from the menu is remembered for a year on Safari too (it used to lapse after a week).
- The skip link really skips the navigation.

### Removed
- The page-transition loading animation (it made real 404s impossible).
- Next.js 15, `next lint`, and the four copies of the content repository.

### For the maintainer
- Next 16, React 19.3; production dependencies carry no advisories and the gate audits them.
- `docs/DEPLOYMENT.md` holds the cron lines, the alert setup and the restore procedure; `docs/content-publishing.md` describes publishing from the admin.

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
