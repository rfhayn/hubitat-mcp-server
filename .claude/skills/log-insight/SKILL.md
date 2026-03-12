# Log Technical Insight

Immediately add an entry to `docs/insights-log.md`.

## What to Log

Insights are non-obvious technical observations discovered during implementation:
- Platform gotchas (Hubitat API quirks, MCP SDK behaviors)
- Architectural trade-offs discovered during implementation
- Debugging techniques that saved significant time
- Performance observations
- Patterns worth remembering across sessions

## Entry Format

Add a new row to the insights log table:

| Date | Milestone | Topic | Insight | Verification | Status |
|------|-----------|-------|---------|--------------|--------|
| [today] | [from branch] | [hierarchical tag] | [the observation] | [how to verify] | Raw |

### Topic Tags

Use format like: `MCP/Tools`, `MCP/Resources`, `Hubitat/API`, `Hubitat/Devices`, `TypeScript/Types`, `Node/Runtime`

## After Logging

Check promotion rules:
- **3+ insights on same topic** -> Suggest creating a Learning Note in `docs/learning-notes/`
- **Architectural decision with trade-offs** -> Suggest creating an ADR in `docs/architecture/`
- **Recurring gotcha** -> Suggest adding to CLAUDE.md
