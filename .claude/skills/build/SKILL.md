# Build

Build the project and report results.

## Build Command

```bash
npm run build 2>&1
```

## On Build Failure

If the build fails:
1. Read the full error output
2. Check if it's a TypeScript compilation error, missing dependency, or config issue
3. For >5 consecutive build errors, stop and reassess approach

## On Build Success

Report:
- BUILD SUCCEEDED
- Number of warnings (if any)

## Test Command

```bash
npm test 2>&1
```

Report test results: passed, failed, skipped.
