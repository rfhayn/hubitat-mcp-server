# Create Pull Request

Create a PR following project conventions.

## PR Conventions

### Title Format
```
M#.#.#: Brief Descriptive Title
```
- Under 70 characters
- Milestone prefix from branch name
- Descriptive, not vague

### Body Template

```markdown
## Summary
- [1-3 bullet points describing what this PR accomplishes]

## Changes
- [Specific change 1]
- [Specific change 2]
- [Specific change 3]

## Testing
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] [Feature-specific test items]

## Time
- Estimated: X hours
- Actual: Y hours

## Next
M#.#.#: [Next milestone in priority queue]
```

## Process

1. Verify all changes are committed and pushed
2. Push to remote if needed: `git push -u origin <branch>`
3. Create PR: `gh pr create --title "..." --body "..."`
4. Use HEREDOC for body formatting
5. Report the PR URL when done
