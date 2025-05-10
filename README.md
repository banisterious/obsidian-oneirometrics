# OneiroMetrics

A plugin for Obsidian that turns dreams into data by tracking and analyzing dream journal metrics.

## Features

- Track multiple customizable metrics for each dream entry
- Automatically scrape metrics from dream journal entries
- Generate detailed analysis tables with sortable columns
- Filter entries by date range and specific metrics
- Backup system to protect your data
- Customizable settings for metrics and data management
- Multi-chip autocomplete for selecting notes to analyze, now improved in both settings and modal: only real, existing markdown files can be selected (not folders or non-existent files).

## Setup

1. Install the plugin through Obsidian's Community Plugins browser
2. Enable the plugin in Obsidian's settings
3. Configure your settings:
   - Set your project note path where metrics tables will be written
   - Select your dream journal notes to analyze
   - Configure backup settings (optional)
   - Customize metrics as needed

## Settings

### Project Note
- **Project Note Path**: The path where metrics tables will be written
- **Selected Notes**: Choose which notes to analyze for dream metrics

### Backup Settings
- **Enable Backups**: Toggle to enable/disable automatic backups (enabled by default)
- **Backup Folder**: Select an existing folder where backups will be stored
- **Note**: Backups are created automatically before any changes to the project note

### Metrics Configuration
- Add, edit, or remove metrics
- Each metric includes:
  - Name
  - Valid range (min/max)
  - Description
- Default metrics provided:
  - Sensory Detail (1-5)
  - Emotional Recall (1-5)
  - Lost Segments (0-10)
  - Descriptiveness (1-5)
  - Confidence Score (1-5)

## Usage

### Adding Dream Metrics
Add metrics to your dream entries using the following callout format:

```markdown
> [!dream-metrics]
> Sensory Detail: 4
> Emotional Recall: 3
> Lost Segments: 2
> Descriptiveness: 4
> Confidence Score: 5
```

### Analyzing Dreams
1. Open OneiroMetrics from the ribbon icon or command palette
2. Select the notes you want to analyze
3. Click "Scrape Metrics" to generate analysis
4. View your metrics tables in the project note

### Using Backups
1. Enable backups in settings (enabled by default)
2. Select an existing folder for storing backups
3. Backups are automatically created before any changes
4. Each backup includes a timestamp for easy reference

## Tips
- Create a dedicated folder for backups to keep your vault organized
- Regular backups are recommended when making significant changes
- Use the date range and metric filters to focus on specific aspects of your dreams
- Sort table columns to identify patterns in your dream journal

## Support
If you encounter any issues or have suggestions, please:
1. Check the GitHub issues page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## License
MIT License - see LICENSE file for details 