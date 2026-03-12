# New Milestone Setup

Set up a new milestone for development.

## Process

1. **Parse milestone** from arguments (e.g., `M1.1 Hubitat Connection`)

2. **Create feature branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/M#.#.#-brief-kebab-case
   ```

3. **Update `docs/current-story.md`**:
   - Set new milestone as ACTIVE
   - Add sub-phase breakdown
   - Update "Last Updated" date

4. **Update `docs/next-prompt.md`**:
   - Add implementation guidance for the new milestone
   - Update status line

5. **Update `docs/roadmap.md`**:
   - Mark milestone as ACTIVE

6. **Create PRD** (if non-trivial):
   - Write to `docs/prds/M#.#.#-brief-name.md`

7. **Report**:
   ```
   Milestone: M#.#.# — [Name]
   Branch: feature/M#.#.#-brief-kebab-case
   PRD: docs/prds/[filename].md (if created)
   Status: ACTIVE
   ```
