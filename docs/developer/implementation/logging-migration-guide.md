# Logging System Migration Guide

This guide will help you transition from the old logging system to the new modular, configurable logging architecture.

## Table of Contents

- [Overview of Changes](#overview-of-changes)
- [Key Benefits](#key-benefits)
- [Migration Steps](#migration-steps)
- [Direct Replacement Examples](#direct-replacement-examples)
- [Advanced Usage Examples](#advanced-usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview of Changes

The logging system has been completely refactored to provide:

1. A more modular architecture with clear separation of concerns
2. Multiple output targets (console, file, Obsidian notices)
3. Configurable log formatting
4. Improved error enrichment for better debugging
5. Performance optimizations for minimal overhead
6. Compatibility with the Service Registry pattern

The new system maintains backward compatibility while providing enhanced features.

## Key Benefits

- **Immediate Availability**: Logging is available from the earliest plugin initialization
- **Multiple Outputs**: Log to console, file, and Obsidian notices simultaneously
- **Contextual Logging**: Add context to log messages for better debugging
- **Performance**: Minimal overhead for disabled log levels
- **Defensive Coding**: Built-in error handling and safety
- **Testability**: Easier to test with captured log output

## Migration Steps

### Step 1: Import from the new system

```typescript
// Old imports
import { globalLogger } from 'utils/logger';

// New imports
import { getLogger, loggerFactory, defaultLogger } from 'src/logging';
```

### Step 2: Get a logger instance

```typescript
// Old approach
const logger = globalLogger;
// or
const logger = window.globalLogger;

// New approach - preferred
const logger = getLogger('ComponentName');
// or
const logger = loggerFactory.getLogger('ComponentName');
// or
const logger = defaultLogger;
```

### Step 3: Update logging calls

The method signatures remain the same, so most logging calls won't need changes:

```typescript
// Both old and new
logger.debug('Category', 'Message', optionalData);
logger.info('Category', 'Message', optionalData);
logger.warn('Category', 'Message', optionalData);
logger.error('Category', 'Message', errorObject);
```

### Step 4: Use new error enrichment

```typescript
// Old approach
throw new Error('Something went wrong');

// New approach
throw logger.enrichError(new Error('Something went wrong'), {
  component: 'MyComponent',
  operation: 'processData',
  metadata: { 
    id: '123', 
    state: 'processing' 
  }
});
```

### Step 5: Add contextual logging (new feature)

```typescript
// Create a contextual logger
const contextLogger = logger.withContext({ 
  userId: '123', 
  sessionId: 'abc-123'
});

// All logs will include the context
contextLogger.info('Auth', 'User logged in');
// Log includes: { userId: '123', sessionId: 'abc-123' }
```

## Direct Replacement Examples

### Global Logger

```typescript
// Old
import { globalLogger } from 'utils/logger';
globalLogger.info('Component', 'Message');

// New
import { defaultLogger } from 'src/logging';
defaultLogger.info('Component', 'Message');
```

### Component Logger

```typescript
// Old
class MyComponent {
  private logger = window.globalLogger;
  
  method() {
    this.logger.debug('MyComponent', 'Debug message');
  }
}

// New
import { getLogger } from 'src/logging';

class MyComponent {
  private logger = getLogger(this);
  
  method() {
    this.logger.debug('Method', 'Debug message');
  }
}
```

### Convenience Functions

```typescript
// Old
import { debug, info, warn, error } from 'utils/logger';
debug('Component', 'Message');

// New
import { debug, info, warn, error } from 'src/logging';
debug('Component', 'Message');
```

## Advanced Usage Examples

### Custom Configuration

```typescript
import { loggerFactory } from 'src/logging';

loggerFactory.initialize({
  level: 'debug',
  enableConsole: true,
  enableFile: true,
  logFilePath: 'logs/debug.log',
  maxSize: 1024 * 1024, // 1MB
  maxBackups: 3,
  enableNotices: true
});
```

### Using with Service Registry

```typescript
import { SERVICE_REGISTRY } from 'src/state/ServiceRegistry';
import { loggerFactory, ILogger } from 'src/logging';

// Register the logger factory
SERVICE_REGISTRY.registerService('loggerFactory', loggerFactory);

// Get a logger from a service
class MyService {
  private logger: ILogger;
  
  constructor() {
    const factory = SERVICE_REGISTRY.getService('loggerFactory');
    this.logger = factory.getLogger('MyService');
  }
}
```

### Timer Functions

```typescript
import { getLogger } from 'src/logging';

const logger = getLogger('Performance');

function expensiveOperation() {
  const endTimer = logger.time('expensiveOperation');
  
  // Do work...
  
  endTimer(); // Logs the duration
}
```

## Best Practices

1. **Use Specific Loggers**: Create a logger for each component instead of using the default logger
2. **Include Context**: Add relevant context to error messages to aid debugging
3. **Use Consistent Categories**: Establish a convention for log categories
4. **Log at Appropriate Levels**: Use the right level for each message
   - `error`: Errors that prevent operations from completing
   - `warn`: Potential issues that don't prevent operation
   - `info`: Important operations completion
   - `debug`: Detailed diagnostic information
   - `trace`: Very detailed step-by-step information
5. **Add Structure**: Include structured data instead of embedding it in strings

## Troubleshooting

### Logs not appearing in the console

- Check that `enableConsole` is set to `true` in the configuration
- Verify that the log level is not set too restrictive (e.g., 'error' won't show 'debug' logs)

### Logs not being written to the file

- Verify the `logFilePath` is valid and accessible
- Check that `enableFile` is set to `true`
- Ensure the Obsidian vault has permission to write to the file

### Getting compilation errors

- Make sure you're importing from 'src/logging' instead of 'utils/logger'
- Check that you're using the correct method signatures

### Logger Not Available During Initialization

- Use the safe logger during very early initialization:
  ```typescript
  import { safeLogger } from 'src/logging';
  safeLogger.info('Startup', 'Plugin initializing');
  ``` 