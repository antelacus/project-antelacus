# PHASE2_DESIGN - v2.1.0 Dynamic Content

## Document Status

- Version: `v2.1.0`
- Feature: `dynamic-content`
- Status: Drafted for review
- Date: `2026-03-19`

## 1. Design Summary

`v2.1.0` introduces a database-backed content layer while preserving:

- current public routes
- current visual design
- current VPS hosting topology

The recommended design is:

- Next.js frontend continues running on the VPS
- Supabase becomes the system of record for content and media
- server-only data access is centralized behind repository-style modules
- private admin workflows publish content and trigger route/tag revalidation

## 2. Target Architecture

### Runtime Topology

- Client browser
  -> Cloudflare
  -> nginx on VPS
  -> Dockerized Next.js app
  -> Supabase Postgres / Supabase Storage

### Responsibility Split

- VPS:
  - public app runtime
  - admin UI routes
  - server-side API handlers
  - cache invalidation / revalidation
- Supabase:
  - canonical content records
  - media objects
  - admin authentication

## 3. Content Model

## Core Tables

### `content_items`

Shared fields across posts, notes, projects, and gallery albums:

- `id`
- `content_type` (`post | note | project | gallery`)
- `slug`
- `title`
- `summary`
- `body_markdown`
- `status` (`draft | published`)
- `published_at`
- `created_at`
- `updated_at`
- `locale`
- `cover_image_url`
- `seo_title`
- `seo_description`

### `content_tags`

- `id`
- `name`
- `slug`

### `content_item_tags`

- `content_item_id`
- `tag_id`

### `gallery_images`

- `id`
- `content_item_id`
- `storage_path`
- `public_url`
- `alt_text`
- `sort_order`
- `captured_at`

### `project_links`

- `id`
- `content_item_id`
- `label`
- `url`
- `link_type`

## Optional Type-Specific Metadata

If needed, add JSON columns or side tables for content-type-specific fields such as:

- note source/citation info
- project repository/demo links
- gallery location metadata

## 4. Media Strategy

### Storage

- Use one private-or-public Supabase bucket strategy for editorial assets.
- Recommended initial bucket split:
  - `post-covers`
  - `project-covers`
  - `gallery`

### URL Strategy

- Store canonical storage paths in DB.
- Resolve public delivery URLs server-side or at write time.
- Avoid saving secrets in the client.

## 5. Application Layer Refactor

Replace file readers with repository-style data access modules.

### New Server Modules

- `src/lib/server/content-repo.ts`
- `src/lib/server/tag-repo.ts`
- `src/lib/server/search-repo.ts`
- `src/lib/server/admin-auth.ts`
- `src/lib/server/storage.ts`

### Migration of Existing Modules

- `src/lib/posts.ts`
- `src/lib/notes.ts`
- `src/lib/projects.ts`
- `src/lib/gallery.ts`
- `src/lib/tags.ts`

These should become thin adapters over the new server repositories so page components keep stable interfaces where possible.

## 6. Admin Interface

### Recommended v2.1.0 Scope

- protected `/admin` area
- login gate for the site owner
- create/edit/publish for at least one content type first
- markdown textarea rather than rich block editor
- image upload support

### Security Rules

- no tokens in `localStorage` or `sessionStorage`
- service-role usage only in server-only code
- explicit server-only boundaries for admin data access
- schema validation on all writes

## 7. Search / Tags / Sitemap

### Search

Current model:

- static manifest and index files
- build-time generation from files

Target model:

- generate search data from database records
- keep current client search modal if possible
- either:
  - generate static search JSON on a scheduled/admin-triggered basis, or
  - serve dynamic JSON from an API route

Recommended first step:

- serve search data dynamically from server routes backed by Supabase

### Tags

- derive tag pages from relational tag tables instead of `tag-registry.json`

### Sitemap

- build sitemap from published DB records instead of file metadata

## 8. Migration Strategy

### Phase A - Foundation

- add Supabase project and schema
- add environment variables
- add server-only DB client
- add admin auth skeleton

### Phase B - First Dynamic Type

- implement `notes` first
- keep other content types file-based temporarily
- prove instant publishing + revalidation loop

### Phase C - Expand Coverage

- move posts
- move projects
- move gallery

### Phase D - Search / Tags / Sitemap

- remove file-generated runtime dependencies
- update search/tags/sitemap to DB reads

### Phase E - Legacy Import / Decommission

- import historical MDX + image assets
- verify parity
- retire file-based runtime readers

## 9. Rollback Strategy

- Keep `v2.0.0` tag as the stable VPS-only fallback.
- Introduce dynamic reads behind feature flags or repository-level switches if needed.
- During rollout, preserve the ability to fall back to file-based reads for not-yet-migrated content types.
- Avoid destructive deletion of legacy content files until parity is proven.

## 10. Testing Strategy

- schema validation tests
- repository integration tests
- admin authentication tests
- publish/revalidate flow tests
- manual checks for:
  - new content visibility
  - search parity
  - tag parity
  - sitemap correctness
  - image rendering

## 11. Key Decisions for Approval

- Approve Supabase as the content backend for `v2.1.0`
- Approve markdown-in-DB for the initial dynamic release
- Approve `notes` as the first migrated content type
- Approve hybrid migration instead of all-at-once replacement
