#!/usr/bin/env bash
# REQ release-pipeline §5.1-a: no .env reaches the image. Plant a marked fake .env in the build context,
# build, then prove the image holds neither an .env file nor the marker, in its files or its history.
#   scripts/release/image-check.sh plant           — before `docker build`
#   scripts/release/image-check.sh verify <image>  — after it; removes what plant wrote
# The planted files are real files in the context on every run, so the check cannot pass vacuously.
set -euo pipefail
cd "$(dirname "$0")/../.."

MARKER_FILE=.env.image-check-marker

case "${1:-}" in
  plant)
    marker="PLANTED_ENV_MARKER_$(openssl rand -hex 8)"
    printf '%s\n' "$marker" > "$MARKER_FILE"
    for file in .env .env.production; do
      [[ -e "$file" ]] && { echo "image-check: $file already exists; refusing to overwrite it" >&2; exit 1; }
      printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n' "$marker" > "$file"
    done
    echo "image-check: planted $marker"
    ;;
  verify)
    image="${2:?usage: image-check.sh verify <image>}"
    marker="$(cat "$MARKER_FILE")"
    trap 'rm -f .env .env.production "$MARKER_FILE"' EXIT
    found="$(docker run --rm --entrypoint sh "$image" -c \
      "find / -xdev \( -name '.env' -o -name '.env.*' \) -not -path '/proc/*' 2>/dev/null; grep -rl '$marker' /app 2>/dev/null || true")"
    history="$(docker history --no-trunc --format '{{.CreatedBy}}' "$image" | grep -c "$marker" || true)"
    if [[ -n "$found" || "$history" != 0 ]]; then
      echo "image-check: $image carries the planted .env:" >&2
      printf '%s\n' "$found" >&2
      [[ "$history" != 0 ]] && echo "(and the marker is in its history)" >&2
      exit 1
    fi
    echo "image-check: $image holds no .env and no marker"
    ;;
  *)
    echo "usage: image-check.sh plant | verify <image>" >&2
    exit 2
    ;;
esac
