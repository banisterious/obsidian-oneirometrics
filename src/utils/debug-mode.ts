import { App } from 'obsidian';

/**
 * Utility functions for handling debug mode
 * Uses vault-specific storage when App instance is available
 */

const DEBUG_MODE_KEY = 'oom-debug-mode';

/**
 * Checks if the application is running in debug/development mode
 * 
 * This function checks both the NODE_ENV environment variable
 * and a localStorage flag that can be set for testing.
 * 
 * @param app Optional Obsidian app instance for vault-specific storage
 * @returns {boolean} True if running in debug/development mode
 */
export function isDebugMode(app?: App): boolean {
  // Check for development environment
  const isDevelopmentEnv = process.env.NODE_ENV === 'development';
  
  // Check for debug flag in storage
  let hasDebugFlag = false;
  
  if (app) {
    // Use vault-specific storage when app is available
    hasDebugFlag = app.loadLocalStorage(DEBUG_MODE_KEY) === true;
  } else {
    // Fall back to regular localStorage when app is not available
    hasDebugFlag = typeof window !== 'undefined' && 
                   window.localStorage?.getItem(DEBUG_MODE_KEY) === 'true';
  }
  
  return isDevelopmentEnv || hasDebugFlag;
}

/**
 * Enables debug mode by setting a flag in storage
 * 
 * @param app Optional Obsidian app instance for vault-specific storage
 */
export function enableDebugMode(app?: App): void {
  if (app) {
    // Use vault-specific storage when app is available
    app.saveLocalStorage(DEBUG_MODE_KEY, true);
  } else if (typeof window !== 'undefined' && window.localStorage) {
    // Fall back to regular localStorage when app is not available
    window.localStorage.setItem(DEBUG_MODE_KEY, 'true');
  }
}

/**
 * Disables debug mode by removing the flag from storage
 * 
 * @param app Optional Obsidian app instance for vault-specific storage
 */
export function disableDebugMode(app?: App): void {
  if (app) {
    // Use vault-specific storage when app is available
    app.saveLocalStorage(DEBUG_MODE_KEY, null);
  } else if (typeof window !== 'undefined' && window.localStorage) {
    // Fall back to regular localStorage when app is not available
    window.localStorage.removeItem(DEBUG_MODE_KEY);
  }
} 