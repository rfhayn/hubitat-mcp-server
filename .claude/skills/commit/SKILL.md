# Commit

Create a commit following project conventions.

## Commit Rules

1. **Detect milestone** from current branch name (e.g., `feature/M1.2-device-control` -> `M1.2`)
2. **Stage specific files** — never use `git add .` or `git add -A`
3. **Format commit message**:
   - First line: `M#.#.#: Brief description` (imperative mood, e.g., "Add", "Fix", "Update")
   - Blank line
   - Bullet points of specific changes
4. **NO Co-Authored-By line** — this is a project convention
5. **Use HEREDOC** for multi-line messages

## Message Format

```
M#.#.#: Brief imperative description

- Detail 1
- Detail 2
- Detail 3
```

## Process

1. Review all changes (staged + unstaged + untracked)
2. Identify which files should be committed (ask user if unclear)
3. Stage the appropriate files by name
4. Draft the commit message and show it to the user
5. Commit using HEREDOC format
6. Do NOT push unless explicitly asked

## Post-Commit

After committing, remind about:
- `docs/insights-log.md` — any unlogged technical insights this session?
- `docs/development-journal.md` — is the journal entry current?
