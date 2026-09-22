#!/usr/bin/env bash
# Is the site answering from the outside? Runs on the VPS by cron and reports to the dead-man's switch;
# if the VPS itself is down, the missing report is the alert. Variable: HC_PING_SITE (from .env).
# Cron: */10 * * * * /home/deploy/antelacus/scripts/site-check.sh
set -uo pipefail
cd "$(dirname "$0")/.." && set -a && source .env && set +a
URL="${SITE_CHECK_URL:-https://www.antelacus.com/en/about}"
ping() { [[ -n "${HC_PING_SITE:-}" ]] && curl -fsS -m 10 --retry 3 -o /dev/null "$HC_PING_SITE$1" || true; }
code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' -H 'Accept-Language: en' "$URL" || echo 000)
if [[ "$code" == "200" ]]; then ping ""; else echo "$(date -u +%FT%TZ) site-check: $URL answered $code"; ping /fail; exit 1; fi
