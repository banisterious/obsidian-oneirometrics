# Known Issues & Feature Requests

## Current Issues

### High Priority
- [ ] **Table Regeneration:** Dream Entry and Statistics tables sometimes do not update or duplicate. This is still being debugged.
- [ ] **Modal Feedback:** Modal feedback and reliability are still being improved.
- [ ] Implement proper error handling for failed metric scraping
- [ ] Add support for custom metric validation rules
- [ ] Improve performance of large dataset handling

### Medium Priority
- [ ] **Performance Optimization:** Reduce excessive logging and remove or limit debug console.logs, especially those related to backup creation and extraction logic.
- [ ] Add export functionality for metrics data
- [ ] Implement metric trend visualization
- [ ] Add support for metric categories/tags
- [ ] Improve mobile responsiveness of tables
- [ ] Add keyboard shortcuts for common actions

### Low Priority
- [ ] **Documentation Updates:** Some documentation sections need to be updated to reflect recent changes.
- [ ] Add support for custom date formats
- [ ] Implement metric comparison features
- [ ] Add support for metric notes/comments
- [ ] Improve accessibility of button interactions
- [ ] Add support for custom table layouts

## Feature Requests

### Planned Features
- [ ] **Icon Picker Enhancements:**
  - Add search/filter functionality
  - Add more icons to the picker
- [ ] **Test Modal:** Add a Test Modal where users can paste Markdown and see how the plugin processes and renders it
- [ ] **Performance Improvements:**
  - Optimize table rendering
  - Reduce memory usage
  - Improve backup system efficiency

### UI/UX Improvements
- [ ] **Theme Integration:**
  - Further improve theme compatibility
  - Add support for more Obsidian themes
- [ ] **Mobile Experience:**
  - Enhance touch interactions
  - Optimize layout for small screens

## Recent Resolutions

The following issues have been resolved in version 0.3.0:
- ✅ Show More Button functionality
- ✅ Metric Edit Modal Icon display
- ✅ Scraping completion issues
- ✅ Callout Structure Box wrapping
- ✅ Backup Filename Date formatting
- ✅ Readable Line Length Override
- ✅ Chips Area UI styling
- ✅ Backup File Extension (.bak)
- ✅ Open Metrics Note Button
- ✅ Parser blockStack logic
- ✅ Callout metadata handling
- ✅ Table sorting and filtering
- ✅ Dream content extraction and rendering
- ✅ Autocomplete and file suggestion reliability
- ✅ Standardized button system implementation
- ✅ Improved table performance with virtual scrolling
- ✅ Enhanced mobile responsiveness
- ✅ Added proper cleanup for event listeners
- ✅ Implemented memoization for table calculations

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
