# Dream Metrics Guide

> **Applies to:** OneiroMetrics v1.0.0 and above  
> **Last Updated:** 2025-05-21

## Overview

This guide shows you how to work with dream metrics in OneiroMetrics - from adding metrics to your journal entries to analyzing patterns and customizing your metrics system. Dream metrics allow you to quantify aspects of your dream experiences, making it possible to track changes and identify patterns over time.

## Table of Contents
- [Working with Dream Metrics](#working-with-dream-metrics)
- [Adding Metrics to Journal Entries](#adding-metrics-to-journal-entries)
- [Analyzing Dream Metrics](#analyzing-dream-metrics)
- [Customizing Metrics](#customizing-metrics)
- [Advanced Metrics Usage](#advanced-metrics-usage)
- [Data Export and External Analysis](#data-export-and-external-analysis)
- [Troubleshooting](#troubleshooting)
- [Related Features](#related-features)

## Working with Dream Metrics

### Understanding Dream Metrics

Dream metrics in OneiroMetrics are numerical values assigned to different aspects of dreams:

- **Standard Metrics**: Pre-defined metrics like Sensory Detail, Emotional Recall, etc.
- **Custom Metrics**: User-defined metrics tailored to specific interests
- **Special Metrics**: Word count and other automatically generated metrics

For a conceptual overview of dream metrics and their significance, see [Dream Metrics Concepts](../concepts/dream-metrics.md).

### Default Metrics

OneiroMetrics comes with several built-in metrics:

| Metric | Description | Range | When to Use |
|--------|-------------|-------|-------------|
| Sensory Detail | Vividness of sensory experiences | 1-5 | Rate how vividly you experienced sensations (sight, sound, touch, etc.) |
| Emotional Recall | Ability to recall emotions | 1-5 | Rate how clearly you remember the emotions felt in the dream |
| Descriptiveness | Detail level in written description | 1-5 | Rate how detailed your written account is |
| Characters Role | Prominence of characters | 1-5 | Rate the significance of characters in the dream narrative |
| Confidence Score | Confidence in your memory | 1-5 | Rate how confident you are in remembering the dream correctly |
| Characters Count | Number of characters appearing | Any whole number | Count distinct characters/entities in the dream |
| Familiar Count | Number of familiar people/entities | Any whole number | Count people or entities you recognize from waking life |
| Unfamiliar Count | Number of unfamiliar entities | Any whole number | Count people or entities that were new/unknown to you |

### Metric Rating Scales

For metrics using the 1-5 scale, consider these guidelines:

- **1**: Very low/poor (minimal, barely noticeable)
- **2**: Below average (present but limited)
- **3**: Average (moderately present, typical)
- **4**: Above average (strong, notable)
- **5**: Exceptional (extremely vivid, detailed, or strong)

## Adding Metrics to Journal Entries

### Basic Metrics Format

Add metrics to your dream journal entries using callout blocks:

```markdown
> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 3, Confidence Score: 5
```

Metrics must follow these formatting rules:
- Start with the metrics callout (default is `dream-metrics`)
- List metrics as name-value pairs separated by colons
- Separate each metric with a comma
- Use consistent metric names matching your settings
- Values must be within the defined ranges

### Using Templates

For consistency, use templates to add metrics to your entries:

1. Create a template with the Dream Journal Manager
2. Add placeholder metrics with default values
3. Insert the template when creating new entries
4. Adjust the metric values to match your dream experience

### Metrics in Different Journal Structures

#### Flat Structure
```markdown
# Dream Journal Entry: 2025-05-20

I dreamed about flying over mountains...

> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 3, Confidence Score: 5
```

#### Nested Structure
```markdown
> [!journal-entry] 2025-05-20
> 
> ## Morning Dream
>
>> [!dream-diary] Mountain Flight
>> I dreamed about flying over mountains...
>>
>> [!dream-metrics]
>> Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 3, Confidence Score: 5
```

### Metrics with Callout Metadata

You can add metadata to control how metrics display:

```markdown
> [!dream-metrics|hide]
> Sensory Detail: 4, Emotional Recall: 3

> [!dream-metrics|compact]
> Sensory Detail: 4, Emotional Recall: 3

> [!dream-metrics|summary]
> Sensory Detail: 4, Emotional Recall: 3
```

- **hide**: Hides metrics in reading view (useful for personal/sensitive metrics)
- **compact**: Shows metrics in a condensed format
- **summary**: Highlights metrics as particularly important

## Analyzing Dream Metrics

### Generating Metrics Tables

To analyze your dream metrics:

1. Open the Dream Journal Manager (via ribbon icon or command palette)
2. Go to the Dream Scraper tab
3. Select the notes containing your dream entries
4. Click "Scrape Metrics"
5. Wait for the analysis to complete
6. Your metrics note will open with the results

### Understanding the Summary Table

The Dream Metrics Summary table shows:

- **Average**: Mean value for each metric across all entries
- **Min**: Lowest recorded value for each metric
- **Max**: Highest recorded value for each metric
- **Count**: Number of entries with this metric

This gives you a quick overview of your dream patterns and typical experiences.

### Working with the Dream Entries Table

The detailed Dream Entries table displays:

- **Date**: When the dream occurred (with link to original entry)
- **Title**: Dream title if available (with link to original entry)
- **Words**: Word count for the dream description
- **Content**: Preview of dream content (expandable)
- **Metrics**: Individual metric values for each dream

### Table Navigation and Interaction

- **Sort by Column**: Click any column header to sort the table
- **Filter by Date**: Use the date filter dropdown to focus on specific periods
- **Expand Content**: Click "Show more" to read full dream content
- **Toggle Width**: Use the "Override Readable Line Length" toggle for wider tables
- **Open Entry**: Click on date or title to jump to the original dream entry

### Date Filtering

Use the date filter dropdown to focus on specific time periods:

- **Today**: Only today's entries
- **Yesterday**: Only yesterday's entries
- **This Week**: Entries from the current week
- **Last Week**: Entries from the previous week
- **This Month**: Entries from the current month
- **Last Month**: Entries from the previous month
- **This Year**: Entries from the current year
- **Last Year**: Entries from the previous year
- **All Time**: All entries
- **Custom**: Select a specific date range

### Custom Date Range

For more precise filtering:

1. Select "Custom" from the date filter dropdown
2. In the modal that appears, select start and end dates
3. Optionally save this as a favorite range
4. Click "Apply" to filter the table

### Identifying Patterns

Look for these patterns in your metrics data:

- **Trends over time**: Are certain metrics increasing or decreasing?
- **Correlations**: Do high values in one metric correlate with others?
- **Outliers**: Which dreams stand out with unusual metric values?
- **Clusters**: Do your dreams fall into distinct groups based on metrics?
- **Seasonal changes**: Do metrics vary by season, month, or day of week?

## Customizing Metrics

### Creating Custom Metrics

To create your own metrics:

1. Go to OneiroMetrics settings
2. Scroll to the Metrics section
3. Click "Add Metric"
4. In the modal that appears:
   - Enter a name for your metric
   - Select an icon
   - Define the value range
   - Write a description
   - Click "Save"

### Example Custom Metrics

Consider adding these custom metrics to track specific aspects of dreams:

- **Lucidity Level (1-5)**: Awareness that you were dreaming
- **Dream Theme**: Categories like adventure, relationship, fear, etc.
- **Color Intensity (1-5)**: Vividness of colors in the dream
- **Time Perception (1-5)**: How time seemed to flow in the dream
- **Body Sensations (1-5)**: Unusual bodily sensations experienced
- **Setting Familiarity (1-5)**: How familiar the dream setting was
- **Dream Coherence (1-5)**: How logical or coherent the dream narrative was

### Modifying Existing Metrics

To edit an existing metric:

1. Go to OneiroMetrics settings
2. Find the metric in the Metrics section
3. Click the edit (pencil) icon
4. Modify any properties as needed
5. Click "Save"

### Disabling Metrics

If you don't use certain metrics:

1. Go to OneiroMetrics settings
2. Find the metric in the Metrics section
3. Toggle the switch to disable it
4. The metric will move to the "Disabled Metrics" section
5. It won't appear in the analysis but its configuration is preserved

### Sharing Metrics Configurations

To share your custom metrics with others or between vaults:

1. Go to OneiroMetrics settings
2. Scroll to the bottom of the Metrics section
3. Click "Export Metrics" to download a JSON file
4. Share this file with others
5. They can click "Import Metrics" to use your configuration

## Advanced Metrics Usage

### Metrics for Lucid Dream Training

If you're practicing lucid dreaming, consider tracking:

- **Lucidity Level (1-5)**: How aware you were that you were dreaming
- **Control Level (1-5)**: How much control you had in the dream
- **Reality Checks**: Number of reality checks performed in the dream
- **Dream Signs**: Recurring elements that could trigger lucidity
- **Wake Back to Bed**: Yes/No whether you used WBTB technique

### Metrics for Nightmare Analysis

For working with nightmares or disturbing dreams:

- **Fear Level (1-5)**: Intensity of fear experienced
- **Distress After (1-5)**: How disturbed you felt upon waking
- **Recurrence**: Whether this is a recurring nightmare theme
- **Resolution**: Whether the nightmare resolved or was interrupted

### Metrics for Psychological Analysis

For deeper psychological exploration:

- **Symbolic Content (1-5)**: Presence of symbolic or metaphorical content
- **Personal Relevance (1-5)**: Connection to current life situations
- **Emotional Processing (1-5)**: Degree to which the dream processed emotions
- **Shadow Content (1-5)**: Presence of shadow or repressed material
- **Insight Generated (1-5)**: Degree of insight gained from the dream

### Advanced Metric Analysis

For sophisticated pattern tracking:

1. **Export data** as CSV for external analysis
2. Use spreadsheet programs to create:
   - Correlation matrices between metrics
   - Time series analysis
   - Charts and visualizations
   - Statistical analysis

## Data Export and External Analysis

### Exporting to CSV

To export your metrics data for analysis in other tools:

1. Open your metrics note
2. Look for the "Export CSV" button at the top
3. Click to download a CSV file
4. This file can be opened in Excel, Google Sheets, etc.

### Working with Exported Data

With your exported data, you can:

- Create custom charts and visualizations
- Perform statistical analysis
- Compare metrics across different time periods
- Identify correlations between metrics
- Generate reports on your dream patterns

### Recommended Analysis Tools

- **Spreadsheets**: Excel, Google Sheets, LibreOffice Calc
- **Data Analysis**: R, Python (pandas), SPSS
- **Visualization**: Tableau, PowerBI, Python (matplotlib)
- **Note-taking**: Connect insights back to Obsidian with links

## Troubleshooting

### Metrics Not Being Detected

If metrics aren't showing up in your analysis:

- Verify the callout name matches exactly (`> [!dream-metrics]`)
- Check that metric names match those in settings (case-sensitive)
- Ensure metric values are within the defined ranges
- Confirm the notes are selected for analysis in the Dream Scraper

### Incorrect Metric Values

If metrics appear with incorrect values:

- Check for typos in your dream entries (e.g., "5" vs "5.")
- Ensure commas separate metrics (not semicolons or other punctuation)
- Verify the format is "Metric Name: Value" with a colon between
- Make sure values are within the defined range for that metric

### Reset to Default Metrics

If you want to start fresh with the default metrics:

1. Go to OneiroMetrics settings
2. Scroll to the bottom of the Metrics section
3. Click "Reset to Defaults"
4. Confirm the action
5. Your custom metrics will be replaced with defaults

## Related Features

- [Dream Journal Manager](./dream-journal.md): Unified interface for dream journaling
- [Template System](./templater.md): Create templates with metrics included
- [Journal Structure](./journal-structure.md): How metrics fit into journal structures
- [Settings Reference](../reference/settings.md): Complete settings documentation
- [Dream Metrics Concepts](../concepts/dream-metrics.md): Understanding the philosophy behind metrics

---

For detailed descriptions of each default metric, see the [Metrics Reference](../reference/metrics.md). 