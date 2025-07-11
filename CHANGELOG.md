# OneiroMetrics Changelog

## Table of Contents
- [Unreleased](#unreleased)
- [Released Versions](#released-versions)
  - [Version 0.16.4](#0164---2025-06-25)
  - [Version 0.16.2](#0162---2025-06-15)
  - [Version 0.15.0](#0150---2025-06-10)
  - [Version 0.13.0](#0130---2025-06-05)
  - [Version 0.11.1](#0111---2025-06-03)
  - [Version 0.11.0](#0110---2025-01-14)
  - [Version 0.10.1](#0101---2025-01-06)
  - [Version 0.10.0](#0100---2025-01-06)
  - [Version 0.9.0](#090---2025-01-06)
  - [Version 0.7.x](#070---2025-05-30)
  - [Version 0.6.x](#060---2025-05-25)
  - [Version 0.5.x](#050---2025-05-20)
  - [Version 0.4.x](#043---2025-05-19)
  - [Version 0.3.x](#037---2025-05-15)
  - [Version 0.2.x](#021---2025-05-10)
  - [Version 0.1.x](#013---2025-05-10)
- [Older Releases](#older-releases)

## [Unreleased]

## Released Versions

## [0.16.4] - 2025-06-25

### Fixed
- **Chart Display Reliability**: Resolved critical issue where charts failed to display consistently on note open/reload ✅ **CRITICAL FIX**
  - Fixed overly strict cache validation that rejected valid cached charts due to scrape ID mismatches
  - Enhanced cache validation to accept recent cache data (< 1 hour) with matching entry counts
  - Implemented lenient validation for DOM extraction vs file parsing differences
  - Added exponential backoff retry logic for chart restoration with proper DOM readiness checking
  - Fixed double-escaped regex patterns in UniversalWorkerPool worker scripts
  - Charts now reliably display on first scrape and after note reloads without requiring manual "Rescrape Metrics"

### Technical Improvements
- **Enhanced ChartDataPersistence**: Improved cache validation logic to handle data extraction method differences
  - Modified `validateCachedData()` to allow scrape ID mismatches for recent, matching data
  - Added detailed debug logging for cache validation decisions
  - Implemented graceful handling of DOM vs file parsing signature variations
- **Improved ChartRestorationService**: Added robust retry mechanism for chart initialization
  - Implemented exponential backoff retry logic (5 attempts, 300ms base delay)
  - Enhanced DOM readiness checking before chart restoration attempts
  - Better error handling and logging for troubleshooting chart display issues
- **Fixed UniversalWorkerPool**: Corrected regex pattern escaping in worker scripts
  - Fixed double-escaped regex patterns that caused continuous worker script failures
  - Maintained sync fallback functionality for seamless user experience
  - Reduced worker pool error noise while preserving performance

## [0.16.2] - 2025-06-15

### Added
- **CSV Export System**: Comprehensive data export functionality across all chart visualizations
  - Export buttons integrated into all 5 chart tabs (Statistics, Trends, Compare, Correlations, Heatmap)
  - Context-aware export options with tab-specific data structures and formatting
  - Professional CSV output with metadata headers, proper escaping, and meaningful filenames
  - Advanced statistical analysis in exports including moving averages, correlation matrices, trend analysis, and confidence intervals
  - Error handling with user-friendly notifications and robust data validation
  - Responsive design with styled export buttons and mobile compatibility

### Fixed
- **Template Wizard Direct Input**: Resolved missing textarea issue by creating dedicated TemplateWizardModal with proper Material Design interface
- **Template Import/Export**: Fixed format mismatch that prevented single template JSON imports from working correctly

## [0.15.0] - 2025-06-09

### Added
- **Enhanced Date Navigator with Pattern Visualization System**: Complete calendar interface overhaul ✅ **MAJOR RELEASE FEATURE**
  - Advanced pattern visualization engine with 4 visualization styles (Patterns, Quality, Detail, Icons)
  - Smart dream entry detection with quality-based color coding and visual indicators
  - Interactive calendar with drag selection, multi-select (Ctrl+click), and range selection modes
  - Comprehensive navigation tools: Year picker, Month jump, Quarter view, Date input with Go button
  - Month navigation centered for better visual balance and improved UX
  - Pattern tooltips with detailed dream metrics and entry information
  - Responsive quarter view displaying 3 months simultaneously for broader context

- **Component-Based CSS Architecture**: Complete CSS refactoring for maintainability ✅ **MAJOR ARCHITECTURAL IMPROVEMENT**
  - 13 organized CSS components (variables, base, modals, buttons, tables, utilities, icons, navigation, enhanced-date-navigator, unified-test-suite, metrics-charts, hub, forms)
  - Automated build system with `build-css.js` for component compilation
  - 260KB total CSS with granular component breakdown for optimal performance
  - CSS linting and formatting infrastructure with stylelint integration
  - Proper import hierarchy and dependency management between components
  - Enhanced maintainability with logical component separation

- **Standardized Settings Interface Elements**: Unified UI components across the plugin ✅ **UX ENHANCEMENT**
  - Consistent form styling with standardized input fields, buttons, and controls
  - Professional modal layouts with improved spacing and visual hierarchy
  - Enhanced accessibility with proper ARIA labels and keyboard navigation
  - Responsive design ensuring compatibility across different screen sizes

### Changed
- **Enhanced Date Navigator Layout Optimization**: Streamlined two-row interface design
  - **Row 1**: Core navigation (Year, Jump to Month, Quarter View, Date input, Go button)
  - **Row 2**: Interaction controls (Selection Mode buttons: Single/Range/Multi + Patterns dropdown)
  - Removed Recent navigation memory functionality for cleaner, more focused UX
  - Eliminated layout overflow issues that pushed elements outside modal viewport
  - Centered selection controls with improved spacing (24px gap) for better visual balance

- **Improved Visual Design**: Enhanced spacing, typography, and component consistency
  - Optimized padding and margins throughout the interface for better content density
  - Professional color scheme with improved contrast and readability
  - Consistent button styling and hover states across all components

### Fixed
- **Journal Structure and Template Issues**: Resolved critical parsing and template problems ✅ **CRITICAL FIXES**
  - Fixed journal structure recognition preventing proper entry detection
  - Resolved template creation and editing functionality
  - Enhanced callout parsing reliability with improved pattern matching
  - Fixed template wizard integration with better error handling

- **Scraping Issues with Universal Fallback System**: Enhanced data extraction reliability ✅ **CRITICAL FIXES**
  - Implemented robust fallback system for UniversalMetricsCalculator scraping
  - Improved handling of various journal formats and structures
  - Enhanced parsing accuracy for edge cases and non-standard entries
  - Better error recovery and graceful degradation when parsing fails
  - Comprehensive fallback mechanisms ensuring no data loss

- **Layout and Responsive Design**: Multiple UI improvements
  - Fixed modal overflow issues in Enhanced Date Navigator
  - Resolved responsive design problems across different screen sizes
  - Enhanced CSS component loading and compilation reliability
  - Fixed various visual glitches and alignment issues

### Technical Improvements
- **Performance Optimizations**: Enhanced processing efficiency and memory management
  - Optimized CSS build system with efficient component compilation
  - Improved pattern visualization rendering with better caching
  - Enhanced calendar performance with optimized date calculations
  - Reduced memory footprint with better resource management

- **Code Architecture**: Improved maintainability and extensibility
  - Modular CSS architecture enabling easier customization and maintenance
  - Enhanced component separation with clear dependency management
  - Improved TypeScript type safety throughout the codebase
  - Better error handling and logging for debugging capabilities

- **Build System**: Enhanced development and deployment workflow
  - Automated CSS compilation with component-based build system
  - Integrated linting and formatting tools for code quality
  - Streamlined build process with proper dependency management
  - Enhanced development experience with better tooling integration

### Migration Notes
- **Automatic CSS Migration**: New component-based CSS system loads seamlessly
- **Enhanced Date Navigator**: Existing date navigation preferences preserved
- **Settings Compatibility**: All existing settings maintain full compatibility
- **Visual Updates**: Interface improvements are automatically applied without user action

### Performance Impact
- **Optimized Resource Usage**: Component-based CSS loading reduces redundancy
- **Enhanced Calendar Performance**: Improved rendering speed for large date ranges
- **Better Memory Management**: Reduced memory usage with optimized component architecture
- **Faster Load Times**: Streamlined CSS compilation and loading process

## [0.13.0] - 2025-06-05

### Added
- **Chart Visualization**: 5-tab chart system (Statistics, Trends, Compare, Correlations, Heatmap)
- **Inline Feedback**: Real-time scrape progress and backup warnings in Dream Scrape tab
- **Sticky Footer**: Improved Dream Scrape tab layout with persistent action buttons

### Changed
- Replaced popup notifications with contextual inline feedback
- Chart.js integration for responsive data visualization

### Removed
- Legacy progress section from Dream Scrape tab

### Fixed
- TypeScript compilation errors and syntax issues
- Chart sizing glitches with proper CSS constraints

## [0.11.1] - 2025-06-03
### Added
- **Unified Test Suite Modal**: Consolidated all testing functionality into a single comprehensive interface with integrated log viewer and export capabilities ✅ **COMPLETED** ([📋 Planning Document](docs/archive/planning/features/2025/unified-test-suite-modal-2025.md))

### Changed
- **Streamlined Command Palette**: Reduced to just 2 essential commands ("Open Hub" and "Open Unified Test Suite") with cleaner naming

### Fixed
- **Log Viewer Access**: Resolved "memory adapter not found" error by properly connecting logging components

## [0.11.0] - 2025-06-02
### Added
- **Comprehensive Date Handling System**: Complete date handling overhaul with support for multiple date formats and sources
  - Header date parsing: Automatically extracts dates from journal entry headers
  - Field date parsing: Supports custom date fields within journal entries  
  - Block reference dates: Enhanced support for date extraction from block references
  - Configurable date formats: Support for multiple date format patterns (`MMMM d, yyyy`, `MM/dd/yyyy`, `yyyy-MM-dd`)
  - Backward compatibility: Seamless migration from existing date handling systems

- **Enhanced Metrics Processing**: New high-performance metrics processing engine
  - `UniversalMetricsCalculator`: Drop-in replacement for MetricsProcessor with worker pool integration
  - Worker pool support: Parallel processing capabilities for large datasets (with intelligent fallback)
  - Advanced caching system: TTL-based caching with memory management
  - Real-time performance monitoring: Built-in statistics and performance tracking
  - Intelligent structure recognition: Dynamic journal structure building from user callout settings

- **Template Wizard System**: Interactive template creation and management
  - Step-by-step wizard for journal template setup
  - Templater integration: Seamless integration with existing Templater templates
  - Structure-based templates: Generate templates from predefined journal structures
  - Direct content editing: Manual template creation with live preview
  - Template management: Edit, view, and delete existing templates

### Changed
- **Parsing Accuracy**: Achieved 100% parsing accuracy (147/147 entries found)
  - Perfect entry detection with smart callout recognition
  - Enhanced recognition of journal structure callouts
  - Improved handling of complex nested journal structures
  - Structure-aware parsing with dynamic pattern matching based on user's callout configuration

- **User Experience**: Enhanced Hub Modal with improved navigation
  - Real-time callout preview with live configuration updates
  - Smart date formatting with automatic date format detection and preview
  - Comprehensive settings with enhanced callout configuration and visual feedback

- **Performance**: Optimized processing for large journal collections
  - Batch processing capabilities for improved performance
  - Memory management with intelligent cache cleanup and size limits
  - Fallback systems providing graceful degradation when worker pools are unavailable
  - Processing statistics with detailed metrics on cache hits, processing times, and performance

### Fixed
- **Journal Structure Recognition**: Resolved callout type mismatch issues
  - Fixed cases where configured structures didn't match user's actual callouts
  - Dynamic structure building for legacy settings that prevented proper entry recognition
  - Improved extraction and cleaning of metrics data from callouts
  - Enhanced parsing of journal entries with block references

- **Date Processing**: Improved date extraction reliability
  - Fixed inconsistent date parsing across different journal formats
  - Resolved issues with non-standard date formats
  - Enhanced date extraction from complex block reference patterns
  - Improved date consistency across different timezone configurations

- **Template Integration**: Enhanced template system reliability
  - Fixed plugin availability detection for Templater integration
  - Resolved issues with template file reading and processing
  - Fixed template preview rendering for complex structures

### Technical Improvements
- **Architecture**: Enhanced separation of concerns between parsing, processing, and UI components
- **State Management**: Improved state handling with SettingsAdapter integration
- **Error Handling**: Comprehensive error handling with graceful fallbacks
- **Code Quality**: Enhanced type safety, performance optimizations, and clean architecture
- **Logging System**: Enhanced debugging capabilities with structured logging

### Migration Notes
- **Automatic Migration**: Existing configurations are automatically upgraded
- **Backward Compatibility**: All existing journal entries and structures remain functional
- **Settings Preservation**: User preferences are maintained during upgrade
- **Zero Data Loss**: All existing journal entries preserved and recognized (147/147 entries successfully parsed)

## [0.10.1] - 2025-01-06
### Added  
- **Date Fields Toggle**: New setting to control inclusion of "Date:" fields in callouts
  - Added "Include Date Fields" toggle in Callout Settings tab  
  - Allows users to disable date fields for daily note workflows where dates are already in filenames/headers
  - Defaults to enabled (true) to maintain current user workflow
  - Affects Journal and Dream Diary callouts (metrics callouts remain unchanged)

### Changed
- **Improved User Workflow Support**: Better accommodation for different Obsidian usage patterns
  - Users who rely on daily notes with dates in filenames can now disable redundant date fields
  - Plugin remains optimized for users who prefer explicit date fields in callout content
  - Setting description provides clear guidance on when to disable date fields

### Technical Improvements
- **Settings Architecture**: Enhanced settings system with new boolean property
  - Added `includeDateFields` property to `DreamMetricsSettings` interface
  - Updated `SettingsAdapter` to handle default value (true) for backward compatibility  
  - Implemented conditional field rendering in callout generation functions
  - Real-time preview updates when date field setting is toggled

## [0.10.0] - 2025-01-06
### Added
- **Complete Callout Name Customization**: Full control over all callout names used throughout OneiroMetrics
  - Added Journal Callout Name setting (default: "journal")
  - Added Dream Diary Callout Name setting (default: "dream-diary")  
  - Added Metrics Callout Name setting (default: "dream-metrics")
  - Real-time preview updates when callout names are changed
  - Settings affect Quick Copy generation, scraping detection, and template creation

- **Major Hub Modal UX Improvements**: Reorganized for better user workflow and clarity
  - Renamed "Callout Quick Copy" tab to "Callout Settings" to reflect evolved purpose
  - Moved Callout Settings tab up one position for logical priority ordering
  - Reorganized content hierarchy: Callout Settings section at top, Quick Copy below
  - Added clear H2 section headers for visual separation and navigation
  - Enhanced descriptions to clarify how settings affect entire plugin behavior

### Changed
- **Unified Callout Management**: All callout naming now centralized in one location
  - Moved all callout name settings from main Settings page to Hub Modal
  - Created single source of truth for callout configuration
  - Eliminated redundant settings sections for cleaner UI

### Fixed
- **Callout Generation Consistency**: Resolved multiple callout generation issues
  - Fixed hardcoded "dream-metrics" usage to respect user's custom callout name setting
  - Added blank lines before and after callout titles for consistent formatting across all types
  - Fixed Single-Line toggle to only affect metrics part of nested structures (not entire structure)
  - Fixed flattened nested structure to create proper separate callouts instead of malformed single callout

### Technical Improvements
- **Dynamic Callout Detection**: Enhanced scraping system foundation
  - Scraping logic already uses structure-based detection (mostly dynamic)
  - Prepared foundation for making default Journal Structures fully dynamic
  - Established pattern for unified callout naming across all features

## [0.9.0] - 2025-06-02
### Added
- **Unified Template Wizard Redesign**: Complete overhaul with three-path creation approach
  - Path A: Templater Integration with automatic content loading and detection
  - Path B: Structure-Based Generation with inline structure management  
  - Path C: Direct Input with smart content detection and sample insertion
  - Streamlined 2-3 step workflow replacing complex 4-step process
  - Auto-generation of template names and descriptions
  - Enhanced Templater support with advanced feature integration

- **Journal Structure Management Overhaul**: Complete redesign of structure management UI
  - Inline Structure Editor with live preview and real-time validation
  - Complete CRUD operations: Create, read, update, delete, clone, import/export structures
  - Native Obsidian UI integration with native checkbox and form styling
  - Default structures auto-creation (Legacy Dream, AV Journal, Simple Dream)
  - Smart conflict resolution for duplicate structures during import
  - Robust settings persistence with automatic saving

- **OneiroMetrics Hub Consolidation**: Unified interface improvements
  - Consolidated Dream Scrape, Journal Structure, and Metrics into single hub
  - Enhanced Dashboard with improved quick actions and button organization
  - New "View Metrics Descriptions" button for easy access to metric documentation
  - Improved navigation with logical button ordering and clear visual hierarchy

- **Template Preview System**: Enhanced preview capabilities
  - Live preview with real-time updates for all template types
  - Dual preview mode showing both Templater dynamic and static fallback versions
  - Visual structure examples showing nested vs flat callout structures
  - Comprehensive error handling with clear error messages and recovery suggestions

### Changed
- **Native Obsidian Styling**: Full integration with Obsidian's design system for consistent theming
- **Enhanced UI/UX**: Improved responsive layout, visual feedback, hover states, and typography
- **Component Architecture**: Modular architecture with dedicated components for better maintainability
- **Settings Integration**: More robust settings persistence and validation systems
- **Performance Optimization**: Faster modal loading, better memory management, and optimized rendering

### Fixed
- **Templater Detection**: Fixed Templater plugin detection and folder path handling
- **Template Loading**: Resolved issues with template content loading and preview accuracy
- **Structure Validation**: Enhanced validation for callout structures with better error reporting
- **Modal Management**: Fixed modal stacking and focus management issues
- **Button Interactions**: Improved button responsiveness and state management
- **Settings Persistence**: More reliable settings saving and loading mechanisms

### Technical Improvements
- **Documentation**: Complete project tracking with milestones, dependencies, and implementation guides
- **Architecture Planning**: Detailed plans for future TypeScript improvements and refactoring

## [0.7.0] - 2025-05-30
### Added
- **Infrastructure Modernization**: Complete logging system overhaul with structured logging categories and levels
- **UI Consolidation**: Journal Structure functionality integrated into OneiroMetrics Hub for streamlined user experience
- **Defensive Coding Patterns**: Enhanced error handling and recovery mechanisms throughout the application

### Changed
- **Code Quality**: Replaced console.log statements with structured logging across 65% of codebase
- **Error Handling**: Improved user feedback and system stability with safe logger implementation
- **Module Organization**: Better separation of concerns and reduced technical debt

### Developer Experience
- Enhanced debugging capabilities with categorized logging system
- Improved code maintainability and future development foundation
- Comprehensive technical documentation for ongoing development

## [0.6.0] - 2025-05-25
### Added
- **Complete TypeScript Refactoring:** Major architectural improvement to the codebase
  - Transformed from a monolithic structure with a 5,000+ line main file into a well-organized component system
  - Added comprehensive TypeScript typing throughout the codebase
  - Improved error handling and reporting with better recovery mechanisms
  - Optimized performance for rendering and data processing
  - Enhanced test infrastructure supporting both synchronous and asynchronous tests
  - Fixed interface incompatibilities and constructor parameter issues
  - Implemented proper separation of concerns through modular design
  - Created a more stable foundation for future features while maintaining backward compatibility

### Changed
- **Refactoring Plan Document:** Created comprehensive refactoring plan for modernizing codebase architecture
  - Detailed assessment of current monolithic structure and challenges
  - Five-phase implementation strategy with clear timelines and milestones
  - Practical extraction examples for modal components and service modules
  - Concrete decisions on technical dependencies, backward compatibility, testing approach
  - Structured CSS refactoring strategy to eliminate inline styles
  - Version control and documentation strategies for maintaining quality
  - Comprehensive TypeScript File Inventory with line counts and purpose descriptions
  - Located at `docs/archive/refactoring-2025/refactoring-plan-2025.md`
- **Web Worker Plan Document:** Created technical plan to use web workers
  - Plan to offload date filtering operations from the UI thread
  - Will eliminate performance issues with large datasets
  - Located at `docs/planning/features/web-worker-architecture-plan.md`
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
- **Consolidated Type System:** Implemented unified type organization (Phase 1: Code Cleanup)
  - Consolidated multiple types.ts files into a single, domain-organized structure
  - Created domain-specific type modules (core.ts, logging.ts, journal-check.ts)
  - Added comprehensive JSDoc documentation to all types
  - Implemented backward compatibility bridges for smooth migration
  - Created documentation and migration plan
  - Standardized naming conventions and improved type definitions
- **Code Cleanup Plan:** Created systematic approach for eliminating dead code (Phase 1: Code Cleanup)
  - Identified six categories of dead code for targeted cleanup
  - Developed four-phase implementation strategy
  - Prioritized cleanup areas based on code analysis
  - Established success criteria and validation approach
  - Created detailed inventory of console.log statements, redundant imports, and transitional code
- **Enhanced Logging System:** Implemented structured logging across the application
  - Added domain-specific logging categories for better filtering
  - Used consistent log levels (error, warn, info, debug)
  - Improved error context for faster debugging
  - Better control over log verbosity

### Changed
- Renamed "Linting" feature to "Journal Structure Check" for clarity
- Reorganized documentation structure to better reflect feature naming
- Updated all feature references throughout the codebase
- Improved UI for dream scrape modal: the old plugin-generated `<div class="oom-rescrape-container">` was removed and is now generated as part of the metrics HTML
- Refactored CSS class naming convention to consistently use "oom-" prefix for all plugin-specific classes
- Updated and fixed main.ts to properly handle the loadStyles method (which is now just a stub for backwards compatibility)
- Standardized documentation file naming to lowercase-with-hyphens convention
- Fixed various CSS issues for better theme compatibility and user experience
- Improved logging system with structured error reporting and log management
- Advanced the type system for better reliability and performance
- Enhanced date filtering with more intuitive range selection
- Added sentiment analysis for dream content with positive/negative scoring
- **Updated Dependencies:** Upgraded esbuild to latest version to fix security vulnerabilities
- **Fixed Build Process:** Added build:force command to bypass TypeScript errors during development
- **Improved Type Definitions:** Made progress on enhancing TypeScript types with better compatibility
- **Optimized Performance:** Improved logging implementation for better performance

### Removed
- Archived completed CSS refactoring plan to docs/archive/
- Removed unnecessary documentation redirect files after migrating content
- Eliminated hundreds of console.log statements with proper structured logging

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

## [0.4.1] - 2025-05-14
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
- See [docs/user/reference/troubleshooting.md](docs/user/reference/troubleshooting.md#fixed-issues) for a detailed summary of the Show more button event handling fix, scroll jump fix, and visible rows performance improvements.
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
- See [docs/user/reference/troubleshooting.md](docs/user/reference/troubleshooting.md#fixed-issues) for a detailed summary of the Show more button event handling fix, scroll jump fix, and visible rows performance improvements.

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
### Added
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

## Older Releases
For full details, see `CHANGELOG_ARCHIVE.md` if available. 
