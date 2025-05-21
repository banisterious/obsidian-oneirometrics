# Date and Time Handling Technical Specification

## Overview

This document outlines the technical implementation of date and time handling in OneiroMetrics, including the current architecture, planned improvements, and best practices for developers.

For documentation standards and guidelines, see [Documentation Style Guide](../../archive/legacy/DOCUMENTATION_STYLE_GUIDE.md).
For code quality standards, see [Journal Structure Guidelines](../../archive/legacy/JOURNAL_STRUCTURE_GUIDELINES.md) and [Journal Structure Check Implementation Plan](../../archive/legacy/JOURNAL_STRUCTURE_CHECK_IMPLEMENTATION_PLAN.md).
For icon implementation details, see [Icon Picker Technical Implementation](../../archive/legacy/ICON_PICKER_TECHNICAL_IMPLEMENTATION.md).
For metric descriptions and styling, see [Metrics Descriptions](../../user/reference/metrics.md).

## Table of Contents

- [Overview](#overview)
- [Current Implementation](#current-implementation)
  - [Date Sources and Priority](#date-sources-and-priority)
  - [Alternative Date Sources](#alternative-date-sources)
  - [Date Source Selection](#date-source-selection)
  - [Use Case Examples](#use-case-examples)
- [Date Range Filter Implementation](#date-range-filter-implementation)
  - [Quick Filters](#quick-filters)
  - [Custom Date Range](#custom-date-range)
  - [Filter UI Components](#filter-ui-components)
- [Time-Based Pattern Analysis](#time-based-pattern-analysis)
  - [Dream Time Analysis](#dream-time-analysis)
  - [Metadata Extraction](#metadata-extraction)
  - [Correlation Analysis](#correlation-analysis)
- [Best Practices](#best-practices)
  - [Date Parsing](#date-parsing)
  - [Date Formatting](#date-formatting)
  - [Time Zone Handling](#time-zone-handling)
- [Future Improvements](#future-improvements)

## Current Implementation

### Date Sources and Priority

1. **Block References (Primary)**
   - Format: `^YYYYMMDD`
   - Example: `^20250512`
   - Advantages:
     - Manually created, ensuring accuracy
     - Direct link to source content
     - Machine-readable
     - Part of Obsidian's core functionality
   - Implementation:
     ```typescript
     const blockRefRegex = /\^(\d{8})/;
     const match = content.match(blockRefRegex);
     if (match) {
         const date = parseBlockRefDate(match[1]);
         if (isValidDate(date)) return date;
     }
     ```

2. **Callout Metadata (Secondary)**
   - Format: `[!callout-type|YYYYMMDD]`
   - Examples:
     - `[!journal-entry|20250513]`
     - `[!diary-entry|20250513]`
     - `[!daily-note|20250513]`
     - `[!daily|20250513]`
     - `[!weekly|20250513]`
   - Advantages:
     - Part of Obsidian's callout system
     - Visible in the document
     - Can be used for both date and callout type
     - Easy to add/update
     - Flexible callout type support
   - Note on Granularity:
     - Currently focused on daily and weekly entries
     - Larger time periods (monthly, quarterly) are better handled through:
       - Separate summary documents
       - Dataview queries
       - Calendar plugin integration
       - Graph view organization
     - This maintains atomic note principles and editor performance

### Alternative Date Sources

> **Note on Complexity**: While multiple date sources are supported, it's recommended to choose one primary method for consistency. The examples below show what's possible, but you don't need to use all of them.

1. **Note-Based Sources**
   - Note Titles:
     - `2025-05.md` (Monthly)
     - `2025-Q2.md` (Quarterly)
     - `2025-05-Week2.md` (Weekly)
   - YAML Frontmatter:
     ```yaml
     ---
     date: 2025-05
     period: month
     type: summary
     ---
     ```
     ```yaml
     ---
     date: 2025-Q2
     period: quarter
     type: review
     ---
     ```

2. **Folder-Based Sources**
   - Common Patterns:
     - Year-based: `Journals/2025/`
     - Month-based: `Journals/2025/05/`
     - Day-based: `Journals/2025/05/13/`
     - Combined: `Journals/2025/2025-05-13/`
   - Implementation:
     ```typescript
     function extractDateFromPath(path: string): Date | null {
         // Year folder
         const yearMatch = path.match(/\/(\d{4})\//);
         if (yearMatch) {
             const year = parseInt(yearMatch[1]);
             if (year >= 1900 && year <= 2100) {
                 return new Date(year, 0, 1); // Start of year
             }
         }
         
         // Month folder
         const monthMatch = path.match(/\/(\d{4})\/(\d{2})\//);
         if (monthMatch) {
             const year = parseInt(monthMatch[1]);
             const month = parseInt(monthMatch[2]) - 1;
             if (isValidDate(new Date(year, month, 1))) {
                 return new Date(year, month, 1);
             }
         }
         
         // Day folder
         const dayMatch = path.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
         if (dayMatch) {
             const year = parseInt(dayMatch[1]);
             const month = parseInt(dayMatch[2]) - 1;
             const day = parseInt(dayMatch[3]);
             const date = new Date(year, month, day);
             if (isValidDate(date)) return date;
         }
         
         return null;
     }
     ```

3. **Combined Approaches**
   - Example: Using folder structure with YAML frontmatter
     ```
     Journals/
     └── 2025/
         └── 05/
             └── 13/
                 └── dream-entry.md
     ```
     ```yaml
     ---
     date: 2025-05-13
     type: dream
     folder_date: 2025-05-13
     ---
     ```
   - Benefits:
     - Redundant date information for validation
     - Flexible querying options
     - Clear organization
     - Easy to maintain

### Date Source Selection

When choosing a date source strategy, consider:

1. **Simplicity**
   - One consistent method is better than many
   - Easier to maintain and debug
   - Clearer for users

2. **Use Case**
   - Daily entries: Block refs or callouts
   - Weekly entries: Callouts or folders
   - Monthly/Quarterly: Folders or YAML

3. **Integration**
   - How it works with other plugins
   - Query and filter capabilities
   - Export/import compatibility

4. **Migration**
   - Ease of converting between formats
   - Backward compatibility
   - Future flexibility

### Use Case Examples

1. **Daily Dream Journaling**
   ```markdown
   # Dream Journal Entry
   
   > [!journal-entry|20250513]
   > Had a vivid dream about flying over mountains...
   
   > [!dream-metrics]
   > - Vividness: 4
   > - Emotional Intensity: 3
   ```
   - Uses callout metadata for date
   - Easy to read and edit
   - Works well with metrics

2. **Weekly Dream Analysis**
   ```markdown
   # Week of May 13, 2025
   
   > [!weekly|20250513]
   > ## Dream Patterns
   > - Common themes: flying, water
   > - Average vividness: 3.5
   > - Most frequent emotion: excitement
   ```
   - Combines weekly summary with daily entries
   - Good for pattern recognition
   - Easy to maintain

3. **Monthly Review**
   ```yaml
   ---
   date: 2025-05
   period: month
   type: dream-analysis
   metrics:
     total_dreams: 28
     average_vividness: 3.7
     common_themes: [flying, water, mountains]
   ---
   ```
   - Uses YAML for structured data
   - Good for statistics
   - Easy to query

4. **Project-Based Organization**
   ```
   Dreams/
   └── 2025/
       └── 05/
           └── 13/
               ├── morning-dream.md
               └── night-dream.md
   ```
   - Uses folder structure
   - Good for multiple entries per day
   - Clear organization

### Migration Guide

1. **From Block References to Callouts**
   ```typescript
   function migrateBlockRefToCallout(content: string): string {
       return content.replace(
           /\^(\d{8})/g,
           (_, date) => `[!journal-entry|${date}]`
       );
   }
   ```

2. **From YAML to Callouts**
   ```typescript
   function migrateYamlToCallout(content: string): string {
       const yamlMatch = content.match(/---\n([\s\S]*?)\n---/);
       if (yamlMatch) {
           const yaml = yamlMatch[1];
           const dateMatch = yaml.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
           if (dateMatch) {
               const date = dateMatch[1].replace(/-/g, '');
               return content.replace(
                   /---\n[\s\S]*?\n---/,
                   `[!journal-entry|${date}]`
               );
           }
       }
       return content;
   }
   ```

## Integration with Other Components

### 1. Metrics System
- Linking date data to metrics records
- Time-based aggregation
- Trend analysis over time periods
- For complete metrics documentation, see [Metrics Reference](../../user/reference/metrics.md)

### 2. State Management
- Saving date format preferences
- Remembering custom date ranges
- Persistent filtering options
- For details on state implementation, see [State Persistence](../implementation/state.md)

### 3. UI Components
- Date range selector implementation
- Calendar view integration
- Date grouping in reports
- See [UI Testing](../testing/ui-testing.md) for validation procedures

## Future Improvements

### 1. Advanced Date Extraction
- Natural language date processing
- Fuzzy matching for imprecise dates
- Multi-format detection within a single vault

### 2. Performance Optimization
- Caching for date extraction
- Batch processing for large vaults
- See [Performance Testing](../testing/performance-testing.md) for benchmarking methodology

### 3. Enhanced Integration
- Support for native Obsidian daily notes
- Calendar plugin synchronization
- Periodic notes plugin compatibility
- See [Testing Overview](../testing/testing-overview.md) for integration testing approach

## Best Practices for Developers

1. Always validate extracted dates with `isValidDate()`
2. Provide clear fallbacks when primary date sources are absent
3. Support ISO date format (YYYY-MM-DD) for compatibility
4. Include timezone handling for applications with global user base
5. Maintain backward compatibility with all date formats
6. Document date format requirements for end-users
7. Implement robust error handling for malformed dates
8. Consider accessibility in date displays and inputs

## Conclusion

This document outlines the current implementation and best practices for date and time handling in OneiroMetrics. By following these guidelines, developers can ensure consistent and reliable date management across the plugin's functionality.

For testing procedures related to date handling, please see the [Testing Overview](../testing/testing-overview.md) document. 