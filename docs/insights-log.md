# Insights Log

Technical insights discovered during implementation. Non-obvious observations worth remembering.

| Date | Milestone | Topic | Insight | Verification | Status |
|------|-----------|-------|---------|--------------|--------|
| 2026-03-12 | M1 | Maker API ceiling | Maker API cannot create/modify rules, manage apps/drivers, access diagnostics, or create virtual devices. Only kingpanther13's on-hub Groovy app bypasses this by using internal Hubitat APIs. Our TypeScript server is scoped to what Maker API exposes. | Confirmed via Hubitat docs and community implementations | CONFIRMED |
| 2026-03-12 | M1 | MCP transport for mobile | Claude Code mobile and Claude.ai can ONLY connect to MCP servers via HTTP transport. Stdio (subprocess) only works for local CLI/Desktop. Dual transport (stdio + Streamable HTTP) is required to support "Claude anywhere." | Confirmed via MCP spec and Claude Code docs | CONFIRMED |
| 2026-03-12 | M1 | ngrok Node.js SDK | `@ngrok/ngrok` npm package embeds the tunnel binary directly in the Node.js process. No separate CLI install needed. This enables single-process deployment (MCP server + tunnel) with one systemd service. | Confirmed via ngrok docs | CONFIRMED |
| 2026-03-12 | M1 | Community landscape | 9 community Hubitat MCP repos exist, none official. Most are Python (4), only 2 TypeScript/JS. Max 4 stars. Fragmented, no clear winner. kingpanther13 (Groovy, 69 tools) is most capable but runs on hub and is "99% AI-generated." | GitHub search | CONFIRMED |
| 2026-03-12 | M1 | EventSocket local-only | Hubitat's EventSocket (WebSocket for real-time events) is only accessible on the local network. For remote deployments, webhooks are the only real-time option. | Hubitat docs | CONFIRMED |
