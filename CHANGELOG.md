# OneiroMetrics Changelog

## [0.3.2] - 2025-05-13

### Added
- Temporary debug button for show more listeners
- Dedicated logs folder for better organization
- Enhanced logging system with configurable levels

### Changed
- Set logging to "Off" by default
- Changed backup files to use .bak extension
- Updated all documentation to reflect recent changes

### Fixed
- Show more button functionality across all themes
- Event listener attachment and cleanup
- Log file organization and management

## Recent Changes and Fixes

### Logging System
- Added structured logging with categories
- Implemented performance tracking
- Added detailed error logging
- Added configurable logging settings in UI
- Implemented log rotation and backup
- Added logging for all major operations

### State Persistence
- Added expanded/collapsed state persistence
- Implemented efficient state storage
- Added debounced state saving
- Improved state restoration
- Added state cleanup on unload

### Time Filter Integration
- Fixed event handling by replacing non-existent `file-change` event with correct `modify` event from vault
- Added proper event subscriptions for:
  - Layout changes
  - Workspace resizing
  - Active leaf changes
  - File modifications
- Enhanced logging for filter updates and changes

### Date Handling
- Added robust date parsing for multiple formats:
  - YYYY-MM-DD
  - Block reference format (^YYYYMMDD)
  - Month Day, YYYY
  - General date formats
- Added detailed logging for date parsing attempts
- Improved error handling for invalid dates

### Expand/Collapse Functionality
- Enhanced button state management
- Added aria-expanded and data-expanded attributes
- Improved visibility toggling
- Added logging for button interactions
- Implemented state persistence for expanded/collapsed content

### Performance Improvements
- Added debouncing for filter updates
- Optimized state management
- Improved event listener cleanup
- Enhanced date parsing performance
- Added performance logging
- Implemented efficient DOM updates

### UI Improvements
- Enhanced button state management
- Added aria-expanded and data-expanded attributes
- Improved visibility toggling
- Added logging for button interactions
- Improved accessibility features
- Enhanced mobile responsiveness

## Known Issues
1. Performance with large datasets needs further optimization
2. Advanced dream analysis features pending implementation

## Next Steps
1. Implement virtual scrolling for large tables
2. Add data caching for frequently accessed metrics
3. Optimize state compression
4. Improve filter performance for large datasets

## Recent Fixes Applied
1. Replaced `file-change` event with `modify` event from vault
2. Added proper event subscriptions for filter updates
3. Enhanced logging throughout the codebase
4. Improved error handling for date parsing
5. Implemented state persistence for expanded/collapsed content
6. Added comprehensive logging system
7. Optimized performance with debounced updates

## Logging Points Added
- Date parsing attempts and results
- Filter updates and changes
- Button interactions
- Content visibility toggling
- Table updates and modifications
- Performance metrics
- State persistence operations

## Notes for Future Development
- Keep event handling simple and use correct Obsidian events
- Maintain consistent logging for debugging
- Focus on core functionality before adding complexity
- Monitor performance with large datasets
- Consider implementing virtual scrolling for better performance

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-05-11

### Added
- **Metric Icon Picker:** Custom icon selection for metrics via user-friendly picker
- **Keyboard & Accessibility:** Full keyboard navigation and screen reader support
- **'This Week' Filter:** New filter option with configurable week start day
- **Widget for Readable Line Length:** Toggle in settings and project note for table width control
- **Metrics Description Section:** Enhanced settings page with metric details
- **Automatic Backup System:** Improved backup creation with .bak extension
- **Open Metrics Note Button:** Quick access to metrics note from modal

### Changed
- All inline styles moved to stylesheet for better maintainability
- Enhanced table styling with optimized column widths
- Improved theme compatibility and mobile responsiveness
- Better organization of Dream Entries section
- Enhanced error handling with backup restoration options
- Improved content preview with expandable/collapsible sections
- Optimized table layout for better space utilization
- Reduced overall table font sizes for better readability

### Fixed
- Lucide icons now render correctly in all tables and modals
- Show more/less button functionality restored
- Table sorting and filtering issues resolved
- Dream content extraction and rendering issues fixed
- Autocomplete, backup, and modal UI improvements
- Callout metadata handling in tables
- Parser blockStack logic for nested callouts
- File suggestion and autocomplete reliability

### Planned
- **Lucide Icon Picker Implementation:**
  - Single, search-first grid (8x5) without sidebar
  - Live search with minimum 1 character
  - No favorites/recents or clear icon option
  - CDN-powered with localStorage caching and fallback
  - SVGs inlined for theme coloring
  - Keyboard navigation and high-contrast support
  - Picker only in metric editor, icons used everywhere
  - Store only icon name in settings
  - For detailed technical specifications, see [Icon Picker Technical Implementation](docs/ICON_PICKER_TECHNICAL_IMPLEMENTATION.md)
- Add a Test Modal for Markdown processing
- Reduce excessive logging in future builds

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

## [0.2.1] - 2025-05-10

### Added
- **Widget for Readable Line Length:** Toggle in settings to override readable line width for metrics tables.
- **Metrics Description Section:** Settings page now displays a section listing each metric, its icon, description, and range.
- **CSV Export/Import:** Export and import metrics configuration as JSON; export metrics data as CSV from settings.
- **'This Week' filter and week start day setting:** Added to metrics table and settings.
- **Metrics Export/Import UI:** Added buttons to settings for exporting/importing metrics configuration.

### Fixed
- **Lucide icons:** Now render correctly in all tables and modals, including the Metric Edit modal and Project Note tables.
- **Show more/less button:** Expands and collapses dream content as expected, with correct button text.
- **Table sorting:** Clicking column headers sorts the Dream Entries table.
- **Filtering:** Date and metric filtering now updates the Dream Entries table.
- **Autocomplete, backup, and modal UI:** All previously reported issues are resolved.

### Changed
- All interactive logic (sorting, filtering, expand/collapse) is now attached directly via the plugin for better compatibility with Obsidian's preview mode.
- UI polish and accessibility improvements throughout settings and modals.

- Callout metadata is no longer reflected as CSS classes on the Statistics or Dream Entry tables. Only standard classes are used, preventing accidental hiding or styling due to user metadata such as 'hide', 'compact', or 'summary'.

## [0.3.1] - 2025-05-12

### Added
- **Enhanced Time Filters:** Added comprehensive time-based filtering options
  - "This Week" filter for current week's entries
  - "Last Week" filter for previous week's entries
  - "This Month" filter for current month's entries
  - "Last Month" filter for previous month's entries
  - "This Year" filter for current year's entries
  - "Last Year" filter for previous year's entries
  - "All Time" option to show all entries
- **Improved Date Handling:** Enhanced date parsing and display
  - Support for multiple date formats (YYYY-MM-DD, block references, journal dates)
  - Better error handling for invalid dates
  - Detailed logging for date parsing attempts

### Fixed
- **Expand/Collapse Functionality:** Fixed issues with content visibility toggling
  - Improved button state management
  - Enhanced visibility toggling logic
  - Added detailed logging for debugging
- **Time Filter Integration:** Fixed filter application and updates
  - Proper event handling for filter changes
  - Correct subscription to workspace events
  - Improved filter state management

### Changed
- **UI Improvements:** Enhanced filter display and interaction
  - Clear visual feedback for active filters
  - Improved filter button states
  - Better accessibility for filter controls

## [0.3.3] - 2025-05-14

### Added
- New CSS component files for better organization:
  - project-note-tables.css
  - buttons.css
  - filters.css
  - icon-picker.css
  - project-note-content.css
  - drag-drop.css
  - multiselect.css
  - metrics-summary.css
  - utilities.css
  - responsive.css
  - accessibility.css
  - settings.css
  - metrics.css
  - modals.css

### Changed
- Refactored CSS architecture into 14 focused components
- Improved CSS maintainability and testability
- Enhanced theme compatibility
- Optimized CSS performance
- Centralized accessibility features
- Improved responsive design organization
- Better organization of utility classes
- Enhanced component-specific styles

### Fixed
- Removed redundant and conflicting CSS rules
- Improved CSS specificity
- Enhanced accessibility features
- Optimized mobile responsiveness
- Fixed theme compatibility issues
- Improved print styles
- Enhanced high contrast mode support

## [0.3.5] - 2025-05-14

### Changed
- **CSS Refactoring, Phase 2:** Following the initial reorganization and optimization of component styles (Phase 1), all component CSS files were concatenated back into a single `styles.css` for production use, improving compatibility and maintainability.

## [Unreleased]

### Changed
- Upgraded TypeScript to 5.4+ and esbuild to 0.20+ for improved build process compatibility.
- Updated build script to use esbuild's context API.

### CSS Refactoring
- Reorganized component styles into focused files
- Renamed files to better reflect their purpose:
  - `project-note-buttons.css` → `tables-dream-entries-buttons.css`
  - `drag-drop.css` → `settings-metrics-drag-drop.css`
  - `icon-picker.css` → `settings-metrics-icon-picker.css`
- Improved modal styles organization
- Enhanced table component structure
- Updated documentation to reflect new organization
- Fixed import statement syntax in main stylesheet

- Reorganized, optimized, and improved all component CSS files before consolidating them back into a single `styles.css` for production use, improving compatibility and maintainability.

- **CSS Refactoring, Phase 2:** Following the initial reorganization and optimization of component styles (Phase 1), all component CSS files were concatenated back into a single `styles.css` for production use, improving compatibility and maintainability.

---

For more details, see PROJECT_OVERVIEW.md and TESTING.md. 