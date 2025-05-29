# OneiroMetrics Settings Reference

> **Applies to:** OneiroMetrics v1.0.0 and above  
> **Last Updated:** 2025-05-21

This document provides a complete reference for all settings available in the OneiroMetrics plugin. Settings are organized by category as they appear in the plugin's settings page.

## Table of Contents
- [Accessing Settings](#accessing-settings)
- [Project Settings](#project-settings)
- [Note Selection](#note-selection)
- [Metrics Configuration](#metrics-configuration)
- [Display Options](#display-options)
- [Backup Settings](#backup-settings)
- [Logging](#logging)
- [Advanced Settings](#advanced-settings)

## Accessing Settings

There are several ways to access OneiroMetrics settings:

1. **From Obsidian Settings**:
   - Click the settings gear icon in the Obsidian sidebar
   - Select "Plugin Options" 
   - Find and click "OneiroMetrics"

2. **From Dream Scrape Modal**:
   - Open the Dream Scrape modal via ribbon icon
   - Click the "Settings" button next to "Scrape Metrics"

3. **From Metrics Note**:
   - Open your metrics note
   - Click the "Settings" button at the top of the note

4. **From Ribbon Icon**:
   - Right-click the wand icon in the sidebar
   - Select "OneiroMetrics Settings"

5. **Using Command Palette**:
   - Open command palette (Ctrl/Cmd+P)
   - Type "OneiroMetrics Settings" and select it

## Project Settings

### OneiroMetrics Note Path
- **Description**: The path to the note where metrics tables will be stored
- **Default**: Empty (must be set by user)
- **Format**: Path to a markdown note (e.g., `Dream Journal/Dream Metrics.md`)
- **Smart Suggestions**: As you type, the field suggests existing files and offers to create new ones
- **Notes**: If the file doesn't exist, it will be created. If it exists, the plugin will insert/update the metrics tables while preserving any content before or after the tables.

### Callout Name
- **Description**: The name of the callout used to identify dream metrics in your notes
- **Default**: `dream-metrics`
- **Format**: Text without spaces or special characters
- **Notes**: Your callout blocks must use this exact name (e.g., `> [!dream-metrics]`)

## Note Selection

### Selection Mode
- **Description**: Choose whether to analyze individual notes or an entire folder
- **Options**:
  - **Notes**: Select specific notes for analysis
  - **Folder**: Select a folder containing dream journal entries
- **Default**: Notes

### Selected Notes
- **Description**: When in "Notes" mode, specifies which notes contain dream entries to analyze
- **Format**: Multi-chip autocomplete field - type partial file paths and press Enter to add
- **Default**: Empty
- **Notes**: The plugin will only search these specific notes for dream metrics callouts

### Selected Folder
- **Description**: When in "Folder" mode, specifies which folder contains dream entries
- **Format**: Path selector field
- **Default**: Empty
- **Notes**: The plugin will recursively search all notes in this folder and its subfolders

### Folder Preview and Exclusions
- **Description**: Preview notes in the selected folder and optionally exclude some
- **Format**: List of files with checkboxes
- **Notes**: Useful for excluding non-journal notes within a journal folder

## Metrics Configuration

### Default Metrics

OneiroMetrics comes with several built-in metrics. Each metric has the following properties:

- **Name**: The metric identifier (must match what's used in your journal entries)
- **Icon**: Visual representation in the UI (using Lucide icons)
- **Range**: Valid minimum and maximum values
- **Description**: What the metric measures and how to use it
- **Enabled**: Whether the metric is active for analysis

Default metrics include:

| Metric | Description | Range | Icon |
|--------|-------------|-------|------|
| Sensory Detail | Vividness of sensory experiences | 1-5 | eye |
| Emotional Recall | Ability to recall emotions from the dream | 1-5 | heart |
| Descriptiveness | Detail level in your written description | 1-5 | file-text |
| Character Roles | Prominence of characters in the dream | 1-5 | users |
| Confidence Score | Confidence in your memory of the dream | 1-5 | check-circle |
| Characters Count | Number of characters appearing in the dream | Any whole number | users |
| Familiar Count | Number of familiar people or entities | Any whole number | user-check |
| Unfamiliar Count | Number of unfamiliar entities | Any whole number | user-x |

### Metric Management

- **Add Metric**: Create a custom metric with name, icon, range, and description
- **Edit Metric**: Modify any aspect of existing metrics
- **Delete Metric**: Remove metrics you don't use
- **Enable/Disable**: Toggle metrics on/off without losing their configuration
- **Icon Picker**: Select from hundreds of Lucide icons when creating/editing metrics

### Metrics Description Modal

- **Description**: Access detailed descriptions of all metrics in a dedicated modal
- **Usage**: Click "Metrics Descriptions" button to open the modal
- **Notes**: Shows both active and inactive metrics with their full descriptions

## Display Options

### Override Readable Line Length
- **Description**: Controls whether metrics tables span the full width of the note
- **Default**: Enabled
- **Effect**: When enabled, tables ignore Obsidian's "Readable line length" setting and use the full width of the view
- **Notes**: This toggle is also available directly in the metrics note, below the "Dream Entries" heading

### Week Start Day
- **Description**: Defines which day is considered the start of the week
- **Default**: Sunday (0)
- **Options**: Sunday (0) through Saturday (6)
- **Effect**: Affects "This Week" and "Last Week" filters in the date dropdown
- **Notes**: Should match your personal or cultural preference for week start

### Callout Metadata Support
- **Description**: Controls how callout metadata affects metrics display
- **Options**:
  - **hide**: Hides the metrics section entirely
  - **compact**: Condenses the metrics display
  - **summary**: Highlights the metrics section
- **Default**: All enabled
- **Format**: Multiple checkboxes
- **Notes**: Allows users to control the display of metrics using callout metadata

## Backup Settings

### Enable Automatic Backups
- **Description**: Creates backup copies of your metrics note before making changes
- **Default**: Enabled
- **Notes**: Backups are created with the `.bak` extension in the same location as your metrics note

### Backup Folder
- **Description**: Optional separate location for storing backup files
- **Default**: Empty (backups stored alongside original file)
- **Format**: Folder path
- **Notes**: When specified, all backups are stored in this folder instead of alongside the original file

### Backup Retention
- **Description**: How many backup versions to keep
- **Default**: 5
- **Range**: 1-20
- **Notes**: When the limit is reached, the oldest backups are deleted automatically

## Logging

### Logging Level
- **Description**: Controls how much diagnostic information is logged
- **Default**: Off
- **Options**:
  - **Off**: No logging
  - **Error**: Only error messages
  - **Warn**: Errors and warnings
  - **Info**: General information plus errors and warnings
  - **Debug**: Detailed debug information
  - **Trace**: Very verbose diagnostics
- **Notes**: Set to Debug to enable the debug button in the metrics note. Higher logging levels may impact performance.

### Log Destination
- **Description**: Where log messages are stored
- **Default**: Console
- **Options**:
  - **Console**: Logs to developer console only
  - **File**: Logs to files in the logs/ folder
  - **Both**: Logs to both console and files
- **Notes**: File logging creates dated log files in the logs/ folder of your vault

## Advanced Settings

### UI Ribbon Buttons
- **Description**: Controls which ribbon icons are shown in the sidebar
- **Options**:
  - **Show Dream Scrape and Metrics Note buttons**: Shows both buttons
  - **Hide ribbon buttons**: Hides both buttons
- **Default**: Show buttons
- **Notes**: Due to an Obsidian API limitation, both buttons must be shown or hidden together

### Performance Settings

#### Virtualization Enabled
- **Description**: Controls whether table virtualization is used for large tables
- **Default**: Enabled
- **Notes**: Virtualization improves performance by only rendering visible rows (about 12 at a time)

#### Rows Per Page
- **Description**: Number of visible rows to render at once when virtualized
- **Default**: 12
- **Range**: 5-25
- **Notes**: Lower values improve performance but may cause more updates during scrolling

### Export Options

#### CSV Export Enabled
- **Description**: Adds a button to export metrics data as CSV
- **Default**: Enabled
- **Notes**: CSV files can be opened in spreadsheet applications for further analysis

#### JSON Export Enabled
- **Description**: Adds a button to export metrics data as JSON
- **Default**: Enabled
- **Notes**: Useful for backing up metrics configurations or sharing them between vaults

---

## Additional Resources

- [Getting Started Guide](../guides/getting-started.md): For new users
- [Usage Guide](../guides/usage.md): Comprehensive usage instructions
- [Troubleshooting Guide](./troubleshooting.md): Help with common issues
- [Dream Metrics Concepts](../concepts/dream-metrics.md): Understanding dream metrics 