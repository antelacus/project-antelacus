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
set -a; source .env; set +a

DATA_DIR="${ANTELACUS_DATA_DIR:-$HOME/antelacus-data}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
PG_MAJOR="${PG_MAJOR:-17}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

ping() { [[ -n "${HC_PING_BACKUP:-}" ]] && curl -fsS -m 10 --retry 3 -o /dev/null "$HC_PING_BACKUP$1" || true; }
fail() { echo "$(date -u +%FT%TZ) backup FAILED: $*"; ping /fail; exit 1; }
trap 'fail "step exited with $?"' ERR

[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is not set"
mkdir -p "$DATA_DIR/db" "$DATA_DIR/storage"

# Database: custom format (compressed, restorable table by table with pg_restore).
DUMP="$DATA_DIR/db/antelacus-$STAMP.dump"
docker run --rm --network host "postgres:$PG_MAJOR" \
  pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" > "$DUMP.part"
mv "$DUMP.part" "$DUMP"
[[ -s "$DUMP" ]] || fail "empty dump"

# Storage: every object of both buckets, mirrored under storage/<bucket>/ (see sync-bucket.mjs).
# Runs as the invoking user so the mirror in the data directory is owned by it, not by root.
docker run --rm --user "$(id -u):$(id -g)" -v "$REPO_DIR/scripts:/scripts:ro" -v "$DATA_DIR/storage:/data" \
  -e NEXT_PUBLIC_SUPABASE_URL -e SUPABASE_SERVICE_ROLE_KEY \
  node:24-slim node /scripts/sync-bucket.mjs /data media gallery

find "$DATA_DIR/db" -name 'antelacus-*.dump' -mtime "+$KEEP_DAYS" -delete
echo "$(date -u +%FT%TZ) backup ok: $(basename "$DUMP") $(du -h "$DUMP" | cut -f1); storage $(find "$DATA_DIR/storage" -type f | wc -l | tr -d ' ') files"
ping ""
