# Known Issues and Future Improvements

> **Note:** For detailed instructions on using Chrome DevTools to diagnose performance issues, see [Performance Testing](docs/developer/testing/performance-testing.md).

> **Ribbon Button Visibility Bug:** [RESOLVED] This issue is now resolved. The root cause was an Obsidian API limitation. The plugin now uses a single toggle for both ribbon buttons. See the archived plan: [docs/archive/RIBBON_BUTTON_BUG_PLAN.md].

> **Types System Documentation:** The architecture diagrams need to be updated to include information about the consolidated types system implemented in Phase 1 of the Post-Refactoring Roadmap. See the tracking issue: [docs/developer/architecture/diagrams/types-refactoring-note.md]. Will be completed in Phase 3 (Documentation Enhancement).

## Table of Contents

- [Recent Issues and Status](#recent-issues-and-fixes)
  - [Fixed Issues](#fixed-issues)
  - [Recent Changes](#recent-changes)
  - [Date Parsing Improvements](#date-parsing-improvements)
  - [Current Issues Requiring Testing](#current-issues-requiring-testing)
- [Feature Plans and Development](#future-features)
  - [Dream Analysis](#dream-analysis)
  - [Month View](#month-view)
  - [Performance Optimization](#performance-optimization)
  - [Icon Picker](#icon-picker)
  - [Implementation Challenges](#implementation-challenges)
  - [Backup System](#backup-system)
- [Testing and Contributing](#testing-guidelines)
  - [State Persistence Testing](#state-persistence-testing)
  - [Logging Testing](#logging-testing)
  - [Performance Testing](#performance-testing)
  - [Contributing](#contributing)
- [UI and Performance](#future-ui-improvements)
  - [Visual Feedback Timing](#visual-feedback-timing)
  - [Animation Styles](#animation-styles)
  - [CSS Architecture](#css-architecture)
  - [Performance Tracking](#performance-tracking)
- [Development Documentation](#development-notes)
  - [Logging Configuration](#logging-configuration)
  - [Recent Fixes (May 2025)](#recent-fixes-may-2025)
  - [Current Issues (May 2025)](#current-issues-may-2025)
- [Bug Reports and Resolutions](#current-issues-and-status)
  - [CSS Refactoring](#css-refactoring)
  - [Performance Issues](#performance-issues)
  - [Accessibility](#accessibility)
  - [Theme Compatibility](#theme-compatibility)
  - [Documentation](#documentation)
  - [Testing](#testing)
  - [Settings Page Regression](#may-2025-settings-page-regression-and-resolution)
  - [Scrape Modal Fixes](#oneirometrics-scrape-modal-fixes-v037)
  - [Settings Page TODOs](#todos-from-settings-page-review)
  - [Filters Expansion Progress](#filters-expansion-progress)

## Recent Issues and Fixes

### Fixed Issues
1. **Filter System Integration**
   - Issue: Filter changes not properly updating table rows
   - Fix: Implemented debounced filter updates and improved event handling
   - Status: ✅ Fixed

2. **Date and Custom Date Filter UI**
   - Issue: Inconsistent filter UI and state management
   - Fix: Implemented unified filter container and improved state handling
   - Status: ✅ Fixed

3. **Filter State Persistence**
   - Issue: Filter states not persisting between sessions
   - Fix: Added state persistence and improved state management
   - Status: ✅ Fixed

4. **Performance Issues**
   - Issue: Slow response when filtering large datasets
   - Fix: Implemented debouncing and optimized state management
   - Status: ✅ Fixed

5. **Logging System**
   - Issue: Limited debugging capabilities
   - Fix: Added structured logging with categories and performance tracking
   - Status: ✅ Fixed

6. **State Persistence**
   - Issue: Expanded/collapsed states not persisting
   - Fix: Implemented efficient state storage and restoration
   - Status: ✅ Fixed

7. **CSS Organization**
   - Issue: Large, monolithic stylesheet (2493 lines) with scattered rules
   - Fix: Split into 14 focused component files
   - Status: ✅ Fixed

8. **CSS Maintainability**
   - Issue: Difficult to maintain and debug styles
   - Fix: Organized styles into logical components
   - Status: ✅ Fixed

9. **CSS Performance**
   - Issue: Redundant and conflicting rules
   - Fix: Removed duplicates and improved specificity
   - Status: ✅ Fixed

10. **CSS Accessibility**
    - Issue: Inconsistent accessibility features
    - Fix: Centralized accessibility styles in dedicated component
    - Status: ✅ Fixed

11. **CSS Consolidation and Section Organization**
    - Issue: Component stylesheets were used for modularity during refactoring, but could not be used in production due to Obsidian's plugin system limitations.
    - Fix: All component stylesheets were consolidated back into a single `styles.css` file, organized into clearly marked sections for each UI component or concern. CSS variables are used for theme compatibility and maintainability. This completes a two-phase CSS refactoring process.
    - Status: ✅ Fixed

12. **Expand/Collapse (Show more) Button, Scroll Jump, and Table Performance**
   - Issue: In the OneiroMetrics note, clicking 'Show more' or 'Show less' in the Dream Entries table caused UI delays, unregistered clicks, and scroll jumps, especially in large tables. Event listeners were sometimes duplicated or lost, and too many rows were rendered at once.
   - Fix: 
     - Removed global event listener attachment logic; listeners are now attached only to visible rows in the virtualized table, and a minimal handler is used for the static project note table.
     - Improved scroll logic to prevent jumping beneath the table and ensure the expanded row stays in view without overscrolling.
     - Reduced the number of visible rows from 25 to 12 for better performance and responsiveness.
     - Added detailed logging and used DevTools to diagnose and verify fixes (see [Logging](docs/developer/implementation/logging.md) and [Performance Testing](docs/developer/testing/performance-testing.md)).
   - Status: ✅ Fixed

13. **Metrics Table Only Showing Word Count**
   - Issue: The metrics table in the OneiroMetrics note only displayed the word count and not other metrics.
   - Fix: Updated the metrics parsing logic to handle case-insensitive metric names and ensure all metrics are added to the global metrics record.
   - Status: ✅ Fixed

## Recent Changes

### Filter System
- Added unified filter container
- Implemented date range and Custom Date Filter
- Added quick filter buttons
- Improved filter state management
- Enhanced filter UI/UX
- Added filter persistence
- Improved filter performance

### State Management
- Added filter state persistence
- Implemented efficient state storage
- Added debounced state saving
- Improved state restoration
- Added state cleanup on unload

### Performance Improvements
- Added debouncing for filter updates
- Optimized state management
- Improved event listener cleanup
- Enhanced date parsing performance
- Added performance logging
- Implemented efficient DOM updates
- Optimized expand/collapse event handling (no more global listeners)
- Improved scroll-to-row logic to prevent jumpiness
- Reduced visible rows from 25 to 12 for better Dream Metrics table performance
- Used targeted logging and DevTools profiling to verify fixes

### UI Improvements
- Enhanced filter container styling
- Added quick filter buttons with icons
- Improved filter feedback
- Added logging for filter interactions
- Improved accessibility features
- Enhanced mobile responsiveness
- Added column-specific classes to both <th> and <td> elements in the detailed dream entries table for precise CSS targeting (e.g., .column-date, .column-content, .column-metric-<metricname>). This is not yet implemented for the summary table.

### Logging System
- Added structured logging with categories
- Implemented performance tracking
- Added detailed error logging
- Improved debugging capabilities
- Added configurable logging settings in UI
- Implemented log rotation and backup

### State Persistence
- Added expanded/collapsed state persistence
- Implemented efficient state storage
- Added debounced state saving
- Improved state restoration
- Added state cleanup on unload

### Consolidated all component stylesheets back into `styles.css` for production, with section-based organization and extensive use of CSS variables. Component stylesheets were used temporarily during refactoring for clarity and modularity.

## Date Parsing Improvements
- Fixed date parsing to handle multiple formats:
  - Journal entry format (e.g., "Monday, January 6")
  - Block reference format (e.g., "^20250106")
  - YYYY-MM-DD format
- Added proper type safety for month name mapping
- Note: JavaScript's Date object uses zero-based month indexing (0-11) rather than one-based (1-12)
  - January = 0
  - February = 1
  - etc.
- Improved error handling and logging for date parsing failures

## Recent Fixes
- Fixed "Show More" button functionality and state persistence
- Restored Custom Date Filter functionality
- Added proper event handling for filter changes
- Improved filter feedback and visual indicators
- Added proper cleanup of event listeners

## Current Issues Requiring Testing

1. **State Persistence**
   - Test expanded/collapsed state restoration
   - Verify state persistence across sessions
   - Check performance with large datasets
   - Validate state cleanup on unload

2. **Logging System**
   - Verify log categories and levels
   - Test performance logging accuracy
   - Check error logging completeness
   - Validate debug logging output

3. **Performance**
   - Monitor filter update performance
   - Check state saving impact
   - Verify event listener efficiency
   - Test with large datasets

4. **Expand/Collapse (Read more) Button Performance**
   - Issue: Clicking "Read more" or "Show less" causes UI delays and unresponsiveness, especially in large tables.
   - Investigation: Used DevTools Performance tab; observed major GC events and input delays of several seconds.
   - Steps Taken: Implemented virtualization, tested with short content, disabled transitions, simplified handler.
   - Results: Virtualization improved scrolling, but expand/collapse delay persists.
   - Next Steps: Further isolate handler logic, explore alternative expand/collapse strategies.

5. **Scraping Modal Overhaul**
   - Issue: The Scraping Modal was simplified, losing its advanced features (note/folder selection, autocomplete, progress bar, helper text, and layout matching Obsidian Settings conventions).
   - Progress: Major UI and logic restoration underway. Dismissible note, two-column layout, helper text, and progress bar have been added. Folder autocomplete and layout refinements are in progress.
   - Remaining: Folder autocomplete not visible/working, section order/layout needs adjustment, progress bar label/placement, and two-column alignment. Modal dimensions under review.
   - Next Steps: Complete layout fixes, ensure all autocompletes work, finalize progress bar, and polish for release.
   - Status: 🚧 In Progress

6. **Custom Date Range Filter**
   - Issue: Custom date range input fields have significant usability issues 
   - Description: Date inputs require strict format adherence with minimal feedback
   - Impact: Makes manual date entry difficult for users (quick filter buttons work correctly)
   - Workaround: Use the preset date filters (This Week, Last Month, etc.) which function properly
   - Note: The Date Navigator custom date selection works as expected

7. **Journal Manager Open OneiroMetrics Button**
   - Issue: The "Open OneiroMetrics" button in the Dream Scrape tab provides no feedback while processing
   - Description: Users have no indication that anything is happening when the button is clicked
   - Impact: Creates confusion as it takes several seconds for the OneiroMetrics note to open
   - Recommended Fix: Add a loading indicator or progress animation to provide visual feedback
   - Status: 🚧 Identified, Not Started

## Future Features

### Dream Analysis
- Implement dream pattern recognition
- Add sentiment analysis
- Create dream theme categorization
- Develop character relationship mapping
- Further filter system fixes and improvements are planned for a future release.

### Month View
- Add a calendar-style month view for visualizing dream journal entries
- Implement day cells showing dream entry presence and key metrics
- Create an intuitive interface for navigating between months and years
- Enable quick filtering by clicking on specific days
- Integrate with existing date range filter system
- Provide visual indicators for days with significant dream activity
- Status: 🚧 Planned for next implementation phase

### Performance Optimization
- Implement virtual scrolling for large tables
- Add data caching for frequently accessed metrics
- Optimize state compression
- Improve filter performance

### Icon Picker
- [ ] TODO: Switch the Settings Icon Picker to use Obsidian's built-in icons instead of bundled lucide-static icons.

### Implementation Challenges
- Handle large dream datasets efficiently
- Manage memory usage with persistent states
- Optimize real-time filter updates
- Balance performance with feature richness

### Backup System
- [ ] Make backup path more user-friendly and configurable
  - Current default path (`Meta/Backups/OOM`) is specific to a particular vault structure
  - Consider implementing a more flexible path system that works better for different vault organizations
  - Add option to create backup folder automatically if it doesn't exist
  - Consider adding a "Backup Location" section in settings with common options (e.g., "Same folder as project note", "Dedicated backup folder", "Custom location")
  - Add validation to ensure backup path is valid and writable

## Testing Guidelines

### State Persistence Testing
1. Expand/collapse multiple entries
2. Restart Obsidian
3. Verify state restoration
4. Check performance impact

### Logging Testing
1. Verify all log categories
2. Check log levels
3. Test performance logging
4. Validate error handling

### Performance Testing
1. Test with large datasets
2. Monitor filter updates
3. Check state saving
4. Verify cleanup

## Contributing
Please report any issues or suggest improvements through the GitHub repository. Include:
- Detailed description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs and screenshots
  - Copy logs from Obsidian Developer Tools (Ctrl+Shift+I)
  - Paste into `oom-debug-log.txt`
  - Include relevant sections in your report
- See [docs/developer/implementation/logging.md](docs/developer/implementation/logging.md) for more details about the logging system
- For privacy and responsible disclosure guidelines, see [../SECURITY.md](../SECURITY.md)

### UI Improvements
- [x] Relocate Custom Date Filter button
  - Remove from ribbon to reduce UI clutter
  - Keep access through OneiroMetrics note only
  - Consider adding keyboard shortcut for quick access
  - Ensure discoverability through documentation and UI hints

## Future UI Improvements

### Visual Feedback Timing
- Consider adjusting timing of visual feedback (currently 200ms for buttons, 500ms for filters)
- Potential changes:
  - Shorter duration (150ms) for snappier feel
  - Longer duration (300ms) for more noticeable feedback
  - Add fade effects instead of class toggles
  - Add subtle scale effects for buttons

### Animation Styles
- Add smooth transitions for UI elements
- Potential improvements:
  - CSS transitions for height changes
  - Fade effects for rows appearing/disappearing
  - Slide effects for content expansion
  - Ripple effects for button clicks

### CSS Architecture
- [ ] Review each component for:
  - Documentation completeness
  - Code organization
  - Performance optimizations
  - Accessibility compliance
- [ ] Consider additional improvements:
  - CSS custom properties for theming
  - Further reduction of `!important` usage
  - Performance optimizations
  - Additional accessibility features
- [ ] Testing:
  - Cross-theme compatibility
  - Responsive behavior
  - Print styles
  - Accessibility features

## Performance Tracking

### Current Metrics
- Operation duration tracking for major functions
- Mutation observer counts
- State change timing
- Filter application performance

### Potential Additional Metrics
- Memory usage tracking
- DOM manipulation performance
- Event listener attachment timing
- State persistence performance
- Cache hit/miss rates for memoized operations
- File I/O operation timing
- Date parsing performance
- Filter application timing per row
- UI update timing per component

## Development Notes

### Logging Configuration
- Current Phase: Logging is set to "Debug" level by default to assist with development and issue tracking
- Future Change: After issues stabilize, logging will be set back to "Off" by default
- Users can still manually adjust logging level in settings if needed for troubleshooting

**Note:** The root-level LOGGING.md has been removed; all logging documentation is now in `docs/developer/implementation/logging.md`.

## Recent Fixes (May 2025)
- The "Show more" button for dream content now reliably expands and collapses content in the Dream Entries table across all tested themes and with/without custom CSS snippets.
- All debug and backup log files are now stored in the `logs/` folder and excluded from version control.
- The debug button ("Debug: Attach Show More Listeners") is now visible at the top of the project note when logging is set to **Debug** in settings. This allows users to manually reattach event listeners for expand/collapse buttons if needed.
- Both Settings buttons (in the Dream Scrape modal and at the top of the metrics note) now reliably open the OneiroMetrics settings tab.
- To access the debug button for troubleshooting, set Logging Level to **Debug** in OneiroMetrics settings.

## Current Issues (May 2025)
- The 'Read more' button arrow changes but does not reveal content. This is the top priority for the next round of fixes and testing.
- Filtering and metrics scraping are working as expected.
- UI and event handling for expand/collapse are under investigation.
- Ongoing testing is focused on interactive elements, accessibility, and event delegation.
- CSS refactoring is complete, with all styles organized into 14 focused components.
- **Date Navigator Display Issue**: The DateNavigator calendar component isn't correctly displaying dots and stars for dream entries. While the calendar UI renders properly, it fails to show indicators for dream entries that exist in the system. See detailed documentation: [docs/developer/implementation/date-navigator-display-issue.md](docs/developer/implementation/date-navigator-display-issue.md)

# Current Issues and Status

## CSS Refactoring
- [x] Reorganize component styles into focused files
- [x] Rename files to better reflect their purpose
- [x] Update file structure documentation
- [x] Remove old files
- [ ] Complete component documentation
- [ ] Performance testing
- [ ] Accessibility audit

### Recent Changes
1. Renamed component files for clarity:
   - `project-note-buttons.css` → `tables-dream-entries-buttons.css`
   - `drag-drop.css` → `settings-metrics-drag-drop.css`
   - `icon-picker.css` → `settings-metrics-icon-picker.css`

2. Reorganized modal styles:
   - Grouped related styles together
   - Improved section organization
   - Enhanced documentation

3. Improved table component organization:
   - Separated dream entries table styles
   - Isolated dream content styles
   - Created dedicated button styles

## Performance Issues
1. **Table Regeneration**
   - [ ] Optimize table update logic
   - [ ] Reduce unnecessary re-renders
   - [ ] Improve memory usage

2. **Icon Rendering**
   - [ ] Optimize icon loading
   - [ ] Reduce icon-related performance impact
   - [ ] Improve icon caching

## Accessibility
1. **Keyboard Navigation**
   - [ ] Enhance modal keyboard support
   - [ ] Improve table navigation
   - [ ] Add ARIA attributes

2. **Screen Reader Support**
   - [ ] Add descriptive labels
   - [ ] Improve focus management
   - [ ] Enhance announcements

## Theme Compatibility
1. **Color Contrast**
   - [ ] Verify contrast ratios
   - [ ] Test high contrast mode
   - [ ] Ensure readability

2. **Theme Integration**
   - [ ] Test with popular themes
   - [ ] Verify dark mode support
   - [ ] Check minimal theme compatibility

## Documentation
1. **Component Documentation**
   - [ ] Document CSS architecture
   - [ ] Add usage examples
   - [ ] Include best practices

2. **User Guide**
   - [ ] Update feature documentation
   - [ ] Add troubleshooting guide
   - [ ] Include examples

3. **Types System Documentation**
   - [ ] Update architecture diagrams to include consolidated types system
   - [ ] Create a new diagram showing types organization hierarchy
   - [ ] Document type migration strategy
   - [ ] See tracking document: [docs/developer/architecture/diagrams/types-refactoring-note.md]

## Testing
1. **Automated Testing**
   - [ ] Add unit tests
   - [ ] Implement integration tests
   - [ ] Set up CI/CD

2. **Manual Testing**
   - [ ] Create test scenarios
   - [ ] Document test cases
   - [ ] Establish testing procedures

## Next Steps
1. Complete performance optimization
2. Finish accessibility improvements
3. Update documentation
4. Implement automated testing
5. Conduct theme compatibility testing
6. Further filter system fixes and improvements

## Resolved Issues
1. **CSS Organization**
   - [x] Reorganized component styles
   - [x] Improved file naming
   - [x] Updated documentation

2. **Modal System**
   - [x] Improved organization
   - [x] Enhanced documentation
   - [x] Added accessibility features

3. **Table Components**
   - [x] Separated concerns
   - [x] Improved maintainability
   - [x] Enhanced documentation

## [May 2025] Settings Page Regression and Resolution

### Issue
After a series of refactors and bug fixes, the Settings page for OneiroMetrics regressed:
- Metrics were no longer grouped into Enabled and Disabled sections.
- The ability to edit existing metrics was missing (no edit button/modal).
- The enabled/disabled state of metrics was not preserved according to the spec; all metrics appeared enabled.

### Resolution
- The merging logic for metrics in `loadSettings()` was fixed to preserve the correct enabled/disabled state from defaults and user settings.
- The Settings UI was updated to group metrics into Enabled and Disabled sections.
- An Edit button (pencil icon) was added to each metric, opening a modal for editing all properties.
- The documentation in `SPECIFICATION.md` was updated to accurately describe the new Settings UI and editing features.

### Note
If further UI changes are made, ensure that both the code and `SPECIFICATION.md` remain in sync.

## OneiroMetrics Scrape Modal Fixes (v0.3.7)

- Overhauled the Scrape modal to match the documented two-column layout and DOM structure, ensuring all labels and helper text are left-aligned and widgets are right-aligned.
- Restored autocomplete functionality for both Selected Notes (multi-chip) and Selected Folder fields, using the same widgets as in Settings.
- Fixed issues with duplicate or misaligned fields when toggling selection mode.
- Ensured the progress bar and scrape button are placed and labeled according to spec.
- Updated CSS and modal logic to match the new UI/DOM requirements.
- Updated `SPECIFICATION.md` to include a dedicated UI/DOM Structure section with a sample HTML block for the Scraping Modal, clarifying implementation details for future development.

## TODOs from Settings Page Review

- [ ] Add subtle borders or more spacing between major sections for even clearer separation (especially between "Metrics Settings" and "Enabled Metrics").
- [ ] Consider aligning the "Add Metric" and "View Descriptions" buttons horizontally for a more compact look.
- [ ] Optionally make some descriptions collapsible or only visible on hover to further reduce visual clutter.
- [ ] Check and improve responsiveness of the settings page on smaller screens and in Obsidian's mobile app.

## [Unreleased]
- Settings button added to Dream Scrape modal (quick access to settings)
- Settings button added to top of OneiroMetrics note (quick access to settings)
- Fixed: Settings buttons now reliably open the OneiroMetrics settings tab
- Documentation for accessing settings improved (see README and SPECIFICATION)

## Filters Expansion Progress

### Phase 1 (Complete)
- Custom Date Range modal for selecting start/end dates
- Favorites system: save, select, and delete custom date ranges
- UI/UX improvements: visual hierarchy, compact favorites list, Lucide icons, improved modal layout, and button prominence
- Accessibility and keyboard navigation improvements
- Responsive modal width and layout

### Phase 2 (Planned)
- User-defined custom presets in the dropdown
- Calendar improvements (multi-month view, week numbers, preview optimization)
- Further UI/UX polish (favorites editing, tooltips, empty state, etc.)
- Additional accessibility enhancements
- Advanced filtering and analytics features

## UI/UX TODOs

### Ribbon Button Behavior
1. Update the "Open OneiroMetrics Note" ribbon button to use the command instead of directly opening the note
