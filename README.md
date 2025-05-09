# OneiroMetrics

A plugin for Obsidian that turns dreams into data by tracking and analyzing dream journal metrics.

## Overview

OneiroMetrics (OOM) provides tools for analyzing dream journal entries, generating metrics, and visualizing patterns in your dreams. The plugin integrates seamlessly with Obsidian's interface and supports both manual and automated analysis.

## Key Features

- Dream journal analysis with detailed metrics
- Customizable analysis parameters
- Interactive metrics visualization
- Support for both manual and automated processing
- Seamless Obsidian integration
- Enhanced metric management with:
  - Real-time validation
  - Live preview
  - Drag-and-drop reordering
  - Keyboard shortcuts
  - Visual feedback
- Smart file suggestions with:
  - Multi-chip autocomplete
  - Year-based path suggestions
  - Case-insensitive matching
  - Support for spaces and special characters
- Preserve custom metrics when resetting defaults
- Responsive table layout with optimized column widths
- Full-width table support (overrides readable line length)
- Automatic content cleaning for markdown elements
- Automatic backup system with timestamped backups
- Expandable/collapsible content preview
- Center-aligned numeric metrics
- Date range and metric filtering

## Documentation

- [[docs/SPECIFICATION.md|Technical Specification]] - Detailed technical documentation
- [[docs/USAGE.md|Usage Guide]] - How to use the plugin
- [[CHANGELOG.md|Changelog]] - Version history and changes
- [[RELEASING.md|Release Guide]] - Information about releases
- [[TESTING.md|Testing Guide]] - Testing and troubleshooting information

## Development

- Built with TypeScript
- Uses Obsidian's plugin API
- Follows semantic versioning
- MIT licensed

## Repository

- GitHub: [OneiroMetrics](https://github.com/banisterious/oneirometrics)
- Current Version: 0.1.2

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Disable Safe Mode
4. Click Browse and search for "OneiroMetrics"
5. Click Install
6. Enable the plugin

## Usage

1. Configure your metrics in the plugin settings
   - Use the smart file suggestion system for project note path
   - Add custom metrics with real-time validation
   - Reset defaults while preserving custom metrics
2. Add dream metrics to your journal entries using callouts:
   ```markdown
   > [!dream-metrics]
   > Sensory Detail: 4, Emotional Recall: 3, Lost Segments: 2
   ```
3. Use the ribbon icon or command palette to analyze your dreams
4. View the generated metrics in your project note:
   - Summary section with averages and statistics
   - Detailed section with expandable content
   - Sortable and filterable columns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 