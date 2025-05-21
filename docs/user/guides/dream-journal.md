# Dream Journal Manager Guide

> **Applies to:** OneiroMetrics v1.0.0 and above  
> **Last Updated:** 2025-05-21

## Overview

The Dream Journal Manager is a comprehensive unified interface for managing all aspects of your dream journaling workflow in OneiroMetrics. It provides tools for analyzing dreams, configuring journal structure, and managing templates in one convenient interface.

## Table of Contents
- [Getting Started](#getting-started)
- [Interface Overview](#interface-overview)
- [Dream Scraper Tab](#dream-scraper-tab)
- [Journal Structure Tab](#journal-structure-tab)
- [Templates Tab](#templates-tab)
- [Tips and Best Practices](#tips-and-best-practices)
- [Troubleshooting](#troubleshooting)
- [Related Features](#related-features)

## Getting Started

### Prerequisites
- OneiroMetrics plugin installed and enabled
- At least one dream journal note created
- Reading View mode in Obsidian (required for full functionality)

### Accessing the Dream Journal Manager
There are three ways to open the Dream Journal Manager:

1. **Ribbon Icon**: 
   - Click the wand icon in the Obsidian ribbon (left sidebar)

2. **Command Palette**:
   - Open the command palette (`Ctrl/Cmd+P`)
   - Type "Open Dream Journal Manager" and select it

3. **Settings Tab**:
   - Open OneiroMetrics settings
   - Click "Open Dream Journal Manager" button

## Interface Overview

The Dream Journal Manager features a tabbed interface with three main sections:

- **Dream Scraper**: Analyze dream entries and generate metrics
- **Journal Structure**: Configure templates and journal organization
- **Templates**: Create and manage dream journal templates

Each tab is designed to handle a specific aspect of dream journaling, creating a streamlined workflow for managing and analyzing your dream experiences.

## Dream Scraper Tab

The Dream Scraper tab is the primary tool for extracting and analyzing metrics from your dream journal entries.

### Source Selection

1. **Mode Selection**:
   - Choose between "Notes" or "Folder" mode using the dropdown
   - **Notes Mode**: Select individual notes for analysis
   - **Folder Mode**: Analyze all notes in a specific folder

2. **Note Selection (Notes Mode)**:
   - Use the multi-chip autocomplete field to select specific notes
   - Type partial paths and press Enter to add notes
   - Click the 'x' on a chip to remove a note

3. **Folder Selection (Folder Mode)**:
   - Select a folder containing your dream journal entries
   - Click "Preview Files" to see which notes will be analyzed
   - Optionally exclude specific notes from analysis

### Analyzing Dreams

1. **Starting the Analysis**:
   - After selecting your notes/folder, click "Scrape Metrics"
   - A confirmation dialog will appear if your metrics note already exists
   - The analysis process will begin with a progress indicator

2. **Progress Display**:
   - A progress bar shows completion percentage
   - Status text indicates the current file being processed
   - Counts of analyzed entries are shown
   - The modal will close automatically when complete

3. **Viewing Results**:
   - Your metrics note will open automatically after processing
   - The note contains summary and detailed tables of your dream metrics

### Additional Controls

- **Settings Button**: Quick access to OneiroMetrics settings
- **Open Metrics Note**: Opens your metrics note (if it exists)
- **Clear Button**: Resets selections and search results

## Journal Structure Tab

The Journal Structure tab helps you maintain consistent organization across your dream journal entries.

### Structure Selection

1. **Journal Structure Type**:
   - **Flat Structure**: All dream entries at the same level
   - **Nested Structure**: Dream entries nested within journal entries
   - Select the structure that matches your journaling style

2. **Structure Configuration**:
   - Set default headings for journal entries
   - Configure callout types and formats
   - Specify required fields for validation

3. **Validation Rules**:
   - Set which elements are required vs. optional
   - Configure warning vs. error severity levels
   - Define custom validation rules

### Structure Preview

- **Preview Panel**: Shows how your structure will appear in practice
- **Example Entry**: Demonstrates a properly formatted entry
- **Structure Diagram**: Visual representation of the hierarchy

### Structure Validation

- **Validate Button**: Check existing entries against your structure
- **Batch Check**: Run validation across multiple entries
- **Quick Fix**: Apply suggested fixes to structure issues
- **Validation Report**: See details of validation results

## Templates Tab

The Templates tab provides tools for creating and managing templates for consistent dream journal entries.

### Template Creation

1. **Template Wizard**:
   - Click "Create New Template" to launch the wizard
   - **Step 1**: Enter template name and description
   - **Step 2**: Select structure type (flat or nested)
   - **Step 3**: Configure Templater integration (if available)
   - **Step 4**: Edit template content

2. **Template Editor**:
   - Rich editor for creating template content
   - Insert placeholders for date, title, and metrics
   - Preview how template will appear when used

3. **Templater Integration**:
   - Use dynamic content with Templater plugin
   - Automatic date formatting
   - User prompts for interactive fields
   - Conditional content based on inputs

### Template Management

- **Templates List**: View and manage all your templates
- **Edit**: Modify existing templates
- **Delete**: Remove templates you no longer need
- **Duplicate**: Create variations of existing templates
- **Export/Import**: Share templates between vaults

### Using Templates

1. **From Command Palette**:
   - Open command palette (`Ctrl/Cmd+P`)
   - Type "Insert Journal Template" and select it
   - Choose the template to insert

2. **From Context Menu**:
   - Right-click in the editor
   - Select "Insert Dream Journal Template"
   - Choose the template to insert

3. **From Dream Journal Manager**:
   - Open Templates tab
   - Select a template
   - Click "Insert Template"

## Tips and Best Practices

### Effective Journal Structure

- **Choose the Right Structure**: Use flat structure for dedicated dream journals, nested for mixed-content journals
- **Be Consistent**: Stick with your chosen structure for easier analysis
- **Use Meaningful Headers**: Create clear hierarchy with descriptive headers
- **Include Dates**: Always include dates in a consistent format (YYYY-MM-DD is best)

### Template Best Practices

- **Create Multiple Templates**: Different types of dream entries may need different templates
- **Include All Required Fields**: Ensure templates contain all required structure elements
- **Add Placeholder Metrics**: Include the metrics you track most often
- **Use Comments**: Add guidance notes in templates for consistent use

### Analysis Workflow

1. **Regular Updates**: Run the Dream Scraper weekly to keep metrics current
2. **Filter by Date**: Use date filters to focus on recent entries
3. **Look for Patterns**: Sort by different metrics to discover trends
4. **Tag Significant Dreams**: Add tags to notable dreams for easier filtering
5. **Export Data**: Use CSV export for deeper analysis in spreadsheet software

## Troubleshooting

### Common Issues

#### Dream Scraper Tab Not Finding Entries
- **Symptom:** No entries found or incomplete results
- **Causes:**
  - Incorrect callout name in your entries
  - Notes not selected properly
  - Metrics names don't match settings
- **Solution:** Check callout format and ensure metrics names match exactly

#### Template Not Working with Templater
- **Symptom:** Template inserts with raw Templater code
- **Causes:**
  - Templater plugin not installed or enabled
  - Incorrect Templater syntax
- **Solution:** Install Templater or use static templates instead

#### Structure Validation Showing Errors
- **Symptom:** Many validation errors on existing entries
- **Causes:**
  - Structure settings don't match existing entries
  - Inconsistent formatting in journal entries
- **Solution:** Adjust structure settings to match your existing style or use quick fixes to update entries

### Debug Mode

If you encounter persistent issues:

1. Enable Debug mode in settings:
   - Go to OneiroMetrics settings → Logging
   - Set Logging Level to "Debug"

2. Use the debug tools that appear:
   - Special debug buttons will appear in the UI
   - Console will show detailed logs
   - Debug options will be available in modals

## Related Features

- [Templater Integration](./templater.md): Advanced template features with Templater
- [Journal Structure](./journal-structure.md): Detailed guide to journal structures
- [Metrics Guide](./metrics.md): Understanding and using dream metrics
- [Settings Reference](../reference/settings.md): Complete settings documentation

---

For technical details about the Dream Journal Manager implementation, see the [Dream Journal Manager Plan](../../planning/features/dream-journal-manager.md). 