# OneiroMetrics Changelog

## Table of Contents
- [Unreleased](#unreleased)
- [0.5.0] - 2025-05-20
- [0.4.3] - 2025-05-19
- [0.4.1] - 2024-05-14
- [0.4.0] - 2025-05-16
- [0.3.7] - 2025-05-15
- [0.3.6] - 2025-05-14
- [0.3.5] - 2025-05-14
- [0.3.4] - 2025-05-14
- [0.3.3] - 2025-05-14
- [0.3.2] - 2025-05-13
- [0.3.1] - 2025-05-12
- [0.3.0] - 2025-05-11
- [0.2.1] - 2025-05-10
- [0.2.0] - 2025-05-10
- [0.1.3] - 2025-05-10
- [0.1.2] - 2025-05-09
- [0.1.1] - 2025-05-09
- [0.1.0] - 2025-05-08

## [Unreleased]
### Added
- **Journal Structure Check Feature:** Implemented first phase of the Journal Structure Check system
  - Template creation and management for consistent journal entries
  - Support for both flat and nested journal structures
  - Template wizard with step-by-step interface
  - Template preview functionality
  - Multiple ways to insert templates (commands, ribbon, context menu)
  - Proper handling of callouts in both structure types
- **Templater Integration:** Implemented standardization on Templater for templates
  - Added fallback mechanism for users without Templater installed
  - Enhanced template wizard with dual preview (Templater and static versions)
  - Automatic conversion of Templater syntax to static placeholders
  - Smart placeholder navigation for template filling
  - Full backward compatibility with existing templates
  - Comprehensive documentation in new `docs/user/guides/templater.md`
- **Documentation Reorganization Project:** Completed comprehensive documentation overhaul
  - Transformed flat collection of 28+ files into structured, hierarchical system
  - Created dedicated sections for users, developers, and planning
  - Migrated existing documentation to appropriate locations with consistent naming
  - Created new documents to fill knowledge gaps and improve user experience
  - Established templates and standards for future documentation
  - Added documentation validation tools and workflow guidance
  - Updated all cross-references throughout the codebase
- **Date Navigator Modal:** Partial implementation of improved date navigation
  - Added Apply Filter button for explicit filter application
  - Implemented direct filtering approach for improved performance
  - Added better visual feedback for selected dates
  - Enhanced pre-filtering of dates for faster performance

### Changed
- Renamed "Linting" feature to "Journal Structure Check" for clarity
- Reorganized documentation structure to better reflect feature naming
- Updated all feature references throughout the codebase
- Improved UI for dream scrape modal: the old plugin-generated `<div class="oom-rescrape-container">` was removed and is now generated as part of the metrics HTML
- Refactored CSS class naming convention to consistently use "oom-" prefix for all plugin-specific classes
- Updated and fixed main.ts to properly handle the loadStyles method (which is now just a stub for backwards compatibility)
- Standardized documentation file naming to lowercase-with-hyphens convention

### Removed
- Archived completed CSS refactoring plan to docs/archive/
- Removed unnecessary documentation redirect files after migrating content

## [0.5.0] - 2025-05-20
### Added
- **Dream Journal Manager:** Implemented a comprehensive unified interface for managing all aspects of dream journaling
  - Integrated the existing Dream Scraper functionality into a dedicated tab
  - Incorporated the Journal Structure features previously available only in Settings
  - Created a tabbed interface with intuitive navigation between different journal management features
  - Designed consistent UI that matches Obsidian's native Settings interface

### Changed
- **UI Improvements:**
  - Migrated Dream Scraper into the new Dream Journal Manager interface
  - Added a sticky footer in the Dream Scrape section for persistent access to action buttons
  - Enhanced navigation with proper active state highlighting using Obsidian's accent color
  - Improved overall styling consistency with Obsidian's native UI
  - Fixed various CSS issues for better theme compatibility and user experience

## [0.4.3] - 2025-05-19
### Added
- (List new features here)
### Changed
- Dream Scrape modal UI/UX improvements:
  - Button labels updated: 'Scrape Metrics' → 'Scrape Notes', 'Settings' → 'Open Settings', 'Open OneiroMetrics Note' → 'Open OneiroMetrics'.
  - 'Open OneiroMetrics' button is now always visible, disabled until a scrape is run, and features a fade-in animation when enabled.
  - All three action buttons are now perfectly aligned on the same row.
  - Tooltip added to 'Open OneiroMetrics' button for improved accessibility.
- The debug button ("Debug: Attach Show More Listeners") is now visible when logging is set to **Debug** in settings, not just in development mode. This allows users to access troubleshooting tools as needed.
- Both OneiroMetrics Settings buttons (in the Dream Scrape modal and at the top of the metrics note) now reliably open the OneiroMetrics settings tab.
- Documentation updated to reflect these changes in logging, debug tools, and settings access.
- The statistics section heading is now a semantic `<h2>` (with `oom-table-title` and `oom-stats-title` classes) instead of a `<div>`, improving accessibility and document structure.
- The rescrape/settings/debug button bar has been refactored: the old plugin-generated `<div class="oom-rescrape-container">` was removed, and a new version is now generated as part of the metrics HTML, positioned directly above the metrics container.
- Added a new H1 title (`<h1 class="oneirometrics-title">OneiroMetrics (Dream Metrics)</h1>`) at the top of the metrics section for clearer identification.
- The default Obsidian inline title is now hidden when the metrics view is active, preventing redundancy with the new H1 title.
- Both `<th>` and `<td>` elements in the detailed dream entries table now use column-specific classes (e.g., `.column-date`, `.column-content`, `.column-metric-<metricname>`) for easier and more precise CSS targeting. This is not yet implemented for the summary table.
- Ribbon Button Visibility Bug resolved: Due to an Obsidian API limitation, independent toggling of two ribbon buttons was not possible. The plugin now uses a single toggle for both buttons. See the archived plan: [docs/archive/RIBBON_BUTTON_BUG_PLAN.md].
### Fixed
- (List bug fixes here)
### Removed
- Removed related TODOs regarding button visibility and alignment in the Dream Scrape modal.

## [0.4.1] - 2024-05-14
### Changed
- The date filter dropdown is now fully functional for the first time, with user-friendly labels (e.g., "Yesterday", "This Week", "Last 12 Months") and color-coded icons for each filter state.
- Updated filter dropdown: options now display as "Yesterday", "This Week", "Last 12 Months", etc., making selection clearer and more user-friendly.
- The filter icon now uses the Lucide `calendar-range` icon and dynamically matches the filter status color (success, warning, error) for improved clarity and accessibility.
- Filter text now displays human-friendly labels (e.g., "Last 12 Months" instead of "last12months").
- Minor CSS improvements for spacing and responsive layout.
### Fixed
- The filter icon and text now always remain visually in sync, regardless of filter state.
- Accessibility and color contrast improvements for filter status indicators.

## [0.4.0] - 2025-05-16
### Changed
- Overhaul of Scraping Modal in progress: restoring advanced features (note/folder selection, folder/note autocomplete, progress bar, helper text, dismissible note, and two-column layout matching Obsidian Settings). UI and logic improvements ongoing; folder autocomplete and layout refinements still in progress.
- Resolved horizontal scrolling issue in the OneiroMetrics Scraping modal. Layout improvements are in effect: the modal and its dropdowns now fit within the modal boundaries, improving usability and appearance.
- Overhauled OneiroMetrics Scraping Modal: new two-column layout, left-aligned labels, right-aligned widgets, dismissible note, improved folder/note autocomplete, progress bar at bottom, responsive design, and UI/UX polish. Overhaul is now complete and modal is ready for release.
- Added a Settings button to the Dream Scrape modal for quick access to plugin settings.
- Added a Settings button to the top of the OneiroMetrics note for quick access to plugin settings.
- Fixed Settings buttons so they reliably open the OneiroMetrics settings tab.
- Improved documentation: all ways to access settings are now listed in the README and SPECIFICATION.

## [0.3.7] - 2025-05-15
### Changed
- Overhauled the OneiroMetrics Scrape modal: restored two-column layout, fixed DOM structure, and ensured all labels, helpers, and widgets are aligned to spec.
- Restored autocomplete for Selected Notes and Selected Folder fields in the Scrape modal.
- Fixed issues with field duplication and misalignment when toggling selection mode.
- Updated CSS and modal logic for improved consistency and maintainability.
- Updated `SPECIFICATION.md` to include a dedicated UI/DOM Structure section with a sample HTML block for the Scraping Modal.

## [0.3.6] - 2025-05-14
### Added
- Debug button for troubleshooting event listeners
- Enhanced logging system with configurable levels
- Improved documentation for troubleshooting and performance
### Changed
- Optimized table performance with reduced visible rows (12 rows)
- Improved scroll behavior when expanding/collapsing entries
- Enhanced event listener management for better reliability
- Updated documentation with new performance tips and troubleshooting guides
### Fixed
- Show more/Show less button reliability across all themes
- Scroll position maintenance when expanding/collapsing entries
- Event listener attachment and cleanup
- Performance with large datasets
- See [docs/user/reference/troubleshooting.md](docs/user/reference/troubleshooting.md#fixed-issues) for a detailed summary of the Show more button event handling fix, scroll jump fix, and visible rows performance improvements (May 2025).
- Fixed unwanted animation in Obsidian Settings modal by properly scoping modal-related CSS selectors
- The metrics table in the OneiroMetrics note now correctly displays all enabled metrics from dream entries, not just the word count. This was fixed by updating the metrics parsing logic to handle case-insensitive metric names and ensure all metrics are added to the global metrics record.

## [0.3.5] - 2025-05-14
### Changed
- **CSS Refactoring, Phase 2:** Following the initial reorganization and optimization of component styles (Phase 1), all component CSS files were concatenated back into a single `styles.css` for production use, improving compatibility and maintainability.

## [0.3.4] - 2025-05-14
### Changed
- **CSS Refactoring, Phase 1:** Reorganized component styles into focused files
- **CSS Refactoring, Phase 2:** Following the initial reorganization and optimization of component styles (Phase 1), all component CSS files were concatenated back into a single `styles.css` for production use, improving compatibility and maintainability.
### Planned
- Migrate from bundling the Lucide icon set to using Obsidian's built-in icon API (`getIcon`, `getIconIds`).
- Remove the Lucide dependency from the plugin unless newer or custom icons are required beyond what Obsidian provides.
### Documentation
- Reorganized and expanded `SPECIFICATION.md`: added a table of contents, clarified section order, and included new sections on CSS organization and expand/collapse ("Read more") functionality.
- Added documentation of troubleshooting and DevTools performance testing for the Read more button performance issue (see new entries in `ISSUES.md` and `TESTING.md`).
- Added SECURITY.md with privacy and data protection policy, and cross-referenced it in all major documentation files.

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
- See [docs/user/reference/troubleshooting.md](docs/user/reference/troubleshooting.md#fixed-issues) for a detailed summary of the Show more button event handling fix, scroll jump fix, and visible rows performance improvements (May 2025).

## [0.3.1] - 2025-05-12
### Added
- **Enhanced Custom Date Filter:** Added comprehensive date-based filtering options
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
- **Custom Date Filter Integration:** Fixed filter application and updates
  - Proper event handling for filter changes
  - Correct subscription to workspace events
  - Improved filter state management
### Changed
- **UI Improvements:** Enhanced filter display and interaction
  - Clear visual feedback for active filters
  - Improved filter button states
  - Better accessibility for filter controls

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
  - For detailed technical specifications, see [Icon Picker Technical Implementation](docs/developer/implementation/icon-picker.md)
- Add a Test Modal for Markdown processing
- Reduce excessive logging in future builds

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

## [0.2.0] - 2025-05-10
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

## [0.1.3] - 2025-05-10
### Changed
- Modal's Selected Notes autocomplete now only shows real, existing markdown files (not folders or non-existent files), matching the settings page behavior.
- UI and logic clean-up for autocomplete fields in both settings and modal.
### Fixed
- Fixed issue where modal's Selected Notes field would show suggested or non-existent files and folders.
- Fixed variable shadowing and event handler context issues in modal autocomplete logic.

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

## [0.1.1] - 2025-05-09
### Added
- Enhanced UI/UX features
- Improved validation feedback
- Smart file suggestions
- Real-time metric validation
### Changed
- Updated documentation
- Improved error handling
- Enhanced user feedback

## [0.1.0] - 2025-05-08
### Added
- Initial release
- Basic dream metrics functionality
- Customizable metrics
- Project note generation
- Metric validation
- File path autocomplete

# Older Releases
For full details, see `CHANGELOG_ARCHIVE.md` if available. 