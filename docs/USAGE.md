# OneiroMetrics Usage Guide

## Table of Contents
- [Introduction](#introduction)
- [Quick Start Guide](#quick-start-guide)
  - [Installation](#installation)
  - [Initial Setup](#initial-setup)
  - [First Steps](#first-steps)
- [Dream Journal Manager](#dream-journal-manager)
  - [Interface Overview](#interface-overview)
  - [Dream Scraper Tab](#dream-scraper-tab)
  - [Journal Structure Tab](#journal-structure-tab)
  - [Templates Tab](#templates-tab)
- [Creating Dream Journal Entries](#creating-dream-journal-entries)
  - [Journal Structure Options](#journal-structure-options)
  - [Using Templates](#using-templates)
  - [Adding Dream Metrics](#adding-dream-metrics)
  - [Templater Integration](#templater-integration)
- [Analyzing Dreams](#analyzing-dreams)
  - [Scraping Metrics](#scraping-metrics)
  - [Metrics Table](#metrics-table)
  - [Table Features](#table-features)
  - [Date Tools](#date-tools)
- [Customizing the Plugin](#customizing-the-plugin)
  - [Accessing Settings](#accessing-settings)
  - [Configuring Metrics](#configuring-metrics)
  - [Multi-Note Selection](#multi-note-selection)
  - [View Mode Settings](#view-mode-settings)
  - [Backup System](#backup-system)
- [Troubleshooting & Tips](#troubleshooting--tips)
  - [Common Issues](#common-issues)
  - [Performance Tips](#performance-tips)
  - [Debug Tools](#debug-tools)
  - [Getting Help](#getting-help)
- [Advanced Topics](#advanced-topics)
  - [Layout and Styling](#layout-and-styling)
  - [State Persistence](#state-persistence)

## Introduction

OneiroMetrics is an Obsidian plugin designed to help you track and analyze your dreams. It offers tools for structured dream journaling, dream pattern analysis, and metrics visualization to provide insights into your dream life.

The plugin enables you to:
- Create structured dream journal entries with consistent formatting
- Track various metrics about your dreams (clarity, emotion, etc.)
- Analyze patterns and trends in your dream experiences
- Generate statistics and visualizations from your dream data

## Quick Start Guide

### Installation

1. **Install the Plugin**
   - Open Obsidian Settings
   - Go to Community Plugins
   - Browse for "OneiroMetrics" and install
   - Enable the plugin

### Initial Setup

1. **Access Settings**
   - Open Obsidian Settings
   - Navigate to the OneiroMetrics section
   - Or click the wand icon in the ribbon

2. **Configure Basic Options**
   - Set your OneiroMetrics Note path (where metrics tables will be stored)
   - Select notes to include in your dream analysis
   - Choose your preferred metrics to track

### First Steps

1. **Switch to Reading View**
   - OneiroMetrics requires Reading View mode for optimal functionality
   - Use the Reading View button in the top-right corner of Obsidian

2. **Create Your First Dream Entry**
   - Open or create a dream journal note
   - Use the Template Wizard (command palette → "Create Journal Template")
   - Or manually add a dream entry with metrics (see [Adding Dream Metrics](#adding-dream-metrics))

3. **Generate Metrics**
   - Click the OneiroMetrics ribbon icon
   - Select "Scrape Metrics" to analyze your dreams
   - View the generated metrics table in your configured project note

## Dream Journal Manager

> **New Feature:** The Dream Journal Manager is a comprehensive unified interface for managing all aspects of dream journaling.

### Interface Overview

The Dream Journal Manager provides a tabbed interface with three main sections:
- **Dream Scraper:** Analyze dream entries and generate metrics
- **Journal Structure:** Configure templates and journal organization
- **Templates:** Create and manage dream journal templates

To access the Dream Journal Manager:
- Click the OneiroMetrics ribbon icon
- Use the command palette and search for "Open Dream Journal Manager"

### Dream Scraper Tab

This tab provides tools for extracting and analyzing dream data:

- **Source Selection:**
  - Choose between individual notes or folders
  - Select multiple notes using the multi-chip autocomplete
  - Preview selected content before scraping

- **Metrics Extraction:**
  - Configure which metrics to extract
  - Run the analysis with a single click
  - View progress during scraping

- **Controls:**
  - Settings button for quick access to plugin configuration
  - Open OneiroMetrics button to view your results
  - Clear button to reset selections

### Journal Structure Tab

This tab helps you maintain consistent journal structure:

- **Structure Selection:**
  - Choose between flat or nested journal structures
  - Configure structure validation rules
  - Set up automatic structure checking

- **Template Management:**
  - Create templates for consistent entries
  - Configure default metrics for new entries
  - Preview templates with sample data

- **Validation Options:**
  - Set required fields for journal entries
  - Configure warning vs. error levels
  - Enable/disable automatic validation

### Templates Tab

This tab allows you to create and manage templates:

- **Template Creation:**
  - Step-by-step wizard interface
  - Name and describe your templates
  - Choose structure (flat or nested)
  - Configure Templater integration

- **Template Management:**
  - List, edit, and delete existing templates
  - Preview templates before using them
  - Import/export templates

- **Insertion Methods:**
  - Command palette
  - Editor context menu
  - OneiroMetrics ribbon icon

## Creating Dream Journal Entries

### Journal Structure Options

OneiroMetrics supports two journal structure types:

1. **Flat Structure:**
   - All dream entries at the same level
   - Simple and straightforward
   - Example:
     ```markdown
     # Journal Entry: 2025-05-20
     
     > [!dream-metrics]
     > Clarity: 4, Emotion: 3
     
     I dreamed about flying over mountains...
     ```

2. **Nested Structure:**
   - Dream entries nested within journal entries
   - Better for mixed journals (dreams + daily notes)
   - Example:
     ```markdown
     > [!journal-entry] 2025-05-20
     > 
     > ### Morning
     >
     >> [!dream-diary] Mountain Flight
     >> I dreamed about flying over mountains...
     >>
     >> [!dream-metrics]
     >> Clarity: 4, Emotion: 3
     ```

Choose the structure that best matches your journaling workflow in the Journal Structure tab.

### Using Templates

OneiroMetrics provides a powerful template system for creating consistent dream journal entries.

#### Template Wizard

1. Open the Template Wizard using one of these methods:
   - Command palette: "Create Journal Template"
   - Dream Journal Manager: Templates tab
   - Settings page: Templates section
   
2. Follow the step-by-step wizard:
   - Step 1: Enter basic template information (name, description)
   - Step 2: Select a journal structure (flat or nested)
   - Step 3: Configure Templater integration
   - Step 4: Add template content

#### Inserting Templates

Insert templates into your journal entries using:
- Command palette: "Insert Journal Template"
- Editor context menu: "Insert Dream Journal Template"
- Right-click on the OneiroMetrics ribbon icon

### Adding Dream Metrics

Add metrics to your dream entries using callouts:

```markdown
> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Lost Segments: 2, Descriptiveness: 3, Confidence Score: 5
```

You can add metrics:
- Manually typing them in your dream entries
- Using templates with pre-configured metrics
- Through the Dream Journal Manager interface

### Templater Integration

OneiroMetrics now standardizes on Templater for dynamic templates while providing fallbacks for users without Templater.

#### With Templater (Recommended)

With Templater installed, your templates can include:
- Dynamic date formatting: `<% tp.date.now("YYYY-MM-DD") %>`
- User prompts: `<% tp.system.prompt("Enter mood", "neutral") %>`
- Conditional content based on inputs
- System information access

Example template with Templater:
```markdown
# Dream Journal: <% tp.date.now("YYYY-MM-DD") %>

> [!dream]
> <% tp.system.prompt("Describe your dream", "") %>

> [!dream-metrics]
> Clarity: <% tp.system.prompt("Rate clarity (1-10)", "7") %>
> Vividness: <% tp.system.prompt("Rate vividness (1-10)", "6") %>
```

#### Without Templater (Fallback)

If Templater isn't installed, templates will:
- Use static placeholders instead of dynamic content
- Show placeholders like `[[DATE: YYYY-MM-DD]]`
- Allow you to tab through placeholders for manual filling
- Provide the same structure but without automation

Example of the same template without Templater:
```markdown
# Dream Journal: [[DATE: YYYY-MM-DD]]

> [!dream]
> [[PROMPT: Describe your dream]]

> [!dream-metrics]
> Clarity: [[PROMPT: Rate clarity (1-10) (default: 7)]]
> Vividness: [[PROMPT: Rate vividness (1-10) (default: 6)]]
```

For more detailed information and advanced template techniques, see the [Templater Integration documentation](user/guides/templater.md).

## Analyzing Dreams

### Scraping Metrics

To analyze your dream entries:

1. **Access the Dream Scraper:**
   - Through the Dream Journal Manager
   - Via the ribbon icon or command palette
   - Select "Scrape Metrics"

2. **Select Source:**
   - Choose individual notes or a folder
   - Use multi-chip autocomplete for selecting specific notes
   - Preview selected sources before scraping

3. **Run Analysis:**
   - Click "Scrape Metrics" to begin analysis
   - The plugin will:
     - Create a backup of your project note
     - Show a confirmation dialog
     - Update the metrics table
     - Preserve any content before/after the table

> **Tip:** The Dream Scrape interface includes a **Settings** button for quick access to plugin settings.

### Metrics Table

The generated metrics table includes two main sections:

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
- Optimized column widths for readability

### Table Features

The metrics table offers several powerful features:

- **Sortable Columns:** Click column headers to sort
- **Content Expansion:** Show more/less for dream content
- **Filtering Options:**
  - Date filter dropdown with human-friendly labels (Today, This Week, etc.)
  - Metric-based filtering
  - Combined filtering options
- **Layout Controls:**
  - Full-width layout (overrides readable line length)
  - Toggle to control table width
  - Responsive design for all screen sizes
- **Performance Optimizations:**
  - Smooth scrolling that maintains position
  - Fast expand/collapse functionality
  - Optimized for large dream journals

### Date Tools

The Date Tools feature helps analyze dream entries across different time periods:

#### Date Filtering

- **Quick Filters:**
  - Today, Yesterday, This Week, Last Week
  - This Month, Last Month, This Year, Last Year
  - Custom date range

- **Custom Date Range:**
  - Calendar interface for selecting dates
  - Save favorite date ranges
  - Configurable week start day

#### Date Analysis

- **Pattern Recognition:**
  - Compare metrics across time periods
  - Identify trends and patterns
  - Track changes in dream characteristics

For detailed information on date handling, see the [Date Tools Plan](planning/features/date-tools.md).

## Customizing the Plugin

### Accessing Settings

Access OneiroMetrics settings in several ways:
- **Dream Scrape modal:** Click 'Settings' button
- **OneiroMetrics note:** Click 'Settings' button at the top
- **Command palette:** Search for "OneiroMetrics Settings"
- **Ribbon icon:** Right-click the wand icon and select settings

### Configuring Metrics

#### Project Note Path
- Set the path where your metrics table will be stored
- Use the smart file suggestion system
- The file will be created if it doesn't exist
- Backups are created automatically before changes

#### Metric Editor
- Add, edit, or remove metrics with real-time validation
- Configure validation rules for each metric
- Use keyboard shortcuts for efficient editing
- Customize metric icons using the icon picker

#### Managing Metrics
- Drag and drop to reorder metrics
- Group metrics as Enabled or Disabled
- Reset to defaults while preserving custom metrics
- Import/export your metric configurations

### Multi-Note Selection

#### Note Selection
- Use the multi-chip autocomplete field to select notes
- Add or remove notes easily
- Support for multiple note paths
- Smart path matching and suggestions

#### Smart File Suggestions
- Case-insensitive matching
- Year-based path suggestions
- Real-time validation feedback
- Support for spaces and special characters

### View Mode Settings

OneiroMetrics is designed to work best in Reading View mode:

#### Reading View Benefits
- Stable, predictable layout environment
- Consistent table rendering across themes
- Better performance for large tables
- Improved accessibility features

#### View Mode Detection
- The plugin detects your current view mode
- Provides clear notifications when needed
- Settings include warnings about view mode requirements

For detailed information about view mode requirements and limitations, please refer to the [View Mode Requirements](user/guides/view-mode.md) document.

### Backup System

OneiroMetrics includes an automatic backup system:

- **Automatic Backups:**
  - Created before each metrics update
  - Use .bak extension for better organization
  - Include timestamps for versioning
  - Stored in the same directory as your project note

- **Backup Management:**
  - Visual indicators in file explorer
  - Easy restoration if needed
  - Safe to delete old backups

## Troubleshooting & Tips

### Common Issues

1. **View Mode Issues**
   - **Problem:** Tables don't render correctly
   - **Solution:** Switch to Reading View mode using the button in the top-right corner
   - **Why:** OneiroMetrics requires Reading View for stable table rendering

2. **Missing Metrics**
   - **Problem:** Metrics aren't appearing in the table
   - **Solution:** 
     - Verify callout name matches your settings
     - Check for typos in metric names
     - Ensure proper callout formatting
   - **Example:** `> [!dream-metrics]` must match exactly

3. **Invalid Metric Values**
   - **Problem:** Validation errors for metrics
   - **Solution:**
     - Check the validation rules in settings
     - Ensure values are within the specified range
     - Use the correct format in callouts
   - **Tip:** Hover over metrics for validation feedback

4. **Table Display Issues**
   - **Problem:** Table width or formatting issues
   - **Solution:**
     - Use the Readable Line Length toggle
     - Check theme compatibility
     - Verify that CSS snippets aren't interfering

5. **Button Responsiveness**
   - **Problem:** "Show more" button not working
   - **Solution:** Use the debug button to reset event listeners
   - **Access:** Set Logging Level to **Debug** in settings

### Performance Tips

- **Large Datasets:**
  - Use filters to focus on specific time periods
  - Limit visible rows when working with hundreds of entries
  - Consider splitting journals by year for very large collections

- **Regular Maintenance:**
  - Clean up old backup files occasionally
  - Monitor log file sizes in the logs folder
  - Use consistent formatting in dream entries

- **Optimization Settings:**
  - Enable performance optimization options
  - Set appropriate week start day for filters
  - Configure logging level based on needs

### Debug Tools

Access debugging features by setting Logging Level to **Debug** in settings:

- **Debug Button:**
  - Reset event listeners if buttons become unresponsive
  - Force table refresh
  - View diagnostic information
  - Clear stuck UI states

- **Console Logging:**
  - Open Developer Tools (Ctrl+Shift+I)
  - Check Console tab for detailed logs
  - Filter for "OOM" to see plugin-specific messages

### Getting Help

- **Documentation:**
  - Check detailed documentation files
  - Review the [README.md](../README.md) for overview
  - See [SPECIFICATION.md](SPECIFICATION.md) for technical details

- **Support:**
  - Visit the GitHub repository for updates
  - Check for known issues in [ISSUES.md](ISSUES.md)
  - Review validation messages for specific problems

## Advanced Topics

### Layout and Styling

For comprehensive information about layout options, styling features, and theme integration, see the [Layout and Styling Technical Specification](archive/LAYOUT_AND_STYLING.md).

### State Persistence

The plugin maintains your preferences across sessions, including expanded/collapsed states for dream entries. For detailed information about state persistence features and implementation, see the [State Persistence](developer/implementation/state.md) documentation. 