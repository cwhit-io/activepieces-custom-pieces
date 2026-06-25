# Local Development

This monorepo builds custom Activepieces Pieces outside the main Activepieces repository. You can develop here and then install the built artifact into a self-hosted instance.

## Prerequisites

- Node.js 20+
- npm 10+
- A Planning Center Personal Access Token (for testing the `planning-center` piece)

## Install dependencies

From the repository root:

```bash
cd activepieces-custom-pieces
npm install
```

## Build a piece

Build all pieces:

```bash
npm run build
```

Build only Planning Center:

```bash
npm run build:planning-center
```

Compiled output is written to `pieces/planning-center/dist/`.

## Type-check without emitting

```bash
npm run lint
```

## Local credentials (testing only)

Copy `.env.example` to `.env` and fill in your Planning Center Application ID and Secret. **Never commit `.env`.**

These values are used only when running standalone scripts or tests that read `process.env`. Activepieces connections store credentials separately when you test inside the platform.

## Testing inside Activepieces

There are two common approaches. **Verify against current Activepieces self-hosted docs** — installation paths change between releases.

### Option A: Copy into an Activepieces fork

1. Clone the [Activepieces repository](https://github.com/activepieces/activepieces).
2. Copy `pieces/planning-center/` into `packages/pieces/custom/planning-center/` (or `packages/pieces/community/` if you prefer).
3. Register the piece in the root `tsconfig.base.json` paths (alphabetically):

   ```json
   "@activepieces/piece-planning-center": ["packages/pieces/custom/planning-center/src/index.ts"]
   ```

4. Add `planning-center` to `AP_DEV_PIECES` in `packages/server/api/.env`.
5. Run `npm install` (or `bun install`) in the Activepieces repo, then start the dev server.
6. Open the flow builder and add a **Planning Center** connection using your Personal Access Token.

### Option B: Build and upload a tarball

1. Copy or symlink this piece into an Activepieces checkout under `packages/pieces/custom/planning-center`.
2. From the Activepieces repo root, run:

   ```bash
   npm run build-piece planning-center
   ```

3. Upload the generated `.tgz` from Platform Admin → Pieces (Enterprise / self-hosted feature — verify availability on your edition).

## Adding a new piece

1. Create `pieces/<piece-name>/` with `package.json`, `tsconfig.json`, and `src/index.ts`.
2. Add the workspace to the root `package.json` `workspaces` array (already uses `pieces/*`).
3. Follow the structure used by `planning-center` (`auth.ts`, `common/`, `actions/`, `triggers/`).
4. Document the piece in `pieces/<piece-name>/README.md` and add examples under `examples/<piece-name>/`.
5. Update `docs/roadmap.md`.