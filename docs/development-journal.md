# Development Journal

Narrative session entries capturing decisions, learning, and AI tooling observations.

---

### Session 5 — March 12, 2026 — First Raspberry Pi Production Install

**What happened**: Ran the full setup.sh on a Raspberry Pi as a first-time user, hitting every rough edge along the way. Fixed git not being listed as a prerequisite, color codes not rendering on Linux, a 401 auth failure from pasting tokens silently, the setup telling users to run `npm start` when systemd was already running, and the auth token blocking Claude.ai/mobile (which don't support custom headers). Ended with a successful end-to-end test: Claude on the phone controlling the smart home via the Pi.

**Key decisions**:
- Split README Quick Start into separate macOS and Linux blocks — a single code block with comments for both platforms confused real users on a Pi
- Added connection retry loop with re-prompting — when credentials fail, loop back and ask for all three inputs again instead of just "continue anyway?"
- Added "(input hidden)" hint to silent `read -rs` prompts — users thought paste was broken when no characters appeared
- Used `systemctl restart` instead of `start` for idempotent re-runs
- Cleared `MCP_AUTH_TOKEN` on Pi — Claude.ai/mobile connectors don't support auth headers, so the Mac had been running without one all along. The ngrok URL's obscurity provides basic security

**Learning**:
- `echo` without `-e` prints raw escape codes on some systems — the deployment guidance section used `echo` with color variables but needed `echo -e` (other sections worked because they used helper functions that already had `-e`)
- Claude.ai and Claude mobile connectors do NOT support custom auth headers — only bare URLs or OAuth. This means any MCP server accessed from mobile must either be authless or use OAuth
- README Quick Start must be copy-pasteable per platform — mixing `brew` and `apt` in one block with comments doesn't work for real users
- `sudo apt install nodejs` on Raspberry Pi OS gives Node.js 12-18 depending on OS version — must use NodeSource (`nodesource.com/setup_22.x`) to get Node 22
- The best way to find setup UX bugs is to be the user on a fresh machine. Every step surfaced at least one issue

**AI tooling observations**: This session was entirely driven by real-time user feedback from the Pi install. Claude Code on the Mac acted as a rapid-response fix pipeline — user reports issue on Pi, fix is committed and pushed within 60 seconds, user does `git pull` and retries. This tight loop (report → fix → push → pull → retry) was extremely effective for polishing a setup script.

**What's next**: Consider OAuth support for Claude.ai/mobile auth. Monitor Pi stability over the next few days. Decide whether M3 (event streaming) is worth pursuing or if the project is feature-complete.

---

### Session 4 — March 12, 2026 — M1.2 & M2 Production Hardening

**What happened**: Added deployment guidance to setup.sh, fixed two critical production blockers (systemd env loading, missing logs directory), and iterated on UX. Started with a two-option menu for deployment host selection, then simplified to a question-based flow after user feedback. Audited the full project for Raspberry Pi fresh-install readiness.

**Key decisions**:
- Replaced two-option deployment menu with contextual questions — simpler UX that guides macOS users toward always-on devices without forcing everyone through a branching flow
- Added `EnvironmentFile=-` directive to systemd service template — without this, the Pi service starts with no env vars and crashes immediately (dotenv in Node.js can't reliably load .env under systemd)
- Added `mkdir -p logs` to setup.sh — macOS launchd template references log paths that don't exist on a fresh clone

**Learning**:
- Systemd services don't inherit shell environment or source .env files — `EnvironmentFile=` is the correct mechanism. The `-` prefix makes it non-fatal if missing
- The two-option "choose your adventure" pattern in CLI tools is often worse than progressive disclosure through targeted questions — users don't want to read all options upfront
- Production readiness auditing from a "fresh clone" perspective catches issues that incremental development misses (like the systemd env loading gap)

**AI tooling observations**: Used an Explore agent to audit the full project for Pi-readiness — it systematically checked systemd templates, entry points, dependencies, and .gitignore in one pass. Caught both critical blockers that would have been silent failures on first Pi install.

**What's next**: Push to main, SSH into the Pi, and do a real end-to-end production install test.

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
