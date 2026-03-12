# Development Journal

Narrative session entries capturing decisions, learning, and AI tooling observations.

---

### Session 1 — March 12, 2026 — Project Bootstrap

**What happened**: Scaffolded the Hubitat MCP project with the development framework adapted from forager. Set up git repo, CLAUDE.md, 9 skills, and 7 core documentation files.

**Key decisions**:
- TypeScript with `@modelcontextprotocol/sdk` for the MCP server
- Adapted forager's M#.#.# milestone system and 7-doc pattern as the development framework
- Kept skills generic and project-agnostic where possible

**Learning**:
- The forager development framework is portable — the core workflow (skills + docs + conventions) transfers cleanly to a different tech stack

**AI tooling observations**: Framework scaffolded entirely by Claude Code from the forager project, adapted for TypeScript/MCP context.

**What's next**: Define M1 scope, set up package.json/tsconfig, connect to Hubitat Maker API.

---

### Session 2 — March 12, 2026 — M1 PRD & Architecture Review

**What happened**: Created GitHub repo (`rfhayn/hubitat-mcp-server`, private). Researched the entire Hubitat MCP landscape — reviewed all 9 community implementations, the Hubitat Maker API documentation, MCP transport spec, and hosting options. Produced a comprehensive PRD at `docs/prds/M1-mcp-review.md`.

**Key decisions**:
- **Build vs Buy**: Building custom TypeScript MCP server rather than using kingpanther13's Groovy on-hub implementation (69 tools but vibe-coded, runs on constrained hub hardware)
- **Maker API scope**: Device control + modes + HSM + variables. Rule creation is NOT available via Maker API — accepted this limitation
- **Remote access**: ngrok with `@ngrok/ngrok` SDK embedded in the Node.js process. Free stable subdomain, no domain purchase needed. Chose over Cloudflare Tunnel (requires domain) and Tailscale (private network doesn't work with Claude.ai/mobile)
- **Plug-and-play philosophy**: npx support, interactive setup script, auto-generated Claude config, device aliasing, health endpoint, Docker support. Goal: `git clone` + `./setup.sh` and done
- **Dual transport**: Stdio for local Claude Code CLI + Streamable HTTP for mobile/web/desktop remote access

**Learning**:
- The Maker API is a hard ceiling for external servers. Internal Hubitat APIs (accessible only via Groovy on the hub) unlock rule creation, diagnostics, app management — but at the cost of portability and reliability
- MCP transport choice is the critical architecture decision for "Claude anywhere" — stdio is simple but local-only; Streamable HTTP enables all clients but needs hosting + tunnel
- ngrok's Node.js SDK eliminates the biggest deployment friction — no separate daemon, no CLI install, single process handles everything

**AI tooling observations**: Used 3 parallel Explore agents to research Maker API docs, community repos, and hosting/transport options simultaneously. Effective for broad research — each agent returned comprehensive findings in ~30-60 seconds.

**What's next**: Start M1.1 — project setup (package.json, tsconfig, MCP SDK, CLI entry point).
