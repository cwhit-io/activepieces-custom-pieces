# Planning Center Piece

Activepieces integration for [Planning Center](https://www.planningcenter.com/) — People, Services, Calendar, and related APIs.

## Authentication

This piece uses **Personal Access Token** authentication via HTTP Basic Auth:

| Field | Planning Center term | Description |
|-------|---------------------|-------------|
| Application ID | `client_id` | Shown when you create a Personal Access Token |
| Secret | `secret` | Shown once at token creation |

Credentials are stored by Activepieces per connection. They are never hardcoded in this repository.

### Create a Personal Access Token

1. Sign in to [Planning Center](https://accounts.planningcenteronline.com).
2. Open [Personal Access Tokens](https://api.planningcenteronline.com/personal_access_tokens).
3. Click **New Personal Access Token**.
4. Select the scopes you need:
   - **People** — search and get person records
   - **Services** — list and get service plans
   - **Calendar** — list calendar events
5. Copy the **Application ID** and **Secret** immediately — the secret is only shown once.
6. In Activepieces, create a **Planning Center** connection and paste both values.

> Personal Access Tokens are for single-organization scripts and integrations. For multi-church products, use OAuth 2.0 (planned — see roadmap).

## Supported actions

| Action | Description |
|--------|-------------|
| **Search People** | Search by name or email |
| **Get Person** | Fetch one person by ID, optionally with emails and phone numbers |
| **List Service Plans** | List plans for a service type with optional filter |
| **Get Service Plan** | Fetch one plan, optionally with plan items |
| **List Calendar Events** | List events in an optional date range |
| **Custom API Call** | Call allowed endpoints under `/people/`, `/services/`, `/calendar/`, etc. |

## Example inputs

### Search People

```json
{
  "query": "jane@examplechurch.org",
  "per_page": 25
}
```

### Get Person

```json
{
  "personId": "12345",
  "includeEmails": true,
  "includePhoneNumbers": false
}
```

### List Service Plans

```json
{
  "serviceTypeId": "98765",
  "filter": "future",
  "per_page": 10
}
```

### List Calendar Events

```json
{
  "startsAfter": "2026-06-01T00:00:00Z",
  "startsBefore": "2026-07-01T00:00:00Z",
  "per_page": 25
}
```

See `examples/planning-center/` in the monorepo root for full input/output examples.

## Known limitations

- **Personal Access Token only** — OAuth for multi-organization apps is not implemented yet.
- **No triggers** — polling and webhook triggers are planned.
- **Manual IDs** — service type ID, plan ID, and person ID must be entered manually (dynamic dropdowns planned).
- **Limited pagination** — actions return one page of results; automatic pagination is not implemented.
- **Read-focused** — no destructive or write actions in v0.1.0 (Custom API Call can POST/PATCH/DELETE on allowed paths — use with care).
- **User-Agent required** — Planning Center may return `403` without a descriptive User-Agent; the piece sets one automatically.
- **Token scopes** — each action requires the corresponding Planning Center product scope on your token.