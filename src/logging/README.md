# OneiroMetrics Logging System

The logging system provides a centralized way to log messages and errors throughout the OneiroMetrics plugin. It includes rich error handling with context enrichment.

## Table of Contents
- [Implementation Details](#implementation-details)
  - [Key Features](#key-features)
  - [File Structure](#file-structure)
  - [Adapter Pattern Implementation](#adapter-pattern-implementation)
- [Usage](#usage)
- [Future Improvements](#future-improvements)
- [Usage Examples](#usage-examples)
  - [Basic Logging](#basic-logging)
  - [Error Handling with Context](#error-handling-with-context)
  - [Error Wrapping](#error-wrapping)
  - [Integration with Plugin](#integration-with-plugin)

## Implementation Details

This module is the first service extracted as part of the 2025 refactoring project. It follows the interface-first approach described in the architecture decisions document.

### Key Features

- Multiple log levels (off, errors, warn, info, debug, trace)
- Component-based logging with categories
- File-based logging with rotation
- Error enrichment with context information
- Error wrapping with stack trace preservation
- Backwards compatibility with the existing logging system

### File Structure

- `LoggingInterfaces.ts`: Contains all interfaces and types for the logging system
- `LoggingService.ts`: Core implementation of the logging service
- `LoggingPluginAdapter.ts`: Adapter that bridges the old and new implementations
- `index.ts`: Public API for the logging module

### Adapter Pattern Implementation

The `LoggingAdapter` class serves as a bridge between the old `Logger` class in `utils/logger.ts` and the new `LoggingService` implementation. It:

1. Implements the same interface as the old logger
2. Delegates calls to both the old and new implementation during the transition
3. Adds new methods (info, debug, trace) that weren't available in the original logger
4. Provides enhanced error handling functionality

## Usage

In the plugin's `main.ts` file, we're now initializing the adapter instead of the old logger:

```typescript
this.logger = new LoggingAdapter(this.app);
const logLevel = this.settings?.logging?.level || 'info';
const maxLogSize = this.settings?.logging?.maxLogSize || 1024 * 1024;
const maxBackups = this.settings?.logging?.maxBackups || 5;
this.logger.configure(logLevel, maxLogSize, maxBackups);
```

The adapter allows us to use both the old and new logging methods:

```typescript
// Old methods still work
this.logger.log('Category', 'Message');
this.logger.error('Category', 'Error message', errorObj);
this.logger.warn('Category', 'Warning message');

// New methods are also available
this.logger.info('Category', 'Info message');
this.logger.debug('Category', 'Debug message');
this.logger.trace('Category', 'Trace message');

// Enhanced error handling
const enrichedError = this.logger.enrichError(error, {
  component: 'MyComponent',
  operation: 'getData',
  metadata: { id: 123 }
});

const wrappedError = this.logger.wrapError(originalError, 'Failed to process data', {
  component: 'MyComponent',
  operation: 'processData',
  metadata: { id: 123 }
});
```

## Future Improvements

- Add structured logging support
- Add log filtering by component
- Implement log streaming to external services
- Add log aggregation and analysis tools

## Usage Examples

### Basic Logging

```typescript
import { App } from 'obsidian';
import { createLogger, LoggerConfig } from 'src/logging';

// Get a logger for your component
function initializeComponent(app: App) {
  const logger = createLogger(app, 'MyComponent');
  
  // Configure the logger if needed
  const config: LoggerConfig = {
    level: 'debug',
    maxLogSize: 2 * 1024 * 1024, // 2MB
    maxBackups: 3
  };
  logger.configure(config);
  
  // Use the logger
  logger.info('MyComponent', 'Component initialized');
  logger.debug('MyComponent', 'Debug details', { setting1: 'value1', setting2: 'value2' });
  
  try {
    // Some operation that might fail
    throw new Error('Operation failed');
  } catch (error) {
    logger.error('MyComponent', 'Failed to initialize component', error);
  }
}
```

### Error Handling with Context

```typescript
import { App } from 'obsidian';
import { createLogger, ErrorContext } from 'src/logging';

function processData(app: App, data: any) {
  const logger = createLogger(app, 'DataProcessor');
  
  try {
    // Some data processing
    if (!data) {
      throw new Error('Invalid data');
    }
    
    // More processing...
  } catch (error) {
    // Enrich the error with context
    const enrichedError = logger.enrichError(error as Error, {
      component: 'DataProcessor',
      operation: 'processData',
      metadata: {
        dataType: typeof data,
        dataSize: data ? JSON.stringify(data).length : 0
      }
    });
    
    // Log the enriched error
    logger.error('DataProcessor', 'Failed to process data', enrichedError);
    
    // Rethrow or handle as needed
    throw enrichedError;
  }
}
```

### Error Wrapping

```typescript
import { App } from 'obsidian';
import { createLogger } from 'src/logging';

async function fetchExternalData(app: App, url: string) {
  const logger = createLogger(app, 'DataFetcher');
  
  try {
    // Attempt to fetch data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Wrap the original error with more context
    const wrappedError = logger.wrapError(error as Error, 
      'Failed to fetch external data', 
      {
        component: 'DataFetcher',
        operation: 'fetchExternalData',
        metadata: { url }
      }
    );
    
    // Log the wrapped error
    logger.error('DataFetcher', 'External data fetch failed', wrappedError);
    
    // Rethrow or handle as needed
    throw wrappedError;
  }
}
```

## Integration with Plugin

To use the logging system in the main plugin, replace the existing logging calls with the new system:

```typescript
// In your main plugin class
import { App, Plugin } from 'obsidian';
import { createLogger, LoggerConfig } from 'src/logging';

export default class MyPlugin extends Plugin {
  private logger: any;
  
  async onload() {
    // Initialize logger
    this.logger = createLogger(this.app, 'MainPlugin');
    
    // Configure from settings
    const config: LoggerConfig = {
      level: this.settings?.logging?.level || 'info',
      maxLogSize: this.settings?.logging?.maxLogSize || 1024 * 1024,
      maxBackups: this.settings?.logging?.maxBackups || 5,
      logFilePath: 'logs/oom-debug-log.txt'
    };
    this.logger.configure(config);
    
    this.logger.info('MainPlugin', 'Plugin loaded');
    
    // ... rest of your plugin initialization
  }
} 