# Changelog

All notable changes to the Dream Metrics plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-08

### Added
- Initial release of Dream Metrics plugin
- Core functionality for tracking dream metrics using callout blocks
- Settings page with customizable metrics
- Quick-access modal for metric scraping
- Default metrics:
  - Sensory Detail (1-5)
  - Emotional Recall (1-5)
  - Lost Segments (0-10)
  - Descriptiveness (1-5)
  - Confidence Score (1-5)
- Project note generation with sortable tables
- Custom metric support
- Ribbon icon and command palette integration

## [0.1.1] - 2025-05-08

### Added
- Enhanced metric management UI with a dedicated editor modal
- Real-time validation for metric names, ranges, and descriptions
- Live preview of how metrics will appear in callouts
- Keyboard shortcuts for the metric editor
- Drag-and-drop reordering of metrics
- Visual feedback for drag and drop operations
- Improved focus states and button interactions
- Smart file suggestions for Project Note Path field
- Autocomplete functionality for file selection

### Changed
- Updated ribbon icon to use Lucide shell icon
- Improved Project Note Path field with file suggestions
- Enhanced metric list UI with better spacing and typography
- Improved error handling and validation feedback
- Reset functionality now preserves custom metrics while restoring defaults
- Updated documentation to reflect new features and improvements

### Fixed
- Fixed type issues in the settings implementation
- Improved error handling for file operations

## [0.1.0] - 2025-05-08

### Added
- Initial release
- Basic metric tracking functionality
- Settings management
- Project note generation
- Callout-based metric storage
- Default metrics configuration 