# PHASE3-5_TRACK - v2.1.0 Dynamic Content

## Status

- Version: `v2.1.0`
- Feature: `dynamic-content`
- Status: Batch 1 complete, Batch 2 not started
- Last updated: `2026-03-19`

## Batch 1 - Foundation

### Task 1: Supabase project wiring
**Files:** env handling, server client modules, setup docs
**Steps:**
1. Add environment variable contract for Supabase URL, anon key, and server-only credentials
2. Add server-only Supabase client module
3. Add runtime guards so server-only secrets never reach the client
4. Verify local build still passes
**Status:** Completed
**Implementation Notes:**
- Added `.env.example` entries for Supabase URL, publishable/anon key fallback, service role key, and admin email allowlist.
- Added `src/lib/supabase/public-env.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/service-role.ts`, and `src/lib/supabase/middleware.ts`.
- Kept service-role access in `server-only` modules and limited browser-visible config to public Supabase values.
- Installed official packages: `@supabase/supabase-js` and `@supabase/ssr`.

### Task 2: Initial schema and migrations
**Files:** DB migrations, schema docs, shared types
**Steps:**
1. Define tables for content items, tags, relations, and media
2. Add migration scripts
3. Generate or define shared TS types
4. Validate schema assumptions with sample records
**Status:** Completed
**Implementation Notes:**
- Added `supabase/migrations/20260319073000_dynamic_content_foundation.sql` with enums, core content tables, relation tables, indexes, updated-at trigger, and initial read RLS policies for published records.
- Added shared TS/database contracts in `src/lib/server/database.types.ts`.
- Added `scripts/validate-dynamic-content-schema.ts` and `npm run validate:dynamic-content` to verify sample insert payloads.

### Task 3: Admin auth skeleton
**Files:** protected admin routes, auth helpers, middleware updates if needed
**Steps:**
1. Define admin authentication flow
2. Add protected route boundary for `/admin`
3. Add server-side session validation
4. Verify unauthorized access is blocked
**Status:** Completed
**Implementation Notes:**
- Added `src/lib/server/admin-auth.ts` for server-side admin session checks using Supabase Auth and an email allowlist.
- Added `/admin/login`, protected `/admin`, and `/auth/signout` route scaffolding.
- Updated `middleware.ts` to keep `/admin` and `/auth` non-localized while refreshing Supabase auth cookies for those routes.
- Unauthorized `/admin` access now redirects to `/admin/login?next=/admin`; missing env config shows a setup message instead of leaking secrets.

## Batch 2 - First Dynamic Type (`notes`)

### Task 4: Dynamic notes repository
**Files:** notes repository, notes pages, note detail route
**Steps:**
1. Write failing tests for fetching published notes from DB
2. Implement repository-backed note reads
3. Update note listing/detail pages
4. Verify current URLs still work

### Task 5: Admin note publishing flow
**Files:** admin notes UI, write handlers, validation schemas
**Steps:**
1. Write failing tests for create/update/publish note behavior
2. Add admin form for notes
3. Add validation and write logic
4. Verify newly published note appears without rebuild

### Task 6: Revalidation and cache invalidation
**Files:** publish handlers, cache helpers
**Steps:**
1. Add publish-time route/tag revalidation
2. Revalidate affected list/detail/tag pages
3. Verify note visibility updates immediately
4. Document rollback behavior

## Batch 3 - Remaining Content Types

### Task 7: Dynamic posts
**Files:** post repository, post pages, post metadata
**Steps:**
1. Migrate post reads to DB
2. Preserve summaries, covers, tags, and dates
3. Verify SEO metadata parity
4. Run regression checks

### Task 8: Dynamic projects
**Files:** project repository, project pages
**Steps:**
1. Migrate project reads to DB
2. Preserve links, covers, and tags
3. Verify existing project routes
4. Run regression checks

### Task 9: Dynamic gallery
**Files:** gallery repository, gallery pages, media upload flow
**Steps:**
1. Model gallery albums and images in DB/storage
2. Implement ordered image retrieval
3. Preserve current gallery route behavior
4. Verify image delivery from storage

## Batch 4 - Search, Tags, Sitemap

### Task 10: Dynamic tags
**Files:** tag repository, tag pages
**Steps:**
1. Replace `tag-registry.json` runtime dependency
2. Build tag listings from DB records
3. Verify counts and content grouping
4. Run regression checks

### Task 11: Dynamic search
**Files:** search route(s), search modal data source
**Steps:**
1. Replace file-generated search feed with DB-backed source
2. Preserve current search UI behavior
3. Verify published content becomes searchable quickly
4. Measure performance on the VPS

### Task 12: Sitemap and metadata
**Files:** sitemap route, metadata helpers
**Steps:**
1. Generate sitemap from published DB records
2. Verify canonical URLs and metadata parity
3. Check robots/sitemap consistency
4. Run production build verification

## Batch 5 - Migration and Cutover

### Task 13: Legacy import tooling
**Files:** import scripts, mapping docs
**Steps:**
1. Parse existing MDX/frontmatter content
2. Import content into DB tables
3. Import media into storage
4. Verify counts and spot-check records

### Task 14: Hybrid parity verification
**Files:** comparison scripts, QA notes
**Steps:**
1. Compare file-based and DB-backed outputs
2. Validate slugs, tags, dates, and media paths
3. Fix parity gaps
4. Record findings in this track file

### Task 15: Retire file-based runtime reads
**Files:** old content readers, obsolete build scripts
**Steps:**
1. Remove runtime file-read dependencies once parity is proven
2. Keep only necessary import/backfill scripts
3. Verify production build and publish flows
4. Update docs and changelog

## Phase 4.5 Review Placeholder

- Critical issues: none found in Batch 1 implementation
- Important issues: none found in Batch 1 implementation
- Minor issues:
  - `npm run lint` and `npm run build` still report pre-existing warnings in unrelated files (`src/app/sitemap.ts`, `src/components/Nav.tsx`, `src/components/PhotoViewer.tsx`, `src/components/UtilityDropdown.tsx`, `src/components/PerformanceMonitor.tsx`, `src/lib/posts.ts`).

## Phase 5 Verification Placeholder

- [ ] ESLint passes
- [ ] Production build passes
- [ ] Dynamic content publish flow verified
- [ ] Search/tag/sitemap parity verified
- [ ] Admin auth verified
- [ ] Rollback path documented

## Batch 1 Verification Log

- `npm run validate:dynamic-content` ✅
  - Output: `Validated dynamic-content sample records: contentItem, contentTag, contentItemTag, galleryImage, projectLink`
- `npm run lint` ✅
  - Completed with existing repository warnings only; no new Batch 1 errors introduced.
- `npm run build` ✅
  - Production build completed successfully, including postbuild tag/search/content validation steps.
