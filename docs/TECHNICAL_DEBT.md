# TECHNICAL_DEBT

## Purpose

This file tracks active technical debt, operational risks, and known limitations that are not yet resolved in the codebase.

Update this file when:

- a known risk is intentionally accepted
- a shortcut is taken to unblock delivery
- a missing workflow or safety net is identified
- a review finding is deferred instead of fixed immediately

## Active Items

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
- Ruled (Project Lead, 2026-09-22): in v2.3.0 — a cron on the VPS runs `pg_dump` plus a storage-bucket sync into the VPS data directory; the database password becomes a new secret in the VPS `.env`.

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

v2.3.0 resolved every finding of that scan except the ones below; the scope note above still says what the scan did not examine.

### TD-013 - The keepalive alert has no reader

- Status: `Open` · Severity: `Low` · Area: `operations`
- Context: `scripts/supabase-keepalive.sh` writes `ALERT` to a log file on the VPS after three failed runs; nothing reads that file. Together with TD-003 (no backup/export), a paused or lost Supabase project would be noticed by a visitor first.
- Ruled (Project Lead, 2026-09-22): in v2.3.0, as an external dead-man's-switch service — the script pings on success, a missing ping alerts; nothing self-hosted on the VPS, since a monitor must not share a machine with what it watches.

### TD-019 - The about page is the last repo-file content and the last MDX user

- Status: `Open` · Severity: `Low` · Area: `content-management` · Identified: `2026-09-22`
- Context: `/about` reads `src/content/pages/about/*.mdx`, five per-language files written as JSX (sections, a contact grid, inline SVG icons), rendered by `next-mdx-remote`. It cannot be edited from the admin, and it is the one page the Markdown-only renderer of v2.3.0 does not cover. Converting it to Markdown changes its appearance, which v2.3.0 forbids.
- Ruled (Project Lead, 2026-09-22): v2.4.0 — the visual upgrade redesigns the about page, and it moves into the database as Markdown (per-language rows with fallback to English, then any) in the same version; `next-mdx-remote` leaves with it.

### TD-020 - Three React hook rules run as warnings, not errors

- Status: `Open` · Severity: `Low` · Area: `lint` · Identified: `2026-09-22`
- Context: `eslint-config-next` 16 enables the React Compiler's `react-hooks/set-state-in-effect`, `immutability` and `static-components`. Eighteen existing sites fail them: state set inside effects in the four cards, `Nav`, `SearchModal`, `UtilityDropdown`; ref mutation in `PhotoViewer`; components defined inside `SearchModal`'s render. `eslint.config.mjs` downgrades the three rules to warnings so the gate stays meaningful.
- Retirement trigger: v2.4.0 rewrites these components for the visual upgrade; that version deletes the override and fixes whatever is left.
