# Custom pieces changelog

Track **builds and changes here** alongside `package.json` version bumps.
See `VERSION_POLICY.md` — bump version when code changes, then rebuild (DB sync runs automatically).

## 2026-07-01

### sermonshots (pinned)
- Saved API spec: `sermonshots/swagger.yaml`.
- All endpoints validated — no changes required.

### planning-center-calendar (pinned)
- Saved OpenAPI spec: `planning-center-calendar/open_api_2026-06-22.json`.
- **List Reservations** fixed: `/reservations` → `/resource_bookings`.

### OpenAPI reference specs saved
- `planning-center-groups/open_api_2023-07-10.json`
- `planning-center-people/open_api_2026-06-04.json`
- `planning-center-publishing/open_api_2024-03-25.json`
- `planning-center-registrations/open_api_2025-05-01.json`

### planning-center-groups (pinned)
- All endpoints validated against OpenAPI — no changes required.

### planning-center-people (pinned)
- All endpoints validated against OpenAPI — no changes required.

### planning-center-publishing (pinned 0.0.9)
- **List Speakerships** now requires Episode and uses `/episodes/{id}/speakerships`.
- **Get Organization** removed (no `/organization` in Publishing API).

### vimeo-custom (pinned 0.2.4)
- Saved Vimeo OpenAPI spec: `vimeo-custom/openapi_3.4.json`.
- **Folder dropdown** fixed: `/me/folders` → `/me/projects` (folders are projects in API v3.4).
- Languages dropdown now passes `filter=texttracks` as a query param.

### planning-center-registrations (pinned)
- Replaced legacy `/events`, `/forms`, `/answers` paths with Registrations API signups model.
- **List Signups** (`/signups`), **List Selection Types**, **List Signup Times**, **List Signup Registrations**.
- **Breaking:** `list_form_fields` → `list_signup_times`; `list_registration_answers` → `list_signup_registrations`.

### planning-center-services (pinned 0.0.7)
- Saved Services OpenAPI spec: `planning-center-services/open_api_2018-11-01.json`.
- Fixed invalid endpoints against OpenAPI: `team_positions`, `teams/people`, `people/schedules`, `plans/team_members`, `people/blockouts`, `people/scheduling_preferences`.
- Person dropdown now uses Services API `/services/v2/people` with `where[name_like]`.
- **Breaking:** `list_schedule_exceptions` removed → use `list_scheduling_preferences` (no team-level schedule_exceptions in API).

## 2026-06-29

### bitfocus-companion (pinned 0.0.1)
- Replaced separate Press/Release actions with **Trigger Button** (dropdown: Press, Release, Press & Release).
- Added **List Buttons on Page** and **List Active Pages** via Satellite API (button labels; page numbers only — page names not exposed by Companion HTTP API).
- Connection auth adds optional **Satellite Port** (default 16622).

### All Planning Center pieces
- Custom API call pagination now preserves JSON:API `included` resources (e.g. `?include=emails`).

### planning-center-publishing (pinned 0.0.9)
- Added **Update Episode** action (PATCH title, description, video URLs, stream type, series).

### vimeo-custom (pinned 0.2.4)
- Renamed folder `vimeo` → `vimeo-custom` (fixes dev-piece loading / OAuth validate).
- Replaced video dropdown with **Video ID** text field on download/update/delete/folder/showcase actions.
- Embedded logo as base64 data URI (no R2 CORS).

### All Planning Center + sermonshots pieces
- Embedded logos as base64 data URIs (replaced `b1-storage.bhm.li` URLs).

### Infrastructure
- `AP_DEV_PIECES` hardcoded in docker-compose; `.env` updated to include `vimeo-custom`.
- Version policy: stop routine `package.json` bumps; log here instead.
- Ran `scripts/reset-flow-piece-versions.cjs` — **34 flow versions** updated to pinned package.json versions.

## Earlier history (package versions at time of change)

| Piece | Pinned version |
|---|---|
| planning-center-services | 0.0.7 |
| planning-center-people | 0.0.6 |
| planning-center-groups | 0.0.6 |
| planning-center-calendar | 0.0.6 |
| planning-center-registrations | 0.0.6 |
| planning-center-publishing | 0.0.9 |
| sermonshots | 0.0.3 |
| bitfocus-companion | 0.0.1 |
| vimeo-custom | 0.2.4 |
## 2026-07-03

- PC webhook triggers: 19 triggers across People/Services/Publishing/Groups/Calendar via planning-center-common
