# Requirements

**Last Updated**: March 12, 2026

## Functional Requirements

### Core — Device Control (Maker API)
- [x] Connect to Hubitat Maker API via local IP
- [x] List all authorized devices with current state
- [x] Get device details (attributes, capabilities, commands)
- [x] Send commands to devices (on/off, setLevel, lock/unlock, etc.)
- [x] Query device event history
- [x] Get/set hub modes
- [x] Get/set HSM status (arm/disarm)
- [x] Get/set hub variables

### Core — MCP Server
- [x] Expose device operations as MCP tools (12 tools)
- [x] Expose device state as MCP resources (devices, status, home context)
- [x] Dual transport: stdio (local) + Streamable HTTP (remote)
- [x] Bearer token auth for HTTP transport

### Core — Remote Access
- [x] Built-in ngrok tunnel via `@ngrok/ngrok` SDK
- [x] Stable public URL (ngrok free static domain)
- [x] Single-process deployment (server + tunnel)
- [x] Works with Claude Code CLI, Claude Desktop, Claude.ai, Claude mobile

### Plug-and-Play
- [x] Interactive setup script (`setup.sh`)
- [x] Auto-configure Claude Code via `claude mcp add`
- [x] Print Claude Desktop and Claude.ai config on setup
- [x] Hubitat Maker API setup guide in README
- [ ] npx support (`npx hubitat-mcp-server setup`)
- [x] CLI commands: setup, start, status, update
- [x] Health endpoint (`/health`) with hub + tunnel status
- [x] Auto-generated home context prompt (device list by type with state)
- [x] Device aliasing (friendly names -> device IDs)
- [x] Self-update command

### Deployment
- [x] macOS support (development + launchd service)
- [x] Raspberry Pi support (alongside Homebridge, systemd service)
- [x] Docker support (Dockerfile + docker-compose.yml)
- [x] Setup deployment guidance (always-on device recommendation)

## Non-Functional Requirements
- [x] TypeScript strict mode
- [x] Vitest test coverage
- [ ] Sub-second response for device commands
- [x] Graceful handling of hub unreachable
- [x] Secure API token storage (never in code, .env only)
- [x] Auto-restart on crash (systemd/launchd `Restart=always`)
- [x] ngrok auto-reconnect on tunnel drop

## Out of Scope (Maker API Limitation)
- Rule creation/modification/deletion
- App/driver installation or management
- Hub diagnostics (Z-Wave/Zigbee repair, network stats)
- Virtual device creation
- File management
- Log access (hub logs, device history)
- Room management
