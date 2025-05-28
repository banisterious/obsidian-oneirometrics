# Code Cleanup Utility Scripts

These scripts help with the code cleanup process as outlined in the [Code Cleanup Plan](../docs/developer/implementation/code-cleanup-plan.md).

## Available Scripts

### 1. find-unused-imports.ps1

Identifies potentially unused imports in TypeScript files. The script analyzes import statements and checks if the imported symbols are used elsewhere in the file.

```powershell
.\find-unused-imports.ps1
```

### 2. find-console-logs.ps1

Finds console.log statements that need to be replaced with structured logging using the LoggingService. Also detects other console methods like console.warn, console.error, etc.

```powershell
.\find-console-logs.ps1
```

### 3. find-commented-code.ps1

Identifies commented-out code that might be safely removed. It differentiates between documentation comments and actual commented-out code blocks.

```powershell
.\find-commented-code.ps1
```

### 4. find-outdated-todos.ps1

Finds TODO comments in the codebase and categorizes them as:
- Outdated (past due date)
- Completed (can be removed)
- Without dates
- Current (future dates)

```powershell
.\find-outdated-todos.ps1
```

## Cleanup Workflow

For an efficient code cleanup process, follow these steps:

1. Run the scripts to identify cleanup targets
2. Start with the easier tasks first:
   - Remove completed TODOs
   - Replace console.log statements with structured logging
   - Remove commented-out code (verify with git history first)
   - Fix unused imports
3. Work on one file at a time
4. Test after each change
5. Commit frequently with descriptive messages

## Best Practices

- **Make Atomic Changes**: Each commit should focus on one type of cleanup for easier review
- **Test Thoroughly**: Run the plugin after each significant change
- **Document Progress**: Update the [Code Cleanup Plan](../docs/developer/implementation/code-cleanup-plan.md) with your progress
- **Use Commit Messages**: Follow the format: `cleanup: [area] - [specific change]`
  - Example: `cleanup: logging - replace console.log with structured logging in metrics.ts`

## Output Analysis

These scripts use heuristic analysis, so results may include false positives. Always verify before making changes.

## Requirements

- PowerShell 5.1 or later
- Run from the root of the project directory 