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
- Smart file suggestions for project note path
- Preserve custom metrics when resetting defaults

## Documentation

- [[docs/SPECIFICATION.md|Technical Specification]] - Detailed technical documentation
- [[docs/USAGE.md|Usage Guide]] - How to use the plugin
- [[CHANGELOG.md|Changelog]] - Version history and changes
- [[RELEASING.md|Release Guide]] - Information about releases

## Development

- Built with TypeScript
- Uses Obsidian's plugin API
- Follows semantic versioning
- MIT licensed

## Repository

- GitHub: [OneiroMetrics](https://github.com/banisterious/oneirometrics)
- Current Version: 0.1.1

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Disable Safe Mode
4. Click Browse and search for "OneiroMetrics"
5. Click Install
6. Enable the plugin

## Usage

1. Configure your metrics in the plugin settings
   - Use the autocomplete field for project note path
   - Add custom metrics with real-time validation
   - Reset defaults while preserving custom metrics
2. Add dream metrics to your journal entries using callouts:
   ```markdown
   > [!dream-metrics]
   > Sensory Detail: 4, Emotional Recall: 3, Lost Segments: 2
   ```
3. Use the ribbon icon or command palette to analyze your dreams
4. View the generated metrics in your project note

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 