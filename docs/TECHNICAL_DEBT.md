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

### TD-022 - No production-like environment for the real-content and real-device checks

- Status: `Open` · Severity: `Medium` · Area: `deploy` · Identified: `2026-09-24` (v2.4.0 Phase 4)
- Context: the check "one real input on a production-like environment" and the checks on Jason's iPhone and iPad ran against a local build. That needed production's public keys on the laptop, a change to the Mac's proxy DNS so Next's image optimiser would fetch Supabase images, and a LAN-bound server with a firewall exception. The UI gate's throwaway local stack is not affected — it runs in CI and needs empty, synthetic data. `project-goodman` already runs a staging container beside production on the same VPS. The origin's nginx is in no test path either: v2.4.1 fixed a 502 on every signed-in admin page (response headers past nginx's default buffer) that only production showed; a staging site behind the same nginx would have shown it first.
- Open questions for that design: the data source (production read-only with the publishable key and no service-role key, so the staging admin cannot write production; or a separate project); access control (Cloudflare Access or basic auth, plus `noindex`); the trigger (feature-branch push or manual); build CPU shared with production.
- Revisit when: the next version's Phase 0 (Jason's ruling, 2026-09-24).

### TD-023 - `SUPABASE_ADMIN_EMAILS` is still in the production `.env`

- Status: `Open` · Severity: `Low` · Area: `deploy` · Identified: `2026-09-28` (v2.5.0 Batch 3)
- Context: since v2.5.0 an admin is a user whose `app_metadata.role` is `admin`; no code reads `SUPABASE_ADMIN_EMAILS`. The variable stays in the VPS `.env` on purpose — the expand step of an expand/contract change — so that a rollback to a v2.4.x image still has a working admin (release-pipeline DESIGN §9).
- Revisit when: the first release after v2.5.0 whose kept images (the five rollback targets) are all v2.5.0 or later — then delete the line from the VPS `.env` (the contract step).

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

Every finding of that scan is resolved; the scope note above still says what the scan did not examine.
