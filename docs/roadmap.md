# Roadmap

## Current Pieces

| Piece | Status | Notes |
|-------|--------|-------|
| `planning-center` | v0.1.0 — initial actions | Personal Access Token auth; no triggers yet |

## Planned Pieces

| Piece | Domain | Priority ideas |
|-------|--------|----------------|
| `scriptdash` | Pharmacy / healthcare workflows | Patient lookup, prescription status |
| `unifi` | Network infrastructure | Client events, device status, WLAN management |
| `sermonshots` | Sermon media | Clip generation, project status |
| `bitfocus-companion` | Broadcast control | Button presses, surface events, custom variables |
| `propresenter` | Presentation / worship media | Slide triggers, playlist control, stage display |
| `aja-kumo` | Video routing | Source/destination routing, status |
| `blackmagic-atem` | Live production switcher | Input/program control, macros |
| `vimeo-church-workflows` | Video hosting | Upload status, privacy, embed workflows |

## Planning Center — next steps

- OAuth 2.0 auth for multi-organization integrations
- Polling triggers (new calendar events, plan updates)
- Webhook triggers where supported
- Dynamic dropdowns for service types, people, and event instances
- Automatic pagination helpers for large result sets
- Groups, Registrations, Giving, and Check-Ins first-class actions

## Cross-cutting improvements

- CI workflow to build and lint all pieces on push
- Shared testing utilities for local action smoke tests
- Piece publishing scripts for self-hosted Activepieces
- Versioning and changelog conventions per piece