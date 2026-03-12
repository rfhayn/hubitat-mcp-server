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

---

### Session 3 — March 12, 2026 — M1.1 Testing & First Run

**What happened**: Walked through the full testing flow step-by-step against a real Hubitat hub (192.168.50.188, 150 devices). Validated and corrected setup instructions at each step. Fixed multiple bugs discovered during testing. Successfully tested stdio (Claude Code CLI), HTTP (localhost), and ngrok remote access (Claude.ai + mobile).

**Key decisions**:
- Added `--stdio`/`--http` CLI flags to override `MCP_TRANSPORT` env var — needed because `.env` defaults to `http` but Claude Code launches as stdio
- Changed Streamable HTTP to stateless per-request pattern (new server+transport per request) per MCP SDK examples — original single-server approach caused "Already connected" crash on second request
- Removed inline comments from `.env` and `.env.example` — they break `source .env` in bash scripts

**Bugs fixed**:
1. `.env` inline comments broke shell sourcing (Node dotenv handled them fine, but shell scripts didn't)
2. No CLI transport override — stdio MCP failed when `.env` set `MCP_TRANSPORT=http`
3. HTTP transport crashed on second request — was reusing single server instance instead of creating per-request
4. ngrok authtoken instructions pointed to wrong dashboard page ("Authtokens" under Universal Gateway shows `cr_` credential ID, not the tunnel authtoken)

**Learning**:
- MCP SDK's `Server.connect()` binds to exactly one transport — for stateless HTTP you must create a fresh server+transport per request and clean up on `res.close`
- ngrok dashboard has two confusingly-named token pages: "Authtokens" (credential IDs) vs "Your Authtoken" (tunnel token)
- Asking "what doors are open?" generated 15 individual `get_device` calls — bulk query by capability is an M2 optimization
- Claude.ai custom connectors support authless MCP servers — no OAuth required

**AI tooling observations**: Step-by-step user walkthrough is an effective way to validate both code AND documentation simultaneously. Every step surfaced at least one correction to the instructions.

**What's next**: Merge PR #1, mark M1.1 COMPLETE, begin M1.2 (Hubitat Maker API typed client).
