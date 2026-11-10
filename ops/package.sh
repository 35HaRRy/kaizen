#!/usr/bin/env bash
set -Eeuo pipefail
[[ $# == 3 ]] || { echo 'Usage: package.sh IMAGE_DIGEST FULL_SHA NEW_OUTPUT' >&2; exit 1; }
image=$1
revision=$2
output=$3
[[ $image =~ ^ghcr\.io/35harry/kaizen-api@sha256:[a-f0-9]{64}$ && $revision =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid release metadata' >&2; exit 1; }
[[ ! -e $output && ! -L $output ]] || { echo 'Output must not exist' >&2; exit 1; }
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
mkdir -p -- "$output/gateway"
for file in compose.yml deploy.sh gateway/compose.yml gateway/kaizen.caddy; do
  cp -- "$here/$file" "$output/$file"
done
printf '%s\n' "$image" >"$output/image"
printf '%s\n' "$revision" >"$output/revision"
(cd -- "$output" && sha256sum compose.yml deploy.sh image revision gateway/compose.yml gateway/kaizen.caddy) >"$output/checksums.sha256"
