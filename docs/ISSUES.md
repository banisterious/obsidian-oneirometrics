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
  - Block reference format (^YYYYMMDD) - Primary preferred format
  - YYYY-MM-DD
  - Journal date format
  - Month Day, YYYY
  - Various other formats
- This complexity leads to:
  - Increased parsing overhead
  - More potential points of failure
  - Harder to maintain code
  - Inconsistent date display

### Date Handling Strategy

#### Primary Date Source: Block References
- Block references (^YYYYMMDD) are the preferred and most reliable date source because:
  - They are manually created, ensuring accuracy
  - They provide a direct link to the exact location in the note
  - They are consistent and machine-readable
  - They are part of Obsidian's core functionality
  - They maintain a clear connection between the metrics and the source content

#### Fallback Date Sources
While block references are preferred, the plugin supports multiple date formats to accommodate different user workflows:
1. **Block References (^YYYYMMDD)**
   - First choice for date extraction
   - Most reliable and consistent
   - Provides direct linking capability
   - Example: ^20250512

2. **YYYY-MM-DD Format**
   - Common in many journal systems
   - Easily sortable
   - Machine-readable
   - Example: 2025-05-12

3. **Journal Date Format**
   - Compatible with Obsidian's journal plugin
   - Maintains consistency with core Obsidian features
   - Example: 2025-05-12

4. **Human-Readable Formats**
   - Supports various localized formats
   - Useful for display purposes
   - Example: May 12, 2025

### Implementation Details

#### Date Extraction Process
1. **Primary Check**
   - First attempt to find a block reference (^YYYYMMDD)
   - Log success/failure for debugging
   - Use this as the authoritative date if found

2. **Fallback Chain**
   - If no block reference is found, try other formats in order:
     1. YYYY-MM-DD
     2. Journal date format
     3. Other supported formats
   - Log which method was used for debugging
   - Consider adding a warning if block references aren't found

3. **Date Validation**
   - Validate all extracted dates
   - Ensure they fall within reasonable ranges
   - Log any validation failures
   - Provide clear error messages

#### User Experience Considerations
1. **Documentation**
   - Clear explanation of preferred date format
   - Examples of supported formats
   - Benefits of using block references
   - Instructions for adding block references

2. **Assistance Features**
   - Consider adding a feature to help users add block references
   - Provide warnings when block references are missing
   - Offer conversion tools for existing entries

3. **Flexibility**
   - Maintain support for multiple formats
   - Allow users to choose their preferred format
   - Provide clear feedback about date extraction

### Benefits
- Reliable date extraction with block references as the source of truth
- Flexible support for various user workflows
- Clear documentation and user guidance
- Improved debugging capabilities
- Better maintainability
- Reduced bug surface area

### Implementation Plan
1. Document the preferred date format and strategy
2. Add warnings for missing block references
3. Create a conversion utility for existing entries
4. Update documentation with detailed examples
5. Add date format validation
6. Implement logging for date extraction process
7. Consider adding a block reference helper feature

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
