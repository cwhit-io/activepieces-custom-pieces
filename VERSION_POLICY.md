# Custom piece versioning

Flows store an exact `pieceName` + `pieceVersion`. When you ship piece changes, **bump `package.json`** and **sync the database** so existing flows resolve the new build.

## Rules

1. **Bump `package.json`** whenever you change piece code (new actions, fixes, prop changes, refactors).
   - **Patch** (`0.0.7` → `0.0.8`): additive changes, bug fixes, new optional props.
   - **Minor** (`0.0.9` → `0.1.0`): breaking changes — removed/renamed actions, new required props, changed output shape.
2. **Log changes** in `CHANGELOG.md` with the date and affected piece folder(s).
3. **Sync the database** after every version bump so flows pick up the new version (see below). Skipping this causes 404 / “piece not found” errors in the builder and at runtime.
4. **Rebuild and deploy** with `docker/build-custom-pieces.sh` (runs the DB sync automatically unless opted out).

## Workflow

```bash
# 1. Edit piece code, bump package.json version for affected piece(s)
# 2. Log what changed (optional but recommended)
node packages/pieces/custom/scripts/log-custom-piece-change.mjs "planning-center-services: added accept/decline schedule"

# 3. Build, bundle, and sync flow versions in Postgres
./docker/build-custom-pieces.sh

# 4. Redeploy
docker compose build app && docker compose up -d app worker
```

`build-custom-pieces.sh` runs `reset-flow-piece-versions.cjs` at the end so every flow step using a custom piece is updated to the version in `package.json`.

To build without touching the database (e.g. CI compile-only):

```bash
SKIP_DB_VERSION_RESET=1 ./docker/build-custom-pieces.sh
```

## Manual database sync

Use when you bumped versions outside the build script, or to preview changes:

```bash
node packages/pieces/custom/scripts/reset-flow-piece-versions.cjs --dry-run
node packages/pieces/custom/scripts/reset-flow-piece-versions.cjs
```

The script updates `flow_version.trigger` JSON: any step whose `settings.pieceName` matches a custom piece gets `settings.pieceVersion` set to that piece’s current `package.json` version.

## Current versions

Read from each piece’s `package.json` under `packages/pieces/custom/*/`.