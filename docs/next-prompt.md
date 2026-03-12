# Next Implementation Prompt

**Last Updated**: March 12, 2026
**Status**: M1 PRD approved, begin M1.1

---

## Next: M1.1 — Project Setup

Initialize the TypeScript project with all dependencies and build tooling.

### Tasks
1. Create `package.json` with dependencies:
   - `@modelcontextprotocol/sdk` (MCP protocol)
   - `@ngrok/ngrok` (embedded tunnel)
   - `zod` (input validation)
   - `dotenv` (env config)
   - Dev: `typescript`, `vitest`, `tsx`
2. Create `tsconfig.json` (strict mode, ES2022, Node16 module resolution)
3. Create `.env.example` with all config vars (Hubitat, MCP, ngrok)
4. Create `src/index.ts` entry point (transport selection)
5. Create `src/cli.ts` for npx/global install CLI
6. Verify `npm run build` compiles cleanly
7. Verify `npm test` runs (even if no tests yet)

### Prerequisites
- Node.js 20+ installed
- PRD reviewed: `docs/prds/M1-mcp-review.md`

### Architecture Reference
```
src/
  index.ts              # Entry point, transport selection
  cli.ts                # CLI entry point (setup, start, status, update)
  server.ts             # MCP server setup (tools + resources)
  hubitat/
    client.ts           # Hubitat Maker API HTTP client
    types.ts            # TypeScript types for API responses
  tools/
    devices.ts          # Device tools
    modes.ts            # Mode tools
    hsm.ts              # HSM tools
    variables.ts        # Variable tools
  resources/
    devices.ts          # Device resources
    status.ts           # Hub status resource
    context.ts          # Auto-generated home context
  tunnel.ts             # ngrok integration
  health.ts             # Health endpoint
  aliases.ts            # Device alias resolution
```
