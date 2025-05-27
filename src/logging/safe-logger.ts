/**
 * Safe Logger
 * 
 * A simple logger that works without dependencies and won't crash if used before
 * the main logger is initialized. This helps prevent errors during plugin startup.
 */

// Simple interface for logger methods
export interface SafeLogger {
    log(category: string, message: string, data?: any): void;
    info(category: string, message: string, data?: any): void;
    debug(category: string, message: string, data?: any): void;
    warn(category: string, message: string, data?: any): void;
    error(category: string, message: string, error?: Error): void;
    trace(category: string, message: string, data?: any): void;
}

// Create a basic logger that uses console
const consoleLogger: SafeLogger = {
    log: (category, message, data) => console.log(`[${category}] ${message}`, data || ''),
    info: (category, message, data) => console.log(`[INFO:${category}] ${message}`, data || ''),
    debug: (category, message, data) => console.log(`[DEBUG:${category}] ${message}`, data || ''),
    warn: (category, message, data) => console.warn(`[${category}] ${message}`, data || ''),
    error: (category, message, error) => console.error(`[${category}] ${message}`, error || ''),
    trace: (category, message, data) => console.log(`[TRACE:${category}] ${message}`, data || '')
};

// No-op logger for when logging should be disabled
const noopLogger: SafeLogger = {
    log: () => {},
    info: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
    trace: () => {}
};

/**
 * Get a safe logger instance
 * 
 * @param target The target object to check for an existing logger
 * @param useConsole Whether to use console logging as fallback (default: true)
 * @returns A logger instance that won't throw errors
 */
export function getSafeLogger(target?: any, useConsole: boolean = true): SafeLogger {
    // If target has globalLogger, use it
    if (target && target.globalLogger) {
        return target.globalLogger;
    }
    
    // If window has globalLogger, use it
    if (typeof window !== 'undefined' && (window as any).globalLogger) {
        return (window as any).globalLogger;
    }
    
    // Otherwise, return appropriate fallback
    return useConsole ? consoleLogger : noopLogger;
}

// Export a default instance for immediate use
export default getSafeLogger(); 