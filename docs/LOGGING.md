# OneiroMetrics Logging System

## Overview
The OneiroMetrics plugin implements a comprehensive logging system to aid in debugging, monitoring, and performance tracking. The system uses a singleton Logger class that provides structured logging with different categories and severity levels.

## Configuration
The logging system can be configured through the plugin settings:

1. Open the OneiroMetrics settings
2. Navigate to the "Logging Settings" section (located after basic settings)
3. Configure the following options:
   - **Logging Level**: Choose between "Off", "Errors Only", or "Debug"
   - **Maximum Log Size**: Set the maximum size of the log file in MB
   - **Maximum Backups**: Set the number of backup log files to keep

> **Note**: Logging is set to "Off" by default. Enable logging only when needed for debugging issues. When reporting issues, please enable logging and include relevant log entries.

> **Note:** All debug and backup log files are stored in the `logs/` folder (e.g., `logs/oom-debug-log.txt`, `logs/oom-debug-log.backup-*.txt`).

## Log Categories
- **Date**: Date parsing and validation operations
- **Events**: Event listener management and user interactions
- **Filter**: Time filter and metric filter operations
- **Metrics**: Metrics calculation and processing
- **UI**: User interface interactions and state changes
- **Performance**: Operation timing and performance metrics
- **Error**: Error tracking and debugging information

## Log Levels
1. **log**: General information and state changes
2. **warn**: Non-critical issues and potential problems
3. **error**: Critical errors with stack traces
4. **debug**: Detailed debugging information
5. **performance**: Operation timing and performance metrics

## Usage Examples

### Date Operations
```typescript
logger.debug('Date', 'Processing date: 2024-03-15');
logger.log('Date', 'Parsed YYYY-MM-DD format: 2024-03-15T00:00:00.000Z');
logger.error('Date', 'Failed to parse date: invalid-date', new Error('Invalid format'));
```

### Event Handling
```typescript
logger.log('Events', 'Attaching project note event listeners');
logger.debug('Events', 'Content changed, reattaching expand button listeners');
logger.log('UI', 'Content expanded', { contentId: '2024-03-15-dream1' });
```

### Filter Operations
```typescript
logger.log('Filter', 'Updating table with current filter');
logger.debug('Filter', 'Filter date range', { start: '2024-03-01', end: '2024-03-15' });
logger.log('Filter', 'Table updated with filter: Last Week', { visibleEntries: 5, totalEntries: 10 });
```

### Performance Tracking
```typescript
const startTime = performance.now();
// ... operation ...
logger.performance('Filter', 'updateTableWithFilter', startTime);
```

## State Persistence Logging
The logging system also tracks state persistence operations. For detailed information about state persistence, see [State Persistence](STATE_PERSISTENCE.md).

```typescript
logger.debug('UI', `Loaded ${expandedStates.size} expanded states`);
logger.debug('UI', `Saved ${expandedStates.size} expanded states`);
```

## Best Practices
1. Use appropriate log levels for different types of information
2. Include relevant context data in log messages
3. Use performance logging for potentially slow operations
4. Include error details and stack traces for error logging
5. Use debug logging for detailed troubleshooting information

## Log Format
All logs follow this format:
```
[OneiroMetrics][Category] Message
Data: { ... } // Optional structured data
Error: ... // For error logs
Stack: ... // For error logs
```

## Performance Considerations
- Debug logs are only output when debugging is enabled
- Performance logging includes operation duration
- Log data is structured for easy parsing
- Error logs include full stack traces for debugging 

## Debug Log File
The plugin maintains a debug log file at `logs/oom-debug-log.txt` in the vault root. This file is used for:
- Capturing detailed logs during development and testing
- Troubleshooting issues reported by users
- Monitoring performance and behavior in production

### Using the Debug Log
1. When reporting issues, please include relevant sections from the debug log
2. The log file is automatically excluded from version control (see `.gitignore`)
3. To capture logs:
   - Open the Obsidian Developer Tools (Ctrl+Shift+I)
   - Copy relevant log entries
   - Paste them into `logs/oom-debug-log.txt`
   - Include the log entries when reporting issues

### Log Format
Each log entry follows this format:
```
[OneiroMetrics][Category] Message
Data: {optional JSON data}
```

### Performance Logging
Performance measurements are logged with timing information:
```
[OneiroMetrics][Performance] Operation took X.XXms
Data: {
  "category": "Category",
  "operation": "Operation name",
  "duration": X.XX
}
```

### Error Logging
Errors include stack traces and context:
```
[OneiroMetrics][Error] Error message
Error: Error details
Stack: Error stack trace
Data: {optional context data}
```

## Log File Management

### Automatic Cleanup
The plugin implements automatic log file management:
- Logs are automatically cleared after successful issue resolution
- A backup of the log is created before clearing (with timestamp)
- Maximum log file size is enforced (default: 1MB)
- Old log backups are automatically cleaned up (keeps last 5)

### Manual Management
You can also manage the log file manually:
1. Clear the log:
   - Use the "Clear Debug Log" command in the command palette
   - Or delete the contents of `logs/oom-debug-log.txt`
2. Create a backup:
   - Use the "Backup Debug Log" command
   - Or manually copy the file with a timestamp

## Debugging UI Event Attachment

A temporary debug button labeled **"Debug: Attach Show More Listeners"** appears at the top of the project note in development mode only. This button can be used to manually trigger the attachment of event listeners for the Show more/Show less buttons in the Dream Entries table.

### Development Mode
The debug button is only visible when the plugin is running in development mode (`NODE_ENV === 'development'`). This ensures that development tools are not exposed to end users in production builds.

### Purpose
- To help diagnose and resolve issues where the Show more/Show less buttons do not respond due to event listeners not being attached (often due to theme or timing issues).
- Provides a way to manually reattach event listeners during development and testing.

### Where it appears
- At the top of the project note, next to the "Rescrape Metrics" button
- Only visible in development mode
- Automatically hidden in production builds

### When to use
- During development and testing
- When debugging theme compatibility issues
- When testing custom CSS snippets
- When investigating event listener attachment problems

### Implementation Details
```typescript
// Only show debug button in development mode
if (process.env.NODE_ENV === 'development') {
    const debugButton = buttonContainer.createEl('button', {
        text: 'Debug: Attach Show More Listeners',
        cls: 'mod-warning oom-debug-attach-listeners'
    });
    debugButton.addEventListener('click', () => {
        new Notice('Manually attaching Show More listeners...');
        this.attachProjectNoteEventListeners();
    });
}
```

### Note
- This button is intended for development and testing purposes only
- It will be automatically excluded from production builds
- The functionality it provides is also available through the logging system when debug logging is enabled

## Best Practices
1. Clear the log before starting a new testing session
2. Create a backup before clearing if the logs might be needed later
3. Include log file management in your testing workflow
4. Check log file size periodically
5. Review and clean up old log backups

## Contributing
When contributing to the project:
1. Use the logging system consistently
2. Add appropriate log entries for new features
3. Include error logging for edge cases
4. Document any new log categories
5. Test logging behavior in different scenarios 