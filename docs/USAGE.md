# OneiroMetrics Usage Guide

## Quick Start

1. **Enable the Plugin**
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable OneiroMetrics

2. **View Mode Requirements**
   - OneiroMetrics requires Reading View mode
   - See [View Mode Requirements](VIEW_MODE.md) for detailed information
   - Switch to Reading View using the button in the top-right corner

## View Mode Requirements

OneiroMetrics is designed to work exclusively with Reading View mode in Obsidian. For detailed information about view mode requirements, limitations, and future enhancements, please refer to the [View Mode Requirements](VIEW_MODE.md) document.

### Quick Reference
- Always use Reading View mode for optimal functionality
- Switch to Reading View using the button in the top-right corner
- Enable "Default to Reading View" in Obsidian settings if desired
- See [View Mode Requirements](VIEW_MODE.md) for best practices and technical details

### Future Enhancements

The following improvements are planned for the Reading View requirement:

1. **Automatic View Mode Switching**
   - Automatically switch to Reading View when opening OneiroMetrics notes
   - Remember user's preferred view mode for other notes
   - Provide a setting to enable/disable automatic switching

2. **Enhanced Live Preview Support**
   - Improve layout consistency in Live Preview mode
   - Add specific styles for Live Preview compatibility
   - Implement fallback behaviors for Live Preview features

3. **View Mode Persistence**
   - Remember the last used view mode per note
   - Allow setting default view mode preferences
   - Provide quick toggle between view modes

4. **Accessibility Improvements**
   - Add keyboard shortcuts for view mode switching
   - Improve screen reader announcements for view mode changes
   - Add visual indicators for current view mode

### Reading View Requirement
OneiroMetrics is designed to work exclusively with Reading View mode. This requirement is essential for several reasons:

1. **Layout Consistency**
   - Reading View provides a stable, predictable layout environment
   - Tables and metrics are rendered consistently across different themes
   - Content expansion/collapse animations work reliably
   - Column widths and alignments remain stable

2. **Performance**
   - Reading View offers better performance for large tables
   - Reduced DOM updates and reflows
   - Smoother animations and transitions
   - More efficient event handling

3. **Accessibility**
   - Better screen reader support
   - Consistent keyboard navigation
   - Reliable focus management
   - Proper ARIA attribute handling

### Live Preview Limitations
Live Preview mode is not supported due to several technical limitations:

1. **Layout Issues**
   - Inconsistent table rendering
   - Unreliable content expansion/collapse
   - Column width instability
   - Theme compatibility problems

2. **Performance Problems**
   - Frequent DOM updates causing lag
   - Unreliable event handling
   - Animation stuttering
   - Memory usage spikes

3. **Accessibility Challenges**
   - Inconsistent screen reader behavior
   - Unreliable keyboard navigation
   - Focus management issues
   - ARIA attribute conflicts

### View Mode Detection
The plugin automatically detects your current view mode and provides appropriate feedback:

1. **Warning Notifications**
   - A persistent warning banner appears in Live Preview mode
   - Temporary notices inform you when switching to Live Preview
   - Settings UI includes a prominent warning about the requirement

2. **Automatic Detection**
   - The plugin monitors view mode changes
   - Warnings are displayed immediately when needed
   - Notifications are cleared when switching to Reading View

3. **User Experience**
   - Clear, non-intrusive warnings
   - Easy-to-understand instructions
   - Smooth transition between modes
   - Consistent behavior across themes

### Best Practices
To ensure the best experience with OneiroMetrics:

1. **Always Use Reading View**
   - Switch to Reading View before opening metrics notes
   - Use the Reading View button in the top-right corner
   - Enable "Default to Reading View" in Obsidian settings if desired

2. **Theme Compatibility**
   - Test your theme in Reading View mode
   - Ensure proper contrast for metrics tables
   - Verify that animations work smoothly
   - Check accessibility features

3. **Performance Optimization**
   - Keep your metrics tables organized
   - Use filters to manage large datasets
   - Regular backups to maintain performance
   - Monitor log file sizes

## Configuring Metrics

### Project Note Path
- Set the path where your metrics table will be stored
- Use the smart file suggestion system to easily select an existing file
- Supports paths with spaces and special characters
- Year-based paths are suggested automatically (e.g., typing "2025" suggests "Journals/2025/2025.md")
- The file will be created if it doesn't exist
- **Note**: The plugin will create backups before making changes
- Use the Open Metrics Note button for quick access to your metrics note

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
- Customize metric icons using the icon picker
- View detailed metric descriptions in the Metrics Description section

### Managing Metrics
- Drag and drop to reorder metrics
- Use the edit button to modify existing metrics
- Use the delete button to remove metrics
- Changes are saved automatically
- Reset to defaults while preserving custom metrics
- Customize icons for better visual organization

## Adding Dream Metrics

### Callout Format
Use the following format in your dream journal entries:

```markdown
> [!dream-metrics]
> Sensory Detail: 4, Emotional Recall: 3, Lost Segments: 2, Descriptiveness: 3, Confidence Score: 5
```

### Using Templates

OneiroMetrics now provides a powerful template system with Templater integration for creating consistent dream journal entries.

#### Template Wizard

1. Open the Template Wizard using one of these methods:
   - Command palette: "Create Journal Template"
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

#### Templater Integration

For dynamic templates with automatic date insertion, user prompts, and conditional content:

1. **With Templater installed (recommended):**
   - Templates will use Templater's dynamic functionality
   - Date fields will automatically fill with the current date
   - Prompts will ask for information as you insert the template
   - Conditional content will adapt based on your inputs

2. **Without Templater installed (fallback):**
   - Templates will use a static version with placeholders
   - You'll see placeholders like `[[DATE: YYYY-MM-DD]]` instead of dynamic content
   - Tab through placeholders to fill them in manually
   - All essential functionality works, just without automation

#### Template Examples

**Basic Dream Journal Template:**
```markdown
# Dream Journal: <% tp.date.now("YYYY-MM-DD") %>

> [!dream]
> <% tp.system.prompt("Describe your dream", "") %>

> [!symbols]
> - <% tp.system.prompt("Symbol 1", "") %>: <% tp.system.prompt("Meaning", "") %>
> - <% tp.system.prompt("Symbol 2", "") %>: <% tp.system.prompt("Meaning", "") %>

> [!metrics]
> Clarity: <% tp.system.prompt("Rate clarity (1-10)", "7") %>
> Vividness: <% tp.system.prompt("Rate vividness (1-10)", "6") %>
> Coherence: <% tp.system.prompt("Rate coherence (1-10)", "5") %>
```

For more detailed information and advanced template techniques, see the [Templater Integration documentation](./TEMPLATER_INTEGRATION.md).

#### Complete Sample Journal Entry

```markdown
---
title: 2025-05-06
tags: [journal, dream, lucid]
date: 2025-05-06
---

> [!journal-entry] 2025-05-06
> ^20250506
> 
> ### 7:00am
>
>> [!dream-diary] Moonlight Painting [[2025-05-06]]
>> I was painting the wind with a brush made of moonlight. Each stroke created invisible ripples that rustled the leaves on silent trees. The colors of the wind were feelings: joy was a vibrant gold, sorrow a deep blue. A flock of paper cranes soared past, carrying the scent of distant memories.
>>
>> [!dream-metrics]
>> Words: 50, Sensory Detail: 3, Emotional Recall: 1, Lost Segments: 3, Descriptiveness: 4, Confidence Score: 5
> 
> ### 5:00pm
> 
> The rain outside mirrors the quiet unease within. Today, the old oak in the backyard seemed to sigh as the wind rustled its new leaves. I found a robin's eggshell, a fragile blue fragment, under the porch swing – a tiny echo of a life begun and ended. The sourdough starter is bubbling vigorously; a small victory in the face of a persistent melancholy I can't quite place. Perhaps a walk in Forest Park tomorrow will shake it off. The scent of damp earth always helps.
> 
> The city hums a low thrum. Coffee steams. The sky, a bruised purple, promises even more rain. A quiet Tuesday unfolds.
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

> **Tip:** The Dream Scrape modal includes a **Settings** button next to the Scrape button for quick access to plugin settings.

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
- **Date filter dropdown:** Quickly view entries from specific time ranges (Yesterday, This Week, Last 12 Months, etc.). The filter now works as intended and uses clear, human-friendly labels and color-coded icons for each filter state.
- Date range and metric filtering
- 'This Week' filter with configurable week start day
- Responsive design for all screen sizes
- Theme-aware styling
- Readable Line Length toggle for table width control
- Fast and reliable expand/collapse functionality for dream content
- Smooth scrolling that maintains your position when expanding entries
- Optimized performance for large dream journals
- Works consistently across all themes and with custom CSS

### Backup System
- Automatic backups are created before each update
- Backup files are named with timestamps
- Backups use .bak extension for better organization
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
  Dreams/2025.md
  ```

### File Suggestions
- Smart path matching for:
  - Spaces, dashes, underscores
  - Case-insensitive matching
  - Year-based paths
- Real-time validation and feedback
- Easy navigation through suggestions

## Date Tools

### Overview
The Date Tools feature provides comprehensive capabilities for analyzing dream entries across different time periods:

1. **Date Filter**
   - Custom date range selection
   - Quick filter presets (Today, Yesterday, This Week, etc.)
   - Favorites system for saved ranges
   - Filter state persistence

2. **Multi-month Calendar**
   - View multiple months simultaneously
   - Select date ranges across months
   - Week number display
   - Intuitive navigation

3. **Date Comparison**
   - Compare different time periods
   - Analyze patterns and trends
   - Compare metrics across periods
   - Visual comparison tools

4. **Pattern Analysis**
   - Theme recurrence analysis
   - Emotional pattern detection
   - Temporal pattern recognition
   - Statistical analysis

### Using Date Tools

1. **Accessing Date Tools**
   - Click the Date Tools button in the metrics table
   - Use the command palette (Ctrl/Cmd + P)
   - Access through the OneiroMetrics note

2. **Date Filter Usage**
   - Select from quick filter presets
   - Choose custom date range
   - Save favorite ranges
   - Clear active filter

3. **Calendar Features**
   - Navigate between months
   - Select date ranges
   - View week numbers
   - Compare periods

4. **Analysis Tools**
   - Compare different time periods
   - View pattern analysis
   - Export comparison data
   - Save analysis results

For detailed technical information about date handling implementation, see the [Date Tools Plan](DATE_TOOLS_PLAN.md).

## Layout and Styling

For comprehensive information about layout options, styling features, and theme integration, see the [Layout and Styling Technical Specification](LAYOUT_AND_STYLING.md).

## State Persistence

The plugin maintains your preferences across sessions, including expanded/collapsed states for dream entries. For detailed information about state persistence features and implementation, see the [State Persistence](STATE_PERSISTENCE.md) documentation.

## Tips & Troubleshooting

### Performance Tips
- Keep your metrics tables organized and use filters to manage large datasets
- The Dream Entries table is optimized for large dream journals and will remain fast even with hundreds of entries
- Regular backups help maintain performance
- Monitor log file sizes to prevent disk space issues

### Common Issues
- **View Mode**: Always use Reading View mode for the best experience
- **Theme Compatibility**: If you experience any display issues, try switching to a different theme
- **Button Responsiveness**: If a "Show more" button ever stops responding, use the debug button at the top of the note to reset the table's event listeners
- **Scroll Position**: The table maintains your scroll position when expanding/collapsing entries, even with large datasets

### Debug Tools
- Use the debug button (visible when logging is set to Debug) to:
  - Reset event listeners if buttons become unresponsive
  - Force a table refresh
  - View diagnostic information
  - Clear any stuck states

> **Tip:** To access the debug button, set Logging Level to **Debug** in OneiroMetrics settings.

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
   - They use .bak extension for better organization
   - You can safely delete old backups

4. **Table Display Issues**
   - Use the Readable Line Length toggle to control table width
   - Check if the table is properly contained within the table container
   - Verify that the readable line length setting isn't affecting the table
   - Ensure your theme supports the table styling

### Getting Help
- Check the plugin settings for configuration options
- Review the validation messages for specific issues
- Visit the GitHub repository for updates and support
- Check the console for detailed error messages

## Settings

OneiroMetrics provides a comprehensive settings page for configuring how your dream metrics are tracked, displayed, and analyzed.

### Accessing Settings
You can access the OneiroMetrics settings in several ways:
- **Dream Scrape modal:** Click the 'Settings' button next to 'Scrape Metrics'.
- **OneiroMetrics note:** Click the 'Settings' button at the top of the metrics note.
- **Command palette:** Press Ctrl/Cmd + P and type "OneiroMetrics Settings".
- **Ribbon icon:** Right-click the wand icon in the sidebar and select settings.

### Settings Sections

#### 1. OneiroMetrics Buttons
- Toggle the visibility of the Dream Scrape and Note buttons in the ribbon.
- Each toggle is labeled with an icon for clarity.

#### 2. Metrics Note and Callout Name
- **OneiroMetrics Note:** Set the path to the note where your metrics table will be written.
- **Metrics Callout Name:** Customize the callout name used for dream metrics in your journal entries.

#### 3. File or Folder Selection
- Choose whether to select individual notes or a folder for metrics scraping.
- Configure which notes or folder are included in metrics analysis.

#### 4. Metrics Settings
- Add, edit, enable, or disable dream metrics.
- Metrics are grouped into **Enabled Metrics** and **Disabled Metrics** for easy management.
- Use the icon picker to customize metric icons.
- View detailed metric descriptions.

#### 5. Advanced Options
- Configure week start day for the 'This Week' filter.
- Toggle readable line length override for tables.
- Access import/export options for metrics configuration.

> **Note:** For technical details about settings structure and implementation, see [SPECIFICATION.md](SPECIFICATION.md).
> **Note:** For information about the upcoming custom date range picker feature, see [DATE_TOOLS_PLAN.md](DATE_TOOLS_PLAN.md). 