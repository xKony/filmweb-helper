#!/usr/bin/env sh
set -eu

target="${1:-}"

if [ "$target" != "firefox" ] && [ "$target" != "chromium" ]; then
  echo "Usage: $0 <firefox|chromium>" >&2
  exit 1
fi

root="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
source="$root/manifests/manifest.$target.json"
dest="$root/manifest.json"

cp "$source" "$dest"
echo "Applied $target manifest -> manifest.json"
