# Roadmap

**Last Updated**: March 13, 2026

## Execution Order

| Milestone | Name | Status |
|-----------|------|--------|
| M1 | MCP Server Foundation | COMPLETE |
| M1.1 | Full server — tools, resources, transports, ngrok, setup, CLI, README | COMPLETE |
| M1.2 | Setup deployment guidance + systemd/launchd production fixes | COMPLETE |
| M2 | Device cache, bulk query tools, retry logic | COMPLETE |
| M3 | Event streaming (webhooks, EventSocket) | PLANNED |

## Notes

- M1 covers the full plug-and-play MCP server with remote access via ngrok
- M2/M3 are enhancement milestones — M1 delivers a fully functional server
- Maker API is the integration boundary — rule creation, diagnostics, app management are NOT available via Maker API
- See `docs/prds/M1-mcp-review.md` for full PRD and architecture
