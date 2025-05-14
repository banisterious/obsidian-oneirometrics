# Known Issues and Future Improvements

## Recent Issues and Fixes

### Fixed Issues
1. **Filter System Integration**
   - Issue: Filter changes not properly updating table rows
   - Fix: Implemented debounced filter updates and improved event handling
   - Status: ✅ Fixed

2. **Date and Time Filter UI**
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

## Recent Changes

### Filter System
- Added unified filter container
- Implemented date range and time filters
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

### UI Improvements
- Enhanced filter container styling
- Added quick filter buttons with icons
- Improved filter feedback
- Added logging for filter interactions
- Improved accessibility features
- Enhanced mobile responsiveness

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
- Restored Time Filters functionality
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

## Future Features

### Dream Analysis
- Implement dream pattern recognition
- Add sentiment analysis
- Create dream theme categorization
- Develop character relationship mapping

### Performance Optimization
- Implement virtual scrolling for large tables
- Add data caching for frequently accessed metrics
- Optimize state compression
- Improve filter performance

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
- See [docs/LOGGING.md](docs/LOGGING.md) for more details about the logging system

### UI Improvements
- [ ] Relocate Time Filters button
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

**Note:** The root-level LOGGING.md has been removed; all logging documentation is now in `docs/LOGGING.md`.

## Recent Fixes (May 2025)
- The "Show more" button for dream content now reliably expands and collapses content in the Dream Entries table across all tested themes and with/without custom CSS snippets.
- All debug and backup log files are now stored in the `logs/` folder and excluded from version control.
- A temporary debug button ("Debug: Attach Show More Listeners") is available at the top of the project note to manually attach event listeners for expand/collapse buttons if needed.

## Current Issues (May 2025)
- The 'Read more' button arrow changes but does not reveal content. This is the top priority for the next round of fixes and testing.
- Filtering and metrics scraping are working as expected.
- UI and event handling for expand/collapse are under investigation.
- Ongoing testing is focused on interactive elements, accessibility, and event delegation.
