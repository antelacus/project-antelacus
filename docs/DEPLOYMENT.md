# antelacus VPS deployment and operations

The site runs on one VPS as a Docker container behind nginx, with Cloudflare in front and Supabase (Postgres, Storage, Auth) as the only backing service. `project-white` and `project-wexler` stay on GitHub Pages under their own subdomains.

## Files

- `Dockerfile`: multi-stage Next.js image; the runtime stage runs as the unprivileged `node` user. `.dockerignore` decides what goes into it, and so its build input key.
- `scripts/release/release.sh`: the only way a container is started, replaced or recorded — `production` on `127.0.0.1:3002` with `.env`, `staging` on `127.0.0.1:3003` with `.env.staging`. `release.sh <env> status` shows what runs; the state is in `~/.local/state/antelacus/releases.json`.
- `.env.example`: every variable the runtime and the scripts below read. The real `.env` exists only on the VPS; `.env.staging` beside it holds only its `NEXT_PUBLIC_*` lines — never the service-role key.
- `deploy/nginx/`: `antelacus-site.conf` (installed as `/etc/nginx/snippets/antelacus-site.conf`) is everything the two sites share; `www.antelacus.com.conf` and `staging.antelacus.com.conf` add only their name, their upstream and staging's noindex.
- `scripts/supabase-keepalive.sh`, `scripts/backup.sh`, `scripts/sync-bucket.mjs`, `scripts/site-check.sh`: the cron jobs (below).

## Release, step by step

What CI does by itself is in `.github/workflows/branch.yml` and `production.yml`; below is only what a person (or Claude) does, and where to read what happened. Every run's summary page has a table of each job's and step's duration.

1. **Migrations first.** If the change needs a new migration, it is applied to production before the branch is pushed (who and how: the project `CLAUDE.md`, Environment and deployment). Pushed first, the staging deploy refuses and names the migration.
2. **Push the branch.** Actions → *Branch*: `check` and `ui` (the gate), `image`, `staging`, `staging-check`. Green `staging-check` means `https://staging.antelacus.com` runs this commit and its image is recorded as verified. Red:
   - `check` or `ui`: fix and push again;
   - `staging`: the log's last `release:` line says why (an unverified or missing image, a missing migration, a health check); staging is untouched;
   - `staging-check`: staging has already rolled back to the image before (`staging-rollback`); the failing check says what is wrong.
3. **Look at staging on a phone.** Open `https://staging.antelacus.com` (Cloudflare Access sends a code to antelacus@gmail.com). Read a real post; sign in to `/admin`: the lists show drafts, and a save answers `Read-only environment — not saved.` A fault that shows only when signed in shows only here.
4. **Open the PR** into `main`; tick the signed-in look in its description. It merges only when `staging-check` and `pr-checklist` are green and the branch is up to date with `main` — *Update branch* is a new push, so step 2 runs again.
5. **Merge.** Actions → *Production*: `promote` starts the verified image (it builds nothing and refuses an image staging did not verify), `verify` checks the public site, then `tag` (a new version gets `v<version>`), `purge` (only when share images or `public/images` changed) and `auth` (sign-ups must stay closed). All green: released.
6. **If `verify` fails**, `rollback` has already put production back on the previous image and checked it; the run is red on purpose. Production is safe; fix on a branch and start again at step 2.
7. **If `auth` fails**, open Supabase → Authentication → Sign In / Providers: sign-ups off, email confirmation on. Nothing is rolled back — the code is not at fault. **If `purge` or `tag` fails**, redo it by hand; production is untouched.
8. **Roll back by hand** (a fault found later): Actions → *Production* → *Run workflow*, `rollback_to` empty for the previous image or a key from `release.sh production status`. It refuses an image older than a contract step. The database is never rolled back.
9. **After editing a `.env` on the VPS**, recreate the container with the same image: `ssh vps-deploy`, then `bash ~/.cache/antelacus-release/<any recent sha>/scripts/release/release.sh production restart` (or `staging`).
10. **If the pipeline itself is broken** so that not even its fix can merge: GitHub → Settings → Branches → edit the rule for `main`, lift it for that one merge, restore it, and write down why in the version's TRACK.

**First-time setup on the VPS:** copy `.env.example` to `.env` and fill it in; `grep '^NEXT_PUBLIC_' .env > .env.staging`; as root, copy `deploy/nginx/antelacus-site.conf` into `/etc/nginx/snippets/` and the two site files into `sites-available`, enable them, `nginx -t`, reload. `www.antelacus.com` points at the VPS; the bare domain redirects to `www`. A container already running as `antelacus` is taken over with `release.sh production adopt` before the first merge.

`scripts/db-function-check.sh` applies every migration to a throwaway Postgres and checks the save function and RLS; the gate runs it.

## Staging access

`staging.antelacus.com` is a proxied DNS record to the VPS, behind a Cloudflare Access application (Zero Trust team `antelacus-ci`, application `antelacus staging`). Two policies: `staging: Jason` lets antelacus@gmail.com in with a one-time email code (24 h sessions); `staging: CI service token` (Service Auth) lets the workflows in with the service token `antelacus-ci`, whose ID and secret are the GitHub secrets `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` — the secret exists only there. A request with neither is redirected to the Access login and never reaches the origin.

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
5. Point `.env` and the `NEXT_PUBLIC_*` build values of the image at the new project and release a new build (the public values are compiled into the image), then run `BASE_URL=https://www.antelacus.com RUNTIME_DB=1 npm run test:runtime`. Auth is not in the dump: create the admin user again in Authentication → Users and give it the admin role (below).

A drill on the VPS itself, no data leaving it: start `docker run -d --name restore-drill -e POSTGRES_PASSWORD=drill -e POSTGRES_DB=app postgres:17`, create the three roles, restore with `docker exec -i restore-drill pg_restore --no-owner --no-privileges -U postgres -d app < dump`, run the checks of step 3, `docker rm -f restore-drill`.

## Things to re-check by hand

- Supabase → Authentication → Sign In / Providers: **Allow new users to sign up** off, **Confirm email** on. With sign-ups open anyone could make an account; it would read only what is published, but it is a door that should be shut.
- Admins are the users whose `app_metadata.role` is `admin`. Only the service role can set it, in SQL: `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '<email>';`. The claim reaches the session at the next sign-in, so sign out and in again; until then the admin opens but lists no drafts.
- After a deploy that changes headers or images: `curl -I https://www.antelacus.com/en/about` shows `content-security-policy`, `strict-transport-security`, and no `x-powered-by`.
- Cloudflare caches `/og.png` and `/images/` for a day; purge after replacing either.
