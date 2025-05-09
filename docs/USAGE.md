# Dream Metrics Usage Guide

This guide provides detailed instructions and examples for using the Dream Metrics plugin.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dream Note Format](#dream-note-format)
3. [Plugin Settings](#plugin-settings)
4. [Using the Plugin](#using-the-plugin)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Click "Browse" and search for "Dream Metrics"
4. Click Install
5. Enable the plugin

### Initial Setup

1. Create a new note for your dream metrics (e.g., `Dreams/Metrics.md`)
2. Open the plugin settings
3. Set the project note path to your metrics note
4. Add your dream journal notes to the selected notes list

## Dream Note Format

### Basic Format

Add a callout block to your dream journal entries:

```markdown
> [!dream-metrics]
> Words: 343, Sensory Detail: 3, Emotional Recall: 3, Lost Segments: 3, Descriptiveness: 4, Confidence Score: 4
```

### Metric Guidelines

#### Sensory Detail (1-5)
- 1: Minimal sensory information
- 2: Basic sights or sounds
- 3: Moderate sensory details
- 4: Rich sensory experience
- 5: Vivid across all senses

#### Emotional Recall (1-5)
- 1: Vague emotional sense
- 2: Basic emotion identified
- 3: Specific emotions
- 4: Nuanced emotions
- 5: Complex emotional landscape

#### Lost Segments (0-10)
- Count distinct gaps in dream memory
- Example: "I remember the beginning and end, but the middle is missing" = 1

#### Descriptiveness (1-5)
- 1: Basic outline
- 2: Simple account
- 3: Detailed description
- 4: Rich details
- 5: Vivid imagery

#### Confidence Score (1-5)
- 1: Very uncertain
- 2: Somewhat uncertain
- 3: Moderately confident
- 4: Very confident
- 5: Completely certain

## Plugin Settings

### Project Note Path
- Set the path to your metrics aggregation note
- Example: `Dreams/Metrics.md`

### Selected Notes
- Add paths to your dream journal notes
- One path per line
- Example:
  ```
  Journal/2025/Dreams.md
  Journal/2025/May.md
  ```

### Callout Name
- Default: `dream-metrics`
- Can be customized
- Will be converted to lowercase with hyphens

### Custom Metrics
1. Click "Add Metric"
2. Set name, range, and description
3. Use in your dream notes

## Using the Plugin

### Quick Access
1. Click the ribbon icon (dream icon)
2. Or use the command palette: "Open Dream Metrics"

### Scraping Metrics
1. Open the modal
2. Verify settings
3. Click "Scrape"
4. View results in your project note

### Project Note
- Automatically generated table
- Sortable columns
- Date and title extraction
- Metric values

## Best Practices

### Dream Notes
1. **Consistent Format**
   - Use the same callout format
   - Keep metrics on one line
   - Use consistent spacing

2. **Metric Values**
   - Stay within defined ranges
   - Be consistent with scoring
   - Document any special cases

3. **Organization**
   - Use clear note titles
   - Include dates in filenames
   - Group related dreams

### Plugin Usage
1. **Regular Updates**
   - Scrape metrics regularly
   - Review and validate data
   - Update custom metrics as needed

2. **Backup**
   - Keep backups of your metrics note
   - Export data periodically
   - Document any changes

## Troubleshooting

### Common Issues

1. **Metrics Not Found**
   - Check callout format
   - Verify note paths
   - Ensure plugin is enabled

2. **Invalid Values**
   - Check metric ranges
   - Verify number format
   - Look for typos

3. **Missing Data**
   - Check file permissions
   - Verify note exists
   - Check for errors in console

### Getting Help

1. **Documentation**
   - Check this guide
   - Review README.md
   - Check GitHub repository

2. **Support**
   - GitHub Issues
   - Community Forum
   - Discord Server

3. **Feedback**
   - Feature requests
   - Bug reports
   - Improvement suggestions 