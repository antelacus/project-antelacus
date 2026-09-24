# antelacus VPS deployment and operations

The site runs on one VPS as a Docker container behind nginx, with Cloudflare in front and Supabase (Postgres, Storage, Auth) as the only backing service. `project-white` and `project-wexler` stay on GitHub Pages under their own subdomains.

## Files

- `Dockerfile`: multi-stage Next.js image; the runtime stage runs as the unprivileged `node` user.
- `docker-compose.yml`: runs the app on `127.0.0.1:${ANTELACUS_PORT}`; reads `.env`.
- `.env.example`: every variable the runtime and the scripts below read. The real `.env` exists only on the VPS.
- `deploy/nginx/www.antelacus.com.conf`: the nginx vhost.
- `scripts/supabase-keepalive.sh`, `scripts/backup.sh`, `scripts/sync-bucket.mjs`, `scripts/site-check.sh`: the cron jobs (below).

## Deploy

A push to `main` deploys: the gate (`.github/workflows/check.yml`) must pass, then `.github/workflows/deploy.yml` SSHes to the VPS and runs `docker compose up -d --build`, then checks health. Nothing unpushed reaches the server. Verify a deploy by comparing the served SHA with `main`.

First-time setup on the VPS: copy `.env.example` to `.env` and fill it in; `docker compose up -d --build`; copy the nginx vhost into `sites-available`, enable it, `nginx -t`, reload. `www.antelacus.com` points at the VPS; the bare domain redirects to `www`.

Database changes ship as files in `supabase/migrations/`; apply them in the Supabase SQL editor (or with the Supabase CLI) **before** deploying the code that needs them. `scripts/db-function-check.sh` applies every migration to a throwaway Postgres and exercises the save function; run it after editing a migration.

## Cron jobs (as the deploy user)

```
0 */6 * * *  /home/deploy/antelacus/scripts/supabase-keepalive.sh
0 3 * * *    /home/deploy/antelacus/scripts/backup.sh >> /home/deploy/.local/state/antelacus/backup.log 2>&1
*/10 * * * * /home/deploy/antelacus/scripts/site-check.sh
```

- **keepalive**: one small query every six hours so the free-tier project is never idle for a week (idle a week, it pauses). Only this line — an older daily entry for the same script was removed when these were installed.
- **backup**: a `pg_dump` of the whole database (custom format) plus a mirror of the `media` and `gallery` buckets, into `ANTELACUS_DATA_DIR` (outside the repository; it holds unpublished drafts, so it never leaves the VPS). Dumps older than `BACKUP_KEEP_DAYS` are deleted. `pg_dump` runs from the official `postgres:$PG_MAJOR` image; its major must be the server's or newer. `DATABASE_URL` is the **session pooler** string from the dashboard (Connect → Session pooler): the direct address is IPv6-only.
- **site-check**: fetches `/en/about` from the public address every ten minutes.

## Alerting: the dead-man's switch

Each job reports to healthchecks.io after it succeeds (and to its `/fail` address when it fails). The service alerts by email when a report is missing or a failure arrives — so a job that stopped running is caught, not only one that ran and failed, and the VPS being down shows up as three missing reports.

Setup, once: create three checks (keepalive: period 6 h, grace 1 h · backup: period 1 day, grace 3 h · site-check: period 10 min, grace 10 min) and put their ping URLs into `.env` as `HC_PING_KEEPALIVE`, `HC_PING_BACKUP`, `HC_PING_SITE`. Nothing runs on the VPS to watch the VPS.

## Restore

The dump holds the `public` schema whole — types, tables, the save function, data — so it restores into an empty database **without** applying the migrations first (applying them first puts foreign keys in place before the data and the restore fails on `content_item_tags`).

1. Create the target: a fresh Supabase project, or any Postgres 17+ with the roles `anon`, `authenticated`, `service_role` (a Supabase project has them; a plain Postgres needs `create role …` for each).
2. From a `postgres:$PG_MAJOR` container: `pg_restore --no-owner --no-privileges --clean --if-exists -d "$TARGET_URL" antelacus-<stamp>.dump` (`--clean --if-exists` lets it be re-run). One error is expected and harmless: `schema "public" already exists` — every database has it; pg_restore reports it and carries on ("errors ignored on restore: 1").
3. Check: `select content_type, status, count(*) from public.content_items group by 1, 2;` should match the admin dashboard's counts, `select count(*) from public.content_item_tags;` must not be zero, and `select locale, status from public.site_pages;` must list the about page's languages.
4. Upload `ANTELACUS_DATA_DIR/storage/<bucket>/…` into buckets of the same names (public read), keeping the paths. Restoring into a *different* project changes the storage host: search and replace the old project host in `content_items.cover_image_url`, `content_items.body_markdown` and `gallery_images.public_url`.
5. Point `.env` at the new project, `docker compose up -d --build`, run `BASE_URL=https://www.antelacus.com RUNTIME_DB=1 npm run test:runtime`. Auth is not in the dump: create the admin user again in Authentication → Users.

A drill on the VPS itself, no data leaving it: start `docker run -d --name restore-drill -e POSTGRES_PASSWORD=drill -e POSTGRES_DB=app postgres:17`, create the three roles, restore with `docker exec -i restore-drill pg_restore --no-owner --no-privileges -U postgres -d app < dump`, run the checks of step 3, `docker rm -f restore-drill`.

## Things to re-check by hand

- Supabase → Authentication → Sign In / Providers: **Allow new users to sign up** off, **Confirm email** on. Admins are the emails in `SUPABASE_ADMIN_EMAILS`; with sign-ups open, a listed address without an account could be registered by anyone.
- After a deploy that changes headers or images: `curl -I https://www.antelacus.com/en/about` shows `content-security-policy`, `strict-transport-security`, and no `x-powered-by`.
- Cloudflare caches `/og.png` and `/images/` for a day; purge after replacing either.
