# PHASE3-5_TRACK - v2.1.0 Dynamic Content

## Status

- Version: `v2.1.0`
- Feature: `dynamic-content`
- Status: Batch 1 complete, Batch 2 verified end to end; Batch 3 complete for dynamic reads, Batch 4 runtime parity verified, and Batch 5 Tasks 13-15 are implemented and verified
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
- Added `supabase/migrations/20260319090000_dynamic_content_schema_hardening.sql` to lock the trigger function search path and add the missing `content_item_tags.tag_id` index surfaced by Supabase advisors.
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
**Status:** Implemented, awaiting live Supabase verification
**Implementation Notes:**
- Added hybrid note read support via `src/lib/server/notes-repo.ts` with file-based fallback in `src/lib/server/legacy-notes.ts`.
- Preserved the existing `src/lib/notes.ts` interface so note list/detail, sitemap, OG image, homepage, and tags keep working without route churn.
- Added shared mapping/fallback logic in `src/lib/note-types.ts` and tests in `tests/notes-repo.test.ts`.
- Switched published note reads to a cookie-free public server client after live verification exposed that `cookies()` cannot be used inside `unstable_cache`.
- Verified existing note routes still compile and build successfully.

### Task 5: Admin note publishing flow
**Files:** admin notes UI, write handlers, validation schemas
**Steps:**
1. Write failing tests for create/update/publish note behavior
2. Add admin form for notes
3. Add validation and write logic
4. Verify newly published note appears without rebuild
**Status:** Implemented in app code, pending live Supabase schema verification
**Implementation Notes:**
- Added `/admin/notes` protected workflow with create/edit form and save/publish actions.
- Added server-side validation and write logic in `src/app/admin/(protected)/notes/actions.ts` and `src/lib/server/notes-repo.ts`.
- Implemented tag upsert + relation sync for note writes.
- Verified the write path against the `huqthbogditclwyfjrhc` Supabase project by publishing sample note records with the same repository code used by the admin action.
- Replaced the single `intent`-based submit handler with explicit `saveDraftNoteAction` and `publishNoteAction` button actions after real UI testing showed the original submit-button value was not reliably reaching the server action.

### Task 6: Revalidation and cache invalidation
**Files:** publish handlers, cache helpers
**Steps:**
1. Add publish-time route/tag revalidation
2. Revalidate affected list/detail/tag pages
3. Verify note visibility updates immediately
4. Document rollback behavior
**Status:** Implemented in code, pending live publish verification
**Implementation Notes:**
- Added `src/lib/server/note-revalidation.ts` to revalidate note list/detail/home/tag/search/sitemap paths.
- Updated `src/components/SearchModal.tsx` to prefer the dynamic API index first.
- Updated `src/app/api/search-index/route.ts` to source notes from the hybrid note repository so new DB-backed notes can surface without a rebuild.
- Bumped the note cache key parts in `src/lib/notes.ts` so pre-fix legacy cache entries do not survive the read-path migration.

## Batch 3 - Remaining Content Types

### Task 7: Dynamic posts
**Files:** post repository, post pages, post metadata
**Steps:**
1. Migrate post reads to DB
2. Preserve summaries, covers, tags, and dates
3. Verify SEO metadata parity
4. Run regression checks
**Status:** Implemented, verified with temporary Supabase content, awaiting broader regression checks
**Implementation Notes:**
- Added hybrid post reads via `src/lib/server/posts-repo.ts` with legacy fallback in `src/lib/server/legacy-posts.ts`.
- Added shared post mapping/fallback logic in `src/lib/post-types.ts` and tests in `tests/posts-repo.test.ts`.
- Rewired `src/lib/posts.ts` to keep the existing post-facing interface while sourcing published records from Supabase when available.
- Live-verified `/en/posts` and `/en/posts/dynamic-post-live-check` against a temporary Supabase post record, then removed the verification data and invalidated the cache key version.

### Task 8: Dynamic projects
**Files:** project repository, project pages
**Steps:**
1. Migrate project reads to DB
2. Preserve links, covers, and tags
3. Verify existing project routes
4. Run regression checks
**Status:** Implemented, verified with temporary Supabase content, awaiting broader regression checks
**Implementation Notes:**
- Added hybrid project reads via `src/lib/server/projects-repo.ts` with legacy fallback in `src/lib/server/legacy-projects.ts`.
- Added shared project mapping/fallback logic in `src/lib/project-types.ts` and tests in `tests/projects-repo.test.ts`.
- Rewired `src/lib/projects.ts` to preserve the existing project-facing interface while sourcing published records from Supabase when available.
- Used `project_links` plus `extra_metadata` to preserve repository/demo links, status, star count, cover image, and display date semantics.
- Live-verified `/en/projects` and `/en/projects/dynamic-project-live-check` against a temporary Supabase project record, then removed the verification data and invalidated the cache key version.

### Task 9: Dynamic gallery
**Files:** gallery repository, gallery pages, media upload flow
**Steps:**
1. Model gallery albums and images in DB/storage
2. Implement ordered image retrieval
3. Preserve current gallery route behavior
4. Verify image delivery from storage
**Status:** Implemented for dynamic reads, verified with temporary Supabase content, storage upload flow still pending
**Implementation Notes:**
- Added hybrid gallery reads via `src/lib/server/gallery-repo.ts` with legacy fallback in `src/lib/server/legacy-photos.ts`.
- Added shared gallery mapping/fallback logic in `src/lib/photo-types.ts` and tests in `tests/gallery-repo.test.ts`.
- Rewired `src/lib/gallery.ts` to preserve the current gallery-facing interface while sourcing published records from Supabase when available.
- Mapped ordered `gallery_images` rows into the existing `PhotoInfo[]` shape so `PhotoViewer` continues to work without route/component churn.
- Used `content_items.summary` plus `extra_metadata` for caption, location, imageFolder, and display-date parity, with `cover_image_url` or the first ordered image as the cover fallback.

## Batch 4 - Search, Tags, Sitemap

### Task 10: Dynamic tags
**Files:** tag repository, tag pages
**Steps:**
1. Replace `tag-registry.json` runtime dependency
2. Build tag listings from DB records
3. Verify counts and content grouping
4. Run regression checks
**Status:** Implemented and verified
**Implementation Notes:**
- Replaced the runtime `tag-registry.json` dependency in `src/app/[locale]/tags/page.tsx` with `getTagSummaries()` from `src/lib/tags.ts`.
- Added `TagSummary` support in `src/lib/tags.ts` so tag list pages can render serializable counts and content-type coverage from hybrid DB/file-backed content.
- Kept tag detail pages on `getContentByTag()` so they automatically inherit the hybrid dynamic readers for all content types.

### Task 11: Dynamic search
**Files:** search route(s), search modal data source
**Steps:**
1. Replace file-generated search feed with DB-backed source
2. Preserve current search UI behavior
3. Verify published content becomes searchable quickly
4. Measure performance on the VPS
**Status:** Implemented and verified
**Implementation Notes:**
- Replaced the file/frontmatter-based runtime search API in `src/app/api/search-index/route.ts` with aggregation from `getAllPostsMeta()`, `getAllNotesMeta()`, `getAllPhotosMeta()`, and `getAllProjectsMeta()`.
- Kept `src/components/SearchModal.tsx` preferring the dynamic API first, with the static manifest fallback still available if the runtime API is unavailable.
- Verified that temporary published Supabase content became searchable through `/api/search-index` without relying on a rebuild-generated search file.

### Task 12: Sitemap and metadata
**Files:** sitemap route, metadata helpers
**Steps:**
1. Generate sitemap from published DB records
2. Verify canonical URLs and metadata parity
3. Check robots/sitemap consistency
4. Run production build verification
**Status:** Implemented and verified
**Implementation Notes:**
- Continued using `getAllPostsMeta()`, `getAllNotesMeta()`, `getAllPhotosMeta()`, `getAllProjectsMeta()`, and dynamic `getAllTags()` inside `src/app/sitemap.ts`, which now reflects hybrid DB-backed published content at runtime.
- Removed the unused `defaultLocale` import in `src/app/sitemap.ts` and the unused request parameter in `src/app/sitemap.xml/route.ts`.
- Verified temporary dynamic project and tag URLs appeared in `/sitemap.xml`, then disappeared again after cleanup and cache invalidation.

## Batch 5 - Migration and Cutover

### Task 13: Legacy import tooling
**Files:** import scripts, mapping docs
**Steps:**
1. Parse existing MDX/frontmatter content
2. Import content into DB tables
3. Import media into storage
4. Verify counts and spot-check records
**Status:** Implemented and verified
**Implementation Notes:**
- Added reusable legacy import helpers in `src/lib/server/legacy-import.ts` and tests in `tests/legacy-import.test.ts`.
- Added `scripts/import-legacy-content.ts` plus `npm run import:legacy-content` to dry-run or write-import posts, notes, projects, and gallery content into Supabase.
- The importer handles both `.md` and `.mdx` legacy sources, which captures the existing `src/content/posts/2025-07-13-llm-note.md` file that the prior runtime readers skipped.
- The importer preserves current route slugs by using filename-derived slugs, not frontmatter slugs, for projects and other content types.
- Gallery media is uploaded into a public Supabase bucket named `gallery`, with ordered `gallery_images` rows created from the local `public/images/gallery/*` files.
- Added Supabase remote image support in `next.config.ts` so imported gallery/storage URLs work with `next/image`.
- Bumped content cache key versions after import so the runtime actually reflects the imported DB-backed content instead of stale pre-import cache snapshots.

### Task 14: Hybrid parity verification
**Files:** comparison scripts, QA notes
**Steps:**
1. Compare file-based and DB-backed outputs
2. Validate slugs, tags, dates, and media paths
3. Fix parity gaps
4. Record findings in this track file
**Status:** Implemented and verified
**Implementation Notes:**
- Added `scripts/compare-legacy-content.ts` plus `npm run compare:legacy-content` to compare legacy/file readers against DB-backed readers for posts, notes, projects, and gallery.
- Fixed display-date parity by preferring `extra_metadata.displayDate` over normalized `published_at` in the note/post/project/gallery mappers.
- Fixed gallery media-path parity by mapping imported `gallery_images` back onto the legacy `/images/gallery/[folder]/[file]` paths instead of exposing storage URLs at runtime.
- Fixed legacy post parity by updating `src/lib/server/legacy-posts.ts` to support both `.md` and `.mdx` sources.
- Fixed build-time fallback parity by updating `scripts/build-search-index.ts`, `scripts/generate-tag-registry.ts`, and `scripts/validate-content.ts` to support canonical `.md` content alongside `.mdx`.

### Task 15: Retire file-based runtime reads
**Files:** old content readers, obsolete build scripts
**Steps:**
1. Remove runtime file-read dependencies once parity is proven
2. Keep only necessary import/backfill scripts
3. Verify production build and publish flows
4. Update docs and changelog
**Status:** Implemented and verified
**Implementation Notes:**
- Removed runtime legacy fallback imports from `src/lib/server/notes-repo.ts`, `src/lib/server/posts-repo.ts`, `src/lib/server/projects-repo.ts`, and `src/lib/server/gallery-repo.ts`; public runtime reads now come directly from Supabase-backed published records.
- Removed the migrated legacy source files under `src/content/posts`, `src/content/notes`, `src/content/gallery`, `src/content/projects`, and `public/images/gallery` after the Supabase import/parity work completed.
- Removed the temporary import/parity tooling (`scripts/import-legacy-content.ts`, `scripts/compare-legacy-content.ts`, `src/lib/server/legacy-*`, and `src/lib/server/legacy-import.ts`) after the cutover was validated.
- Removed the static search-index runtime fallback from `src/components/SearchModal.tsx`, so the search UI now depends only on the dynamic `/api/search-index` source.
- Removed the obsolete content-build scripts (`scripts/build-search-index.ts`, `scripts/generate-tag-registry.ts`, `scripts/validate-content.ts`) and deleted generated artifacts such as `src/content/tag-registry.json` and `public/search-index/*`.
- Removed `build:search-index`, `build:tags`, `validate:content`, `compare:legacy-content`, and `import:legacy-content` from `package.json`.
- Verified the app still builds and serves imported DB-backed content after the runtime cutover.

## Phase 4.5 Review Placeholder

- Critical issues: none currently blocking Batches 1-4 runtime work
- Important issues: none currently blocking Batches 1-4 runtime work
- Minor issues:
  - `npm run lint` and `npm run build` still report pre-existing warnings in unrelated files (`src/components/Nav.tsx`, `src/components/PhotoViewer.tsx`, `src/components/UtilityDropdown.tsx`, `src/components/PerformanceMonitor.tsx`).
  - The localized `/about` page still reads file-based content from `src/content/pages/about` via `src/lib/pages.ts`; the hard cutover completed only for the migrated content domains (posts, notes, projects, gallery, tags, search, sitemap).

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

## Batch 2 Verification Log

- `npm run test` ✅
  - 4 tests passed for note mapping and hybrid fallback logic.
- `npm run lint` ✅
  - Completed with existing repository warnings only; no new Batch 2 lint errors remain.
- `npm run build` ✅
  - Production build completed successfully after the dynamic notes/admin changes.
- Supabase migrations + advisors ✅
  - Applied the schema to `https://huqthbogditclwyfjrhc.supabase.co` and then applied the hardening follow-up migration.
  - Security advisors returned clean after the hardening migration; remaining performance notes are expected unused-index infos on empty/new tables.
- Live Supabase read/write verification ✅
  - Published sample note records (`dynamic-content-live-check`, `dynamic-content-live-check-2`, `dynamic-content-live-check-3`) through the repository write path.
  - Verified `/en/notes/dynamic-content-live-check-3` renders from Supabase-backed note content in the real Next runtime.
  - Verified `/en/notes` and `/api/search-index` both surface the live-check notes after the read-path fix.
- Manual admin UI publish click-through ✅
  - Verified `/admin/login?next=/admin/notes` with a temporary allowlisted Supabase user, then published `dynamic-content-admin-ui-check` through the real `/admin/notes` UI and confirmed the public note route rendered it.
  - Removed the temporary admin user and reverted the temporary local `SUPABASE_ADMIN_EMAILS` change after verification.
- Verification data cleanup ✅
  - Removed all temporary note verification records from Supabase, confirmed `/en/notes` returned to legacy note content, and confirmed `/api/search-index` no longer exposed the dynamic test slugs.

## Batch 3 Verification Log

- `dynamic posts runtime` ✅
  - Verified `/en/posts` and `/en/posts/dynamic-post-live-check` against a temporary published Supabase post.
  - Removed the temporary Supabase post after verification and bumped the post cache key version so stale DB test content does not linger in runtime caches.
- `dynamic projects runtime` ✅
  - Verified `/en/projects` and `/en/projects/dynamic-project-live-check` against a temporary published Supabase project with repository/demo links, status, star count, tags, and cover image.
  - Removed the temporary Supabase project after verification and bumped the project cache key version so stale DB test content does not linger in runtime caches.
- `dynamic gallery runtime` ✅
  - Verified `/en/gallery` and `/en/gallery/dynamic-gallery-live-check` against a temporary published Supabase gallery item with ordered `gallery_images`, cover image, caption, location, and tags.
  - Removed the temporary Supabase gallery item after verification and bumped the gallery cache key version so stale DB test content does not linger in runtime caches.

## Batch 4 Verification Log

- `dynamic tags runtime` ✅
  - Verified `/en/tags` surfaced the temporary `batch4-dynamic-tag` from a published Supabase project instead of relying on `tag-registry.json`.
  - Verified `/en/tags/batch4-dynamic-tag` grouped the temporary project correctly via the hybrid content readers.
- `dynamic search runtime` ✅
  - Verified `/api/search-index` surfaced `batch4-live-check-project` from the published Supabase project through the hybrid project reader.
  - Verified cleanup removed that project from the live search API after cache invalidation.
- `dynamic sitemap runtime` ✅
  - Verified `/sitemap.xml` included `/en/projects/batch4-live-check-project` and `/en/tags/batch4-dynamic-tag` while the temporary Supabase project existed.
  - Verified cleanup removed both URLs from `/sitemap.xml` after cache invalidation.
- `verification commands` ✅
  - `npm run test` passed with 16 tests.
  - `npm run lint` passed with existing unrelated warnings only.
  - `npm run build` passed, including postbuild tag/search/content validation.

## Batch 5 Verification Log

- `legacy import dry run` ✅
  - `npm run import:legacy-content` reported 13 content items total (`2 posts`, `2 notes`, `3 projects`, `6 gallery`) and `21` gallery media uploads.
  - Dry run confirmed the importer picked up `src/content/posts/2025-07-13-llm-note.md`, which the legacy runtime readers previously skipped.
- `legacy import write` ✅
  - `npm run import:legacy-content -- --write` imported all `13` content items, created `32` tag links, and uploaded `21` gallery images to Supabase Storage.
- `supabase counts` ✅
  - Verified `public.content_items` counts by type: `post=2`, `note=2`, `project=3`, `gallery=6`.
  - Verified `public.content_item_tags=32`, `public.project_links=6`, and `public.gallery_images=21`.
  - Verified the public Supabase `gallery` bucket exists and contains the imported album folders.
- `runtime spot checks` ✅
  - Verified `/en/posts` now surfaces both posts, including `2025-07-13-llm-note` from the imported `.md` source.
  - Verified `/api/search-index` now returns `13` items and includes `2025-07-13-llm-note`.
  - Verified `/en/gallery/2023-03-11-nanjing` renders imported gallery images from Supabase public storage URLs.
- `hybrid parity comparison` ✅
  - `npm run compare:legacy-content` passed and compared `posts=2`, `notes=2`, `projects=3`, and `gallery=6` between legacy/file outputs and DB-backed outputs.
  - Verified date strings, slugs, tags, covers, repo/demo links, gallery photo counts, gallery image paths, and body content match between legacy and DB-backed readers.
- `verification commands` ✅
  - `npm run test` passed with 26 tests.
  - `npm run lint` passed with existing unrelated warnings only.
  - `npm run build` passed after the hard cutover removed the old content-generation postbuild steps.
- `runtime cutover` ✅
  - Removed runtime legacy fallback readers from the public content repositories.
  - Removed the static search-index fallback from the search modal.
  - Deleted the migrated legacy content files, gallery image files, and obsolete build/import/parity scripts after the Supabase-backed runtime was verified.
