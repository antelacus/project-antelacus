#!/usr/bin/env bash
# The one entry point for putting an image into service on the VPS (release-pipeline DESIGN §2.1, §4, §6).
#   release.sh <staging|production> deploy <key> [<sha>] [<version>]
#   release.sh staging verified <key>        — staging-check passed: production may now run this image
#   release.sh <staging|production> status
#   release.sh production adopt              — rebuild the state file from the running container
# CI sends this directory (scripts/release/ and supabase/migrations/ of the commit being deployed) and runs
# it from there, so the logic that deploys is the logic that commit carries, not the VPS checkout's.
# Decisions live in decide.mjs; this file only gathers inputs and acts. Every refusal is exit 1 with one line.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
BUNDLE="$(cd "$HERE/../.." && pwd)"
CHECKOUT="${RELEASE_CHECKOUT:-/home/deploy/antelacus}"
STATE_DIR="${RELEASE_STATE_DIR:-/home/deploy/.local/state/antelacus}"
STATE="$STATE_DIR/releases.json"
PG_MAJOR="${PG_MAJOR:-17}"

ENV_NAME="${1:-}"
COMMAND="${2:-}"
case "$ENV_NAME" in
  staging)    NAME=antelacus-staging; PORT=3003; SCRATCH=3013; ENV_FILE="$CHECKOUT/.env.staging"
              # A staging fault must never starve production (REQ §6).
              LIMITS=(--memory 768m --cpus 1 --pids-limit 256) ;;
  production) NAME=antelacus;         PORT=3002; SCRATCH=3012; ENV_FILE="$CHECKOUT/.env"; LIMITS=() ;;
  *) echo "usage: release.sh <staging|production> <deploy|verified|status|adopt> …" >&2; exit 2 ;;
esac

refuse() { echo "release: $*" >&2; exit 1; }
step() { echo "release[$ENV_NAME] $(date -u +%H:%M:%S) $*"; }
decide() { node "$HERE/decide.mjs" "$1" "$2"; }
json_string() { node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(process.argv[1], "utf8")))' "$1"; }
field() { node -e 'const v = JSON.parse(process.argv[1]); const r = process.argv[2].split(".").reduce((o, k) => o?.[k], v); process.stdout.write(r === undefined || r === null ? "" : typeof r === "string" ? r : JSON.stringify(r))' "$1" "$2"; }

mkdir -p "$STATE_DIR"
exec 9>"$STATE_DIR/releases-$ENV_NAME.lock"
flock --nonblock 9 || refuse "another $ENV_NAME release holds the lock"

read_state() {
  if [[ ! -e "$STATE" ]]; then echo '{}'; return; fi
  node -e 'try { const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); if (typeof s !== "object" || s === null || Array.isArray(s)) throw 0; process.stdout.write(JSON.stringify(s)); } catch { process.exit(3); }' "$STATE"
}
state_or_refuse() {
  local state
  if ! state="$(read_state)"; then
    [[ "$ENV_NAME" == production ]] && refuse "the state file $STATE is damaged; run: release.sh production adopt"
    state='{}'
  fi
  if [[ "$ENV_NAME" == production && ! -e "$STATE" ]]; then refuse "no state file at $STATE; run: release.sh production adopt"; fi
  printf '%s' "$state"
}
write_state() { printf '%s\n' "$1" > "$STATE.tmp" && mv "$STATE.tmp" "$STATE"; }

image_id() { docker image inspect --format '{{.Id}}' "antelacus:$1" 2>/dev/null; }

healthy() { # <port> <expected key or "">
  local port="$1" expected="$2" up=0
  # Our own loop, not curl --retry: Docker's port proxy accepts the connection before the app listens and
  # then resets it (curl exit 56), which curl does not count as worth retrying.
  for _ in $(seq 1 60); do
    if curl --silent --fail --output /dev/null --max-time 10 "http://127.0.0.1:$port/og.png"; then up=1; break; fi
    sleep 1
  done
  (( up )) || return 1
  [[ -z "$expected" ]] && return 0
  [[ "$(curl --silent --fail --max-time 10 "http://127.0.0.1:$port/api/build")" == "{\"key\":\"$expected\"}" ]]
}

run_container() { # <name> <port> <key>
  docker run --detach --name "$1" --restart unless-stopped \
    --publish "127.0.0.1:$2:3000" --env-file "$ENV_FILE" \
    --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
    "${LIMITS[@]}" "antelacus:$3" >/dev/null
}

check_migrations() {
  local url records files
  url="$(grep -m1 '^DATABASE_URL=' "$CHECKOUT/.env" | cut -d= -f2- | tr -d '"')"
  [[ -n "$url" ]] || refuse "no DATABASE_URL in $CHECKOUT/.env: cannot check migrations"
  records="$(docker run --rm --network host "postgres:$PG_MAJOR" psql "$url" -At -F $'\t' \
    -c "select name, md5(array_to_string(statements, '')) from supabase_migrations.schema_migrations" \
    | node -e 'const rows = require("fs").readFileSync(0, "utf8").trim().split("\n").filter(Boolean).map((l) => l.split("\t")); process.stdout.write(JSON.stringify(rows.map(([name, digest]) => ({ name, digest }))))')" \
    || refuse "could not read the migration records"
  files="$(node -e 'const fs = require("fs"), path = require("path"), crypto = require("crypto"); const dir = process.argv[1]; process.stdout.write(JSON.stringify(fs.readdirSync(dir).filter((f) => /^\d+_[^/]+\.sql$/.test(f)).sort().map((file) => ({ file, digest: crypto.createHash("md5").update(fs.readFileSync(path.join(dir, file), "utf8").replace(/\n+$/, "")).digest("hex") }))))' "$BUNDLE/supabase/migrations")"
  local problems
  problems="$(decide migrationProblems "{\"files\":$files,\"records\":$records}")"
  [[ "$(field "$problems" missing)" == "[]" ]] || refuse "production has not executed: $(field "$problems" missing)"
  [[ "$(field "$problems" changed)" == "[]" ]] || refuse "production executed a different text of: $(field "$problems" changed)"
  step "migrations: every file has a matching record"
}

deploy() {
  local key="${1:?usage: release.sh $ENV_NAME deploy <key> [<sha>] [<version>]}" sha="${2:-}" version="${3:-}"
  local state id serving
  state="$(state_or_refuse)"
  id="$(image_id "$key")" || refuse "no image antelacus:$key on this machine"
  if [[ "$ENV_NAME" == production ]]; then
    [[ "$(decide mayPromote "{\"state\":$state,\"key\":\"$key\",\"imageId\":\"$id\"}")" == true ]] \
      || refuse "antelacus:$key ($id) was never verified on staging"
  else
    local problems
    [[ -e "$ENV_FILE" ]] || refuse "no $ENV_FILE"
    problems="$(decide stagingEnvProblems "$(json_string "$ENV_FILE")")"
    [[ "$problems" == "[]" ]] || refuse "$ENV_FILE holds $problems: staging must not be able to write production"
  fi
  check_migrations

  serving="$(docker inspect --format '{{.Image}}' "$NAME" 2>/dev/null || true)"
  if [[ "$serving" == "$id" ]] && [[ "$(decide shouldDeploy "{\"serving\":\"$(field "$state" "$ENV_NAME.key")\",\"next\":\"$key\"}")" == false ]]; then
    step "already serving $key"; echo "serving $key"; return 0
  fi

  step "trying antelacus:$key on :$SCRATCH"
  docker rm -f "$NAME-candidate" >/dev/null 2>&1 || true
  run_container "$NAME-candidate" "$SCRATCH" "$key"
  if ! healthy "$SCRATCH" "$key"; then
    docker logs --tail 60 "$NAME-candidate" >&2 || true
    docker rm -f "$NAME-candidate" >/dev/null
    refuse "antelacus:$key did not come up healthy on :$SCRATCH; $NAME is untouched"
  fi
  docker rm -f "$NAME-candidate" >/dev/null

  step "switching :$PORT to antelacus:$key"
  docker rm -f "$NAME-previous" >/dev/null 2>&1 || true
  local had_previous=0
  if docker inspect "$NAME" >/dev/null 2>&1; then
    docker stop "$NAME" >/dev/null
    docker rename "$NAME" "$NAME-previous"
    had_previous=1
  fi
  if ! run_container "$NAME" "$PORT" "$key" || ! healthy "$PORT" "$key"; then
    docker logs --tail 60 "$NAME" >&2 || true
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    if (( had_previous )); then docker rename "$NAME-previous" "$NAME" && docker start "$NAME" >/dev/null; fi
    refuse "antelacus:$key failed on :$PORT; the previous container is back"
  fi
  (( had_previous )) && docker rm "$NAME-previous" >/dev/null

  local entry
  entry="{\"key\":\"$key\",\"imageId\":\"$id\",\"sha\":\"$sha\",\"version\":\"$version\"}"
  state="$(decide afterDeploy "{\"state\":$state,\"env\":\"$ENV_NAME\",\"entry\":$entry}")"
  write_state "$state"
  prune "$state"
  step "done"
  echo "serving $key"
}

prune() {
  local images remove
  images="$(docker image ls antelacus --format '{{.Tag}}' | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0, "utf8").split("\n").filter((t) => t && t !== "<none>")))')"
  remove="$(decide pruneImages "{\"images\":$images,\"state\":$1}")"
  for tag in $(field "{\"r\":$remove}" r | node -e 'for (const t of JSON.parse(require("fs").readFileSync(0, "utf8"))) console.log(t)'); do
    docker image rm "antelacus:$tag" >/dev/null 2>&1 && step "removed image antelacus:$tag" || true
  done
}

verified() {
  [[ "$ENV_NAME" == staging ]] || refuse "only staging verifies an image"
  local key="${1:?usage: release.sh staging verified <key>}" state id
  state="$(state_or_refuse)"
  id="$(image_id "$key")" || refuse "no image antelacus:$key on this machine"
  [[ "$(field "$state" staging.key)" == "$key" && "$(field "$state" staging.imageId)" == "$id" ]] \
    || refuse "staging does not run antelacus:$key; nothing to verify"
  write_state "$(decide afterVerified "{\"state\":$state,\"key\":\"$key\",\"imageId\":\"$id\"}")"
  step "antelacus:$key ($id) verified"
}

status() {
  read_state || echo "state file damaged: $STATE"
  echo
  docker ps --all --filter "name=^$NAME" --format '{{.Names}}  {{.Image}}  {{.Status}}'
}

adopt() {
  [[ "$ENV_NAME" == production ]] || refuse "only production is adopted; staging is simply redeployed"
  docker inspect "$NAME" >/dev/null 2>&1 || refuse "no running $NAME container to adopt"
  local id key version
  id="$(docker inspect --format '{{.Image}}' "$NAME")"
  # Images from before v2.5.0 carry no /app/BUILD_KEY: name them after their image ID.
  key="$(docker exec "$NAME" cat /app/BUILD_KEY 2>/dev/null | tr -d '\n' || true)"
  [[ -n "$key" ]] || key="legacy-${id#sha256:}"; key="${key:0:71}"
  version="$(docker exec "$NAME" node -p "require('/app/package.json').version" 2>/dev/null || echo unknown)"
  docker tag "$id" "antelacus:$key"
  local entry="{\"key\":\"$key\",\"imageId\":\"$id\",\"sha\":\"\",\"version\":\"$version\"}"
  write_state "{\"production\":$entry,\"kept\":[$entry],\"verified\":[{\"key\":\"$key\",\"imageId\":\"$id\"}]}"
  step "adopted $NAME as antelacus:$key (v$version)"
}

case "$COMMAND" in
  deploy)   deploy "${@:3}" ;;
  verified) verified "${@:3}" ;;
  status)   status ;;
  adopt)    adopt ;;
  *) echo "usage: release.sh <staging|production> <deploy|verified|status|adopt> …" >&2; exit 2 ;;
esac
