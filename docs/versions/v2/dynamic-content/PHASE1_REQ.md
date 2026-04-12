# PHASE1_REQ - v2.1.0 Dynamic Content

## Document Status

- Version: `v2.1.0`
- Feature: `dynamic-content`
- Type: `REQ`
- Status: Historical requirements snapshot (Supabase phase)
- Date: `2026-03-19`
- Last updated: `2026-03-27`

## 1. Historical Note

This document captures the original requirements that drove the `v2.1.0` dynamic-content rollout on Supabase.

It remains useful as historical context because it documents why AnteLacus moved away from file-based runtime publishing and what functional capabilities the first dynamic system needed to prove.

However, as of `2026-03-27`, this is **not** the long-term target architecture anymore. The current direction is to preserve the dynamic-content model while replacing the managed Supabase dependency with a self-hosted SQLite-backed system on the VPS.

## 2. Context

`project-antelacus` is now live on the VPS as `v2.0.0`, served through Docker, nginx, and Cloudflare. Production hosting is stable, but content is still managed as repository files under `src/content/*` and `public/images/gallery/*`.

That means new posts, notes, projects, and gallery entries still require:

1. editing files on disk
2. committing code/content changes
3. rebuilding and redeploying the container

The goal of `v2.1.0` is to keep the current site UX and public URL structure while changing the content system so new content can be published instantly without a full code deployment.

## 3. Problem Statement

The current file-based publishing model is a bottleneck:

- content updates are coupled to code deploys
- publishing requires direct file-system access to the repo
- image uploads are handled as static files, not editorial assets
- search/tag metadata are generated from files at build time instead of from live content
- there is no authenticated admin workflow for publishing from the browser

## 4. Goals

### Primary Goals

- Make posts, notes, projects, and gallery entries database-backed.
- Allow content to be drafted and published without rebuilding the site image.
- Preserve the current public routes and existing front-end visual design.
- Support authenticated admin publishing from a private interface.
- Move media uploads to managed object storage instead of repository-managed files.

### Secondary Goals

- Preserve search, tags, sitemap, and SEO metadata after the migration.
- Keep rollback simple during the transition from file-based to dynamic content.
- Minimize downtime and avoid breaking public URLs.

## 5. Non-Goals

- Rebuilding the public site design system or navigation structure
- Multi-author editorial workflows
- Rich block editor / Notion-style editor in `v2.1.0`
- Full MDX execution from the database in `v2.1.0`
- Replatforming away from VPS hosting

## 6. Proposed Product Direction

### Recommended Architecture

- Frontend/runtime: existing Next.js app on the VPS
- Database: Supabase Postgres
- Media storage: Supabase Storage
- Auth: Supabase Auth for private admin access
- Content body format: Markdown stored in the database
- Revalidation: publish-time invalidation of affected routes/tags

### Why Supabase

- reduces operational burden versus self-hosting Postgres + storage on the VPS
- gives a clean way to handle auth, storage, and SQL in one system
- fits the current Next.js stack well
- supports future expansion without changing the hosting model

## 7. Scope

### In Scope

- database schemas for content entities
- storage bucket strategy for images
- admin authentication design
- content CRUD flows for:
  - posts
  - notes
  - projects
  - gallery albums
- migration strategy from `src/content/*` and `public/images/gallery/*`
- dynamic search/tag/sitemap strategy
- route revalidation strategy after publish/update/delete

### Out of Scope

- comments system
- public user accounts
- email newsletter integration
- AI-assisted writing tools
- advanced analytics implementation

## 8. Current System Impact

The following areas are currently file-based and will be affected:

- `src/lib/posts.ts`
- `src/lib/notes.ts`
- `src/lib/projects.ts`
- `src/lib/gallery.ts`
- `src/lib/tags.ts`
- `src/app/[locale]/tags/page.tsx`
- `src/app/api/search-index/route.ts`
- `scripts/generate-tag-registry.ts`
- `scripts/build-search-index.ts`
- `scripts/validate-content.ts`

## 9. Functional Requirements

### Content Storage

- The system must store canonical content records in the database.
- The system must support draft and published states.
- The system must support dates, tags, summaries, cover images, and slugs.
- The system must preserve existing URL-compatible slugs.

### Media

- The system must allow image uploads without committing files to git.
- The system must support post covers, project covers, and gallery album images.
- The system must store media in a location accessible by the VPS-hosted frontend.

### Admin

- The system must provide a private admin interface or protected admin routes.
- Only authenticated admin users may create, edit, publish, or delete content.
- Secrets and service keys must remain server-side only.

### Publishing

- Publishing must make new content visible without rebuilding the Docker image.
- Updates and deletes must revalidate affected pages.
- Search and tags must reflect newly published content.

### Migration

- Existing repository content must be migratable into the new schema.
- The migration must be repeatable in development and safe in production.
- A fallback path must exist during rollout in case dynamic reads fail.

## 10. Acceptance Criteria

- An admin can create and publish a new note from a protected workflow.
- The note appears publicly within seconds without rebuilding the app container.
- Tags and search include the new note.
- Existing public content routes remain valid after migration.
- Existing content can be imported from the file-based source of truth.
- Images can be uploaded and rendered from managed storage.
- Public visitors cannot access admin routes or service-role credentials.

## 11. Risks

- Content schema mismatch during migration from MDX frontmatter to SQL
- SEO regressions if metadata generation changes
- Search/tag behavior drift during hybrid file/database period
- Security risk if admin or service-role flows are exposed to the client
- Increased implementation complexity if database MDX rendering is attempted too early

## 12. Open Decisions

- Whether admin editing in `v2.1.0` should be:
  - minimal internal forms, or
  - a richer markdown editor
- Whether gallery images should support manual ordering metadata at launch
- Whether legacy file-based content should remain readable during the transition window
- Whether the first release should support only one admin user or multiple privileged users

## 13. Recommended Release Shape

Deliver `v2.1.0` in a hybrid-safe sequence:

1. add Supabase schema and admin foundation
2. support one dynamic type first (`notes`)
3. extend to posts/projects/gallery
4. migrate search/tags/sitemap
5. import legacy content
6. retire file-based runtime reads once parity is verified
