# TECHNICAL_DEBT

## Purpose

This file tracks active technical debt, operational risks, and known limitations that are not yet resolved in the codebase.

Update this file when:

- a known risk is intentionally accepted
- a shortcut is taken to unblock delivery
- a missing workflow or safety net is identified
- a review finding is deferred instead of fixed immediately

## Active Items

### TD-021 - Runtime acceptance checks from v2.2–v2.3 assert less than their names claim

- Status: `Open` · Severity: `Low` · Area: `tests` · Identified: `2026-09-24` (Codex pre-deploy review of v2.4.0, findings C-12, C-14…C-18, C-21, C-22)
- Context: in `tests/runtime/acceptance.runtime.mjs`, several checks written for routing-slimdown and content-publishing pass on weaker evidence than their titles: the page language is checked only on `/about` (C-12); the preload check reads only the 404 shell (C-14); "served outside `/<locale>/`" accepts any status but 308 and 404, a 500 included (C-15); the old-URL redirect is not followed to a 200 (C-16); the unknown-slug and malformed-slug 404s accept any HTML 404, not the site's page, and do not show that no database read happened (C-17, C-18); the `<main>`/`<nav>` order check lets a page without `<nav>` pass and does not follow the skip link (C-21). `getSitemapEntries` is tested only through its pure builder, never with a page that has no published version (C-22).
- Revisit when: the next version that changes routing, the 404 pages or `tests/runtime/` — strengthen each check to fail on the case named above.

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

Every finding of that scan is resolved; the scope note above still says what the scan did not examine.
