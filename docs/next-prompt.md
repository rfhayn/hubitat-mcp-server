# Next Implementation Prompt

**Last Updated**: March 13, 2026
**Status**: Production-deployed on Raspberry Pi. All milestones complete.

---

## Where We Left Off

Server is running on Raspberry Pi with systemd auto-start, ngrok tunnel, and 150 devices. Accessible from Claude Code CLI, Claude.ai, and Claude mobile. Repo is public.

## Production Notes

- **Pi service**: `sudo systemctl status hubitat-mcp`
- **Logs**: `sudo journalctl -u hubitat-mcp -f`
- **Health**: `curl http://localhost:3000/health` (from Pi) or `curl https://unloveable-nonspiritedly-fairy.ngrok-free.dev/health`
- **Auth**: No Bearer token (Claude.ai/mobile connectors don't support auth headers)
- **Re-run setup**: `cd ~/hubitat-mcp-server && git pull && bash setup.sh` (idempotent)

## If Picking Up New Work

Potential future milestones (none currently prioritized):

- **M3: Event streaming** — webhooks or EventSocket for real-time device events. Deprioritized: current polling is sufficient, and event storage adds complexity without clear consumer
- **OAuth for MCP auth** — Claude.ai/mobile support OAuth but not custom headers. Would add proper auth for the ngrok endpoint
- **npm publish / npx support** — `npx hubitat-mcp-server setup` for zero-clone install. Requirement still open in requirements.md
