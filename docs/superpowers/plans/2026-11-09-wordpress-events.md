# WordPress Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import all legacy events and images into the configured MongoDB/R2, preserving editability and existing data.

**Architecture:** A small inventory/import CLI uses WordPress public content and existing media validation/storage. Stable source identities and insert-only event writes make reruns safe. The application gains support for an empty category without changing its four filters.

**Tech Stack:** Existing TypeScript, Node.js, MongoDB driver, AWS S3 SDK, React, node:test.

**Spec:** `docs/superpowers/specs/2026-11-09-wordpress-events-design.md`

## Global Constraints

- Use `api/.env`; never print credentials or connection strings.
- Preserve the existing target event, uploads, administrator and unrelated working-tree changes.
- Preserve source listing dates, titles, cover identity and gallery order; infer only supported facts.
- No new dependency, UI screen, or change to the 50-media limit.
- Only write on explicit import execution; reruns must not overwrite user edits.

## Review Focus

- City-only titles must remain uncategorized, not be mislabeled seminars.
- HTML entities, Turkish characters and dates near midnight must retain displayed values.
- Duplicate cover/gallery references must not duplicate a media item.
- Failure midway through uploading must leave resumable tracked records, not a partial published event.
- Imported uploads must remain editable through the authenticated API and safe from cleanup.

### Task 1: Support uncategorized events

**Files:** `shared/events.ts`, `api/src/events.ts`, `web/src/admin/EventFields.tsx`, existing affected category consumers; tests `api/test/events.test.ts` and a focused admin test.

**Interfaces:** `EventCategory` remains the four category labels; event category fields additionally accept `""`. API filters retain their existing behavior.

- [x] Add failing tests: empty category can be created/read/edited, arbitrary category is still rejected, and the editor renders a blank selection.
- [x] Run focused tests and confirm the intended failure.
- [x] Add the smallest type/validation/select changes, checking all category consumers.
- [x] Run focused API/frontend tests and typechecks.

### Task 2: Inventory and resumable import

**Files:** create `api/tools/wordpress-events.ts`, `api/src/wordpress-import.ts`, `api/test/wordpress-import.test.ts`; update `api/package.json` with an import command and `README.md` with usage.

**Interfaces:** Source inventory contains source ID/URL, title, displayed date, category, location, description, cover URL and ordered unique image URLs. Import consumes this inventory, MongoDB, existing storage and the existing administrator ID. Default CLI mode only inventories; `--apply` writes; verification compares source and target without updating imported events.

- [x] Add failing mapping tests covering Kyu/child precedence, training, city-only ambiguity, fallback location, HTML entities, local-date preservation and duplicate covers.
- [x] Add integration tests with temporary MongoDB and fake storage: complete import, interrupted upload/retry, duplicate invocation, preservation of user edits, cleanup safety, and authenticated editing of the imported record.
- [x] Run these tests and confirm intended failures.
- [x] Implement inventory from WordPress API, checking coverage against every listing page and rejecting unexpected source URLs or invalid inputs. Reuse existing validation/storage rather than bypassing it.
- [x] Implement stable source identities, tracked resumable uploads and insert-only event publication after every image is verified. Require a valid existing admin; do not create credentials.
- [x] Add the CLI command, safe failure reporting, verification mode and documentation.
- [x] Run tests and inspect inventory: expected current source is 20 events / 315 gallery references, maximum 40 per event. Confirm actual counts rather than hardcoding them as a permanent source limit.

### Task 3: Execute and verify authorized migration

**Files:** create `docs/wordpress-events-import-report.md` with non-secret reconciliation results; update this plan's checkboxes.

- [x] Run full tests, typecheck, build and `git diff --check`; distinguish pre-existing failures if any.
- [x] Run inventory, then execute `--apply` against the authorized `api/.env` target, preserving its existing data.
- [x] Verify every imported event's title/date/cover/media order, upload ownership/state and R2 object existence/public accessibility. Confirm public API reads and exercise editability without changing user content. Authenticated object checks cover all 315; external public-access checks are sampled because direct r2.dev TLS fails on this network, as recorded in the report.
- [x] Rerun the importer and prove no additional events or media objects are created and existing event versions/content stay unchanged.
- [x] Write the reconciliation report with counts, failures (if any), source URL and remaining checks; do not claim deployment/browser verification unless actually performed.

## Self-review

The three tasks cover field mapping, storage/database integrity, existing editor compatibility, resumability and end-to-end reconciliation. No changes to unrelated messages work or existing records are needed. Work remains uncommitted unless the user requests a commit.
