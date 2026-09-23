#!/usr/bin/env bash
#
# Convert a ZAP XML report file into a JUnit-compatible XML report, applying
# the ignore-list / false-positive suppression rules defined in zap2junit.xsl.
#
# Usage:
#   ./convert-zap-report.sh [report.xml] [junit.xml] [stylesheet.xsl]
#
# All paths may be relative (resolved against the current working
# directory, i.e. %teamcity.build.workingDir% when run as a TeamCity
# "Command Line" build step) or absolute.

# The Docker image used can be overridden via the ZAP2JUNIT_IMAGE env var
# (default: alpine:3.20, ~8MB + libxslt).

set -euo pipefail

WORKDIR="$(pwd)"
IN="${1:-zap-report/report.xml}"
OUT="${2:-zap-report/junit.xml}"
XSL="${3:-tests/docker/zap/zap2junit.xsl}"
IMAGE="${ZAP2JUNIT_IMAGE:-alpine:3.20}"

to_abs() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s\n' "$WORKDIR/$1" ;;
  esac
}

IN_ABS="$(to_abs "$IN")"
OUT_ABS="$(to_abs "$OUT")"
XSL_ABS="$(to_abs "$XSL")"

if [ ! -f "$IN_ABS" ]; then
  echo "ERROR: ZAP report not found: $IN_ABS" >&2
  exit 1
fi
if [ ! -f "$XSL_ABS" ]; then
  echo "ERROR: XSLT stylesheet not found: $XSL_ABS" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT_ABS")"

IN_DIR="$(dirname "$IN_ABS")"
OUT_DIR="$(dirname "$OUT_ABS")"
XSL_DIR="$(dirname "$XSL_ABS")"
IN_FILE="$(basename "$IN_ABS")"
OUT_FILE="$(basename "$OUT_ABS")"
XSL_FILE="$(basename "$XSL_ABS")"

echo "Converting $IN_ABS -> $OUT_ABS (stylesheet: $XSL_ABS)"

docker run --rm \
  -v "$IN_DIR:/in:ro" \
  -v "$XSL_DIR:/xsl:ro" \
  -v "$OUT_DIR:/out" \
  "$IMAGE" sh -c "apk add --no-cache libxslt >/dev/null 2>&1 && xsltproc -o \"/out/$OUT_FILE\" \"/xsl/$XSL_FILE\" \"/in/$IN_FILE\""

echo "Wrote $OUT_ABS"

