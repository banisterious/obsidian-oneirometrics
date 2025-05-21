# CSV Export Technical Implementation

## Overview
The CSV export functionality allows users to export their dream metrics data in a structured CSV format, suitable for analysis in spreadsheet software. This document outlines the technical implementation details, including data structures, file format specifications, and code examples.

## Table of Contents
- [Overview](#overview)
- [Requirements](#requirements)
  - [Functional Requirements](#functional-requirements)
  - [Technical Requirements](#technical-requirements)
- [Implementation](#implementation)
  - [Core Export Function](#core-export-function)
  - [CSV Generation](#csv-generation)
  - [UI Integration](#ui-integration)
- [Usage Examples](#usage-examples)
  - [Basic Export](#basic-export)
  - [Export with Custom Location](#export-with-custom-location)
- [Testing](#testing)
  - [Basic Test Cases](#basic-test-cases)
- [Maintenance](#maintenance)
  - [Regular Tasks](#regular-tasks)
- [Future Enhancements](#future-enhancements)

## Requirements

### Functional Requirements
1. **Export Button**
   - Add a CSV export button to the metrics note
   - Button should be clearly visible and accessible
   - Include a tooltip explaining the export functionality

2. **Export Content**
   - Export both summary and detailed metrics
   - Include all configured metrics
   - Preserve date formatting
   - Include dream titles and content

3. **File Handling**
   - Generate a valid CSV file
   - Use appropriate file naming convention
   - Handle special characters and escaping
   - Support UTF-8 encoding

4. **User Experience**
   - Show success/error feedback
   - Remember last export location

### Technical Requirements

1. **Data Structure**
   ```typescript
   interface CSVExportData {
       summary: {
           metricName: string;  // Name of the metric (e.g., "Lucid", "Vivid")
           average: number;     // Average value for this metric
           min: number;         // Minimum value recorded
           max: number;         // Maximum value recorded
           count: number;       // Number of dreams with this metric
       }[];
       details: {
           date: string;        // ISO date string (YYYY-MM-DD)
           title: string;       // Dream title
           content: string;     // Dream content (may contain newlines)
           wordCount: number;   // Number of words in the dream
           metrics: Record<string, number>;  // Metric values for this dream
       }[];
   }

   // Example data
   const exampleData: CSVExportData = {
       summary: [
           {
               metricName: "Lucid",
               average: 0.75,
               min: 0,
               max: 1,
               count: 100
           }
       ],
       details: [
           {
               date: "2024-01-01",
               title: "Flying Dream",
               content: "I was flying over mountains...",
               wordCount: 150,
               metrics: { "Lucid": 1 }
           }
       ]
   };
   ```

2. **CSV Format**
   - Use standard CSV format with comma delimiter
   - Properly escape fields containing commas
   - Include headers for all columns
   - Support multiline content
   - Use UTF-8 encoding for special characters
   - Handle null/undefined values as empty strings

3. **File Naming**
   - Format: `oneirometrics-export-YYYYMMDD.csv`
   - Include date to prevent overwrites
   - Use consistent date format

## Implementation

### Core Export Function
```typescript
async function exportToCSV(data: CSVExportData): Promise<void> {
    try {
        // Generate CSV content
        const csv = generateCSV(data);
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `oneirometrics-export-${timestamp}.csv`;
        
        // Check if file exists
        const existingFile = app.vault.getAbstractFileByPath(filename);
        if (existingFile) {
            throw new Error(`File ${filename} already exists`);
        }
        
        // Save to vault
        await app.vault.create(filename, csv);
        
        // Show success message
        new Notice('Export completed successfully');
    } catch (error) {
        // Enhanced error handling
        let errorMessage = 'Export failed: ';
        if (error.message.includes('already exists')) {
            errorMessage += 'File already exists. Please choose a different name.';
        } else if (error.message.includes('permission')) {
            errorMessage += 'Permission denied. Please check vault settings.';
        } else {
            errorMessage += error.message;
        }
        new Notice(errorMessage);
    }
}
```

### CSV Generation
```typescript
function generateCSV(data: CSVExportData): string {
    const rows = [];
    
    // Add headers
    rows.push(['Date', 'Title', 'Content', 'Word Count', ...Object.keys(data.summary)]);
    
    // Add data rows
    for (const entry of data.details) {
        rows.push([
            entry.date || '',
            entry.title || '',
            // Handle multiline content by replacing newlines with spaces
            (entry.content || '').replace(/\n/g, ' '),
            entry.wordCount?.toString() || '0',
            ...Object.keys(data.summary).map(metric => 
                entry.metrics[metric]?.toString() || '0'
            )
        ]);
    }
    
    // Convert to CSV string with proper escaping
    return rows.map(row => 
        row.map(cell => {
            const str = String(cell);
            // Escape quotes and wrap in quotes if needed
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(',')
    ).join('\n');
}
```

### UI Integration
```typescript
new Setting(containerEl)
    .setName('Export to CSV')
    .setDesc('Export metrics data to CSV format')
    .addButton(button => {
        button
            .setButtonText('Export')
            .setTooltip('Export metrics to CSV')
            .onClick(async () => {
                try {
                    await exportToCSV(data);
                } catch (error) {
                    console.error('Export failed:', error);
                }
            });
    });
```

## Usage Examples

### Basic Export
```typescript
// Export all metrics
await exportToCSV(data);
```

### Export with Custom Location
```typescript
// Export to specific folder
const filename = `exports/oneirometrics-export-${new Date().toISOString().split('T')[0]}.csv`;
await app.vault.create(filename, generateCSV(data));
```

## Testing

### Basic Test Cases
1. **Export Functionality**
   - Verify CSV file is created
   - Check file content format
   - Validate data accuracy
   - Test error handling
   - Verify UTF-8 encoding
   - Check multiline content handling

2. **UI Integration**
   - Test export button
   - Verify success/error messages
   - Check tooltip display
   - Test button state during export

3. **Edge Cases**
   - Empty dataset
   - Large dataset (1000+ entries)
   - Special characters in content
   - Missing or null values
   - File already exists
   - Insufficient permissions

4. **Data Validation**
   - Verify all metrics are included
   - Check date formatting
   - Validate number formatting
   - Test content escaping
   - Verify word count accuracy

## Maintenance

### Regular Tasks
1. **Updates**
   - Keep up with Obsidian API changes
   - Update documentation as needed
   - Test with new Obsidian versions

2. **Support**
   - Address user feedback
   - Fix reported issues
   - Improve error messages

## Future Enhancements

1. **Export Options**
   - Custom date ranges
   - Selected metrics only
   - Different file formats

2. **UI Improvements**
   - Export progress indicator
   - Custom export location
   - Export templates

## Related Documentation
- [Metrics Reference](../../user/reference/metrics.md)
- [Date and Time Handling](./date-time.md)
- [State Persistence](./state.md)
- [UI Testing](../testing/ui-testing.md) 