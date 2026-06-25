# activepieces-custom-pieces

A reusable monorepo for **self-hosted Activepieces custom Pieces** — church, media, and IT integrations.

## Purpose

This repository collects custom [Activepieces](https://www.activepieces.com/) Pieces maintained outside the upstream community catalog. Pieces here target self-hosted deployments where you need integrations for tools common in church production and IT workflows.

## Current Pieces

| Piece | Package | Description |
|-------|---------|-------------|
| [Planning Center](pieces/planning-center/) | `@activepieces-custom/piece-planning-center` | People, Services, Calendar, and custom API access |

## Roadmap

Future pieces planned for this monorepo:

- `scriptdash`, `unifi`, `sermonshots`, `bitfocus-companion`, `propresenter`, `aja-kumo`, `blackmagic-atem`, `vimeo-church-workflows`

See [docs/roadmap.md](docs/roadmap.md) for details.

## Repository structure

```text
activepieces-custom-pieces/
├── pieces/           # One directory per Piece
├── examples/         # Sample inputs/outputs per action
├── docs/             # Development and install guides
└── package.json      # npm workspaces root
```

## Quick start

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
# or
npm run build:planning-center
```

### Develop locally

See [docs/local-development.md](docs/local-development.md) for:

- Type-checking and builds
- Testing inside an Activepieces fork (`AP_DEV_PIECES`)
- Adding new pieces

### Install on self-hosted Activepieces

See [docs/self-hosted-install.md](docs/self-hosted-install.md) for building a `.tgz` bundle and uploading via Platform Admin.

> **Note:** Final packaging uses the Activepieces CLI inside an Activepieces checkout. Verify steps against [current self-hosted docs](https://www.activepieces.com/docs/build-pieces/misc/build-piece).

## Building a new Piece

1. Copy the structure from `pieces/planning-center/`.
2. Implement `src/index.ts` with `createPiece()`.
3. Add `auth.ts`, `common/client.ts`, and one file per action under `src/actions/`.
4. Add examples under `examples/<piece-name>/`.
5. Document in `pieces/<piece-name>/README.md` and update `docs/roadmap.md`.

Follow [Activepieces piece conventions](https://www.activepieces.com/docs/build-pieces/building-pieces/piece-definition):

- TypeScript, strict mode
- `createAction` / `createPiece` from `@activepieces/pieces-framework`
- `httpClient` from `@activepieces/pieces-common`
- `audience` and `aiMetadata` on actions
- Never log secrets; return helpful errors

## Local testing credentials

Copy `.env.example` to `.env` for standalone smoke tests. **Do not commit credentials.**

## License

Add a license before public distribution if needed. Pieces in this repo are intended for private/self-hosted use unless otherwise noted.