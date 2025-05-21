# OneiroMetrics Setup Guide

> **Applies to:** OneiroMetrics v1.0.0 and above  
> **Last Updated:** 2025-05-20

## Overview

This guide walks you through the complete setup process for OneiroMetrics, from installation to initial configuration. Following these steps will help you create an optimal environment for tracking and analyzing your dream experiences.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [First-Time Setup](#first-time-setup)
- [Journal Structure Setup](#journal-structure-setup)
- [Template Setup](#template-setup)
- [Metrics Configuration](#metrics-configuration)
- [Testing Your Setup](#testing-your-setup)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

Before installing OneiroMetrics, make sure you have:

- **Obsidian v1.0.0 or higher** - OneiroMetrics requires recent Obsidian features
- **Community plugins enabled** - Must be turned on in Obsidian settings
- **A vault for your dream journal** - Either an existing vault or a new one
- **Reading View mode** - Most features work best in Reading View, not Live Preview

### Recommended Complementary Plugins

While not required, these plugins work well with OneiroMetrics:

- **Templater** - For advanced dream journal templates
- **Calendar** - For date-based navigation of dream entries
- **Dataview** - For advanced querying of dream data
- **Natural Language Dates** - For easier date input

## Installation

### Installing from Obsidian Community Plugins

1. **Open Obsidian Settings**
   - Click the gear icon in the sidebar or press `Ctrl/Cmd + ,`

2. **Navigate to Community Plugins**
   - Select "Community plugins" from the left sidebar
   - If prompted, enable community plugins

3. **Browse and Install**
   - Click "Browse" to open the community plugin browser
   - Search for "OneiroMetrics" in the search field
   - Click on OneiroMetrics in the results
   - Click "Install"

4. **Enable the Plugin**
   - After installation, toggle the switch to enable OneiroMetrics
   - You should see new icons appear in your Obsidian ribbon (left sidebar)

### Manual Installation (Advanced)

If you need to install manually:

1. **Download the Release**
   - Go to the [OneiroMetrics GitHub repository](https://github.com/yourname/oneirometrics)
   - Download the latest release ZIP file

2. **Extract to Your Vault**
   - Extract the ZIP contents to `[your-vault]/.obsidian/plugins/oneirometrics/`
   - Make sure `main.js`, `manifest.json`, and `styles.css` are directly in this folder

3. **Enable in Obsidian**
   - Open Obsidian settings
   - Go to Community plugins
   - Enable OneiroMetrics in the list

## First-Time Setup

When you first enable OneiroMetrics, the setup wizard will guide you through essential configuration:

### Initial Configuration Wizard

1. **Welcome Screen**
   - Click "Start Setup" to begin

2. **Metrics Note Location**
   - Choose where to store your metrics summary
   - Either select an existing note or create a new one
   - Recommended: Create a new note like `Dream Journal/Dream Metrics.md`

3. **Journal Structure**
   - Select how your dream journal is organized:
     - **Flat Structure**: Each note is a dream entry
     - **Nested Structure**: Dreams are sections within daily/weekly notes
   - Choose the appropriate option for your journaling style

4. **Select Dream Journal Location**
   - Choose between selecting specific notes or an entire folder
   - For folder mode, select the folder containing your dream entries
   - For notes mode, select the specific notes to analyze

5. **Review Metrics**
   - Review the default metrics
   - Toggle off any metrics you don't plan to use
   - You can customize these further later

6. **Finish Setup**
   - Click "Complete Setup" to save your configuration
   - The plugin will generate initial metrics if you already have dream entries

### Manual Configuration (Alternative)

If you prefer to configure settings manually:

1. **Open OneiroMetrics Settings**
   - Click the settings icon in Obsidian
   - Select "Plugin Options"
   - Click "OneiroMetrics"

2. **Configure Essential Settings**
   - Set the path to your metrics note
   - Choose selection mode (notes or folder)
   - Select your dream journal location
   - Review default metrics settings

## Journal Structure Setup

OneiroMetrics works with different journal structures. Configure according to your preference:

### Flat Structure (Separate Notes)

If each dream is in its own note:

1. **Create a Dream Journal Folder**
   - Create a folder like `Dream Journal` for all dream entries
   
2. **Set Journal Format**
   - In OneiroMetrics settings, select "Flat Structure"
   - Define heading levels (e.g., H1 for title, H2 for sections)

3. **Example Format**
   ```markdown
   # Dream: Flying Over Mountains
   Date: 2025-05-20
   
   ## Dream Description
   I was flying over snow-capped mountains...
   
   > [!dream-metrics]
   > Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 4
   ```

### Nested Structure (Within Daily Notes)

If dreams are sections in daily/weekly notes:

1. **Configure Daily Notes**
   - Set up a system for daily or weekly notes
   - Use consistent formatting for dream sections
   
2. **Set Journal Format**
   - In OneiroMetrics settings, select "Nested Structure"
   - Define the heading pattern for dream sections
   
3. **Example Format**
   ```markdown
   # Daily Note 2025-05-20
   
   ## Morning Activities
   
   ## Dream: Flying
   I was flying over snow-capped mountains...
   
   > [!dream-metrics]
   > Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 4
   
   ## Evening Reflection
   ```

## Template Setup

Creating templates ensures consistent dream entries and makes analysis more reliable:

### Basic Template Creation

1. **Open the Dream Journal Manager**
   - Click the wand icon in the ribbon or use command palette
   
2. **Go to the Templates Tab**
   - Click "Create New Template"
   
3. **Configure Template**
   - Name your template (e.g., "Dream Entry")
   - Choose structure type (flat or nested)
   - Add placeholders for date, title, and metrics
   
4. **Sample Basic Template**
   ```markdown
   # Dream: {{title}}
   Date: {{date}}
   
   ## Dream Description
   
   
   ## Notes
   
   
   > [!dream-metrics]
   > Sensory Detail: , Emotional Recall: , Descriptiveness: , Confidence Score: 
   ```

### Advanced Template with Templater

If using Templater plugin:

1. **Install Templater Plugin** if not already installed

2. **Create a Template File**
   - Create a file in your templates folder
   - Use Templater syntax for dynamic content
   
3. **Sample Templater-Enhanced Template**
   ```markdown
   # Dream: <% tp.file.title %>
   Date: <% tp.date.now("YYYY-MM-DD") %>
   
   ## Dream Description
   
   
   ## Dream Elements
   - Setting: 
   - Characters: 
   - Emotions: 
   
   > [!dream-metrics]
   > Sensory Detail: <% tp.system.prompt("Sensory Detail (1-5):", "3") %>, 
   > Emotional Recall: <% tp.system.prompt("Emotional Recall (1-5):", "3") %>, 
   > Descriptiveness: <% tp.system.prompt("Descriptiveness (1-5):", "3") %>, 
   > Confidence Score: <% tp.system.prompt("Confidence Score (1-5):", "3") %>
   ```

4. **Configure Templater**
   - Set folder locations in Templater settings
   - Enable template folder as a trigger folder if desired

## Metrics Configuration

Configure your metrics to match your dream journaling needs:

### Review Default Metrics

1. **Open OneiroMetrics Settings**
   - Navigate to the Metrics section
   
2. **Review Existing Metrics**
   - The default metrics include:
     - Sensory Detail (1-5)
     - Emotional Recall (1-5)
     - Descriptiveness (1-5)
     - Characters Role (1-5)
     - Confidence Score (1-5)
     - Characters Count (number)
     - Familiar Count (number)
     - Unfamiliar Count (number)

### Create Custom Metrics

1. **Add New Metrics**
   - Click "Add Metric" in the settings
   - Enter name, description, range, and select an icon
   
2. **Example Custom Metrics to Consider**
   - Lucidity (1-5): Awareness you were dreaming
   - Flying (Yes/No): Whether flying occurred
   - Setting Category: Type of environment
   - Emotional Tone (1-5): Overall emotional quality
   
3. **Disable Unused Metrics**
   - Toggle off metrics you don't plan to use
   - They'll be preserved but won't appear in analysis

## Testing Your Setup

Verify your setup works correctly:

### Create a Test Dream Entry

1. **Create a New Note**
   - Create a new note using your template
   - Fill in all fields including metrics
   - Save the note in your dream journal location
   
2. **Run Initial Analysis**
   - Open the Dream Journal Manager
   - Go to the Dream Scraper tab
   - Select your test note or folder
   - Click "Scrape Metrics"
   
3. **Review Results**
   - Check that your metrics note was created/updated
   - Verify that your test entry appears in the tables
   - Confirm metrics values are displayed correctly

### Test Template Usage

1. **Create Another Entry**
   - Use the command palette to insert your template
   - Fill out the template fields
   - Save in your dream journal location
   
2. **Update Metrics**
   - Run Dream Scraper again
   - Verify the new entry appears in your metrics

## Troubleshooting

### Common Setup Issues

#### Plugin Not Appearing
- Check that the plugin is enabled in Community Plugins
- Try restarting Obsidian
- Verify installation path if installed manually

#### Metrics Not Detected
- Ensure callout syntax is exactly `> [!dream-metrics]`
- Check that metric names match those in settings
- Verify notes are in the selected folder/notes list

#### Template Issues
- For Templater integration, ensure Templater is properly configured
- Check template syntax for errors
- Verify templates folder is correctly set

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**
   - Enable debug logging in OneiroMetrics settings
   - Review console logs for errors
   
2. **Community Support**
   - Visit the Obsidian forum thread for OneiroMetrics
   - Check GitHub issues for similar problems
   - Join the Obsidian Discord for community support

## Next Steps

After successful setup, explore these next steps:

1. **Read the User Guide**
   - See [Usage Guide](./usage.md) for detailed usage instructions
   
2. **Explore Dream Journal Manager**
   - Learn about the [Dream Journal Manager](./dream-journal.md)
   
3. **Understand Metrics**
   - Dive deeper with [Metrics Guide](./metrics.md)
   
4. **Regular Analysis**
   - Establish a routine for running dream analysis
   - Weekly or monthly is recommended to track patterns

---

For a quick introduction to the plugin's features, see the [Getting Started Guide](./getting-started.md). 