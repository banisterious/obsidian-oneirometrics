# Getting Started with OneiroMetrics

This guide will help you install, configure, and start using OneiroMetrics to track and analyze your dream journal entries in Obsidian.

## Table of Contents
- [Installation](#installation)
- [Initial Configuration](#initial-configuration)
- [Creating Your First Dream Entry](#creating-your-first-dream-entry)
- [Analyzing Your Dreams](#analyzing-your-dreams)
- [Next Steps](#next-steps)

## Installation

1. **Open Obsidian Settings**
   - Click the settings icon in the sidebar or use the keyboard shortcut `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)

2. **Navigate to Community Plugins**
   - In the settings sidebar, select "Community plugins"

3. **Browse Community Plugins**
   - Click "Browse" to open the community plugin browser
   - Search for "OneiroMetrics" in the search field

4. **Install the Plugin**
   - Find OneiroMetrics in the results and click "Install"

5. **Enable the Plugin**
   - After installation, toggle the switch to enable OneiroMetrics
   - A ribbon icon (wand) will appear in the left sidebar

## Initial Configuration

After installing OneiroMetrics, you'll need to configure a few basic settings:

1. **Open OneiroMetrics Settings**
   - Click the settings icon in the sidebar
   - Select "OneiroMetrics" from the list of plugin settings

2. **Set OneiroMetrics Note Path**
   - This is where your metrics tables will be stored
   - You can type a path or click in the field for smart suggestions
   - Example: `Dream Journal/Dream Metrics.md`

3. **Select Dream Journal Notes**
   - Choose which notes contain your dream journal entries
   - Use the multi-chip autocomplete to select individual notes
   - Or switch to "Folder" mode to select an entire folder

4. **Verify Settings**
   - Make sure the callout name matches what you'll use in your journal entries
   - Default is `dream-metrics`
   - Customize metrics if desired (can also be done later)

## Creating Your First Dream Entry

OneiroMetrics works by analyzing specially formatted callouts in your dream journal notes:

1. **Create a New Note**
   - Create a new note for your dream entry or open an existing journal note
   - Remember that Reading View is required for full functionality

2. **Add Dream Content**
   - Write your dream content as you normally would
   - Include as much detail as you want to record

3. **Add Dream Metrics Callout**
   - After your dream description, add a callout using this format:
   ```markdown
   > [!dream-metrics]
   > Sensory Detail: 4, Emotional Recall: 3, Descriptiveness: 3, Confidence Score: 5
   ```
   - Adjust metric values based on your experience (typically on a scale of 1-5)

4. **Using Templates (Optional)**
   - For easier entry creation, you can use the Template Wizard
   - Access it via command palette: "Create Journal Template"
   - Or see [Templater Integration](./templater.md) for advanced options

## Analyzing Your Dreams

Once you've created some dream entries, you can analyze them:

1. **Open Dream Scraper**
   - Click the wand icon in the sidebar, or
   - Use command palette: "Open Dream Journal Manager"

2. **Select Notes to Analyze**
   - Choose the notes containing your dream entries
   - These should match what you set in settings

3. **Run Analysis**
   - Click "Scrape Metrics" to begin analysis
   - Wait for the process to complete

4. **View Results**
   - Your metrics note will open automatically
   - You'll see two main sections:
     - **Dream Metrics Summary**: Averages and statistics for each metric
     - **Dream Entries**: Detailed table of all dreams with metrics

5. **Using the Table**
   - **Sort**: Click column headers to sort by any metric
   - **Filter**: Use the date filter dropdown to view specific time periods
   - **Expand**: Click "Show more" to see full dream content
   - **Navigate**: Click dream titles to go to the original entries

## Next Steps

Now that you've set up OneiroMetrics and created your first entries, here are some next steps:

- **Customize Metrics**: Add, edit, or disable metrics in settings
- **Create Templates**: Set up templates for consistent journal entries
- **Explore Filtering**: Use date tools to analyze patterns over time
- **Try Advanced Features**: Explore Templater integration for dynamic templates

## Additional Resources

- [Usage Guide](./usage.md): Comprehensive documentation of all features
- [Journal Structure](./journal-structure.md): Learn about structuring your dream journal
- [Templater Integration](./templater.md): Advanced template features
- [View Mode Requirements](./view-mode.md): Important information about view modes

---

For help or questions, check the [Troubleshooting Guide](../reference/troubleshooting.md) or visit the project's GitHub repository. 