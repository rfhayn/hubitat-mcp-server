# M1 — MCP Review: PRD & Implementation Plan

**Context:** Build a TypeScript MCP server for Hubitat Elevation that can be used from Claude Code (mobile + desktop), Claude.ai, and Claude Desktop — requiring remote HTTP transport, not just local stdio.

---

## Landscape Analysis

### No Official Hubitat MCP Server Exists
All 9 repos on GitHub are community-built. Hubitat's only public repo is `HubitatPublic` (Groovy drivers/apps).

### Community Implementations Reviewed

| Repo | Lang | Tools | Standout Feature | Key Gap |
|------|------|-------|-----------------|---------|
| **kingpanther13** | Groovy | 69 | Runs ON hub, cloud OAuth, rule creation, safety gates | Groovy-only, runs on hub firmware |
| **MvdMunnik26** | TypeScript | 10 | Retry logic, variables, modes, HSM | Local stdio only, no rules |
| **abeardmore** | Python | ~4 | Cloud endpoint support | Minimal tools |
| **marchese29 (rules)** | Python | 7 | Webhook streaming, SQLite audit, AI analysis | Rules only, no device control |
| **marchese29 (auto)** | Python | 2 | 101 capability types, parallel commands | Only 2 tools |
| **neerpatel** | TypeScript | 5 | Acknowledges API gaps, guidance-focused | Can't create rules (API limitation) |
| **coatsnmore** | Python | 6 | FastMCP, Docker | Basic functionality |
| **alexj212** | Go | 6 | SSE transport, systemd | Basic functionality |

### Key Insight: kingpanther13 vs External Server
The Groovy implementation runs ON the hub and can access internal APIs that the Maker API cannot (rule creation, app/driver management, diagnostics). An external TypeScript server using the Maker API will be limited to what Maker API exposes — but gains portability, better tooling, and modern dev practices.

---

## Hubitat Maker API — Full Capability Map

### Available Endpoints
| Category | Endpoints | Notes |
|----------|-----------|-------|
| **Devices** | `GET /devices`, `GET /devices/all`, `GET /devices/[id]` | List, detail, full detail |
| **Device Commands** | `GET /devices/[id]/[command]/[value]` | on, off, setLevel, lock, etc. |
| **Device Events** | `GET /device/[id]/events` | Recent event history |
| **Device Info** | `GET /device/[id]/commands`, `GET /device/[id]/capabilities` | Available commands & capabilities |
| **Modes** | `GET /modes`, `GET /mode`, `GET /mode/[id]` | List, current, change |
| **HSM** | `GET /hsm`, `GET /hsm/[command]` | Status + arm/disarm/cancel |
| **Variables** | `GET /hubvariables/[name]`, `GET /hubvariables/[name]/[value]` | Get/set hub variables |

### NOT Available via Maker API
- Rule creation/modification/deletion
- App/driver installation or management
- Hub diagnostics (Z-Wave/Zigbee repair, network stats)
- Virtual device creation
- File management
- Log access (hub logs, device history)
- Room management

### Real-Time Events
- **Webhooks**: HTTP POST on device state change (configurable URL)
- **EventSocket**: WebSocket at `/eventsocket` — **local network only**

### Authentication
- Access token as query parameter: `?access_token=TOKEN`
- App ID in URL path: `/apps/api/[APP_ID]/...`
- Cloud access available via Hubitat cloud URL

---

## Hosting & Transport Architecture

### The Core Problem
Claude Code mobile + Claude.ai can ONLY connect to MCP servers via **HTTP transport**. Stdio (subprocess) only works when Claude Code desktop/CLI launches the server locally.

### Transport Decision: Dual Transport (Stdio + Streamable HTTP)

```
┌─────────────────────────────────────────────────────────┐
│                  Hubitat MCP Server                      │
│                  (Node.js / TypeScript)                   │
│                                                          │
│  ┌──────────┐    ┌───────────────────┐                  │
│  │  Stdio   │    │  Streamable HTTP  │                  │
│  │Transport │    │    Transport      │                  │
│  └────┬─────┘    └────────┬──────────┘                  │
│       │                   │                              │
│       └───────┬───────────┘                              │
│               ▼                                          │
│     ┌──────────────────┐                                │
│     │   MCP Server Core │                                │
│     │  (tools/resources) │                                │
│     └────────┬───────────┘                               │
│              ▼                                           │
│     ┌──────────────────┐                                │
│     │ Hubitat API Client│                                │
│     │  (Maker API REST) │                                │
│     └──────────────────┘                                │
└─────────────────────────────────────────────────────────┘
         │
         ▼ HTTP REST
┌──────────────────┐
│  Hubitat Hub     │
│  (Maker API)     │
└──────────────────┘
```

### Deployment Targets

**macOS (Development + Personal Use)**
- Run locally via `npm run dev` (stdio for Claude Code CLI)
- Or run HTTP server for mobile/web access

**Raspberry Pi (Production — alongside Homebridge)**
- Homebridge Raspbian image is Raspbian Lite with Node.js pre-installed
- Run as systemd service alongside Homebridge
- Use ngrok or Cloudflare Tunnel for HTTPS remote access
- Same codebase, same `npm run build && node dist/index.js`
- Resource usage: ~30-50 MB RAM, near-zero CPU — easily runs alongside Homebridge

### Remote Access Options (for Claude mobile/web)

| Option | Complexity | Cost | Domain Needed | Claude.ai/Mobile |
|--------|-----------|------|---------------|-----------------|
| **ngrok** | Low | Free | No — stable `you.ngrok-free.app` URL | Works |
| **Cloudflare Tunnel** | Medium | Free + ~$10/yr domain | Yes | Works |
| **Tailscale/ZeroTier** | Low | Free | No | Likely doesn't work (private network) |
| **Reverse proxy + DDNS** | Medium | Free + domain | Yes | Works |

**Recommendation:** ngrok — free, stable URL, no domain purchase needed, works with all Claude clients (mobile, web, desktop, CLI). Simple setup: `brew install ngrok` on Mac, `snap install ngrok` on Pi.

---

## Proposed Feature Set — hubitat-mcp-server

### Tier 1: Core (MVP scope)
| Tool | Description | Maker API Endpoint |
|------|-------------|-------------------|
| `list_devices` | List all authorized devices | `GET /devices` |
| `get_device` | Get device details (attributes, capabilities, commands) | `GET /devices/[id]` |
| `send_command` | Send command to device (on/off/setLevel/lock/etc.) | `GET /devices/[id]/[cmd]/[val]` |
| `get_device_events` | Get recent event history for a device | `GET /device/[id]/events` |
| `get_modes` | List available hub modes | `GET /modes` |
| `get_current_mode` | Get current hub mode | `GET /mode` |
| `set_mode` | Change hub mode | `GET /mode/[id]` |
| `get_hsm_status` | Get HSM arm/disarm status | `GET /hsm` |
| `set_hsm` | Arm/disarm HSM | `GET /hsm/[cmd]` |
| `get_variable` | Get hub variable value | `GET /hubvariables/[name]` |
| `set_variable` | Set hub variable value | `GET /hubvariables/[name]/[val]` |
| `list_variables` | List all hub variables | (derived from config or discovery) |

### Tier 2: Enhanced
- Retry logic with exponential backoff for battery devices
- Device attribute caching with TTL
- Batch command execution (parallel)
- Device grouping/filtering by capability or room

### Tier 3: Advanced
- Real-time event streaming via webhooks
- EventSocket support for local deployments
- Scene-like presets (stored in MCP server config)
- Natural language device discovery ("find all lights that are on")

### MCP Resources (read-only context)
| Resource | Description |
|----------|-------------|
| `hubitat://devices` | All device summary for context |
| `hubitat://device/[id]` | Single device full state |
| `hubitat://status` | Hub mode + HSM status snapshot |

---

## Technical Architecture

### Dependencies
```json
{
  "@modelcontextprotocol/sdk": "latest",
  "@ngrok/ngrok": "^1.x",
  "zod": "^3.x",
  "dotenv": "^16.x"
}
```
No heavy frameworks. The MCP SDK handles both stdio and HTTP transports. ngrok SDK embeds the tunnel directly — no separate CLI install needed.

### Configuration
```env
# Hubitat Connection
HUBITAT_HOST=192.168.1.x        # Hub IP address
HUBITAT_APP_ID=123               # Maker API app ID
HUBITAT_ACCESS_TOKEN=xxx         # Maker API access token

# MCP Server
MCP_TRANSPORT=http               # "stdio" or "http"
MCP_HTTP_PORT=3000               # Port for HTTP transport
MCP_AUTH_TOKEN=xxx               # Bearer token for HTTP transport auth

# ngrok (optional — enables remote access)
NGROK_AUTHTOKEN=xxx              # From ngrok.com dashboard
NGROK_DOMAIN=xxx.ngrok-free.app  # Free static domain from ngrok
```

### Project Structure
```
src/
  index.ts              # Entry point, transport selection
  server.ts             # MCP server setup (tools + resources)
  hubitat/
    client.ts           # Hubitat Maker API HTTP client
    types.ts            # TypeScript types for API responses
  tools/
    devices.ts          # Device tools (list, get, command, events)
    modes.ts            # Mode tools (get, set)
    hsm.ts              # HSM tools (status, arm/disarm)
    variables.ts        # Variable tools (get, set)
  resources/
    devices.ts          # Device resources
    status.ts           # Hub status resource
```

### Deployment — Single Setup Script

The repo includes a `setup.sh` script that walks the user through the entire installation interactively — no manual steps outside the script.

**What `setup.sh` does:**
1. Checks Node.js version (requires 20+)
2. Runs `npm install && npm run build`
3. Prompts for Hubitat credentials (hub IP, app ID, access token) — with instructions on where to find them in Hubitat admin
4. Prompts for ngrok setup:
   - Checks if user has an ngrok account, provides signup URL if not
   - Prompts for authtoken (with link to ngrok dashboard)
   - Prompts for free static domain (with instructions to claim one)
5. Writes `.env` file from inputs
6. Runs a quick connectivity test (hits Hubitat Maker API to verify credentials)
7. Offers to install as systemd service (for Raspberry Pi / always-on)
8. Prints the MCP URL to paste into Claude

```bash
# The entire install experience:
git clone https://github.com/rfhayn/hubitat-mcp-server.git
cd hubitat-mcp-server
./setup.sh

# Output:
#   ✓ Node.js v22.1.0
#   ✓ Dependencies installed
#   ✓ TypeScript compiled
#   ? Hubitat hub IP address: 192.168.1.100
#   ? Maker API app ID: 42
#   ? Maker API access token: ****
#   ✓ Connected to Hubitat — found 23 devices
#   ? ngrok authtoken (from ngrok.com/dashboard): ****
#   ? ngrok static domain (from ngrok dashboard): my-home.ngrok-free.app
#   ✓ .env configured
#   ? Install as system service for auto-start? [Y/n]: Y
#   ✓ Service installed and started
#
#   Ready! Add this MCP server to Claude:
#   URL: https://my-home.ngrok-free.app/mcp
```

**Works on both macOS and Raspberry Pi** — the script detects the platform and adjusts (e.g., systemd service on Linux, launchd plist on macOS).

### New Files for Setup
| File | Purpose |
|------|---------|
| `setup.sh` | Interactive setup script (credentials, ngrok, service install) |
| `hubitat-mcp.service` | systemd unit file (Linux/Pi) |
| `com.hubitat-mcp.plist` | launchd plist (macOS, optional) |

---

## Plug-and-Play Features

### 1. Claude Configuration Output

The setup script and `npm start` output should give users the exact config they need — no guessing.

**After setup completes, print platform-specific instructions:**

```
═══════════════════════════════════════════════════
  Your MCP server is ready!
═══════════════════════════════════════════════════

  Remote URL: https://my-home.ngrok-free.app/mcp

  ── Claude Code (CLI) ──────────────────────────
  Run: claude mcp add hubitat --transport http https://my-home.ngrok-free.app/mcp

  ── Claude Desktop ─────────────────────────────
  Add to ~/Library/Application Support/Claude/claude_desktop_config.json:

  {
    "mcpServers": {
      "hubitat": {
        "type": "url",
        "url": "https://my-home.ngrok-free.app/mcp"
      }
    }
  }

  ── Claude.ai (Web) ────────────────────────────
  Go to claude.ai → Settings → Connectors → Add MCP Server
  Paste: https://my-home.ngrok-free.app/mcp

  ── Claude Code (Mobile) ───────────────────────
  Same as Claude Code CLI — add via settings.
═══════════════════════════════════════════════════
```

The setup script should also offer to **auto-configure Claude Code** by running the `claude mcp add` command directly (with user confirmation).

### 2. Hubitat Maker API Setup Guide

The README includes a visual step-by-step guide for configuring the Maker API in Hubitat — this is the #1 prerequisite that users need help with.

**Guide covers:**
1. Log into Hubitat admin (`http://hub-ip`)
2. Apps → Add Built-in App → Maker API
3. Select devices to authorize (recommend: start with all, narrow later)
4. Enable "Allow control of modes" and "Allow control of HSM"
5. Add hub variables to expose (if any)
6. Copy the App ID and Access Token from the Maker API page
7. Screenshots for each step (stored in `docs/images/`)

### 3. npm / npx Support — Zero Git Knowledge

Publish to npm so users can run without cloning:

```bash
# Option A: One-command install + setup
npx hubitat-mcp-server setup

# Option B: Global install
npm install -g hubitat-mcp-server
hubitat-mcp setup     # interactive setup
hubitat-mcp start     # run server
hubitat-mcp status    # check health
hubitat-mcp update    # update to latest
```

**package.json `bin` field:**
```json
{
  "name": "hubitat-mcp-server",
  "bin": {
    "hubitat-mcp": "./dist/cli.ts"
  }
}
```

This means a user's entire experience can be:
```bash
npx hubitat-mcp-server setup
# Answer prompts → done
```

### 4. Health Endpoint + Auto-Restart

**Health endpoint** at `/health` returns server + hub + tunnel status:
```json
{
  "status": "healthy",
  "uptime": "2d 14h 32m",
  "hubitat": {
    "connected": true,
    "lastResponse": "2026-03-12T10:30:00Z",
    "deviceCount": 23
  },
  "ngrok": {
    "connected": true,
    "url": "https://my-home.ngrok-free.app"
  }
}
```

**Auto-restart behavior:**
- ngrok tunnel drops → automatic reconnect (built into `@ngrok/ngrok` SDK)
- Hubitat hub unreachable → log warning, continue serving (hub may reboot)
- Uncaught exception → systemd/launchd restarts the process (`Restart=always`)
- Periodic health check pings Hubitat every 60s to detect connectivity loss

### 5. Auto-Generated Device Context Prompt

On startup (and on demand via a tool), the server generates an MCP **system prompt** that gives Claude context about the user's home. This makes Claude dramatically better at understanding natural language commands.

**Generated from the Maker API device list:**
```
You are connected to a Hubitat home automation hub with 23 devices:

Lights:
  - "Kitchen Light" (id: 12) — switch, dimmer (currently on, 80%)
  - "Living Room Lamp" (id: 15) — switch (currently off)
  - "Master Bedroom" (id: 18) — switch, dimmer, color (currently off)

Locks:
  - "Front Door Lock" (id: 22) — lock (currently locked)
  - "Garage Door Lock" (id: 25) — lock (currently unlocked)

Sensors:
  - "Front Door Contact" (id: 30) — contact sensor (currently closed)
  - "Motion Hallway" (id: 33) — motion sensor (currently inactive)

Thermostats:
  - "Main Thermostat" (id: 40) — thermostat (heating, setpoint: 72°F, current: 70°F)

Hub Mode: Home
HSM Status: Armed Home
```

**Implementation:** Exposed as an MCP resource (`hubitat://home-context`) that Claude can read to understand the home layout. Also used as the MCP server's system prompt/description so Claude always has context.

### 6. Device Aliasing

Config file (`devices.json` or section in `.env`) for friendly names:
```json
{
  "aliases": {
    "12": ["kitchen light", "kitchen"],
    "15": ["living room lamp", "living room light"],
    "22": ["front door", "front lock"]
  }
}
```

The `send_command` tool accepts aliases in addition to device IDs. Claude can say "turn on the kitchen light" and the server resolves "kitchen light" → device 12.

**Setup script auto-generates initial aliases** from Hubitat device labels — user can customize later.

### 7. Self-Update Command

```bash
hubitat-mcp update
# or
npm update -g hubitat-mcp-server
```

For git-clone installs, the setup script adds an update command:
```bash
./setup.sh --update
# Pulls latest, rebuilds, restarts service
```

### 8. Docker Support

For users who prefer containers (especially on Raspberry Pi):

```yaml
# docker-compose.yml
services:
  hubitat-mcp:
    build: .
    restart: always
    env_file: .env
    ports:
      - "3000:3000"
```

```bash
# One-command Docker deploy:
docker compose up -d
```

`Dockerfile` is multi-stage (build + runtime) for small image size. ARM-compatible for Raspberry Pi.

---

## What We're NOT Building (and why)

| Feature | Why Not |
|---------|---------|
| Rule creation/modification | Maker API doesn't support it — would need hub-side Groovy app |
| App/driver management | Not exposed by Maker API |
| Hub diagnostics | Not exposed by Maker API |
| Virtual device creation | Not exposed by Maker API |
| On-hub Groovy app | Different project entirely; we want portable TypeScript |

---

## Milestone Breakdown

| Milestone | Scope | Status |
|-----------|-------|--------|
| **M1** | PRD & Architecture Review (this document) | ACTIVE |
| **M1.1** | Project setup (package.json, tsconfig, MCP SDK, CLI entry point) | READY |
| **M1.2** | Hubitat Maker API client (typed HTTP client) | PLANNED |
| **M1.3** | MCP tools (devices, modes, HSM, variables) | PLANNED |
| **M1.4** | MCP resources (devices, status, home context prompt) | PLANNED |
| **M1.5** | Dual transport (stdio + HTTP) + ngrok integration | PLANNED |
| **M1.6** | Auth layer + health endpoint | PLANNED |
| **M1.7** | Device aliasing + auto-generated context | PLANNED |
| **M1.8** | Setup script (interactive setup, Claude config output) | PLANNED |
| **M1.9** | Deployment (systemd, launchd, Docker) | PLANNED |
| **M1.10** | npm publish + npx support | PLANNED |
| **M1.11** | README with Hubitat Maker API setup guide | PLANNED |
| **M2** | Enhanced features (retry, caching, batch) | PLANNED |
| **M3** | Event streaming (webhooks, EventSocket) | PLANNED |

---

## Decision Log

1. **Cloud vs Local**: Local access to Hubitat hub (IP-based). MCP server connects to hub on LAN. User also uses Homebridge -> Apple Home for existing device control — this MCP project is additive, not a replacement.

2. **Remote Access**: ngrok selected as preferred approach. Free tier provides a stable subdomain (`you.ngrok-free.app`), no domain purchase needed, works with all Claude clients.

3. **Scope**: Maker API scope confirmed — device control + modes + HSM + variables. No need for rule creation or hub administration.

4. **Build vs Buy**: Building custom TypeScript MCP server. Kingpanther13's Groovy server is a reference but we want owned, debuggable, extensible code on proper compute.

---

## kingpanther13 Groovy Server — Reference Analysis

### What It Is
A Groovy application that installs **directly on the Hubitat hub** (not an external server). Because it runs inside the hub's JVM, it can access internal Hubitat APIs that the Maker API does not expose — rule creation, app/driver management, diagnostics, Z-Wave/Zigbee tools, log access, and more. This is why it has 69 tools vs the ~10-12 an external Maker API server can offer.

### How It Works
1. Install via Hubitat Package Manager (HPM) — search "MCP", install "MCP Rule Server"
2. Select which devices to expose in the app settings
3. Hub generates two endpoint URLs:
   - **Local**: `http://192.168.1.x/apps/api/123/mcp?access_token=TOKEN`
   - **Cloud**: `https://cloud.hubitat.com/api/[hub-id]/apps/[id]/mcp` (requires Hubitat cloud subscription)
4. Add the URL to Claude Desktop config, Claude Code, or Claude.ai Connectors
5. Uses **Streamable HTTP transport** with OAuth — no separate server process needed

### Pros
| Pro | Details |
|-----|---------|
| **Zero infrastructure** | No separate server, no Raspberry Pi, no tunnel — runs on the hub itself |
| **69 tools** | Rule creation, diagnostics, app/driver management, virtual devices — far beyond Maker API |
| **Cloud access built-in** | Hubitat's cloud subscription provides a remote URL automatically |
| **Safety gates** | 3-layer protection for destructive operations (permission + backup + confirmation) |
| **Already working** | 257 commits, actively maintained, installable via HPM today |
| **Streamable HTTP native** | Works with Claude mobile, Claude.ai, and Claude Desktop out of the box |

### Cons
| Con | Details |
|-----|---------|
| **"~99% AI-generated"** | Author describes it as "vibe coded" — reliability is uncertain |
| **Groovy on hub** | Runs in the hub's limited JVM — could impact hub performance with heavy use |
| **Single maintainer** | One contributor (kingpanther13), no team, beta quality |
| **Hub firmware dependency** | Requires firmware 2.3.0+; hub updates could break it |
| **No customization** | You can't easily modify Groovy behavior or add custom logic |
| **Hub resource constraints** | Hubitat hubs are not powerful — running an MCP server on them adds load |
| **Opaque debugging** | If something breaks, you're debugging Groovy in a constrained hub environment |
| **Cloud requires subscription** | Hubitat cloud access isn't free — needed for remote use without a tunnel |

### The Real Trade-off

**kingpanther13 = more features, zero infrastructure, but you're dependent on someone else's vibe-coded Groovy running on your hub.**

**Building your own TypeScript server = fewer features (Maker API ceiling), requires hosting infrastructure, but you own the code, understand it, can extend it, and it runs on proper compute (Mac/Pi) without loading the hub.**

---

## Built-in ngrok Integration — Turnkey Remote Access

### Design Goal
A Hubitat user should be able to clone the repo, configure their Hubitat credentials and ngrok token, run `npm start`, and immediately have a working MCP server accessible from Claude anywhere — no manual tunnel setup, no domain purchase, no networking knowledge required.

### How It Works in Practice
```bash
# 1. Clone and install
git clone https://github.com/rfhayn/hubitat-mcp-server.git
cd hubitat-mcp-server && npm install && npm run build

# 2. Configure (.env)
HUBITAT_HOST=192.168.1.x
HUBITAT_APP_ID=123
HUBITAT_ACCESS_TOKEN=your-maker-api-token
NGROK_AUTHTOKEN=your-ngrok-token
NGROK_DOMAIN=your-name.ngrok-free.app    # from ngrok dashboard, free

# 3. Run
npm start
# Output:
#   MCP server running on http://localhost:3000
#   ngrok tunnel active: https://your-name.ngrok-free.app
#   Add this URL to Claude: https://your-name.ngrok-free.app/mcp
```

That's it. No separate terminal for ngrok, no systemd config, no tunnel management.

### Implementation Approach
Use the **`@ngrok/ngrok` npm package** — ngrok's official Node.js SDK that embeds the tunnel directly in the process. No separate `ngrok` CLI install needed.

```typescript
// Simplified concept
import ngrok from '@ngrok/ngrok';

// Start MCP HTTP server on local port
const server = startMcpServer({ port: 3000 });

// If ngrok is configured, automatically create tunnel
if (process.env.NGROK_AUTHTOKEN) {
  const listener = await ngrok.forward({
    addr: 3000,
    authtoken: process.env.NGROK_AUTHTOKEN,
    domain: process.env.NGROK_DOMAIN,  // stable free subdomain
  });
  console.log(`Remote access: ${listener.url()}/mcp`);
}
```

### What This Adds to Dependencies
```json
{
  "@ngrok/ngrok": "^1.x"    // ~5 MB, includes native tunnel binary
}
```

### Modes of Operation
| Config | Behavior |
|--------|----------|
| No ngrok env vars | Local-only HTTP server (for LAN use or Claude Desktop stdio) |
| `NGROK_AUTHTOKEN` set | Auto-creates tunnel with random URL (good for testing) |
| `NGROK_AUTHTOKEN` + `NGROK_DOMAIN` | Stable public URL (production use) |
| `MCP_TRANSPORT=stdio` | No HTTP server at all, pure stdio for Claude Code CLI |

### Onboarding UX for New Users
The README should walk a user through in 3 steps:
1. **Get Hubitat credentials** — Maker API app ID + access token (screenshot guide)
2. **Get ngrok token** — Sign up free at ngrok.com, copy authtoken, claim free domain
3. **Run** — `npm start` and paste the URL into Claude

### Raspberry Pi Auto-Start
Single systemd service handles everything — MCP server + ngrok tunnel in one process:
```bash
sudo cp hubitat-mcp.service /etc/systemd/system/
sudo systemctl enable hubitat-mcp
sudo systemctl start hubitat-mcp
# Done — tunnel auto-reconnects on reboot
```

---

## ngrok Technical Details

### How It Works
```
Claude (mobile/web/desktop)
    │ HTTPS
    ▼
ngrok Edge (global network)
    │ encrypted tunnel
    ▼
ngrok agent (on your Mac or Pi)
    │ localhost
    ▼
MCP Server (http://localhost:3000)
    │ HTTP
    ▼
Hubitat Hub (192.168.1.x)
```

The ngrok agent runs on your machine and creates an **outbound-only** connection to ngrok's network. No ports are opened on your router. Free tier provides a stable subdomain (e.g., `your-name.ngrok-free.app`).

### Requirements
- **Free ngrok account** (sign up at ngrok.com)
- **ngrok installed** on Mac or Pi (`brew install ngrok` or `snap install ngrok`)
- **Your MCP server running** on a local port

### Setup Steps
```bash
# 1. Install ngrok
brew install ngrok                # macOS
# or
sudo snap install ngrok           # Raspberry Pi

# 2. Add auth token (from ngrok dashboard)
ngrok config add-authtoken YOUR_TOKEN

# 3. Claim your free static domain (from ngrok dashboard)
# You get 1 free static domain like: your-name.ngrok-free.app

# 4. Run with static domain
ngrok http --url=your-name.ngrok-free.app 3000

# 5. (Optional) Install as systemd service on Pi for auto-start
```

### Security Considerations
- HTTPS is automatic (ngrok terminates TLS)
- The MCP server should still have its own auth (bearer token) — ngrok alone doesn't authenticate MCP clients
- No ports exposed on your network
- ngrok dashboard shows request logs for debugging

### Fallback: Cloudflare Tunnel
If ngrok free tier limits become an issue, Cloudflare Tunnel is the alternative — same architecture but requires purchasing a domain (~$10/yr).

---

## Implementation Plan — File Changes

### New Files to Create
| File | Purpose |
|------|---------|
| `package.json` | Dependencies: `@modelcontextprotocol/sdk`, `zod`, `dotenv` |
| `tsconfig.json` | Strict TypeScript config, ES2022 target |
| `.env.example` | Template for Hubitat + MCP config |
| `src/index.ts` | Entry point — transport selection (stdio vs HTTP) |
| `src/server.ts` | MCP server setup — register all tools + resources |
| `src/hubitat/client.ts` | Typed HTTP client for Maker API |
| `src/hubitat/types.ts` | TypeScript interfaces for all API responses |
| `src/tools/devices.ts` | list_devices, get_device, send_command, get_device_events |
| `src/tools/modes.ts` | get_modes, get_current_mode, set_mode |
| `src/tools/hsm.ts` | get_hsm_status, set_hsm |
| `src/tools/variables.ts` | list_variables, get_variable, set_variable |
| `src/resources/devices.ts` | hubitat://devices, hubitat://device/[id] resources |
| `src/resources/status.ts` | hubitat://status resource |
| `src/resources/context.ts` | Auto-generated home context prompt |
| `src/tunnel.ts` | ngrok tunnel integration (auto-start when configured) |
| `src/health.ts` | Health endpoint (/health) with hub + tunnel status |
| `src/aliases.ts` | Device alias resolution (friendly names → device IDs) |
| `src/cli.ts` | CLI entry point for npx/global install (setup, start, status, update) |
| `setup.sh` | Interactive setup script (credentials, ngrok, Claude config, service install) |
| `Dockerfile` | Multi-stage Docker build (ARM-compatible for Pi) |
| `docker-compose.yml` | One-command Docker deployment |
| `hubitat-mcp.service` | systemd unit file (Linux/Pi auto-start) |
| `com.hubitat-mcp.plist` | launchd plist (macOS auto-start, optional) |

### Existing Files to Update
| File | Change |
|------|--------|
| `.gitignore` | Already covers node_modules, dist, .env — no changes needed |
| `docs/current-story.md` | Update with active milestone |
| `docs/roadmap.md` | Mark M1 as ACTIVE |
| `docs/next-prompt.md` | Update with implementation guidance |

### Verification
```bash
npm run build && npm test
```
