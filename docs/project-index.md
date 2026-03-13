# Project Index

**Last Updated**: March 13, 2026

## Overview

Hubitat MCP Server — TypeScript MCP server enabling Claude to interact with Hubitat Elevation home automation hubs via the Maker API. Supports remote access from Claude Code mobile, Claude.ai, and Claude Desktop via built-in ngrok tunnel.

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project conventions and guidance |
| `docs/current-story.md` | Active milestone status |
| `docs/next-prompt.md` | Next milestone guidance |
| `docs/roadmap.md` | Milestone tracking |
| `docs/requirements.md` | Functional requirements |
| `docs/insights-log.md` | Technical insights |
| `docs/development-journal.md` | Session narratives |
| `docs/prds/M1-mcp-review.md` | M1 PRD — architecture and implementation plan |

## Completed Milestones

| Milestone | Description | PR |
|-----------|-------------|----|
| M1.1 | Full MCP server — tools, resources, transports, ngrok, setup, CLI, README | [#1](https://github.com/rfhayn/hubitat-mcp-server/pull/1) |
| M1.2 | Setup deployment guidance, Pi install fixes, README improvements | Direct to main |
| M2 | Device cache, bulk query tools, retry logic | [#2](https://github.com/rfhayn/hubitat-mcp-server/pull/2) |

## Recent Activity

- March 13, 2026: Production deployed on Raspberry Pi — Claude mobile controlling 150 devices
- March 12, 2026: M1.2 — Setup deployment guidance, Pi install fixes, README improvements
- March 12, 2026: M2 — Device cache, bulk queries, retry logic merged (PR #2)
- March 12, 2026: M1.1 — Full server merged (PR #1), tested against live hub with 150 devices
- March 12, 2026: M1 PRD completed — landscape analysis, architecture, plug-and-play features
- March 12, 2026: GitHub repo created (`rfhayn/hubitat-mcp-server`, now public)
- March 12, 2026: Project scaffolded with development framework
