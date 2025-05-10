# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-05-09

### Added
- Automatic backup system for project notes
- Confirmation dialog before updating metrics
- Content preservation for project notes
- Visual indicators for backup files in file explorer
- Enhanced error handling and user feedback
- Multi-chip autocomplete for note selection in both Settings and modal
- Smart file suggestion system with improved path matching
- Content cleaning for markdown elements
- Real-time validation feedback for metrics
- Enhanced table styling with optimized column widths
- Full-width table sections that override readable line length
- Center-aligned numeric metrics for better readability
- Improved filter controls layout
- Better organization of Dream Entries section

### Changed
- Improved project note update process
- Enhanced documentation with new features
- Updated styling for better visual feedback
- Updated project note format to include summary and detailed sections
- Enhanced file suggestion logic for year-based paths
- Improved content preview with expandable/collapsible sections
- Optimized table layout for better space utilization
- Reduced overall table font sizes for better readability
- Enhanced error handling with backup restoration options
- Improved theme integration and mobile responsiveness

### Fixed
- Potential data loss during metrics updates
- Content preservation issues in project notes
- Table width issues with Readable Line Length setting
- File suggestion improvements for year-based paths
- Content cleaning for markdown elements
- Theme compatibility issues
- Mobile responsiveness issues
- **Dream Content Rendering:** Dream diary entries are now captured and rendered exactly as expected, including proper handling of HTML (e.g., <br>), ampersands, and all blockquote/callout edge cases.

## [0.1.1] - 2024-03-18

### Added
- Enhanced UI/UX features
- Improved validation feedback
- Smart file suggestions
- Real-time metric validation

### Changed
- Updated documentation
- Improved error handling
- Enhanced user feedback

## [0.1.0] - 2024-03-17

### Added
- Initial release
- Basic dream metrics functionality
- Customizable metrics
- Project note generation
- Metric validation
- File path autocomplete

## [0.1.3] - 2025-05-10

### Changed
- Modal's Selected Notes autocomplete now only shows real, existing markdown files (not folders or non-existent files), matching the settings page behavior.
- UI and logic clean-up for autocomplete fields in both settings and modal.

### Fixed
- Fixed issue where modal's Selected Notes field would show suggested or non-existent files and folders.
- Fixed variable shadowing and event handler context issues in modal autocomplete logic.

## [0.2.0] - 2024-05-10

### Added
- **Metric Icon Picker:** You can now select a custom icon for any metric, including custom ones, via a user-friendly picker in the Metric Editor Modal.
- **Keyboard & Accessibility:** Metric reordering and expand/collapse UI are now fully keyboard accessible and screen reader friendly.
- **UI Polish:** Improved spacing, grouping, and visual clarity in the Metric Editor Modal and metrics list.

### Changed
- **Autocomplete & Suggestion UI:** All inline styles have been moved to the stylesheet for better maintainability and theming.
- **Dream Content Expand/Collapse:** Now features smooth animation and improved accessibility.
- **Table Sorting/Filtering:** Logic moved to an external JS file for maintainability.

### Fixed
- **Dream Content Extraction:** `[!dream-metrics]` callouts and their content are now stripped from dream content previews and exports.
- **Metric Settings Live Preview:** All changes (name, range, description) now update the preview instantly.
- **Metric Reordering:** Preserves scroll position and focus after reordering or removing metrics.

### Planned
- Add search/filter to the icon picker.
- Add more icons to the icon picker.
- Add a Test Modal where users can paste Markdown and see how the plugin processes and renders it.
- Modify backup files so that the file names end in .backup or another appropriate extension, to avoid having files be discoverable markdown documents in Obsidian. 