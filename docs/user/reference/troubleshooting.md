# OneiroMetrics Troubleshooting Guide

This guide addresses common issues users may encounter when using OneiroMetrics and provides solutions.

## Table of Contents
- [View Mode Issues](#view-mode-issues)
- [Metrics Not Appearing](#metrics-not-appearing)
- [Table Display Problems](#table-display-problems)
- [Missing or Incorrect Data](#missing-or-incorrect-data)
- [Performance Issues](#performance-issues)
- [Button and UI Problems](#button-and-ui-problems)
- [Template Issues](#template-issues)
- [Logging and Debugging](#logging-and-debugging)
- [Getting Help](#getting-help)

## View Mode Issues

**Problem:** Tables don't render correctly or show raw markdown

**Solutions:**
- Switch to Reading View mode using the button in the top-right corner of Obsidian
- If already in Reading View, try toggling back to Live Preview and then to Reading View again
- Restart Obsidian and open the note in Reading View

**Why:** OneiroMetrics requires Reading View for stable table rendering and interactive elements. Live Preview mode has limitations that prevent proper rendering of complex tables and interactive buttons.

## Metrics Not Appearing

**Problem:** Metrics aren't showing up in the table after scraping

**Solutions:**
1. **Check Callout Format:**
   - Ensure your callout name matches what's set in settings (default is `dream-metrics`)
   - The format must be exactly: `> [!dream-metrics]`
   - Followed by metrics on the next line: `> Metric1: value, Metric2: value`

2. **Check Selected Notes:**
   - Verify the notes you're trying to analyze are selected in OneiroMetrics settings
   - Try manually selecting the notes again in the scraper modal

3. **Check Metric Names:**
   - Metric names in your journal must match those in settings exactly (case sensitive)
   - Common errors: extra spaces, typos, or different capitalization

4. **Example of Correct Format:**
   ```markdown
   > [!dream-metrics]
   > Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 3
   ```

## Table Display Problems

**Problem:** Table appears broken, misaligned, or with incorrect formatting

**Solutions:**
1. **Toggle Readable Line Length:**
   - Try toggling the "Override Readable Line Length" option in settings
   - In the metrics note, click the toggle below the "Dream Entries" heading

2. **Check Theme Compatibility:**
   - Some themes may interfere with table styling
   - Try switching to a default Obsidian theme temporarily to check

3. **CSS Snippets:**
   - If you use custom CSS snippets, they might conflict with the plugin's styling
   - Try disabling CSS snippets temporarily

4. **Clear Cache:**
   - Go to Settings → About → "Force Reload Application"
   - This refreshes Obsidian and clears temporary data

## Missing or Incorrect Data

**Problem:** Some dream entries or metrics are missing or incorrect

**Solutions:**
1. **Check Date Formats:**
   - OneiroMetrics needs to extract dates from your journal entries
   - Ensure dates are in a standard format (YYYY-MM-DD is best)
   - If using block references for dates, ensure they're properly formatted

2. **Validation Issues:**
   - Check if metric values are within the defined ranges in settings
   - Invalid values might be ignored during scraping

3. **Nested Structures:**
   - If using nested journal structures, ensure proper nesting of callouts
   - See the [Journal Structure Guide](../guides/journal-structure.md) for details

4. **Re-run Scraping:**
   - Try running the scraper again with fewer notes to isolate issues
   - Look for any error messages during scraping

## Performance Issues

**Problem:** Plugin is slow, unresponsive, or causes Obsidian to lag

**Solutions:**
1. **Large Datasets:**
   - If you have hundreds of entries, try using date filters to focus on specific periods
   - Split your journal by year if it's very large

2. **Reduce Notes:**
   - Select fewer notes for scraping at once
   - Process one year or month at a time

3. **Optimize Settings:**
   - Disable metrics you don't need
   - Ensure virtualization is working (only shows ~12 rows at a time)

4. **Check Resource Usage:**
   - Open developer tools (Ctrl+Shift+I) and check for memory leaks
   - Close and reopen Obsidian to free up resources

## Button and UI Problems

**Problem:** "Show more" buttons don't work or UI elements are unresponsive

**Solutions:**
1. **Debug Mode:**
   - In settings, set Logging Level to "Debug"
   - A debug button will appear at the top of the metrics note
   - Click "Debug: Attach Show More Listeners" to reset buttons

2. **Check for Errors:**
   - Open developer tools (Ctrl+Shift+I)
   - Look for any errors in the Console tab
   - Filter for "OOM" to see plugin-specific messages

3. **Refresh View:**
   - Switch between Reading View and Live Preview
   - Close and reopen the note
   - Force reload Obsidian (Ctrl+R)

## Template Issues

**Problem:** Templates aren't working correctly or Templater integration issues

**Solutions:**
1. **Templater Not Installed:**
   - If using Templater features, ensure the Templater plugin is installed and enabled
   - Templates will still work without Templater but will use static placeholders

2. **Template Format:**
   - Check template syntax for errors
   - Ensure paths to template files are correct
   - Try using a simpler template to isolate issues

3. **Placeholder Navigation:**
   - If placeholders aren't working, check format: `[[PLACEHOLDER: text]]`
   - Tab key should navigate between placeholders

4. **Reset Templates:**
   - Try creating a new template from scratch
   - See [Templater Integration](../guides/templater.md) for correct formats

## Logging and Debugging

For advanced troubleshooting, enable logging:

1. **Enable Debug Logs:**
   - Go to OneiroMetrics settings → Logging → set level to "Debug"
   - This will log detailed information to the console

2. **Access Logs:**
   - Open developer tools with Ctrl+Shift+I (or Cmd+Option+I on Mac)
   - Go to the Console tab
   - Filter for "OOM" to see plugin-specific logs

3. **Debug Tools:**
   - With logging set to Debug, a "Debug" button appears in the metrics note
   - Use this to reset listeners, force refresh, or view state information

4. **Log Files:**
   - Check the `logs/` folder in your vault for log files
   - These contain detailed information about plugin operations

## Getting Help

If you still can't resolve your issue:

1. **Check Known Issues:**
   - Review the [ISSUES.md](../../../ISSUES.md) file for known problems

2. **Community Support:**
   - Post in the Obsidian forum with details about your issue
   - Include your Obsidian version, plugin version, and OS

3. **GitHub Issues:**
   - Report bugs on the GitHub repository
   - Include steps to reproduce, expected behavior, and actual behavior
   - Attach screenshots or console logs if possible

4. **Submit Detailed Reports:**
   - Describe the exact steps to reproduce the issue
   - Include relevant parts of your logs
   - Mention any theme or other plugins that might be relevant
   - Specify your operating system and Obsidian version

---

For more assistance, check the [Usage Guide](../guides/usage.md) for detailed feature documentation. 