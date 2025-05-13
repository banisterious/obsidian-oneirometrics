# OneiroMetrics Logging System

## Overview
The OneiroMetrics plugin implements a comprehensive logging system to aid in debugging, monitoring, and performance tracking. The system uses a singleton Logger class that provides structured logging with different categories and severity levels.

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
The plugin maintains a debug log file at `oom-debug-log.txt` in the vault root. This file is used for:
- Capturing detailed logs during development and testing
- Troubleshooting issues reported by users
- Monitoring performance and behavior in production

### Using the Debug Log
1. When reporting issues, please include relevant sections from the debug log
2. The log file is automatically excluded from version control (see `.gitignore`)
3. To capture logs:
   - Open the Obsidian Developer Tools (Ctrl+Shift+I)
   - Copy relevant log entries
   - Paste them into `oom-debug-log.txt`
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

## Contributing
When contributing to the project:
1. Use the logging system consistently
2. Add appropriate log entries for new features
3. Include error logging for edge cases
4. Document any new log categories
5. Test logging behavior in different scenarios 