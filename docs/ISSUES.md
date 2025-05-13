# Known Issues and Future Improvements

## Recent Issues and Fixes (May 12, 2025)

### Time Filter Integration
- **Issue:** Time filter integration was broken due to incorrect event handling
- **Fix:** 
  - Replaced non-existent `file-change` event with correct `modify` event from vault
  - Added proper event subscriptions for layout changes, workspace resizing, and active leaf changes
  - Enhanced logging for filter updates and changes
  - Improved filter state management

### Date Display
- **Issue:** "Invalid Date" displays in the metrics table
- **Fix:**
  - Added robust date parsing for multiple formats (YYYY-MM-DD, block references, journal dates)
  - Implemented detailed logging for date parsing attempts
  - Added better error handling for invalid dates
  - Improved date format detection order

### Expand/Collapse Functionality
- **Issue:** Expand/collapse buttons were non-functional
- **Fix:**
  - Simplified button state management
  - Added aria-expanded and data-expanded attributes
  - Improved visibility toggling logic
  - Added detailed logging for button interactions
  - Enhanced error handling for content visibility

### Logging Improvements
- Added comprehensive logging throughout the codebase:
  - Date parsing and formatting
  - Filter updates and changes
  - Button interactions
  - Content visibility toggling
  - Table updates

## Recent Changes
- **New Optional Metrics Added:**
  - Dream Theme (Categorical/Keywords)
  - Lucidity Level (Score 1-5)
  - Dream Coherence (Score 1-5)
  - Setting Familiarity (Score 1-5)
  - Ease of Recall (Score 1-5)
  - Recall Stability (Score 1-5)

- **Metric Order Updated:**
  - **Default Metrics:** Sensory Detail, Emotional Recall, Descriptiveness, Characters Role, Confidence Score
  - **Optional Metrics:** Characters Count, Familiar Count, Unfamiliar Count, Characters List, Dream Theme, Lucidity Level, Dream Coherence, Setting Familiarity, Ease of Recall, Recall Stability

- **UI Enhancements:**
  - Optional metrics are now displayed in section, improving usability and reducing visual clutter.
  - **Settings Page Overhaul:** The Settings page now features a bordered metrics section, clear section dividers, and helper text under section headers. Default and Optional Metrics are grouped and styled for easier navigation.

## UI Improvements
- **Metrics Descriptions Modal:** A dedicated modal now displays all metric descriptions (default and optional) with a landscape layout, improved table borders, and Lucide icons integrated into headings. This modal is accessible via a 'Metrics Descriptions' button in the settings page.
- **Settings Page Overhaul:** The Settings page now features a visually distinct bordered metrics section, clear section dividers, and helper text under key section headers for improved clarity and usability. Default and Optional Metrics are grouped and styled for easier navigation.

## Current Issues
- **Testing Required:** 
  - Verify time filter UI accessibility features
  - Test calendar preview responsiveness
  - Validate keyboard navigation in time filter
  - Check high contrast mode compatibility
  - Test screen reader announcements
  - Verify mobile layout behavior
  - Test date parsing with various formats
  - Verify expand/collapse functionality
  - Test filter state persistence

## Future Improvements
- **Time Filter Enhancements:**
  - Add support for custom date ranges via calendar
  - Implement date range presets (Last 7 days, Last 30 days, etc.)
  - Add relative time indicators (e.g., "2 days ago")
  - Enhance calendar preview with multi-month view
  - Add support for week numbers in calendar
  - Implement date range comparison features

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

- **Performance Optimization:**
  - Reduce excessive logging in future builds
  - Optimize calendar preview rendering
  - Improve time filter state management

## Date Format Standardization (May 12, 2025)

### Current Situation
- Multiple date formats are currently supported:
  - YYYY-MM-DD
  - Block reference format (^YYYYMMDD)
  - Journal date format
  - Month Day, YYYY
  - Various other formats
- This complexity leads to:
  - Increased parsing overhead
  - More potential points of failure
  - Harder to maintain code
  - Inconsistent date display

### Proposed Solution
- Standardize on a single primary date format (YYYY-MM-DD)
- Add clear documentation for users about the preferred format
- Provide a migration path for existing entries
- Consider adding a date format conversion tool

### Benefits
- Simpler, more reliable date parsing
- Consistent date display across the plugin
- Better performance
- Easier maintenance
- Reduced bug surface area

### Implementation Plan
1. Document the preferred date format
2. Add warnings for non-standard formats
3. Create a conversion utility
4. Update documentation
5. Consider adding a date format validation step

## Contributing
If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request.

## How to Report Issues

When reporting a new issue, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Console logs if available
6. Obsidian version
7. Plugin version
8. Theme being used

For detailed testing steps and scenarios, see `TESTING.md`.
