# Activepieces Custom Pieces

Custom **Activepieces** integrations for church, media, and IT workflows — built for self-hosted deployments.

## Pieces

| Piece | Folder | Description |
|-------|--------|-------------|
| Planning Center People | `planning-center-people` | Profiles, lists, forms, workflows — **8 webhook triggers** |
| Planning Center Services | `planning-center-services` | Plans, teams, scheduling — **Plan Updated** webhook |
| Planning Center Publishing | `planning-center-publishing` | Channels, episodes, series — **Episode Created/Updated** webhooks |
| Planning Center Groups | `planning-center-groups` | Memberships, applications — **5 webhook triggers** |
| Planning Center Calendar | `planning-center-calendar` | Events, resources — **3 event-request webhooks** |
| Planning Center Registrations | `planning-center-registrations` | Attendees and registration data (read-only) |
| Vimeo Enhanced | `vimeo-custom` | Uploads, folders, captions, webhooks (polling triggers) |
| SermonShots | `sermonshots` | Sermon media and related content |
| Bitfocus Companion | `bitfocus-companion` | Companion satellite button control |

Shared webhook engine: `planning-center-common` (used by all Planning Center pieces).

## Build (from Activepieces monorepo root)

```bash
./docker/build-custom-pieces.sh
docker compose build app && docker compose up -d app worker
```

See [VERSION_POLICY.md](./VERSION_POLICY.md) for versioning rules. Webhook docs: [PCO_WEBHOOK_PLAN.md](./PCO_WEBHOOK_PLAN.md), [PCO_WEBHOOKS_REF.md](./PCO_WEBHOOKS_REF.md).

## Requirements

- Node.js 18+
- Self-hosted Activepieces instance
- Planning Center Personal Access Token (webhook triggers need subscription permission)

## License

MIT
