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
- Year-based paths are suggested automatically (e.g., typing "2024" suggests "Journals/2024/2024.md")
- The file will be created if it doesn't exist
- **Note**: The plugin will create backups before making changes

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

### Managing Metrics
- Drag and drop to reorder metrics
- Use the edit button to modify existing metrics
- Use the delete button to remove metrics
- Changes are saved automatically
- Reset to defaults while preserving custom metrics

## Adding Dream Metrics

### Callout Format
Use the following format in your dream journal entries:

```markdown
> [!dream-metrics]
> lucidity: 7, vividness: 8, emotional-intensity: 6
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
- Responsive design for all screen sizes
- Theme-aware styling

### Backup System
- Automatic backups are created before each update
- Backup files are named with timestamps
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
  Dreams/2024.md
  ```

### File Suggestions
- Smart path matching for:
  - Spaces, dashes, underscores
  - Case-insensitive matching
  - Year-based paths
- Real-time validation and feedback
- Easy navigation through suggestions

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
   - They are marked with a 💾 icon in the file explorer
   - You can safely delete old backups

4. **Table Display Issues**
   - Check if the table is properly contained within the table container
   - Verify that the readable line length setting isn't affecting the table
   - Ensure your theme supports the table styling

### Getting Help
- Check the plugin settings for configuration options
- Review the validation messages for specific issues
- Visit the GitHub repository for updates and support
- Check the console for detailed error messages 