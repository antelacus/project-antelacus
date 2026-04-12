#!/usr/bin/env bash
# Keeps the Supabase free-tier project active by pinging the REST API.
# Retries on transient failures. Logs every attempt. Tracks consecutive
# failures in a state file so an external check (or future alerting
# hook) can detect prolonged outages.

REPO_DIR="/home/deploy/antelacus"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/antelacus"
LOG_FILE="$STATE_DIR/supabase-keepalive.log"
FAIL_COUNT_FILE="$STATE_DIR/supabase-keepalive-failures"

MAX_RETRIES=3
RETRY_DELAY=30          # seconds between retries
ALERT_THRESHOLD=3       # consecutive failed runs before alerting

mkdir -p "$STATE_DIR"
cd "$REPO_DIR" || exit 1

set -a
source .env
set +a

if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) error missing-env-vars" >> "$LOG_FILE"
  exit 1
fi

URL="$NEXT_PUBLIC_SUPABASE_URL/rest/v1/content_items?select=id&content_type=eq.post&status=eq.published&order=published_at.desc&limit=1"

attempt=0
while (( attempt < MAX_RETRIES )); do
  attempt=$(( attempt + 1 ))

  TMP_FILE=$(mktemp)
  HTTP_CODE=$(curl \
    --silent \
    --max-time 15 \
    --output "$TMP_FILE" \
    --write-out "%{http_code}" \
    --header "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
    --header "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
    "$URL" 2>/dev/null) || HTTP_CODE="000"

  BYTES=$(wc -c < "$TMP_FILE" 2>/dev/null | tr -d '[:space:]')
  rm -f "$TMP_FILE"

  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ok http=200 bytes=$BYTES attempt=$attempt" >> "$LOG_FILE"
    echo "0" > "$FAIL_COUNT_FILE"
    exit 0
  fi

  if (( attempt < MAX_RETRIES )); then
    sleep "$RETRY_DELAY"
  fi
done

# All retries exhausted — log failure and update consecutive fail count
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "$NOW fail http=$HTTP_CODE bytes=${BYTES:-0} retries=$MAX_RETRIES" >> "$LOG_FILE"

PREV_FAILS=$(cat "$FAIL_COUNT_FILE" 2>/dev/null || echo "0")
CONSECUTIVE=$(( PREV_FAILS + 1 ))
echo "$CONSECUTIVE" > "$FAIL_COUNT_FILE"

if (( CONSECUTIVE >= ALERT_THRESHOLD )); then
  echo "$NOW ALERT consecutive_failures=$CONSECUTIVE threshold=$ALERT_THRESHOLD" >> "$LOG_FILE"
fi

exit 1
