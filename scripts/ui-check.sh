#!/usr/bin/env bash
# The UI gate (docs/features/visual-upgrade/DESIGN.md §2.5): a local Supabase stack seeded with synthetic
# content, a production build against it, then the browser checks in tests/ui/ and the runtime suite with
# the database. CI (check.yml, job `ui`) runs this same script. Needs Docker; on a Mac, colima is started if
# Docker is down, and stopped again afterwards. Everything this run started is torn down on any exit, and
# the exit code is the first failure's.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${UI_PORT:-3918}"
# localhost, not 127.0.0.1: Next answers an unknown path by fetching its own /404 at localhost, which on a
# Mac resolves to ::1 first — an app bound to 127.0.0.1 would hang those requests.
BASE_URL="http://localhost:$PORT"
DIST_DIR=".next-ui"
ADMIN_EMAIL="ui-admin@example.test"
# Only db, auth, rest and kong run (supabase/config.toml switches off what -x cannot keep from being pulled).
EXCLUDE="storage-api,imgproxy,postgres-meta,mailpit,studio,edge-runtime,logflare,vector,supavisor,realtime"
supabase() { npx --no-install supabase "$@"; }

started_colima=0
app_pid=""
cleanup() {
  local status=$?
  set +e
  trap - EXIT INT TERM
  if [[ -n "$app_pid" ]]; then kill "$app_pid" 2>/dev/null; wait "$app_pid" 2>/dev/null; fi
  # --no-backup drops the volumes: the next run replays the migrations and the seed on an empty database.
  supabase stop --no-backup >/dev/null 2>&1 || echo "ui-check: supabase stop failed" >&2
  if (( started_colima )); then colima stop >/dev/null 2>&1; fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

step() { echo "ui-check: $*"; }

if ! docker info >/dev/null 2>&1; then
  command -v colima >/dev/null || { echo "ui-check: Docker is not running" >&2; exit 1; }
  step "starting colima"
  started_colima=1
  colima start
fi
if curl --silent --output /dev/null "$BASE_URL"; then echo "ui-check: port $PORT is already in use" >&2; exit 1; fi

step "starting the local stack"
supabase stop --no-backup >/dev/null 2>&1 || true # a stack an interrupted run left behind
supabase start -x "$EXCLUDE"

# The backend boundary: nothing Supabase-shaped is inherited from the caller's environment, and every
# value below comes from the stack just started, on this machine.
for name in $(env | grep -oE '^(NEXT_PUBLIC_)?SUPABASE_[A-Z_]*=' | tr -d '=' || true); do unset "$name"; done
status_env="$(supabase status -o env)"
stack() { printf '%s\n' "$status_env" | sed -n "s/^$1=\"\(.*\)\"\$/\1/p"; }
API_URL="$(stack API_URL)"
PUBLISHABLE_KEY="$(stack PUBLISHABLE_KEY)"
SECRET_KEY="$(stack SECRET_KEY)"
[[ "$API_URL" == http://127.0.0.1:* ]] || { echo "ui-check: the stack's API is not on this machine: '$API_URL'" >&2; exit 1; }
[[ -n "$PUBLISHABLE_KEY" && -n "$SECRET_KEY" ]] || { echo "ui-check: no keys from supabase status" >&2; exit 1; }

step "creating the synthetic admin"
# Made up per run, handed only to the test process (UI_SERVE prints it, for a login by hand): never in
# the build or argv.
ADMIN_PASSWORD="$(openssl rand -hex 16)"
curl --silent --show-error --fail --output /dev/null -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SECRET_KEY" -H "Authorization: Bearer $SECRET_KEY" -H 'content-type: application/json' \
  --data @- <<JSON
{"email":"$ADMIN_EMAIL","password":"$ADMIN_PASSWORD","email_confirm":true}
JSON

step "building against the stack"
# From nothing: the directory keeps Turbopack's build cache and Next's data cache between runs, and a
# gate that judged the last run's CSS or content would pass on code it never built.
rm -rf "$DIST_DIR"
# NEXT_PUBLIC_* and the CSP are fixed at build time: this build serves this stack and nothing else.
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SECRET_KEY" SUPABASE_ADMIN_EMAILS="$ADMIN_EMAIL" NEXT_DIST_DIR="$DIST_DIR"
npm run build

step "starting the app on $BASE_URL"
node_modules/.bin/next start -H localhost -p "$PORT" >"$DIST_DIR/server.log" 2>&1 &
app_pid=$!
if ! curl --silent --fail --output /dev/null --retry 60 --retry-connrefused --retry-delay 1 --max-time 10 "$BASE_URL/og.png"; then
  echo "ui-check: the app did not come up" >&2; tail -40 "$DIST_DIR/server.log" >&2; exit 1
fi

# UI_SERVE=1: the seeded site to look at by hand; no checks run, and Ctrl-C tears it down.
if [[ -n "${UI_SERVE:-}" ]]; then
  step "serving $BASE_URL (admin: $ADMIN_EMAIL / $ADMIN_PASSWORD); Ctrl-C to tear down"
  wait "$app_pid"
  exit 0
fi

npx --no-install playwright install chromium webkit >/dev/null

status=0
# One process, in this order: coverage.ui.mjs reconciles what the other files' checks recorded.
ui_files="$(ls tests/ui/*.ui.mjs | grep -v '/coverage\.ui\.mjs$') tests/ui/coverage.ui.mjs"
step "browser checks"
# shellcheck disable=SC2086 # the file list is meant to split
BASE_URL="$BASE_URL" UI_ADMIN_EMAIL="$ADMIN_EMAIL" UI_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  node --test --test-isolation=none --test-concurrency=1 --test-force-exit $ui_files || status=$?
step "runtime suite with the database"
BASE_URL="$BASE_URL" RUNTIME_DB=1 node --test tests/runtime/acceptance.runtime.mjs || { s=$?; (( status )) || status=$s; }
exit "$status"
