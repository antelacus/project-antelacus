# TECHNICAL_DEBT

## Purpose

This file tracks active technical debt, operational risks, and known limitations that are not yet resolved in the codebase.

Update this file when:

- a known risk is intentionally accepted
- a shortcut is taken to unblock delivery
- a missing workflow or safety net is identified
- a review finding is deferred instead of fixed immediately

## Active Items

### TD-023 - `SUPABASE_ADMIN_EMAILS` is still in the production `.env`

- Status: `Open` · Severity: `Low` · Area: `deploy` · Identified: `2026-09-28` (v2.5.0 Batch 3)
- Context: since v2.5.0 an admin is a user whose `app_metadata.role` is `admin`; no code reads `SUPABASE_ADMIN_EMAILS`. The variable stays in the VPS `.env` on purpose — the expand step of an expand/contract change — so that a rollback to a v2.4.x image still has a working admin (release-pipeline DESIGN §9).
- Revisit when: the first release after v2.5.0 whose kept images (the five rollback targets) are all v2.5.0 or later — then delete the line from the VPS `.env` (the contract step).

### TD-027 - The proxy decides content 404s because a page's notFound() is never server-rendered

- Status: `Accepted` (a named stopgap) · Severity: `Low` · Area: `routing` · Identified: `2026-09-29` (v2.5.1, replacing TD-025)
- Context: Next's App Router answers a page's `notFound()` with a 404 whose HTML is an empty `<html id="__next_error__">` shell; the not-found page exists only in the script data and appears seconds later, or never without JavaScript (vercel/next.js #62228, open since 2024; #99287). So before any page under `[locale]` runs, `src/proxy.ts` looks the address up in `/api/route-index` and answers every unknown slug, tag and about page itself through `src/app/global-not-found.tsx`, which is server-rendered (routing-slimdown DESIGN §2.2, §9). The pages keep their `notFound()` as a backstop.
- Retire when: a Next upgrade renders a page's `notFound()` on the server — check with the minimal reproduction in #62228 (a page calling `notFound()`, `next build && next start`, the 404's HTML carries the not-found page without scripts). Then delete the lookup branch of `route-decision`, `routeIndex()` in the proxy, `/api/route-index` and invariant 10; keep the localized `global-not-found` (malformed addresses and unknown sections still need it).

### TD-024 - The UI gate is the whole critical path of a push

- Status: `Open` · Severity: `Low` · Area: `tests` · Identified: `2026-09-29` (v2.5.0, run 36538068187)
- Context: from push to a verified staging takes about 7 minutes, 6.6 of them the UI job: starting the local Supabase stack (~75 s, mostly image pulls), the build (~20 s) and 61 browser checks (~200 s), of which axe over every template in four contexts takes ~75 s run one after another, and "nothing moves while the reader does nothing" ~37 s by design. Two levers were measured and left: running the four axe contexts concurrently (~35 s; touches the harness, risk of flakiness) and sharding the browser checks over two runners (~2 min; minutes are free on a public repository, but `tests/ui/coverage.ui.mjs` reconciles coverage in one process and would have to merge results across jobs).
- Revisit when: a push-to-staging wait of about 7 minutes gets in the way of a real change, or the UI checks grow by a third.

### TD-026 - `backup.sh` puts the database URL, password included, on a command line

- Status: `Open` · Severity: `Low` · Area: `deploy` · Identified: `2026-09-29` (v2.5.0 `/code-review`, R-7)
- Context: `scripts/backup.sh` runs `pg_dump … "$DATABASE_URL"` in a `docker run`, so the password is in the argument list any user of the VPS can read with `ps` while the dump runs, and in the container's config (`docker inspect`) until `--rm` removes it. Its storage mirror passes `SUPABASE_SERVICE_ROLE_KEY` with `-e`, which `docker inspect` shows while that container runs. Only the deploy user and root log in to the VPS. `release.sh` no longer does this: `db_query` hands the password to `psql` in a pgpass file (`pgConnection` in `scripts/release/decide.mjs`), the pattern to reuse here.
- Revisit when: `backup.sh` is next changed, or anything other than the deploy user starts running on the VPS.

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

Every finding of that scan is resolved; the scope note above still says what the scan did not examine.
