# Logging Best Practices

This document outlines the best practices for logging in the OneiroMetrics codebase. These guidelines will help maintain consistency across the codebase and ensure that logs are useful for debugging and monitoring.

## Using the Structured Logging System

The OneiroMetrics plugin uses a structured logging system that provides consistent formatting, configurable log levels, and proper error context. Always use this system instead of direct `console.log/warn/error` calls.

### Getting a Logger Instance

```typescript
import { getLogger } from '../logging';

// Create a logger instance with the component name
const logger = getLogger('ComponentName');
```

### Log Levels

Use the appropriate log level for each message:

- **error**: Use for errors that affect functionality. Include the error object for stack traces.
- **warn**: Use for potentially problematic situations that don't stop functionality.
- **info**: Use for important operational information.
- **debug**: Use for detailed information helpful during development.
- **trace**: Use for extremely detailed debugging information.

### Proper Log Format

Always include a category and message:

```typescript
// Basic format
logger.info('Category', 'Message');

// With error object
logger.error('Category', 'Error message', error);

// With context data
logger.debug('Category', 'Message', { contextData });
```

## Standard Categories

Use these standard categories for consistency:

- **'API'** - For API calls and responses
- **'Calendar'** - For DateNavigator calendar operations
- **'DOM'** - For DOM manipulation
- **'EdgeCase'** - For edge case handling
- **'Init'** - For initialization and startup
- **'Metrics'** - For metrics operations
- **'Parser'** - For content parsing
- **'Settings'** - For settings operations
- **'State'** - For state management
- **'Template'** - For template operations
- **'Test'** - For test-related logging
- **'UI'** - For UI components

## Examples

### Component Initialization

```typescript
// In a component constructor
const logger = getLogger('MetricComponent');
logger.debug('Init', 'Initializing metric component', { metric: this.metric.name });
```

### Error Handling

```typescript
try {
  // Some operation that might fail
  setIcon(this.iconElement, this.metric.icon);
} catch (error) {
  const logger = getLogger('MetricComponent');
  logger.warn('UI', `Failed to set icon ${this.metric.icon}:`, error);
  // Fallback behavior
}
```

### API Calls

```typescript
const logger = getLogger('ApiClient');

try {
  const response = await fetch(url);
  logger.debug('API', `Request to ${url} completed`, { status: response.status });
  
  if (!response.ok) {
    logger.warn('API', `Request failed with status ${response.status}`);
    return null;
  }
  
  return await response.json();
} catch (error) {
  logger.error('API', `Request to ${url} failed`, error);
  throw error;
}
```

### State Updates

```typescript
// When updating state
logger.debug('State', 'Updating dream entries', { 
  count: entries.length,
  firstDate: entries[0]?.date,
  lastDate: entries[entries.length - 1]?.date
});
```

## Global Logger Pattern

For utility functions outside of classes, use the global logger pattern:

```typescript
// At the top of the file
import { safeLogger } from './logging/safe-logger';
let globalLogger: any = safeLogger;

// In your plugin class
export default class MyPlugin extends Plugin {
  onload() {
    // Update global logger with the instance logger
    globalLogger = this.logger;
  }
}

// In utility functions
function utilityFunction() {
  globalLogger.debug('Utility', 'Performing utility operation');
}
```

## Testing-Related Logging

In test files, use 'Test' category and include test names:

```typescript
const logger = getLogger('TestRunner');
logger.info('Test', 'Running metric helper tests...');

return testRunner.runTests().then(results => {
  const passedCount = results.filter(r => r.passed).length;
  logger.info('Test', `Tests complete: ${passedCount}/${results.length} tests passed`);
  
  // Log any failures
  results.filter(r => !r.passed).forEach(failure => {
    logger.error('Test', `Test failed: ${failure.name}`, failure.error);
  });
});
```

## When NOT to Use Structured Logging

1. **Build/Utility Scripts**: Scripts that run outside the plugin runtime (build-css.js, version-bump.mjs, etc.) can use direct console methods.

2. **Deprecation Warnings**: Warnings that need to run immediately on import, before the logging system is initialized.

3. **Logging System Implementation**: The actual console adapter and safe-logger implementations.

## Logging Configuration

Users can configure logging levels in plugin settings. Always respect these settings and avoid excessive logging in production code.

```typescript
// Default log level is 'info' in production
// To change the log level for development:
logger.setLevel('debug');
```

By following these guidelines, we maintain a consistent and effective logging approach throughout the codebase, enhancing maintainability and debugging capabilities. 