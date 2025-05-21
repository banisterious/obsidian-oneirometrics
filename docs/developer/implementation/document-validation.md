# Document Validation Scripts

## Overview

This document describes the document validation scripts used in the OneiroMetrics project to ensure consistent documentation formatting and style across the codebase. These scripts automate checking for compliance with the [Documentation Style Guide](../../assets/templates/documentation-style-guide.md).

## Table of Contents

- [1. Available Scripts](#1-available-scripts)
  - [1.1. validate-docs.js](#11-validate-docsjs)
  - [1.2. check-docs.js](#12-check-docsjs)
- [2. Using the Scripts](#2-using-the-scripts)
- [3. Validation Rules](#3-validation-rules)
- [4. Adding New Documents](#4-adding-new-documents)
- [5. Troubleshooting](#5-troubleshooting)

## 1. Available Scripts

### 1.1. validate-docs.js

Located in the `docs/` directory, `validate-docs.js` is the newer, more comprehensive validation script. It validates documents against a set of rules defined in the Documentation Style Guide and provides detailed feedback on each rule.

```javascript
// Run from project root
node docs/validate-docs.js
```

This script currently validates the following documents:
- developer/implementation/date-time.md
- developer/implementation/logging.md
- developer/testing/performance-testing.md
- developer/testing/ui-testing.md
- developer/testing/accessibility-testing.md
- planning/features/date-tools.md

### 1.2. check-docs.js

Located in the project root, `check-docs.js` is an older, simpler validation script that performs basic checks on a predefined set of documents.

```javascript
// Run from project root
node check-docs.js
```

## 2. Using the Scripts

To validate your documentation:

1. Create or update a markdown document according to the style guide
2. Run the validation script from the project root:
   ```bash
   node docs/validate-docs.js
   ```
3. Review the output for any rule violations
4. Fix issues and run the script again until all checks pass

The script will output success or failure for each rule and each document:

```
File: developer/implementation/logging.md
  ✅ hasTitle
  ✅ hasOverview
  ✅ hasTableOfContents
  ✅ usesRelativePaths
  ✅ usesCorrectCaseConventions
  ✅ hasConsistentHeadings
```

The script exits with code 1 if any document fails validation, making it suitable for use in CI/CD pipelines.

## 3. Validation Rules

Current validation rules check for:

| Rule | Description |
|------|-------------|
| hasTitle | Document begins with a level 1 heading (# Title) |
| hasOverview | Document includes an Overview or Introduction section |
| hasTableOfContents | Document includes a Table of Contents section |
| usesRelativePaths | All links to other .md files use relative paths, not absolute paths |
| usesCorrectCaseConventions | Filename follows kebab-case convention (lowercase with hyphens) |
| hasConsistentHeadings | Heading levels follow a logical hierarchy without skipping levels |

## 4. Adding New Documents

To add new documents to the validation process:

1. Open `docs/validate-docs.js`
2. Locate the `migrated` array
3. Add your document path to the array:
   ```javascript
   const migrated = [
       // existing entries
       'your/new/document.md'
   ];
   ```
4. Run the script to validate your new document

## 5. Troubleshooting

Common issues when running validation:

- **"File not found"**: Check that the path in the `migrated` array matches the actual file location
- **Failed rules**: Review the specific rule that failed and update your document accordingly
- **Script errors**: Make sure you're running the script from the project root directory

For more information about documentation standards, refer to the [Documentation Style Guide](../../assets/templates/documentation-style-guide.md). 