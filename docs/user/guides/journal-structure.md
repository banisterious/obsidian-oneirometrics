# Journal Structure Guidelines

## Overview

This guide provides instructions and best practices for structuring dream journal entries in OneiroMetrics. Following these guidelines will ensure your dream journal entries are properly recognized and analyzed by the plugin.

## Table of Contents

- [1. Valid Journal Structures](#1-valid-journal-structures)
  - [1.1. Flat Structure](#11-flat-structure)
  - [1.2. Nested Structure](#12-nested-structure)
- [2. Structure Rules](#2-structure-rules)
- [3. Best Practices](#3-best-practices)
- [4. Common Issues](#4-common-issues)

## 1. Valid Journal Structures

The OneiroMetrics plugin supports two main journal structure formats:

### 1.1. Flat Structure

A simple, single-dream entry format:

```markdown
> [!dream-diary] Title
> ^20250519
> 
> Lorem ipsum
> 
>> [!dream-metrics]
```

### 1.2. Nested Structure

For multiple dreams in a single journal entry:

```markdown
> [!journal-entry] Title
> ^20250519
> 
> Lorem ipsum
> 
>> [!dream-diary] Title
>> 
>> Lorem ipsum
>>
>>> [!dream-metrics]
```

## 2. Structure Rules

1. **Date Requirements**
   - Each entry must have a valid date
   - Date can be specified in any of these formats:
     - Block reference (`^YYYYMMDD`)
     - Callout metadata (`[!dream-diary|YYYYMMDD]`)
     - YAML frontmatter (`date: YYYY-MM-DD`)

2. **Callout Nesting**
   - `journal-entry` can contain multiple `dream-diary` callouts
   - `dream-diary` can contain multiple `dream-metrics` callouts
   - Maximum nesting depth: 3 levels
   - Each level must be properly indented (2 spaces per level)

3. **Required Components**
   - Every entry must have a title
   - Every entry must have content
   - Every entry should have metrics (recommended)

4. **Validation Rules**
   - Title must be non-empty
   - Content must be non-empty
   - Metrics must follow the format specified in [Metrics Reference](../reference/metrics.md)
   - Dates must be valid and not in the future
   - Block references must be properly formatted

## 3. Best Practices

1. **Structure Selection**
   - Use flat structure for simple, single-dream entries
   - Use nested structure for multiple dreams in one journal entry
   - Maintain consistency within a journal

2. **Organization**
   - Group related dreams under a single journal entry
   - Use clear, descriptive titles
   - Include timestamps for multiple dreams in one entry

3. **Metrics**
   - Place metrics callouts at the end of each dream entry
   - Use consistent metric names and values
   - Include all relevant metrics for each dream

## 4. Common Issues

1. **Invalid Nesting**
   - Incorrect indentation
   - Missing closing callouts
   - Excessive nesting levels

2. **Date Problems**
   - Missing dates
   - Invalid date formats
   - Future dates

3. **Content Issues**
   - Empty titles
   - Missing content
   - Malformed metrics

## Related Resources

- [Usage Guide](usage.md)
- [Metrics Reference](../reference/metrics.md)
- [Templater Integration](templater.md) 