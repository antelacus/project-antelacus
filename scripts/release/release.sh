#!/usr/bin/env bash
# The one entry point for putting an image into service on the VPS (release-pipeline DESIGN §2.1, §4, §6).
#   release.sh <staging|production> deploy <key> [<sha>] [<version>]
#   release.sh staging verified <key>        — staging-check passed: production may now run this image
#   release.sh <staging|production> restart     — the running image again, e.g. after its env file changed
#   release.sh <staging|production> rollback [<key>]  — back to the previous kept image, or the one named
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
  *) echo "usage: release.sh <staging|production> <deploy|restart|rollback|verified|status|adopt> …" >&2; exit 2 ;;
esac

refuse() { echo "release: $*" >&2; exit 1; }
step() { echo "release[$ENV_NAME] $(date -u +%H:%M:%S) $*"; }
decide() { node "$HERE/decide.mjs" "$1" "$2"; }
json_string() { node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(process.argv[1], "utf8")))' "$1"; }
field() { node -e 'let v; try { v = JSON.parse(process.argv[1]); } catch { console.error(`release: not JSON where ${process.argv[2]} was read`); process.exit(1); } const r = process.argv[2].split(".").reduce((o, k) => o?.[k], v); process.stdout.write(r === undefined || r === null ? "" : typeof r === "string" ? r : JSON.stringify(r))' "$1" "$2"; }
# A JSON list of plain strings, one per line.
lines() { node -e 'let a; try { a = JSON.parse(process.argv[1]); } catch { console.error("release: not a JSON list"); process.exit(1); } for (const x of a) console.log(x)' "$1"; }

mkdir -p "$STATE_DIR"
# One lock for both environments: they read and rewrite the same state file. A second release waits.
exec 9>"$STATE_DIR/releases.lock"
flock --wait 900 9 || refuse "another release has held the lock for 15 minutes"
# The pgpass and env files of a run killed before it could remove them: with the lock held, none is in use.
rm -f "$STATE_DIR"/pgpass.* "$STATE_DIR"/env.*

read_state() {
  if [[ ! -e "$STATE" ]]; then echo '{}'; return; fi
  node -e 'try { const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); if (typeof s !== "object" || s === null || Array.isArray(s)) throw 0; process.stdout.write(JSON.stringify(s)); } catch { process.exit(3); }' "$STATE"
}
state_or_refuse() {
  local state
  # Damaged, it is left alone by both environments: staging rewriting it would erase production's history.
  if ! state="$(read_state)"; then refuse "the state file $STATE is damaged; move it aside and run: release.sh production adopt"; fi
  if [[ "$ENV_NAME" == production && ! -e "$STATE" ]]; then refuse "no state file at $STATE; run: release.sh production adopt"; fi
  printf '%s' "$state"
}
write_state() { printf '%s\n' "$1" > "$STATE.tmp" && mv "$STATE.tmp" "$STATE"; }
# A read-only query on production's database. The password goes to psql in a pgpass file readable by this
# user only, never on a command line (`ps`, `docker inspect`); the file lives as long as the query.
db_query() {
  local pgpass url status=0
  pgpass="$(mktemp "$STATE_DIR/pgpass.XXXXXX")"
  if ! url="$(node --input-type=module -e "
      import { pgConnection } from '$HERE/decide.mjs'; import { readFileSync, writeFileSync } from 'node:fs';
      const c = pgConnection(readFileSync(0, 'utf8'));
      if (!c) { console.error('release: no DATABASE_URL in $CHECKOUT/.env'); process.exit(1); }
      writeFileSync(process.argv[1], c.pgpass, { mode: 0o600 }); process.stdout.write(c.url);" "$pgpass" < "$CHECKOUT/.env")"; then
    rm -f "$pgpass"; return 1
  fi
  docker run --rm --network host -v "$pgpass:/pgpass:ro" -e PGPASSFILE=/pgpass "postgres:$PG_MAJOR" \
    psql "$url" -At -F $'\t' -c "$1" || status=$?
  rm -f "$pgpass"
  return "$status"
}

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
  # docker --env-file keeps quotes as part of the value; the VPS files are dotenv. A normalised copy without the
  # server jobs' variables (appEnv), readable by this user only, exists just long enough for docker to read it.
  local envfile status=0
  envfile="$(mktemp "$STATE_DIR/env.XXXXXX")"
  # Checked explicitly: this function is called inside `if`, where set -e does not stop a failing step.
  if ! node -e 'process.stdout.write(require("fs").readFileSync(process.argv[1], "utf8"))' "$ENV_FILE" \
    | node --input-type=module -e "import { appEnv } from '$HERE/decide.mjs'; let t = ''; process.stdin.on('data', (c) => t += c).on('end', () => process.stdout.write(appEnv(t)));" > "$envfile" \
    || [[ ! -s "$envfile" ]]; then
    rm -f "$envfile"
    echo "release: could not read variables from $ENV_FILE" >&2
    return 1
  fi
  docker run --detach --name "$1" --restart unless-stopped \
    --publish "127.0.0.1:$2:3000" --env-file "$envfile" \
    --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
    "${LIMITS[@]}" "antelacus:$3" >/dev/null || status=$?
  rm -f "$envfile"
  return "$status"
}

check_migrations() {
  local records files
  records="$(db_query "select name, md5(array_to_string(statements, '')) from supabase_migrations.schema_migrations" \
    | node -e 'const rows = require("fs").readFileSync(0, "utf8").trim().split("\n").filter(Boolean).map((l) => l.split("\t")); process.stdout.write(JSON.stringify(rows.map(([name, digest]) => ({ name, digest }))))')" \
    || refuse "could not read the migration records"
  files="$(node -e 'const fs = require("fs"), path = require("path"), crypto = require("crypto"); const dir = process.argv[1]; process.stdout.write(JSON.stringify(fs.readdirSync(dir).filter((f) => /^\d+_[^/]+\.sql$/.test(f)).sort().map((file) => ({ file, digest: crypto.createHash("md5").update(fs.readFileSync(path.join(dir, file), "utf8").replace(/\n+$/, "")).digest("hex") }))))' "$BUNDLE/supabase/migrations")"
  local problems
  problems="$(decide migrationProblems "{\"files\":$files,\"records\":$records}")"
  [[ "$(field "$problems" missing)" == "[]" ]] || refuse "production has not executed: $(field "$problems" missing)"
  [[ "$(field "$problems" changed)" == "[]" ]] || refuse "production executed a different text of: $(field "$problems" changed)"
  step "migrations: every file has a matching record"
}

# A switch cut short (a lost connection, a killed job) leaves the old container as $NAME-previous, possibly with
# no $NAME at all. Put it back before anything else. With both present, the state file says which is the
# release: the switch records the new image before it removes the old container, so an unrecorded $NAME is
# a candidate that never passed.
reconcile() {
  docker inspect "$NAME-previous" >/dev/null 2>&1 || return 0
  if ! docker inspect "$NAME" >/dev/null 2>&1; then
    step "an interrupted switch left $NAME-previous: restoring it"
    docker rename "$NAME-previous" "$NAME" && docker start "$NAME" >/dev/null || refuse "could not restore $NAME-previous; see docker ps -a"
    return 0
  fi
  local recorded current previous
  recorded="$(field "$(read_state)" "$ENV_NAME.imageId")"
  current="$(docker inspect --format '{{.Image}}' "$NAME")"
  previous="$(docker inspect --format '{{.Image}}' "$NAME-previous")"
  if [[ -n "$recorded" && "$current" == "$recorded" ]]; then
    docker rm -f "$NAME-previous" >/dev/null
  elif [[ -n "$recorded" && "$previous" == "$recorded" ]]; then
    step "an interrupted switch left an unrecorded $NAME: restoring $NAME-previous"
    restore_previous || refuse "could not restore $NAME-previous; see docker ps -a"
  else
    refuse "$NAME and $NAME-previous both exist and the state records neither; see release.sh $ENV_NAME status"
  fi
}

# The new container out, the old one back in service.
restore_previous() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  if docker inspect "$NAME-previous" >/dev/null 2>&1; then docker rename "$NAME-previous" "$NAME" && docker start "$NAME" >/dev/null; fi
}

# Try the image on the scratch port, then take over the environment's port. The old container is only stopped
# and renamed, and comes back if any step fails; it is removed by commit_switch once the release is recorded.
# <expected key> is empty for an image from before /api/build existed.
switch_to() { # <key> <expected key or "">
  local key="$1" expected="$2"
  step "trying antelacus:$key on :$SCRATCH"
  docker rm -f "$NAME-candidate" >/dev/null 2>&1 || true
  if ! run_container "$NAME-candidate" "$SCRATCH" "$key" || ! healthy "$SCRATCH" "$expected"; then
    docker logs --tail 60 "$NAME-candidate" >&2 || true
    docker rm -f "$NAME-candidate" >/dev/null 2>&1 || true
    refuse "antelacus:$key did not come up healthy on :$SCRATCH; $NAME is untouched"
  fi
  docker rm -f "$NAME-candidate" >/dev/null

  reconcile
  step "switching :$PORT to antelacus:$key"
  if docker inspect "$NAME" >/dev/null 2>&1; then
    docker stop "$NAME" >/dev/null || refuse "could not stop $NAME; it keeps serving"
    if ! docker rename "$NAME" "$NAME-previous"; then
      docker start "$NAME" >/dev/null || true
      refuse "could not rename $NAME; it is started again"
    fi
  fi
  if ! run_container "$NAME" "$PORT" "$key" || ! healthy "$PORT" "$expected"; then
    docker logs --tail 60 "$NAME" >&2 || true
    restore_previous || true
    refuse "antelacus:$key failed on :$PORT; the previous container is back"
  fi
  return 0
}

# After the switch: record the release, or put the old container back. Only a recorded release loses its fallback.
record_or_restore() { # <state>
  if ! write_state "$1"; then
    restore_previous || true
    refuse "could not record the release in $STATE; the previous container is back"
  fi
  docker rm -f "$NAME-previous" >/dev/null 2>&1 || true
}

# Each deploy leaves its bundle in ~/.cache/antelacus-release; the ten newest stay (the running one among them).
prune_bundles() {
  local dir; dir="$(dirname "$BUNDLE")"
  [[ "$(basename "$dir")" == antelacus-release ]] || return 0
  ls -1dt "$dir"/*/ 2>/dev/null | tail -n +11 | while read -r old; do [[ "${old%/}" != "$BUNDLE" ]] && rm -rf "$old"; done || true
}

deploy() {
  local key="${1:?usage: release.sh $ENV_NAME deploy <key> [<sha>] [<version>]}" sha="${2:-}" version="${3:-}" force="${4:-}"
  local state id serving
  state="$(state_or_refuse)"
  id="$(image_id "$key")" || refuse "no image antelacus:$key on this machine"
  if [[ "$ENV_NAME" == production ]]; then
    # A restart runs the very image production already runs; anything else must be one staging verified.
    if [[ -z "$force" || "$id" != "$(field "$state" production.imageId)" ]]; then
      [[ "$(decide mayPromote "{\"state\":$state,\"key\":\"$key\",\"imageId\":\"$id\"}")" == true ]] \
        || refuse "antelacus:$key ($id) was never verified on staging"
    fi
  else
    local problems
    [[ -r "$ENV_FILE" ]] || refuse "cannot read $ENV_FILE"
    problems="$(decide stagingEnvProblems "$(json_string "$ENV_FILE")")"
    [[ "$problems" == "[]" ]] || refuse "$ENV_FILE holds $problems: staging must not be able to write production"
  fi
  check_migrations

  serving="$(docker inspect --format '{{.Image}}' "$NAME" 2>/dev/null || true)"
  if [[ -z "$force" && "$serving" == "$id" ]] && [[ "$(decide shouldDeploy "{\"serving\":\"$(field "$state" "$ENV_NAME.key")\",\"next\":\"$key\"}")" == false ]]; then
    step "already serving $key"; echo "serving $key"; return 0
  fi

  switch_to "$key" "$key"

  local entry
  entry="{\"key\":\"$key\",\"imageId\":\"$id\",\"sha\":\"$sha\",\"version\":\"$version\"}"
  state="$(decide afterDeploy "{\"state\":$state,\"env\":\"$ENV_NAME\",\"entry\":$entry}")"
  record_or_restore "$state"
  prune "$state"
  prune_bundles
  step "done"
  echo "serving $key"
}

prune() {
  local tag images remove
  # Each tag with its build time; one Docker cannot date (gone meanwhile) gets none, and is kept.
  images="$(for tag in $(docker image ls antelacus --format '{{.Tag}}' | grep -v '^<none>$'); do
      printf '%s\t%s\n' "$tag" "$(docker image inspect --format '{{.Created}}' "antelacus:$tag" 2>/dev/null || true)"
    done | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0, "utf8").split("\n").filter(Boolean).map((l) => { const [key, created] = l.split("\t"); return { key, created }; })))')"
  remove="$(decide pruneImages "{\"images\":$images,\"state\":$1,\"now\":$(date +%s)000}")"
  for tag in $(lines "$remove"); do
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
  local entry="{\"key\":\"$key\",\"imageId\":\"$id\",\"sha\":\"\",\"version\":\"$version\"}" base
  # Into the state that exists: staging's records and the images it verified (a PR waiting to merge) stay.
  # A damaged or missing file starts from nothing — that is what adopt is for.
  base="$(read_state 2>/dev/null)" || base='{}'
  write_state "$(decide afterAdopt "{\"state\":$base,\"entry\":$entry}")" || refuse "could not write $STATE"
  step "adopted $NAME as antelacus:$key (v$version)"
}

rollback() {
  local requested="${1:-}" state kept contracts target key
  state="$(state_or_refuse)"
  kept="$(decide keptOf "{\"state\":$state,\"env\":\"$ENV_NAME\"}")"
  # Contract steps production executed, read from its migration records (each keeps the text it ran, marker
  # included): an image older than one would read what no longer exists. Without the database — perhaps the
  # very outage being rolled back from — the bundle's files stand in, and the run says so.
  local texts
  if texts="$(db_query "select coalesce(json_agg(array_to_string(statements, '')), '[]') from supabase_migrations.schema_migrations" 2>/dev/null)" && [[ -n "$texts" ]]; then
    :
  else
    echo "release: warning: the migration records are unreadable; contract steps come from this bundle's files" >&2
    texts="$(node -e 'const fs = require("fs"), d = process.argv[1]; process.stdout.write(JSON.stringify(fs.readdirSync(d).filter((f) => /^\d+_[^/]+\.sql$/.test(f)).map((f) => fs.readFileSync(d + "/" + f, "utf8"))))' "$BUNDLE/supabase/migrations")"
  fi
  contracts="$(printf '%s' "$texts" | node --input-type=module -e "import { contractSteps } from '$HERE/migration-lint.mjs'; let t = ''; process.stdin.on('data', (c) => t += c).on('end', () => { let texts; try { texts = JSON.parse(t); } catch { console.error('release: the migration texts are not JSON'); process.exit(1); } process.stdout.write(JSON.stringify(contractSteps(texts))); });")" || refuse "could not read the contract steps"
  target="$(decide rollbackTarget "{\"kept\":$kept,\"contracts\":$contracts,\"requested\":\"$requested\"}")"
  [[ "$target" != null ]] || refuse "no image to roll back to${requested:+ (asked for $requested)}: none kept, or each is older than a contract step"
  key="$(field "$target" key)"
  local id; id="$(image_id "$key")" || refuse "antelacus:$key is kept in the state but not on this machine"
  # The tag must still name the image that was kept: a retagged image was never verified.
  [[ "$id" == "$(field "$target" imageId)" ]] || refuse "antelacus:$key is now $id, not the kept $(field "$target" imageId)"
  step "rolling back to antelacus:$key"
  # The database is never touched: migrations are additive, and a contract step already ruled the target in.
  switch_to "$key" "$([[ "$key" == legacy-* ]] || echo "$key")"
  record_or_restore "$(decide afterRollback "{\"state\":$state,\"env\":\"$ENV_NAME\",\"target\":$target}")"
  prune_bundles
  step "done"
  echo "serving $key"
}

restart() {
  local state key
  state="$(state_or_refuse)"
  key="$(field "$state" "$ENV_NAME.key")"
  [[ -n "$key" ]] || refuse "no recorded $ENV_NAME release to restart"
  deploy "$key" "$(field "$state" "$ENV_NAME.sha")" "$(field "$state" "$ENV_NAME.version")" force
}

case "$COMMAND" in
  deploy)   deploy "${@:3}" ;;
  restart)  restart ;;
  rollback) rollback "${@:3}" ;;
  verified) verified "${@:3}" ;;
  status)   status ;;
  adopt)    adopt ;;
  *) echo "usage: release.sh <staging|production> <deploy|restart|rollback|verified|status|adopt> …" >&2; exit 2 ;;
esac
