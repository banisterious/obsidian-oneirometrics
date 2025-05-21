# OneiroMetrics Usage Guide

## Overview
OneiroMetrics is an Obsidian plugin designed to help you track and analyze your dreams. It offers tools for structured dream journaling, dream pattern analysis, and metrics visualization to provide insights into your dream life.

The plugin enables you to:
- Create structured dream journal entries with consistent formatting
- Track various metrics about your dreams (clarity, emotion, etc.)
- Analyze patterns and trends in your dream experiences
- Generate statistics and visualizations from your dream data

## Table of Contents
- [Overview](#overview)
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
   - For more details on view mode requirements, see [View Mode Requirements](./view-mode.md)

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

OneiroMetrics now standardizes on Templater for dynamic templates while providing fallbacks for users without Templater. For detailed Templater integration instructions, see the [Templater Integration Guide](./templater.md).

#### With Templater (Recommended)

With Templater installed, your templates can include:
- Dynamic date formatting: `<% tp.date.now("YYYY-MM-DD") %>`
- User prompts: `<% tp.system.prompt("Enter mood", "neutral") %>`
- Conditional content based on inputs
- System information access

Example template with Templater:
```markdown
# Dream Journal: <% tp.date.now("YYYY-MM-DD") %>

> [!dream-diary] <% tp.system.prompt("Dream Title", "Untitled Dream") %>
> <% tp.system.prompt("Dream Description", "Enter your dream here...") %>
>
> [!dream-metrics]
> Clarity: <% tp.system.prompt("Clarity (1-5)", "3") %>, Emotion: <% tp.system.prompt("Emotion (1-5)", "3") %>
```

#### Without Templater (Basic Support)

Without Templater, you'll get:
- Static templates with placeholder text
- Manual replacements needed
- Date tokens replaced with current date

Example template without Templater:
```markdown
# Dream Journal: {{date}}

> [!dream-diary] {{title}}
> {{description}}
>
> [!dream-metrics]
> Clarity: {{clarity}}, Emotion: {{emotion}}
```

## Analyzing Dreams

### Scraping Metrics

To extract metrics from your dream entries:

1. Open the Dream Journal Manager
2. Go to the Dream Scraper tab
3. Select the notes or folders to analyze
4. Click "Scrape Metrics"
5. Wait for the process to complete
6. View the metrics in your project note

For more detailed metric information, see the [Metrics Reference](../reference/metrics.md).

### Metrics Table

The metrics table shows all your dream metrics in a structured format:

- **Date Column**: The date of each dream entry
- **Metric Columns**: Each selected metric
- **Expandable Rows**: Click to show the dream content
- **Sortable Columns**: Click column headers to sort
- **Searchable**: Use the search bar to filter entries

### Table Features

- **Filtering**: Use the date filter to show dreams from specific time periods
- **Sorting**: Click column headers to sort by date or metrics
- **Expanding**: Click the "+" icon to view dream content
- **Search**: Type in the search bar to filter by content or metrics
- **Statistics**: View averages at the bottom of the table

### Date Tools

- **Quick Filters**: Show dreams from last week, month, year
- **Custom Range**: Select a specific date range
- **Date Comparison**: Compare metrics across different time periods
- **Calendar View**: Visual calendar showing dream frequency

## Customizing the Plugin

### Accessing Settings

Access OneiroMetrics settings through:
- Obsidian Settings → OneiroMetrics
- The gear icon in the Dream Journal Manager
- The OneiroMetrics ribbon icon → Settings

### Configuring Metrics

In the settings menu, you can:
- Add, edit, or remove metrics
- Set default metric values
- Change metric display order
- Set required vs. optional metrics

### Multi-Note Selection

Configure which notes are included in your dream analysis:
- Select specific notes
- Choose entire folders
- Use tags to filter notes
- Set up automatic inclusion rules

### View Mode Settings

See the [View Mode Guide](./view-mode.md) for detailed information on:
- Reading view requirements
- Customizing the view experience
- Compatibility with other plugins
- Troubleshooting view mode issues

### Backup System

OneiroMetrics automatically backs up your data:
- Before major operations (scraping, template changes)
- On a configurable schedule
- With configurable backup locations
- With a backup restoration system

## Troubleshooting & Tips

### Common Issues

- **Table not showing**: Ensure you're in Reading View, not Editing View
- **Metrics not found**: Check that you're using the correct callout format
- **Performance issues**: See [Performance Tips](#performance-tips)
- **Template errors**: Check Templater installation and configuration

### Performance Tips

For large journals with many entries:
- Use the "Limit entries" option in settings
- Enable the "Load on demand" feature
- Consider splitting journals into yearly or monthly files
- Use the performance mode in settings (fewer features but faster)

### Debug Tools

If you encounter issues:
1. Enable debug mode in settings
2. Check the developer console (Ctrl+Shift+I)
3. Look for error messages in the console
4. Use the debug tools in the Advanced section of settings

### Getting Help

If you need assistance:
- Check the [Troubleshooting Guide](../reference/troubleshooting.md)
- Visit the GitHub repository to report issues
- Search for similar problems in the Issues section
- Join the Discord community for support

## Advanced Topics

### Layout and Styling

- Customize the appearance of metrics tables
- Change colors and styles using CSS snippets
- Create custom themes for the Dream Journal Manager
- Design your own template layouts

### State Persistence

For information about how the plugin saves state, see [State Persistence](../../developer/implementation/state.md). 