/**
 * Logging module exports
 * 
 * This file provides a unified interface for accessing the plugin's logging functionality.
 * It ensures backward compatibility with existing code while providing the new safe logger.
 */

// Export plugin adapter
export { LoggingAdapter } from './LoggingPluginAdapter';

// Export the safe logger for safe access to logging functionality
export type { SafeLogger } from './safe-logger';
export { default as safeLogger, getSafeLogger } from './safe-logger';

// Export a helper function to get the appropriate logger
export function getLogger(context?: any): any {
    // First try to get the global logger from context or window
    if (context && context.globalLogger) {
        return context.globalLogger;
    }
    
    if (typeof window !== 'undefined' && (window as any).globalLogger) {
        return (window as any).globalLogger;
    }
    
    // Fall back to the safe logger
    const { getSafeLogger } = require('./safe-logger');
    return getSafeLogger();
}

// Export safe logging helpers
export const log = (category: string, message: string, data?: any) => 
    getLogger().log(category, message, data);

export const info = (category: string, message: string, data?: any) => 
    getLogger().info(category, message, data);
    
export const debug = (category: string, message: string, data?: any) => 
    getLogger().debug(category, message, data);
    
export const warn = (category: string, message: string, data?: any) => 
    getLogger().warn(category, message, data);
    
export const error = (category: string, message: string, err?: Error) => 
    getLogger().error(category, message, err);
    
export const trace = (category: string, message: string, data?: any) => 
    getLogger().trace(category, message, data); 