#!/usr/bin/env bash
# Server requirements: Bash, Docker Compose, flock and GNU coreutils. No checkout/build.
set -Eeuo pipefail
umask 077

die() { printf '%s\n' "$1" >&2; exit 1; }
[[ $# -ge 3 ]] || die 'Usage: deploy.sh deploy ROOT INCOMING HTTPS_ORIGIN | rollback ROOT HTTPS_ORIGIN'
mode=$1
root=$2
[[ $root =~ ^(/[a-zA-Z0-9_-]+)+$ && -d $root && ! -L $root ]] || die 'Invalid installation root'
[[ $(realpath -e -- "$root") == "$root" ]] || die 'Installation root must not traverse symlinks'
[[ -d $root/config && ! -L $root/config && -f $root/config/production.env && ! -L $root/config/production.env ]] || die 'Missing trusted config/production.env'
[[ ! -L $root/deploy.lock ]] || die 'Invalid deployment lock'
exec 9>"$root/deploy.lock"
flock -n 9 || die 'Another deployment is running'
[[ ! -L $root/releases ]] || die 'Invalid releases directory'
mkdir -p -- "$root/releases"

files=(compose.yml deploy.sh image revision gateway/compose.yml gateway/kaizen.caddy)
validate_release() {
  local directory=$1 actual expected image revision
  [[ -d $directory && ! -L $directory && ! -L $directory/gateway ]] || die 'Invalid release directory'
  for name in "${files[@]}" checksums.sha256; do
    [[ -f $directory/$name && ! -L $directory/$name ]] || die 'Missing regular release file'
  done
  image=$(<"$directory/image")
  revision=$(<"$directory/revision")
  [[ $image =~ ^ghcr\.io/35harry/kaizen-api@sha256:[a-f0-9]{64}$ ]] || die 'Invalid digest-pinned API image'
  [[ $revision =~ ^[a-f0-9]{40}$ ]] || die 'Invalid release revision'
  actual=$(cd -- "$directory" && sha256sum "${files[@]}")
  expected=$(<"$directory/checksums.sha256")
  [[ $actual == "$expected" ]] || die 'Release checksum mismatch'
}

read_state() {
  local name=$1 revision
  if [[ -e $root/$name || -L $root/$name ]]; then
    [[ -f $root/$name && ! -L $root/$name ]] || die 'Invalid deployment state'
    revision=$(<"$root/$name")
    [[ $revision =~ ^[a-f0-9]{40}$ ]] || die 'Invalid recorded revision'
    validate_release "$root/releases/$revision"
    printf '%s' "$revision"
  fi
}

old=$(read_state current)
case "$mode" in
  deploy)
    [[ $# == 4 ]] || die 'Deploy requires ROOT INCOMING HTTPS_ORIGIN'
    incoming=$3
    origin=$4
    [[ $incoming == "$root"/incoming-* && ${incoming%/*} == "$root" && ! -L $incoming ]] || die 'Incoming release must be a direct installation child'
    [[ $(realpath -e -- "$incoming") == "$incoming" ]] || die 'Invalid incoming release path'
    validate_release "$incoming"
    revision=$(<"$incoming/revision")
    release=$root/releases/$revision
    if [[ -e $release || -L $release ]]; then
      validate_release "$release"
      cmp -s -- "$incoming/checksums.sha256" "$release/checksums.sha256" || die 'Refusing to overwrite an immutable release'
    else
      temporary=$(mktemp -d "$root/releases/.incoming.XXXXXX")
      mkdir -- "$temporary/gateway"
      for name in "${files[@]}" checksums.sha256; do cp -- "$incoming/$name" "$temporary/$name"; done
      mv -T -- "$temporary" "$release"
    fi
    ;;
  rollback)
    [[ $# == 3 ]] || die 'Rollback requires ROOT HTTPS_ORIGIN'
    origin=$3
    revision=$(read_state previous)
    [[ -n $revision && $revision != "$old" ]] || die 'No previous release to roll back to'
    release=$root/releases/$revision
    ;;
  *) die 'Unknown deployment command' ;;
esac
[[ $origin =~ ^https://[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?(:[0-9]{1,5})?$ ]] || die 'Public origin must be HTTPS without credentials/path/query'

compose() {
  local directory=$1
  shift
  KAIZEN_API_IMAGE=$(<"$directory/image") docker compose --env-file "$root/config/production.env" \
    -p kaizen -f "$directory/compose.yml" "$@"
}

start_release() {
  local directory=$1
  compose "$directory" up -d --no-build --pull never --wait --wait-timeout 90 api >/dev/null 2>&1 || return 1
  # Exercise authenticated DB access; liveness alone cannot prove MongoDB is reachable.
  compose "$directory" exec -T api node -e \
    "fetch('http://127.0.0.1:3001/api/events', {headers:{'x-origin-secret':process.env.ORIGIN_SECRET,'x-real-ip':'127.0.0.1'},signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" >/dev/null 2>&1 || return 1
  compose "$directory" exec -T api node -e \
    "fetch(process.argv[1]+'/api/health',{signal:AbortSignal.timeout(10000)}).then(async r=>{if(!r.ok||!(await r.json()).ok)process.exit(1)}).catch(()=>process.exit(1))" "$origin" >/dev/null 2>&1 || return 1
}

mutating=0
failed() {
  local status=$1
  trap - ERR INT TERM HUP
  if [[ $mutating == 1 ]]; then
    if [[ -n $old ]]; then
      if start_release "$root/releases/$old"; then
        printf '%s\n' 'Deployment failed; previous release restored' >&2
      else
        printf '%s\n' 'Deployment failed AND rollback failed; inspect the server' >&2
      fi
    else
      compose "$release" stop api >/dev/null 2>&1 || true
      printf '%s\n' 'Deployment failed; no previous release exists' >&2
    fi
  else
    printf '%s\n' 'Deployment preflight failed; running release unchanged' >&2
  fi
  exit "$status"
}
trap 'failed $?' ERR
trap 'failed 130' INT
trap 'failed 143' TERM
trap 'failed 129' HUP

compose "$release" config --quiet >/dev/null 2>&1
printf 'Pulling release %s\n' "$revision"
docker pull "$(<"$release/image")" >/dev/null 2>&1
mutating=1
start_release "$release"
if [[ $revision != "$old" ]]; then
  if [[ -n $old ]]; then
    printf '%s\n' "$old" >"$root/.previous.new"
    mv -Tf -- "$root/.previous.new" "$root/previous"
  fi
  printf '%s\n' "$revision" >"$root/.current.new"
  mv -Tf -- "$root/.current.new" "$root/current"
fi
mutating=0
trap - ERR INT TERM HUP
printf 'Release %s healthy and recorded\n' "$revision"
