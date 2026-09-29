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

### TD-025 - An unknown item's 404 is the framework's bare error document (DEFECT, P2)

- Status: `Open` · Severity: `Medium` · Area: `routing` · Identified: `2026-09-29` (v2.5.0 Batch 7, by the checks TD-021 strengthened)
- Context: `GET /<locale>/<section>/<unknown slug>` (every section, tags included, production too) answers 404 with `<html id="__next_error__">` — no `lang`, no heading; the site's own page appears only after JavaScript runs, so visitors without it, some assistive technology and crawlers get an empty document. `notFound()` from a page under `[locale]` reaches the top unhandled (`NEXT_HTTP_ERROR_FALLBACK;404`). A malformed slug is answered by the proxy with the global 404, in English under every language. Ten hypotheses were ruled out on a production build (metadata, the page's translations, reads before `notFound()`, `globalNotFound`, ISR vs dynamic, nested boundaries server and client, the layout's backstop, `next/root-params`); a nested `not-found.tsx` is reached but fails differently. `tests/runtime/acceptance.runtime.mjs` §5.4-a and §5.4-d carry `todo` naming this item.
- Diagnosis (Codex, from `node_modules/next` 16.3.5; `codex resume 01a0ec41-39e3-74d0-91fb-90f029242cc5`): the loader tree does hold `[locale]/not-found.tsx`, but only as the client `HTTPAccessFallbackBoundary` inside the root layout; the extra boundary around a root layout is built only when it has a parallel slot besides `children` (`create-component-tree.js:583`), and an escaped fallback is answered with the deliberately bare `__next_error__` document (`app-render.js:1322`). Why the inner boundary does not catch it in this server render is unproven. An empty parallel slot on `[locale]/layout.tsx` (to get that outer boundary) was tried: no change. Codex's own proposal — a real `src/app/layout.tsx`, `[locale]` nested — is a structural change against routing-slimdown's reason for `[locale]` as the root layout (`<html lang>` from the URL; DESIGN §7–§8), so it needs its own design.
- Revisit when: v2.5.1 opens (Jason's ruling, 2026-09-29) — a design for the document shell first, then the fix; §5.4-a/d lose their `todo` there.

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
