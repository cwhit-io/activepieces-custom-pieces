# Self-Hosted Install

How to install custom Pieces from this monorepo into a self-hosted Activepieces instance.

> **Verify against current Activepieces self-hosted docs.** Paths, CLI commands, and admin UI labels change between releases. Treat anything marked *uncertain* below as a checkpoint against [Activepieces documentation](https://www.activepieces.com/docs).

## Overview

Activepieces builds each Piece into a **self-contained bundle** (`.tgz`) that the platform installs without a separate `npm install` of `@activepieces/*` packages at runtime. Your monorepo compiles TypeScript here; the final bundle step typically runs inside an Activepieces checkout using their CLI.

## Step 1: Build the Piece in this monorepo

```bash
cd activepieces-custom-pieces
npm install
npm run build:planning-center
```

This produces compiled JavaScript in `pieces/planning-center/dist/`.

## Step 2: Package with the Activepieces CLI

*Uncertain — confirm CLI command names in your Activepieces version.*

1. Clone [activepieces/activepieces](https://github.com/activepieces/activepieces).
2. Copy this piece into the Activepieces tree:

   ```text
   packages/pieces/custom/planning-center/
   ```

   Adjust `package.json` dependencies from npm versions to `workspace:*` if required by your Activepieces version.

3. Register the piece in the root `tsconfig.base.json` `compilerOptions.paths` (alphabetically).

4. Build and pack:

   ```bash
   npm run build-piece planning-center
   ```

   Or non-interactively:

   ```bash
   npm run build-piece -- planning-center
   ```

5. Note the output path — typically under `packages/pieces/custom/planning-center/dist/` as a `.tgz` archive.

## Step 3: Upload to your instance

*Uncertain — confirm this matches your Activepieces edition (Enterprise private pieces vs. community self-host).*

1. Sign in as a platform admin.
2. Navigate to **Platform Admin → Pieces** (or **Settings → Pieces**).
3. Upload the `.tgz` file produced in Step 2.
4. Refresh the flow builder; **Planning Center** should appear in the piece catalog.

Alternative: use the publish CLI against your API:

```bash
npm run publish-piece-to-api
```

You will need an API key from **Settings** in the admin interface and your instance API URL (for example `https://activepieces.example.com/api`).

## Step 4: Create a connection

1. In the flow builder, add a **Planning Center** step.
2. Create a new connection with your Personal Access Token **Application ID** and **Secret**.
3. Test an action such as **Search People**.

## Docker / Compose deployments

*Uncertain — verify for your deployment method.*

Custom pieces are usually **not** baked into the Docker image by default. You upload them through the admin UI or publish API after the instance is running. If you maintain a private fork of Activepieces with pieces vendored in `packages/pieces/custom/`, you may rebuild the image from that fork instead.

## Environment variables

No server-side environment variables are required for this piece. Credentials are stored per-connection in Activepieces. For local-only testing, see `.env.example` in the monorepo root.

## Troubleshooting

| Symptom | Things to check |
|---------|-----------------|
| Piece not visible after upload | Confirm `.tgz` built without errors; refresh browser; check server logs |
| Auth validation fails | Token scopes include the product you are calling (People, Services, Calendar) |
| `403 Forbidden` from Planning Center | Ensure a descriptive `User-Agent` is sent (handled by the piece client) |
| Build fails in Activepieces fork | `tsconfig.base.json` path entry missing or wrong package name |