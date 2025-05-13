# Known Issues and Future Improvements

## Recent Issues and Fixes

### Fixed Issues
1. **Time Filter Integration**
   - Issue: Time filter changes not properly updating table rows
   - Fix: Implemented debounced filter updates and improved event handling
   - Status: ✅ Fixed

2. **Date Display**
   - Issue: "Invalid Date" appearing in date column
   - Fix: Enhanced date parsing with multiple format support and validation
   - Status: ✅ Fixed

3. **Expand/Collapse Functionality**
   - Issue: "Show more" button not working consistently
   - Fix: Improved event listener management and added state persistence
   - Status: ✅ Fixed

4. **Performance Issues**
   - Issue: Slow response when filtering large datasets
   - Fix: Implemented debouncing and optimized state management
   - Status: ✅ Fixed

## Recent Changes

### Logging System
- Added structured logging with categories
- Implemented performance tracking
- Added detailed error logging
- Improved debugging capabilities

### State Persistence
- Added expanded/collapsed state persistence
- Implemented efficient state storage
- Added debounced state saving
- Improved state restoration

### Performance Improvements
- Added debouncing for filter updates
- Optimized state management
- Improved event listener cleanup
- Enhanced date parsing performance

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
