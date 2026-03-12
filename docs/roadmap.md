# Roadmap

**Last Updated**: March 12, 2026

## Execution Order

| Milestone | Name | Status |
|-----------|------|--------|
| M1 | MCP Server Foundation | ACTIVE |
| M1.1 | Project setup (package.json, tsconfig, MCP SDK, CLI) | READY |
| M1.2 | Hubitat Maker API client (typed HTTP client) | PLANNED |
| M1.3 | MCP tools (devices, modes, HSM, variables) | PLANNED |
| M1.4 | MCP resources (devices, status, home context) | PLANNED |
| M1.5 | Dual transport (stdio + HTTP) + ngrok integration | PLANNED |
| M1.6 | Auth layer + health endpoint | PLANNED |
| M1.7 | Device aliasing + auto-generated context | PLANNED |
| M1.8 | Setup script (interactive setup, Claude config output) | PLANNED |
| M1.9 | Deployment (systemd, launchd, Docker) | PLANNED |
| M1.10 | npm publish + npx support | PLANNED |
| M1.11 | README with Hubitat Maker API setup guide | PLANNED |
| M2 | Enhanced features (retry, caching, batch) | PLANNED |
| M3 | Event streaming (webhooks, EventSocket) | PLANNED |

## Notes

- M1 covers the full plug-and-play MCP server with remote access via ngrok
- M2/M3 are enhancement milestones — M1 delivers a fully functional server
- Maker API is the integration boundary — rule creation, diagnostics, app management are NOT available via Maker API
- See `docs/prds/M1-mcp-review.md` for full PRD and architecture
