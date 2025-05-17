<p align="center">
  <img src="docs/images/gsa-barn.jpg" alt="A country barn painting, representing the foundation of dream journaling." width="600"/>
</p>
<p align="center"><em>“Barn at Sunrise” by Gary Armstrong, inspiration for OneiroMetrics</em></p>

# OneiroMetrics

OneiroMetrics is an Obsidian plugin that helps you track and analyze metrics from your dream journal entries.

## Features

- Track various dream metrics (sensory detail, emotional recall, etc.)
- Generate summary tables and visualizations
- Export data for further analysis
- Customizable metrics and settings

## Requirements

- Obsidian v1.0.0 or higher
- Reading View mode (Live Preview is not supported)
- Node.js 16+
- TypeScript 5.4+
- esbuild 0.20+

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "OneiroMetrics"
4. Click Install
5. Enable the plugin

## Usage

### Important Note About View Mode

OneiroMetrics requires Reading View to function properly. Live Preview mode is not supported as it may cause layout issues and inconsistent behavior. When you open a OneiroMetrics note:

- A warning will be displayed if you're in Live Preview mode
- The plugin will automatically detect the view mode and show appropriate notifications
- For the best experience, always use Reading View when working with OneiroMetrics notes

### Setting Up Your Dream Journal

1. Create a new note for your dream journal
2. Add a callout block with the format:
   ```markdown
   > [!dream-metrics]
   > Words: 343, Sensory Detail: 3, Emotional Recall: 3
   ```
3. Configure your metrics in the plugin settings

## Features

- Track multiple customizable metrics for each dream entry
- Automatically scrape metrics from dream journal entries
- Generate detailed analysis tables with sortable columns
- Enhanced time filter UI with:
  - Visual calendar preview
  - Duration and relative time indicators
  - SVG icons for quick recognition
  - Full keyboard navigation
  - Screen reader support
  - High contrast mode
  - Mobile-optimized layout
- Filter entries by date range and specific metrics
- Backup system to protect your data
- Customizable settings for metrics and data management
- Multi-chip autocomplete for selecting notes to analyze
- Metric Icon Picker for visual customization
- Keyboard accessibility and screen reader support
- 'This Week' filter with configurable week start day
- Widget for Readable Line Length control
- Enhanced Metrics Description section
- Open Metrics Note button for quick access

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md) - Detailed project status, architecture, and development guidelines
- [Testing Guide](docs/TESTING.md) - Comprehensive testing procedures and requirements
- [Known Issues](docs/ISSUES.md) - Current bugs and feature requests
- [Release Notes](CHANGELOG.md) - Version history and changes
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [Metrics Guide](docs/METRICS.md) - Detailed descriptions of dream metrics and scoring guidelines
- [Usage Guide](docs/USAGE.md) - Detailed instructions for using the plugin
- [Logging Guide](docs/LOGGING.md) - Information about the plugin's logging system and debugging capabilities

## Setup

1. Install the plugin through Obsidian's Community Plugins browser
2. Enable the plugin in Obsidian's settings
3. Configure your settings:
   - Set your project note path where metrics tables will be written
   - Select your dream journal notes to analyze
   - Configure backup settings (optional)
   - Customize metrics as needed

## Settings

### Project Note
- **OneiroMetrics Path:** Path to the main note where your dream metrics are stored (previously called "Project Note").
- **Selected Notes/Folders:** Choose individual notes or entire folders to analyze for dream metrics.
- **Open Metrics Note:** Quick access button to open your metrics note

### Backup Settings
- **Enable Backups**: Toggle to enable/disable automatic backups (enabled by default)
- **Backup Folder**: Select an existing folder where backups will be stored
- **Note**: Backups are created automatically before any changes to the project note
- **Backup Extension**: Uses .bak extension for better file management

### Metrics Configuration
- Add, edit, or remove metrics
- Each metric includes:
  - Name
  - Icon (customizable via icon picker)
  - Valid range (min/max)
  - Description
- Default metrics provided:
  - Sensory Detail (1-5)
  - Emotional Recall (1-5)
  - Lost Segments (0-10)
  - Descriptiveness (1-5)
  - Confidence Score (1-5)

### Display Settings
- **Readable Line Length**: Toggle to override table width
- **This Week Filter**: Configure week start day
- **Metrics Description**: View detailed metric information

### Logging Settings
- **Logging Level**: Control logging verbosity (Off/Errors Only/Debug)
- **Maximum Log Size**: Set log file size limit in MB
- **Maximum Backups**: Configure number of backup log files
- **Note**: Logging is set to "Off" by default. Enable logging only when needed for debugging issues.

## Accessing Settings

You can quickly access the OneiroMetrics settings in several ways:
- **Dream Scrape modal:** Click the 'Settings' button next to 'Scrape Metrics'.
- **OneiroMetrics note:** Click the 'Settings' button at the top of the metrics note.
- **Command palette:** Press Ctrl/Cmd + P and type "OneiroMetrics Settings".
- **Ribbon icon:** Right-click the wand icon in the sidebar and select settings.

## Tips
- Create a dedicated folder for backups to keep your vault organized
- Regular backups are recommended when making significant changes
- Use the date range and metric filters to focus on specific aspects of your dreams
- Sort table columns to identify patterns in your dream journal
- Use the Readable Line Length toggle to optimize table display
- Customize metric icons for better visual organization

## Support
If you encounter any issues or have suggestions, please:
1. Check the GitHub issues page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## License
MIT License - see LICENSE file for details

## Recent Fixes (May 2025)

- The "Show more" button for dream content now reliably expands and collapses content in the Dream Entries table across all tested themes and with/without custom CSS snippets
- Scroll jump issues have been resolved; expanding/collapsing rows now keeps the view stable and predictable
- The number of visible rows in the Dream Metrics table has been reduced from 25 to 12 for better performance and responsiveness
- All debug and backup log files are now stored in the `logs/` folder and excluded from version control
- A temporary debug button ("Debug: Attach Show More Listeners") is available at the top of the project note to manually attach event listeners for expand/collapse buttons if needed
- Backup files now use the .bak extension instead of .md for better file management
- **See [docs/ISSUES.md](docs/ISSUES.md#fixed-issues) for a detailed summary of these and other recent fixes.**

> For previous updates, see the [Release Notes](#release-notes) section below.

## Release Notes

- All debug and backup log files are now stored in the `logs/` folder and excluded from version control
- A temporary debug button ("Debug: Attach Show More Listeners") is available at the top of the project note to manually attach event listeners for expand/collapse buttons if needed
- Backup files now use the .bak extension instead of .md for better file management

## Current State and Future Plans (May 2025)

### Current Status
- Metrics scraping is working correctly, processing entries and callouts as expected
- Button functionality has been stabilized but requires architectural improvements
- Debug logging has been optimized for better troubleshooting
- Performance monitoring has been added for critical operations

### Known Issues
- Button state management needs improvement for better reliability
- DOM manipulation could be more efficient
- Event handling could be more robust
- State management is currently scattered across multiple components

### Planned Refactoring
A major refactoring is planned to improve the plugin's architecture and reliability:

1. **State Management Layer**
   - Centralized state management
   - Predictable state updates
   - Better debugging capabilities

2. **DOM Management Layer**
   - Improved DOM manipulation
   - Better lifecycle management
   - Enhanced cleanup handling

3. **Event Handling Layer**
   - Centralized event handling
   - Improved event delegation
   - Better memory management

4. **Metrics Processing Layer**
   - Isolated metrics processing
   - Better validation
   - Improved error handling

### Testing Status
- Unit tests are being developed for core functionality
- Integration tests are planned for the refactored architecture
- Performance benchmarks will be established
- Accessibility testing is ongoing

### Next Steps
1. Implement core infrastructure for the refactoring
2. Migrate existing features to the new architecture
3. Add comprehensive testing
4. Improve performance and reliability

## New Features (May 2025)

- **OneiroMetrics Path:** Path to the main note where your dream metrics are stored (previously called "Project Note").
- **Selected Notes/Folders:** Choose individual notes or entire folders to analyze for dream metrics.

## Development

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.

### Troubleshooting

- If you encounter the error `TypeError: esbuild.context is not a function`, ensure your esbuild version is at least 0.20.0. You can update it by running `npm install esbuild@latest`.

## Security & Privacy

See [SECURITY.md](./SECURITY.md) for our full privacy and data protection policy.

## Scraping Modal Overhaul (2025)

The OneiroMetrics Scraping Modal has been completely overhauled:
- New two-column layout with left-aligned labels and right-aligned widgets
- Dismissible note at the top for user guidance
- Improved folder and note autocomplete with wide, readable dropdowns
- Progress bar now at the bottom of the modal
- Responsive design and modern UI polish
- All planned Scrape Modal UI/UX improvements are complete and the modal is ready for release. 