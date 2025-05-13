# OneiroMetrics Usage Guide

## Quick Start

1. Install the plugin from the Obsidian Community Plugins
2. Open Settings > Community Plugins > OneiroMetrics
3. Configure your metrics and project note path
4. Add dream metrics to your notes using the callout format
5. Use the ribbon icon or command palette to analyze your dreams

## Configuring Metrics

### Project Note Path
- Set the path where your metrics table will be stored
- Use the smart file suggestion system to easily select an existing file
- Supports paths with spaces and special characters
- Year-based paths are suggested automatically (e.g., typing "2025" suggests "Journals/2025/2025.md")
- The file will be created if it doesn't exist
- **Note**: The plugin will create backups before making changes
- Use the Open Metrics Note button for quick access to your metrics note

### Metric Editor
- Click the "Edit Metrics" button to open the metric editor
- Add, edit, or remove metrics with real-time validation
- Configure validation rules for each metric
- Preview how metrics will appear in your notes
- Use keyboard shortcuts for efficient editing:
  - Enter: Save changes
  - Esc: Cancel
  - Tab: Next field
  - Shift+Tab: Previous field
- Customize metric icons using the icon picker
- View detailed metric descriptions in the Metrics Description section

### Managing Metrics
- Drag and drop to reorder metrics
- Use the edit button to modify existing metrics
- Use the delete button to remove metrics
- Changes are saved automatically
- Reset to defaults while preserving custom metrics
- Customize icons for better visual organization

## Adding Dream Metrics

### Callout Format
Use the following format in your dream journal entries:

```markdown
> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Lost Segments: 2, Descriptiveness: 3, Confidence Score: 5
```

#### Complete Sample Journal Entry

```markdown
---
title: 2025-05-06
tags: [journal, dream, lucid]
date: 2025-05-06
---

> [!journal-entry] 2025-05-06
> ^20250506
> 
> ### 7:00am
>
>> [!dream-diary] Moonlight Painting [[2025-05-06]]
>> I was painting the wind with a brush made of moonlight. Each stroke created invisible ripples that rustled the leaves on silent trees. The colors of the wind were feelings: joy was a vibrant gold, sorrow a deep blue. A flock of paper cranes soared past, carrying the scent of distant memories.
>>
>> [!dream-metrics]
>> Words: 50, Sensory Detail: 3, Emotional Recall: 1, Lost Segments: 3, Descriptiveness: 4, Confidence Score: 5
> 
> ### 5:00pm
> 
> The rain outside mirrors the quiet unease within. Today, the old oak in the backyard seemed to sigh as the wind rustled its new leaves. I found a robin's eggshell, a fragile blue fragment, under the porch swing – a tiny echo of a life begun and ended. The sourdough starter is bubbling vigorously; a small victory in the face of a persistent melancholy I can't quite place. Perhaps a walk in Forest Park tomorrow will shake it off. The scent of damp earth always helps.
> 
> The city hums a low thrum. Coffee steams. The sky, a bruised purple, promises even more rain. A quiet Tuesday unfolds.
```

### Validation
- Metrics are validated in real-time
- Invalid values are highlighted
- Hover over the callout for validation details
- Suggestions appear for common errors
- Real-time feedback on metric ranges

## Analyzing Dreams

### Scraping Metrics
1. Click the ribbon icon or use the command palette
2. Select "Scrape Metrics" to analyze your dreams
3. The plugin will:
   - Create a backup of your project note
   - Show a confirmation dialog
   - Update the metrics table
   - Preserve any content before/after the table

### Metrics Table
The generated table includes two main sections:

#### Summary Section
- Average values for each metric
- Minimum and maximum values
- Number of entries analyzed
- Total word count statistics

#### Detailed Section
- Date and title (with clickable links)
- Word count for each entry
- Expandable/collapsible content preview
- All configured metrics
- Optimized column widths:
  - Date: 8%
  - Title: 15%
  - Words: 7%
  - Content: 30%
  - Metrics: 8% each

### Table Features
- Full-width layout (overrides readable line length)
- Center-aligned numeric metrics
- Sortable columns
- Date range and metric filtering
- 'This Week' filter with configurable week start day
- Responsive design for all screen sizes
- Theme-aware styling
- Readable Line Length toggle for table width control

### Backup System
- Automatic backups are created before each update
- Backup files are named with timestamps
- Backups use .bak extension for better organization
- Backups are visually distinct in the file explorer
- You can restore from backups if needed

## Multi-Note Selection

### Note Selection
- Use the multi-chip autocomplete field to select notes
- Add or remove notes easily
- Supports multiple note paths
- Example format:
  ```
  Journal/Journal.md
  Dreams/2025.md
  ```

### File Suggestions
- Smart path matching for:
  - Spaces, dashes, underscores
  - Case-insensitive matching
  - Year-based paths
- Real-time validation and feedback
- Easy navigation through suggestions

## Date and Time Features

For detailed information about date and time handling, including block references, time filters, and calendar integration, see the [Date and Time Technical Specification](DATE_TIME_TECHNICAL.md).

## Layout and Styling

For comprehensive information about layout options, styling features, and theme integration, see the [Layout and Styling Technical Specification](LAYOUT_AND_STYLING.md).

## State Persistence

The plugin maintains your preferences across sessions, including expanded/collapsed states for dream entries. For detailed information about state persistence features and implementation, see the [State Persistence](STATE_PERSISTENCE.md) documentation.

## Troubleshooting

### Common Issues
1. **Invalid Metric Values**
   - Check the validation rules in settings
   - Ensure values are within the specified range
   - Use the correct format in callouts

2. **Missing Metrics**
   - Verify the callout name matches your settings
   - Check for typos in metric names
   - Ensure the callout is properly formatted

3. **Backup Files**
   - Backup files are stored in the same directory as your project note
   - They use .bak extension for better organization
   - You can safely delete old backups

4. **Table Display Issues**
   - Use the Readable Line Length toggle to control table width
   - Check if the table is properly contained within the table container
   - Verify that the readable line length setting isn't affecting the table
   - Ensure your theme supports the table styling

### Getting Help
- Check the plugin settings for configuration options
- Review the validation messages for specific issues
- Visit the GitHub repository for updates and support
- Check the console for detailed error messages 