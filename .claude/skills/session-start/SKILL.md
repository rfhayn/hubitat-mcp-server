# Session Start

Run this checklist at the beginning of every Claude Code session.

## Checklist

1. **Read context docs** (in parallel):
   - `docs/current-story.md`
   - `docs/next-prompt.md`
   - `docs/roadmap.md`
   - `docs/project-index.md`

2. **Check git state**:
   ```bash
   git branch --show-current
   git status --short
   git log --oneline -5
   ```

3. **Verify naming**: Confirm M#.#.# format in current-story.md

4. **Report status**:
   ```
   Branch: [current branch]
   Milestone: [active milestone from current-story.md]
   Status: [ACTIVE/READY/etc]
   Clean: [yes/no]
   Last commit: [hash + message]
   ```

5. **Check for uncommitted insights**: Is `docs/insights-log.md` current?

6. **Check journal**: Is `docs/development-journal.md` current?
