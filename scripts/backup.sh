#!/usr/bin/env bash
# Daily backup on the VPS: a pg_dump of the whole database plus a copy of every storage object, into the
# data directory outside the repository. Reports to the dead-man's switch on success (missing report =
# alert) and to its /fail address on failure. Variables come from the repo's .env (see .env.example):
#   DATABASE_URL          the Supavisor session-pooler string from the Supabase dashboard (IPv4-capable)
#   ANTELACUS_DATA_DIR    where backups live (default: ~/antelacus-data)
#   BACKUP_KEEP_DAYS      how many days of dumps to keep (default: 14)
#   PG_MAJOR              pg_dump's major, same as or newer than the server's (default: 17)
#   HC_PING_BACKUP        the healthchecks.io ping URL for this job (optional; no URL, no report)
# Cron: 0 3 * * * /home/deploy/antelacus/scripts/backup.sh >> ~/.local/state/antelacus/backup.log 2>&1
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$REPO_DIR"

ping() { [[ -n "${HC_PING_BACKUP:-}" ]] && curl -fsS -m 10 --retry 3 -o /dev/null "$HC_PING_BACKUP$1" || true; }
fail() { echo "$(date -u +%FT%TZ) backup FAILED: $*"; ping /fail; exit 1; }
trap 'fail "step exited with $?"' ERR
trap 'exit 143' TERM
trap 'exit 130' INT

# Before .env, so a missing or broken one is logged as a failure. Its ping URL is in .env too: then no /fail
# goes out, and the dead-man's switch reports the success ping that never came.
[[ -r .env ]] || fail ".env is missing or unreadable"
set -a; source .env; set +a

DATA_DIR="${ANTELACUS_DATA_DIR:-$HOME/antelacus-data}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
PG_MAJOR="${PG_MAJOR:-17}"

# Secrets reach the containers as files only this user can read, never as arguments (`ps` shows those to
# every user) or container environment (`docker inspect` shows that): release-pipeline DESIGN §9. They live
# in a directory of this user's own, go on every exit, and a run killed outright leaves none past the next.
SECRETS_DIR="$HOME/.local/state/antelacus"
mkdir -p "$SECRETS_DIR" && chmod 700 "$SECRETS_DIR"
# One backup at a time: a second (by hand, while cron's runs) waits, rather than sweeping away the first
# one's secret files and sharing its half-built mirror.
exec 8>"$SECRETS_DIR/backup.lock"
flock --wait 1800 8 || fail "another backup has held the lock for 30 minutes"
rm -f "$SECRETS_DIR"/backup-secret.*
# Named after the lock is held: two runs started in the same second get two dumps.
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
secrets=()
DUMP=""
# A failed dump's .part goes too, or repeated failures would fill the disk.
trap 'rm -f "${secrets[@]}" ${DUMP:+"$DUMP.part"}' EXIT

[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is not set"
mkdir -p "$DATA_DIR/db" "$DATA_DIR/storage"

# Database: the public schema only, custom format (compressed; pg_restore rebuilds tables, data and
# constraints in the right order). Supabase's own schemas (auth, storage, realtime, vault) belong to the
# platform: they would collide with a fresh project's, and auth's password hashes have no place on disk.
DUMP="$DATA_DIR/db/antelacus-$STAMP.dump"
pgpass="$(mktemp "$SECRETS_DIR/backup-secret.XXXXXX")"; secrets+=("$pgpass")
# The URL without its password, which goes to the pgpass file (the same split release.sh makes).
db_url="$(node --input-type=module -e "
  import { pgConnection } from '$REPO_DIR/scripts/release/decide.mjs'; import { readFileSync, writeFileSync } from 'node:fs';
  const c = pgConnection(readFileSync(0, 'utf8'));
  if (!c) process.exit(1);
  writeFileSync(process.argv[1], c.pgpass); process.stdout.write(c.url);" "$pgpass" < .env)"
docker run --rm --network host -v "$pgpass:/pgpass:ro" -e PGPASSFILE=/pgpass "postgres:$PG_MAJOR" \
  pg_dump --format=custom --schema=public --no-owner --no-privileges "$db_url" > "$DUMP.part"
mv "$DUMP.part" "$DUMP"
[[ -s "$DUMP" ]] || fail "empty dump"

# Storage: every object of both buckets, mirrored under storage/<bucket>/ (see sync-bucket.mjs).
# Runs as the invoking user so the mirror in the data directory is owned by it, not by root.
keyfile="$(mktemp "$SECRETS_DIR/backup-secret.XXXXXX")"; secrets+=("$keyfile")
printf '%s' "$SUPABASE_SERVICE_ROLE_KEY" > "$keyfile"
docker run --rm --user "$(id -u):$(id -g)" -v "$REPO_DIR/scripts:/scripts:ro" -v "$DATA_DIR/storage:/data" \
  -v "$keyfile:/run/secrets/service-role:ro" -e SUPABASE_SERVICE_ROLE_KEY_FILE=/run/secrets/service-role \
  -e NEXT_PUBLIC_SUPABASE_URL \
  node:24-slim node /scripts/sync-bucket.mjs /data media gallery

find "$DATA_DIR/db" -name 'antelacus-*.dump' -mtime "+$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) backup ok: $(basename "$DUMP") $(du -h "$DUMP" | cut -f1); storage $(find "$DATA_DIR/storage" -type f | wc -l | tr -d ' ') files"
ping ""
