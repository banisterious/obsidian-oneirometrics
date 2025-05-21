# Date and Time Handling Technical Specification

## Overview

This document outlines the technical implementation of date and time handling in OneiroMetrics, including the current architecture, planned improvements, and best practices for developers.

For documentation standards and guidelines, see [Documentation Style Guide](DOCUMENTATION_STYLE_GUIDE.md).
For code quality standards, see [Code Standards](developer/contributing/code-standards.md) and [Journal Structure Check Implementation Plan](JOURNAL_STRUCTURE_CHECK_IMPLEMENTATION_PLAN.md).
For icon implementation details, see [Icon Picker Technical Implementation](ICON_PICKER_TECHNICAL_IMPLEMENTATION.md).
For metric descriptions and styling, see [Metrics Reference](user/reference/metrics.md).

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

3. **From Folders to Callouts**
   ```typescript
   async function migrateFolderToCallout(file: TFile): Promise<void> {
       const path = file.path;
       const date = extractDateFromPath(path);
       if (date) {
           const content = await app.vault.read(file);
           const newContent = content.replace(
               /^# .*$/m,
               `# ${file.basename}\n\n[!journal-entry|${formatDate(date)}]`
           );
           await app.vault.modify(file, newContent);
       }
   }
   ```

### Implementation Details

1. **Date Parsing Pipeline**
   ```typescript
   interface DateParseResult {
       date: Date;
       source: 'blockRef' | 'callout' | 'yaml' | 'folder' | 'title';
       confidence: number;
       format: string;
   }

   async function parseDateFromContent(
       content: string,
       file: TFile,
       settings: Settings
   ): Promise<DateParseResult | null> {
       // Try block reference first
       const blockRefDate = parseBlockRefDate(content);
       if (blockRefDate) {
           return {
               date: blockRefDate,
               source: 'blockRef',
               confidence: 1.0,
               format: '^YYYYMMDD'
           };
       }

       // Try callout metadata
       const calloutDate = parseCalloutDate(content);
       if (calloutDate) {
           return {
               date: calloutDate,
               source: 'callout',
               confidence: 0.9,
               format: '[!type|YYYYMMDD]'
           };
       }

       // Try YAML frontmatter
       const yamlDate = parseYamlDate(content);
       if (yamlDate) {
           return {
               date: yamlDate,
               source: 'yaml',
               confidence: 0.8,
               format: 'YYYY-MM-DD'
           };
       }

       // Try folder path
       const folderDate = extractDateFromPath(file.path);
       if (folderDate) {
           return {
               date: folderDate,
               source: 'folder',
               confidence: 0.7,
               format: 'YYYY/MM/DD'
           };
       }

       return null;
   }
   ```

2. **Date Validation**
   ```typescript
   interface DateValidationResult {
       isValid: boolean;
       errors: string[];
       warnings: string[];
   }

   function validateDate(
       date: Date,
       context: {
           source: string;
           format: string;
           file?: TFile;
       }
   ): DateValidationResult {
       const result: DateValidationResult = {
           isValid: true,
           errors: [],
           warnings: []
       };

       // Basic validation
       if (!(date instanceof Date) || isNaN(date.getTime())) {
           result.isValid = false;
           result.errors.push('Invalid date object');
           return result;
       }

       // Range validation
       const year = date.getFullYear();
       if (year < 1900 || year > 2100) {
           result.isValid = false;
           result.errors.push('Date outside valid range (1900-2100)');
       }

       // Future date warning
       if (date > new Date()) {
           result.warnings.push('Date is in the future');
       }

       // Consistency check with file path
       if (context.file) {
           const pathDate = extractDateFromPath(context.file.path);
           if (pathDate && !isSameDay(date, pathDate)) {
               result.warnings.push('Date differs from folder path date');
           }
       }

       return result;
   }
   ```

### Troubleshooting Guide

1. **Common Issues**

   a. **Invalid Date Format**
   ```markdown
   Error: Invalid date format in callout
   Fix: Ensure date follows YYYYMMDD format
   Example: [!journal-entry|20250513]
   ```

   b. **Missing Date Source**
   ```markdown
   Error: No date found in content
   Fix: Add one of:
   - Block reference: ^20250513
   - Callout: [!journal-entry|20250513]
   - YAML: date: 2025-05-13
   ```

   c. **Inconsistent Dates**
   ```markdown
   Warning: Date in callout differs from folder path
   Fix: Ensure dates match or remove one source
   ```

2. **Debugging Steps**

   a. **Check Date Sources**
   ```typescript
   function debugDateSources(content: string, file: TFile): void {
       console.log('Checking date sources...');
       
       // Check block references
       const blockRefs = content.match(/\^(\d{8})/g);
       console.log('Block references:', blockRefs);
       
       // Check callouts
       const callouts = content.match(/\[!.*?\|(\d{8})\]/g);
       console.log('Callouts:', callouts);
       
       // Check YAML
       const yaml = content.match(/---\n([\s\S]*?)\n---/);
       console.log('YAML frontmatter:', yaml?.[1]);
       
       // Check folder path
       const pathDate = extractDateFromPath(file.path);
       console.log('Folder path date:', pathDate);
   }
   ```

   b. **Validate Date Format**
   ```typescript
   function validateDateFormat(date: string): boolean {
       // Check YYYYMMDD format
       if (!/^\d{8}$/.test(date)) return false;
       
       const year = parseInt(date.substring(0, 4));
       const month = parseInt(date.substring(4, 6));
       const day = parseInt(date.substring(6, 8));
       
       return (
           year >= 1900 && year <= 2100 &&
           month >= 1 && month <= 12 &&
           day >= 1 && day <= 31
       );
   }
   ```

3. **Recovery Steps**

   a. **Backup Before Migration**
   ```typescript
   async function backupBeforeMigration(file: TFile): Promise<void> {
       const content = await app.vault.read(file);
       const backupPath = `${file.path}.bak`;
       await app.vault.create(backupPath, content);
   }
   ```

   b. **Restore From Backup**
   ```typescript
   async function restoreFromBackup(file: TFile): Promise<void> {
       const backupPath = `${file.path}.bak`;
       const backupFile = app.vault.getAbstractFileByPath(backupPath);
       if (backupFile instanceof TFile) {
           const content = await app.vault.read(backupFile);
           await app.vault.modify(file, content);
       }
   }
   ```

### Date Validation

```typescript
function isValidDate(date: Date): boolean {
    return (
        date instanceof Date &&
        !isNaN(date.getTime()) &&
        date.getFullYear() >= 1900 &&
        date.getFullYear() <= 2100
    );
}
```

## Planned Improvements

### 1. Enhanced Date Parsing

```typescript
interface DateParseResult {
    date: Date;
    source: 'blockRef' | 'iso' | 'journal' | 'human';
    confidence: number;
    format: string;
}

function parseDate(content: string, settings: Settings): DateParseResult {
    // Implementation details
}
```

### 2. Time Filter Enhancements

1. **Custom Date Range Presets**
   ```typescript
   interface DateRangePreset {
       id: string;
       name: string;
       getRange: () => { start: Date; end: Date };
       isActive: (date: Date) => boolean;
   }
   ```

2. **Relative Time Indicators**
   ```typescript
   function getRelativeTimeIndicator(date: Date): string {
       // Implementation details
   }
   ```

3. **Date Range Comparison**
   ```typescript
   interface DateRangeComparison {
       current: { start: Date; end: Date };
       previous: { start: Date; end: Date };
       difference: number;
   }
   ```

### 3. Calendar Improvements

1. **Multi-Month View**
   ```typescript
   interface CalendarView {
       months: Month[];
       selectedRange: DateRange;
       navigation: CalendarNavigation;
   }
   ```

2. **Week Numbers**
   ```typescript
   function getWeekNumber(date: Date): number {
       // Implementation details
   }
   ```

## Best Practices

1. **Date Parsing**
   - Always use the priority chain
   - Log parsing attempts
   - Validate dates before use
   - Handle timezone consistently

2. **Date Display**
   - Use localized formats
   - Consider user preferences
   - Maintain consistency
   - Handle invalid dates gracefully

3. **Time Filter Implementation**
   - Cache filter results
   - Update UI efficiently
   - Handle edge cases
   - Maintain accessibility

4. **Error Handling**
   ```typescript
   interface DateError {
       code: 'INVALID_FORMAT' | 'OUT_OF_RANGE' | 'PARSING_ERROR';
       message: string;
       context: any;
   }
   ```

## Testing Requirements

1. **Date Parsing Tests**
   - All supported formats
   - Edge cases
   - Invalid dates
   - Timezone handling

2. **Time Filter Tests**
   - All filter types
   - Calendar interaction
   - Accessibility
   - Performance

3. **Integration Tests**
   - Event handling
   - State management
   - UI updates
   - Error scenarios

## Performance Considerations

1. **Caching**
   - Cache parsed dates
   - Cache filter results
   - Cache calendar views

2. **Optimization**
   - Lazy loading
   - Debounced updates
   - Efficient DOM updates

3. **Memory Management**
   - Clear caches when needed
   - Handle large datasets
   - Monitor memory usage

## Future Considerations

1. **AI-Powered Suggestions**
   - Pattern recognition
   - Trend analysis
   - Custom date range templates

2. **Advanced Features**
   - Recurring date patterns
   - Custom date formats
   - Advanced filtering options

3. **Integration**
   - Calendar plugin
   - Graph view
   - Export/Import

## Notes

- All dates should be handled in UTC internally
- Display dates in user's local timezone
- Consider daylight saving time
- Handle edge cases (e.g., year boundaries)
- Maintain backward compatibility
- Document all changes
- Test thoroughly

### Plugin Compatibility

1. **Core Daily Notes Plugin**
   - **Date Format**: `YYYY-MM-DD`
   - **File Location**: User-configurable, typically `Daily Notes/YYYY-MM-DD.md`
   - **Integration**:
     ```typescript
     interface DailyNotesSettings {
         format: string;
         folder: string;
         template: string;
     }

     function getDailyNoteDate(file: TFile): Date | null {
         // Match Daily Notes format
         const match = file.basename.match(/^(\d{4})-(\d{2})-(\d{2})$/);
         if (match) {
             const [_, year, month, day] = match;
             return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
         }
         return null;
     }

     // Example usage in dream entry
     ```markdown
     # {{date:YYYY-MM-DD}}
     
     > [!journal-entry|{{date:YYYYMMDD}}]
     > Dream content here...
     ```

2. **Periodic Notes Plugin**
   - **Supported Periods**:
     - Daily: `YYYY-MM-DD`
     - Weekly: `YYYY-[W]ww`
     - Monthly: `YYYY-MM`
     - Quarterly: `YYYY-[Q]Q`
     - Yearly: `YYYY`
   - **Integration**:
     ```typescript
     interface PeriodicNotesSettings {
         daily: {
             format: string;
             folder: string;
         };
         weekly: {
             format: string;
             folder: string;
         };
         monthly: {
             format: string;
             folder: string;
         };
         quarterly: {
             format: string;
             folder: string;
         };
         yearly: {
             format: string;
             folder: string;
         };
     }

     function getPeriodicNoteDate(file: TFile, settings: PeriodicNotesSettings): Date | null {
         const basename = file.basename;
         
         // Try daily format
         const dailyMatch = basename.match(/^(\d{4})-(\d{2})-(\d{2})$/);
         if (dailyMatch) {
             const [_, year, month, day] = dailyMatch;
             return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
         }
         
         // Try weekly format
         const weeklyMatch = basename.match(/^(\d{4})-W(\d{2})$/);
         if (weeklyMatch) {
             const [_, year, week] = weeklyMatch;
             return getDateFromWeek(parseInt(year), parseInt(week));
         }
         
         // Try monthly format
         const monthlyMatch = basename.match(/^(\d{4})-(\d{2})$/);
         if (monthlyMatch) {
             const [_, year, month] = monthlyMatch;
             return new Date(parseInt(year), parseInt(month) - 1, 1);
         }
         
         return null;
     }
     ```

3. **Templater Plugin**
   - **Date Functions**:
     ```typescript
     // Available in templates
     const templaterFunctions = {
         // Current date
         now: () => new Date(),
         
         // Date arithmetic
         dateAdd: (date: Date, amount: number, unit: 'days' | 'weeks' | 'months' | 'years') => {
             const result = new Date(date);
             switch (unit) {
                 case 'days': result.setDate(result.getDate() + amount); break;
                 case 'weeks': result.setDate(result.getDate() + (amount * 7)); break;
                 case 'months': result.setMonth(result.getMonth() + amount); break;
                 case 'years': result.setFullYear(result.getFullYear() + amount); break;
             }
             return result;
         },
         
         // Date formatting
         formatDate: (date: Date, format: string) => {
             // Implementation of date formatting
         }
     };
     ```
   - **Template Examples**:
     ```markdown
     # {{date:YYYY-MM-DD}}
     
     > [!journal-entry|{{date:YYYYMMDD}}]
     > 
     > ## Dream
     > {{content}}
     > 
     > ## Metrics
     > - Vividness: {{input:Vividness (1-5)}}
     > - Emotional Intensity: {{input:Emotional Intensity (1-5)}}
     > 
     > ## Notes
     > {{input:Additional notes}}
     ```
   - **Integration**:
     ```typescript
     interface TemplaterSettings {
         dateFormat: string;
         timeFormat: string;
         templatesFolder: string;
     }

     function parseTemplaterDate(content: string, settings: TemplaterSettings): Date | null {
         // Look for date patterns in template variables
         const dateMatch = content.match(/{{date:([^}]+)}}/);
         if (dateMatch) {
             const format = dateMatch[1];
             // Parse date based on format
             return parseDateFromFormat(format, new Date());
         }
         return null;
     }
     ```

4. **Combined Usage Example**
   ```markdown
   # {{date:YYYY-MM-DD}}
   
   > [!journal-entry|{{date:YYYYMMDD}}]
   > 
   > ## Dream
   > {{content}}
   > 
   > ## Weekly Context
   > This is week {{date:ww}} of {{date:YYYY}}
   > 
   > ## Monthly Context
   > {{date:MMMM}} {{date:YYYY}}
   > 
   > ## Metrics
   > - Vividness: {{input:Vividness (1-5)}}
   > - Emotional Intensity: {{input:Emotional Intensity (1-5)}}
   > 
   > ## Notes
   > {{input:Additional notes}}
   ```

5. **Best Practices**
   - Use consistent date formats across plugins
   - Leverage Templater for dynamic date calculations
   - Maintain compatibility with both Daily Notes and Periodic Notes
   - Use callout metadata for dream-specific dates
   - Keep templates simple and maintainable
   - Document any custom date formats used

6. **Calendar Plugin**
   - **Integration**:
     ```typescript
     interface CalendarSettings {
         firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
         showWeekNumbers: boolean;
         defaultView: 'month' | 'week' | 'day';
         eventClickBehavior: 'open' | 'create' | 'edit';
     }

     interface CalendarEvent {
         id: string;
         date: Date;
         title: string;
         type: 'dream' | 'journal' | 'summary';
         metadata?: {
             vividness?: number;
             emotionalIntensity?: number;
             themes?: string[];
         };
     }

     function createCalendarEvent(event: CalendarEvent): void {
         // Create or update calendar event
         const eventData = {
             id: event.id,
             date: event.date.toISOString(),
             title: event.title,
             type: event.type,
             metadata: event.metadata
         };
         
         // Store in calendar plugin's data
         app.plugins.plugins.calendar?.api.addEvent(eventData);
     }

     function getEventsForDate(date: Date): CalendarEvent[] {
         // Retrieve events for specific date
         const events = app.plugins.plugins.calendar?.api.getEvents(date);
         return events.map(event => ({
             id: event.id,
             date: new Date(event.date),
             title: event.title,
             type: event.type,
             metadata: event.metadata
         }));
     }
     ```

   - **Template Integration**:
     ```markdown
     # {{date:YYYY-MM-DD}}
     
     > [!journal-entry|{{date:YYYYMMDD}}]
     > 
     > ## Dream
     > {{content}}
     > 
     > ## Calendar Integration
     > - Event Type: Dream Journal
     > - Vividness: {{input:Vividness (1-5)}}
     > - Emotional Intensity: {{input:Emotional Intensity (1-5)}}
     > - Themes: {{input:Themes (comma-separated)}}
     > 
     > <%*
     > // Create calendar event
     > const event = {
     >     id: tp.file.title,
     >     date: tp.date.now,
     >     title: "Dream: " + tp.file.title,
     >     type: "dream",
     >     metadata: {
     >         vividness: tp.frontmatter.vividness,
     >         emotionalIntensity: tp.frontmatter.emotionalIntensity,
     >         themes: tp.frontmatter.themes?.split(",")
     >     }
     > };
     > tp.calendar.createEvent(event);
     > _%>
     ```

7. **Extended Template Examples**

   a. **Weekly Summary Template**:
   ```markdown
   # Week {{date:ww}} of {{date:YYYY}}
   
   > [!weekly|{{date:YYYYMMDD}}]
   > 
   > ## Weekly Dream Summary
   > 
   > ### Dream Statistics
   > - Total Dreams: {{input:Total dreams this week}}
   > - Average Vividness: {{input:Average vividness}}
   > - Most Common Themes: {{input:Common themes}}
   > 
   > ### Daily Entries
   > <%*
   > const startOfWeek = tp.date.now.startOf('week');
   > const endOfWeek = tp.date.now.endOf('week');
   > const dreams = await tp.calendar.getEvents(startOfWeek, endOfWeek, 'dream');
   > 
   > for (const dream of dreams) {
   >     tR += `- [[${dream.title}]] (${dream.metadata.vividness}/5)\n`;
   > }
   > _%>
   ```

   b. **Monthly Review Template**:
   ```markdown
   # {{date:MMMM}} {{date:YYYY}} Review
   
   > [!monthly|{{date:YYYYMM}}]
   > 
   > ## Monthly Dream Analysis
   > 
   > ### Statistics
   > - Total Dreams: {{input:Total dreams this month}}
   > - Dream Frequency: {{input:Dreams per week}}
   > - Average Vividness: {{input:Average vividness}}
   > 
   > ### Theme Analysis
   > <%*
   > const startOfMonth = tp.date.now.startOf('month');
   > const endOfMonth = tp.date.now.endOf('month');
   > const dreams = await tp.calendar.getEvents(startOfMonth, endOfMonth, 'dream');
   > 
   > // Group by themes
   > const themes = {};
   > dreams.forEach(dream => {
   >     dream.metadata.themes?.forEach(theme => {
   >         themes[theme] = (themes[theme] || 0) + 1;
   >     });
   > });
   > 
   > // Output theme frequency
   > for (const [theme, count] of Object.entries(themes)) {
   >     tR += `- ${theme}: ${count} occurrences\n`;
   > }
   > _%>
   ```

8. **Extended Date Functions**
   ```typescript
   const extendedDateFunctions = {
       // Relative dates
       startOfWeek: (date: Date) => {
           const result = new Date(date);
           const day = result.getDay();
           result.setDate(result.getDate() - day);
           return result;
       },
       
       endOfWeek: (date: Date) => {
           const result = new Date(date);
           const day = result.getDay();
           result.setDate(result.getDate() + (6 - day));
           return result;
       },
       
       // Date ranges
       getDateRange: (start: Date, end: Date) => {
           const dates: Date[] = [];
           const current = new Date(start);
           while (current <= end) {
               dates.push(new Date(current));
               current.setDate(current.getDate() + 1);
           }
           return dates;
       },
       
       // Date formatting
       formatDateRange: (start: Date, end: Date, format: string) => {
           return `${formatDate(start, format)} - ${formatDate(end, format)}`;
       },
       
       // Date validation
       isValidDateRange: (start: Date, end: Date) => {
           return start instanceof Date && 
                  end instanceof Date && 
                  !isNaN(start.getTime()) && 
                  !isNaN(end.getTime()) && 
                  start <= end;
       }
   };
   ```

9. **Error Handling and Recovery**
   ```typescript
   interface PluginError extends Error {
       code: string;
       plugin: string;
       context?: any;
   }

   class PluginErrorHandler {
       static async handleError(error: PluginError): Promise<void> {
           console.error(`Error in ${error.plugin}:`, error);
           
           switch (error.code) {
               case 'CALENDAR_EVENT_CREATE_FAILED':
                   await this.handleCalendarError(error);
                   break;
               case 'TEMPLATER_PARSE_ERROR':
                   await this.handleTemplaterError(error);
                   break;
               case 'PERIODIC_NOTE_CREATE_FAILED':
                   await this.handlePeriodicNoteError(error);
                   break;
               default:
                   await this.handleGenericError(error);
           }
       }
       
       private static async handleCalendarError(error: PluginError): Promise<void> {
           // Attempt to recover calendar event
           if (error.context?.event) {
               try {
                   await app.plugins.plugins.calendar?.api.addEvent(error.context.event);
               } catch (e) {
                   // Log failure and notify user
                   console.error('Failed to recover calendar event:', e);
                   new Notice('Failed to create calendar event. Please try again.');
               }
           }
       }
       
       private static async handleTemplaterError(error: PluginError): Promise<void> {
           // Attempt to recover template
           if (error.context?.template) {
               try {
                   // Save template to backup
                   const backupPath = `${error.context.template}.bak`;
                   await app.vault.create(backupPath, error.context.template);
                   
                   // Notify user
                   new Notice('Template error occurred. Backup created.');
               } catch (e) {
                   console.error('Failed to backup template:', e);
               }
           }
       }
       
       private static async handlePeriodicNoteError(error: PluginError): Promise<void> {
           // Attempt to recover periodic note
           if (error.context?.note) {
               try {
                   // Create note in default location
                   await app.vault.create(
                       `Recovery/${error.context.note.title}.md`,
                       error.context.note.content
                   );
                   
                   // Notify user
                   new Notice('Note creation failed. Recovery copy created.');
               } catch (e) {
                   console.error('Failed to recover note:', e);
               }
           }
       }
       
       private static async handleGenericError(error: PluginError): Promise<void> {
           // Log error and notify user
           console.error('Unhandled plugin error:', error);
           new Notice('An error occurred. Please check the console for details.');
       }
   }
   ```

10. **Plugin Interaction Best Practices**
    - Always check plugin availability before use
    - Handle plugin errors gracefully
    - Maintain data consistency across plugins
    - Use appropriate date formats for each plugin
    - Implement proper error recovery
    - Document plugin dependencies
    - Test plugin interactions thoroughly
    - Monitor plugin performance
    - Keep plugin settings in sync
    - Backup data before major operations

11. **Extended Error Scenarios**
    ```typescript
    interface ExtendedPluginError extends PluginError {
        severity: 'low' | 'medium' | 'high';
        recoveryAttempted: boolean;
        timestamp: Date;
    }

    const errorScenarios = {
        // Calendar Plugin Errors
        calendar: {
            EVENT_CONFLICT: {
                code: 'CALENDAR_EVENT_CONFLICT',
                message: 'Event already exists for this date',
                recovery: async (error: ExtendedPluginError) => {
                    const existingEvent = await app.plugins.plugins.calendar?.api.getEvent(error.context.date);
                    if (existingEvent) {
                        // Merge metadata
                        const mergedEvent = {
                            ...existingEvent,
                            metadata: {
                                ...existingEvent.metadata,
                                ...error.context.event.metadata
                            }
                        };
                        await app.plugins.plugins.calendar?.api.updateEvent(mergedEvent);
                    }
                }
            },
            INVALID_DATE_RANGE: {
                code: 'CALENDAR_INVALID_RANGE',
                message: 'Invalid date range for recurring events',
                recovery: async (error: ExtendedPluginError) => {
                    // Adjust date range to valid period
                    const adjustedRange = adjustDateRange(error.context.range);
                    return adjustedRange;
                }
            }
        },

        // Templater Errors
        templater: {
            TEMPLATE_SYNTAX_ERROR: {
                code: 'TEMPLATER_SYNTAX_ERROR',
                message: 'Invalid template syntax',
                recovery: async (error: ExtendedPluginError) => {
                    // Attempt to fix common syntax errors
                    const fixedTemplate = fixTemplateSyntax(error.context.template);
                    return fixedTemplate;
                }
            },
            VARIABLE_NOT_FOUND: {
                code: 'TEMPLATER_VARIABLE_NOT_FOUND',
                message: 'Required template variable not found',
                recovery: async (error: ExtendedPluginError) => {
                    // Provide default values for missing variables
                    return provideDefaultValues(error.context.variables);
                }
            }
        },

        // Periodic Notes Errors
        periodic: {
            INVALID_PERIOD_FORMAT: {
                code: 'PERIODIC_INVALID_FORMAT',
                message: 'Invalid period format',
                recovery: async (error: ExtendedPluginError) => {
                    // Convert to valid format
                    return convertToValidFormat(error.context.period);
                }
            },
            PERIOD_OVERLAP: {
                code: 'PERIODIC_OVERLAP',
                message: 'Period overlaps with existing note',
                recovery: async (error: ExtendedPluginError) => {
                    // Resolve overlap by adjusting period
                    return resolvePeriodOverlap(error.context.period);
                }
            }
        }
    };
    ```

12. **Performance Optimization Strategies**
    ```typescript
    class PerformanceOptimizer {
        // Cache management
        private static cache = new Map<string, any>();
        private static cacheTimeout = 5 * 60 * 1000; // 5 minutes

        // Batch operations
        static async batchCalendarEvents(events: CalendarEvent[]): Promise<void> {
            const batchSize = 50;
            for (let i = 0; i < events.length; i += batchSize) {
                const batch = events.slice(i, i + batchSize);
                await Promise.all(batch.map(event => 
                    app.plugins.plugins.calendar?.api.addEvent(event)
                ));
            }
        }

        // Lazy loading
        static async lazyLoadEvents(date: Date): Promise<CalendarEvent[]> {
            const cacheKey = `events_${date.toISOString()}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const events = await app.plugins.plugins.calendar?.api.getEvents(date);
            this.cache.set(cacheKey, events);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
            return events;
        }

        // Debounced updates
        static debounce<T extends (...args: any[]) => any>(
            func: T,
            wait: number
        ): (...args: Parameters<T>) => void {
            let timeout: NodeJS.Timeout;
            return (...args: Parameters<T>) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        }

        // Optimized date parsing
        static parseDateOptimized(dateStr: string): Date | null {
            // Use cached regex patterns
            const patterns = {
                iso: /^\d{4}-\d{2}-\d{2}$/,
                compact: /^\d{8}$/,
                period: /^(\d{4})-([Qq]\d|[Ww]\d{2}|\d{2})$/
            };

            // Quick format check
            if (patterns.iso.test(dateStr)) {
                return new Date(dateStr);
            }
            if (patterns.compact.test(dateStr)) {
                return new Date(
                    dateStr.slice(0, 4),
                    parseInt(dateStr.slice(4, 6)) - 1,
                    dateStr.slice(6, 8)
                );
            }
            if (patterns.period.test(dateStr)) {
                return this.parsePeriodDate(dateStr);
            }
            return null;
        }
    }
    ```

13. **Additional Template Variations**
    ```markdown
    a. **Dream Analysis Template**:
    ```markdown
    # Dream Analysis: {{date:YYYY-MM-DD}}
    
    > [!dream-analysis|{{date:YYYYMMDD}}]
    > 
    > ## Dream Content
    > {{content}}
    > 
    > ## Analysis
    > ### Emotional Analysis
    > - Primary Emotion: {{input:Primary emotion}}
    > - Emotional Intensity: {{input:Intensity (1-5)}}
    > - Emotional Context: {{input:Context}}
    > 
    > ### Symbol Analysis
    > - Key Symbols: {{input:Key symbols}}
    > - Symbol Interpretation: {{input:Interpretation}}
    > - Cultural Context: {{input:Cultural context}}
    > 
    > ### Pattern Recognition
    > <%*
    > const recentDreams = await tp.calendar.getEvents(
    >     tp.date.now.addDays(-30),
    >     tp.date.now,
    >     'dream'
    > );
    > 
    > // Find recurring patterns
    > const patterns = findPatterns(recentDreams);
    > for (const pattern of patterns) {
    >     tR += `- ${pattern.theme}: ${pattern.frequency} occurrences\n`;
    > }
    > _%>
    ```

    b. **Dream Journal Dashboard**:
    ```markdown
    # Dream Journal Dashboard
    
    > [!dashboard]
    > 
    > ## Recent Dreams
    > <%*
    > const recentDreams = await tp.calendar.getEvents(
    >     tp.date.now.addDays(-7),
    >     tp.date.now,
    >     'dream'
    > );
    > 
    > for (const dream of recentDreams) {
    >     tR += `### [[${dream.title}]]\n`;
    >     tR += `- Date: ${formatDate(dream.date, 'YYYY-MM-DD')}\n`;
    >     tR += `- Vividness: ${dream.metadata.vividness}/5\n`;
    >     tR += `- Themes: ${dream.metadata.themes.join(', ')}\n\n`;
    > }
    > _%>
    > 
    > ## Dream Statistics
    > <%*
    > const stats = calculateDreamStats(recentDreams);
    > tR += `- Average Vividness: ${stats.avgVividness}\n`;
    > tR += `- Most Common Theme: ${stats.commonTheme}\n`;
    > tR += `- Dream Frequency: ${stats.frequency} per week\n`;
    > _%>
    ```

14. **Enhanced Calendar Features**
    ```typescript
    interface EnhancedCalendarEvent extends CalendarEvent {
        recurrence?: {
            frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
            interval: number;
            endDate?: Date;
        };
        reminders?: {
            time: Date;
            type: 'notification' | 'email' | 'both';
        }[];
        categories?: string[];
        priority?: 'low' | 'medium' | 'high';
    }

    class EnhancedCalendar {
        // Recurring events
        static async createRecurringEvent(event: EnhancedCalendarEvent): Promise<void> {
            if (!event.recurrence) return;

            const events = this.generateRecurringEvents(event);
            await PerformanceOptimizer.batchCalendarEvents(events);
        }

        // Event categories
        static async getEventsByCategory(category: string): Promise<EnhancedCalendarEvent[]> {
            const allEvents = await app.plugins.plugins.calendar?.api.getAllEvents();
            return allEvents.filter(event => 
                event.categories?.includes(category)
            );
        }

        // Event reminders
        static async setEventReminder(
            eventId: string,
            reminder: EnhancedCalendarEvent['reminders'][0]
        ): Promise<void> {
            const event = await app.plugins.plugins.calendar?.api.getEvent(eventId);
            if (event) {
                event.reminders = [...(event.reminders || []), reminder];
                await app.plugins.plugins.calendar?.api.updateEvent(event);
            }
        }

        // Event prioritization
        static async prioritizeEvents(
            events: EnhancedCalendarEvent[],
            priority: EnhancedCalendarEvent['priority']
        ): Promise<void> {
            const updates = events.map(event => ({
                ...event,
                priority
            }));
            await PerformanceOptimizer.batchCalendarEvents(updates);
        }
    }
    ```

### Layout Compatibility Note

The date-based callouts in this specification are compatible with the [Modular CSS Layout (MCL)](https://efemkay.github.io/obsidian-modular-css-layout/) snippet collection. This means you can use MCL's styling features with the date callouts without any conflicts. For example:

```markdown
> [!journal-entry|20250513] Multi-column
> 
> > [!dream-content] Column 1
> > Dream content here...
> > 
> > > [!dream-metrics] Column 2
> > > - Vividness: 4
> > > - Emotional Intensity: 3
```

For detailed information about layout options and styling, please refer to the [Layout and Styling Technical Specification](LAYOUT_AND_STYLING.md).

---

*Last updated: May 12, 2025*

## Dream Entry Date Extraction Priority (2025 Update)

When extracting the date for each dream entry, OneiroMetrics now uses the following priority order:

1. **Block Reference** (`^YYYYMMDD`) on the callout line or the next line.
2. **Date in the Callout Line** (e.g., "Monday, January 6, 2025").
3. **YAML `created` Field** (parse the date part, e.g., `created: 20241229 16:07:34 pm` → `2024-12-29`).
4. **YAML `modified` Field** (as a fallback if `created` is missing).
5. **Folder or Filename** (extracts year if that's all that's available, e.g., `Journals/2025/2025.md` → `2025`).
6. **Current Date** (only if all else fails).

This order is robust for both daily-note and year-note journal structures. The extraction logic will always use the most specific date available, and gracefully fall back to less specific options if needed.

- For daily note users, folder/filename can provide a full date.
- For year note users, folder/filename will only provide a year, so YAML or callout/block reference is preferred.

The implementation is in the `getDreamEntryDate` helper function in `main.ts`. 

---

**Note:**
All debug and backup log files are now stored in the `logs/` folder (e.g., `logs/oom-debug-log.txt`, `logs/oom-debug-log.backup-*.txt`). Update any references to log file paths accordingly. 