# Reliable media delivery implementation plan

**Goal:** Serve gallery media without an owned domain and show the dojo logo on image errors.
**Architecture:** A read-only Worker streams only finalized `media/<24 hex>` objects from an R2 binding. API responses derive URLs from the current `R2_PUBLIC_ORIGIN`, leaving stored records untouched. A shared image component supplies the existing local logo on errors.
**Tech stack:** Existing Express/React, dependency-free JavaScript Worker, Node test runner.
**Approved approach:** User approved the workers.dev approach and requested execution in this session.

## Constraints and review focus
- Never expose staging objects, allow writes, or proxy arbitrary URLs.
- Preserve GET/HEAD, video byte ranges, HTTP metadata and conditional reads.
- Do not mutate MongoDB or delete/re-upload bucket objects.
- Missing media and storage failures must not get immutable error caching.
- Image failure must not loop; changing the source must retry the new image.
- Account deployment needs Cloudflare login and the actual bucket name; do not invent either.

## Tasks
- [x] 1. Add failing Worker tests; implement read-only delivery, missing/error handling, range and conditional responses. Run `node --test ops/media-worker/worker.test.mjs`.
- [x] 2. Add failing API tests for old stored URLs rebased to the configured origin; apply to list/detail/save/upload responses. Run API tests.
- [x] 3. Add failing UI tests for error fallback, source reset and thumbnails; reuse component for public/admin covers and gallery. Run web tests.
- [x] 4. Document deployment, quotas and activation; run all tests, typechecks, builds and diff checks. No commit or live deployment without configured access.

## Execution record
- Initial tree clean. Cloudflare rate limiting remains a hypothesis: supplied r2.dev URL failed TLS locally, not an observed 429.
- Deployment is a separate activation step; local tests use an R2 adapter, not a live bucket.
- Initial verification: 6 Worker + 22 API + 19 web tests passed; typechecks and both builds passed.
- Independent read-only review found no important/critical issues; flagged import verification's stale-origin comparison. Fixed it to compare deterministic object keys instead, preserving content/size checks; regression test failed on the old comparison.
- Deployment blocker: `npx wrangler@latest whoami` reports no authenticated session. No account/bucket guessed, no live settings changed, no commit/push performed.
- Final verification after review fix: 47/47 tests passed, typechecks and API build passed; web build passed before the API-only review fix. Wrangler deploy dry-run passed (placeholder bucket; no upload). `git diff --check` passed. Ops Python tests: 1 passed, 13 Linux/Docker-only tests skipped on Windows.
