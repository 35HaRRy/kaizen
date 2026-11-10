# Shared Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run Kaizen API on the Oracle instance behind an independently deployed HTTPS gateway, keeping application configuration in its own repository.

**Architecture:** Generic Caddy gateway in hayrihabip.com, application-owned site files and Compose adapters in Kaizen and Aisomedo. Separate per-application proxy networks; existing database topology and access rules remain unchanged. Vercel serves Kaizen web and forwards same-origin API requests. Production images are built in CI, never on the target server.

**Tech Stack:** Docker Compose, Caddy, TypeScript/Express/MongoDB, Vite/Vercel, existing Aisomedo Python deployment tools.

**Spec:** `docs/superpowers/specs/2026-11-09-shared-gateway-design.md`

## Global Constraints

- Gateway sources: `hayrihabip.com/DevOps/gateway/`; no application domain/upstream declarations there.
- Application-specific configuration stays in the application's repository.
- Preserve `dojo-prod` project/volume identities, local/dedicated modes, auth/CSRF and log privacy.
- No live deploy, DNS mutation, commits, secret values, new runtime dependencies, database migration or volume deletion.
- Minimal root README edits; detailed commands belong beside ops configuration.

## Review Focus

- Direct requests must not spoof an end-user IP to bypass rate limits.
- A new Aisomedo release/rollback must retain proxy connectivity and private database isolation.
- Container localhost must not silently select a different database from host MongoDB.
- A failed Caddy validation must leave the running gateway configuration unchanged.
- API rewrites must preserve path/query, cookies and unsafe-method Origin/CSRF checks.

---

### Task 1: Generic gateway and adapter contract

**Files:** Create `hayrihabip.com/DevOps/gateway/{compose.yml,Caddyfile,README.md}` and a small configuration smoke check beside them. Update `hayrihabip.com/README.md` with one link.

**Interfaces:** Gateway Compose service `gateway`; persistent certificate storage; site directory `/etc/caddy/sites-enabled`; application adapters add read-only site mounts and their own external networks. No Docker socket mount or automatic label discovery.

- [ ] Write a configuration check asserting only gateway publishes TCP 80/443, certificate storage persists, no application upstream/domain occurs in generic config, and site import accepts an empty directory.
- [ ] Run the check before creating implementation files and record the expected failure.
- [ ] Implement pinned Caddy configuration, bounded logs, restart policy and explicit validate/reload instructions. Document adapter ordering and relative Compose path resolution.
- [ ] Validate Compose render and Caddy adapt/validate, including a deliberately invalid site file. Confirm no reload runs on validation failure.

### Task 2: Aisomedo integration without gateway ownership

**Files:** Update `aisomedo/ops/docker-compose.existing-proxy.yml` (or add a compatible optional adapter), `ops/deploy.py` when required by bundle contract, and affected `ops/tests/test_deploy*.py`. Create `ops/gateway/shared-gateway.{caddy,yml}` and detailed setup instructions. Add one short section/link in `aisomedo/README.md`.

**Interfaces:** Internal gateway stays on port 80, has a unique application alias on its external proxy network; shared gateway adapter mounts only Aisomedo's site file. Keep existing host-proxy installations supported.

- [ ] Add failing tests for rendered network attachments, unchanged volume names, no new DB/backend/worker exposure, and release bundle/deploy/rollback inclusion of required files.
- [ ] Implement the optional shared-gateway path using existing-proxy mode. Keep service-specific site environment on shared gateway via this application's adapter; do not reuse another application's DOMAIN variable.
- [ ] Run ops unit tests, bundle validation and Compose checks for local, dedicated and existing-proxy modes. Exercise two application adapters together to catch mount/network/env collisions.
- [ ] Document switching port ownership without deleting volumes, maintaining the deployment mode in recorded state, certificate preservation and explicit rollback.

### Task 3: Kaizen container, Vercel separation and security

**Files:** Create `api/Dockerfile`, root `.dockerignore`, `ops/compose.yml`, `ops/gateway/{kaizen.caddy,compose.yml}`, production env example and ops README. Update `api/src/server.ts`, configuration/rate-limit implementation and tests, `api/package.json`/TypeScript config as necessary, `web/vercel.json`, obsolete `web/api/index.ts` and `web/scripts/copy-api-assets.mjs` references, root README.

**Interfaces:** API port 3001 inside Docker, unique alias on Kaizen-only proxy network, no public port; existing `/api/*` routes; same-origin browser requests through Vercel; MongoDB connection supplied explicitly.

- [ ] Verify current Vercel external rewrite/path/cookie/client-IP semantics in primary docs. Resolve and test the proxy trust design before coding; do not trust an arbitrary public header or restore `VERCEL=1` in the API container. If secure end-user IP forwarding requires changing the agreed architecture, stop for approval.
- [ ] Add failing tests for config validation, production cookies, preserved Origin/CSRF rejection, spoofed forwarded headers, and correct rate-limit separation through the approved proxy chain.
- [ ] Implement a container runtime containing shared code/runtime assets and maintenance/admin tools. Listen on `0.0.0.0`, support graceful shutdown and a bounded healthcheck. Exclude secrets, node_modules and unrelated repositories from build context.
- [ ] Replace Vercel API execution with HTTPS external forwarding. Remove only tracked obsolete function/copier artifacts and their references; preserve frontend shared types and local Vite proxy.
- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm build`, Docker build/Compose render and container health checks when available. Test private MongoDB reachability separately without using production data in automated tests.
- [ ] Minimally correct root README's outdated single-Vercel API, secret placement, rate-limit and maintenance claims; link full deployment commands in ops README.

### Task 4: Cross-repository cutover checks

**Files:** Update the three ops guides only where needed; check each repository diff separately.

- [ ] Render gateway plus both application adapters together; verify unique aliases, mounts and per-application network isolation, including gateway recreation after either application deploy.
- [ ] Verify Caddy routes preserve Aisomedo readiness/web-health behavior and Kaizen API paths. Verify invalid site validation does not activate a bad config.
- [ ] Review migration order, preserved volume names, certificates, expected brief outage and rollback commands. Never include `down -v` or prune commands.
- [ ] Run `git diff --check` and relevant tests in each repository. Report commands/results and list all checks blocked by missing Docker, hostname, credentials or server access.

## Execution choice

Recommended: native execution in this session, because the three tasks share a small configuration contract and cross-repository review matters more than parallel edits. No live rollout is included. Obtain plan approval before implementation.

## Execution result

Approved and implemented on the existing branches. Gateway Caddy tests: 3 passed;
Kaizen API/frontend: 19/17 passed; Aisomedo deploy/config: 52 passed, 2 skipped;
typecheck, API/frontend builds, production dependency-layout check and combined
Compose/Caddy validation passed. Fresh review found and verified a fix for Caddy
error-log secret disclosure. Broader Aisomedo ops tests: 150 passed, 40 skipped,
1 unrelated Windows CRLF/LF failure in `test_restore_relocates_firebase_credentials`.
After the user enabled Docker, both API/internal gateway image builds and a real
throwaway full-stack smoke test passed: trusted local-CA TLS, both routing chains,
auth/CSRF/rate limits, network isolation, independent app restarts and secret-free
upstream-error logs. Existing unchanged local Aisomedo backend/worker images were
used with fresh databases. Public ACME/DNS/Oracle/Vercel rollout and Linux-only
deploy rollback tests remain unverified. No commits, pushes or server/DNS/Vercel
account changes made. Existing Aisomedo web build/test dependencies report six
audit findings; no unrelated dependency upgrades were performed.

## Follow-up implementation: fully automatic Kaizen CI/CD

**Updated spec:** the "Güncellenen işletim koşulları" section of the design document above.
**Execution:** same current branches and native execution as previously selected; no live account/server changes, commits or pushes.

### Task 5: Pull-only release and Bash deployment

**Files:** `ops/compose.yml`, optional local-only `ops/compose.build.yml`, `ops/deploy.sh`, `ops/tests/test_deploy.py`, `ops/tests/test_config.py`, `ops/.env.example`.
**Interfaces:** digest-pinned `KAIZEN_API_IMAGE`; release directory containing runtime Compose, Bash deploy tool, image metadata and app-owned gateway files; persistent server environment outside release directories; fixed project/network identity.

- [ ] Write failing executable tests for valid release, malformed digest/path, concurrent deployment, successful update, unhealthy candidate, automatic rollback and failed first deployment. Exercise Bash on Linux in Docker; no production credentials/resources.
- [ ] Make runtime Compose pull-only. Keep local Docker builds explicit and separate. Preserve supplied `MONGODB_URI` without deriving/replacing its address.
- [ ] Implement one Bash tool with deploy/rollback commands: validate inputs before mutations, lock deployment, pull exact image, start without build, verify health with timeout, atomically record successful release and recover the previous release on failed update. Never source untrusted release/env data or remove volumes.
- [ ] Run unit/config tests and real Docker candidate/recovery tests with unique test projects and temporary databases.

### Task 6: GitHub Actions test, publish and automatic deployment

**Files:** `.github/workflows/api.yml`, release packaging helper/test only if needed, `ops/README.md`, root README.
**Interfaces:** `main` production trigger, GHCR immutable digest, production environment deployment vars/secrets and verified SSH host keys; artifacts contain only selected deploy files (no source/secrets).

- [ ] Validate workflow triggers, shell syntax and release contents. PRs cannot publish/deploy or access production secrets. Failed test/build jobs prevent deployment.
- [ ] Test/typecheck/build on GitHub, publish amd64/arm64 API image with minimum token permissions, prepare exact-digest package, transfer package using SSH/SCP and invoke the Bash tool automatically.
- [ ] Serialize production deploys without canceling in-flight remote work; skip superseded revisions, retain SSH host-key checking, and keep DB/R2/Turnstile secrets out of CI.
- [ ] Document one-time GitHub/server secrets, registry read access, SSH reachability, main-branch trigger and optional manual rerun/rollback; no routine manual deployment step.

### Task 7: Clone-free gateway/Aisomedo packaging and cutover guide

**Files:** Aisomedo release packaging/tests and gateway guide; hayrihabip.com `DevOps/gateway` package instructions/helper as needed; all three root README files (minimal edits).
**Interfaces:** generic gateway package remains app-agnostic; each app owns and delivers its site/adapter files at stable server paths outside disposable application releases.

- [ ] Ensure packages include needed gateway/runtime configuration without requiring a server clone. Preserve legacy Aisomedo bundle/rollback support.
- [ ] Rewrite deployment examples to artifact/release paths; remove server-side build/clone and MongoDB reconfiguration requirements.
- [ ] Run combined gateway validation and application Docker smoke checks with pull-only runtime config; independently review CI trust boundaries, rollback and packaging. Report real GitHub/SSH/Oracle checks that require credentials and remain unverified.

### Follow-up review focus

- First deployment has no rollback target; failures must not create a false successful state.
- Concurrent or superseded CI jobs must not overwrite the newer production release.
- Invalid release paths/digests and untrusted PRs must not reach production commands/secrets.
- An unhealthy image must restore the previous image and preserve runtime secrets and DB contents.
- Package-only server paths must preserve app-owned gateway settings across app releases, without restarting shared ingress on every API deploy.

### Follow-up result

Tasks5–7 implemented on the existing branches. Kaizen Linux deployment/config/
package/real-Docker suite:14 passed. API/frontend tests:19/17 passed. Aisomedo
deploy/config:54 passed,2 skipped; full ops suite:152 passed,40 skipped and the
same preexisting Windows newline failure in backup test. Actionlint (both new
workflows), ShellCheck (three scripts), typecheck and API/frontend builds passed.
Independent review found no blocking production issue. Deferred minors: generic
gateway CI's native Caddy tests require CADDY_BIN (locally passed), and no Mongo
data sentinel assertion in the real recovery test. No live GitHub/SSH/registry
publication or Oracle changes, commits or pushes performed.
