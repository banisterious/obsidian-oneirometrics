## OneiroMetrics

> **Track, analyze, and visualize your dream journal metrics in Obsidian.**

<p align="center">
  <img src="docs/images/gsa-barn.jpg" alt="A country barn painting, representing the foundation of dream journaling." width="600"/>
</p>
<p align="center"><em>“Barn at Sunrise” by Gary Armstrong, inspiration for OneiroMetrics</em></p>

---

### Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Settings](#settings)
- [Debugging & Logging](#debugging--logging)
- [Recent Fixes](#recent-fixes)
- [Documentation](#documentation)
- [Support](#support)
- [License](#license)

---

## Features

- Track customizable dream metrics (e.g., sensory detail, emotional recall)
- Filter entries by date with intuitive dropdowns and calendar
- Favorites system for custom date ranges
- Summary tables and visualizations
- Export data for further analysis
- Accessibility and keyboard navigation
- Mobile-optimized, responsive UI
- Backup system for your data
- Powerful logging and debug tools

### Ribbon Button Visibility
- The plugin now uses a single toggle to control both ribbon buttons (Dream Scrape Tool and Open Metrics Note) due to an Obsidian API limitation. See the archived investigation: [docs/archive/RIBBON_BUTTON_BUG_PLAN.md].

## Journal Structure Check

OneiroMetrics now includes a powerful journal structure validation system to help maintain consistent dream journal entries:

### Key Features

- **Structure Validation**: Validate your dream journal entries against defined structures
- **Template System**: Create and use templates for consistent journal entries
- **Templater Integration**: Use [Templater](https://github.com/SilentVoid13/Templater) templates for dynamic journal entries
- **Quick Fixes**: Apply automatic fixes for common structure issues
- **Visual Validation**: Identify structure issues within the editor
- **Nested Structures**: Support for both flat and nested callout structures

### Using Journal Structure Check

1. Enable the feature in settings
2. Create or use the default journal structures
3. Validate your entries with the `Validate Dream Journal Structure` command
4. Create templates with the template wizard
5. Apply templates to new journal entries

### Templater Integration

If you have the Templater plugin installed, you can use Templater templates for your dream journal entries. This allows you to use dynamic content such as:

- Date variables
- System information
- User prompts
- Custom scripts

To use Templater integration:
1. Enable Templater integration in the settings
2. Select your template folder
3. Choose templates in the template wizard

---

## Quick Start

1. **Install:** In Obsidian, go to Settings → Community Plugins → Browse, search for "OneiroMetrics", and install.
2. **Enable:** Turn on the plugin in Community Plugins.
3. **Set Up:** Create a note for your dream journal. Add entries using the callout format:
   ```markdown
   > [!dream-metrics]
   > Words: 343, Sensory Detail: 3, Emotional Recall: 3
   ```
4. **Configure:** Open OneiroMetrics settings to select your metrics note, choose notes/folders to analyze, and adjust preferences.

---

## Usage

- **Reading View Required:** OneiroMetrics works best in Reading View. If you open a metrics note in Live Preview, you'll see a warning.
- **Access Settings:**  
  - In the Dream Scrape modal, click the 'Settings' button next to 'Scrape Metrics'.
  - In your metrics note, click the 'Settings' button at the top.
  - Use the command palette: `Ctrl/Cmd + P` → "OneiroMetrics Settings".
  - Right-click the wand icon in the sidebar.

- **Filtering:** Use the date filter dropdown to quickly view entries from "Yesterday", "This Week", "Last 12 Months", and more. Save your favorite ranges for quick access.

- **Metrics Table:** View, sort, and analyze your dream data in a responsive table. Use the Readable Line Length toggle for optimal display.

- **Backups:** Enable automatic backups in settings to protect your data.

---

## Settings

- **Metrics Note Path:** Where your summary table is stored.
- **Selected Notes/Folders:** Choose which notes to analyze.
- **Metrics:** Add, edit, or remove metrics. Customize names, icons, ranges, and descriptions.
- **Display:** Toggle readable line length, configure week start day, and view metric descriptions.
- **Backups:** Enable/disable, set backup folder, and manage backup files.
- **Logging:** Set log level (Off, Errors, Warn, Info, Debug, Trace).  
  - Logging is **Off** by default. Enable only for troubleshooting.

---

## Debugging & Logging

- **Debug Button:**  
  - Appears only when Logging Level is set to **Debug** in settings.
  - Use it to reset event listeners, refresh tables, and view diagnostics.
- **How to Enable:**  
  - Go to OneiroMetrics settings → Logging → set Logging Level to **Debug**.
- See [Logging Guide](docs/LOGGING.md) for advanced usage.

---

## Recent Fixes

- "Show more" button now reliably expands/collapses dream content.
- Scroll jump issues resolved for stable table view.
- Table performance improved for large datasets.
- Date filter dropdown and status display now work as intended.
- **Settings button** in both the Dream Scraper modal and metrics note now always opens the correct OneiroMetrics settings tab.

See [ISSUES.md](ISSUES.md#fixed-issues) for more.

---

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Usage Guide](docs/USAGE.md)
- [Logging Guide](docs/LOGGING.md)
- [Known Issues](ISSUES.md)
- [Release Notes](CHANGELOG.md)
- [Metrics Guide](docs/METRICS.md)
- [Testing Guide](docs/TESTING.md)
- [Date Tools Plan](docs/DATE_TOOLS_PLAN.md)

---

## Support

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Open a new issue with details and steps to reproduce

---

## License

MIT License – see [LICENSE.md](LICENSE.md)

---

**For advanced details, see the [docs/](docs/) folder.** 