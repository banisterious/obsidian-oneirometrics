# OneiroMetrics Usage Guide

## Quick Start

1. Install the plugin from the Obsidian Community Plugins
2. Configure your metrics in the plugin settings
3. Add dream metrics to your journal entries
4. Use the ribbon icon or command palette to analyze your dreams

## Configuring Metrics

### Using the Metric Editor

1. Open the plugin settings (Settings > OneiroMetrics)
2. Click "Add Metric" to create a new metric
3. In the metric editor:
   - Enter a name (letters, numbers, spaces, and hyphens only)
   - Set the valid range (minimum and maximum values)
   - Add a description
   - Use the live preview to see how it will appear
   - Press Enter to save or Esc to cancel

### Managing Metrics

- **Reordering**: Drag metrics using the grip handle or use the up/down arrows
- **Editing**: Click the pencil icon to modify a metric
- **Deleting**: Click the trash icon to remove a metric
- **Resetting**: Use "Reset to Defaults" to restore default metrics while preserving custom ones

### Project Note Path

The Project Note Path field includes autocomplete functionality:
- Start typing to see matching markdown files
- Click a suggestion to select it
- Suggestions are limited to 5 matches
- Click outside to hide suggestions

### Default Metrics

The plugin comes with five default metrics:

1. **Sensory Detail (1-5)**
   - Level of sensory information recalled from the dream

2. **Emotional Recall (1-5)**
   - Level of emotional detail recalled from the dream

3. **Lost Segments (0-10)**
   - Number of distinct instances where parts of the dream are missing

4. **Descriptiveness (1-5)**
   - Level of detail in the dream description

5. **Confidence Score (1-5)**
   - Confidence level in the completeness of dream recall

## Adding Dream Metrics

Add metrics to your dream journal entries using callouts:

```markdown
> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Lost Segments: 2
```

### Tips for Adding Metrics

- Use the preview in the metric editor to see the correct format
- Values must be within the defined range for each metric
- Separate multiple metrics with commas
- Use the exact metric names as defined in settings

## Analyzing Dreams

### Using the Ribbon Icon

1. Click the shell icon in the ribbon
2. Configure the project note path (with autocomplete suggestions)
3. Select the notes to analyze
4. Click "Scrape" to collect metrics

### Using the Command Palette

1. Press `Ctrl+P` (or `Cmd+P` on Mac)
2. Type "OneiroMetrics"
3. Choose "Open OneiroMetrics" or "Scrape Metrics"

## Viewing Results

The plugin generates a table in your project note showing:

- Average values for each metric
- Minimum and maximum values
- Number of entries analyzed
- Word count statistics

## Keyboard Shortcuts

In the metric editor:
- `Enter`: Save changes
- `Esc`: Cancel
- `Tab`: Next field
- `Shift+Tab`: Previous field

## Troubleshooting

### Common Issues

1. **Metrics not appearing in results**
   - Check that the callout name matches your settings
   - Verify that the metric names match exactly
   - Ensure values are within the defined ranges

2. **File not found errors**
   - Use the autocomplete suggestions to select valid files
   - Verify the project note path
   - Check that selected notes exist
   - Ensure paths are relative to your vault root

3. **Invalid metric values**
   - Use only numbers within the defined range
   - Don't include units or additional text
   - Separate multiple metrics with commas

### Getting Help

If you encounter issues:
1. Check the [GitHub repository](https://github.com/banisterious/oneirometrics)
2. Review the [Technical Specification](SPECIFICATION.md)
3. Submit an issue with details about the problem 