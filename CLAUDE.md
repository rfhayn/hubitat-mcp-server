# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Startup (MANDATORY)

Run `/session-start` at the beginning of every session. This reads context docs, checks git state, and reports current status. No exceptions.

## Project Overview

Hubitat MCP Server — a TypeScript MCP (Model Context Protocol) server that enables Claude to interact with Hubitat Elevation home automation hubs. Provides tools for device control, status queries, rule management, and automation through the Hubitat Maker API.

## Build & Run

```bash
npm install          # install dependencies
npm run build        # compile TypeScript
npm run dev          # development mode with watch
npm test             # run tests
```

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Test framework**: Vitest

## Naming Convention (Zero Tolerance)

Always use **M#.#.# format** in all code, commits, docs, and branches:

```
M1       = Major Feature (Device Control)
M1.2     = Component (Switch Operations)
M1.2.3   = Task (Toggle with state verification)
```

Never use "Phase 3", "Step 3", or "Story 1.2.3".

Status indicators: `COMPLETE` | `ACTIVE` | `READY` | `PLANNED`

## Architecture

### MCP Server Pattern

```
Claude Desktop / Claude Code
  ↕ (stdio transport)
MCP Server (this project)
  ↕ (HTTP REST)
Hubitat Maker API
  ↕
Hubitat Hub → Devices
```

### Key Patterns

- **Tools**: MCP tools expose Hubitat capabilities to Claude
- **Resources**: MCP resources provide device state and hub info
- **Error handling**: All Hubitat API errors surfaced clearly to Claude, never silently swallowed
- **Type safety**: Strict TypeScript types for all Hubitat API responses

## Pre-Development Analysis

Before implementing ANY feature:
- Search for existing code that does something similar
- Check if the Hubitat Maker API supports the operation
- Verify correct M#.#.# format in current-story.md

## Git Workflow

**One phase = one branch = one PR = one squash commit to main.**

Use these skills for git operations:
- `/new-milestone <M#.#.# description>` — Set up new milestone (branch, docs)
- `/commit` — Commit with M#.#.# conventions
- `/pr` — Create PR with project format
- `/build` — Build the project

**Key rules** (always in effect):
- Branch naming: `feature/M#.#.#-brief-kebab-case` (3-5 words max)
- Commit prefix: `M#.#.#:` in imperative mood. **No Co-Authored-By credits.**
- Commit every 15-30 min, push after each commit
- Squash merge PRs to main

## Documentation Updates (After Every Session)

**Core docs must stay synchronized.** Use these skills:

- `/log-insight <topic> <insight>` — Log technical insights IMMEDIATELY (don't defer)
- `/dev-journal` — Write/update session narrative (MANDATORY before every commit)
- `/milestone-complete <M#.#.#>` — Update all core docs after milestone completion

**The core documentation files:**
1. `docs/current-story.md` - Current milestone status and progress
2. `docs/next-prompt.md` - Implementation guidance for next milestone
3. `docs/roadmap.md` - Milestone tracking and execution order
4. `docs/requirements.md` - Functional requirements and completion status
5. `docs/project-index.md` - Central navigation hub
6. `docs/insights-log.md` - Technical insights discovered during session
7. `docs/development-journal.md` - Narrative session entry (decisions, learning, AI tooling)

**Hard rules:**
- Treat every commit as a potential last commit — insights and journal must be current
- After completing ANY milestone, update ALL 7 files automatically (use `/milestone-complete`)
- Do not defer documentation to end-of-session — sessions can be interrupted

## Project Skills (`.claude/skills/`)

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/session-start` | Startup checklist | Every session start |
| `/commit` | Commit with M#.#.# conventions | Every commit |
| `/dev-journal` | Write session narrative entry | Before every commit |
| `/log-insight` | Log technical insight | When discoveries are made |
| `/milestone-complete` | Update all core docs | After milestone completion |
| `/pr` | Create PR with project format | End of each milestone phase |
| `/new-milestone` | Set up new milestone | Starting new work |
| `/build` | Build the project | During development |
| `/skills` | List available skills | Reference |

## Code Standards

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig)
- Explicit return types on all exported functions
- No `any` — use `unknown` and narrow
- Prefer `interface` over `type` for object shapes
- Use `const` by default, `let` only when needed

### Comments

```typescript
// GOOD: Explain WHY
// Hubitat returns 'on'/'off' strings, not booleans — normalize here
const isOn = status === 'on';

// BAD: Explain WHAT
// Check if status is on
const isOn = status === 'on';
```

**TODOs must include context:**
```typescript
// GOOD:
// TODO (M2): Add support for color temperature devices

// BAD:
// TODO: fix this
```

## Quality Gates

**Stop and reassess if:**
- More than 5 consecutive build errors
- Spending >20 min on a single compilation issue
- Breaking existing working features
- Working on main branch instead of feature branch
- Creating documentation without updating project-index.md
