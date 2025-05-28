# Log Viewer Enhancements

This document tracks planned enhancements for the log viewer feature.

## User Settings

- [ ] Default log level preference
- [ ] Auto-refresh toggle and interval
- [ ] Max number of entries to keep in memory
- [ ] Default category filters

## Viewer Functionality

- [ ] Add relative timestamps (e.g., "2 minutes ago")
- [ ] Implement collapsible log groups for related entries
- [ ] Add search highlighting within log content
- [ ] Create filter presets that users can save

## Plugin Integration

- [ ] Add context menu options to copy relevant logs when errors occur
- [ ] Create a condensed "mini log viewer" for the status bar
- [ ] Add visual indicators when errors or warnings occur

## Documentation

- [ ] User guide for the log viewer features
- [ ] Developer documentation for using the logging system effectively
- [ ] Examples of common debugging scenarios

## Testing

- [ ] Unit tests for the log adapter components
- [ ] Integration tests for the viewer modal
- [ ] Mock log data generation for testing different scenarios

## Implementation Notes

**Priority Order:**
1. User settings (especially max entries to control memory usage)
2. Search highlighting (most helpful for debugging)
3. Plugin integration for error reporting
4. Documentation
5. Testing infrastructure

**Technical Considerations:**
- Memory management will be important for long sessions
- Consider throttling log updates during high-volume logging
- Ensure compatibility with both light and dark themes 