# Activepieces Custom Pieces

A monorepo of custom **Activepieces** integrations — church, media, and IT tools for self-hosted deployments.

## Pieces

| Piece | Package | Description |
|-------|---------|-------------|
| [Planning Center Calendar](./planning-center-calendar) | `planning-center-calendar` | List events, instances, resource bookings, and reservations |
| [Planning Center Groups](./planning-center-groups) | `planning-center-groups` | List groups, events, memberships, and attendance |
| [Planning Center People](./planning-center-people) | `planning-center-people` | Search people, lists, field data, addresses, emails, phone numbers |
| [Planning Center Publishing](./planning-center-publishing) | `planning-center-publishing` | Channels, episodes, series, speakers, and speakerships |
| [Planning Center Registrations](./planning-center-registrations) | `planning-center-registrations` | Attendees, event forms, and registration data |
| [Planning Center Services](./planning-center-services) | `planning-center-services` | Service plans, arrangements, and media |
| [SermonShots](./sermonshots) | `sermonshots` | Sermon media management |

## Getting Started

Each piece is an independent Activeplaces package. To use a piece in your self-hosted Activeplaces instance:

1. Build the piece: `cd <piece-folder> && npx ts-node src/index.ts`
2. Publish or copy the built artifact to your Activeplaces custom pieces directory
3. Enable the piece in your Activeplaces platform settings

## Development

```bash
# Navigate to a piece
cd planning-center-people

# Install dependencies
npm install

# Build
npm run build
```

## Requirements

- Node.js 18+
- Activeplaces self-hosted instance (v0.x or later)
- API credentials for the respective services (Planning Center API key, etc.)

## License

MIT
