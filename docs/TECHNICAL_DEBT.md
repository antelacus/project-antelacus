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
