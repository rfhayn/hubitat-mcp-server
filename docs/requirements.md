# Requirements

**Last Updated**: March 12, 2026

## Functional Requirements

### Core — Device Control (Maker API)
- [ ] Connect to Hubitat Maker API via local IP
- [ ] List all authorized devices with current state
- [ ] Get device details (attributes, capabilities, commands)
- [ ] Send commands to devices (on/off, setLevel, lock/unlock, etc.)
- [ ] Query device event history
- [ ] Get/set hub modes
- [ ] Get/set HSM status (arm/disarm)
- [ ] Get/set hub variables

### Core — MCP Server
- [ ] Expose device operations as MCP tools (12 tools)
- [ ] Expose device state as MCP resources (devices, status, home context)
- [ ] Dual transport: stdio (local) + Streamable HTTP (remote)
- [ ] Bearer token auth for HTTP transport

### Core — Remote Access
- [ ] Built-in ngrok tunnel via `@ngrok/ngrok` SDK
- [ ] Stable public URL (ngrok free static domain)
- [ ] Single-process deployment (server + tunnel)
- [ ] Works with Claude Code CLI, Claude Desktop, Claude.ai, Claude mobile

### Plug-and-Play
- [ ] Interactive setup script (`setup.sh`)
- [ ] Auto-configure Claude Code via `claude mcp add`
- [ ] Print Claude Desktop and Claude.ai config on setup
- [ ] Hubitat Maker API setup guide in README with screenshots
- [ ] npx support (`npx hubitat-mcp-server setup`)
- [ ] CLI commands: setup, start, status, update
- [ ] Health endpoint (`/health`) with hub + tunnel status
- [ ] Auto-generated home context prompt (device list by type with state)
- [ ] Device aliasing (friendly names -> device IDs)
- [ ] Self-update command

### Deployment
- [ ] macOS support (development + launchd service)
- [ ] Raspberry Pi support (alongside Homebridge, systemd service)
- [ ] Docker support (Dockerfile + docker-compose.yml, ARM-compatible)

## Non-Functional Requirements
- [ ] TypeScript strict mode
- [ ] Vitest test coverage
- [ ] Sub-second response for device commands
- [ ] Graceful handling of hub unreachable
- [ ] Secure API token storage (never in code, .env only)
- [ ] Auto-restart on crash (systemd/launchd `Restart=always`)
- [ ] ngrok auto-reconnect on tunnel drop

## Out of Scope (Maker API Limitation)
- Rule creation/modification/deletion
- App/driver installation or management
- Hub diagnostics (Z-Wave/Zigbee repair, network stats)
- Virtual device creation
- File management
- Log access (hub logs, device history)
- Room management
